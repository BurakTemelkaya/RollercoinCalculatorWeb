import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import appLogo from '../assets/logo.png';
import trFlag from '../assets/flags/tr.svg';
import gbFlag from '../assets/flags/gb.svg';

const PrivacyTR: React.FC = () => (
  <article className="static-content">
    <h1>Gizlilik Politikası</h1>
    <p className="static-meta">Son güncelleme: Mart 2026</p>

    <p>
      RollerCoin Hesaplayıcı ("biz", "web sitemiz") olarak gizliliğinize saygı duyuyor ve verilerinizi
      korumayı taahhüt ediyoruz. Bu politika,{' '}
      <strong>rollercoincalculator.app</strong> adresini ziyaret ettiğinizde hangi bilgilerin toplandığını
      ve bunların nasıl kullanıldığını açıklamaktadır.
    </p>

    <h2>1. Topladığımız Kişisel Veriler</h2>
    <p>
      <strong>Kişisel veri toplamıyoruz.</strong>
    </p>
    <p>
      Sitemizde hesap oluşturma, kayıt veya giriş yapma zorunluluğu yoktur. Adınız, e-posta adresiniz,
      telefon numaranız veya benzeri herhangi bir kişisel tanımlayıcı bilginizi istemiyoruz ve saklamıyoruz.
    </p>
    <p>
      API modu kullanıldığında girdiğiniz kullanıcı adı veya hash gücü, hesaplama amacıyla sunucuya
      gönderilebilir; ancak bu veriler <strong>hiçbir veritabanında veya kalıcı depolama alanında
      saklanmaz</strong>.
    </p>

    <h2>2. Otomatik Olarak Toplanan Veriler</h2>
    <p>Sitemizi ziyaret ettiğinizde bazı teknik veriler otomatik olarak toplanabilir:</p>
    <ul>
      <li><strong>IP Adresi</strong> (anonimleştirilerek)</li>
      <li><strong>Tarayıcı türü ve sürümü</strong></li>
      <li><strong>İşletim sistemi</strong></li>
      <li><strong>Ziyaret edilen sayfalar ve ziyaret zamanı</strong></li>
      <li><strong>Referrer URL</strong> (sitemize nereden geldiğiniz)</li>
    </ul>
    <p>
      Bu veriler yalnızca toplu analiz amacıyla kullanılır ve sizi bireysel olarak tanımlamak için
      kullanılmaz.
    </p>

    <h2>3. Çerezler (Cookies)</h2>
    <p>Sitemiz, aşağıdaki üçüncü taraf hizmetler aracılığıyla çerez kullanmaktadır:</p>

    <h3>Google Analytics</h3>
    <p>
      Sitemizin ziyaretçi trafiğini ve kullanım kalıplarını analiz etmek için Google Analytics
      kullanılmaktadır. Google Analytics çerezler aracılığıyla anonim ziyaretçi istatistikleri toplar.
      Bu veriler Google'ın sunucularında saklanır. Google'ın gizlilik politikasına{' '}
      <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
        buradan
      </a>{' '}
      ulaşabilirsiniz.
    </p>

    <h3>A-Ads (Anonymous Ads)</h3>
    <p>
      Sitemizde reklam gösterimini sağlamak amacıyla, gizlilik odaklı kripto reklam ağı olan <strong>A-Ads</strong> kullanılmaktadır.
      A-Ads, kullanıcı profillemesi veya kişisel veri izleme yapmayan anonim bir reklam ağıdır.
      Daha fazla bilgi için{' '}
      <a href="https://a-ads.com/privacy-policy" target="_blank" rel="noopener noreferrer">
        A-Ads gizlilik politikasına
      </a>{' '}
      göz atabilirsiniz.
    </p>
    <p>
      Çerezleri tarayıcı ayarlarınızdan yönetebilir veya devre dışı bırakabilirsiniz. Ancak bu,
      sitenin bazı işlevlerini etkileyebilir.
    </p>

    <h2>4. Yerel Depolama (LocalStorage)</h2>
    <p>
      Hesaplama ayarlarınızı (dil tercihi, blok süreleri vb.) tarayıcınızın yerel depolama alanında
      (localStorage) saklıyoruz. Bu veriler <strong>yalnızca sizin cihazınızda bulunur</strong>; hiçbir
      sunucuya gönderilmez.
    </p>

    <h2>5. Üçüncü Taraf Bağlantılar</h2>
    <p>
      Sitemiz, rollercoin.com ve GitHub gibi üçüncü taraf web sitelerine bağlantılar içerebilir. Bu
      sitelere tıkladığınızda, kendi gizlilik politikaları geçerli olur. Bu harici sitelerin içerik ve
      gizlilik uygulamalarından sorumlu değiliz.
    </p>

    <h2>6. Çocukların Gizliliği</h2>
    <p>
      Sitemiz 13 yaşın altındaki çocuklara yönelik değildir ve bu yaş grubundan bilerek kişisel veri
      toplamıyoruz.
    </p>

    <h2>7. Veri Güvenliği</h2>
    <p>
      Kişisel veri toplamadığımız için, kullanıcıya ait hassas bir veri saklamıyoruz. Hesaplama verileri
      tarayıcı bazlı işlendiğinden, veri ihlali riski son derece düşüktür.
    </p>

    <h2>8. GDPR ve CCPA Hakları</h2>
    <p>
      Avrupa Birliği veya Kaliforniya'dan bu siteyi ziyaret ediyorsanız, ilgili mevzuat kapsamında
      aşağıdaki haklara sahip olabilirsiniz:
    </p>
    <ul>
      <li>Verilerinize erişim hakkı</li>
      <li>Verilerinizin silinmesini talep etme hakkı</li>
      <li>Veri işlemeye itiraz etme hakkı</li>
    </ul>
    <p>
      Topladığımız tek veriler anonim analitik verilerdir. Kişisel veriniz bulunmadığından, silme
      talepleri büyük ölçüde uygulanamaz niteliktedir. Herhangi bir soru için GitHub üzerinden
      iletişime geçebilirsiniz.
    </p>

    <h2>9. Politika Değişiklikleri</h2>
    <p>
      Bu gizlilik politikasını zaman zaman güncelleyebiliriz. Önemli değişikliklerde sayfanın üst
      kısmındaki "Son güncelleme" tarihi revize edilecektir. Siteyi düzenli olarak kullanıyorsanız bu
      sayfayı periyodik olarak kontrol etmenizi öneririz.
    </p>

    <h2>10. İletişim</h2>
    <p>
      Bu proje;{' '}
      <a href="https://buraktemelkaya.com" target="_blank" rel="noopener noreferrer">
        Burak Temelkaya
      </a>{' '}
      tarafından sunulmuştur. Projeye katkıda bulunmak, hata bildirmek veya öneride bulunmak için{' '}
      <a href="https://github.com/BurakTemelkaya/RollercoinCalculatorWeb" target="_blank" rel="noopener noreferrer">
        GitHub sayfasını
      </a>{' '}
      ziyaret edebilirsiniz.
    </p>
  </article>
);

