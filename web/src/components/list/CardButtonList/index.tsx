//Card that displays a resume of the button info in tthe List component. Its fieldds can be customizedd according to buttonTemplate.
import ImageWrapper, { ImageType } from "elements/ImageWrapper";
import { IoChevronForwardOutline } from "react-icons/io5";
import { IoChevronBackOutline } from "react-icons/io5";
import { Link } from "elements/Link";
import { CardButtonHeadMedium } from "components/button/CardButton";
import { GlobalState, store } from "pages";
import { useRef } from "store/Store";
import { Button } from "shared/entities/button.entity";



export default function CardButtonList({button}) {

  return (
    <>
    <div className="list__element">
      <div className={`card-button-list card-button-list--${button.type}`}>
        <div className="card-button-list__picture-container">
          <div className="card-button-list__nav">
            <div className="arrow btn-circle__icon">
              <IoChevronBackOutline />
            </div>
            <div className="arrow btn-circle__icon">
              <IoChevronForwardOutline />
            </div>
          </div>
          <ImageWrapper
            imageType={ImageType.cardList}
            src={button.image}
            alt={button.description}
          />
        </div>
        <div className="card-button-list__content">
            <CardButtonHeadMedium button={button}/>
        </div>
      </div>
    </div>
    </>
  );
}
