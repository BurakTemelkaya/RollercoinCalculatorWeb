import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

export default function AboutPage() {
  const { lang } = useParams<{ lang: string }>();
  const { t } = useTranslation();

  return (
    <div className="static-page-container">
      <Helmet>
        <title>{t('pages.about.title')} | {t('app.title')}</title>
        <meta name="description" content={t('seo.description')} />
        <link rel="canonical" href={`https://rollercoincalculator.app/${lang}/about`} />
      </Helmet>

      <div className="static-back-link">
        <Link to={`/${lang}`}>← {t('event.backToCalc')}</Link>
      </div>

      <article className="static-content">
        <h1>{t('pages.about.title')}</h1>

        <p>{t('pages.about.p1')}</p>

        <h2>{t('pages.about.features')}</h2>
        <ul>
          <li>{t('pages.about.f1')}</li>
          <li>{t('pages.about.f2')}</li>
          <li>{t('pages.about.f3')}</li>
          <li>{t('pages.about.f4')}</li>
        </ul>

        <p className="static-note">
          {t('pages.about.note')}
        </p>

        <h2>{t('nav.support')}</h2>
        <p>
          {t('pages.support.p1')}
        </p>
      </article>
    </div>
  );
}
