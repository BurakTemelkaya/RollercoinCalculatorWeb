import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

export default function PrivacyPage() {
  const { lang } = useParams<{ lang: string }>();
  const { t } = useTranslation();

  const sections = ['s1', 's2', 's3', 's4', 's5'];

  return (
    <div className="static-page-container">
      <Helmet>
        <title>{t('pages.privacy.title')} | {t('app.title')}</title>
        <meta name="description" content={t('seo.description')} />
        <link rel="canonical" href={`https://rollercoincalculator.app/${lang}/privacy`} />
      </Helmet>

      <div className="static-back-link">
        <Link to={`/${lang}`}>← {t('event.backToCalc')}</Link>
      </div>

      <article className="static-content">
        <h1>{t('pages.privacy.title')}</h1>
        <p className="static-meta">{t('pages.privacy.lastUpdated')}</p>

        <p>{t('pages.privacy.intro')}</p>

        {sections.map((sec) => (
          <React.Fragment key={sec}>
            <h2>{t(`pages.privacy.${sec}_title`)}</h2>
            <p>{t(`pages.privacy.${sec}_p`)}</p>
          </React.Fragment>
        ))}
      </article>
    </div>
  );
}
