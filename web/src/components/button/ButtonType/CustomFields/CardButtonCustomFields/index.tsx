import { ShowDate } from 'elements/Fields/FieldDate';
import t from 'i18n';
import { GlobalState, store } from 'pages';
import { formatCurrency } from 'shared/currency.utils';
import { DateTypes, readableDateTime } from 'shared/date.utils';
import { Network } from 'shared/entities/network.entity';
import { useStore } from 'store/Store';

export function CardButtonCustomFields({ customFields, button }) {
  const selectedNetwork: Network = useStore(
    store,
    (state: GlobalState) => state.networks.selectedNetwork,
  );

  const renderFields = () => {
    return customFields.map((fieldProps, key) => {
      const type = fieldProps.type;
      let field = <>{JSON.stringify(fieldProps)}</>;
      if (type == 'price') {
        field = (
          <div className='card-button__price'>
            {formatCurrency(button.price, selectedNetwork.currency)}
          </div>
        );
      }
      if (type == 'event') {
        if (
          button.eventType == DateTypes.ONCE ||
          button.eventType == DateTypes.MULTIPLE
        ) {
          field = (
            <>
              <ShowDate
                eventStart={button.eventStart}
                eventEnd={button.eventEnd}
                eventType={button.eventType}
                title={button.title}
              />
            </>
          );
        }
      }
      return <div key={key}>{field}</div>;
    });
  };
  return <>{selectedNetwork && renderFields()}</>;
}
