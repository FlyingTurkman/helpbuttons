//EXPLORE MAP
import React, { useState, useEffect } from 'react';

//components
import {
  FindButtons,
  UpdateBoundsFilteredButtons,
  UpdateExploreUpdating,
  UpdateFilters,
  UpdateListButtons,
} from 'state/Explore';
import NavHeader from 'components/nav/NavHeader'; //just for mobile
import { useRef, useStore } from 'store/Store';
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
import AdvancedFilters from 'components/search/AdvancedFilters';
import { Button } from 'shared/entities/button.entity';
import { isPointWithinRadius } from 'geolib';

const defaultZoomPlace = 13;

function HoneyComb({ router }) {
  const currentButton = useRef(
    store,
    (state: GlobalState) => state.explore.currentButton,
  );

  const selectedNetwork = useRef(
    store,
    (state: GlobalState) => state.networks.selectedNetwork,
    false,
  );

  const exploreMapState = useStore(
    store,
    (state: GlobalState) => state.explore.map,
    false,
  );


  const [showFiltersForm, toggleShowFiltersForm] = useToggle(false);
  const [showLeftColumn, toggleShowLeftColumn] = useToggle(true);

  const {
    setMapCenter,
    setMapZoom,
    exploreSettings,
    setExploreSettings,
  } = useExploreSettings({
    router,
    selectedNetwork,
    toggleShowFiltersForm,
  });

  const {
    handleBoundsChange,
    setHexagonsToFetch,
    setHexagonClicked,
    hexagonClicked,
    isRedrawingMap,
    h3TypeDensityHexes,
  } = useHexagonMap({
    setExploreSettings,
    toggleShowLeftColumn,
    exploreSettings,
    filters: exploreMapState.filters,
    boundsFilteredButtons: exploreMapState.boundsFilteredButtons,
  });

  useEffect(() => {
    if (
      exploreMapState.filters &&
      exploreMapState.filters.where.center
    ) {
      setExploreSettings((prevExploreSettings) => {
        return {
          ...prevExploreSettings,
          center: exploreMapState.filters.where.center,
        };
      });
    }
  }, [exploreMapState.filters]);

  return (
    <>
      <div className="index__container">
        <>
          <div
            className={
              'index__content-left ' +
              (showLeftColumn ? '' : 'index__content-left--hide')
            }
          >
            <NavHeader
              toggleShowFiltersForm={toggleShowFiltersForm}
              totalNetworkButtonsCount={selectedNetwork.buttonCount}
            />
            <List
              showFiltersForm={showFiltersForm}
              buttons={exploreMapState.listButtons}
              showLeftColumn={showLeftColumn}
              onLeftColumnToggle={toggleShowLeftColumn}
            />
            <AdvancedFilters
              showFiltersForm={showFiltersForm}
              toggleShowFiltersForm={toggleShowFiltersForm}
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
              filters={exploreMapState.filters}
            />
          </LoadabledComponent>
        </>
      </div>
    </>
  );
}

export default withRouter(HoneyComb);