const PrivacyEN: React.FC = () => (
  <article className="static-content">
    <h1>Privacy Policy</h1>
    <p className="static-meta">Last updated: March 2026</p>

    <p>
      RollerCoin Calculator ("we", "our website") respects your privacy and is committed to protecting
      your data. This policy explains what information is collected when you visit{' '}
      <strong>rollercoincalculator.app</strong> and how it is used.
    </p>

    <h2>1. Personal Data We Collect</h2>
    <p>
      <strong>We do not collect personal data.</strong>
    </p>
    <p>
      There is no account creation, registration, or login on this site. We do not request or store your
      name, email address, phone number, or any similar personal identifier.
    </p>
    <p>
      When using API mode, your username or hash power may be sent to the server for calculation
      purposes; however, this data is <strong>never stored in any database or persistent
      storage</strong>.
    </p>

    <h2>2. Automatically Collected Data</h2>
    <p>When you visit our site, some technical data may be collected automatically:</p>
    <ul>
      <li><strong>IP Address</strong> (anonymized)</li>
      <li><strong>Browser type and version</strong></li>
      <li><strong>Operating system</strong></li>
      <li><strong>Pages visited and visit time</strong></li>
      <li><strong>Referrer URL</strong> (where you came from)</li>
    </ul>
    <p>
      This data is used solely for aggregate analytics and is never used to individually identify you.
    </p>

    <h2>3. Cookies</h2>
    <p>Our site uses cookies through the following third-party services:</p>

    <h3>Google Analytics</h3>
    <p>
      We use Google Analytics to analyze visitor traffic and usage patterns. Google Analytics collects
      anonymous visitor statistics via cookies. This data is stored on Google's servers. You can review
      Google's privacy policy{' '}
      <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
        here
      </a>.
    </p>

    <h3>A-Ads (Anonymous Ads)</h3>
    <p>
      We use <strong>A-Ads</strong>, a privacy-first anonymous crypto advertising network, to serve ads
      on the site. A-Ads does not perform user profiling or personal data tracking. Learn more at the{' '}
      <a href="https://a-ads.com/privacy-policy" target="_blank" rel="noopener noreferrer">
        A-Ads privacy policy
      </a>.
    </p>
    <p>
      You can manage or disable cookies through your browser settings. However, this may affect certain
      site functionality.
    </p>

    <h2>4. Local Storage</h2>
    <p>
      We store your calculator preferences (language, block durations, etc.) in your browser's
      localStorage. This data <strong>remains only on your device</strong> and is never sent to any
      server.
    </p>

    <h2>5. Third-Party Links</h2>
    <p>
      Our site may contain links to third-party websites such as rollercoin.com and GitHub. When you
      click those links, their own privacy policies apply. We are not responsible for the content or
      privacy practices of those external sites.
    </p>

    <h2>6. Children's Privacy</h2>
    <p>
      Our site is not directed at children under the age of 13, and we do not knowingly collect personal
      data from this age group.
    </p>

    <h2>7. Data Security</h2>
    <p>
      Because we do not collect personal data, there is no sensitive user data stored on our end. Since
      calculator data is processed in-browser, the risk of a data breach is extremely low.
    </p>

    <h2>8. GDPR and CCPA Rights</h2>
    <p>
      If you are visiting from the European Union or California, you may have the following rights under
      applicable law:
    </p>
    <ul>
      <li>Right to access your data</li>
      <li>Right to request deletion of your data</li>
      <li>Right to object to data processing</li>
    </ul>
    <p>
      The only data we collect is anonymous analytics. Since no personal data is held, deletion requests
      are largely inapplicable. For any questions, you can reach us via GitHub.
    </p>

    <h2>9. Policy Changes</h2>
    <p>
      We may update this privacy policy from time to time. For significant changes, the "Last updated"
      date at the top of this page will be revised. If you use this site regularly, we recommend checking
      this page periodically.
    </p>

    <h2>10. Contact</h2>
    <p>
      This project is presented by{' '}
      <a href="https://buraktemelkaya.com" target="_blank" rel="noopener noreferrer">
        Burak Temelkaya
      </a>.
      {' '}To contribute, report issues, or suggest features, visit the{' '}
      <a href="https://github.com/BurakTemelkaya/RollercoinCalculatorWeb" target="_blank" rel="noopener noreferrer">
        GitHub page
      </a>.
    </p>
  </article>
);

