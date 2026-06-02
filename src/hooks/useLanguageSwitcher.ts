import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../components/MainLayout';

export function useLanguageSwitcher() {
  const location = useLocation();
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  const changeLanguage = (newLang: string) => {
    const segments = location.pathname.split('/').filter(Boolean);
    if (SUPPORTED_LANGUAGES.some((l) => l.value === segments[0])) {
      segments[0] = newLang;
    } else {
      segments.unshift(newLang);
    }
    const search = location.search;
    navigate(`/${segments.join('/')}${search}`);
  };

  const langFromUrl = location.pathname.split('/').filter(Boolean)[0];
  
  useEffect(() => {
    if (langFromUrl && SUPPORTED_LANGUAGES.some(l => l.value === langFromUrl)) {
      if (i18n.language !== langFromUrl) {
        i18n.changeLanguage(langFromUrl);
        localStorage.setItem('rollercoin_web_language', langFromUrl);
        document.documentElement.lang = langFromUrl;
      }
    }
  }, [langFromUrl, i18n]);

  return { currentLang: i18n.language, changeLanguage, SUPPORTED_LANGUAGES };
}
