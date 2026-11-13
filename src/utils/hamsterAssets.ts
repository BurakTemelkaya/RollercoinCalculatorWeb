export const HAMSTER_ASSET_BASE = `${import.meta.env.BASE_URL}assets/`;

export function hamsterAssetUrl(path: string | null | undefined) {
  return path ? `${HAMSTER_ASSET_BASE}${path}` : '';
}

// Card backgrounds live next to the level folders: pets/<folder>/background.png.
export function hamsterBackgroundUrl(walkPath: string) {
  return hamsterAssetUrl(walkPath.replace(/\/[^/]+\/[^/]+$/, '/background.png'));
}
