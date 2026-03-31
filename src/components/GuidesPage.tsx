import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

export default function GuidesPage() {
  const { lang } = useParams<{ lang: string }>();
  const { t } = useTranslation();

  return (
    <div className="static-page-container">
      <Helmet>
        <title>{t('pages.guides.title')} | {t('app.title')}</title>
        <meta name="description" content={t('seo.description')} />
        <link rel="canonical" href={`https://rollercoincalculator.app/${lang}/guides`} />
      </Helmet>

      <div className="static-back-link">
        <Link to={`/${lang}`}>← {t('event.backToCalc')}</Link>
      </div>

      <article className="static-content guides-container">
        <h1>{t('pages.guides.title')}</h1>

        <section className="guide-card">
          <h2>{t('pages.guides.g1_title')}</h2>
          <p>{t('pages.guides.g1_p')}</p>
        </section>

        <section className="guide-card">
          <h2>{t('pages.guides.g2_title')}</h2>
          <p>{t('pages.guides.g2_p')}</p>
        </section>

        <section className="guide-card">
          <h2>{t('pages.guides.g3_title')}</h2>
          <p>{t('pages.guides.g3_p')}</p>
        </section>
      </article>
    </div>
  );
}
