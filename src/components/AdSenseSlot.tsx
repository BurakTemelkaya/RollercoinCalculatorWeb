import React, { useEffect, useRef } from 'react';

interface AdSenseSlotProps {
  slot: string;
  width: number;
  height: number;
}

// Fixed-size AdSense unit. The loader script lives in index.html.
export const AdSenseSlot: React.FC<AdSenseSlotProps> = ({ slot, width, height }) => {
  // The ref survives StrictMode's mount/unmount/mount, so the unit is requested once.
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense throws when the slot is already filled or the script is blocked.
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'inline-block', width: `${width}px`, height: `${height}px` }}
      data-ad-client="ca-pub-6643171955921787"
      data-ad-slot={slot}
    />
  );
};
