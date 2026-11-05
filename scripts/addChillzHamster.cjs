const fs = require('node:fs');
const path = require('node:path');

const catalogPath = path.resolve(__dirname, '../src/data/hamsters.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const prefix = 'rollercoin/hamsters/pets/chillz/lvl01';
const languages = ['en', 'tr', 'ru', 'de', 'es', 'fr', 'pt', 'id', 'zh', 'cs'];
const localized = values => Object.fromEntries(languages.map((language, i) => [language, values[i]]));
const icon = name => `rollercoin/hamsters/icons/${name}.webp`;
const animation = (action, frames, frameWidth = 128, frameHeight = 128) => ({
  path: `${prefix}/sprite_${action}.png`, frames, frameWidth, frameHeight,
});

const hamster = {
  slug: 'chillz', name: 'Chillz', generation: 2,
  order: catalog.find(item => item.slug === 'chillz')?.order ?? Math.max(...catalog.map(item => item.order)) + 1,
  stats: { health: 75, strength: 35, luck: 65 },
  abilities: [
    {
      code: 'season_xp_chest',
      text: localized(['Season XP Chest', 'Sezon XP Sandığı', 'Сундук сезонного опыта', 'Saison-XP-Truhe', 'Cofre de XP de temporada', 'Coffre d’XP de saison', 'Baú de XP da temporada', 'Peti XP Musim', '赛季经验宝箱', 'Truhla sezónních XP']),
      icon: icon('season_xp_chest'),
    },
    {
      code: 'relax_time',
      text: localized(['Relax Time -40%', 'Dinlenme Süresi -%40', 'Время отдыха -40%', 'Ruhezeit -40%', 'Tiempo de descanso -40%', 'Temps de repos -40 %', 'Tempo de descanso -40%', 'Waktu Istirahat -40%', '休息时间 -40%', 'Doba odpočinku -40 %']),
      icon: icon('cooldown_percent'),
    },
    {
      code: 'experience',
      text: localized(['Extra XP +40%', 'Ekstra XP +%40', 'Доп. опыт +40%', 'Extra-EP +40%', 'XP extra +40%', 'XP supplémentaire +40 %', 'XP extra +40%', 'XP Ekstra +40%', '额外经验 +40%', 'Extra XP +40 %']),
      icon: icon('xp_percent'),
    },
  ],
  builderSlots: [],
  ultimate: {
    code: 'boost_mode_all_stats_become_100',
    text: localized(['Boost Mode', 'Güç Artışı', 'Режим усиления', 'Boost-Modus', 'Modo Boost', 'Mode Boost', 'Modo Boost', 'Mode Boost', '强化模式', 'Režim posílení']),
    icon: icon('boost_mode'),
  },
  ultimateChargePoints: 24,
  skins: [{
    level: 1,
    walk: `${prefix}/sprite_walk.png`, frames: 16,
    jump: `${prefix}/sprite_jump.png`, jumpFrames: 7,
    frameWidth: 128, frameHeight: 128,
    idle: `${prefix}/idle.png`,
    idleAnimation: {
      path: `${prefix}/sprite_idle.png`,
      frames: 6,
      frameWidth: 62,
      frameHeight: 62,
      frameDurationMs: 100,
    },
    animations: {
      walk: animation('walk', 16),
      jump: animation('jump', 7),
      tap_reaction: animation('tap_reaction', 11),
      go_sleep: animation('go_sleep', 24),
      take_chest: animation('take_chest', 9),
      win_loop: animation('win_loop', 6),
    },
  }],
  animationsPending: false,
};

const index = catalog.findIndex(item => item.slug === hamster.slug);
const assets = [hamster.ultimate.icon, ...hamster.abilities.map(ability => ability.icon), hamster.skins[0].idle,
  hamster.skins[0].idleAnimation.path, ...Object.values(hamster.skins[0].animations).map(item => item.path)];
for (const asset of assets) {
  if (!fs.existsSync(path.resolve(__dirname, '../public/assets', asset))) throw new Error(`Missing Chillz asset: ${asset}`);
}
if (index === -1) catalog.push(hamster);
else catalog[index] = hamster;
catalog.sort((a, b) => a.order - b.order);
fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log('Added Chillz with official abilities and the supplied level 50 animations.');
