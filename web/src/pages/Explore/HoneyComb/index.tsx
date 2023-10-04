//EXPLORE MAP
import React, { useState, useEffect } from 'react';

//components
import {
  ExploreMapState,
  FindButtons,
  UpdateBoundsFilteredButtons,
  UpdateCachedHexagons,
  UpdateExploreUpdating,
  UpdateQueryFoundTags,
  UpdateListButtons,
  UpdateExploreSettings,
  ExploreSettings,
  ClearCachedHexagons,
  SetExploreSettingsBoundsLoaded,
} from 'state/Explore';
import NavHeader from 'components/nav/NavHeader'; //just for mobile
import { useRef, useStore } from 'store/Store';
import { GlobalState, store } from 'pages';
import { withRouter } from 'next/router';
import List from 'components/list/List';
import { Point } from 'pigeon-maps';
import { LoadabledComponent } from 'components/loading';
import HexagonExploreMap from 'components/map/Map/HexagonExploreMap';
import {
  calculateDensityMap,
  convertBoundsToGeoJsonHexagons,
  getResolution,
  recalculateDensityMap,
  roundCoord,
} from 'shared/honeycomb.utils';
import _ from 'lodash';
import { useDebounce, useToggle } from 'shared/custom.hooks';
import AdvancedFilters, { applyFilters } from 'components/search/AdvancedFilters';
import { Button } from 'shared/entities/button.entity';
import { isPointWithinRadius } from 'geolib';
import { ShowMobileOnly } from 'elements/SizeOnly';
import { ShowDesktopOnly } from 'elements/SizeOnly';
import { uniqueArray } from 'shared/sys.helper';
import { applyCustomFieldsFilters } from 'components/button/ButtonType/CustomFields/AdvancedFiltersCustomFields';
import { useButtonTypes } from 'shared/buttonTypes';

const defaultZoomPlace = 13;

function HoneyComb({ router }) {
  const currentButton = useStore(
    store,
    (state: GlobalState) => state.explore.currentButton,
  );

  const selectedNetwork = useStore(
    store,
    (state: GlobalState) => state.networks.selectedNetwork,
    false,
  );

  const exploreMapState: ExploreMapState = useStore(
    store,
    (state: GlobalState) => state.explore.map,
    false,
  );

  const exploreSettings: ExploreSettings = useStore(
    store,
    (state: GlobalState) => state.explore.settings,
    false,
  );
  const loggedInUser = useStore(
    store,
    (state: GlobalState) => state.loggedInUser,
    true,
  );
  const [showFiltersForm, toggleShowFiltersForm] = useToggle(false);
  const [showLeftColumn, toggleShowLeftColumn] = useToggle(true);

  const height = showLeftColumn ? 0 : 400;

  useExploreSettings({
    exploreSettings,
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
    toggleShowLeftColumn,
    exploreSettings,
    filters: exploreMapState.filters,
    boundsFilteredButtons: exploreMapState.boundsFilteredButtons,
    cachedHexagons: exploreMapState.cachedHexagons,
    buttonTypes: selectedNetwork.buttonTemplates,
    loggedInUser
  });

  useEffect(() => {
    if (
      exploreMapState.filters &&
      exploreMapState.filters.where.center
    ) {
      store.emit(
        new UpdateExploreSettings({
          center: exploreMapState.filters.where.center,
        }),
      );
    }
  }, [exploreMapState.filters]);

  return (
    <div className="index__explore-container">
      <div
        className={
          'index__content-left ' +
          (showLeftColumn ? '' : 'index__content-left--hide')
        }
      >
        <NavHeader
          hexagonClicked={hexagonClicked}
          toggleShowFiltersForm={toggleShowFiltersForm}
          totalNetworkButtonsCount={selectedNetwork.buttonCount}
        />
        <AdvancedFilters
          showFiltersForm={showFiltersForm}
          toggleShowFiltersForm={toggleShowFiltersForm}
          filters={exploreMapState.filters}
          isLoggedIn={!!loggedInUser}
        />
        <ShowDesktopOnly>
          <List
            showFiltersForm={showFiltersForm}
            buttons={exploreMapState.listButtons}
            showLeftColumn={showLeftColumn}
            onLeftColumnToggle={toggleShowLeftColumn}
          />
        </ShowDesktopOnly>
      </div>
      <LoadabledComponent
        loading={exploreSettings.loading && !selectedNetwork}
      >
        <HexagonExploreMap
          exploreSettings={exploreSettings}
          h3TypeDensityHexes={h3TypeDensityHexes}
          currentButton={currentButton}
          handleBoundsChange={handleBoundsChange}
          setHexagonsToFetch={setHexagonsToFetch}
          setHexagonClicked={setHexagonClicked}
          hexagonClicked={hexagonClicked}
          isRedrawingMap={isRedrawingMap}
          selectedNetwork={selectedNetwork}
        />
      </LoadabledComponent>

      <ShowMobileOnly>
        <div
          className={
            'index__content-bottom ' +
            (showLeftColumn ? '' : 'index__content-bottom--hide')
          }
        >
          <List
            showFiltersForm={showFiltersForm}
            buttons={exploreMapState.listButtons}
            showLeftColumn={showLeftColumn}
            onLeftColumnToggle={toggleShowLeftColumn}
          />
        </div>
      </ShowMobileOnly>
    </div>
  );
}

