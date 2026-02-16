import img1 from '../assets/leagues/68af01ce48490927df92d679.png';
import img2 from '../assets/leagues/68af01ce48490927df92d67a.png';
import img3 from '../assets/leagues/68af01ce48490927df92d67b.png';
import img4 from '../assets/leagues/68af01ce48490927df92d67c.png';
import img5 from '../assets/leagues/68af01ce48490927df92d67d.png';
import img6 from '../assets/leagues/68af01ce48490927df92d67e.png';
import img7 from '../assets/leagues/68af01ce48490927df92d67f.png';
import img8 from '../assets/leagues/68af01ce48490927df92d680.png';
import img9 from '../assets/leagues/68af01ce48490927df92d681.png';
import img10 from '../assets/leagues/68af01ce48490927df92d682.png';
import img11 from '../assets/leagues/68af01ce48490927df92d683.png';
import img12 from '../assets/leagues/68af01ce48490927df92d684.png';
import img13 from '../assets/leagues/68af01ce48490927df92d685.png';
import img14 from '../assets/leagues/68af01ce48490927df92d686.png';
import img15 from '../assets/leagues/68af01ce48490927df92d687.png';
import { LEAGUES } from './leagues';

// Order matches the LEAGUES array in data/leagues.ts
// Bronze 1 -> Diamond 3
export const LEAGUE_IMAGES = [
    img15, img14, img13, img12, img11,
    img10, img9, img8, img7, img6,
    img5, img4, img3, img2, img1
];

// Map of Mongo IDs to Images (if we need direct lookup)
// These IDs are derived from the filenames provided
export const API_ID_TO_IMAGE: Record<string, string> = {
    '68af01ce48490927df92d679': img1,
    '68af01ce48490927df92d67a': img2,
    '68af01ce48490927df92d67b': img3,
    '68af01ce48490927df92d67c': img4,
    '68af01ce48490927df92d67d': img5,
    '68af01ce48490927df92d67e': img6,
    '68af01ce48490927df92d67f': img7,
    '68af01ce48490927df92d680': img8,
    '68af01ce48490927df92d681': img9,
    '68af01ce48490927df92d682': img10,
    '68af01ce48490927df92d683': img11,
    '68af01ce48490927df92d684': img12,
    '68af01ce48490927df92d685': img13,
    '68af01ce48490927df92d686': img14,
    '68af01ce48490927df92d687': img15,
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
