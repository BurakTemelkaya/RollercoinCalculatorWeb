
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

const PrivacyPageTR = () => {
  const { lang } = useParams<{ lang: string }>();
  const { t } = useTranslation();
  return (
    <div className="static-page-container">
      <Helmet>
        <title>Gizlilik Politikası - RollerCoin Kazanç Hesaplayıcı</title>
        <meta name="description" content="rollercoincalculator.app veritabanı tutmaz. Sadece Analytics ve Google AdSense standart çerezlerini kullanır. Verileriniz güvendedir." />
        <link rel="canonical" href={`https://rollercoincalculator.app/${lang}/privacy`} />
      </Helmet>

      <div className="static-back-link">
        <Link to={`/${lang}`}>← {t('event.backToCalc')}</Link>
      </div>

      <article className="static-content">
        <h1>Gizlilik Politikası (Privacy Policy)</h1>
        <p className="static-meta">Son Güncelleme: Mayıs 2026</p>

        <p><strong>RollerCoin Kazanç Hesaplayıcı</strong> (rollercoincalculator.app) olarak önceliğimiz, şeffaflık ve kullanıcı gizliliğinin korunmasıdır. Araçlarımızı kullanırken verilerinizin nasıl (veya nasıl işlenmediği) hakkında tam bir açıklığa sahip olmanız gerektiğine inanıyoruz.</p>

        <h2>1. Veri Toplama ve Veritabanı Politikası</h2>
        <p>Platformumuz <strong>herhangi bir veritabanına sahip değildir.</strong> Forma girdiğiniz hash gücü, hedef coin oranları, hesaplama süresi gibi veriler hiçbir sunucuda kaydedilmez, depolanmaz ve işlenmez. Tüm hesaplamalar tamamen sizin kullandığınız internet tarayıcınızın belleğinde (işlemci üzerinde) anlık olarak "Client-Side" çalışır. Oyuncu güvenliği açısından bu, en yüksek standarttır.</p>

        <h2>2. Çerezler (Cookies) ve Yerel Depolama (Local Storage)</h2>
        <p>Sistemin her girdiğinizde verilerinizi sıfırlamaması için tarayıcınızın <strong>LocalStorage</strong> (Yerel Depolama) özelliğini kullanırız. Önceki girişleriniz (hangi ligde olduğunuz, seçtiğiniz dil vb.) sadece kendi cihazınızda şifrelenmeden tutulur. Bizim sunucularımıza gönderilmez.</p>

        <h2>3. Google Analytics ve İstatistik Verileri</h2>
        <p>Sitemizin geliştirilmesi, hangi bölümlerin daha çok okunduğunun tespiti ve performans raporlamaları amacıyla standart olarak <strong>Google Analytics</strong> kullanmaktayız. Bu araçlar; site içi kalma süresi, sayfa ziyaret oranları, kaba coğrafi konum bilgisi (ülke/şehir bazlı) gibi tamamen "anonim" hale getirilmiş standart metrikleri ölçümler. Kimlik tespiti yapılmaz.</p>

        <h2>4. Reklam Ağları (Google AdSense)</h2>
        <p>Sunucu giderlerimizi karşılayabilmek adına <strong>Google AdSense</strong> gibi üçüncü taraf reklam ve yayıncı ağları entegre edilmiştir. Reklam partnerlerimiz, size kişiselleştirilmiş reklamlar sunabilmek amacıyla veya tarayıcı gezintilerinize dayanan standart çerezleri (cookies) ve web işaretçilerini (web beacons) kullanabilirler. Bu çerez yönetimi tamamen bizim dışımızda, ilgili kurumların global gizlilik anlaşmaları uyarınca idare edilir.</p>
        <p style={{ marginTop: '12px' }}><strong>Üçüncü taraf reklam sunucuları veya reklam ağları,</strong> tarayıcınıza doğrudan reklam gönderdiğinde, otomatik olarak IP adresinizi alırlar. Reklamların etkinliğini ölçmek ve/veya size gösterilen reklam içeriğini kişiselleştirmek için çerezler, JavaScript veya Web Beacon'lar gibi diğer teknolojileri de kullanabilirler.</p>
        <p style={{ marginTop: '12px' }}><strong>Kişiselleştirilmiş reklamları devre dışı bırakmak için</strong> <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-400)' }}>Google Reklam Ayarları</a> sayfasını ziyaret edebilirsiniz. Ayrıca <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-400)' }}>DAA opt-out</a> sayfasından diğer reklam ağlarının çerezlerini de yönetebilirsiniz.</p>
        <p style={{ marginTop: '12px' }}>Google'ın gizlilik uygulamaları hakkında daha fazla bilgi almak için <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-400)' }}>Google Gizlilik Politikası</a>'nı inceleyebilirsiniz.</p>

        <h2>5. Dış Bağlantılar Sorumluluğu</h2>
        <p>Rehberlerimiz içinde veya reklam modüllerinde yer alan harici sitelere yönlendirilen bağlantılardan doğacak riskler tamamen kullanıcının kendi sorumluluğundadır. Söz konusu dış sitelerin gizlilik uygulamaları veya içeriklerinden tarafımız sorumlu tutulamaz.</p>

        <h2>6. Değişiklikler</h2>
        <p>Bu Gizlilik Politikasını herhangi bir zamanda güncelleme hakkını saklı tutarız. Önemli değişiklikler yapıldığında son güncelleme tarihini bu sayfada güncelleyeceğiz. Kullanıcıların politikamızı periyodik olarak gözden geçirmelerini öneririz.</p>
      </article>
    </div>
  );
};

