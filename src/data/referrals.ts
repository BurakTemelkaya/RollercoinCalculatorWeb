// Shared referral links data — used by SupportPage.tsx

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
}

export const REFERRAL_LINKS: ReferralLink[] = [
  { id: 'chainers', name: 'Chainers (Web)', url: 'https://chainers.io/?r=mhnobucr', icon: iconChainers },
  { id: 'chainersHeroes', name: 'Chainers Heroes Bot (Telegram)', url: 'https://t.me/chainers_heroes_bot?start=1276468423', icon: iconChainersHeroes },
  { id: 'rollerTap', name: 'RollerTap Bot (Telegram)', url: 'https://t.me/rollertap_bot?start=1276468423', icon: iconRollerTap },
  { id: 'mystNodes', name: 'MystNodes', url: 'https://mystnodes.co/?referral_code=K9ugNp7ocqpm5zQQTydIWVrm5tQSZdAJQn73l3k4', icon: iconMystNodes },
  { id: 'grass', name: 'Grass', url: 'https://app.grass.io/register?referralCode=bnXnt4EYb8xnTVw', icon: grass },
  { id: 'solsiege', name: 'SolSiege', url: 'https://solsiege.com?ref=2KPP58WL', icon: solSiege },
  { id: 'immutable', name: 'Immutable', url: 'https://play.immutable.com/referral/share/2wsMMY?utm_source=referral', icon: immutable },
  { id: 'honeygain', name: 'Honeygain', url: 'https://join.honeygain.com/123KED5C', icon: honeygain },
  { id: 'freecash', name: 'Freecash', url: 'https://freecash.com/r/keinyx03', icon: freecash },
];