function useExploreSettings({
  router,
  selectedNetwork,
  toggleShowFiltersForm,
}) {
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
  let urlParams = new URLSearchParams();
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
      const showFilters = params.get('showFilters');

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
      if (showFilters == 'true') {
        toggleShowFiltersForm(true);
        params.delete('showFilters');
      }
      urlParams = params;
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
          // ...locaStorageVars,
          ...queryExploreSettings,
          loading: false,
        };
      });
    }
  }, [router, selectedNetwork]);

  useEffect(() => {
    if (!exploreSettings.loading) {
      urlParams.append('zoom', exploreSettings.zoom);
      urlParams.append('lat', exploreSettings.center[0]);
      urlParams.append('lng', exploreSettings.center[1]);

      window.location.replace(`#?${urlParams.toString()}`);
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
  filters,
  boundsFilteredButtons,
}) {
  const [hexagonClicked, setHexagonClicked] = useState(null);
  const debouncedHexagonClicked = useDebounce(hexagonClicked, 70);

  const [hexagonsToFetch, setHexagonsToFetch] = useState({
    resolution: 1,
    hexagons: [],
  });
  const debounceHexagonsToFetch = useDebounce(hexagonsToFetch, 100);
  const [isRedrawingMap, setIsRedrawingMap] = useState(false);

  const [h3TypeDensityHexes, seth3TypeDensityHexes] = useState([]);
  let cachedH3Hexes = React.useRef([]);
  const calculateNonCachedHexagons = (
    debounceHexagonsToFetch,
    cachedH3Hexes,
  ) => {
    return debounceHexagonsToFetch.hexagons.reduce(
      (hexagonsToFetch, hexagon) => {
        const cacheHit = cachedH3Hexes.current.find(
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

  const recalculateCacheH3Hexes = (newDensityMapHexagons) => {
    const uniqueArray = (a) =>
      Array.from(new Set(a.map((o) => JSON.stringify(o)))).map((s) =>
        JSON.parse(s),
      );
    cachedH3Hexes.current = uniqueArray([
      ...cachedH3Hexes.current,
      ...newDensityMapHexagons,
    ]);
  };

  useEffect(() => {
    if (debounceHexagonsToFetch.hexagons.length > 0) {
      store.emit(new UpdateExploreUpdating())
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
              recalculateCacheH3Hexes(newDensityMapHexagons);
              updateDensityMap();
            },
            (error) => {
              console.error(error);
            },
          ),
        );
      } else {
        updateDensityMap();
      }
    }
  }, [debounceHexagonsToFetch]);

  function updateDensityMap() {
    setIsRedrawingMap(() => true);
    seth3TypeDensityHexes(() => []);
    const boundsButtons = cachedH3Hexes.current.filter(
      (cachedHex) => {
        return debounceHexagonsToFetch.hexagons.find(
          (hexagon) => hexagon == cachedHex.hexagon,
        );
      },
    );

    const { filteredButtons, filteredHexagons } = applyFilters(
      filters,
      boundsButtons,
    );
    seth3TypeDensityHexes(() => {
      return filteredHexagons;
    });

    store.emit(new UpdateBoundsFilteredButtons(filteredButtons));
    store.emit(new UpdateListButtons(filteredButtons));

    setIsRedrawingMap(() => false);
  }

  useEffect(() => {
    setHexagonClicked(() => null);
    updateDensityMap();
  }, [filters]);

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

    const applyWhereFilter = (button: Button, where) => {
      if (where.center && where.radius) {
        return isPointWithinRadius(
          { latitude: button.latitude, longitude: button.longitude },
          { latitude: where.center[0], longitude: where.center[1] },
          where.radius * 1000,
        );
      }
      return true;
    };
    const res = cachedHexagons.reduce(
      ({ filteredButtons, filteredHexagons }, hexagonCached) => {
        const moreButtons = hexagonCached.buttons.filter(
          (button: Button) => {
            if (
              !applyButtonTypesFilter(button, filters.helpButtonTypes)
            ) {
              return false;
            }
            if (!applyQueryFilter(button, filters.query)) {
              return false;
            }
            if (!applyWhereFilter(button, filters.where)) {
              return false;
            }
            return true;
          },
        );

        filteredHexagons.push({
          ...hexagonCached,
          buttons: moreButtons,
        });
        return {
          filteredButtons: filteredButtons.concat(moreButtons),
          filteredHexagons: filteredHexagons,
        };
      },
      { filteredButtons: [], filteredHexagons: [] },
    );
    return {
      filteredButtons: res.filteredButtons,
      filteredHexagons: recalculateDensityMap(res.filteredHexagons),
    };
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

      if (
        debouncedHexagonClicked.properties.buttons &&
        debouncedHexagonClicked.properties.buttons.length > 0
      ) {
        store.emit(
          new UpdateListButtons(
            debouncedHexagonClicked.properties.buttons,
          ),
        );
      }
    } else {
      store.emit(new UpdateListButtons(boundsFilteredButtons));
    }
  }, [debouncedHexagonClicked]);

  return {
    handleBoundsChange,
    setHexagonsToFetch,
    setHexagonClicked,
    hexagonClicked,
    isRedrawingMap,
    h3TypeDensityHexes,
  };
}
