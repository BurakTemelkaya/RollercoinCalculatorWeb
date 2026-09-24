export const HAMSTER_ASSET_BASE = `${import.meta.env.BASE_URL}assets/`;

export function hamsterAssetUrl(path: string | null | undefined) {
  return path ? `${HAMSTER_ASSET_BASE}${path}` : '';
}
