///Header for popups, with cclose option and optional other elements
import { IoClose } from "react-icons/io5";
import { Link } from 'elements/Link';
import Router from 'next/router';


export default function PopupHeader({children, linkBack = null,linkFwd = null, onCloseClicked = () => {}}) {
  const onCloseClick = () =>
  {
    if(linkFwd){
      Router.push(linkFwd);
    }else{
      onCloseClicked();
    }
  }
  return (

    <>
      <div className="popup__header">
        <header className="popup__header-content">
          <div className="popup__header-left">
            {linkBack &&
              <Link href={linkBack} className="popup__header-button">
                <div className="btn-circle__icon">
                  <IoClose />
                </div>
              </Link>
            }
          </div>
          <div className="popup__header-center">
            <h1 className="popup__header-title">
              {children}
            </h1>
          </div>
          <div className="popup__header-right">
            {(onCloseClicked || linkFwd) &&
              <div onClick={onCloseClick} className="popup__header-button">
                <div className="btn-circle__icon">
                  <IoClose />
                </div>
              </div>
            }
          </div>
        </header>
      </div>

    </>

  );
}
