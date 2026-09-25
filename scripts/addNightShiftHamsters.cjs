// Restore the two Night Shift hamsters after importing the public wiki bundle.
// SOLaire's additional level art is intentionally hidden until verified.
const fs = require('node:fs');
const path = require('node:path');

const catalogPath = path.resolve(__dirname, '../src/data/hamsters.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const asset = name => `rollercoin/hamsters/icons/${name}.webp`;
const trait = (code, icon, text) => ({ code, text, icon: icon ? asset(icon) : null });

function skin(pet, level, frames) {
  const prefix = `rollercoin/hamsters/pets/${pet}/lvl${String(level).padStart(2, '0')}`;
  const actions = { walk: 8, jump: 7, tap_reaction: frames.tap, go_sleep: 24, take_chest: 9, win_loop: frames.win };
  const animations = Object.fromEntries(Object.entries(actions).map(([action, count]) => [action, {
    path: `${prefix}/sprite_${action}.png`, frames: count, frameWidth: 128, frameHeight: 128,
  }]));
  return {
    level, walk: animations.walk.path, frames: 8, jump: animations.jump.path, jumpFrames: 7,
    frameWidth: 128, frameHeight: 128, idle: `${prefix}/idle.png`, animations,
  };
}

const solaire = {
  slug: 'solaire', name: 'SOLaire', generation: 2, order: 30,
  stats: { health: 35, strength: 70, luck: 70 },
  abilities: [
    trait('season_xp_chest', 'season_xp_chest', { en: 'Season XP Chest', tr: 'Sezon XP Sandığı', ru: 'Сундук сезонного опыта', de: 'Saison-XP-Truhe', es: 'Cofre de XP de temporada', fr: 'Coffre d’XP de saison', pt: 'Baú de XP da temporada', id: 'Peti XP Musim', zh: '赛季经验宝箱', cs: 'Truhla sezónních XP' }),
    trait('relax_time', 'cooldown_percent', { en: 'Relax Time -25%', tr: 'Dinlenme Süresi -%25', ru: 'Время отдыха -25%', de: 'Ruhezeit -25%', es: 'Tiempo de descanso -25%', fr: 'Temps de repos -25 %', pt: 'Tempo de descanso -25%', id: 'Waktu Istirahat -25%', zh: '休息时间 -25%', cs: 'Doba odpočinku -25 %' }),
    trait('survival', 'survive_percent', { en: 'Survive Chance +5%', tr: 'Hayatta Kalma Şansı +%5', ru: 'Шанс выживания +5%', de: 'Überlebenschance +5%', es: 'Probabilidad de supervivencia +5%', fr: 'Chance de survie +5 %', pt: 'Chance de sobrevivência +5%', id: 'Peluang Bertahan Hidup +5%', zh: '生存几率 +5%', cs: 'Šance na přežití +5 %' }),
  ],
  builderSlots: [],
  ultimate: trait('chests_multiplier', 'chests_multiplier', { en: 'Chests Multiplier ×3', tr: 'Sandık Çarpanı ×3', ru: 'Множитель сундуков ×3', de: 'Truhen-Multiplikator ×3', es: 'Multiplicador de cofres ×3', fr: 'Multiplicateur de coffres ×3', pt: 'Multiplicador de baús ×3', id: 'Pengali Peti ×3', zh: '宝箱倍数 ×3', cs: 'Násobič truhel ×3' }),
  ultimateChargePoints: 18,
  ultimateTiers: [
    { tier: 1, chargeRequired: 18, rewardCount: 3, rewardMultiplier: 3 },
    { tier: 2, chargeRequired: 24, rewardCount: 5, rewardMultiplier: 3 },
    { tier: 3, chargeRequired: 30, rewardCount: 8, rewardMultiplier: 3 },
  ],
  skins: [skin('solaire', 1, { tap: 11, win: 5 })],
};

const lady = {
  slug: 'lady-minerra', name: 'Lady Minerra', generation: 2, order: 31,
  stats: { health: 80, strength: 70, luck: 55 },
  abilities: [
    trait('keep_it_going', null, {
      en: 'Keep It Going: No rest after a successful Expedition. After a failed Expedition, she needs three times the normal rest time.',
      tr: 'Durmak yok: Başarılı bir seferden sonra dinlenmez. Başarısız olursa normal dinlenme süresinin üç katına ihtiyaç duyar.',
      ru: 'Продолжай движение: после успешной экспедиции не отдыхает. После неудачной требуется втрое больше обычного времени отдыха.',
      de: 'Immer weiter: Nach einer erfolgreichen Expedition braucht sie keine Ruhezeit. Nach einer gescheiterten Expedition benötigt sie die dreifache Ruhezeit.',
      es: 'Sin parar: no descansa después de una expedición exitosa. Tras una expedición fallida, necesita el triple del tiempo de descanso normal.',
      fr: 'Toujours en route : aucun repos après une expédition réussie. Après un échec, elle a besoin du triple du temps de repos normal.',
      pt: 'Sempre em frente: não descansa após uma expedição bem-sucedida. Após uma expedição fracassada, precisa do triplo do tempo normal de descanso.',
      id: 'Terus Melaju: Tidak beristirahat setelah Ekspedisi berhasil. Setelah gagal, ia perlu tiga kali waktu istirahat normal.',
      zh: '继续前进：探险成功后无需休息；失败后需要正常休息时间的三倍。',
      cs: 'Jen tak dál: Po úspěšné expedici neodpočívá. Po neúspěšné potřebuje trojnásobek běžné doby odpočinku.',
    }),
    trait('survival', 'survive_percent', { en: 'Survive Chance -5%', tr: 'Hayatta Kalma Şansı -%5', ru: 'Шанс выживания -5%', de: 'Überlebenschance -5%', es: 'Probabilidad de supervivencia -5%', fr: 'Chance de survie -5 %', pt: 'Chance de sobrevivência -5%', id: 'Peluang Bertahan Hidup -5%', zh: '生存几率 -5%', cs: 'Šance na přežití -5 %' }),
    trait('buyback_discount', 'buyback_discount', { en: 'Buyback Discount -50%', tr: 'Geri Alım İndirimi -%50', ru: 'Скидка на выкуп -50%', de: 'Rückkauf-Rabatt -50%', es: 'Descuento de recompra -50%', fr: 'Réduction de rachat -50 %', pt: 'Desconto de recompra -50%', id: 'Diskon Beli Kembali -50%', zh: '回购折扣 -50%', cs: 'Sleva na zpětný odkup -50 %' }),
  ],
  builderSlots: [],
  ultimate: trait('loot_conversion', 'loot_conversion', {
    en: 'Loot Conversion: Converts part of Expedition loot into RLT.',
    tr: 'Ganimet Dönüşümü: Sefer ganimetinin bir bölümünü RLT’ye dönüştürür.',
    ru: 'Конвертация добычи: превращает часть добычи экспедиции в RLT.',
    de: 'Beuteumwandlung: Wandelt einen Teil der Expeditionsbeute in RLT um.',
    es: 'Conversión de botín: convierte parte del botín de la expedición en RLT.',
    fr: 'Conversion du butin : convertit une partie du butin d’expédition en RLT.',
    pt: 'Conversão de espólio: converte parte do espólio da expedição em RLT.',
    id: 'Konversi Loot: Mengubah sebagian loot Ekspedisi menjadi RLT.',
    zh: '战利品转换：将部分探险战利品转换为 RLT。',
    cs: 'Převod kořisti: Přemění část kořisti z expedice na RLT.',
  }),
  ultimateChargePoints: 24,
  ultimateTiers: [
    { tier: 1, chargeRequired: 24, rewardCount: 2, conversionTarget: 'RLT' },
    { tier: 2, chargeRequired: 30, rewardCount: 3, conversionTarget: 'RLT' },
    { tier: 3, chargeRequired: 36, rewardCount: 5, conversionTarget: 'RLT' },
  ],
  skins: [1, 10, 20, 30, 40, 50].map(level => skin('lady_minerra', level, { tap: 9, win: 6 })),
};

for (const hamster of [solaire, lady]) {
  const index = catalog.findIndex(item => item.slug === hamster.slug);
  if (index === -1) catalog.push(hamster);
  else catalog[index] = hamster;
}
catalog.sort((a, b) => a.order - b.order);
fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);

// RollerCoin announced a third Night Shift member without naming it yet.
const setsPath = path.resolve(__dirname, '../src/data/hamsterSets.json');
const sets = JSON.parse(fs.readFileSync(setsPath, 'utf8'));
const nightShift = sets.find(set => set.slug === 'night-shift-set');
if (nightShift) {
  const bonusText = value => Object.fromEntries(Object.entries(nightShift.levels[0].text)
    .map(([language, label]) => [language, label.replace('+10%', `+${value}%`).replace('+%10', `+%${value}`)]));
  nightShift.levels[0].totalMembers = 3;
  nightShift.levels[1] = {
    level: 2, requiredMembers: 3, totalMembers: 3,
    text: bonusText(15), rewardRlt: '25.00',
  };
  nightShift.completion = { text: bonusText(25), rewardRlt: '30.00' };
  fs.writeFileSync(setsPath, `${JSON.stringify(sets, null, 2)}\n`);
}
