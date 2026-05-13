import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import tr from './locales/tr.json';
import en from './locales/en.json';
import zh from './locales/zh.json';
import fr from './locales/fr.json';
import id from './locales/id.json';
import pt from './locales/pt.json';
import ru from './locales/ru.json';
import es from './locales/es.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        showSupportNotice: false,
        resources: {
            en: { translation: en },
            tr: { translation: tr },
            zh: { translation: zh },
            fr: { translation: fr },
            id: { translation: id },
            pt: { translation: pt },
            ru: { translation: ru },
            es: { translation: es },
        },
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        },
        detection: {
            // Priority: URL path first, then localStorage, then defaults
            order: ['path', 'localStorage', 'navigator', 'htmlTag'],
            caches: ['localStorage'],
        },
    });

export default i18n;
