import type { CSSProperties } from 'react';
import type { HamsterSkin } from '../types/hamster';
import { hamsterAssetUrl } from '../utils/hamsterAssets';
import './HamsterSprite.css';

interface Props {
  skin: HamsterSkin;
  name: string;
  size?: number;
  className?: string;
}

export default function HamsterSprite({ skin, name, size = 104, className = '' }: Props) {
  const frames = Math.max(1, skin.frames);
  const scale = 2.6;
  const framePixels = skin.frameWidth * scale;
  const startX = size / 2 - (skin.frameWidth / 2) * scale;
  const style = {
    '--hamster-size': `${size}px`,
    '--hamster-frames': frames,
    '--hamster-sheet-width': `${framePixels * frames}px`,
    '--hamster-sheet-height': `${skin.frameHeight * scale}px`,
    '--hamster-start-x': `${startX}px`,
    '--hamster-end-x': `${startX - framePixels * frames}px`,
    '--hamster-y': `${size * .45 - skin.frameHeight * .84 * scale}px`,
    '--hamster-duration': `${frames / 16}s`,
    backgroundImage: `url("${hamsterAssetUrl(skin.walk)}")`,
  } as CSSProperties;

  if (!skin.walk) {
    return <img className={`hamster-idle ${className}`} src={hamsterAssetUrl(skin.idle)} alt={name} loading="lazy" />;
  }

  return (
    <span className={`hamster-sprite ${className}`} style={style} role="img" aria-label={`${name} ${skin.level}`} />
  );
}
