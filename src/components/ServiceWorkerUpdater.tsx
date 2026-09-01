import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useRegisterSW } from 'virtual:pwa-register/react';

export default function ServiceWorkerUpdater() {
  const location = useLocation();
  const previousPathnameRef = useRef(location.pathname);
  
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        console.log('SW Registered. Will check for updates every hour.');
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000);
      }
    },
    onNeedRefresh() {
      console.log('New Service Worker update detected! Waiting for route change to apply...');
    },
    onOfflineReady() {
      console.log('App is ready for offline use.');
    }
  });

  useEffect(() => {
    if (previousPathnameRef.current !== location.pathname) {
      previousPathnameRef.current = location.pathname;
      
      if (needRefresh) {
        console.log('Route changed and update is pending. Applying new SW now...');
        // updateServiceWorker, SW'ye SKIP_WAITING mesajı gönderir.
        // Eklentinin "controlling" event'ı sayfayı otomatik yeniler.
        // Ama controlling event'ı asenkron çalıştığı için bazen bir sonraki
        // navigasyonda yakalanıyordu. Bunu çözmek için SW kontrolü devralana
        // kadar kısa bir süre bekleyip, kontrolün devralınıp devralınmadığını
        // kontrol ediyoruz. Eğer devralınmadıysa biz kendimiz reload yapıyoruz.
        updateServiceWorker(true);
        
        // Güvenlik ağı: Eğer controlling event 2 saniye içinde reload tetiklemediyse,
        // biz kendimiz reload yapalım. Bu sayede 3. sayfaya geçmeden güncellenir.
        setTimeout(() => {
          console.log('Safety net: reloading page for SW update.');
          window.location.reload();
        }, 2000);
      }
    }
  }, [location.pathname, needRefresh, updateServiceWorker]);

  return null;
}
