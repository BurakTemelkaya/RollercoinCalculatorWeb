import { useLayoutEffect, useRef } from 'react';
import type { ApiRoomMiner } from '../types/room';
import { getCdnBaseUrl } from '../config/api';
import { loadSpriteImage } from './spriteImageCache';

interface Props {
    miners: ApiRoomMiner[];
    paused: boolean;
    onSpriteErrors: (ids: string[]) => void;
}

interface Sprite {
    miner: ApiRoomMiner;
    element: HTMLElement;
    image: HTMLImageElement | null;
    x: number;
    y: number;
    width: number;
    height: number;
    frame: number;
    frameCount: number;
}

/** Draws room miners on one canvas. Their DOM wrappers remain the hit targets. */
export default function SharedRoomMinerCanvas({ miners, paused, onSpriteErrors }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        const grid = canvas?.parentElement;
        const context = canvas?.getContext('2d', { alpha: true });
        if (!grid || !canvas || !context) return;

        const elements = new Map(
            Array.from(grid.querySelectorAll<HTMLElement>('[data-room-sprite-id]'))
                .map(element => [element.dataset.roomSpriteId, element])
        );
        const sprites: Sprite[] = miners.flatMap(miner => {
            const element = elements.get(miner._id);
            const frames = miner.frames_data;
            if (!element || !frames?.frame_width || !frames.frame_height) return [];
            return [{
                miner, element, image: null, x: 0, y: 0, width: 0, height: 0,
                frame: 0, frameCount: 1
            }];
        });

        let disposed = false;
        let visible = true;
        let timer = 0;
        let geometryFrame = 0;
        let paintFrame = 0;
        const draw = (advance: boolean) => {
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            const rect = canvas.getBoundingClientRect();
            if (!width || !height || !rect.width || !rect.height) return;
            const scaleX = rect.width / width;
            const scaleY = rect.height / height;
            const left = Math.max(0, (-rect.left) / scaleX - 40);
            const top = Math.max(0, (-rect.top) / scaleY - 40);
            const right = Math.min(width, (window.innerWidth - rect.left) / scaleX + 40);
            const bottom = Math.min(height, (window.innerHeight - rect.top) / scaleY + 40);
            if (right <= left || bottom <= top) return;
            const visibleSprites = sprites.filter(sprite => sprite.image && sprite.width && sprite.height
                && sprite.x + sprite.width >= left && sprite.x <= right
                && sprite.y + sprite.height >= top && sprite.y <= bottom);
            // Clearing the whole room bitmap on every tick is especially costly on
            // software-backed 2D canvases. Clear all sprite footprints first so
            // overlapping artwork is still composed in its original order.
            for (const sprite of visibleSprites) {
                context.clearRect(Math.floor(sprite.x) - 1, Math.floor(sprite.y) - 1,
                    Math.ceil(sprite.width) + 2, Math.ceil(sprite.height) + 2);
            }
            for (const sprite of visibleSprites) {
                const frames = sprite.miner.frames_data!;
                context.drawImage(
                    sprite.image!,
                    sprite.frame * frames.frame_width, 0,
                    frames.frame_width, frames.frame_height,
                    Math.round(sprite.x), Math.round(sprite.y),
                    Math.round(sprite.width), Math.round(sprite.height)
                );
                if (advance) sprite.frame = (sprite.frame + 1) % sprite.frameCount;
            }
        };

        const schedulePaint = () => {
            if (!paintFrame) paintFrame = window.requestAnimationFrame(() => {
                paintFrame = 0;
                draw(false);
            });
        };

        const updateGeometry = () => {
            geometryFrame = 0;
            const canvasRect = canvas.getBoundingClientRect();
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            if (!width || !height || !canvasRect.width || !canvasRect.height) return;
            // These are pixel-art sprites. A high-DPI room bitmap costs much more
            // to update on Firefox for Android without adding useful detail.
            const isFirefoxAndroid = /Android/.test(navigator.userAgent) && /Firefox\//.test(navigator.userAgent);
            const pixelRatio = Math.min(window.devicePixelRatio || 1, isFirefoxAndroid ? 1 : 2);
            const bitmapWidth = Math.round(width * pixelRatio);
            const bitmapHeight = Math.round(height * pixelRatio);
            if (canvas.width !== bitmapWidth || canvas.height !== bitmapHeight) {
                canvas.width = bitmapWidth;
                canvas.height = bitmapHeight;
            }
            context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
            context.imageSmoothingEnabled = false;
            const scaleX = canvasRect.width / width;
            const scaleY = canvasRect.height / height;
            for (const sprite of sprites) {
                const rect = sprite.element.getBoundingClientRect();
                const frames = sprite.miner.frames_data!;
                const boxWidth = rect.width / scaleX;
                const boxHeight = rect.height / scaleY;
                sprite.width = boxWidth * frames.frame_width / 126;
                sprite.height = boxHeight * frames.frame_height / 100;
                sprite.x = (rect.left - canvasRect.left) / scaleX + (boxWidth - sprite.width) / 2;
                sprite.y = (rect.top - canvasRect.top) / scaleY + (boxHeight - sprite.height) / 2;
            }
            context.clearRect(0, 0, width, height);
            draw(false);
        };
        const scheduleGeometry = () => {
            if (!geometryFrame) geometryFrame = window.requestAnimationFrame(updateGeometry);
        };
        const onScroll = schedulePaint;
        const tick = () => {
            timer = 0;
            if (disposed || paused || document.hidden || !visible) return;
            draw(true);
            timer = window.setTimeout(tick, 100);
        };
        const scheduleAnimation = () => {
            if (!timer && !paused && !document.hidden && visible && sprites.some(sprite => sprite.image)) {
                timer = window.setTimeout(tick, 100);
            }
        };
        const onVisibilityChange = () => {
            if (document.hidden) window.clearTimeout(timer);
            timer = 0;
            scheduleAnimation();
        };

        updateGeometry();
        const failedIds: string[] = [];
        let remainingLoads = sprites.length;
        const finishLoad = () => {
            remainingLoads -= 1;
            if (!remainingLoads && !disposed && failedIds.length) onSpriteErrors(failedIds);
        };
        for (const sprite of sprites) {
            const cleanName = (sprite.miner.filename || 'crypto_combo').split('.')[0];
            const cdnUrl = `${getCdnBaseUrl()}/miners/${cleanName}.png`;
            const fallbackUrl = `https://static.rollercoin.com/static/img/game/room/miners/${cleanName}.png?v=1.0.0`;
            loadSpriteImage(cdnUrl).catch(() => loadSpriteImage(fallbackUrl))
                .then(image => {
                    if (disposed) return;
                    sprite.image = image;
                    const frames = sprite.miner.frames_data!;
                    const inferred = Math.floor(image.naturalWidth / frames.frame_width);
                    sprite.frameCount = Math.max(1, frames.frames_count || inferred - 2);
                    schedulePaint();
                    scheduleAnimation();
                })
                .catch(() => { if (!disposed) failedIds.push(sprite.miner._id); })
                .finally(finishLoad);
        }

        const resizeObserver = new ResizeObserver(scheduleGeometry);
        resizeObserver.observe(grid);
        resizeObserver.observe(canvas);
        const styleObserver = new MutationObserver(scheduleGeometry);
        styleObserver.observe(grid, { attributes: true, attributeFilter: ['style'] });
        const visibilityObserver = new IntersectionObserver(entries => {
            visible = entries[0]?.isIntersecting ?? true;
            if (!visible) {
                window.clearTimeout(timer);
                timer = 0;
            } else {
                schedulePaint();
                scheduleAnimation();
            }
        }, { rootMargin: '100px' });
        visibilityObserver.observe(canvas);
        window.addEventListener('resize', scheduleGeometry);
        window.addEventListener('scroll', onScroll, true);
        document.addEventListener('visibilitychange', onVisibilityChange);
        scheduleAnimation();

        return () => {
            disposed = true;
            window.clearTimeout(timer);
            window.cancelAnimationFrame(geometryFrame);
            window.cancelAnimationFrame(paintFrame);
            resizeObserver.disconnect();
            styleObserver.disconnect();
            visibilityObserver.disconnect();
            window.removeEventListener('resize', scheduleGeometry);
            window.removeEventListener('scroll', onScroll, true);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [miners, paused, onSpriteErrors]);

    return <canvas ref={canvasRef} className="room-shared-miner-canvas" aria-hidden="true" />;
}
