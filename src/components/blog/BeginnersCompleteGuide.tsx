import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const BeginnersGuideTR = () => {
  const { lang } = useParams<{ lang: string }>();
  return (
    <div className="static-page-container">
      <Helmet>
        <title>RollerCoin Yeni Başlayanlar İçin Adım Adım Rehber (2026) | RollerCoin Hesaplayıcı</title>
        <meta name="description" content="RollerCoin'e yeni başlıyorsanız bu rehber tam size göre. Hesap açma, ilk adımlar, mini-oyunlar, madenci alma ve 30 günlük plan." />
        <link rel="canonical" href={`https://rollercoincalculator.app/${lang}/blog/beginners-complete-guide`} />
      </Helmet>
      <div className="static-back-link">
        <Link to={`/${lang}/blog`}>← Blog'a Dön</Link>
      </div>
      <article className="static-content guides-container">
        <h1>RollerCoin Yeni Başlayanlar İçin Adım Adım Rehber (2026)</h1>
        <p><em>Son güncelleme: Nisan 2026</em></p>

        <p>RollerCoin'e ilk kez mi başlıyorsunuz? Bu rehber sizi sıfırdan alıp, ilk kazancınızı elde edene kadar adım adım yönlendirecek. Hiçbir yatırım gerektirmeden, sadece zaman ve strateji ile nasıl ilerleme kaydedebileceğinizi öğreneceksiniz.</p>

        <h2>Adım 1: Hesap Oluşturma</h2>
        <p><a href="https://rollercoin.com" target="_blank" rel="noopener noreferrer">rollercoin.com</a> adresine gidin ve e-posta adresinizle ücretsiz bir hesap oluşturun. KYC (kimlik doğrulama) gerekmez. Kayıt sonrası sanal madencilik odanıza yönlendirileceksiniz.</p>

        <h2>Adım 2: Arayüzü Tanıyın</h2>
        <p>Sol menüde şu temel bölümler bulunur:</p>
        <ul>
          <li><strong>Room (Oda):</strong> Madencilerinizi ve raflarınızı yerleştirdiğiniz sanal alanınız</li>
          <li><strong>Games (Oyunlar):</strong> Mini-oyunlar oynayarak geçici hash gücü kazandığınız bölüm</li>
          <li><strong>Store/Marketplace:</strong> Madenci, parça ve batarya alıp satabileceğiniz mağaza</li>
          <li><strong>Mining (Madencilik):</strong> Kazancınızı ve hangi coinleri kazdığınızı gösteren panel</li>
          <li><strong>Wallet (Cüzdan):</strong> Bakiyelerinizi görüntülediğiniz ve çekim yaptığınız bölüm</li>
        </ul>

        <h2>Adım 3: İlk Mini-Oyunlarınızı Oynayın</h2>
        <p>Oyuna başladığınızda hiçbir madenciniz yoktur. İlk gücünüz mini-oyunlardan gelir. İşte en verimli oyunlar:</p>
        <ul>
          <li><strong>CoinClick:</strong> Ekrandaki coinlere tıklayın. Basit ve hızlıdır.</li>
          <li><strong>Flappy Rocket:</strong> Roketle engellerin arasından geçin. Yüksek ödül potansiyeli.</li>
          <li><strong>Cryptonoid:</strong> Tuğla kırma oyunu. Hem eğlenceli hem verimli.</li>
          <li><strong>Token Blaster:</strong> Nişan alıp ateş edin. Hızlı tamamlama süresi.</li>
        </ul>
        <p><strong>İpucu:</strong> Her oyun kazanıldığında geçici hash gücü elde edersiniz. Günde en az 50-100 oyun oynamayı hedefleyin.</p>

        <h2>Adım 4: PC Seviyenizi Yükseltin</h2>
        <p>Mini-oyunlardan kazandığınız güç geçicidir — PC seviyenize göre 1-7 gün sürer:</p>
        <ul>
          <li><strong>Level 1:</strong> Güç 1 gün sürer</li>
          <li><strong>Level 2:</strong> Güç 3 gün sürer (10 oyun kazanın)</li>
          <li><strong>Level 3:</strong> Güç 5 gün sürer (30 oyun kazanın)</li>
          <li><strong>Level 4 (RollerMac Pro):</strong> Güç 7 gün sürer (60 oyun kazanın)</li>
        </ul>
        <p>Amacınız mümkün olan en kısa sürede Level 4'e ulaşmaktır. Level 4'te her gün oynadığınız oyunlar 7 gün boyunca güç üretir — bu bileşik büyüme etkisi yaratır.</p>
        <p><strong>Kritik Kural:</strong> Her 24 saatte en az 1 oyun oynayın, aksi takdirde PC seviyeniz sıfırlanır!</p>

        <h2>Adım 5: Günlük ve Haftalık Görevleri Tamamlayın</h2>
        <p>RollerCoin'de görevler hem RLT hem de ekstra ödüller kazandırır:</p>
        <ul>
          <li><strong>Günlük Görevler:</strong> "X oyun oyna", "Y puan kazan" gibi basit görevler. Her gün sıfırlanır.</li>
          <li><strong>Haftalık Görevler:</strong> Daha büyük ödüller sunar. Hafta sonuna kadar tamamlayın.</li>
          <li><strong>Season Pass:</strong> Belirli dönemlerde aktif olan sezon geçişi. RST kazanarak ilerleme sağlanır.</li>
        </ul>
        <p>Bu görevleri atlamayın — F2P oyuncular için ana gelir kaynaklarından biridir.</p>

        <h2>Adım 6: İlk Madencinizi Satın Alın</h2>
        <p>Yeterli RLT biriktirdiğinizde (genellikle 1-5 RLT yeterlidir) Marketplace'ten ilk madencinizi alın:</p>
        <ol>
          <li>Store → Marketplace → Buy sekmesine gidin</li>
          <li>Fiyata göre sıralayın (en ucuzdan en pahalıya)</li>
          <li>Güç/fiyat oranına bakın (Gh/s per RLT)</li>
          <li>En verimli madenciyi seçip "Buy" butonuna basın</li>
          <li>Madenciyi odanıza yerleştirin</li>
        </ol>
        <p>İlk madenciniz küçük olsa bile, artık <strong>7/24 pasif gelir</strong> üretmeye başlamış olursunuz!</p>

        <h2>Adım 7: Kazancınızı Takip Edin</h2>
        <p><Link to={`/${lang}`}>Hesaplayıcımızı</Link> kullanarak kazancınızı anlık olarak takip edin:</p>
        <ul>
          <li>Kullanıcı adınızı girin ve "Getir" butonuna basın</li>
          <li>Tüm coinler için günlük/haftalık/aylık kazançlarınızı USD karşılığıyla görün</li>
          <li>Çekim sürenizi "Çekim Sayacı" sekmesinden takip edin</li>
          <li>Yeni madenci almadan önce "Güç Simülatörü" ile test edin</li>
        </ul>

        <h2>İlk 30 Gün Planı</h2>
        <table style={{width: '100%', borderCollapse: 'collapse', marginTop: '16px'}}>
          <thead>
            <tr style={{borderBottom: '2px solid var(--border-color)'}}>
              <th style={{padding: '10px', textAlign: 'left'}}>Hafta</th>
              <th style={{padding: '10px', textAlign: 'left'}}>Hedef</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{borderBottom: '1px solid var(--border-color)'}}>
              <td style={{padding: '10px'}}><strong>1. Hafta</strong></td>
              <td style={{padding: '10px'}}>PC Level 4'e ulaş, günlük 50+ oyun oyna, görevleri tamamla</td>
            </tr>
            <tr style={{borderBottom: '1px solid var(--border-color)'}}>
              <td style={{padding: '10px'}}><strong>2. Hafta</strong></td>
              <td style={{padding: '10px'}}>İlk madenciyi al, RLT biriktirmeye devam et</td>
            </tr>
            <tr style={{borderBottom: '1px solid var(--border-color)'}}>
              <td style={{padding: '10px'}}><strong>3. Hafta</strong></td>
              <td style={{padding: '10px'}}>2-3 madenci daha al, batarya stoku oluştur</td>
            </tr>
            <tr style={{borderBottom: '1px solid var(--border-color)'}}>
              <td style={{padding: '10px'}}><strong>4. Hafta</strong></td>
              <td style={{padding: '10px'}}>Koleksiyon bonuslarını araştır, strateji belirle</td>
            </tr>
          </tbody>
        </table>

        <h2>Sık Yapılan Hatalar</h2>
        <ul>
          <li><strong>Hemen çekim yapmaya çalışmak:</strong> Minimum çekim eşiklerine ulaşmak uzun sürer. Önce gücünüzü artırmaya odaklanın.</li>
          <li><strong>PC seviyesini sıfırlamak:</strong> Bir gün bile oyun oynamamak PC'nizi Level 1'e düşürür ve birikmiş geçici gücünüzü kaybedersiniz.</li>
          <li><strong>Tek bir coinde ısrar etmek:</strong> Piyasa değişiyor, esnek olun.</li>
          <li><strong>Batarya stoku yapmamak:</strong> Madencileriniz bataryasız çalışmaz.</li>
          <li><strong>Görevleri ihmal etmek:</strong> Kolay RLT ve ödül kaynaklarını kaçırırsınız.</li>
          <li><strong>Karşılaştırma yapmadan madenci almak:</strong> Aynı fiyata çok farklı güçte madenciler olabilir.</li>
        </ul>

        <h2>Faydalı Araçlarımız</h2>
        <ul>
          <li><Link to={`/${lang}`}>Kazanç Hesaplayıcı</Link> — Anlık kazancınızı hesaplayın</li>
          <li><Link to={`/${lang}/charts`}>Lig Grafikleri</Link> — Güç trendlerini takip edin</li>
          <li><Link to={`/${lang}/guides`}>Strateji Rehberleri</Link> — İleri düzey taktikler</li>
          <li><Link to={`/${lang}/blog/league-system-explained`}>Lig Sistemi Rehberi</Link> — Ligleri derinlemesine anlayın</li>
          <li><Link to={`/${lang}/blog/marketplace-trading-guide`}>Marketplace Rehberi</Link> — Akıllı alım-satım</li>
        </ul>

        <h2>Sonuç</h2>
        <p>RollerCoin, sabır ve strateji gerektiren bir maraton oyunudur. İlk günlerde kazancınız düşük olsa da, tutarlı oyun rutini ve akıllı yatırımlarla bileşik büyüme etkisi size hızla artan bir pasif gelir sağlayacaktır. Bu rehberdeki adımları takip ederek doğru temeli atın ve <Link to={`/${lang}/guides/f2p-strategy`}>F2P Strateji rehberimizle</Link> daha ileri düzey taktiklere geçin.</p>
      </article>
    </div>
  );
};

