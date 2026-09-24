// Download only assets referenced by the imported hamster data.
// Usage: node scripts/downloadHamsterAssets.cjs
const fs = require('node:fs/promises');
const path = require('node:path');

const root = path.resolve(__dirname, '../public');
const hamsters = require('../src/data/hamsters.json');
const sets = require('../src/data/hamsterSets.json');
const paths = new Set();
for (const hamster of hamsters) {
  for (const skin of hamster.skins) {
    for (const file of [skin.walk, skin.jump, skin.idle]) if (file) paths.add(file);
    for (const animation of Object.values(skin.animations)) paths.add(animation.path);
  }
  for (const trait of [...hamster.abilities, hamster.ultimate].filter(Boolean)) if (trait.icon) paths.add(trait.icon);
  for (const slot of hamster.builderSlots) {
    for (const build of slot.builds) {
      for (const option of [build.buff, build.debuff].filter(Boolean)) if (option.icon) paths.add(option.icon);
    }
  }
}
for (const set of sets) if (set.icon) paths.add(set.icon);

const downloads = [...paths].map(file => ({
  url: `https://api.minaryganar.com/assets/${file}`,
  target: path.join(root, 'assets', file),
  label: file,
}));
downloads.push(
  {
    url: 'https://static.rollercoin.com/static/img/expeditions/66fd2a3249652dbe6a40e0ae/road.png',
    target: path.join(root, 'expedition/maps/Tousland/road.png'),
    label: 'Tousland/road.png',
  },
  {
    url: 'https://static.rollercoin.com/static/img/expeditions/66fd2a3249652dbe6a40dfe0/layer1.png',
    target: path.join(root, 'expedition/maps/deep_forest/layer1.png'),
    label: 'deep_forest/layer1.png',
  },
);

async function download(item) {
  try { if ((await fs.stat(item.target)).size > 0) return 'cached'; } catch { /* Not downloaded yet. */ }
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(item.url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = Buffer.from(await response.arrayBuffer());
      if (data.length < 8 || !data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && !data.subarray(0, 4).equals(Buffer.from('RIFF'))) {
        throw new Error('Unexpected image data');
      }
      await fs.mkdir(path.dirname(item.target), { recursive: true });
      await fs.writeFile(item.target, data);
      return 'downloaded';
    } catch (error) {
      if (attempt === 2) return `${item.label}: ${error.message}`;
      await new Promise(resolve => setTimeout(resolve, 400 * (attempt + 1)));
    }
  }
}

async function main() {
  let next = 0;
  const results = await Promise.all(Array.from({ length: 12 }, async () => {
    const items = [];
    while (next < downloads.length) items.push(await download(downloads[next++]));
    return items;
  }));
  const statuses = results.flat();
  const failures = statuses.filter(status => status !== 'cached' && status !== 'downloaded');
  console.log(`Assets: ${statuses.filter(x => x === 'downloaded').length} downloaded, ${statuses.filter(x => x === 'cached').length} cached, ${failures.length} failed`);
  if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
