import PublisherWorkspace from '../features/sponsors/PublisherWorkspace';
import PublisherTitles from '../features/sponsors/PublisherTitles';
import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSponsors } from '../services/sponsorStore';
import { eligibleSponsors } from '../utils/sponsorRotation';
import { SPONSOR_TIERS, type SponsorSocial } from '../types/sponsor';
import { useParams } from 'react-router-dom';
import './SponsorShowcase.css';
import SponsorCarousel, { SponsorLogo, SocialIcon } from './SponsorCarousel';
export function OfficialSponsor({ compact = false, goldOnly = false }: { compact?: boolean; goldOnly?: boolean }) { return <SponsorCarousel compact={compact} tier={goldOnly ? 'gold' : undefined} />; }
export default function SponsorShowcase() {
    const {lang='tr'}=useParams();
    const list=useSponsors();
    const [now,setNow]=useState(()=>Date.now());
    const [search,setSearch]=useState(''),[platform,setPlatform]=useState('all');
    useEffect(()=>{const timer=setInterval(()=>{if(document.visibilityState==='visible')setNow(Date.now());},8000);return()=>clearInterval(timer);},[]);
    const sponsors=eligibleSponsors(list,now).filter(s=>(s.name+' '+s.description).toLocaleLowerCase('tr').includes(search.toLocaleLowerCase('tr'))&&(platform==='all'||Boolean(s.socials[platform as SponsorSocial])));
    return <section className="publisher-directory" id="tum-sponsorlar" aria-labelledby="discover-creators-heading">
        <header className="publisher-directory-heading"><div><span className="sponsor-eyebrow">TOPLULUĞUN SESLERİ</span><h1 id="discover-creators-heading">Yayıncılar</h1><p>İçerikleri keşfet. Kanalları takip et. Toplulukla bağlantı kur.</p></div><Link to={'/'+lang+'/v2/sponsorluk#publisher-titles-heading'}>Yayıncı olarak katıl ↗</Link></header>
        <div className="publisher-directory-toolbar"><label><span>Yayıncı ara</span><input type="search" placeholder="Kanal veya yayıncı adı" value={search} onChange={e=>setSearch(e.target.value)}/></label><div role="group" aria-label="Platform filtresi">{[['all','Tümü'],['youtube','YouTube'],['x','X'],['tiktok','TikTok'],['instagram','Instagram']].map(([key,label])=><button type="button" key={key} aria-pressed={platform===key} onClick={()=>setPlatform(key)}>{label}</button>)}</div></div>
        <div className="publisher-directory-grid">{sponsors.map(s=><article className={"publisher-profile-card publisher-profile-tier-"+s.tier} key={s.id} id={'publisher-'+s.id}><div className="publisher-profile-cover"><span>{SPONSOR_TIERS[s.tier].label}</span></div><div className="publisher-profile-content"><SponsorLogo sponsor={s}/><h2>{s.name}</h2><p>{s.description}</p><div className="publisher-profile-socials">{(Object.entries(s.socials) as [SponsorSocial,string][]).filter(([,url])=>url).map(([type,url])=><a key={type} href={url} target="_blank" rel="noopener noreferrer" aria-label={s.name+' '+type}><SocialIcon type={type}/><span>{type==='youtube'?'YouTube':type==='tiktok'?'TikTok':type==='x'?'X':'Instagram'}</span></a>)}</div><a className="publisher-profile-visit" href={s.url} target="_blank" rel="noopener noreferrer">Kanalı ziyaret et <span aria-hidden="true">↗</span></a></div></article>)}</div>
        {!sponsors.length&&<p className="publisher-directory-empty">Bu filtreye uygun yayıncı bulunamadı.</p>}
    </section>;
}
export function SponsorCenterLanding({ sponsorship = false }: { sponsorship?: boolean }) {
    const {lang='tr'}=useParams();
    const tr=lang==='tr';
    const {isLoading,isAuthenticated,isAdmin,user}=useAuth();
    const canManage=isAuthenticated&&(isAdmin||user?.roles.some(role=>['Publisher','Sponsor'].includes(role)));
    if(!sponsorship&&isLoading)return <p role="status">Yetki kontrol ediliyor…</p>;
    if(!sponsorship&&!canManage)return <Navigate to={'/'+lang+'/v2/sponsorluk'} replace/>;
    return <div className="sponsor-showcase sponsor-center-landing"><header className="sponsor-center-intro"><span className="sponsor-eyebrow">YAYINCI · TANITIM · REKLAM</span><h1>{sponsorship?'Sponsorluk ve İş Birliği':tr?'Sponsor Merkezi':'Sponsor Center'}</h1><p>{tr?'YouTube kanalları, Telegram toplulukları ve içerik üreticileri için tanıtım alanı.':'Promotion space for channels, communities and creators.'}</p><nav className="sponsor-center-tabs" aria-label="Sponsor Merkezi alanları"><Link to={"/"+lang+"/v2/yayincilar"}>Yayıncıları Keşfet</Link><Link to={"/"+lang+"/v2/sponsorluk#sponsor-packages-title"}>Reklam Paketleri</Link>{canManage&&<Link to={"/"+lang+"/v2/sponsor-merkezi#yayinci-alanim"}>Yayıncı Alanım</Link>}</nav></header>{!sponsorship&&<><PublisherWorkspace/></>}{sponsorship&&<><PublisherTitles/><section className="sponsor-packages" aria-labelledby="sponsor-packages-title"><header className="sponsor-section-header"><div><span className="sponsor-eyebrow">SANA UYGUN ALANI SEÇ</span><h2 id="sponsor-packages-title">Tanıtım alanları</h2></div></header><div className="sponsor-placeholder-grid">{[{title:'Resmî Site Sponsorları',text:'Uzun süreli iş birlikleri ve resmî sponsor vitrini.',badge:'RESMÎ SPONSOR'},{title:'Ücretli Tanıtım',text:'Kanal, video veya topluluk tanıtımı için süreli reklam alanı.',badge:'SPONSORLU İÇERİK'},{title:'Topluluk Yayıncıları',text:'Ücretsiz temel yayıncı rehberi için ayrılan alan.',badge:'TOPLULUK'}].map(item=><article className="sponsor-placeholder" key={item.title}><span className="sponsor-platform">{item.badge}</span><h3>{item.title}</h3><p>{item.text}</p><small>Başvuru ve yayın detayları görüşülerek belirlenir.</small></article>)}</div></section><section className="sponsor-application-info" id="basvuru"><h2>Kendi Kanalını Tanıt</h2><p>Kanal veya topluluk bağlantını ve tanıtmak istediğin içeriği e-posta ile iletebilirsin.</p><a href="mailto:support@rollercoincalculator.app?subject=Sponsorluk%20ve%20kanal%20tanitimi">E-posta ile başvur ↗</a><small>Fiyatlandırma daha sonra belirlenecek. Bu alan ödeme almaz ve otomatik reklam yayını yapmaz.</small></section></>}</div>;
}
