import { NavLink, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './HamsterSetsPage.css';

export default function HamsterSectionNav() {
  const { lang } = useParams();
  const { t } = useTranslation();
  const root = `/${lang || 'en'}/hamsters`;
  return <nav className="hamster-section-nav" aria-label={t('hamsterHub.navigation')}>
    <NavLink to={root} end><span className="hamster-section-icon icon-hamsters" aria-hidden="true" />{t('hamsters.title')}</NavLink>
    <NavLink to={`${root}/expeditions`}><span className="hamster-section-icon icon-expeditions" aria-hidden="true" />{t('hamsterHub.expeditions')}</NavLink>
    <NavLink to={`${root}/sets`}><span className="hamster-section-icon icon-sets" aria-hidden="true" />{t('hamsterHub.sets')}</NavLink>
  </nav>;
}