const PrivacyPageEN = () => {
  const { lang } = useParams<{ lang: string }>();
  const { t } = useTranslation();


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
        <h1>Privacy Policy</h1>
        <p className="static-meta">Last Updated: May 2026</p>

        <p>At <strong>RollerCoin Profit Calculator</strong> (rollercoincalculator.app), our priority is transparency and the protection of user privacy. We believe you should have full clarity about how your data is (or isn't) processed while using our tools.</p>

        <h2>1. Data Collection and Database Policy</h2>
        <p>Our platform <strong>does not possess any database.</strong> The data you input into the forms, such as hash power, target coin ratios, and calculation durations, are never saved, stored, or processed on any server. All calculations run strictly "Client-Side" on the memory (processor) of the internet browser you are using. In terms of player security, this is the highest standard possible.</p>

        <h2>2. Cookies and Local Storage</h2>
        <p>To prevent the system from resetting your data every time you enter, we utilize your browser's <strong>LocalStorage</strong> feature. Your previous inputs (which league you are in, the language you selected, etc.) are kept unencrypted strictly on your own device. This data is never sent to our servers.</p>

        <h2>3. Google Analytics and Statistical Data</h2>
        <p>For the purpose of improving our site, detecting which sections are read the most, and performance reporting, we use <strong>Google Analytics</strong> as a standard practice. These tools measure fully "anonymized" standard metrics such as time spent on the site, page visit rates, and rough geographical location information (country/city-based). No personal identification is ever made.</p>

        <h2>4. Advertising Networks (Google AdSense)</h2>
        <p>To cover our server expenses, third-party advertising and publisher networks such as <strong>Google AdSense</strong> have been integrated. Our advertising partners may use standard cookies and web beacons based on your browsing behavior in order to present personalized ads to you. This cookie management is handled entirely outside of our control and operates under the global privacy agreements of the respective organizations.</p>
        <p style={{ marginTop: '12px' }}><strong>Third-party ad servers or ad networks</strong> use technologies like cookies, JavaScript, or Web Beacons that are sent directly to your browser when they serve advertisements. They automatically receive your IP address when this occurs. These technologies are used to measure the effectiveness of their advertising campaigns and/or to personalize the advertising content that you see.</p>
        <p style={{ marginTop: '12px' }}><strong>To opt out of personalized advertising,</strong> you can visit the <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-400)' }}>Google Ads Settings</a> page. You may also manage cookies from other ad networks via the <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-400)' }}>DAA opt-out</a> page.</p>
        <p style={{ marginTop: '12px' }}>For more information on Google's privacy practices, please review the <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-400)' }}>Google Privacy Policy</a>.</p>

        <h2>5. Responsibility for External Links</h2>
        <p>Any risks arising from links directed to external sites found within our guides or advertising modules are entirely the user's own responsibility. We cannot be held liable for the privacy practices or contents of the aforementioned external sites.</p>

        <h2>6. Changes to This Policy</h2>
        <p>We reserve the right to update this Privacy Policy at any time. When significant changes are made, we will update the last modified date on this page. We encourage users to review our policy periodically.</p>
      </article>
    </div>
  );
};

export default function PrivacyPage() {
  const { lang } = useParams<{ lang: string }>();
  return lang === 'tr' ? <PrivacyPageTR /> : <PrivacyPageEN />;
}
