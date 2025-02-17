import { getLocale } from 'shared/sys.helper';
import ReactHtmlParser from 'react-html-parser';

export const translations = [
  {
    locale: 'en',
    translations: require('../../public/locales/en/common.json'),
  },
  {
    locale: 'es',
    translations: require('../../public/locales/es/common.json'),
  },
];
export default function t(key: string, args: string[] = [], avoidHtmlParserUse = false) {
  const availableLocales = translations.map(({locale, translations}) => {
    return locale;
  })
  const locale = getLocale(availableLocales);

  let translatedString = getTranslation(locale, key);
  if (translatedString === false || !translatedString) {
    translatedString = getTranslation('en', key)
  }
  if (args && args.length > 0 && translatedString) {
    translatedString = format(translatedString, args)
  }
  if(!translatedString){ // if string not found on translations, show key
    translatedString = key;
  }
  if (avoidHtmlParserUse)
  {
    return translatedString
  }
  return ReactHtmlParser(translatedString);
}

function format(string, args) {
    return string.replace(/{(\d+)}/g, function(match, number) {
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    })
}

function getTranslation(locale, key) {
  let keys = key.split('.');

  const selectedTranslations = translations.find(
    (item) => item.locale == locale,
  );
  if (selectedTranslations)
    if (keys.length > 1) {
      if (selectedTranslations.translations[keys[0]] && selectedTranslations.translations[keys[0]][keys[1]]) {
        return selectedTranslations.translations[keys[0]][keys[1]];
      }
      return false;
    } else if (keys.length > 0) {
      return selectedTranslations.translations[keys[0]];
    }
  return null;
}
