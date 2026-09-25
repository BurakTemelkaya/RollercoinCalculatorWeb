import React, { useState, useEffect, useRef } from 'react';
import type { MinerFramesData } from '../types/room';
import CdnImage from './CdnImage';
import { getCdnBaseUrl } from '../config/api';

/**
 * Module-level cache for HTMLImageElements to prevent reloading 
 * and decoding the same sprite PNG multiple times.
 */
const imageCache = new Map<string, HTMLImageElement>();
const imageErrors = new Set<string>();
const imagePending = new Map<string, Promise<HTMLImageElement>>();
const MAX_CACHED_SPRITES = 80;

type VisibilityCallback = (visible: boolean) => void;
const visibilityCallbacks = new Map<Element, Set<VisibilityCallback>>();
const visibilityState = new Map<Element, boolean>();
let visibilityObserver: IntersectionObserver | null = null;

function observeVisibility(element: Element, callback: VisibilityCallback): () => void {
    if (!('IntersectionObserver' in window)) {
        callback(true);
        return () => {};
    }
    if (!visibilityObserver) {
        visibilityObserver = new IntersectionObserver(entries => {
            for (const entry of entries) {
                visibilityState.set(entry.target, entry.isIntersecting);
                visibilityCallbacks.get(entry.target)?.forEach(listener => listener(entry.isIntersecting));
            }
        }, { rootMargin: '100px' });
    }
    let callbacks = visibilityCallbacks.get(element);
    if (!callbacks) {
        callbacks = new Set();
        visibilityCallbacks.set(element, callbacks);
        visibilityObserver.observe(element);
    }
    callbacks.add(callback);
    if (visibilityState.has(element)) callback(visibilityState.get(element)!);
    return () => {
        callbacks!.delete(callback);
        if (callbacks!.size === 0) {
            visibilityObserver?.unobserve(element);
            visibilityCallbacks.delete(element);
            visibilityState.delete(element);
        }
        if (visibilityCallbacks.size === 0) {
            visibilityObserver?.disconnect();
            visibilityObserver = null;
        }
    };
}

type Animation = { visible: boolean; draw: () => void };
const animations = new Set<Animation>();
let animationTimer: number | null = null;

function scheduleAnimations() {
    if (animationTimer !== null || document.hidden || ![...animations].some(animation => animation.visible)) return;
    animationTimer = window.setTimeout(() => {
        animationTimer = null;
        if (!document.hidden) {
            animations.forEach(animation => { if (animation.visible) animation.draw(); });
            scheduleAnimations();
        }
    }, 100);
}

function handleVisibilityChange() {
    if (document.hidden && animationTimer !== null) {
        clearTimeout(animationTimer);
        animationTimer = null;
    } else {
        scheduleAnimations();
    }
}

function registerAnimation(canvas: HTMLCanvasElement, draw: () => void): () => void {
    const animation: Animation = { visible: false, draw };
    if (animations.size === 0) document.addEventListener('visibilitychange', handleVisibilityChange);
    animations.add(animation);
    const stopObserving = observeVisibility(canvas, visible => {
        animation.visible = visible;
        if (visible) scheduleAnimations();
    });
    return () => {
        stopObserving();
        animations.delete(animation);
        if (animations.size === 0) {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (animationTimer !== null) clearTimeout(animationTimer);
            animationTimer = null;
        }
    };
}

function loadSpriteImage(url: string): Promise<HTMLImageElement> {
    const cached = imageCache.get(url);
    if (cached) return Promise.resolve(cached);
    if (imageErrors.has(url)) return Promise.reject('cached_error');

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
            reject('load_error');
        };
        img.src = url;
    });

    imagePending.set(url, promise);
    return promise;
}

interface SpriteSheetMinerProps {
    /** Miner filename (e.g. "dragon_shrine" or "dragon_shrine.gif") */
    filename: string;
    /** Sprite sheet metadata from the API (frame dimensions + count) */
    framesData?: MinerFramesData | null;
    /** CSS class applied to the rendered element (e.g. "miner-item") */
    className?: string;
    alt: string;
    loading?: 'lazy' | 'eager';
    paused?: boolean;
}

/**
 * Renders a miner image using HTML5 Canvas instead of CSS animation.
 * 
 * Performance benefit: Drawing image slices on a canvas is massively faster 
 * and uses vastly less VRAM than animating DOM elements with CSS.
 */
