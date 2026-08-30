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
          console.log('Checking for SW updates...');
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
    // Sadece pathname gerçekten değiştiğinde (kullanıcı linke tıkladığında) kontrol et.
    // needRefresh true olduğunda arka planda tetiklenmesini engelliyoruz.
    if (previousPathnameRef.current !== location.pathname) {
      previousPathnameRef.current = location.pathname;
      
      if (needRefresh) {
        console.log('Route changed and update is pending. Applying new SW now...');
        updateServiceWorker(true);
      }
    }
  }, [location.pathname, needRefresh, updateServiceWorker]);

  return null;
}
