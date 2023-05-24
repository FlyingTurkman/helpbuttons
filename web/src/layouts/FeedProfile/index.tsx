//FEED SECTION - HERE COMME ALL THE NOTIFFICATIONS, MESSAGES and CONVERSATION LINKS FROM EXTERNAL RESOURCES
import CardNotification from '../../components/feed/CardNotification'
import t from 'i18n';

export default function FeedProfile({activities}) {
  return (

    <div className="feed-container">
      <div className="feed-line"></div>

      <div className="feed-section">

        {activities && activities.map((activity, key) => {
          return (
          <div className="feed-element" key={key}>
            <CardNotification activity={activity}/>
          </div>)
        })}
        {(!activities || activities.length < 1) && 
          (<div className="feed-element">{t('activities.noactivity', ['activities'])}</div>)
        }
      </div>

    </div>

  );
}