const BeginnersGuideEN = () => {
  const { lang } = useParams<{ lang: string }>();
  return (
    <div className="static-page-container">
      <Helmet>
        <title>RollerCoin Beginner's Complete Guide: Step by Step (2026) | RollerCoin Calculator</title>
        <meta name="description" content="New to RollerCoin? This guide takes you from account creation to your first earnings. Mini-games, miners, daily routines, and a 30-day action plan." />
        <link rel="canonical" href={`https://rollercoincalculator.app/${lang}/blog/beginners-complete-guide`} />
      </Helmet>
      <div className="static-back-link">
        <Link to={`/${lang}/blog`}>← Back to Blog</Link>
      </div>
      <article className="static-content guides-container">
        <h1>RollerCoin Beginner's Complete Guide: Step by Step (2026)</h1>
        <p><em>Last updated: April 2026</em></p>

        <p>Starting RollerCoin for the first time? This guide will take you from zero to your first earnings, step by step. You'll learn how to progress using only time and strategy — no financial investment required.</p>

        <h2>Step 1: Create Your Account</h2>
        <p>Visit <a href="https://rollercoin.com" target="_blank" rel="noopener noreferrer">rollercoin.com</a> and create a free account with your email. No KYC (identity verification) is required. After registration, you'll be directed to your virtual mining room.</p>

        <h2>Step 2: Learn the Interface</h2>
        <p>The left menu contains these key sections:</p>
        <ul>
          <li><strong>Room:</strong> Your virtual space where you place miners and racks</li>
          <li><strong>Games:</strong> Play mini-games to earn temporary hash power</li>
          <li><strong>Store/Marketplace:</strong> Buy and sell miners, parts, and batteries</li>
          <li><strong>Mining:</strong> Panel showing your earnings and which coins you're mining</li>
          <li><strong>Wallet:</strong> View your balances and make withdrawals</li>
        </ul>

        <h2>Step 3: Play Your First Mini-Games</h2>
        <p>When you start, you have no miners. Your first power comes from mini-games. Here are the most efficient ones:</p>
        <ul>
          <li><strong>CoinClick:</strong> Click coins on screen. Simple and fast.</li>
          <li><strong>Flappy Rocket:</strong> Navigate through obstacles. High reward potential.</li>
          <li><strong>Cryptonoid:</strong> Brick-breaking game. Both fun and efficient.</li>
          <li><strong>Token Blaster:</strong> Aim and shoot. Quick completion time.</li>
        </ul>
        <p><strong>Tip:</strong> Each game win gives you temporary hash power. Aim for at least 50-100 games per day.</p>

        <h2>Step 4: Upgrade Your PC Level</h2>
        <p>Power from mini-games is temporary — lasting 1-7 days depending on your PC level:</p>
        <ul>
          <li><strong>Level 1:</strong> Power lasts 1 day</li>
          <li><strong>Level 2:</strong> Power lasts 3 days (win 10 games)</li>
          <li><strong>Level 3:</strong> Power lasts 5 days (win 30 games)</li>
          <li><strong>Level 4 (RollerMac Pro):</strong> Power lasts 7 days (win 60 games)</li>
        </ul>
        <p>Your goal is to reach Level 4 as quickly as possible. At Level 4, games you play each day generate power for 7 days — creating a compound growth effect.</p>
        <p><strong>Critical Rule:</strong> Play at least 1 game every 24 hours, or your PC level resets!</p>

        <h2>Step 5: Complete Daily and Weekly Quests</h2>
        <p>Quests in RollerCoin earn you both RLT and extra rewards:</p>
        <ul>
          <li><strong>Daily Quests:</strong> Simple tasks like "play X games", "score Y points". Reset daily.</li>
          <li><strong>Weekly Quests:</strong> Offer larger rewards. Complete before week's end.</li>
          <li><strong>Season Pass:</strong> Active during certain periods. Progress by earning RST.</li>
        </ul>
        <p>Don't skip these — they're one of the primary income sources for F2P players.</p>

        <h2>Step 6: Buy Your First Miner</h2>
        <p>Once you've accumulated enough RLT (usually 1-5 RLT is sufficient), buy your first miner from the Marketplace:</p>
        <ol>
          <li>Go to Store → Marketplace → Buy tab</li>
          <li>Sort by price (lowest to highest)</li>
          <li>Check the power-to-cost ratio (Gh/s per RLT)</li>
          <li>Select the most efficient miner and click "Buy"</li>
          <li>Place the miner in your room</li>
        </ol>
        <p>Even if your first miner is small, you've now started generating <strong>24/7 passive income</strong>!</p>

        <h2>Step 7: Track Your Earnings</h2>
        <p>Use our <Link to={`/${lang}`}>Calculator</Link> to monitor your earnings in real-time:</p>
        <ul>
          <li>Enter your username and click "Fetch"</li>
          <li>View daily/weekly/monthly earnings for all coins with USD equivalents</li>
          <li>Track withdrawal time in the "Withdraw Timer" tab</li>
          <li>Test new miner purchases with the "Power Simulator" before buying</li>
        </ul>

        <h2>First 30-Day Plan</h2>
        <table style={{width: '100%', borderCollapse: 'collapse', marginTop: '16px'}}>
          <thead>
            <tr style={{borderBottom: '2px solid var(--border-color)'}}>
              <th style={{padding: '10px', textAlign: 'left'}}>Week</th>
              <th style={{padding: '10px', textAlign: 'left'}}>Goal</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{borderBottom: '1px solid var(--border-color)'}}>
              <td style={{padding: '10px'}}><strong>Week 1</strong></td>
              <td style={{padding: '10px'}}>Reach PC Level 4, play 50+ games daily, complete quests</td>
            </tr>
            <tr style={{borderBottom: '1px solid var(--border-color)'}}>
              <td style={{padding: '10px'}}><strong>Week 2</strong></td>
              <td style={{padding: '10px'}}>Buy first miner, continue accumulating RLT</td>
            </tr>
            <tr style={{borderBottom: '1px solid var(--border-color)'}}>
              <td style={{padding: '10px'}}><strong>Week 3</strong></td>
              <td style={{padding: '10px'}}>Buy 2-3 more miners, build battery stock</td>
            </tr>
            <tr style={{borderBottom: '1px solid var(--border-color)'}}>
              <td style={{padding: '10px'}}><strong>Week 4</strong></td>
              <td style={{padding: '10px'}}>Research collection bonuses, define strategy</td>
            </tr>
          </tbody>
        </table>

        <h2>Common Mistakes to Avoid</h2>
        <ul>
          <li><strong>Trying to withdraw immediately:</strong> Reaching minimum withdrawal thresholds takes time. Focus on building power first.</li>
          <li><strong>Resetting your PC level:</strong> Missing even one day drops your PC to Level 1 and you lose all accumulated temporary power.</li>
          <li><strong>Sticking to one coin:</strong> Markets change — stay flexible.</li>
          <li><strong>Not stocking batteries:</strong> Your miners don't work without batteries.</li>
          <li><strong>Neglecting quests:</strong> You'll miss easy RLT and reward sources.</li>
          <li><strong>Buying miners without comparing:</strong> Same price can get you vastly different power levels.</li>
        </ul>

        <h2>Useful Tools</h2>
        <ul>
          <li><Link to={`/${lang}`}>Earnings Calculator</Link> — Calculate your real-time earnings</li>
          <li><Link to={`/${lang}/charts`}>League Charts</Link> — Track power trends</li>
          <li><Link to={`/${lang}/guides`}>Strategy Guides</Link> — Advanced tactics</li>
          <li><Link to={`/${lang}/blog/league-system-explained`}>League System Guide</Link> — Understand leagues in depth</li>
          <li><Link to={`/${lang}/blog/marketplace-trading-guide`}>Marketplace Guide</Link> — Smart buying and selling</li>
        </ul>

        <h2>Conclusion</h2>
        <p>RollerCoin is a marathon game requiring patience and strategy. While your earnings may be low in the early days, consistent daily play and smart investments create a compound growth effect that rapidly scales your passive income. Follow the steps in this guide to build the right foundation, then advance to more sophisticated tactics with our <Link to={`/${lang}/guides/f2p-strategy`}>F2P Strategy guide</Link>.</p>
      </article>
    </div>
  );
};

export default function BeginnersCompleteGuide() {
  const { lang } = useParams<{ lang: string }>();
  return lang === 'tr' ? <BeginnersGuideTR /> : <BeginnersGuideEN />;
}
