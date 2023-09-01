//Profile Card with the the info displayed by the user in Profile page. It shows different options depending if it's other user profile or your profile when logged.
import {  IoHandLeftOutline } from "react-icons/io5";
import { Link } from 'elements/Link';
import Btn, {ContentAlignment, BtnType, IconType} from 'elements/Btn'

import UserAvatar from '../components';
import { getHostname } from 'shared/sys.helper';
import t from 'i18n';


export default function CardProfile(props) {

  const user = props.user;

  return (
    <>
        <div className="card-profile__container-avatar-content">

            <figure className="card-profile__avatar-container avatar">

              <div className="avatar-big">
                <UserAvatar user={user}/>

                {/* <ImageWrapper imageType={ImageType.avatar} src={user.avatar} alt="avatar"/> */}

              </div>

            </figure>

            <div className="card-profile__content">
            
              <div className="card-profile__avatar-container-name">

                <p className="card-profile__name">{user.name}</p>
                <span className="card-profile__username">{ user.username }@{getHostname()}</span>
                
              </div>

              {/* {t('user.created_date')}: {readableTimeLeftToDate(user.created_at)} */}
    
              {/* <figure className="card-profile__rating grid-three">

                <div className="paragraph grid-three__column">
                  90
                  <div className="btn-circle__icon">
                    <IoHeartOutline />
                  </div>
                </div>
                <div className="paragraph grid-three__column">
                  77
                  <div className="btn-circle__icon">
                    <IoPersonOutline />
                  </div>
                </div>
                <div className="paragraph grid-three__column">
                  23
                  <div className="btn-circle__icon">
                    <IoRibbonOutline />
                  </div>

                </div>

              </figure> */}

            </div>

        </div>

        <div className="card-profile__data">

            <div className="card-profile__tags grid-one__column-mid-element">
              {/* <div className="hashtag">{t('user.tags')}</div> */}
            </div>
            <div className="card-profile__description grid-one__column-mid-element">
               {user.description}
            </div>

            {/* <div className="card-profile__phone grid-one__column-mid-element">
              TODO: 
              - place

            </div> */}

        </div>
    </>
  );
}


export function LinkAdminButton({adminButtonId}) {
  return (
    <div>
      <Link href={`/ButtonFile/${adminButtonId}`}>
        <Btn
          iconLeft={IconType.svg}
          iconLink={<IoHandLeftOutline />}
          caption={t('configuration.contactAdmin')}
        />
      </Link>
    </div>
  );
}