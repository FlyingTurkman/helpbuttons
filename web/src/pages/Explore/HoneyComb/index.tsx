//EXPLORE MAP
import React, { useState, useEffect } from 'react';

//components
import { FindButtons } from 'state/Explore';
import NavHeader from 'components/nav/NavHeader'; //just for mobile
import { useRef } from 'store/Store';
import { GlobalState, store } from 'pages';
import { withRouter } from 'next/router';
import List from 'components/list/List';
import { Point } from 'pigeon-maps';
import { LoadabledComponent } from 'components/loading';
import {
  LocalStorageVars,
  localStorageService,
} from 'services/LocalStorage';
import HexagonExploreMap from 'components/map/Map/HexagonExploreMap';
import { cellToLatLng } from 'h3-js';
import {
  calculateDensityMap,
  getResolution,
  recalculateDensityMap,
} from 'shared/honeycomb.utils';
import _ from 'lodash';
import {
  BrowseType,
  HbMapTiles,
} from 'components/map/Map/Map.consts';
import { useDebounce, useToggle } from 'shared/custom.hooks';
import { h3SetToFeature } from 'geojson2h3';
import AdvancedFilters from 'components/search/AdvancedFilters';
import {
  ButtonFilters,
  defaultFilters,
} from 'components/search/AdvancedFilters/filters.type';
import { Button } from 'shared/entities/button.entity';

const defaultZoomPlace = 13;

function HoneyComb({ router }) {
  const currentButton = useRef(
    store,
    (state: GlobalState) => state.explore.currentButton,
  );

  const selectedNetwork = useRef(
    store,
    (state: GlobalState) => state.networks.selectedNetwork,
  );

  const [showFiltersForm, toggleShowFiltersForm] = useToggle(false);
  const [showLeftColumn, toggleShowLeftColumn] = useToggle(true);

  const {
    setMapCenter,
    setMapZoom,
    exploreSettings,
    setExploreSettings,
  } = useExploreSettings({ router, selectedNetwork });

  const {
    filters,
    listButtons,
    h3TypeDensityHexes,
    handleBoundsChange,
    setHexagonsToFetch,
    setHexagonClicked,
    hexagonClicked,
    isRedrawingMap,
    setFilters,
  } = useHexagonMap({
    setExploreSettings,
    toggleShowLeftColumn,
    exploreSettings,
  });

  const handleSelectedPlace = (place) => {
    setMapCenter([place.geometry.lat, place.geometry.lng]);
    setMapZoom(defaultZoomPlace);
  };

  return (
    <>
      <>
        <div className="index__container">
          {!showFiltersForm ? (
            <>
              <div
                className={
                  'index__content-left ' +
                  (showLeftColumn ? '' : 'index__content-left--hide')
                }
              >
                <NavHeader
                  showFiltersForm={showFiltersForm}
                  toggleShowFiltersForm={toggleShowFiltersForm}
                  filters={{ ...filters, count: listButtons.length }}
                  exploreSettings={exploreSettings}
                />
                <List
                  buttons={listButtons}
                  showLeftColumn={showLeftColumn}
                  onLeftColumnToggle={toggleShowLeftColumn}
                />
              </div>
              <LoadabledComponent loading={exploreSettings.loading}>
                <HexagonExploreMap
                  exploreSettings={exploreSettings}
                  h3TypeDensityHexes={h3TypeDensityHexes}
                  currentButton={currentButton}
                  handleBoundsChange={handleBoundsChange}
                  setMapCenter={setMapCenter}
                  setHexagonsToFetch={setHexagonsToFetch}
                  setHexagonClicked={setHexagonClicked}
                  hexagonClicked={hexagonClicked}
                  isRedrawingMap={isRedrawingMap}
                />
              </LoadabledComponent>
            </>
          ) : (
            <AdvancedFilters
              toggleShowFiltersForm={toggleShowFiltersForm}
              mapZoom={exploreSettings.zoom}
              mapBounds={exploreSettings.bounds}
              setFilters={(filters) => {
                setFilters(() => {
                  return { ...defaultFilters, ...filters };
                });
              }}
              filters={filters}
            />
          )}
        </div>
      </>
    </>
  );
}

export default withRouter(HoneyComb);

