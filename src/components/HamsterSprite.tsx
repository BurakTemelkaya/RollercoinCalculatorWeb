import type { HamsterSkin } from '../types/hamster';
import { hamsterAssetUrl } from '../utils/hamsterAssets';
import './HamsterSprite.css';

interface Props {
  skin: HamsterSkin;
  name: string;
  size?: number | null;
  className?: string;
}

export default function HamsterSprite({ skin, name, size = 104, className = '' }: Props) {
  const style = size === null ? undefined : { width: size, height: size };
  if (skin.idleAnimation) {
    const idle = skin.idleAnimation;
    const region = idle.previewRegion ?? { x: 0, y: 0, width: idle.frameWidth, height: idle.frameHeight };
    return <span className={`hamster-idle hamster-sprite-preview ${className}`} style={style}
      role={name ? 'img' : undefined} aria-label={name || undefined} aria-hidden={name ? undefined : true}>
      <img className="hamster-idle-animation" src={hamsterAssetUrl(idle.path)} alt="" loading="lazy" style={{
        width: `${idle.frameWidth * idle.frames / region.width * 100}%`,
        height: `${idle.frameHeight / region.height * 100}%`,
        left: `${-region.x / region.width * 100}%`, top: `${-region.y / region.height * 100}%`,
        animationDuration: `${idle.frames * idle.frameDurationMs}ms`,
        animationTimingFunction: `steps(${idle.frames})`,
      }} />
    </span>;
  }
  if (skin.idle) return <img className={`hamster-idle ${className}`} style={style} src={hamsterAssetUrl(skin.idle)} alt={name} loading="lazy" />;
  const walk = skin.animations.walk;
  if (!walk) return null;
  const region = skin.previewRegion ?? { x: 0, y: 0, width: walk.frameWidth, height: walk.frameHeight };
  // Show a static first walking frame until an official idle image is available.
  return <span className={`hamster-idle hamster-sprite-preview ${className}`} style={style}
    role={name ? 'img' : undefined} aria-label={name || undefined} aria-hidden={name ? undefined : true}>
    <img src={hamsterAssetUrl(walk.path)} alt="" loading="lazy" style={{
      width: `${walk.frameWidth * walk.frames / region.width * 100}%`,
      height: `${walk.frameHeight / region.height * 100}%`,
      left: `${-region.x / region.width * 100}%`, top: `${-region.y / region.height * 100}%`,
    }} />
  </span>;
}
