import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { clubApiEnabled, getClubProfile } from './api';
import type { ClubProfile } from './model';
import './MemberMenu.css';
export default function MemberMenu() {
    const {lang='tr'}=useParams();
    const location=useLocation();
    const {user,isAuthenticated,isLoading,isAdmin,getValidToken,logout}=useAuth();
    const [open,setOpen]=useState(false),[profile,setProfile]=useState<ClubProfile|null>(null),[failedAvatar,setFailedAvatar]=useState(false);
    const [demo,setDemo]=useState(import.meta.env.DEV);
    const demoView=demo&&!isAuthenticated;
    const root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null);
    useEffect(()=>{ if(!isAuthenticated||!clubApiEnabled)return; const controller=new AbortController(); void(async()=>{try {const token=await getValidToken();if(!token||controller.signal.aborted)return;const p=await getClubProfile(token,controller.signal);if(!controller.signal.aborted&&p?.userId===user?.userId)setProfile(p);}catch{/* Existing site account stays usable while Club API is unavailable. */}})();return()=>controller.abort(); },[isAuthenticated,user?.userId,getValidToken,location.pathname]);
    useEffect(()=>{if(!open)return;const outside=(e:PointerEvent)=>{if(!root.current?.contains(e.target as Node))setOpen(false);};const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);trigger.current?.focus();}};document.addEventListener('pointerdown',outside);document.addEventListener('keydown',key);return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',key);};},[open]);
    const clubPath=`/${lang}/v2/club`;
    const query='?returnTo='+encodeURIComponent(clubPath);
    return <div className="club-account-menu" ref={root} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setOpen(false);}}><button ref={trigger} className="club-account-trigger" type="button" aria-label="ANGARALI CLUB hesap menüsü" aria-expanded={open} aria-controls="club-account-panel" onClick={()=>setOpen(v=>!v)}><span className="club-account-avatar">{profile?.avatarUrl&&!failedAvatar?<img src={profile.avatarUrl} alt="" referrerPolicy="no-referrer" onError={()=>setFailedAvatar(true)}/>:<span aria-hidden="true">♛</span>}</span><span><b>{demoView?'ANGARALI':isAuthenticated?(profile?.displayName||'Üye Merkezi'):'ANGARALI CLUB'}</b><small>{demoView?'ANGARALI CLUB · Önizleme':isLoading?'Oturum kontrol ediliyor…':isAuthenticated?'ANGARALI CLUB':'Üyelik ve topluluk'}</small></span><span aria-hidden="true">⌄</span></button>{open&&<nav className="club-account-panel" id="club-account-panel" aria-label="Üye hesabı" onClick={()=>setOpen(false)}><span className="club-account-label">{demoView?'@angarali · Tasarım önizlemesi':profile?'@'+profile.username:'ANGARALI CLUB'}</span><Link to={demoView?clubPath+'?preview=1':clubPath}>♛ {isAuthenticated||demoView?'Profilim ve Üye Merkezi':'Club’ı keşfet'}</Link>{demoView?<><Link to={clubPath+'?preview=1'}>◇ Üye kartım</Link><Link to={`/${lang}/forgot-password`}>? Şifremi unuttum</Link><button type="button" className="club-account-logout" onClick={()=>setDemo(false)}>↪ Önizlemeden çık</button></>:isAuthenticated?<><Link to={`/${lang}/notification-settings`}>♧ Bildirim ayarları</Link><Link to={`/${lang}/my-blogs`}>▤ Yazılarım</Link><Link to={`/${lang}/change-password`}>⚙ Hesap güvenliği</Link>{isAdmin&&<Link to={`/${lang}/v2/sponsor-yonetimi`}>◇ Sponsor yönetimi</Link>}<button type="button" className="club-account-logout" onClick={()=>void logout()}>↪ Çıkış yap</button></>:<><Link to={`/${lang}/login${query}`}>↪ Giriş yap</Link><Link to={`/${lang}/register${query}`}>+ Kayıt ol</Link><Link to={`/${lang}/forgot-password`}>? Şifremi unuttum</Link></>}</nav>}</div>;
}
