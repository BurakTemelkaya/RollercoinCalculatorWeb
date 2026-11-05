import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSponsors, recordSponsorClick, recordSponsorImpression, recordSponsorVisibleTime } from '../services/sponsorStore';
import { eligibleSponsors, nextSponsor } from '../utils/sponsorRotation';
import { SPONSOR_TIERS, type Sponsor, type SponsorSocial, type SponsorTier } from '../types/sponsor';
import './SponsorCarousel.css';
const INTERVAL = 8000;
const socialLabels: Record<SponsorSocial,string> = { youtube:'YouTube', instagram:'Instagram', x:'X', tiktok:'TikTok' };
function SocialIcon({type}: {type: SponsorSocial}) {
    if(type === 'youtube') return <svg viewBox="0 0 24 20" aria-hidden="true"><rect x="1" y="2" width="22" height="16" rx="5" fill="currentColor"/><path d="m10 6 6 4-6 4Z" fill="#111622"/></svg>;
    if(type === 'instagram') return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>;
    return <span aria-hidden="true">{type==='x'?'𝕏':'♪'}</span>;
}
export function SponsorLogo({sponsor, small=false}: {sponsor:Sponsor;small?:boolean}) {
    const [failed,setFailed] = useState(false);
    return <span className={'sc-logo'+(small?' sc-logo-small':'')}>{sponsor.logoUrl && !failed ? <img src={sponsor.logoUrl} alt={sponsor.name+' logo'} width="72" height="72" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/> : <span aria-hidden="true">{sponsor.name.trim().split(/\s+/).slice(0,2).map(word=>word[0]).join('').toUpperCase()}</span>}{sponsor.tier==='gold'&&<svg className="sc-crown" viewBox="0 0 40 20" aria-hidden="true"><path d="m3 4 9 6 8-8 8 8 9-6-4 13H7Z" fill="none" stroke="currentColor" strokeWidth="1.6"/></svg>}</span>;
}
function useEligibleSponsors(list:Sponsor[]) {
    const [now,setNow]=useState(()=>Date.now());
    useEffect(()=>{let timer:ReturnType<typeof setInterval>|undefined;const start=()=>{if(timer)clearInterval(timer);if(document.visibilityState==='visible')timer=setInterval(()=>setNow(Date.now()),1000);};const visibility=()=>{setNow(Date.now());start();};start();document.addEventListener('visibilitychange',visibility);return()=>{if(timer)clearInterval(timer);document.removeEventListener('visibilitychange',visibility);};},[]);
    return useMemo(()=>eligibleSponsors(list,now),[list,now]);
}
export default function SponsorCarousel({ compact = false, tier }: { compact?: boolean; tier?: SponsorTier }) {
    const {lang='tr'}=useParams<{lang:string}>();const tr=lang==='tr';
    const activeSponsors=useEligibleSponsors(useSponsors());
    const sponsors=useMemo(()=>tier?activeSponsors.filter(s=>s.tier===tier):activeSponsors,[activeSponsors,tier]);
    const [selection,setSelection]=useState({id:'',revision:0});
    const sponsor=sponsors.find(s=>s.id===selection.id)??sponsors[0];
    const [hovered,setHovered]=useState(false),[focused,setFocused]=useState(false),[stopped,setStopped]=useState(false);
    const [pageVisible,setPageVisible]=useState(()=>document.visibilityState==='visible'),[inView,setInView]=useState(false);
    const [announcement,setAnnouncement]=useState('');
    const root=useRef<HTMLElement>(null),scores=useRef<Record<string,number>>({}),touch=useRef<{x:number;y:number}|null>(null),swiped=useRef(false);
    const paused=hovered||focused||stopped||!pageVisible||!inView;
    const change=useCallback((direction:'next'|'previous'|'first'|'last',manual=true)=>{
        if(!sponsors.length)return;
        const index=sponsors.findIndex(s=>s.id===sponsor?.id);
        const id=direction==='next'&&!manual ? nextSponsor(sponsors,sponsor?.id??'',scores.current) : sponsors[direction==='first'?0:direction==='last'?sponsors.length-1:(index+(direction==='previous'?-1:1)+sponsors.length)%sponsors.length].id;
        if(id){setSelection(value=>({id,revision:value.revision+1}));if(manual)setAnnouncement((tr?'Sponsor: ':'Sponsor: ')+(sponsors.find(s=>s.id===id)?.name??''));}
    },[sponsors,sponsor?.id,tr]);
    const nextRef=useRef(change);useEffect(()=>{nextRef.current=change;},[change]);
    useEffect(()=>{const onVisibility=()=>setPageVisible(document.visibilityState==='visible');document.addEventListener('visibilitychange',onVisibility);const observer=new IntersectionObserver(entries=>setInView(entries[0]?.isIntersecting===true&&entries[0].intersectionRatio>=.5),{threshold:[0,.5,1]});if(root.current)observer.observe(root.current);return()=>{observer.disconnect();document.removeEventListener('visibilitychange',onVisibility);};},[]);
    const cycle=(sponsor?.id??'')+':'+selection.revision;
    const timerState=useRef({cycle:'',remaining:INTERVAL});
    useEffect(()=>{if(timerState.current.cycle!==cycle)timerState.current={cycle,remaining:INTERVAL};if(paused||sponsors.length<2)return;const started=performance.now(),remaining=timerState.current.remaining;const timer=setTimeout(()=>nextRef.current('next',false),remaining);return()=>{clearTimeout(timer);timerState.current.remaining=Math.max(1,remaining-(performance.now()-started));};},[cycle,paused,sponsors.length]);
    const sponsorId=sponsor?.id;
    const viewable=inView&&pageVisible&&!!sponsorId;
    useEffect(()=>{if(!viewable||!sponsorId)return;const id=sponsorId,started=performance.now();const timer=setTimeout(()=>recordSponsorImpression(id),1000);return()=>{clearTimeout(timer);recordSponsorVisibleTime(id,performance.now()-started);};},[sponsorId,viewable]);
    const click=()=>{if(viewable&&sponsor)recordSponsorClick(sponsor.id);};
    return <section ref={root} className={'sc-carousel sc-tier-'+(sponsor?.tier??'standard')+(compact?' sc-compact':'')} style={{'--sc-brand':sponsor?.accent??'#e5bd70'} as CSSProperties} aria-roledescription={tr?'sponsor vitrini':'sponsor carousel'} aria-label={tr?'Sponsorlu Reklam Alanı':'Sponsored advertising'} tabIndex={sponsors.length>1?0:undefined}
        onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} onFocusCapture={()=>setFocused(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget))setFocused(false);}}
        onKeyDown={event=>{if(sponsors.length<2)return;const key={ArrowRight:'next',ArrowLeft:'previous',Home:'first',End:'last'}[event.key] as 'next'|'previous'|'first'|'last'|undefined;if(key){event.preventDefault();change(key);}}}
        onPointerDown={event=>{swiped.current=false;if(event.pointerType==='touch'||event.pointerType==='pen')touch.current={x:event.clientX,y:event.clientY};}}
        onPointerCancel={()=>{touch.current=null;}} onPointerUp={event=>{const start=touch.current;touch.current=null;if(!start||sponsors.length<2)return;const dx=event.clientX-start.x,dy=event.clientY-start.y;if(Math.abs(dx)>=45&&Math.abs(dx)>Math.abs(dy)){swiped.current=true;change(dx<0?'next':'previous');}}}
        onClickCapture={event=>{if(swiped.current){event.preventDefault();event.stopPropagation();swiped.current=false;}}}>
        <header className="sc-heading"><div><span className="sc-ad-label">{tr?'SPONSORLU İÇERİK':'SPONSORED CONTENT'}</span><h2>{tr?'Sponsorlu Reklam Alanı':'Sponsor showcase'}</h2></div><Link to={'/'+lang+'/v2/sponsor-merkezi#tum-sponsorlar'}>{tr?'Tüm Sponsorlar':'All sponsors'} ↗</Link></header>
        {sponsor ? <article className="sc-slide" key={cycle} role="group" aria-roledescription={tr?'slayt':'slide'} aria-label={sponsor.name+' · '+(sponsors.indexOf(sponsor)+1)+' / '+sponsors.length}>
            <SponsorLogo key={sponsor.id+sponsor.logoUrl} sponsor={sponsor}/><div className="sc-identity"><span className="sc-tier-label">{sponsor.tier==='gold'?'♛ ':''}{SPONSOR_TIERS[sponsor.tier].label}</span><h3>{sponsor.name}</h3><p>{sponsor.description}</p></div>
            <div className="sc-links"><div className="sc-socials">{(Object.entries(sponsor.socials) as [SponsorSocial,string][]).filter(([type,url])=>socialLabels[type]&&url).map(([type,url])=><a key={type} href={url} aria-label={sponsor.name+' · '+socialLabels[type]} target="_blank" rel="noopener noreferrer" onClick={click}><SocialIcon type={type}/></a>)}</div>{sponsor.url&&<a className="sc-visit" href={sponsor.url} target="_blank" rel="noopener noreferrer" onClick={click}>{tr?'Kanalı Ziyaret Et':'Visit sponsor'} <span aria-hidden="true">↗</span></a>}</div>
        </article> : <div className="sc-empty"><span aria-hidden="true">◇</span><h3>{tr?'Sponsor alanı hazır':'Sponsor space available'}</h3><p>{tr?'Şu anda yayında olan sponsor yok.':'No sponsors are currently running.'}</p></div>}
        {sponsors.length>1&&<div className="sc-controls"><button type="button" onClick={()=>change('previous')} aria-label={tr?'Önceki sponsor':'Previous sponsor'}>‹</button><div className="sc-dots" aria-label={tr?'Sponsor seçimi':'Choose sponsor'}>{sponsors.map((item,index)=><button key={item.id} type="button" aria-label={(tr?'Sponsor ':'Sponsor ')+(index+1)+': '+item.name} aria-current={item.id===sponsor?.id?'true':undefined} onClick={()=>{setSelection(value=>({id:item.id,revision:value.revision+1}));setAnnouncement(item.name);}} />)}</div><button type="button" onClick={()=>change('next')} aria-label={tr?'Sonraki sponsor':'Next sponsor'}>›</button><button type="button" className="sc-pause" aria-pressed={stopped} onClick={()=>setStopped(value=>!value)}>{stopped?(tr?'Devam et':'Resume'):(tr?'Duraklat':'Pause')}</button></div>}
        {sponsors.length>1&&<div className="sc-progress" aria-hidden="true"><span key={cycle} style={{animationDuration:INTERVAL+'ms',animationPlayState:paused?'paused':'running'}}/></div>}
        <span className="sc-sr-only" role="status" aria-live="polite">{announcement}</span>
    </section>;
}
export function AllSponsors() {
    const {lang='tr'}=useParams<{lang:string}>();const sponsors=useEligibleSponsors(useSponsors());
    return <section className="sc-all" id="tum-sponsorlar"><h2>{lang==='tr'?'Tüm Sponsorlar':'All sponsors'}</h2>{!sponsors.length&&<p>{lang==='tr'?'Şu anda aktif sponsor bulunmuyor.':'No active sponsors.'}</p>}<div>{sponsors.map(s=><article key={s.id} className={'sc-all-card sc-tier-'+s.tier}><SponsorLogo key={s.id+s.logoUrl} sponsor={s} small/><div><span className="sc-tier-label">{SPONSOR_TIERS[s.tier].label}</span><h3>{s.name}</h3><p>{s.description}</p></div><a href={s.url||Object.values(s.socials).find(Boolean)} target="_blank" rel="noopener noreferrer">{lang==='tr'?'Ziyaret et':'Visit'} ↗</a></article>)}</div></section>;
}
