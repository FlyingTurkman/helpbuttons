import ButtonForm from "components/button/ButtonForm";
import { GlobalState, store } from 'pages';
import { CreateButton, SaveButtonDraft } from 'state/Explore';
import { NavigateTo } from 'state/Routes';
import { useRef } from 'store/Store';
import Router from 'next/router';
import { alertService } from 'services/Alert';

export default function ButtonNew() {
  const selectedNetwork = useRef(
    store,
    (state: GlobalState) => state.networks.selectedNetwork,
  );
  
  const onSubmit = (data) => {
    store.emit(
      new CreateButton(data, selectedNetwork.id, onSuccess, onError),
    );
  };

  const onSuccess = () => {
    store.emit(new NavigateTo('/Explore'));
  };

  const onError = (err, data) => {
    if (err == 'unauthorized') {
      store.emit(new SaveButtonDraft(data));
      Router.push({
        pathname: '/Login',
        query: { returnUrl: 'ButtonNew' },
      });
    } else {
      alertService.error('Error on creating button ' + err, {});
    }
  };
  return (
    <>
      <ButtonForm onSubmit={onSubmit}></ButtonForm>
    </>
  );
}
