import SponsorshipCallout from './components/SponsorshipCallout';
import MemberMenu from './features/club/MemberMenu';
import SponsorShowcase, { OfficialSponsor } from './components/SponsorShowcase';
import { SponsorCenterLanding } from './components/SponsorShowcase';
import V2HomeServices from './components/V2HomeServices';
import { CalculatorArea } from './App';
import { lazy, useEffect, useRef, useState, Suspense } from 'react';
import { useAuth } from './contexts/AuthContext';
import { Link, useLocation, useParams } from 'react-router-dom';
import appLogo from './assets/logo.png';
import './HomeV2.css';
import './features/club/ClubPage.css';

const ClubPage = lazy(() => import('./features/club/ClubPage'));
const SponsorAdmin = lazy(() => import('./components/SponsorAdmin'));
export default function HomeV2({ sponsorCenter = false, sponsorAdmin = false, club = false, sponsorship = false, publishers = false }: { sponsorCenter?: boolean; sponsorAdmin?: boolean; club?: boolean; sponsorship?: boolean; publishers?: boolean }) {
    const { isAdmin, isAuthenticated, user } = useAuth();
    const canManageSponsors=isAuthenticated&&(isAdmin||user?.roles.some(role=>['Publisher','Sponsor'].includes(role)));
    const [menuOpen,setMenuOpen] = useState(false);
    const menuRef=useRef<HTMLDivElement>(null);
    const menuButton=useRef<HTMLButtonElement>(null);
    useEffect(()=>{if(!menuOpen)return;const outside=(event:PointerEvent)=>{if(!menuRef.current?.contains(event.target as Node))setMenuOpen(false);};const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){setMenuOpen(false);menuButton.current?.focus();}};document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};},[menuOpen]);
    useEffect(() => { const previous = document.title; document.title = club ? 'ANGARALI CLUB' : sponsorAdmin ? 'Sponsor Yönetimi · V2 VOL' : sponsorCenter ? 'Sponsor Merkezi · V2 VOL' : 'V2 VOL'; return () => { document.title = previous; }; }, [sponsorCenter, sponsorAdmin, club]);
    const { lang = 'tr' } = useParams<{ lang: string }>();
    const location = useLocation();
    useEffect(() => { if (!location.hash) { window.scrollTo({ top: 0, behavior: 'instant' }); return; } const frame = requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: 'start' })); return () => cancelAnimationFrame(frame); }, [location.pathname, location.hash, sponsorCenter, sponsorAdmin]);
    return <div className={`v2-blank-page ${club ? 'v2-club-page' : ''}`}>
        <header className="v2-blank-header"><Link className="v2-brand-logo" to={'/'+lang} aria-label={lang==='tr'?'Ana sayfa':'Home'}><img src={appLogo} alt="" /></Link>
            <div className="v2-overflow" ref={menuRef}><button ref={menuButton} type="button" className="v2-overflow-trigger" aria-label={lang==='tr'?'Kategoriler menüsü':'Categories menu'} aria-expanded={menuOpen} aria-controls="v2-category-menu" onClick={()=>setMenuOpen(value=>!value)}><span className="v2-menu-desktop" aria-hidden="true">⋯</span><span className="v2-menu-mobile" aria-hidden="true">☰</span></button>{menuOpen&&<nav className="v2-overflow-panel" id="v2-category-menu" aria-label={lang==='tr'?'Kategoriler':'Categories'} onClick={()=>setMenuOpen(false)}><span>{lang==='tr'?'KATEGORİLER':'CATEGORIES'}</span><Link to={"/"+lang+"/v2/yayincilar"}>Yayıncılar</Link><Link to={'/'+lang+'/v2#v2-tools'}>{lang==='tr'?'Tüm kategoriler':'All categories'}</Link><Link to={'/'+lang+'/merges'}>Craft & Merge</Link><Link to={'/'+lang+'/event'}>{lang==='tr'?'Etkinlik Hesaplayıcı':'Event calculator'}</Link><Link to={'/'+lang+'/charts'}>{lang==='tr'?'Lig Grafikleri':'League charts'}</Link>{canManageSponsors&&<Link to={'/'+lang+'/v2/sponsor-merkezi'}>{lang==='tr'?'Sponsor Merkezi':'Sponsor Center'}</Link>}<Link to={'/'+lang+'/v2/sponsorluk'}>{lang==='tr'?'Sponsorluk':'Sponsorship'}</Link><Link className="v2-club-link" to={'/'+lang+'/v2/club'}><span aria-hidden="true">♛</span>ANGARALI CLUB</Link>{isAdmin&&isAuthenticated&&<Link to={'/'+lang+'/v2/sponsor-yonetimi'}>Sponsor yönetimi</Link>}<Link to={'/'+lang}>{lang==='tr'?'Klasik ana sayfa':'Classic home'} ↗</Link></nav>}</div>
            <span>V2 VOL</span><nav className="v2-desktop-nav" aria-label="Topluluk"><Link to={"/"+lang+"/v2/yayincilar"}>Yayıncılar</Link>{canManageSponsors&&<Link to={'/'+lang+'/v2/sponsor-merkezi'}>Sponsor Merkezi</Link>}<Link to={'/'+lang+'/v2/sponsorluk'}>Sponsorluk</Link></nav><MemberMenu key={(user?.userId || 'guest')+location.pathname} /><Link className="v2-home-link" to={'/'+lang}>{lang==='tr'?'Ana sayfaya dön':'Back to home'} ↗</Link>
        </header>
        <main className="v2-blank-canvas" aria-label="V2 VOL"><div className="v2-input-panel">{club ? <Suspense fallback={<p>Üye Merkezi yükleniyor…</p>}><ClubPage /></Suspense> : sponsorAdmin ? <Suspense fallback={<p>Yönetim yükleniyor…</p>}><SponsorAdmin /></Suspense> : publishers ? <SponsorShowcase /> : (sponsorCenter || sponsorship) ? <SponsorCenterLanding sponsorship={sponsorship} /> : <><div className="v2-platform-intro"><span>ROLLERCOIN TOPLULUĞU</span><h1>RollerCoin için <em>Kazanç ve Güç</em> Hesaplayıcı</h1><p>Hesapla · Analiz Et · Karşılaştır · Destekle</p></div><div id="v2-calculator"><CalculatorArea afterResults={<><div className="v2-home-sponsor"><OfficialSponsor compact goldOnly /></div><SponsorshipCallout /><V2HomeServices /></>} /></div></>}</div></main>
    </div>;
}
