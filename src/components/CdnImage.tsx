import React, { useState, ImgHTMLAttributes, useEffect } from 'react';
import { getCdnBaseUrl } from '../config/api';

interface CdnImageProps extends ImgHTMLAttributes<HTMLImageElement> {
    type: 'miner' | 'rack';
    itemId: string;
    fallbackUrl: string;
    hoverFallbackUrl?: string;
}

export default function CdnImage({ 
    type, 
    itemId, 
    fallbackUrl, 
    hoverFallbackUrl, 
    onMouseOver, 
    onMouseOut, 
    ...props 
}: CdnImageProps) {
    const baseUrl = getCdnBaseUrl();
    const isHoverable = !!hoverFallbackUrl;
    
    // Extract extensions from fallbacks
    const getExt = (url: string) => url.match(/\.(gif|png|jpe?g|webp)/i)?.[0] || '';
    
    const mainExt = getExt(fallbackUrl);
    const hoverExt = hoverFallbackUrl ? getExt(hoverFallbackUrl) : '';

    const cdnMainUrl = `${baseUrl}/${type}s/${itemId}${mainExt}`;
    const cdnHoverUrl = hoverFallbackUrl ? `${baseUrl}/${type}s/${itemId}${hoverExt}` : undefined;

    const [src, setSrc] = useState<string>('');
    
    // Track which CDN URLs have failed so we don't keep trying to load them
    const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!itemId) {
            setSrc(fallbackUrl);
            return;
        }
        const newCdnMain = `${baseUrl}/${type}s/${itemId}${mainExt}`;
        if (failedUrls.has(newCdnMain)) {
            setSrc(fallbackUrl);
        } else {
            setSrc(newCdnMain);
        }
    }, [itemId, baseUrl, type, mainExt, fallbackUrl, failedUrls]);

    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const currentSrc = e.currentTarget.src;
        
        let isCdnFailure = false;
        if (currentSrc.includes(cdnMainUrl)) {
            setFailedUrls(prev => new Set(prev).add(cdnMainUrl));
            setSrc(fallbackUrl);
            isCdnFailure = true;
        } else if (cdnHoverUrl && currentSrc.includes(cdnHoverUrl)) {
            setFailedUrls(prev => new Set(prev).add(cdnHoverUrl));
            setSrc(hoverFallbackUrl!);
            isCdnFailure = true;
        }
        
        // Only trigger the original onError (which has its own fallback logic)
        // if the failure wasn't just the CDN.
        if (!isCdnFailure && props.onError) {
            props.onError(e);
        }
    };

    const handleMouseOver = (e: React.MouseEvent<HTMLImageElement>) => {
        if (isHoverable && cdnHoverUrl && hoverFallbackUrl) {
            setSrc(failedUrls.has(cdnHoverUrl) ? hoverFallbackUrl : cdnHoverUrl);
        }
        if (onMouseOver) onMouseOver(e);
    };

    const handleMouseOut = (e: React.MouseEvent<HTMLImageElement>) => {
        if (isHoverable) {
            setSrc(failedUrls.has(cdnMainUrl) ? fallbackUrl : cdnMainUrl);
        }
        if (onMouseOut) onMouseOut(e);
    };

    return (
        <img
            {...props}
            src={src}
            onError={handleError}
            onMouseOver={handleMouseOver}
            onMouseOut={handleMouseOut}
        />
    );
}
