//All the edition posibilities menus and accordion, including neet preferences etc
import NavHeader from '../../components/NavHeader'
import NavBottom from '../../components/NavBottom'
import CardDirectory from '../../components/CardDirectory'
import Accordion from '../../elements/Accordion'

export default function Config() {

  return (

    <>

      <NavHeader />

      <div className="config__content">

        <h2 className="title__h3 config__title">Config</h2>

        <CardDirectory />

        <Accordion>
          <p>Texto molón de mi acorodeón</p>
        </Accordion>

        <Accordion>
          <p>Otro Texto molón de mi acorodeón</p>
        </Accordion>

      </div>

      <NavBottom />

    </>


  );
}
