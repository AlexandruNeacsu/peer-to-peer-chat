import { setTranslations, setLocale, addLocale } from "react-i18nify";

// eslint-disable-next-line import/no-extraneous-dependencies
import localeRo from "date-fns/locale/ro";

import en from "./translations/en-US.json";
import ro from "./translations/ro-RO.json";


export function getLanguageOptions() {
  return [
    { label: "Languages.Romanian", avatar: "flags/ro.svg", locale: "ro" },
    { label: "Languages.English", avatar: "flags/uk.svg", locale: "en" },
  ];
}


export default function initializeI18n() {
  addLocale(localeRo);

  setTranslations({ en, ro });
  setLocale("ro");
}
