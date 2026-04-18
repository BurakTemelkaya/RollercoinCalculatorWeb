import { useParams, Link } from 'react-router-dom';

import { Helmet } from 'react-helmet-async';

const BonusPowerGuideTR = () => {
  const { lang } = useParams<{ lang: string }>();

  return (
    <div className="static-page-container">
      <Helmet>
        <title>RollerCoin Bonus Power Rehberi: Neden Sadece Güç Yetmez?</title>
        <meta name="description" content="Koleksiyon Bonusu (Collection Bonus) mekaniği ile RollerCoin odanızın saf gücünü efor sarf etmeden hesaplayıcı üzerinden nasıl ikiye katlayabileceğinizi öğrenin." />
        <link rel="canonical" href={`https://rollercoincalculator.app/${lang}/guides/bonus-power`} />
      </Helmet>

      <div className="static-back-link">
        <Link to={`/${lang}/guides`}>← Rehberlere Dön</Link>
      </div>

      <article className="static-content guides-container">
        <h1>Bonus Power Rehberi - Neden Sadece Güç Yetmez?</h1>
        <p>Sadece ham Th/s veya Ph/s değerlerine odaklanan klasik madencilik zihniyetini terk etmelisiniz. Liderlik (Leaderboard) tablosundaki tepedeki isimlere bakarsanız, güçlerinin devasa bir kısmının "Koleksiyon Bonusu" (Collection Bonus) mekaniğinden geldiğini net şekilde görürsünüz.</p>

        <h2>1. Koleksiyon Bonusu (Collection Bonus) Nasıl Hesaplanır?</h2>
        <p>Odalarınızdaki raflara (Racks) eklediğiniz her eşsiz (benzersiz) madenci, tüm odanızdaki ham (raw) güce belirli bir % (yüzde) oranında bonus çarpanı uygular. Eğer elinizde X madencisinden 2 tane varsa, bonus <strong>sadece bir kez (%x) olarak</strong> sayılır. Bu sebeple "çeşitlilik" (diversity), "nicelik"ten çok daha önemlidir.</p>
        <p>Diyelim ki odanızdaki tüm madencilerin ham toplam gücü 100 PH/s. Eğer odanıza, çok düşük ham güce sahip ama %1 bonus veren eski bir etkinlik cihazı eklerseniz, toplam bonus yüzdeniz %10'dan %11'e çıkacaktır. Bu ufacık artış, 100 PH/s'lik havuzda size hiçbir elektrik maliyeti olmadan anında ekstradan 1 PH/s güç kazandırır! Zaman geçtikçe bonus yüzdeniz %50'lere ulaştığında oyun odalarınız muazzam bir güç fabrikasına dönüşür.</p>

        <h2>2. "Fiyat / Bonus Yüzdesi" Taktikleri</h2>
        <p>Mağazaya veya Pazar yerine (Marketplace) girdiğinizde, madencinin saf gücünü değil RLT başına size ne kadar Bonus kazandıracağını analiz etmelisiniz. Özellikle eski sezonlardan (Season 1-5) kalma, gücü çok düşük ancak nadir olduğu için pazarda 1-2 RLT'ye düşmüş 'çöp' gibi görünen cihazlar tam bir Bonus madenidir.</p>
        <p>Bir madenci satın almadan önce şu denklemi kafanızda kurun: Bu madenci 50 RLT, bana sağladığı ham güç 200 Th/s. Ancak bana vereceği %0.5 bonus, 100 PH/s olan mevcut gücümü 500 Th/s artıracaktır. O halde ben bu cihazı 200 Th/s için değil, 700 Th/s kazandırdığı için alıyorum. İşte uzun vadeli başarının anahtarı budur.</p>

        <h2>3. Sonuç</h2>
        <p>En karlı oyuncular, odalarının %100'ünü ham güçlü pahalı cihazlarla değil, akıllıca seçilmiş çok sayıda ucuz bonus cihazla dolduranlardır. Sitemizdeki hesaplayıcı üzerinden mevcut gücünüzü ve hedeflediğiniz bonus gücünü girerek kar-zarar optimizasyonunu hemen test edebilirsiniz.</p>
      </article>
    </div>
  );
};

const BonusPowerGuideEN = () => {
  const { lang } = useParams<{ lang: string }>();

  return (
    <div className="static-page-container">
      <Helmet>
        <title>RollerCoin Bonus Power Guide: Why Raw Power Is Not Enough</title>
        <meta name="description" content="Discover how to effortlessly double your RollerCoin room's raw power via the Collection Bonus mechanic." />
        <link rel="canonical" href={`https://rollercoincalculator.app/${lang}/guides/bonus-power`} />
      </Helmet>

      <div className="static-back-link">
        <Link to={`/${lang}/guides`}>← Back to Guides</Link>
      </div>

      <article className="static-content guides-container">
        <h1>Bonus Power Guide - Why Raw Power Isn't Enough</h1>
        <p>You must abandon the classic mining mindset that focuses solely on raw Th/s or Ph/s figures. If you look at the top names on the Leaderboard, you will clearly see that a massive chunk of their power stems from the "Collection Bonus".</p>

        <h2>1. How is the Collection Bonus Calculated?</h2>
        <p>Every unique (different) miner you place on your racks in your rooms applies a bonus multiplier percentage (%) to the raw power in your entire room. If you own 2 instances of Miner X, the bonus applies <strong>only once (%x)</strong>. Because of this, "diversity" is far more important than "quantity".</p>
        <p>Let's say the total raw power of all miners in your room is 100 PH/s. If you add to your room an old event device that has very low raw power but giving a 1% bonus, your total bonus percentage jumps from 10% to 11%. This tiny increment instantly grants you an extra 1 PH/s of power in a 100 PH/s pool with absolutely zero electricity cost!</p>

        <h2>2. The "Price / Bonus Percentage" Tactics</h2>
        <p>Whenever you head to the Store or Marketplace, you should analyze not just a miner's raw power but how much Bonus it provides per RLT. Especially devices left over from older seasons (Season 1-5) that possess horrible power but are dropped to 1-2 RLT in the marketplace because they are seemingly 'garbage' are actually pure Bonus mines.</p>

        <h2>3. Conclusion</h2>
        <p>The most profitable players in RollerCoin are those who don't necessarily spend everything on expensive heavy miners but those who smartly collect hundreds of cheap unique bonus devices. Use our calculator to mathematically test your projected earnings by altering your assumed bonus percentage!</p>
      </article>
    </div>
  );
};

export default function BonusPowerGuide() {
  const { lang } = useParams<{ lang: string }>();
  return lang === 'tr' ? <BonusPowerGuideTR /> : <BonusPowerGuideEN />;
}
