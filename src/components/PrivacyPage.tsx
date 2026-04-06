
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
        <p className="static-meta">Son Güncelleme: Ekim 2024</p>

        <p><strong>RollerCoin Kazanç Hesaplayıcı</strong> (rollercoincalculator.app) olarak önceliğimiz, şeffaflık ve kullanıcı gizliliğinin korunmasıdır. Araçlarımızı kullanırken verilerinizin nasıl (veya nasıl işlenmediği) hakkında tam bir açıklığa sahip olmanız gerektiğine inanıyoruz.</p>

        <h2>1. Veri Toplama ve Veritabanı Politikası</h2>
        <p>Platformumuz <strong>herhangi bir veritabanına sahip değildir.</strong> Forma girdiğiniz hash gücü, hedef coin oranları, hesaplama süresi gibi veriler hiçbir sunucuda kaydedilmez, depolanmaz ve işlenmez. Tüm hesaplamalar tamamen sizin kullandığınız internet tarayıcınızın belleğinde (işlemci üzerinde) anlık olarak "Client-Side" çalışır. Oyuncu güvenliği açısından bu, en yüksek standarttır.</p>

        <h2>2. Çerezler (Cookies) ve Yerel Depolama (Local Storage)</h2>
        <p>Sistemin her girdiğinizde verilerinizi sıfırlamaması için tarayıcınızın <strong>LocalStorage</strong> (Yerel Depolama) özelliğini kullanırız. Önceki girişleriniz (hangi ligde olduğunuz, seçtiğiniz dil vb.) sadece kendi cihazınızda şifrelenmeden tutulur. Bizim sunucularımıza gönderilmez.</p>
        
        <h2>3. Google Analytics ve İstatistik Verileri</h2>
        <p>Sitemizin geliştirilmesi, hangi bölümlerin daha çok okunduğunun tespiti ve performans raporlamaları amacıyla standart olarak <strong>Google Analytics</strong> kullanmaktayız. Bu araçlar; site içi kalma süresi, sayfa ziyaret oranları, kaba coğrafi konum bilgisi (ülke/şehir bazlı) gibi tamamen "anonim" hale getirilmiş standart metrikleri ölçümler. Kimlik tespiti yapılmaz.</p>

        <h2>4. Reklam Ağları (Google AdSense ve Çeşitli Partnerler)</h2>
        <p>Sunucu giderlerimizi karşılayabilmek adına <strong>Google AdSense</strong> ve <strong>AADS</strong> gibi üçüncü taraf reklam ve yayıncı ağları entegre edilmiştir. Reklam partnerlerimiz, size kişiselleştirilmiş reklamlar sunabilmek amacıyla veya tarayıcı gezintilerinize dayanan standart çerezleri (cookies) ve web işaretçilerini (web beacons) kullanabilirler. Bu çerez yönetimi tamamen bizim dışımızda, ilgili kurumların global gizlilik anlaşmaları uyarınca idare edilir.</p>
        
        <h2>5. Dış Bağlantılar Sorumluluğu</h2>
        <p>Rehberlerimiz içinde veya reklam modüllerinde yer alan harici sitelere yönlendirilen bağlantılardan doğacak riskler tamamen kullanıcının kendi sorumluluğundadır. Söz konusu dış sitelerin gizlilik uygulamaları veya içeriklerinden tarafımız sorumlu tutulamaz.</p>
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
        <p className="static-meta">Last Updated: October 2024</p>

        <p>At <strong>RollerCoin Profit Calculator</strong> (rollercoincalculator.app), our priority is transparency and the protection of user privacy. We believe you should have full clarity about how your data is (or isn't) processed while using our tools.</p>

        <h2>1. Data Collection and Database Policy</h2>
        <p>Our platform <strong>does not possess any database.</strong> The data you input into the forms, such as hash power, target coin ratios, and calculation durations, are never saved, stored, or processed on any server. All calculations run strictly "Client-Side" on the memory (processor) of the internet browser you are using. In terms of player security, this is the highest standard possible.</p>

        <h2>2. Cookies and Local Storage</h2>
        <p>To prevent the system from resetting your data every time you enter, we utilize your browser's <strong>LocalStorage</strong> feature. Your previous inputs (which league you are in, the language you selected, etc.) are kept unencrypted strictly on your own device. This data is never sent to our servers.</p>
        
        <h2>3. Google Analytics and Statistical Data</h2>
        <p>For the purpose of improving our site, detecting which sections are read the most, and performance reporting, we use <strong>Google Analytics</strong> as a standard practice. These tools measure fully "anonymized" standard metrics such as time spent on the site, page visit rates, and rough geographical location information (country/city-based). No personal identification is ever made.</p>

        <h2>4. Advertising Networks (Google AdSense and Various Partners)</h2>
        <p>To cover our server expenses, third-party advertising and publisher networks such as <strong>Google AdSense</strong> and <strong>AADS</strong> have been integrated. Our advertising partners may use standard cookies and web beacons based on your browsing behavior in order to present personalized ads to you. This cookie management is handled entirely outside of our control and operates under the global privacy agreements of the respective organizations.</p>
        
        <h2>5. Responsibility for External Links</h2>
        <p>Any risks arising from links directed to external sites found within our guides or advertising modules are entirely the user's own responsibility. We cannot be held liable for the privacy practices or contents of the aforementioned external sites.</p>
      </article>
    </div>
  );
};

export default function PrivacyPage() {
  const { lang } = useParams<{ lang: string }>();
  return lang === 'tr' ? <PrivacyPageTR /> : <PrivacyPageEN />;
}
