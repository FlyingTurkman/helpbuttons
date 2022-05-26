import React, { useState } from 'react';
import Popup from 'components/popup/Popup';
import { INetwork } from 'services/Networks/network.type';
import { CreateNetworkEvent } from './data';
import { store } from 'pages/index';
import FieldText from 'elements/Fields/FieldText';
import Form from 'elements/Form';
import { useForm } from 'react-hook-form';
import FieldLocation from 'elements/Fields/FieldLocation';
import FieldCheckbox from 'elements/Fields/FieldCheckbox';


export default function NetworkNew() {
  const token = window.localStorage.getItem('access_token');
    const fields = {
      name: "",
      avatar: "",
      url: "",
      privacy: false,
      description: "",
      latitude: "",
      longitude: "",
      radius: ""
    };
    const [values, setValues] = useState(fields);
    const [validationErrors, setValidationErrors] = useState(fields);

    const {formState: { isSubmitting }} = useForm()
    
    const setValue = (name, value) => {
      setValues({ ...values, [name]: value });
    }

    const handleSubmit = (event) => {
      event.preventDefault();
      console.log(values);
      store.emit(new CreateNetworkEvent(values, token, setValidationErrors));
    };

    return (

        <>
            <Popup title="Create Network" linkFwd="/HomeInfo">
            {JSON.stringify(validationErrors)}

              <Form onSubmit={handleSubmit}>
                
                <FieldText handleChange={setValue} value={values.name} name="name" label="Name" validationError={validationErrors.name}></FieldText>

                TODO: AVATAR
                <FieldText handleChange={setValue} value={values.url} name="url" label="Url" validationError={validationErrors.url}>
                </FieldText>

                <FieldCheckbox label="Privacy" value={values.privacy} handleChange={setValue} name="privacy" validationError={validationErrors.privacy}>
                  privacy checkbox
                </FieldCheckbox>
                
                <FieldText handleChange={setValue} value={values.description} name="description" label="Description" validationError={validationErrors.description}>
                </FieldText>

                <FieldLocation>
                latitude

                longitude

                radius
                </FieldLocation>

                <div className="popup__options-v">

                    <button type="submit" disabled={isSubmitting}  className="popup__options-btn btn-menu-white">

                      {isSubmitting && <span className=""></span>}
                        Create Network
                    </button>

                </div>


              </Form>

            </Popup>



        </>
    );

}