function useExploreSettings({ router, selectedNetwork }) {
  const [exploreSettings, setExploreSettings] = useState(() => {
    return {
      center: [0, 0],
      zoom: 4,
      tileType: HbMapTiles.OSM,
      // radius: 10000,
      bounds: null,
      browseType: BrowseType.PINS,
      honeyCombFeatures: null,
      prevZoom: 0,
      loading: true,
    };
  });

  const setMapCenter = (latLng) => {
    setExploreSettings((prevSettings) => {
      return { ...prevSettings, center: latLng };
    });
  };

  const setMapZoom = (zoom: number) => {
    setExploreSettings((prevSettings) => {
      return { ...prevSettings, zoom };
    });
  };
  let queryExploreSettings = {};

  const getUrlParams = (path) => {
    const findHash = path.indexOf('#');
    if (findHash) {
      let params = new URLSearchParams(
        router.asPath.substr(findHash + 1),
      );
      return params;
    }
    return [];
  };

  useEffect(() => {
    if (router && router.asPath) {
      const params = getUrlParams(router.asPath);

      const lat = parseFloat(params.get('lat'));
      const lng = parseFloat(params.get('lng'));
      const zoom = parseInt(params.get('zoom'));

      if (lat && lng) {
        queryExploreSettings = {
          ...queryExploreSettings,
          center: [lat, lng],
        };
      }
      if (zoom) {
        queryExploreSettings = {
          ...queryExploreSettings,
          zoom: zoom,
        };
      }
    }
    if (selectedNetwork) {
      setExploreSettings((prevSettings) => {
        const localStorageExploreSettings = localStorageService.read(
          LocalStorageVars.EXPLORE_SETTINGS,
        );
        let locaStorageVars = {};
        if (localStorageExploreSettings) {
          locaStorageVars = JSON.parse(localStorageExploreSettings);
        }
        return {
          ...prevSettings,
          ...selectedNetwork.exploreSettings,
          ...locaStorageVars,
          ...queryExploreSettings,
          loading: false,
        };
      });
    }
  }, [router, selectedNetwork]);

  useEffect(() => {
    if (!exploreSettings.loading) {
      window.location.replace(
        `#?zoom=${exploreSettings.zoom}&lat=${exploreSettings.center[0]}&lng=${exploreSettings.center[1]}`,
      );
      localStorageService.save(
        LocalStorageVars.EXPLORE_SETTINGS,
        JSON.stringify(exploreSettings),
      );
    }
  }, [exploreSettings]);

  return {
    setMapCenter,
    setMapZoom,
    exploreSettings,
    setExploreSettings,
  };
}

