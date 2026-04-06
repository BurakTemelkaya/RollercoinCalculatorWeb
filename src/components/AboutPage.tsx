import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

const AboutPageTR = () => {
  const { lang } = useParams<{ lang: string }>();
  const { t } = useTranslation();
  return (
    <div className="static-page-container">
      <Helmet>
        <title>Hakkımızda - RollerCoin Kazanç Hesaplayıcı | Burak Temelkaya</title>
        <meta name="description" content="RollerCoin Kazanç Hesaplayıcısı, Burak Temelkaya tarafından tamamen oyuncu verimliliği ve topluluk faydası odaklı olarak geliştirilmiş bağımsız bir projedir." />
        <link rel="canonical" href={`https://rollercoincalculator.app/${lang}/about`} />
      </Helmet>

      <div className="static-back-link">
        <Link to={`/${lang}`}>← {t('event.backToCalc')}</Link>
      </div>

      <article className="static-content">
        <h1>Hakkımızda: Ticari Değil, Oyuncu Odaklı Bir Proje</h1>
        
        <p>Merhaba, ben <strong>Burak Temelkaya</strong>. Yakın dönemin en popüler oyna-kazan (play-to-earn) ekosistemlerinden biri olan RollerCoin'de, oyuncuların en büyük sorununun "karlılık analizi" olduğunu fark ettim. Piyasada bulunan birçok araç ya güncel verilerden yoksundu ya da fazlasıyla reklam panosuna dönüşmüş, kullanıcı deneyimini hiçe sayan ticari projelere evrilmişti.</p>
        
        <p>İşte bu temel problemden yola çıkarak geliştirdiğim <strong>RollerCoin Kazanç Hesaplayıcı</strong> (rollercoincalculator.app), tamamen oyuncu verimliliğine odaklanmış, açık fikirli ve topluluk destekli bir girişimdir.</p>

        <h2>Vizyon ve Temel Değerler</h2>
        <ul>
          <li><strong>Bağımsızlık:</strong> Bu platform, resmi RollerCoin ekibi ile hiçbir organik veya ticari bağı bulunmayan tamamen bağımsız bir üçüncü taraf geliştirici projesidir.</li>
          <li><strong>Maksimum Doğruluk:</strong> Veriler doğrudan RollerCoin'in kendi sunduğu lig (league) parametreleri ve Binance canlı API'si üzerinden eşzamanlı çekilerek hesaplanır. Manipülasyona ve tahmine yer yoktur.</li>
          <li><strong>Kullanıcı Odaklı Deneyim:</strong> Reklam panoları, hesaplayıcının çalışmasını ve okunabilirliğini engellemeyecek ölçüde düzenlenir. Temel amaç, bir oyuncunun sayfaya girdiği ilk saniyede net kazanç verilerine ulaşmasını sağlamaktır.</li>
          <li><strong>Gelişime Açıklık:</strong> Yeni eklenen coinler, lig güncellemeleri veya oyun içi dinamik (bonus mekanikleri) değişimleri anında sisteme entegre edilir.</li>
        </ul>

        <p className="static-note">
          Bu proje, yüksek kazanç vaadi sunan bir yatırım tavsiyesi aracı değildir. Sadece sizin mevcut donanım ve hash gücünüzün rijit bir matematiksel yansımasını sunar. Elde edeceğiniz kazançlar tamamen ağdaki diğer oyuncuların aktivitesiyle orantılı olarak anlık değişime açıktır.
        </p>

        <h2 style={{ marginTop: '40px' }}>Projeyi Desteklemek İster misiniz?</h2>
        <p>
          Sunucu maliyetlerinin karşılanması, alan adı yenilemeleri ve uykusuz geçirilen geliştirme süreçlerinin bir teşviki olarak projeye destekte bulunmaktan çekinmeyin! Uygulamayı her gün kullanarak, hata/bug bildirimleri yaparak veya kahve ısmarlayarak yanımızda olabilirsiniz. Ayrıntılar için <Link to={`/${lang}/support`}>Destek</Link> sayfamıza göz atabilirsiniz.
        </p>
      </article>
    </div>
  );
};

const AboutPageEN = () => {
  const { lang } = useParams<{ lang: string }>();
  const { t } = useTranslation();
  return (
    <div className="static-page-container">
      <Helmet>
        <title>About Us - RollerCoin Profit Calculator | Burak Temelkaya</title>
        <meta name="description" content="The RollerCoin Profit Calculator is an independent project strictly focused on player efficiency and community utility, developed by Burak Temelkaya." />
        <link rel="canonical" href={`https://rollercoincalculator.app/${lang}/about`} />
      </Helmet>

      <div className="static-back-link">
        <Link to={`/${lang}`}>← {t('event.backToCalc')}</Link>
      </div>

      <article className="static-content">
        <h1>About Us: A Player-Focused Project, Not a Commercial One</h1>
        
        <p>Hello, I'm <strong>Burak Temelkaya</strong>. I realized that the biggest problem for players in RollerCoin, one of the most popular play-to-earn ecosystems recently, was "profitability analysis." Many tools available on the market either lacked up-to-date data or had turned into excessive ad billboards, evolving into commercial projects that completely disregarded user experience.</p>
        
        <p>Starting from this fundamental problem, the <strong>RollerCoin Profit Calculator</strong> (rollercoincalculator.app) is an independent, open-minded, and community-supported initiative entirely focused on player efficiency.</p>

        <h2>Vision and Core Values</h2>
        <ul>
          <li><strong>Independence:</strong> This platform is a fully independent third-party developer project with no organic or commercial ties to the official RollerCoin team.</li>
          <li><strong>Maximum Accuracy:</strong> Data is calculated instantly by fetching the league parameters directly provided by RollerCoin and live quotes from the Binance API. There is absolutely no room for manipulation or guesswork.</li>
          <li><strong>User-Centric Experience:</strong> Ad boards are strictly arranged in a way that does not prevent the calculator's operation or readability. The primary goal is to ensure a player accesses clear profit data the very first second they enter the page.</li>
          <li><strong>Openness to Development:</strong> Newly added coins, league updates, or in-game dynamic (bonus mechanic) changes are immediately integrated into the system.</li>
        </ul>

        <p className="static-note">
          This project is not an investment advice tool promising high returns. It merely presents a rigid mathematical reflection of your current inventory and hash power. The profits you yield are fully open to instant variations proportional to the activity of other players on the network.
        </p>

        <h2 style={{ marginTop: '40px' }}>Would You Like to Support the Project?</h2>
        <p>
          Do not hesitate to support the project as an encouragement for server costs, domain renewals, and the sleepless development processes! You can stand by us by using the application every day, reporting bugs/errors, or buying us a coffee. For details, you can visit our <Link to={`/${lang}/support`}>Support</Link> page.
        </p>
      </article>
    </div>
  );
};

export default function AboutPage() {
  const { lang } = useParams<{ lang: string }>();
  return lang === 'tr' ? <AboutPageTR /> : <AboutPageEN />;
}
