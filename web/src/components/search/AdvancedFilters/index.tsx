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
import { buttonColorStyle } from 'shared/buttonTypes';
import {
  recalculateDensityMap,
  roundCoords,
} from 'shared/honeycomb.utils';
import { GlobalState, store } from 'pages';
import { UpdateFilters, UpdateQueryFoundTags } from 'state/Explore';
import router, { Router } from 'next/router';
import { useRef } from 'store/Store';
import { TagList } from 'elements/Fields/FieldTags';
import { useButtonTypes } from 'shared/buttonTypes';
import FieldMultiSelect from 'elements/Fields/FieldMultiSelect';
import { uniqueArray } from 'shared/sys.helper';
import MultiSelectOption from 'elements/MultiSelectOption';
import { DropDownWhere } from 'elements/Dropdown/DropDownWhere';
import {
  AdvancedFiltersCustomFields,
  applyCustomFieldsFilters,
} from 'components/button/ButtonType/CustomFields/AdvancedFiltersCustomFields';
import { FieldCheckbox } from 'elements/Fields/FieldCheckbox';
import { isPointWithinRadius } from 'geolib';
import { Button } from 'shared/entities/button.entity';
import _ from 'lodash';

export default function AdvancedFilters({
  toggleShowFiltersForm,
  showFiltersForm,
  isHome = false,
  filters,
  isLoggedIn = false,
}) {
  const [buttonTypes, setButtonTypes] = useState([]);
  useButtonTypes(setButtonTypes);

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    register,
    setValue,
    watch,
    reset,
  } = useForm({
    defaultValues: filters,
  });

  const clearFilters = (e) => {
    e.preventDefault();
    reset(defaultFilters);
    store.emit(new UpdateFilters(defaultFilters));

    toggleShowFiltersForm(false);
  };
  const onSubmit = (data) => {
    const newFilters = { ...filters, ...data };
    store.emit(new UpdateFilters(newFilters));

    if (isHome) {
      router.push('/Explore');
    } else {
      toggleShowFiltersForm(false);
    }
  };

  const address = watch('where.address');
  const center = watch('where.center');
  const radius = watch('where.radius');
  const helpButtonTypes = watch('helpButtonTypes');
  const query = watch('query');
  const onlyUserFollowing = watch('onlyUserFollowing');

  const handleSelectedPlace = (place) => {
    setValue('where.address', place.formatted);
    setValue('where.center', [
      place.geometry.lat,
      place.geometry.lng,
    ]);
  };

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
    reset(filters);
  }, [filters]);

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
            {/* <TagList tags={tags} remove={(tag) => {
              setValue('query', query.replace(tag, ''))
              setTags((prevTags) => prevTags.filter((prevTag) => prevTag != tag))
              }}/> */}

            {/* <FieldTags
              label={t('buttonFilters.tagsLabel')}
              explain={t('buttonFilters.tagsExplain')}
              placeholder={t('common.add')}
              validationError={errors.tags}
              setTags={(tags) => {
                setValue('tags', tags)
              }}
              tags={tags}
            /> */}
            <FieldMultiSelect
              label={t('buttonFilters.types')}
              validationError={null}
              explain={t('buttonFilters.typesExplain')}
            >
              {buttonTypes.map((buttonType) => {
                return (
                  <div
                    key={buttonType.name}
                    style={buttonColorStyle(buttonType.cssColor)}
                  >
                    <MultiSelectOption
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
                    </MultiSelectOption>
                  </div>
                );
              })}
            </FieldMultiSelect>

            <DropDownWhere
              placeholder={t('homeinfo.searchlocation')}
              handleSelectedPlace={handleSelectedPlace}
              address={address}
              center={center}
            />

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
                      setValue('where.radius', radiusValue)
                    }
                    defaultValue={radius}
                  />
                </div>
              </div>
            )}
            {isLoggedIn && 
              <FieldCheckbox
                name="onlyUserFollowing"
                checked={onlyUserFollowing}
                text={t('configuration.onlyUserFollowing')}
                onChanged={(value) => {}}
                {...register('onlyUserFollowing')}
              />
            }
            <AdvancedFiltersCustomFields
              buttonTypes={buttonTypes}
              register={register}
            />

            <div
              className={
                isHome ? 'filters__actions--home' : 'filters__actions'
              }
            >
              <Btn
                btnType={BtnType.link}
                caption={t('common.reset')}
                contentAlignment={ContentAlignment.center}
                onClick={clearFilters}
              />

              <Btn
                submit={true}
                btnType={BtnType.submit}
                caption={t('common.search')}
                contentAlignment={ContentAlignment.center}
              />
            </div>
          </Form>
        </div>
      )}
    </>
  );
}

export const applyFilters = ({
  filters,
  cachedHexagons,
  tags,
  setTags,
  buttonTypes,
  usersFollowing,
}) => {
  const applyButtonTypesFilter = (button, buttonTypes) => {
    if (buttonTypes.length == 0) {
      return true;
    }
    if (buttonTypes.length > 0) {
      return buttonTypes.indexOf(button.type) > -1;
    }
    return false;
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

  const applyTagFilters = (button: Button, tags: string[]) => {
    if (tags.length == 0) {
      return true;
    }
    if (tags.length > 0) {
      const tagsFound = _.intersection(tags, button.tags);
      if (tagsFound.length > 0) {
        return true;
      }
    }
    return false;
  };

  const applyUsersFollowing = (button: Button, usersFollowing) => {
    if (usersFollowing.length > 0) {
      const usersIdFollowing = usersFollowing.map((user) => user.id)
      console.log(usersIdFollowing)
      console.log(button.owner.id)
      if (usersIdFollowing.indexOf(button.owner.id) > -1) {
        return true;
      }
    }
    return false;
  };
  const findMoreTags = (button: Button, queryTags) => {
    const tagsFound = _.intersection(queryTags, button.tags);
    if (tagsFound.length > 0) {
      setTags((prevTags) => _.union(prevTags, tagsFound));
    }
  };

  let queryTags = filters.query
    .split(' ')
    .filter((value) => value.length > 0);

  const res = cachedHexagons.reduce(
    ({ filteredButtons, filteredHexagons }, hexagonCached) => {
      const moreButtons = hexagonCached.buttons.filter(
        (button: Button) => {
          if (
            filters.onlyUserFollowing &&
            !applyUsersFollowing(button, usersFollowing)
          ) {
            return false;
          }
          if (
            !applyButtonTypesFilter(button, filters.helpButtonTypes)
          ) {
            return false;
          }

          findMoreTags(button, queryTags);
          if (!applyTagFilters(button, tags)) {
            return false;
          }

          // remove tags from query string, so it won't fail to search string
          let query = filters.query;
          tags.forEach((tag) => (query = query.replace(tag, '')));
          if (!applyQueryFilter(button, query)) {
            return false;
          }
          if (!applyWhereFilter(button, filters.where)) {
            return false;
          }

          if (
            !applyCustomFieldsFilters(button, filters, buttonTypes)
          ) {
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
