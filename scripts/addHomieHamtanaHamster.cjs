// Official mechanics: https://rollercoin.com/blog/meet-homie-hamtana
// Run updateHamsterAbilityGuides.cjs and updateHomieHamtanaAssets.cjs first.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const catalogPath = path.resolve(__dirname, '../src/data/hamsters.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const existing = catalog.find(item => item.slug === 'homie-hamtana');
const captain = catalog.find(item => item.slug === 'captain-jack-pot');
const uncle = catalog.find(item => item.slug === 'uncle-azoth');
const option = (hamster, code) => structuredClone(hamster.builderSlots.flatMap(slot => slot.builds.map(build => build.buff)).find(item => item.code === code));
const languages = Object.keys(captain.builderSlots[0].title);
const labels = key => Object.fromEntries(languages.map(language => {
  const locale = JSON.parse(fs.readFileSync(path.resolve(__dirname, `../src/locales/${language}.json`), 'utf8'));
  const label = locale.hamsterAbilityGuide.labels[key];
  assert(label, `${language}: missing ${key}`);
  return [language, label];
}));
// Blog table columns: Basic, Lvl 10, 20, 30, 40, 50. Builder choices here have no penalty.
const levels = values => ['basic', 10, 20, 30, 40, 50].map((level, index) => ({ level, value: values[index] }));
const build = (base, values) => ({ buff: { ...base, levels: levels(values) }, debuff: null });

const builderSlots = [
  [
    build({ code: 'rlt_walk', name: labels('rltWalk'), icon: 'rollercoin/hamsters/icons/rlt_chest.webp' }, ['0.15', '0.2', '0.25', '0.3', '0.35', '0.5'].map(value => `${value}/h`)),
    build({ code: 'speed_up_walk', name: labels('speedUpWalk'), icon: 'rollercoin/hamsters/icons/speed_percent.webp' }, ['0.5', '0.6', '0.7', '0.8', '0.9', '1'].map(value => `${value}/h`)),
  ],
  [
    build(option(captain, 'survival'), ['+3%', '+4%', '+5%', '+6%', '+7%', '+8%']),
    build(option(captain, 'buyback_discount'), ['-25%', '-30%', '-35%', '-40%', '-50%', '-60%']),
  ],
  [
    build(option(uncle, 'expedition_time'), ['-10%', '-20%', '-30%', '-40%', '-50%', '-60%']),
    build(option(uncle, 'relax_time'), ['-7.5%', '-15%', '-22.5%', '-30%', '-37.5%', '-45%']),
  ],
].map((builds, index) => ({ title: structuredClone(captain.builderSlots[index].title), builds }));
for (const slot of builderSlots) for (const { buff } of slot.builds) assert(buff.code && buff.name.en && buff.icon, 'Builder option copied incompletely');

const skins = [1, 10, 20, 30, 40, 50].map(level => {
  const prefix = `rollercoin/hamsters/pets/homie-hamtana/lvl${String(level).padStart(2, '0')}`;
  const frameCounts = { walk: 8, jump: 7, tap_reaction: 10, go_sleep: 24, take_chest: 9, win_loop: 6 };
  const animations = Object.fromEntries(Object.entries(frameCounts).map(([action, frames]) => [action, {
    path: `${prefix}/sprite_${action}.png`, frames, frameWidth: 128, frameHeight: 128,
  }]));
  for (const file of [...Object.values(animations).map(animation => animation.path), `${prefix}/idle.png`]) {
    assert(fs.existsSync(path.resolve(__dirname, '../public/assets', file)), `${file} is missing`);
  }
  return {
    level, walk: animations.walk.path, frames: animations.walk.frames,
    jump: animations.jump.path, jumpFrames: animations.jump.frames, frameWidth: 128, frameHeight: 128,
    idle: `${prefix}/idle.png`,
    animations,
  };
});

const hamster = {
  slug: 'homie-hamtana', name: 'Homie Hamtana', generation: 3,
  order: existing?.order ?? Math.max(...catalog.map(item => item.order)) + 1,
  stats: { health: 65, strength: 85, luck: 85 },
  abilities: [],
  builderSlots,
  ultimate: { code: 'rest_relay', text: labels('overchargedRestRelay'), icon: 'rollercoin/hamsters/icons/rest_relay.webp' },
  ultimateChargePoints: 24,
  ultimateTiers: [[10, 24], [12, 30], [16, 36]].map(([minutes, chargeRequired], index) => ({
    tier: index + 1, chargeRequired,
    text: Object.fromEntries(languages.map(language => [language, `-${minutes} min/h`])),
  })),
  skins, animationsPending: false,
};

const index = catalog.findIndex(item => item.slug === hamster.slug);
if (index < 0) catalog.push(hamster);
else catalog[index] = hamster;
fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log('Added Homie Hamtana: six appearances, Abilities Builder and Rest Relay tiers.');
