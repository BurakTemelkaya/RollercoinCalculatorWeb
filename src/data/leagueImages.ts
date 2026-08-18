import { LEAGUES } from './leagues';

import img1 from '../assets/leagues/6a846d84d4be9e1aa9a15591.png?url';
import img2 from '../assets/leagues/6a846d84d4be9e1aa9a15592.png?url';
import img3 from '../assets/leagues/6a846d84d4be9e1aa9a15593.png?url';
import img4 from '../assets/leagues/6a846d84d4be9e1aa9a15594.png?url';
import img5 from '../assets/leagues/6a846d84d4be9e1aa9a15595.png?url';
import img6 from '../assets/leagues/6a846d84d4be9e1aa9a15596.png?url';
import img7 from '../assets/leagues/6a846d84d4be9e1aa9a15597.png?url';
import img8 from '../assets/leagues/6a846d84d4be9e1aa9a15598.png?url';
import img9 from '../assets/leagues/6a846d84d4be9e1aa9a15599.png?url';
import img10 from '../assets/leagues/6a846d84d4be9e1aa9a1559a.png?url';
import img11 from '../assets/leagues/6a846d84d4be9e1aa9a1559b.png?url';
import img12 from '../assets/leagues/6a846d84d4be9e1aa9a1559c.png?url';
import img13 from '../assets/leagues/6a846d84d4be9e1aa9a1559d.png?url';
import img14 from '../assets/leagues/6a846d84d4be9e1aa9a1559e.png?url';
import img15 from '../assets/leagues/6a846d84d4be9e1aa9a1559f.png?url';
import img16 from '../assets/leagues/6a846d84d4be9e1aa9a155a0.png?url';
import img17 from '../assets/leagues/6a846d84d4be9e1aa9a155a1.png?url';
import img18 from '../assets/leagues/6a846d84d4be9e1aa9a155a2.png?url';
import img19 from '../assets/leagues/6a846d84d4be9e1aa9a155a3.png?url';
import img20 from '../assets/leagues/6a846d84d4be9e1aa9a155a4.png?url';
import img21 from '../assets/leagues/6a846d84d4be9e1aa9a155a5.png?url';
import img22 from '../assets/leagues/6a846d84d4be9e1aa9a155a6.png?url';

// Order matches the LEAGUES array in data/leagues.ts
// Bronze 1 -> Legend
export const LEAGUE_IMAGES = [
    img1, img2, img3, img4, img5, img6, img7, img8, img9, img10, img11, img12, img13, img14, img15, img16, img17, img18, img19, img20, img21, img22
];

// Map of Mongo IDs to Images (if we need direct lookup)
// These IDs are derived from the filenames provided
export const API_ID_TO_IMAGE: Record<string, string> = {
    '6a846d84d4be9e1aa9a15591': img1,
    '6a846d84d4be9e1aa9a15592': img2,
    '6a846d84d4be9e1aa9a15593': img3,
    '6a846d84d4be9e1aa9a15594': img4,
    '6a846d84d4be9e1aa9a15595': img5,
    '6a846d84d4be9e1aa9a15596': img6,
    '6a846d84d4be9e1aa9a15597': img7,
    '6a846d84d4be9e1aa9a15598': img8,
    '6a846d84d4be9e1aa9a15599': img9,
    '6a846d84d4be9e1aa9a1559a': img10,
    '6a846d84d4be9e1aa9a1559b': img11,
    '6a846d84d4be9e1aa9a1559c': img12,
    '6a846d84d4be9e1aa9a1559d': img13,
    '6a846d84d4be9e1aa9a1559e': img14,
    '6a846d84d4be9e1aa9a1559f': img15,
    '6a846d84d4be9e1aa9a155a0': img16,
    '6a846d84d4be9e1aa9a155a1': img17,
    '6a846d84d4be9e1aa9a155a2': img18,
    '6a846d84d4be9e1aa9a155a3': img19,
    '6a846d84d4be9e1aa9a155a4': img20,
    '6a846d84d4be9e1aa9a155a5': img21,
    '6a846d84d4be9e1aa9a155a6': img22,
};

/**
 * Get the image for a given league ID
 * Supports both internal slug IDs (e.g. 'bronze-1') and API/Mongo IDs
 */
export function getLeagueImage(leagueId: string): string {
    // 1. Try direct API ID match
    if (API_ID_TO_IMAGE[leagueId]) {
        return API_ID_TO_IMAGE[leagueId];
    }

    // 2. Try to find index in default LEAGUES list
    const index = LEAGUES.findIndex(l => l.id === leagueId);
    if (index !== -1 && LEAGUE_IMAGES[index]) {
        return LEAGUE_IMAGES[index];
    }

    // 3. Fallback to first image
    return LEAGUE_IMAGES[0];
}
