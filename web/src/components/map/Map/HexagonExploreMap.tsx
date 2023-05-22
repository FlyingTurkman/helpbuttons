import React, { useEffect, useState } from 'react';
import { GeoJson, Overlay } from 'pigeon-maps';
import { store } from 'pages';
import { updateCurrentButton } from 'state/Explore';
import { HbMap } from '.';
import {
  convertBoundsToGeoJsonHexagons,
  convertH3DensityToFeatures,
  featuresToGeoJson,
  getBoundsHexFeatures,
  getResolution,
} from 'shared/honeycomb.utils';
import { cellToParent } from 'h3-js';
import _ from 'lodash';
import { useDebounce, useToggle } from 'shared/custom.hooks';

export default function HexagonExploreMap({
  filteredButtons,
  currentButton,
  handleBoundsChange,
  exploreSettings,
  setMapCenter,
  setHexagonsToFetch,
  setHexagonClicked,
  hexagonClicked,
}) {
  const [maxButtonsHexagon, setMaxButtonsHexagon] = useState(1);
  const [resolution, setResolution] = useState(1);
  const [boundsFeatures, setBoundsFeatures] = useState([]);
  const debouncedBoundsFeatures = useDebounce(boundsFeatures, 50);
  const [fetchingNewResolution, toggleFetchingNewResolution] =
    useToggle(false);

  const [h3ButtonsDensityFeatures, setH3ButtonsDensityFeatures] =
    useState([]);
  const onBoundsChanged = ({ center, zoom, bounds }) => {
    handleBoundsChange(bounds, center, zoom);
  };

  let cachedHexes = [];
  const handleMapClicked = ({ event, latLng, pixel }) => {
    setMapCenter(latLng);
    store.emit(new updateCurrentButton(null));
  };

  useEffect(() => {
    if (exploreSettings.loading) {
      return;
    }
    if (getResolution(exploreSettings.zoom) != resolution) {
      setResolution(() => getResolution(exploreSettings.zoom));
    }
    // setHexagonClicked(() => null); // unselect all hexagons

    if (exploreSettings.bounds) {
      setBoundsFeatures(() => {
        return getBoundsHexFeatures(
          exploreSettings.bounds,
          exploreSettings.zoom,
        );
      });
      toggleFetchingNewResolution(true);
      if (exploreSettings.zoom > exploreSettings.prevZoom) {
        // TODO: zooming in.. should not fetch from database..
        // this is not affecting the filtered buttons... so it won't update to new resolution.. how do it update resolution?
        // wont update filteredButtons, resolution will change
        // change hexagons to children
        const boundsHexes = convertBoundsToGeoJsonHexagons(
          exploreSettings.bounds,
          resolution,
        );
        setHexagonsToFetch({ resolution, hexagons: boundsHexes });
      } else if (exploreSettings.zoom < exploreSettings.prevZoom) {
        // zooming out..
        // request more buttons .. useEffect filteredButtons will create new density map!

        // getButtonsForBounds(exploreSettings.bounds)
        // will update filteredButtons, resolution will change
        const boundsHexes = convertBoundsToGeoJsonHexagons(
          exploreSettings.bounds,
          resolution,
        );
        setHexagonsToFetch({ resolution, hexagons: boundsHexes });
        // TODO: for new hexagons... subtract already cache hexagons
      } else {
        // panning,
        // TODO should only fetch new hexagons.
        // will update filteredButtons, but resolution won't change, where do I draw the hexagons?
        // getButtonsForBounds(exploreSettings.bounds)
        const boundsHexes = convertBoundsToGeoJsonHexagons(
          exploreSettings.bounds,
          resolution,
        );
        cachedHexes = _.union(boundsHexes, cachedHexes);
        setHexagonsToFetch({ resolution, hexagons: boundsHexes }); // hexagons missing
      }
    }
  }, [exploreSettings]);

  useEffect(() => {
    setH3ButtonsDensityFeatures(() => {
      if (!exploreSettings.bounds) {
        return [];
      }
      const hexagonsOnResolution = filteredButtons.map((button) =>
        cellToParent(button.hexagon, resolution),
      );
      const densityMap = convertH3DensityToFeatures(
        _.groupBy(hexagonsOnResolution),
      );
      return _.unionBy(
        densityMap,
        debouncedBoundsFeatures,
        'properties.hex',
      );
    });
    toggleFetchingNewResolution(false);
  }, [resolution, filteredButtons]);

  useEffect(() => {
    console.log('resolutionfetching state: ' + fetchingNewResolution);
  }, [fetchingNewResolution]);
  useEffect(() => {
    setMaxButtonsHexagon(() =>
      h3ButtonsDensityFeatures.reduce((accumulator, currentValue) => {
        return Math.max(accumulator, currentValue.properties.count);
      }, maxButtonsHexagon),
    );
  }, [h3ButtonsDensityFeatures]);
  return (
    <>
      <HbMap
        mapCenter={exploreSettings.center}
        mapZoom={exploreSettings.zoom}
        onBoundsChanged={onBoundsChanged}
        handleMapClick={handleMapClicked}
        tileType={exploreSettings.tileType}
      >
        <GeoJson
          style={{
            display: !fetchingNewResolution ? 'block' : 'none',
          }}
          data={featuresToGeoJson(h3ButtonsDensityFeatures)}
          styleCallback={(feature, hover) => {
            if (
              feature.properties.hex == hexagonClicked &&
              feature.properties.count > 0
            ) {
              return {
                fill: 'red',
                strokeWidth: '0.3',
                stroke: 'red',
                r: '20',
                opacity: 1,
              };
            }
            if (hover && !fetchingNewResolution) {
              return {
                fill: '#ffdd02e0',
                strokeWidth: '1.5',
                stroke: 'black',
                r: '20',
              };
            }
            return {
              fill: '#ffdd02e0',
              strokeWidth: '1',
              stroke: 'grey',
              r: '20',
              opacity:
                (feature.properties.count * 100) /
                (maxButtonsHexagon - maxButtonsHexagon / 4) /
                100,
            };
          }}
          onClick={(clicked) => {
            const { event, anchor, payload } = clicked;
            setHexagonClicked(() => payload.properties.hex);
          }}
        />
        {h3ButtonsDensityFeatures.map((feature) => {
          if (feature.properties.count > 0)
            return (
              <Overlay
                style={{
                  display: !fetchingNewResolution ? 'block' : 'none',
                }}
                anchor={feature.properties.center}
                key={feature.properties.hex}
              >
                {feature.properties.count.toString()}
              </Overlay>
            );
        })}
      </HbMap>
    </>
  );
}