function PrivacyPage() {
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (lang === 'tr' || lang === 'en') {
      if (i18n.language !== lang) i18n.changeLanguage(lang);
      localStorage.setItem('rollercoin_web_language', lang);
    } else {
      navigate('/', { replace: true });
    }
  }, [lang, i18n, navigate]);

  const isTR = lang === 'tr';

  return (
    <div className="app-wrapper">
      <Helmet>
        <title>{isTR ? 'Gizlilik Politikası | RollerCoin Hesaplayıcı' : 'Privacy Policy | RollerCoin Calculator'}</title>
        <meta
          name="description"
          content={
            isTR
              ? 'RollerCoin Hesaplayıcı gizlilik politikası. Kişisel veri toplamıyoruz. GDPR ve CCPA uyumlu.'
              : 'RollerCoin Calculator privacy policy. We do not collect personal data. GDPR and CCPA compliant.'
          }
        />
        <link rel="canonical" href={`https://rollercoincalculator.app/${lang}/privacy`} />
        <meta name="robots" content="index, follow" />
      </Helmet>

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-logo">
            <img src={appLogo} alt="Logo" width="80" height="80" className="app-main-logo" />
          </div>
          <div className="header-title">
            <h1>{isTR ? 'RollerCoin Hesaplayıcı' : 'RollerCoin Calculator'}</h1>
          </div>
          <div className="header-right-group">
            <div className="lang-switcher">
              <button
                className={`lang-btn ${isTR ? 'active' : ''}`}
                onClick={() => navigate(`/tr/privacy`)}
                title="Türkçe"
              >
                <img src={trFlag} alt="TR" className="flag-icon" />
                <span className="lang-text">Türkçe</span>
              </button>
              <button
                className={`lang-btn ${!isTR ? 'active' : ''}`}
                onClick={() => navigate(`/en/privacy`)}
                title="English"
              >
                <img src={gbFlag} alt="EN" className="flag-icon" />
                <span className="lang-text">English</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content static-page">
        <div className="static-back-link">
          <Link to={`/${lang}`}>← {isTR ? 'Hesaplayıcıya Dön' : 'Back to Calculator'}</Link>
        </div>
        {isTR ? <PrivacyTR /> : <PrivacyEN />}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>RollerCoin {isTR ? 'Hesaplayıcı' : 'Calculator'}</p>
        <p className="footer-note">
          <Link to={`/${lang}/about`}>{isTR ? 'Hakkımızda' : 'About Us'}</Link>
          {' · '}
          <Link to={`/${lang}/privacy`}>{isTR ? 'Gizlilik Politikası' : 'Privacy Policy'}</Link>
          {' · '}
          <a href="https://rollercoin.com/game" target="_blank" rel="noopener noreferrer">
            rollercoin.com
          </a>
        </p>
      </footer>
    </div>
  );
}

export default PrivacyPage;
