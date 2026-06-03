import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function FaqPage() {
  const { lang } = useParams<{ lang: string }>();
  const { t } = useTranslation();

  const faqItems = [
    'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9',
    'q10', 'q11', 'q12', 'q13', 'q14', 'q15', 'q16', 'q17', 'q18', 'q19', 'q20', 'q21'
  ];

  // Build Schema.org FAQPage structured data
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map((item) => ({
      "@type": "Question",
      "name": t(`pages.faq.${item}`),
      "acceptedAnswer": {
        "@type": "Answer",
        "text": t(`pages.faq.a${item.slice(1)}`)
      }
    }))
  };

  return (
    <div className="static-page-container">
      <>
        <title>{`${t('pages.faq.title')} | ${t('app.title')}`}</title>
        <meta name="description" content={t('seo.description')} />
        <link rel="canonical" href={`https://rollercoincalculator.app/${lang}/faq`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://rollercoincalculator.app/${lang}/faq`} />
        <meta property="og:image" content="https://rollercoincalculator.app/icon.png" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:image" content="https://rollercoincalculator.app/icon.png" />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </>

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
