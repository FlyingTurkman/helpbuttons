import ButtonForm from 'components/button/ButtonForm';
import { GlobalState, store } from 'pages';
import {
  CreateButton,
  FindButton,
  SaveButtonDraft,
  UpdateButton,
} from 'state/Explore';
import { NavigateTo } from 'state/Routes';
import { useRef } from 'store/Store';
import Router from 'next/router';
import { alertService } from 'services/Alert';
import router from 'next/router';
import { Button } from 'shared/entities/button.entity';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { UpdateButtonDto } from 'shared/dtos/button.dto';
import t from 'i18n';

export default function ButtonEdit() {
  const selectedNetwork = useRef(
    store,
    (state: GlobalState) => state.networks.selectedNetwork,
  );

  const id = router.query.id as string;

  const {
    register,
    handleSubmit,
    formState: {
      isDirty,
      dirtyFields,
      touchedFields,
      errors,
      isSubmitting,
    },
    control,
    reset,
    watch,
    setValue,
    getValues,
    setFocus,
  } = useForm();

  const [button, setButton] = useState<Button>(null);

  const onSubmit = (data) => {
    store.emit(
      new UpdateButton(id,
        data,
        onSuccess(id),
        // onSuccess({lat: data.latitude, lng: data.longitude}),
        onError,
      ),
    );
  };

  const onSuccess = (buttonId) => {
    router.push(`/ButtonFile/${buttonId}`);
  };
  // const onSuccess = (location: {lat: number, lng: number}) => {
  //   router.push(`/Explore#?lat=${location.lat}&lng=${location.lng}`);
  // };

  const onError = (errorMessage) => alertService.error(errorMessage.caption)

  useEffect(() => {
    if (id != null) {
      store.emit(
        new FindButton(
          id,
          (buttonFetched) => {
            setButton(buttonFetched);
            reset(buttonFetched);
          },
          (errorMessage) => {
            alertService.error(errorMessage.caption);
          },
        ),
      );
    }
  }, [id]);
  return (
    <>
    {button &&
      <ButtonForm
        watch={watch}
        reset={reset}
        getValues={getValues}
        handleSubmit={handleSubmit}
        register={register}
        errors={errors}
        control={control}
        setFocus={setFocus}
        setValue={setValue}
        isSubmitting={isSubmitting}
        onSubmit={onSubmit}
        title={t('common.editTitle', ['button'])}
      ></ButtonForm>
    }
    </>
  );
}
