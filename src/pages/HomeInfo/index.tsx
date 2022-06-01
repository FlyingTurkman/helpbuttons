//INFO AND RESULTS
//libraries
import Router from "next/router";
import { useState, useEffect } from "react";

//services
import { localStorageService } from "services/LocalStorage";
import { alertService } from "services/Alert";
import { store } from "pages/index";
import { useRef } from "store/Store";

//components
import Btn, { ContentAlignment, BtnType, IconType } from "elements/Btn";
import { Link } from "elements/Link";

import { Subject } from "rxjs";
import { setSelectedNetwork, setValueAndDebounce } from "./data";
import {
  DropdownAutoComplete,
  DropDownAutoCompleteOption,
} from "elements/DropDownAutoComplete";

export default function HomeInfo() {
  // const [networks, setNetworks] = useState(useRef(store, (state) => state.commonData.networks));
  const networks = useRef(store, (state) => state.commonData.networks);
  const [selectedNetworkId, setSelectedNetworkId] = useState(
    useRef(store, (state) => {
      return localStorageService.read("network_id");
    })
  );

  useEffect(() => {
    if (localStorageService.read("network_id") == null) {
      alertService.info("It looks like youre new ! First, create your network");
      Router.push({ pathname: "/NetworkNew" });
    }

    alertService.info(
      "You're in the " + localStorageService.read("network_id") + " network !"
    );
  }, []);

  return (
    <>
      <div className="info-overlay__container">
        <div className="info-overlay__content">
          <div className="info-overlay__name"></div>

          <div className="info-overlay__description"></div>

          <div className="info-overlay__image">
            <form className="info-overlay__location">
              <label className="form__label label">Where do you start?</label>

              <input
                type="text"
                className="form__input"
                placeholder="Search Location"
              ></input>
            </form>
          </div>

          <div className="info-overlay__bottom">
            <div className="info-overlay__nets">
              <DropdownNetworks />
              <Link href="/NetworkNew">
                <Btn
                  btnType={BtnType.corporative}
                  contentAlignment={ContentAlignment.center}
                  caption="Create Network"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function DropdownNetworks() {
  const timeInMsBetweenStrokes = 200; //ms

  const [options, setOptions] = useState([]);

  const [sub, setSub] = useState(new Subject()); //evita la inicializaacion en cada renderizado
  const [sub$, setSub$] = useState(
    setValueAndDebounce(sub, timeInMsBetweenStrokes)
  ); //para no sobrecargar el componente ,lo delegamos a una lib externa(solid);

  const onChange = (inputText) => {
    sub.next(inputText);
  };

  useEffect(() => {
    let s = sub$.subscribe(
      (rs: any) => {
        setOptions(
          rs.response.map((net) => {
            return (
              <DropDownAutoCompleteOption
                key={net.id}
                label={net.name}
                value={net.id}
              />
            );
          })
        );
      },
      (e) => {
        console.log("error subscribe", e);
      }
    );
    return () => {
      s.unsubscribe(); //limpiamos
    };
  }, []); //first time

  const setValue = (networkId, networkName) => {
    setSelectedNetwork(networkId);
    alertService.info(
      "You're using the network '" + networkName + "' network !"
    );
  };
  return (
    <>
      <DropdownAutoComplete
        setValue={setValue}
        onChange={onChange}
        options={options}
        placeholder="Search other Network"
      ></DropdownAutoComplete>
    </>
  );
}
