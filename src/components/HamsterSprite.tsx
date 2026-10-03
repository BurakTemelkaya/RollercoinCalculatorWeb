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
  return <img className={`hamster-idle ${className}`} style={{ width: size, height: size }} src={hamsterAssetUrl(skin.idle)} alt={name} loading="lazy" />;
}
