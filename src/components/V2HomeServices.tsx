import { Link, useParams } from 'react-router-dom';
import './V2HomeServices.css';
export default function V2HomeServices() {
    const {lang='tr'}=useParams();
    const services=[
        {icon:'◷',title:'Günlük kazanç',text:'Mevcut hesaplayıcıyla günlük kripto ve RLT kazancını incele.',href:'#v2-calculator',tag:'Hesaplayıcı'},
        {icon:'▤',title:'Haftalık ve aylık',text:'Aynı hesabın haftalık ve aylık kazançlarını birlikte karşılaştır.',href:'#v2-calculator',tag:'Hesaplayıcı'},
        {icon:'◇',title:'Yıllık projeksiyon',text:'Özel dönem seçeneğinde 365 gün kullanarak kazanç projeksiyonu oluştur.',href:'#v2-calculator',tag:'Özel dönem'},
        {icon:'⌘',title:'Miner karşılaştırma',text:'Bağımsız miner karşılaştırma alanı sonraki geliştirmeler için ayrıldı.',tag:'Planlandı'},
        {icon:'ϟ',title:'Güç ve bonus',text:'Mevcut Güç Simülatörü sekmesinde güç ve bonus etkisini incele.',href:'#v2-calculator',tag:'Simülatör'},
        {icon:'♛',title:'En güçlü 10 oyuncu',text:'Doğrulanmış oyuncu sıralaması veri kaynağı bağlandığında açılacak.',tag:'Planlandı'},
    ];
    return <div className="v2-home-services"><section id="v2-tools" aria-labelledby="v2-services-title"><header><span>HESAPLA · KARŞILAŞTIR · PLANLA</span><h2 id="v2-services-title">Hesaplama ve analiz araçları</h2><p>Sitenin ana hizmetleri tek bir yerde.</p></header><div className="v2-service-grid">{services.map(service=><article key={service.title}><span className="v2-service-icon" aria-hidden="true">{service.icon}</span><span className="v2-service-status">{service.tag}</span><h3>{service.title}</h3><p>{service.text}</p>{service.href&&<a href={service.href}>Hesaplayıcıya git ↗</a>}</article>)}</div><nav className="v2-service-shortcuts" aria-label="Diğer hesaplama araçları"><Link to={`/${lang}/merges`}>Craft & Merge ↗</Link><Link to={`/${lang}/event`}>Etkinlikler ↗</Link><Link to={`/${lang}/charts`}>Lig grafikleri ↗</Link></nav></section><section className="v2-destinations" aria-label="Diğer bölümler"><Link to={`/${lang}/v2/sponsor-merkezi`}><span>YAYINCI & REKLAM</span><h2>Sponsor Merkezi ↗</h2><p>YouTube kanalları, Telegram toplulukları, yayıncı profilleri ve reklam başvuruları.</p></Link><Link to={`/${lang}/v2/club`}><span>ÜYELİK & TOPLULUK</span><h2>♛ ANGARALI CLUB ↗</h2><p>Üye profilin, rozetlerin ve gelecek topluluk alanları için kişisel merkezin.</p></Link></section></div>;
}
