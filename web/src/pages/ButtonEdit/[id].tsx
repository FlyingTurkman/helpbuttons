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
  } = useForm();

  const [button, setButton] = useState<Button>(null);

  const onSubmit = (data) => {
    store.emit(
      new UpdateButton(id,
        {
          title: data.title,
          type: data.type,
          tags: data.tags,
          description: data.description,
          latitudfe: data.latitude,
          longitude: data.longitude,
          image: data.image,
          address: data.address
        },
        onSuccess({lat: data.latitude, lng: data.longitude}),
        onError,
      ),
    );
  };

  const onSuccess = (location: {lat: number, lng: number}) => {
    router.push({
      pathname: '/Explore',
      query: location,
    });
  };

  const onError = (errorMessage) => alertService.error(errorMessage)

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
            alertService.error(errorMessage);
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
        setValue={setValue}
        isSubmitting={isSubmitting}
        onSubmit={onSubmit}
      ></ButtonForm>
    }
    </>
  );
}
