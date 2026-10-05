// Official mechanics: https://rollercoin.com/blog/meet-cuscuz-hero-hamster
// Run updateHamsterAbilityGuides.cjs first. Only the supplied walk sprite is available.
const fs = require('node:fs');
const path = require('node:path');

const catalogPath = path.resolve(__dirname, '../src/data/hamsters.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const builderSlots = structuredClone(catalog.find(hamster => hamster.slug === 'gfeast').builderSlots);
// Same localized slot names and trait icons as GFeast, with Cuscuz's own percentages.
const values = [[[60, 20], [-45, -30]], [[-30, -8], [8, 30]], [[220, 20], [-50, -60]]];
builderSlots.forEach((slot, slotIndex) => slot.builds.forEach((build, buildIndex) => {
  [build.buff, build.debuff].forEach((option, optionIndex) => {
    const value = values[slotIndex][buildIndex][optionIndex];
    option.name = Object.fromEntries(Object.entries(option.name).map(([language, label]) =>
      [language, label.replace(/\d+/, String(Math.abs(value)))]));
  });
}));
const languages = ['en', 'tr', 'ru', 'de', 'es', 'fr', 'pt', 'id', 'zh', 'cs'];
const ultimateText = Object.fromEntries(languages.map(language => {
  const locale = JSON.parse(fs.readFileSync(path.resolve(__dirname, `../src/locales/${language}.json`), 'utf8'));
  return [language, `${locale.hamsterAbilityGuide.labels.remoteBonusUltimate} ×2%`];
}));
const spritePath = 'rollercoin/hamsters/pets/cuscuz/lvl50/sprite_walk.png';
const existing = catalog.find(hamster => hamster.slug === 'cuscuz');
const hamster = {
  slug: 'cuscuz', name: 'Cuscuz', generation: 3,
  order: existing?.order ?? Math.max(...catalog.map(hamster => hamster.order)) + 1,
  stats: { health: 90, strength: 75, luck: 90 },
  abilities: [], builderSlots,
  ultimate: { code: 'remote_bonus', text: ultimateText, icon: 'rollercoin/hamsters/icons/remote_bonus.webp' },
  ultimateChargePoints: 24,
  skins: existing?.skins ?? [{
    level: 50, walk: spritePath, frames: 8, jump: null, jumpFrames: 0,
    frameWidth: 128, frameHeight: 128, idle: null,
    previewRegion: { x: 40, y: 92, width: 48, height: 48 },
    animations: { walk: { path: spritePath, frames: 8, frameWidth: 128, frameHeight: 128 } },
  }],
  animationsPending: existing ? existing.animationsPending : true,
};
const index = catalog.findIndex(item => item.slug === hamster.slug);
// Six 100ms idle frames extracted from the user-supplied animated key art.
const idlePrefix = 'rollercoin/hamsters/pets/cuscuz/lvl50';
if (fs.existsSync(path.resolve(__dirname, `../public/assets/${idlePrefix}/sprite_idle.png`))) {
  hamster.skins[0].idle = `${idlePrefix}/idle.png`;
  hamster.skins[0].idleAnimation = {
    path: `${idlePrefix}/sprite_idle.png`, frames: 6, frameWidth: 48, frameHeight: 48, frameDurationMs: 100,
    previewRegion: { x: 2, y: -1, width: 40, height: 40 },
  };
}
if (index === -1) catalog.push(hamster);
else catalog[index] = hamster;
fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log('Added Cuscuz with official stats, builder options and Remote Bonus ultimate.');
