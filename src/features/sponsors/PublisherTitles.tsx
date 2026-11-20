import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './PublisherTitles.css';

export default function PublisherTitles() {
    const { lang = 'tr' } = useParams();
    const { user, isAuthenticated, isAdmin } = useAuth();
    const [open, setOpen] = useState(false);
    const [channel, setChannel] = useState('');
    const [note, setNote] = useState('');
    const [prepared, setPrepared] = useState(false);
    const publisher = isAuthenticated && (isAdmin || user?.roles.includes('Publisher'));
    function prepare(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const field = event.currentTarget.elements.namedItem('channel') as HTMLInputElement;
        try {
            const url = new URL(channel);
            if (url.protocol !== 'https:' || url.username || url.password) throw new Error();
            field.setCustomValidity('');
        } catch {
            field.setCustomValidity('Geçerli bir HTTPS kanal bağlantısı gir.');
            field.reportValidity();
            return;
        }
        setPrepared(true);
    }
    return <section className="publisher-titles" aria-labelledby="publisher-titles-heading">
        <header><div><span>HESABINA BAĞLI ÜNVANLAR</span><h2 id="publisher-titles-heading">Ünvanlar ve Başvuru</h2></div>{isAdmin && <Link to={`/${lang}/admin/users`}>Kullanıcı rollerini yönet ↗</Link>}</header>
        <div className="publisher-title-grid">
            <article><span className="publisher-title-symbol" aria-hidden="true">◈</span><h3>Topluluk Üyesi</h3><p>Mevcut site hesabınla topluluğa katıl.</p><small>{isAuthenticated ? 'Hesabınla giriş yaptın' : 'Site hesabı gerekir'}</small></article>
            <article><span className="publisher-title-symbol" aria-hidden="true">▶</span><h3>Yayıncı</h3><p>Kanalını tanıt, yayıncı alanından içeriklerini yönet.</p><small>{publisher ? 'Yayıncı alanına erişimin var' : 'Ödeme doğrulaması ve yönetici onayı gerekir'}</small>{!publisher && <button type="button" aria-expanded={open} onClick={() => setOpen(value => !value)}>{open ? 'Başvuruyu kapat' : 'Yayıncı ünvanına başvur'}</button>}</article>
            <article className="publisher-title-gold"><span className="publisher-title-symbol" aria-hidden="true">♛</span><h3>Resmî Sponsor</h3><p>Ana sayfanın Gold vitrininde ayrı sponsorluk anlaşmasıyla yer al.</p><small>Yayıncı rolünden bağımsız sponsorluk hakkı</small><Link to={"/"+lang+"/v2/sponsorluk#basvuru"}>Sponsorluk detayları →</Link></article>
        </div>
        {open && <div className="publisher-title-application">{!isAuthenticated ? <p>Mevcut hesabınla <Link to={`/${lang}/login`}>giriş yap</Link>. Ayrı bir yayıncı hesabı açman gerekmez.</p> : <form onSubmit={prepare} onChange={() => setPrepared(false)}><h3>Yayıncı başvuru taslağı</h3><label>Kanal / topluluk bağlantısı<input name="channel" type="url" required maxLength={500} placeholder="https://…" value={channel} onChange={event => { event.target.setCustomValidity(''); setChannel(event.target.value); }}/></label><label>Kendini kısaca tanıt<textarea rows={3} maxLength={500} value={note} onChange={event => setNote(event.target.value)}/></label><button type="submit">Başvuru taslağını hazırla</button>{prepared && <div role="status"><b>Taslak hazır · gönderilmedi</b><p>{channel}</p><p>{note}</p><small>Başvuru gönderimi backend bağlantısını bekliyor. Bu işlem hesabına rol vermez.</small></div>}</form>}</div>}
        <p className="publisher-title-footnote">Ücretli ünvanlar ödeme doğrulaması ve yönetici onayından sonra etkinleşir. Ödeme tek başına ünvan vermez. Ünvanlar kullanıcı tarafından etkinleştirilemez. Yönetici, mevcut rol panelinde sunucuda tanımlı Publisher rolünü atar; Gold sponsorluğu ayrıca yönetilir.</p>
    </section>;
}
