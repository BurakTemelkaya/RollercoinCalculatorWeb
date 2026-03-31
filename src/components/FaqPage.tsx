import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

export default function FaqPage() {
  const { lang } = useParams<{ lang: string }>();
  const { t } = useTranslation();

  const faqItems = ['q1', 'q2', 'q3', 'q4', 'q5'];

  return (
    <div className="static-page-container">
      <Helmet>
        <title>{t('pages.faq.title')} | {t('app.title')}</title>
        <meta name="description" content={t('seo.description')} />
        <link rel="canonical" href={`https://rollercoincalculator.app/${lang}/faq`} />
      </Helmet>

      <div className="static-back-link">
        <Link to={`/${lang}`}>← {t('event.backToCalc')}</Link>
      </div>

      <article className="static-content faq-container">
        <h1>{t('pages.faq.title')}</h1>

        {faqItems.map((item) => (
          <div className="faq-item" key={item}>
            <h2>{t(`pages.faq.${item}`)}</h2>
            <p>{t(`pages.faq.a${item.slice(1)}`)}</p>
          </div>
        ))}
      </article>
    </div>
  );
}
