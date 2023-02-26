//EXPLORE MAP
import React, { useState, useEffect } from 'react';

//components
import { FindButtons, SetAsCurrentButton } from 'state/Explore';
import NavHeader from 'components/nav/NavHeader'; //just for mobile
import { useRef } from 'store/Store';
import { GlobalState, store } from 'pages';
import { Bounds } from 'leaflet';
import { useRouter } from 'next/router';
import ExploreButtonsMap from 'components/map/LeafletMap/ExploreButtonsMap';
import List from 'components/list/List';
import { buttonTypes } from 'shared/buttonTypes';
import ReactResizeDetector from 'react-resize-detector';
import { minMobileWidth } from 'shared/sys.helper';

export default function Explore() {
  const selectedNetwork = useRef(
    store,
    (state: GlobalState) => state.networks.selectedNetwork,
  );
  const mapBondsButtons = useRef(
    store,
    (state: GlobalState) => state.explore.mapBondsButtons,
  );

  const router = useRouter();

  let lat = 0;
  let lng = 0;
  let zoom = 2;

  if (selectedNetwork) {
    lat = selectedNetwork.location.coordinates[0];
    lng = selectedNetwork.location.coordinates[1];
    zoom = selectedNetwork.zoom;
  }
  if (router && router.query && router.query.lat) {
    lat = router.query.lat;
    lng = router.query.lng;
    zoom = 13;
  }

  const [showLeftColumn, setShowLeftColumn] = useState(null);
  const [filteredButtons, setFilteredButtons] = useState([]);

  const [buttonFilterTypes, setButtonFilterTypes] = useState(
    buttonTypes.map((buttonType) => buttonType.name),
  );

  const onLeftColumnToggle = (data) => {
    setShowLeftColumn(!showLeftColumn);
  };

  const updateButtons = (bounds: Bounds) => {
    store.emit(new FindButtons(selectedNetwork.id, bounds));
  };
  const updateFiltersType = (type: string, value: boolean) => {
    if (value === true) {
      setButtonFilterTypes([...buttonFilterTypes, type]);
    }
    if (value === false) {
      setButtonFilterTypes((previous) =>
        previous.filter((value, i) => value != type),
      );
    }
  };

  const responsiveShowLeftColumn = (width, height) => {
    if (showLeftColumn !== null ) 
    {
      return showLeftColumn
    }
    if(height < 400)
      return false;
    return true
    
  };

  useEffect(() => {
    if (mapBondsButtons !== null)
      setFilteredButtons(
        mapBondsButtons.filter((button: Button) => {
          return buttonFilterTypes.indexOf(button.type) >= 0;
        }),
      );
  }, [mapBondsButtons, buttonFilterTypes]);

  const onMarkerClick = (buttonId) => {
    store.emit(new SetAsCurrentButton(buttonId));
  };

  return (
    <>
      {/* {({ width, height }) => <div>{`${width}x${height}`}</div>} */}
      {selectedNetwork && (
        <div className="index__container">
          <ReactResizeDetector handleWidth handleHeight>
          {({ width, height }) => 
            <div
              className={
                'index__content-left ' +
                (responsiveShowLeftColumn(width, height) ? '' : 'index__content-left--hide')
              }
            >
              <NavHeader
                showSearch={true}
                updateFiltersType={updateFiltersType}
              />
              <List
                buttons={filteredButtons}
                showLeftColumn={responsiveShowLeftColumn(width, height)}
                onLeftColumnToggle={onLeftColumnToggle}
              />
            </div>
          }
          </ReactResizeDetector>

          <ExploreButtonsMap
            initMapCenter={{
              lat: lat,
              lng: lng,
            }}
            buttons={filteredButtons}
            onBoundsChange={updateButtons}
            onMarkerClick={onMarkerClick}
            defaultZoom={zoom}
          />
        </div>
      )}
    </>
  );
}
