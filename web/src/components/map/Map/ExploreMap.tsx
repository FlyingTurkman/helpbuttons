import React from 'react';
import { Map, ZoomControl } from 'pigeon-maps';
import { stamenTerrain } from 'pigeon-maps/providers';
import { Button } from 'shared/entities/button.entity';
import { MarkerButton, MarkerButtonPopup } from './MarkerButton';
import { store } from 'pages';
import { SetAsCurrentButton, updateCurrentButton, updateExploreMapZoom, updateMapCenter } from 'state/Explore';



export default function ExploreMap(
    {
      mapCenter,
      mapZoom,
      filteredButtons,
      currentButton,
      handleBoundsChange,
    }) {

  const onBoundsChanged = ({ center, zoom, bounds, initial }) => {
    handleBoundsChange(bounds);
    store.emit(new updateMapCenter(center))
    store.emit(new updateExploreMapZoom(zoom))
  };

  
  const handleMarkerClicked = (button: Button) => {
    store.emit(new updateMapCenter([button.latitude, button.longitude]))
    store.emit(new updateCurrentButton(button))
  }
  const handleMapClicked = ({ event, latLng, pixel }) => {
    store.emit(new updateMapCenter(latLng))
    store.emit(new updateCurrentButton(null))
  }

  return (
    <>
        {(mapZoom && mapCenter) && 
          <Map
            center={mapCenter}
            defaultZoom={mapZoom}
            provider={stamenTerrain}
            onBoundsChanged={onBoundsChanged}
            zoomSnap={true}
            onClick={handleMapClicked}
          >
            <ZoomControl />
            {filteredButtons.map((button: Button, idx) => (
              <MarkerButton anchor={[button.latitude, button.longitude]} offset={[35, 65]} button={button} handleMarkerClicked={handleMarkerClicked} currentButtonId={currentButton?.id}/>
            ))}

            {currentButton && 
              <MarkerButtonPopup
              anchor={[currentButton.latitude, currentButton.longitude]} offset={[130, 328]} button={currentButton}
            />
            }
            
          </Map>
          }
    </>
  );
}
