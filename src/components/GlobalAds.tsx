import React, { useEffect, useState } from 'react';

interface GlobalAdsProps {
  adsBlocked: boolean;
}

export const GlobalAds: React.FC<GlobalAdsProps> = ({ adsBlocked }) => {
  const [country, setCountry] = useState<string | null>(null);
  const [mobileAdVisible, setMobileAdVisible] = useState(true);

  // Fetch user country using geojs API
  useEffect(() => {
    fetch('https://get.geojs.io/v1/ip/country.json')
      .then(res => res.json())
      .then(data => setCountry(data.country))
      .catch(() => setCountry('UNKNOWN')); // If adblocker blocks geojs, default to UNKNOWN
  }, []);

  // Inject Coinzilla ads if necessary
  useEffect(() => {
    if (adsBlocked || !country) return;

    // We wait slightly to ensure React has mounted the divs before pushing to coinzilla
    const timer = setTimeout(() => {
      const isTR = country === 'TR';
      const showCoinzilla = isTR || country === 'UNKNOWN';

      if (showCoinzilla) {
        (window as any).coinzilla_display = (window as any).coinzilla_display || [];
        // Left
        (window as any).coinzilla_display.push({ zone: "24569e7101752ae238", width: "160", height: "600" });
        // Right
        (window as any).coinzilla_display.push({ zone: "24569e7101752ae238", width: "160", height: "600" });
        // Mobile
        if (mobileAdVisible) {
          (window as any).coinzilla_display.push({ zone: "4176a2678c2d7dc7660", width: "320", height: "50" });
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [country, adsBlocked, mobileAdVisible]);

  if (adsBlocked || !country) return null;

  const isTR = country === 'TR';
  const showCoinzilla = isTR || country === 'UNKNOWN';

  return (
    <>
      {/* Desktop Left Sticky */}
      <div className="desktop-side-ad" style={{ position: 'absolute', zIndex: 99999, pointerEvents: 'none' }}>
        <div style={{ paddingTop: 0, paddingBottom: 0 }}>
          <div style={{ width: 'max(170px, calc((100vw - 1200px) / 2))', height: '100%', position: 'fixed', top: 0, left: 0 }}>
            <div id="left-side-ad-container" style={{ width: '160px', height: '600px', position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: 0, right: 0, margin: 'auto', zIndex: 99998, pointerEvents: 'auto' }}>
              {showCoinzilla ? (
                <div className="coinzilla" data-zone="C-24569e7101752ae238"></div>
              ) : (
                <iframe data-aa='2429727' src='//ad.a-ads.com/2429727/?size=160x600&background_color=1e2433&title_color=fffffe' style={{ border: 0, padding: 0, width: '160px', height: '600px', overflow: 'hidden', display: 'block', margin: 'auto' }}></iframe>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Right Sticky */}
      <div className="desktop-side-ad" style={{ position: 'absolute', zIndex: 99999, pointerEvents: 'none' }}>
        <div style={{ paddingTop: 0, paddingBottom: 0 }}>
          <div style={{ width: 'max(170px, calc((100vw - 1200px) / 2))', height: '100%', position: 'fixed', top: 0, right: 0 }}>
            <div id="right-side-ad-container" style={{ width: '160px', height: '600px', position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: 0, right: 0, margin: 'auto', zIndex: 99998, pointerEvents: 'auto' }}>
              {showCoinzilla ? (
                <div className="coinzilla" data-zone="C-24569e7101752ae238"></div>
              ) : (
                <iframe data-aa='2429727' src='//ad.a-ads.com/2429727/?size=160x600&background_color=1e2433&title_color=fffffe' style={{ border: 0, padding: 0, width: '160px', height: '600px', overflow: 'hidden', display: 'block', margin: 'auto' }}></iframe>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom */}
      {mobileAdVisible && (
        <div className="aads-mobile-only" style={{ position: 'fixed', zIndex: 99999, bottom: 0, left: 0, right: 0 }}>
          <div className="mobile-ad-container" style={{ width: '100%', background: '#1e2433', borderTop: '1px solid #334155', padding: '10px 0', display: 'flex', justifyContent: 'center', boxShadow: '0 -4px 12px rgba(0,0,0,0.5)', paddingBottom: 'calc(10px + env(safe-area-inset-bottom))' }}>
            <div style={{ position: 'relative', width: '320px', height: '50px' }}>
              <button 
                onClick={() => setMobileAdVisible(false)}
                style={{ position: 'absolute', right: '-12px', top: '-22px', background: '#0f172a', border: '1px solid #334155', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#cbd5e1', padding: '0', boxShadow: '0 2px 4px rgba(0,0,0,0.3)', zIndex: 99999 }}
                aria-label="Close Ad"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              
              <div id="mobile-bottom-ad-container" style={{ width: '320px', height: '50px', position: 'absolute', top: 0, left: 0, right: 0, margin: 'auto' }}>
                {showCoinzilla ? (
                  <div className="coinzilla" data-zone="C-4176a2678c2d7dc7660"></div>
                ) : (
                  <iframe data-aa='2429728' src='//ad.a-ads.com/2429728/?size=320x50&background_color=1e2433&title_color=fffffe' style={{ border: 0, padding: 0, width: '320px', height: '50px', overflow: 'hidden', display: 'block', margin: '0 auto' }}></iframe>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
