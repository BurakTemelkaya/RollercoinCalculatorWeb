import { useEffect, useRef } from 'react';

/**
 * Makes a horizontally overflowing row scrollable by dragging with the mouse or using the wheel
 * (touch scrolls natively). Sets `data-fade-left` / `data-fade-right` so CSS can fade the edge
 * that still has hidden content.
 */
export function useDragScroll<T extends HTMLElement>() {
    const ref = useRef<T>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        let dragging = false;
        let moved = false;
        let startX = 0;
        let startScroll = 0;

        const updateFades = () => {
            el.dataset.fadeLeft = String(el.scrollLeft > 1);
            el.dataset.fadeRight = String(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
        };
        const onPointerDown = (e: PointerEvent) => {
            if (e.pointerType !== 'mouse' || e.button !== 0) return;
            dragging = true;
            moved = false;
            startX = e.clientX;
            startScroll = el.scrollLeft;
        };
        const onPointerMove = (e: PointerEvent) => {
            if (!dragging) return;
            const dx = e.clientX - startX;
            if (Math.abs(dx) > 5) moved = true;
            if (moved) el.scrollLeft = startScroll - dx;
        };
        const onPointerUp = () => { dragging = false; };
        // Releasing a drag must not also open the link under the pointer
        const onClick = (e: MouseEvent) => {
            if (!moved) return;
            moved = false;
            e.preventDefault();
            e.stopPropagation();
        };
        // Links are natively draggable, which would start a URL drag instead of scrolling
        const onDragStart = (e: DragEvent) => e.preventDefault();
        const onWheel = (e: WheelEvent) => {
            if (el.scrollWidth <= el.clientWidth || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
            e.preventDefault();
            el.scrollLeft += e.deltaY;
        };

        el.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        el.addEventListener('click', onClick, true);
        el.addEventListener('dragstart', onDragStart);
        el.addEventListener('wheel', onWheel, { passive: false });
        el.addEventListener('scroll', updateFades, { passive: true });
        const resizeObserver = new ResizeObserver(updateFades);
        resizeObserver.observe(el);
        updateFades();

        return () => {
            el.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            el.removeEventListener('click', onClick, true);
            el.removeEventListener('dragstart', onDragStart);
            el.removeEventListener('wheel', onWheel);
            el.removeEventListener('scroll', updateFades);
            resizeObserver.disconnect();
        };
    }, []);

    return ref;
}
