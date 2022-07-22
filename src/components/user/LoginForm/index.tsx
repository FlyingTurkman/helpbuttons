//Form component with the main fields for signup in the platform
//imported from libraries
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

//imported internal classes, variables, files or functions
import { store } from 'pages/index';
import { Login } from './data';
import { NavigateTo } from 'pages/Common/data';
import Form from 'elements/Form';
import FieldText from 'elements/Fields/FieldText';
import FieldPassword from 'elements/Fields/FieldPassword';
import Btn, { BtnType, ContentAlignment } from 'elements/Btn';
import { Link } from 'elements/Link';
import { alertService } from 'services/Alert';

export default function LoginForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [ errorMsg, setErrorMsg ] = useState(undefined);

  const onSubmit = (data) => {
    store.emit(new Login(data.email, data.password, onSuccess, onError));
  }

  const onSuccess = () => {
    store.emit(new NavigateTo("/"));
  }

  const onError = (err) => {
    if (err === "login-incorrect") {
      setErrorMsg("User or password not found");
    }
  }

  return (
            <Form onSubmit={handleSubmit(onSubmit)} classNameExtra="login">
              <div className="login__form">
                <div className="form__inputs-wrapper">
                  <FieldText
                    name="email"
                    label="Email"
                    classNameInput="squared"
                    placeholder="email@email.em"
                    validationError={ errors.email }
                    {...register("email", { required: true })}
                  ></FieldText>
                  <FieldPassword 
                    name="password" 
                    label="Password" 
                    classNameInput="squared"
                    placeholder="Type your password"
                    validationError={ errors.password }
                    {...register("password", { required: true })}
                  ></FieldPassword>
                </div>
                { errorMsg && (
                  <div>{ errorMsg }</div>
                )}
                <div className="form__btn-wrapper">
                  <Btn 
                    btnType={BtnType.splitIcon} 
                    caption="ENTER" 
                    contentAlignment={ContentAlignment.center} 
                    isSubmitting={isSubmitting}
                  />
                  <div className="popup__link">
                    <Link href="/Signup">I don&apos;t have an account</Link>
                  </div>
                </div>
              </div>
            </Form>
  );
}
