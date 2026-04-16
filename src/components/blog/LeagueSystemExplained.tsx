import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const LeagueSystemTR = () => {
  const { lang } = useParams<{ lang: string }>();
  return (
    <div className="static-page-container">
      <Helmet>
        <title>RollerCoin Lig Sistemi Nasıl Çalışır? Detaylı Rehber | RollerCoin Hesaplayıcı</title>
        <meta name="description" content="RollerCoin'deki 15 lig kademesini, güç eşiklerini, blok ödülü dağıtım mantığını ve lig atlama stratejilerini detaylıca öğrenin." />
        <link rel="canonical" href={`https://rollercoincalculator.app/${lang}/blog/league-system-explained`} />
      </Helmet>
      <div className="static-back-link">
        <Link to={`/${lang}/blog`}>← Blog'a Dön</Link>
      </div>
      <article className="static-content guides-container">
        <h1>RollerCoin Lig Sistemi: Nasıl Çalışır? (Detaylı Rehber)</h1>
        <p><em>Son güncelleme: Nisan 2026</em></p>

        <p>RollerCoin'in lig sistemi, oyunun en kritik mekaniklerinden biridir. Eskiden tek bir havuzda tüm oyuncular rekabet ederken, 2022 yılında tanıtılan lig sistemiyle oyun <strong>15 ayrı kademeye</strong> bölünmüştür. Bu değişiklik, düşük güçlü yeni oyuncuların devasa güce sahip veteranlarla aynı havuzda erimesini önlemiştir.</p>

        <h2>Lig Yapısı ve Kademeler</h2>
        <p>Sistem Bronze I'den başlayıp Diamond V'e kadar toplam 15 lig kademesi içerir. Her kademenin bir güç eşiği vardır ve toplam "Lig Gücünüz" (League Power) bu eşiği aştığında bir üst lige terfi edersiniz.</p>
        <p><strong>Önemli:</strong> Lig atama işlemi tek yönlüdür — sadece yukarı çıkabilirsiniz. Gücünüz düşse bile bulunduğunuz ligde kalırsınız, geriye düşmezsiniz. Ancak liginizdeki payınız azalacağı için kazancınız düşer.</p>

        <h2>Lig Gücü vs. Mevcut Güç</h2>
        <p>Bu ayrım oyundaki en çok karıştırılan konulardan biridir:</p>
        <ul>
          <li><strong>Lig Gücü (League Power / Max Power):</strong> Sadece <strong>Madenci + Raf + Bonus Gücü</strong> toplamıdır. Hangi ligde olduğunuzu BU güç belirler.</li>
          <li><strong>Mevcut Güç (Current Power):</strong> Lig gücüne ek olarak <strong>Oyun gücü, Geçici güç ve Freon</strong> eklenmiş halidir. Blok ödülü hesaplamalarında kullanılan toplam güçtür.</li>
        </ul>
        <p>Yani mini-oyunlardan kazandığınız geçici güç, lig atamanızı etkilemez, ancak kazancınızı artırır. Bu, stratejik bir avantajdır: Oyun oynayarak kazancınızı artırabilirsiniz ama bu sizi istemediğiniz bir üst lige fırlatmaz.</p>

        <h2>Her Ligin Kendine Özgü Havuzu</h2>
        <p>Her ligin bağımsız bir ödül havuzu vardır. Bu ne anlama gelir?</p>
        <ul>
          <li>Bronze I ligindeki oyuncular sadece kendi aralarında rekabet eder.</li>
          <li>Diamond V ligindeki devasa güçlü oyuncular, Bronze'daki yeni oyuncuların ödülünü "çalmaz".</li>
          <li>Her blok üretildiğinde, ödül önce liglere dağıtılır, sonra lig içindeki oyunculara bireysel güç oranına göre paylaştırılır.</li>
        </ul>

        <h2>Hangi Lig Daha Karlı?</h2>
        <p>Daha yüksek lig her zaman daha iyi kazanç anlamına gelmez. Karlılık şu faktörlere bağlıdır:</p>
        <ul>
          <li><strong>Lig Havuz Büyüklüğü:</strong> Üst liglerin toplam blok ödülü daha yüksektir ama rekabet de çok daha yoğundur.</li>
          <li><strong>Ligin Toplam Gücü:</strong> Eğer bir ligde çok az oyuncu varsa ve siz güçlüyseniz, havuzun büyük kısmını alırsınız. Kalabalık bir ligde güçlü olsanız bile payınız küçülebilir.</li>
          <li><strong>Açılan Yeni Coinler:</strong> Üst liglerde daha fazla kripto para birimi açılır. Bazı coinler (örneğin SOL veya BNB) belirli bir ligden itibaren kazanılabilir hale gelir.</li>
        </ul>
        <p><Link to={`/${lang}/charts`}>Lig Grafikleri</Link> sayfamızdan her ligin güç trendlerini takip edebilir, <Link to={`/${lang}`}>Hesaplayıcımız</Link> ile farklı lig senaryolarını simüle edebilirsiniz.</p>

        <h2>Lig Atlama Stratejileri</h2>
        <p>Deneyimli oyuncular lig geçişlerini stratejik olarak planlar:</p>
        <ul>
          <li><strong>Eşik Kontrolü:</strong> Yeni madenci almadan önce, satın alma sonrası lig gücünüzün bir üst ligin eşiğini geçip geçmeyeceğini kontrol edin. İstemediğiniz bir terfi, sizi kalabalık ve güçlü bir ligde "en küçük balık" yapabilir.</li>
          <li><strong>Güç Simülatörü Kullanın:</strong> <Link to={`/${lang}`}>Hesaplayıcımızdaki</Link> Güç Simülatörü sekmesiyle yeni bir madenci eklediğinizde kazancınızın nasıl değişeceğini önceden görebilirsiniz.</li>
          <li><strong>Zamanlama:</strong> Bazı oyuncular, lig sınırına yaklaştıklarında tüm yeni madencileri aynı anda yerleştirerek üst ligde güçlü bir başlangıç yapmayı tercih eder.</li>
          <li><strong>Bekle ve Biriktir:</strong> Eşiğe yakınsanız, bir üst lig kademesinde rahat rekabet edecek kadar güç biriktirinceye dek alım yapmayı durdurun.</li>
        </ul>

        <h2>Blok Ödülü Dağıtım Formülü</h2>
        <p>Her blok için kazancınız şu basit formülle hesaplanır:</p>
        <p style={{background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '15px'}}>
          Kazanç = (Sizin Gücünüz / Ligin Toplam Gücü) × Blok Ödülü
        </p>
        <p>Örnek: Liginizin toplam gücü 100 Th/s, sizin gücünüz 5 Th/s ve blok ödülü 0.001 BTC ise:</p>
        <p style={{background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '15px'}}>
          Kazanç = (5 / 100) × 0.001 = 0.00005 BTC / blok
        </p>
        <p>Bu hesaplamayı tüm coinler ve periyotlar (günlük, haftalık, aylık) için otomatik yapan <Link to={`/${lang}`}>hesaplayıcımızı</Link> kullanmanızı şiddetle tavsiye ederiz.</p>

        <h2>Elektrik ve Batarya Sistemi</h2>
        <p>Liginize atanmış olsanız bile, kazanç elde etmek için madencilerinizin "elektrik" ile çalışması gerekir. Bataryalarınız biterse madencileriniz durur ve kazanç sıfırlanır. Batarya, mini-oyun oynayarak veya Marketplace'ten satın alarak elde edilir.</p>

        <h2>Sonuç</h2>
        <p>RollerCoin'in lig sistemi, stratejik derinlik katarak oyunu sıradan bir "tıkla-kazan" mekanikten çok daha fazlasına dönüştürür. Doğru lig pozisyonlaması, güç yönetimi ve zamanlama ile kazancınızı önemli ölçüde artırabilirsiniz. <Link to={`/${lang}/charts`}>Lig grafiklerimizi</Link> takip ederek en güncel verilere ulaşabilirsiniz.</p>
      </article>
    </div>
  );
};

