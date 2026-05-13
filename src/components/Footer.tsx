import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  const { t } = useTranslation();
  const location = useLocation();
  const lang = location.pathname.split('/')[1] || 'en';

  return (
    <div className="premium-footer-wrapper">
      <div className="premium-footer">
        <div className="footer-badge">
          {t('app.joinCommunity')}
        </div>

        <div className="social-links-container">
          <a href="https://github.com/BurakTemelkaya/RollercoinCalculatorWeb" target="_blank" rel="noopener noreferrer" className="social-pill github">
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>GITHUB</span>
          </a>
          <a href="https://t.me/rollercointurkiyetr/1" target="_blank" rel="noopener noreferrer" className="social-pill telegram">
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.548.223l.188-2.85 5.18-4.686c.223-.195-.054-.282-.346-.088l-6.4 4.024-2.76-.86c-.6-.185-.615-.595.125-.89l10.81-4.17c.5-.192.936.104.75 1.025z" />
            </svg>
            <span>TELEGRAM</span>
          </a>
          <a href="https://crowdin.com/project/rollercoincalculator" target="_blank" rel="noopener noreferrer" className="social-pill crowdin">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 8 6 6" />
              <path d="m4 14 6-6 2-3" />
              <path d="M2 5h12" />
              <path d="M7 2h1" />
              <path d="m22 22-5-10-5 10" />
              <path d="M14 18h6" />
            </svg>
            <span>TRANSLATE</span>
          </a>
        </div>

        <div className="footer-contact">
          <span className="contact-label">{t('app.contactUs')}:</span>
          <a href="mailto:support@rollercoincalculator.app" className="contact-email">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: 'text-top' }}>
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            support@rollercoincalculator.app
          </a>
        </div>

        <p className="footer-disclaimer">
          {t('app.footerText')}
          <br />
          {t('app.disclaimer')}
        </p>

        <div className="footer-links">
          <Link to={`/${lang}/about`}>{t('pages.about.title')}</Link>
          <span className="separator">·</span>
          <Link to={`/${lang}/privacy`}>{t('pages.privacy.title')}</Link>
        </div>

        <p className="footer-copyright">
          © {new Date().getFullYear()} ROLLERCOIN CALCULATOR
        </p>
      </div>
    </div>
  );
}
