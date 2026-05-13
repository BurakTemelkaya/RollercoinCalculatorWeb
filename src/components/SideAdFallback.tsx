import { useMemo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { REFERRAL_LINKS, shuffleArray } from '../data/referrals';

/**
 * Renders support/referral links into the side ad containers (left + right)
 * using React portals. Only rendered when ads are blocked.
 * Clears existing ad content (iframes, scripts) before rendering.
 */
export default function SideAdFallback() {
  const [ready, setReady] = useState(false);

  // Shuffle and split referrals into two groups (left/right)
  const { leftItems, rightItems } = useMemo(() => {
    const shuffled = shuffleArray(REFERRAL_LINKS);
    const half = Math.ceil(shuffled.length / 2);
    return {
      leftItems: shuffled.slice(0, half),
      rightItems: shuffled.slice(half),
    };
  }, []);

  // Clear existing ad content from containers before portal renders
  useEffect(() => {
    const leftContainer = document.getElementById('left-side-ad-container');
    const rightContainer = document.getElementById('right-side-ad-container');

    if (leftContainer) {
      leftContainer.innerHTML = '';
      leftContainer.style.height = 'auto';
    }
    if (rightContainer) {
      rightContainer.innerHTML = '';
      rightContainer.style.height = 'auto';
    }

    setReady(true);
  }, []);

  if (!ready) return null;

  const leftContainer = document.getElementById('left-side-ad-container');
  const rightContainer = document.getElementById('right-side-ad-container');

  return (
    <>
      {leftContainer && createPortal(
        <SupportColumn items={leftItems} />,
        leftContainer
      )}
      {rightContainer && createPortal(
        <SupportColumn items={rightItems} />,
        rightContainer
      )}
    </>
  );
}

function SupportColumn({ items }: { items: typeof REFERRAL_LINKS }) {
  return (
    <div className="ad-support-fallback">
      <div className="fallback-title">☕ Support</div>
      {items.map((item) => (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src={item.icon}
            alt={item.name}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <span>{item.name}</span>
        </a>
      ))}
    </div>
  );
}