const LeagueSystemEN = () => {
  const { lang } = useParams<{ lang: string }>();
  return (
    <div className="static-page-container">
      <Helmet>
        <title>How Does the RollerCoin League System Work? Detailed Guide | RollerCoin Calculator</title>
        <meta name="description" content="Learn about RollerCoin's 15 league tiers, power thresholds, block reward distribution, and strategic league advancement tips." />
        <link rel="canonical" href={`https://rollercoincalculator.app/${lang}/blog/league-system-explained`} />
      </Helmet>
      <div className="static-back-link">
        <Link to={`/${lang}/blog`}>← Back to Blog</Link>
      </div>
      <article className="static-content guides-container">
        <h1>RollerCoin League System: How Does It Work? (Detailed Guide)</h1>
        <p><em>Last updated: April 2026</em></p>

        <p>The league system is one of RollerCoin's most critical mechanics. Where all players once competed in a single pool, the league system introduced in 2022 divided the game into <strong>15 separate tiers</strong>. This change prevents low-power newcomers from being drowned out by veteran players with massive hash power.</p>

        <h2>League Structure and Tiers</h2>
        <p>The system contains 15 league tiers ranging from Bronze I to Diamond V. Each tier has a power threshold, and when your total "League Power" exceeds this threshold, you are promoted to the next tier.</p>
        <p><strong>Important:</strong> League promotions are one-way — you can only move up. Even if your power drops, you remain in your current league, but your share of the reward pool will decrease, reducing your earnings.</p>

        <h2>League Power vs. Current Power</h2>
        <p>This distinction is one of the most frequently confused topics in the game:</p>
        <ul>
          <li><strong>League Power (Max Power):</strong> Only includes <strong>Miners + Racks + Bonus Power</strong>. THIS determines which league you're in.</li>
          <li><strong>Current Power:</strong> League Power plus <strong>Game power, Temporary power, and Freon</strong>. This is the total power used in block reward calculations.</li>
        </ul>
        <p>This means temporary power from mini-games does NOT affect your league placement but DOES increase your earnings. This is a strategic advantage: you can boost your income by playing games without being pushed into a higher, more competitive league.</p>

        <h2>Each League Has Its Own Pool</h2>
        <p>Every league has an independent reward pool. What does this mean?</p>
        <ul>
          <li>Players in Bronze I only compete against each other.</li>
          <li>Diamond V whales don't "steal" rewards from Bronze newcomers.</li>
          <li>When a block is produced, the reward is first distributed across leagues, then divided among players within each league proportional to their individual power.</li>
        </ul>

        <h2>Which League Is More Profitable?</h2>
        <p>A higher league doesn't always equal better earnings. Profitability depends on:</p>
        <ul>
          <li><strong>Pool Size:</strong> Higher leagues have larger total block rewards, but competition is also far more intense.</li>
          <li><strong>League Total Power:</strong> If a league has very few players and you're strong, you'll capture a large share of the pool. In a crowded league, even being powerful means a smaller slice.</li>
          <li><strong>Unlocked Coins:</strong> Higher leagues unlock more cryptocurrencies. Some coins (e.g., SOL or BNB) only become mineable from certain tiers.</li>
        </ul>
        <p>You can track power trends for each league on our <Link to={`/${lang}/charts`}>League Charts</Link> page, and simulate different league scenarios with our <Link to={`/${lang}`}>Calculator</Link>.</p>

        <h2>League Advancement Strategies</h2>
        <p>Experienced players plan league transitions strategically:</p>
        <ul>
          <li><strong>Threshold Check:</strong> Before buying a new miner, check whether the purchase would push your league power past the next tier's threshold. An unwanted promotion could make you the "smallest fish" in a crowded, powerful league.</li>
          <li><strong>Use the Power Simulator:</strong> The Power Simulator tab in our <Link to={`/${lang}`}>Calculator</Link> lets you preview how your earnings change when you add a new miner before actually purchasing it.</li>
          <li><strong>Timing:</strong> Some players prefer to place all new miners simultaneously to get a strong start in the new league rather than trickling in one at a time.</li>
          <li><strong>Wait and Accumulate:</strong> If you're close to the threshold, consider pausing purchases until you've accumulated enough power to compete comfortably in the higher tier.</li>
        </ul>

        <h2>Block Reward Distribution Formula</h2>
        <p>Your earnings per block are calculated with this simple formula:</p>
        <p style={{background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '15px'}}>
          Earnings = (Your Power / League Total Power) × Block Reward
        </p>
        <p>Example: If your league's total power is 100 Th/s, your power is 5 Th/s, and the block reward is 0.001 BTC:</p>
        <p style={{background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '15px'}}>
          Earnings = (5 / 100) × 0.001 = 0.00005 BTC / block
        </p>
        <p>We strongly recommend using our <Link to={`/${lang}`}>calculator</Link> which automates this for all coins and periods (daily, weekly, monthly).</p>

        <h2>Electricity and Battery System</h2>
        <p>Even if you're assigned to a league, your miners need "electricity" to generate earnings. If your batteries run out, your miners stop and earnings drop to zero. Batteries are obtained by playing mini-games or purchasing from the Marketplace.</p>

        <h2>Conclusion</h2>
        <p>RollerCoin's league system adds strategic depth that transforms the game from a simple "click-to-earn" mechanic into something far more nuanced. With proper league positioning, power management, and timing, you can significantly boost your earnings. Follow our <Link to={`/${lang}/charts`}>league charts</Link> for the most up-to-date data.</p>
      </article>
    </div>
  );
};

export default function LeagueSystemExplained() {
  const { lang } = useParams<{ lang: string }>();
  return lang === 'tr' ? <LeagueSystemTR /> : <LeagueSystemEN />;
}
