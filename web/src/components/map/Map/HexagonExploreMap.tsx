import React, { useEffect, useState } from 'react';
import { GeoJson, GeoJsonFeature, Overlay, Point } from 'pigeon-maps';
import { GlobalState, store } from 'pages';
import { useRef } from 'store/Store';
import { updateCurrentButton } from 'state/Explore';
import { HbMap } from '.';
import {
  convertBoundsToGeoJsonHexagons,
  convertH3DensityToFeatures,
  getBoundsHexFeatures,
  getResolution,
} from 'shared/honeycomb.utils';
import _ from 'lodash';
import { buttonColorStyle, buttonTypes } from 'shared/buttonTypes';
import Loading from 'components/loading';

export default function HexagonExploreMap({
  h3TypeDensityHexes,
  currentButton,
  handleBoundsChange,
  exploreSettings,
  setMapCenter,
  setHexagonsToFetch,
  setHexagonClicked,
  hexagonClicked,
  isFetchingHexagons,
}) {
  const [maxButtonsHexagon, setMaxButtonsHexagon] = useState(1);
  const [boundsFeatures, setBoundsFeatures] = useState([]);
  const [centerBounds, setCenterBounds] = useState<Point>(null);
  const [geoJsonFeatures, setGeoJsonFeatures] = useState([]);

  const onBoundsChanged = ({ center, zoom, bounds }) => {
    handleBoundsChange(bounds, center, zoom);

    setCenterBounds(center);
  };

  const handleMapClicked = ({ event, latLng, pixel }) => {
    setMapCenter(latLng);
    store.emit(new updateCurrentButton(null));
  };

  const selectedNetwork = useRef(
    store,
    (state: GlobalState) => state.networks.selectedNetwork,
  );

  useEffect(() => {
    if (exploreSettings.loading) {
      return;
    }

    setHexagonClicked(() => null); // unselect all hexagons

    if (exploreSettings.bounds) {
      if (exploreSettings.zoom > exploreSettings.prevZoom) {
        // TODO: zooming in.. should not fetch from database..
        // this is not affecting the filtered buttons... so it won't update to new resolution.. how do it update resolution?
        // wont update filteredButtons, resolution will change
        // change hexagons to children
        const boundsHexes = convertBoundsToGeoJsonHexagons(
          exploreSettings.bounds,
          getResolution(exploreSettings.zoom),
        );
        setHexagonsToFetch({
          resolution: getResolution(exploreSettings.zoom),
          hexagons: boundsHexes,
        });
      } else if (exploreSettings.zoom < exploreSettings.prevZoom) {
        // zooming out..
        // request more buttons .. useEffect filteredButtons will create new density map!

        // getButtonsForBounds(exploreSettings.bounds)
        // will update filteredButtons, resolution will change
        const boundsHexes = convertBoundsToGeoJsonHexagons(
          exploreSettings.bounds,
          getResolution(exploreSettings.zoom),
        );
        setHexagonsToFetch({
          resolution: getResolution(exploreSettings.zoom),
          hexagons: boundsHexes,
        });
        // TODO: for new hexagons... subtract already cache hexagons
      } else {
        // panning,
        // TODO should only fetch new hexagons.
        // will update filteredButtons, but resolution won't change, where do I draw the hexagons?
        // getButtonsForBounds(exploreSettings.bounds)
        const boundsHexes = convertBoundsToGeoJsonHexagons(
          exploreSettings.bounds,
          getResolution(exploreSettings.zoom),
        );
        setHexagonsToFetch({
          resolution: getResolution(exploreSettings.zoom),
          hexagons: boundsHexes,
        }); // hexagons missing
      }
    }
  }, [exploreSettings]);

  useEffect(() => {
    setGeoJsonFeatures(() => {
      return convertH3DensityToFeatures(h3TypeDensityHexes);
    });
    setMaxButtonsHexagon(() =>
      h3TypeDensityHexes.reduce((accumulator, currentValue) => {
        return Math.max(accumulator, currentValue.count);
      }, maxButtonsHexagon),
    );
  }, [h3TypeDensityHexes]);

  return (
    <>
      <HbMap
        mapCenter={exploreSettings.center}
        mapZoom={exploreSettings.zoom}
        onBoundsChanged={onBoundsChanged}
        handleMapClick={handleMapClicked}
        tileType={exploreSettings.tileType}
      >
        {selectedNetwork && (
          <Overlay anchor={[100, 100]}>
            <div className="search-map__network-title">
              {selectedNetwork.name}
              <div className="search-map__sign">
                made with{' '}
                <a href="https://helpbuttons.org">Helpbuttons</a>
              </div>
            </div>
          </Overlay>
        )}

        <GeoJson>
          {geoJsonFeatures.map((buttonFeature) => (
            <GeoJsonFeature
              onClick={(feature) => {
                setHexagonClicked(() => feature.payload);
              }}
              feature={buttonFeature}
              key={buttonFeature.properties.hex}
              styleCallback={(feature, hover) => {
                if (hover) {
                  return {
                    fill: 'white',
                    strokeWidth: '0.7',
                    stroke: '#18AAD2',
                    r: '20',
                    opacity: 0.7,
                  };
                }
                if (buttonFeature.properties.count < 0) {
                  return {
                    fill: 'red',
                    strokeWidth: '1',
                    stroke: '#18AAD2',
                    r: '20',
                    opacity: 0.2,
                  };
                }
                if (buttonFeature.properties.count < 1) {
                  return {
                    fill: 'transparent',
                    strokeWidth: '1',
                    stroke: '#18AAD2',
                    r: '20',
                    opacity:
                      0.2 +
                      (buttonFeature.properties.count * 50) /
                        (maxButtonsHexagon - maxButtonsHexagon / 4) /
                        100,
                  };
                }
                return {
                  fill: '#18AAD2',
                  strokeWidth: '2',
                  stroke: '#18AAD2',
                  r: '20',
                  opacity:
                    0.2 +
                    (buttonFeature.properties.count * 50) /
                      (maxButtonsHexagon - maxButtonsHexagon / 4) /
                      100,
                };
              }}
            />
          ))}
          {!isFetchingHexagons && hexagonClicked && (
            <GeoJsonFeature
              feature={hexagonClicked}
              key="clicked"
              styleCallback={(feature, hover) => {
                return { fill: 'white' };
              }}
            />
          )}
        </GeoJson>
        {!isFetchingHexagons && hexagonClicked && (
          <Overlay
            anchor={hexagonClicked.properties.center}
            offset={[20, 0]}
            className='pigeon-map__custom-block'
            key={hexagonClicked.properties.hex}
          >
            <div className='pigeon-map__hex-wrap'>
              {hexagonClicked.properties.groupByType.map(
                (hexagonBtnType, idx) => {
                  const btnType = buttonTypes.find((type) => {
                    return type.name == hexagonBtnType.type;
                  });
                  return (
                    <span className="pigeon-map__hex-element"
                      style={{
                        color: btnType.cssColor,
                        fontWeight: 'bold',
                      }}
                    >
                      <div className="pigeon-map__hex-info"
                        key={idx}
                        style={buttonColorStyle(btnType.cssColor)}
                      >
                          <div className="btn-filter__icon pigeon-map__hex-info--icon"></div>
                          <div className="pigeon-map__hex-info--text" >
                            {hexagonClicked.properties.count.toString()}
                          </div>
                      </div>
                    </span>
                  );
                },
              )}
            </div>
          </Overlay>
        )}
        {isFetchingHexagons && (
          <Overlay anchor={centerBounds}>
            <Loading />
          </Overlay>
        )}
      </HbMap>
    </>
  );
}
