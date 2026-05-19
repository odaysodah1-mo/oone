import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ar from "./ar";
import en from "./en";

const saved = localStorage.getItem("basmah-lang");
const defaultLang = saved || "en";

i18n.use(initReactI18next).init({
  resources: { ar: { translation: ar }, en: { translation: en } },
  lng: defaultLang,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

document.documentElement.dir = defaultLang === "ar" ? "rtl" : "ltr";
document.documentElement.lang = defaultLang;

export default i18n;
