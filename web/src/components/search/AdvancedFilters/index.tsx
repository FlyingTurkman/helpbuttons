import t from 'i18n';
import React, { useEffect, useState } from 'react';

import Btn, { BtnType, ContentAlignment } from 'elements/Btn';
import DropDownSearchLocation from 'elements/DropDownSearchLocation';
import FieldText from 'elements/Fields/FieldText';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { Bounds } from 'pigeon-maps';
import { ButtonFilters, defaultFilters } from './filters.type';
import { useForm } from 'react-hook-form';
import Form from 'elements/Form';
import { buttonColorStyle, buttonTypes } from 'shared/buttonTypes';
import { roundCoords } from 'shared/honeycomb.utils';
import FieldCheckbox from 'elements/Fields/FieldCheckbox';
import CheckBox, { CheckBoxIcon } from 'elements/Checkbox';
import { GlobalState, store } from 'pages';
import { UpdateFilters } from 'state/Explore';
import router, { Router } from 'next/router';
import { useRef } from 'store/Store';
import FieldTags from 'elements/Fields/FieldTags';

//Mobile filters section that includes not only the filters but some search input fields, maybe needed to make a separate component from the rest of esktop elements
export default function AdvancedFilters({
  toggleShowFiltersForm,
  showFiltersForm,
  isHome = false,
}) {
  const filters = useRef(
    store,
    (state: GlobalState) => state.explore.map.filters,
    false
  );

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    register,
    setValue,
    watch,
    reset,
  } = useForm({
    defaultValues: filters
  });

  const clearFilters = (e) => {
    e.preventDefault();
    reset(defaultFilters)
    store.emit(new UpdateFilters(defaultFilters));

    toggleShowFiltersForm(false);
  };
  const onSubmit = (data) => {
    let newFilters = { ...filters };
    if (data.query) {
      newFilters.query = data.query;
    } else {
      newFilters.query = '';
    }

    newFilters.helpButtonTypes = data.helpButtonTypes;
    newFilters.cleared = false;
    if (data.place) {
      newFilters.where = {
        address: data.place.address,
        center: data.place.center,
        radius: data.place.radius,
      };
    }
    newFilters.tags = data.tags
    store.emit(new UpdateFilters(newFilters));

    if (isHome) {
      router.push('/Explore');
    }else {
      toggleShowFiltersForm(false);
    }
  };

  const address = watch('place.address');
  const center = watch('place.center');
  const radius = watch('place.radius');
  const helpButtonTypes = watch('helpButtonTypes');
  const tags = watch('tags');

  const handleSelectedPlace = (place) => {
    setValue('place.address', place.formatted);
    setValue('place.center', [
      place.geometry.lat,
      place.geometry.lng,
    ]);
  };

  const uniqueArray = (a) =>
    Array.from(new Set(a.map((o) => JSON.stringify(o)))).map((s) =>
      JSON.parse(s),
    );

  const setButtonTypeValue = (name, value) => {
    if (value) {
      setValue(
        'helpButtonTypes',
        uniqueArray([...helpButtonTypes, name]),
      );
      return;
    }
    setValue(
      'helpButtonTypes',
      uniqueArray(
        helpButtonTypes.filter((prevValue) => prevValue != name),
      ),
    );
  };


  useEffect(() => {
    reset(filters)
  }, [filters])
  return (
    <>
      {showFiltersForm && (
        <div className="filters__container">
          <Form
            classNameExtra="filters--vertical"
            onSubmit={handleSubmit(onSubmit)}
          >
            <FieldText
              name="query"
              label={t('buttonFilters.queryLabel')}
              placeholder={t('buttonFilters.queryPlaceHolder')}
              explain={t('buttonFilters.queryExplain')}
              {...register('query')}
            />
            <FieldTags
              label={t('buttonFilters.tagsLabel')}
              explain={t('buttonFilters.tagsExplain')}
              placeholder={t('common.add')}
              validationError={errors.tags}
              setTags={(tags) => {
                setValue('tags', tags)
              }}
              tags={tags}
            />
            <FieldCheckbox
              label={'Button types'}
              validationError={null}
              explain={'Filter results by type'}
            >
              {buttonTypes.map((buttonType) => {
                return (
                  <div
                    key={buttonType.name}
                    style={buttonColorStyle(buttonType.cssColor)}
                  >
                    <CheckBox
                      defaultValue={
                        helpButtonTypes.indexOf(buttonType.name) > -1
                      }
                      name={buttonType.name}
                      handleChange={(name, newValue) => {
                        setButtonTypeValue(name, newValue);
                      }}
                    >
                      <div className="btn-filter__icon"></div>
                      <div className="btn-with-icon__text">
                        {buttonType.caption}
                      </div>
                    </CheckBox>
                  </div>
                );
              })}
            </FieldCheckbox>
            <div className="form__field">
              <label className="form__label">
                {t('buttonFilters.where')}
                {address && center && (
                  <>
                    ({address} - {roundCoords(center).toString()})
                  </>
                )}
              </label>
              <DropDownSearchLocation
                placeholder={t('homeinfo.searchlocation')}
                handleSelectedPlace={handleSelectedPlace}
              />
            </div>

            {center && (
              <div className="form__field">
                <label className="form__label">
                  {t('buttonFilters.distance')} ({radius} km)
                </label>
                <div style={{ padding: '1rem' }}>
                  <Slider
                    min={1}
                    max={300}
                    onChange={(radiusValue) =>
                      setValue('place.radius', radiusValue)
                    }
                    defaultValue={radius}
                  />
                </div>
              </div>
            )}
            <div className="filters__actions">
              <Btn
                btnType={BtnType.link}
                caption="CANCEL"
                contentAlignment={ContentAlignment.center}
                onClick={clearFilters}
              />

              <Btn
                submit={true}
                btnType={BtnType.submit}
                caption="SAVE"
                contentAlignment={ContentAlignment.center}
              />
            </div>
          </Form>
        </div>
      )}
    </>
  );
}
