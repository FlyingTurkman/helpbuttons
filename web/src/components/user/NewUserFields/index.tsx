import {FieldImageUpload} from 'elements/Fields/FieldImageUpload';
import FieldPassword from 'elements/Fields/FieldPassword';
import FieldText from 'elements/Fields/FieldText';
import t from 'i18n';
import { getHostname } from 'shared/sys.helper';

export default function NewUserFields({
  register,
  errors,
  control,
  setValue,
  watch,
}) {
  return (
    <>
      <FieldText
        name="email"
        label={t('user.email')}
        classNameInput="squared"
        placeholder={t('user.emailPlaceHolder')}
        validationError={errors.email}
        {...register('email', { required: true })}
      ></FieldText>
      <FieldText
        name="username"
        label={`${t('user.username')} ${watch('username')}@${
          getHostname()
        }`}
        classNameInput="squared"
        placeholder={t('user.usernamePlaceHolder')}
        validationError={errors.username}
        {...register('username', { required: true })}
      ></FieldText>
      <FieldPassword
        name="password"
        label={t('user.password')}
        classNameInput="squared"
        placeholder={t('user.passwordPlaceHolder')}
        validationError={errors.password}
        {...register('password', { required: true, minLength: 8 })}
      ></FieldPassword>
      <FieldPassword
        name="password_confirm"
        label={t('user.passwordConfirmation')}
        classNameInput="squared"
        placeholder={t('user.passwordConfirmationPlaceHolder')}
        validationError={errors.password}
        {...register('password_confirm', {
          required: true,
          minLength: 8,
        })}
      ></FieldPassword>
      150x150px
      <FieldImageUpload
        name="avatar"
        label={t('common.choose', ['avatar'])}
        control={control}
        width={150}
        height={150}
        validationError={errors.avatar}
        setValue={setValue}
        {...register('avatar', { required: true })}
      />
    </>
  );
}

export function passwordsMatch(data, setError) {
  if (data.password != data.password_confirm) {
    const passwordsWontMatch = {
      type: 'custom',
      message: t('user.passwordMismatch'),
    };
    setError('password', passwordsWontMatch);
    setError('password_confirm', passwordsWontMatch);
    return false;
  }
  return true;
}
