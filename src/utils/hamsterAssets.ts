export const HAMSTER_ASSET_BASE = `${import.meta.env.BASE_URL}assets/`;

// Cloudflare caches these images for 30 days; bump when a file is replaced under the same name.
const HAMSTER_ASSET_VERSION = '2';

export function hamsterAssetUrl(path: string | null | undefined) {
  return path ? `${HAMSTER_ASSET_BASE}${path}?v=${HAMSTER_ASSET_VERSION}` : '';
}

// Card backgrounds live next to the level folders: pets/<folder>/background.png.
export function hamsterBackgroundUrl(walkPath: string | null | undefined) {
  return hamsterAssetUrl(walkPath?.replace(/\/[^/]+\/[^/]+$/, '/background.png'));
}
