import { Link, useParams } from 'react-router-dom';
import './SponsorshipCallout.css';
export default function SponsorshipCallout() {
    const {lang='tr'}=useParams();
    const center=`/${lang}/v2/sponsor-merkezi`;
    return <section className="sponsorship-callout" aria-labelledby="sponsorship-callout-title"><div><span className="sponsorship-callout-eyebrow">BİRLİKTE DAHA GÖRÜNÜR</span><h2 id="sponsorship-callout-title">Sponsorluk ve Reklam İş Birliği</h2><p>Kanalını, topluluğunu veya markanı oyuncularla buluştur. Sana uygun tanıtım alanını keşfet.</p></div><div className="sponsorship-callout-actions"><Link className="sponsorship-callout-primary" to={center+'#sponsor-packages-title'}>Reklam Paketlerini İncele <span aria-hidden="true">↗</span></Link><Link className="sponsorship-callout-secondary" to={center+'#basvuru'}>Yayıncı Olarak Katıl <span aria-hidden="true">→</span></Link></div></section>;
}
