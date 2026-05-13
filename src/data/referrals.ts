// Shared referral links data — used by SupportPage.tsx and SideAdFallback.tsx
// Images must exist in both src/assets/support/ (for SupportPage) and public/support/ (for SideAdFallback)

import iconChainers from '../assets/support/chainers.png';
import iconChainersHeroes from '../assets/support/chainers_heroes.jpg';
import iconRollerTap from '../assets/support/rollertap.jpg';
import iconMystNodes from '../assets/support/mystnodes.png';
import grass from '../assets/support/grass.jpg';
import solSiege from '../assets/support/solsiege.png';
import honeygain from '../assets/support/honeygain.jpg';
import immutable from '../assets/support/immutable.png';
import freecash from '../assets/support/freecash.png';

export interface ReferralLink {
  id: string;
  name: string;
  url: string;
  /** Vite-resolved import for use inside React components */
  icon: string;
  /** Static public path for use outside React (index.html) */
  publicIcon: string;
}

export const REFERRAL_LINKS: ReferralLink[] = [
  { id: 'chainers', name: 'Chainers (Web)', url: 'https://chainers.io/?r=mhnobucr', icon: iconChainers, publicIcon: '/support/chainers.png' },
  { id: 'chainersHeroes', name: 'Chainers Heroes Bot (Telegram)', url: 'https://t.me/chainers_heroes_bot?start=1276468423', icon: iconChainersHeroes, publicIcon: '/support/chainers_heroes.jpg' },
  { id: 'rollerTap', name: 'RollerTap Bot (Telegram)', url: 'https://t.me/rollertap_bot?start=1276468423', icon: iconRollerTap, publicIcon: '/support/rollertap.jpg' },
  { id: 'mystNodes', name: 'MystNodes', url: 'https://mystnodes.co/?referral_code=K9ugNp7ocqpm5zQQTydIWVrm5tQSZdAJQn73l3k4', icon: iconMystNodes, publicIcon: '/support/mystnodes.png' },
  { id: 'grass', name: 'Grass', url: 'https://app.grass.io/register?referralCode=bnXnt4EYb8xnTVw', icon: grass, publicIcon: '/support/grass.jpg' },
  { id: 'solsiege', name: 'SolSiege', url: 'https://solsiege.com?ref=2KPP58WL', icon: solSiege, publicIcon: '/support/solsiege.png' },
  { id: 'immutable', name: 'Immutable', url: 'https://play.immutable.com/referral/share/2wsMMY?utm_source=referral', icon: immutable, publicIcon: '/support/immutable.png' },
  { id: 'honeygain', name: 'Honeygain', url: 'https://join.honeygain.com/123KED5C', icon: honeygain, publicIcon: '/support/honeygain.jpg' },
  { id: 'freecash', name: 'Freecash', url: 'https://freecash.com/r/keinyx03', icon: freecash, publicIcon: '/support/freecash.png' },
];

/** Fisher-Yates shuffle */
export function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