function useHexagonMap({
  setExploreSettings,
  toggleShowLeftColumn,
  exploreSettings,
}) {
  const [hexagonClicked, setHexagonClicked] = useState(null);
  const debouncedHexagonClicked = useDebounce(hexagonClicked, 70);

  const [hexagonsToFetch, setHexagonsToFetch] = useState({
    resolution: 1,
    hexagons: [],
  });
  const debounceHexagonsToFetch = useDebounce(hexagonsToFetch, 100);
  const [isRedrawingMap, setIsRedrawingMap] = useState(false);
  const [fullMapfilteredButtons, setFullMapFilteredButtons] = useState([])
  const [listButtons, setListButtons] = useState([]);
  const [filters, setFilters] =
    useState<ButtonFilters>(defaultFilters);
  const [densityMapNeedsUpdate, setDensityMapNeedsUpdate] =
    useToggle(true);

  const [h3TypeDensityHexes, seth3TypeDensityHexes] = useState([]);
  const [cachedH3Hexes, setCacheH3Hexes] = useState([]);
  const calculateNonCachedHexagons = (
    debounceHexagonsToFetch,
    cachedH3Hexes,
  ) => {
    return debounceHexagonsToFetch.hexagons.reduce(
      (hexagonsToFetch, hexagon) => {
        const cacheHit = cachedH3Hexes.find(
          (cachedHex) => cachedHex.hexagon == hexagon,
        );
        if (!cacheHit) {
          hexagonsToFetch.push(hexagon);
        }
        return hexagonsToFetch;
      },
      [],
    );
  };

  const recalculateCacheH3Hexes = (
    newDensityMapHexagons,
    previousCachedH3Hexes,
  ) => {
    const uniqueArray = (a) =>
      Array.from(new Set(a.map((o) => JSON.stringify(o)))).map((s) =>
        JSON.parse(s),
      );
    const mergeCache = [
      ...previousCachedH3Hexes,
      ...newDensityMapHexagons,
    ];
    return uniqueArray(mergeCache);
  };

  useEffect(() => {
    setIsRedrawingMap(() => true);

    if (debounceHexagonsToFetch.hexagons.length > 0) {

      const hexesToFetch = calculateNonCachedHexagons(
        debounceHexagonsToFetch,
        cachedH3Hexes,
      );
      if (hexesToFetch.length > 0) {
        store.emit(
          new FindButtons(
            debounceHexagonsToFetch.resolution,
            hexesToFetch,
            (buttons) => {
              const newDensityMapHexagons = calculateDensityMap(
                buttons,
                getResolution(exploreSettings.zoom),
                hexesToFetch,
              );

              setCacheH3Hexes((previousCachedH3Hexes) => {
                return recalculateCacheH3Hexes(
                  newDensityMapHexagons,
                  previousCachedH3Hexes,
                );
              });
              setDensityMapNeedsUpdate(() => true);
            },
            (error) => {
              // setFetchedButtons([]);
              console.log('THERE WAS A HARD CORE ERROR');
              console.error(error);
            },
          ),
        );
      } else {
        setDensityMapNeedsUpdate(() => true); 
      }
    }
  }, [debounceHexagonsToFetch]);

  useEffect(() => {
    const mapHexagons = cachedH3Hexes.filter((cachedHex) => {
      return debounceHexagonsToFetch.hexagons.find((hexagon) => hexagon == cachedHex.hexagon)
    })
    const { filteredButtons, filteredHexagons } = applyFilters(
      filters,
      mapHexagons,
    );
    seth3TypeDensityHexes(() => {
      return filteredHexagons
    });
    setFullMapFilteredButtons(() => filteredButtons) //used for when user unclicks map
    setListButtons(() => filteredButtons);
    setIsRedrawingMap(() => false);
  }, [densityMapNeedsUpdate]);

  const applyFilters = (filters, cachedHexagons) => {
    const applyButtonTypesFilter = (button, buttonTypes) => {
      if (buttonTypes.length > 0) {
        return buttonTypes.indexOf(button.type) > -1;
      }
      return true;
    };

    const applyQueryFilter = (button, query) => {
      if (query && query.length > 0) {
        return (
          button.title.indexOf(query) > -1 ||
          button.description.indexOf(query) > -1
        );
      }
      return true;
    };
    const res = cachedHexagons.reduce(
      ({ filteredButtons, filteredHexagons }, hexagonCached) => {
        hexagonCached.buttons = hexagonCached.buttons.filter(
          (button: Button) => {
            if (
              !applyButtonTypesFilter(button, filters.helpButtonTypes)
            ) {
              return false;
            }
            if (!applyQueryFilter(button, filters.query)) {
              return false;
            }

            return true;
          },
        );

        filteredHexagons.push(hexagonCached);
        return {
          filteredButtons: filteredButtons.concat(
            hexagonCached.buttons,
          ),
          filteredHexagons: filteredHexagons,
        };
      },
      { filteredButtons: [], filteredHexagons: [] },
    );
    return {filteredButtons: res.filteredButtons, filteredHexagons: recalculateDensityMap(res.filteredHexagons)}
  };

  const handleBoundsChange = (bounds, center: Point, zoom) => {
    setExploreSettings((previousExploreSettings) => {
      return {
        ...previousExploreSettings,
        prevZoom: previousExploreSettings.zoom,
        zoom: zoom,
        bounds: bounds,
        center: center,
      };
    });
  };

  useEffect(() => {
    if (debouncedHexagonClicked) {
      toggleShowLeftColumn(true);
      setListButtons(() => {
        if (
          debouncedHexagonClicked.properties.buttons &&
          debouncedHexagonClicked.properties.buttons.length > 0
        ) {
          return debouncedHexagonClicked.properties.buttons;
        }
        return [];
      });
    }else {
      setListButtons(() => fullMapfilteredButtons);
    }
  }, [debouncedHexagonClicked]);

  return {
    filters,
    listButtons,
    h3TypeDensityHexes,
    handleBoundsChange,
    setHexagonsToFetch,
    setHexagonClicked,
    hexagonClicked,
    isRedrawingMap,
    setFilters,
  };
}