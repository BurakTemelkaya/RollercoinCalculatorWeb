// Hamster card backgrounds added with the Gym update (13 November 2026).
// Source: https://static.rollercoin.com/static/img/pets/<code>/background.png (400x400 PNG).
// The code is the slug with "_" except where RollerCoin's own pet code differs.
const fs = require('node:fs/promises');
const path = require('node:path');
const hamsters = require('../src/data/hamsters.json');

const CODES = {
  valkirita: 'valkyrie', mamita: 'mammita', 'uncle-azoth': 'unclazoth', 'jack-o-mine': 'jack_omine',
  // Not confirmed by RollerCoin data: the only gift-themed background left, matching the anniversary hamster.
  'mr-jack': 'birthday_jack',
};
const PNG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

async function main() {
  // Validate every download before writing any local file.
  const files = await Promise.all(hamsters.map(async ({ slug, skins }) => {
    const code = CODES[slug] ?? slug.replaceAll('-', '_');
    const response = await fetch(`https://static.rollercoin.com/static/img/pets/${code}/background.png`, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`${slug} (${code}): HTTP ${response.status}`);
    const data = Buffer.from(await response.arrayBuffer());
    if (!data.subarray(0, 8).equals(PNG) || data.readUInt32BE(16) !== 400 || data.readUInt32BE(20) !== 400) {
      throw new Error(`${slug} (${code}): expected a 400x400 PNG`);
    }
    // Same rule as hamsterBackgroundUrl() in src/utils/hamsterAssets.ts: next to the level folders.
    return [path.posix.join(path.posix.dirname(path.posix.dirname(skins[0].walk)), 'background.png'), data];
  }));
  for (const [file, data] of files) await fs.writeFile(path.resolve(__dirname, '../public/assets', file), data);
  console.log(`Wrote ${files.length} hamster backgrounds.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
