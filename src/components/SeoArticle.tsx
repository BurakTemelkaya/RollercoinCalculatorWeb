import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const SeoArticle: React.FC = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';

  return (
    <article className="seo-article-container static-content" style={{ padding: '30px', backgroundColor: 'var(--surface-50)', borderRadius: '12px', marginTop: '40px' }}>
      <h2 style={{ borderBottom: 'none', marginBottom: '15px', color: 'var(--primary-400)' }}>{t('seoArticle.title')}</h2>
      
      <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }} dangerouslySetInnerHTML={{ __html: t('seoArticle.p1') }} />
      <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '10px' }} dangerouslySetInnerHTML={{ __html: t('seoArticle.p2') }} />

      <h3 style={{ marginTop: '25px', fontSize: '18px', color: 'var(--text-primary)' }}>{t('seoArticle.h_why')}</h3>
      <ul style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '10px', paddingLeft: '20px' }}>
        <li dangerouslySetInnerHTML={{ __html: t('seoArticle.li1') }} />
        <li dangerouslySetInnerHTML={{ __html: t('seoArticle.li2') }} />
        <li dangerouslySetInnerHTML={{ __html: t('seoArticle.li3') }} />
        <li dangerouslySetInnerHTML={{ __html: t('seoArticle.li4') }} />
        <li dangerouslySetInnerHTML={{ __html: t('seoArticle.li5') }} />
      </ul>

      <h3 style={{ marginTop: '25px', fontSize: '18px', color: 'var(--text-primary)' }}>{t('seoArticle.h_how')}</h3>
      <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }} dangerouslySetInnerHTML={{ __html: t('seoArticle.p3') }} />
      <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '10px' }} dangerouslySetInnerHTML={{ __html: t('seoArticle.p4') }} />

      <h3 style={{ marginTop: '25px', fontSize: '18px', color: 'var(--text-primary)' }}>{t('seoArticle.h_tools')}</h3>
      <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }} dangerouslySetInnerHTML={{ __html: t('seoArticle.p5') }} />

      <h3 style={{ marginTop: '25px', fontSize: '18px', color: 'var(--text-primary)' }}>{t('seoArticle.h_strategy')}</h3>
      <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }} dangerouslySetInnerHTML={{ __html: t('seoArticle.p6') }} />

      <div style={{ display: 'flex', gap: '15px', marginTop: '25px', flexWrap: 'wrap' }}>
        <Link to={`/${lang}/guides/calculation-logic`} className="btn-primary" style={{ padding: '10px 18px' }}>{t('seoArticle.btn1')}</Link>
        <Link to={`/${lang}/guides/mining-power`} className="btn-secondary" style={{ padding: '10px 18px' }}>{t('seoArticle.btn2')}</Link>
        <Link to={`/${lang}/guides/f2p-strategy`} className="btn-secondary" style={{ padding: '10px 18px' }}>{t('seoArticle.btn3')}</Link>
        <Link to={`/${lang}/faq`} className="btn-secondary" style={{ padding: '10px 18px' }}>{t('seoArticle.btn4')}</Link>
      </div>
    </article>
  );
};

export default SeoArticle;
