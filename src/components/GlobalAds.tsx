import React, { useState } from 'react';
import { AdSenseSlot } from './AdSenseSlot';

interface GlobalAdsProps {
  adsBlocked: boolean;
  country: string | null;
}

export const GlobalAds: React.FC<GlobalAdsProps> = ({ adsBlocked, country }) => {
  const [mobileAdVisible, setMobileAdVisible] = useState(true);

  if (adsBlocked || !country) return null;

  const isTR = country === 'TR';
  const showAdSense = isTR || country === 'UNKNOWN';

  return (
    <>
      {/* Desktop Left Sticky */}
      <div className="desktop-side-ad" style={{ position: 'absolute', zIndex: 40, pointerEvents: 'none' }}>
        <div style={{ paddingTop: 0, paddingBottom: 0 }}>
          <div style={{ width: 'max(170px, calc((100vw - 1200px) / 2))', height: '100%', position: 'fixed', top: 0, left: 0 }}>
            <div id="left-side-ad-container" style={{ width: '160px', height: '600px', position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: 0, right: 0, margin: 'auto', zIndex: 40, pointerEvents: 'auto' }}>
              {showAdSense ? (
                <AdSenseSlot slot="8429846209" width={160} height={600} />
              ) : (
                <iframe data-aa='2459663' src='//ad.a-ads.com/2459663/?size=160x600&background_color=1e2433&title_color=fffffe' style={{ border: 0, padding: 0, width: '160px', height: '600px', overflow: 'hidden', display: 'block', margin: 'auto' }}></iframe>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Right Sticky */}
      <div className="desktop-side-ad" style={{ position: 'absolute', zIndex: 40, pointerEvents: 'none' }}>
        <div style={{ paddingTop: 0, paddingBottom: 0 }}>
          <div style={{ width: 'max(170px, calc((100vw - 1200px) / 2))', height: '100%', position: 'fixed', top: 0, right: 0 }}>
            <div id="right-side-ad-container" style={{ width: '160px', height: '600px', position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: 0, right: 0, margin: 'auto', zIndex: 40, pointerEvents: 'auto' }}>
              <AdSenseSlot slot="8429846209" width={160} height={600} />
            </div>
          </div>
        </div>
      </div>

      {/* Keep the mobile banner above page panels (100–900), below the navbar (1000). */}
      {mobileAdVisible && (
        <div className="aads-mobile-only" style={{ position: 'fixed', zIndex: 950, bottom: 0, left: 0, right: 0, width: '100%', maxWidth: '100%', pointerEvents: 'none' }}>
          <div className="mobile-ad-container" style={{ width: '100%', maxWidth: '100%', background: '#1e2433', borderTop: '1px solid #334155', padding: '10px 0', display: 'flex', justifyContent: 'center', boxShadow: '0 -4px 12px rgba(0,0,0,0.5)', paddingBottom: 'calc(10px + env(safe-area-inset-bottom))', boxSizing: 'border-box', pointerEvents: 'auto' }}>
            <div style={{ position: 'relative', width: '320px', maxWidth: '100%', height: '50px' }}>
              <button 
                onClick={() => setMobileAdVisible(false)}
                style={{ position: 'absolute', right: '0px', top: '-24px', background: '#0f172a', border: '1px solid #334155', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#cbd5e1', padding: '0', boxShadow: '0 2px 4px rgba(0,0,0,0.3)', zIndex: 41, pointerEvents: 'auto' }}
                aria-label="Close Ad"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              
              <div id="mobile-bottom-ad-container" style={{ width: '320px', maxWidth: '100%', height: '50px', position: 'absolute', top: 0, left: 0, right: 0, margin: 'auto', overflow: 'hidden' }}>
                {showAdSense ? (
                  <AdSenseSlot slot="3141201361" width={320} height={50} />
                ) : (
                  <iframe data-aa='2459664' src='//ad.a-ads.com/2459664/?size=320x50&background_color=1e2433&title_color=fffffe' style={{ border: 0, padding: 0, width: '320px', height: '50px', overflow: 'hidden', display: 'block', margin: '0 auto' }}></iframe>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
