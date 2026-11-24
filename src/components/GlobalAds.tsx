import React from 'react';
import { AdSenseSlot } from './AdSenseSlot';

interface GlobalAdsProps {
  adsBlocked: boolean;
  country: string | null;
}

export const GlobalAds: React.FC<GlobalAdsProps> = ({ adsBlocked, country }) => {
  if (adsBlocked || !country) return null;

  return (
    <>
      {/* Desktop Left Sticky */}
      <div className="desktop-side-ad" style={{ position: 'absolute', zIndex: 40, pointerEvents: 'none' }}>
        <div style={{ paddingTop: 0, paddingBottom: 0 }}>
          <div style={{ width: 'max(170px, calc((100vw - 1200px) / 2))', height: '100%', position: 'fixed', top: 0, left: 0 }}>
            <div id="left-side-ad-container" style={{ width: '160px', height: '600px', position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: 0, right: 0, margin: 'auto', zIndex: 40, pointerEvents: 'auto' }}>
              <AdSenseSlot slot="8429846209" width={160} height={600} />
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

    </>
  );
};
