import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useRegisterSW } from 'virtual:pwa-register/react';

// Silent update: a new SW waits until the user can't notice the reload —
// on the next route change, or while the tab is in the background.
export default function ServiceWorkerUpdater() {
  const location = useLocation();
  const previousPathnameRef = useRef(location.pathname);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (!r) return;
      setInterval(() => r.update(), 60 * 60 * 1000);
      // Returning to the tab is the cheapest moment to look for a new deploy.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') r.update();
      });
    },
  });

  // The plugin's 'controlling' reload is sometimes late; reload ourselves as a safety net.
  const applyUpdate = () => {
    updateServiceWorker(true);
    setTimeout(() => window.location.reload(), 2000);
  };

  // Route change: user expects a "page change" anyway.
  useEffect(() => {
    if (previousPathnameRef.current === location.pathname) return;
    previousPathnameRef.current = location.pathname;
    if (needRefresh) applyUpdate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, needRefresh]);

  // Background tab: reload happens off-screen.
  useEffect(() => {
    if (!needRefresh) return;
    const onHidden = () => {
      if (document.visibilityState === 'hidden') applyUpdate();
    };
    document.addEventListener('visibilitychange', onHidden);
    return () => document.removeEventListener('visibilitychange', onHidden);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needRefresh]);

  return null;
}
