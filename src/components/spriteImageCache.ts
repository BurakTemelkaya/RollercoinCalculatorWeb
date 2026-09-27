import { getCdnBaseUrl } from '../config/api';

const imageCache = new Map<string, HTMLImageElement>();
const imageErrors = new Set<string>();
const imagePending = new Map<string, Promise<HTMLImageElement>>();
const MAX_CACHED_SPRITES = 80;

export function getCachedSpriteImageByUrl(url: string): HTMLImageElement | null {
    return imageCache.get(url) || null;
}

export function getCachedSpriteImage(filename: string): HTMLImageElement | null {
    const cleanName = (filename || 'crypto_combo').split('.')[0];
    return getCachedSpriteImageByUrl(`${getCdnBaseUrl()}/miners/${cleanName}.png`)
        || getCachedSpriteImageByUrl(`https://static.rollercoin.com/static/img/game/room/miners/${cleanName}.png?v=1.0.0`);
}

export function loadSpriteImage(url: string): Promise<HTMLImageElement> {
    const cached = imageCache.get(url);
    if (cached) return Promise.resolve(cached);
    if (imageErrors.has(url)) return Promise.reject(new Error('cached_error'));

    const pending = imagePending.get(url);
    if (pending) return pending;

    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            imageCache.set(url, img);
            if (imageCache.size > MAX_CACHED_SPRITES) {
                imageCache.delete(imageCache.keys().next().value!);
            }
            imagePending.delete(url);
            resolve(img);
        };
        img.onerror = () => {
            imageErrors.add(url);
            imagePending.delete(url);
            reject(new Error('load_error'));
        };
        img.src = url;
    });

    imagePending.set(url, promise);
    return promise;
}