const SpriteSheetMiner: React.FC<SpriteSheetMinerProps> = ({
    filename,
    framesData,
    className = 'miner-item',
    alt,
    loading,
    paused = false,
}) => {
    const cleanName = (filename || 'crypto_combo').split('.')[0];
    const baseUrl = getCdnBaseUrl();
    const cdnSpriteUrl = `${baseUrl}/miners/${cleanName}.png`;
    const rcSpriteUrl = `https://static.rollercoin.com/static/img/game/room/miners/${cleanName}.png?v=1.0.0`;
    const gifUrl = `https://static.rollercoin.com/static/img/market/miners/${filename?.includes('.') ? filename : (filename + '.gif')}?v=1.2.1`;
    const pngFallbackUrl = `https://static.rollercoin.com/static/img/market/miners/${cleanName}.png`;

    const canUseSprite = !!(framesData && framesData.frame_width > 0 && framesData.frame_height > 0);

    // Try synchronous cache lookup for instant render
    const [image, setImage] = useState<HTMLImageElement | null>(() => {
        if (!canUseSprite) return null;
        return imageCache.get(cdnSpriteUrl) || imageCache.get(rcSpriteUrl) || null;
    });
    const [fallback, setFallback] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isNearViewport, setIsNearViewport] = useState(loading !== 'lazy');

    useEffect(() => {
        if (loading !== 'lazy' || !canUseSprite || !canvasRef.current) return;
        return observeVisibility(canvasRef.current, setIsNearViewport);
    }, [loading, canUseSprite, fallback]);

    // 1. Load the Sprite Image
    useEffect(() => {
        if (!canUseSprite || fallback || image !== null || !isNearViewport) return;

        let cancelled = false;
        loadSpriteImage(cdnSpriteUrl)
            .catch(() => loadSpriteImage(rcSpriteUrl))
            .then(img => { if (!cancelled) setImage(img); })
            .catch(() => { if (!cancelled) setFallback(true); });

        return () => { cancelled = true; };
    }, [cdnSpriteUrl, rcSpriteUrl, canUseSprite, fallback, image, isNearViewport]);

    // 2. Canvas Animation Loop
    useEffect(() => {
        if (!image || !canvasRef.current || !framesData) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        // Disable smoothing for sharp pixel art
        ctx.imageSmoothingEnabled = false;

        const { frame_width, frame_height, frames_count } = framesData;
        
        // If frames_count is null from API, deduce from image width (minus 2 frames for metadata boxes if needed)
        const deducedFrames = Math.floor(image.naturalWidth / frame_width);
        const animFrames = frames_count || Math.max(1, deducedFrames - 2);
        
        let frame = 0;
        const draw = () => {
            ctx.clearRect(0, 0, frame_width, frame_height);
            ctx.drawImage(image, frame * frame_width, 0, frame_width, frame_height,
                0, 0, frame_width, frame_height);
            frame = (frame + 1) % animFrames;
        };
        draw(); // Keep a still frame visible even when the canvas is off screen.
        if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        return registerAnimation(canvas, draw);
    }, [image, framesData, paused]);

    // ── Fallback: original GIF/PNG image ──
    if (!canUseSprite || fallback) {
        if (cleanName) {
            return (
                <CdnImage
                    type="miner"
                    itemId={cleanName}
                    fallbackUrl={gifUrl}
                    className={className}
                    alt={alt}
                    loading={loading}
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (!target.src.includes('.png')) target.src = pngFallbackUrl;
                    }}
                />
            );
        }
        return (
            <img
                className={className}
                src={gifUrl}
                alt={alt}
                loading={loading}
                onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes('.png')) target.src = pngFallbackUrl;
                }}
            />
        );
    }

    // ── Sprite Canvas mode ──
    const { frame_width, frame_height } = framesData!;
    
    // Rollercoin GIFs have a standard canvas size of 126x100.
    const canvasWidth = 126;
    const canvasHeight = 100;

    return (
        <div
            className={`${className} miner-sprite-container`}
            style={{
                aspectRatio: `${canvasWidth} / ${canvasHeight}`,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
            role="img"
            aria-label={alt}
        >
            <canvas
                ref={canvasRef}
                width={frame_width}
                height={frame_height}
                style={{
                    width: `${(frame_width / canvasWidth) * 100}%`,
                    height: `${(frame_height / canvasHeight) * 100}%`,
                    imageRendering: 'pixelated'
                }}
            />
        </div>
    );
};

export default React.memo(SpriteSheetMiner);