export default withRouter(HoneyComb);

function useExploreSettings({
  router,
  selectedNetwork,
  toggleShowFiltersForm,
  exploreSettings,
}) {
  let urlParams = new URLSearchParams();
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
      const click = params.get('click');

      if (click !== null) {
        store.emit(
          new UpdateExploreSettings({
            center: selectedNetwork.exploreSettings.center,
            loading: true,
            bounds: null,
          }),
        );
        // missing zoom
        return;
      }

      let newExploreSettings = {};
      if (lat && lng) {
        store.emit(
          new UpdateExploreSettings({
            center: [lat, lng],
          }),
        );
      }

      if (showFilters == 'true') {
        toggleShowFiltersForm(true);
        params.delete('showFilters');
      }
      urlParams = params;
    }
  }, [router]);
  useEffect(() => {
    if (selectedNetwork) {
      store.emit(
        new UpdateExploreSettings({
          ...selectedNetwork.exploreSettings,
        }),
      );
    }
  }, [selectedNetwork]);

  useEffect(() => {
    if (!exploreSettings?.loading) {
      urlParams.append('zoom', exploreSettings.zoom);
      urlParams.append('lat', roundCoord(exploreSettings.center[0]));
      urlParams.append('lng', roundCoord(exploreSettings.center[1]));

      window.location.replace(`#?${urlParams.toString()}`);
    }
  }, [exploreSettings]);
}

// const loaded = false
store.emit(new ClearCachedHexagons());

function useHexagonMap({
  toggleShowLeftColumn,
  exploreSettings,
  filters,
  boundsFilteredButtons,
  cachedHexagons,
  buttonTypes,
  loggedInUser
}) {
  const [hexagonClicked, setHexagonClicked] = useState(null);
  const debouncedHexagonClicked = useDebounce(hexagonClicked, 70);

  const [hexagonsToFetch, setHexagonsToFetch] = useState({
    resolution: 1,
    hexagons: [],
  });
  const [tags, setTags] = useState([]);

  const debounceHexagonsToFetch = useDebounce(hexagonsToFetch, 100);
  const [isRedrawingMap, setIsRedrawingMap] = useState(false);
  const [h3TypeDensityHexes, seth3TypeDensityHexes] = useState([]);
  let cachedH3Hexes = React.useRef(cachedHexagons);
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
    cachedH3Hexes.current = uniqueArray([
      ...cachedH3Hexes.current,
      ...newDensityMapHexagons,
    ]);
    store.emit(new UpdateCachedHexagons(cachedH3Hexes.current));
  };

  useEffect(() => {
    if (debounceHexagonsToFetch.hexagons.length > 0) {
      const hexesToFetch = calculateNonCachedHexagons(
        debounceHexagonsToFetch,
        cachedH3Hexes,
      );
      if (hexesToFetch.length > 0) {
        store.emit(new UpdateExploreUpdating());
        store.emit(
          new FindButtons(
            debounceHexagonsToFetch.resolution,
            hexesToFetch,
            (buttons) => {
              const newDensityMapHexagons = calculateDensityMap(
                buttons,
                debounceHexagonsToFetch.resolution,
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
    store.emit(new UpdateExploreUpdating());
    setIsRedrawingMap(() => true);
    seth3TypeDensityHexes(() => []);
    const boundsButtons = cachedH3Hexes.current.filter(
      (cachedHex) => {
        return debounceHexagonsToFetch.hexagons.find(
          (hexagon) => hexagon == cachedHex.hexagon,
        );
      },
    );
    const usersFollowing = loggedInUser?.following ? loggedInUser.following : []
    const { filteredButtons, filteredHexagons } = applyFilters(
      {filters,
        cachedHexagons: boundsButtons,
      tags,
      setTags,
      buttonTypes,usersFollowing}
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

  const handleBoundsChange = (bounds, center: Point, zoom) => {
    setHexagonClicked(() => null); // unselect all hexagons

    if (bounds) {
      store.emit(
        new UpdateExploreSettings({
          zoom: zoom,
          bounds: bounds,
          loading: true,
          center: center,
        }),
      );

      const boundsHexes = convertBoundsToGeoJsonHexagons(
        bounds,
        getResolution(zoom),
      );
      store.emit(new SetExploreSettingsBoundsLoaded());
      if (boundsHexes.length > 1000) {
        console.error('too many hexes.. canceling..');
        return;
      }
      setHexagonsToFetch({
        resolution: getResolution(zoom),
        hexagons: boundsHexes,
      });
    }
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
