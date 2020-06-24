import { setTranslations, setLocale, addLocale } from "react-i18nify";

// eslint-disable-next-line import/no-extraneous-dependencies
import localeRo from "date-fns/locale/ro";
import moment from "moment";

import momentRo from "moment/locale/ro";


import en from "./translations/en-US.json";
import ro from "./translations/ro-RO.json";


export function getLanguageOptions() {
  return [
    { label: "Languages.Romanian", avatar: "flags/ro.svg", locale: "ro" },
    { label: "Languages.English", avatar: "flags/uk.svg", locale: "en" },
  ];
}


export default function initializeI18n() {
  // load translations and locales
  setTranslations({ en, ro });
  addLocale("ro", localeRo);
  moment.locale("ro", momentRo);

  // set translation and locale
  if (localStorage.getItem("language")) {
    const { locale } = JSON.parse(localStorage.getItem("language"));

    setLocale(locale);
    moment.locale(locale);
  } else {
    // moment uses the last loaded locale
    moment.locale("en");
    localStorage.setItem("language", JSON.stringify(getLanguageOptions()[1]));
  }
}
