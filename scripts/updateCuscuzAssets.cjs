// Verified in Minaryganar's HamstersWikiPublicPage-B_2ZUWTn.js (9 October 2026).
// Download the full official sprite set, replacing the temporary walk/idle previews.
const fs = require('node:fs/promises');
const path = require('node:path');
const prefix = 'rollercoin/hamsters/pets/cuscuz/lvl50';
const files = [
  ['idle.png', 160, 160],
  ['sprite_walk.png', 8 * 128, 128],
  ['sprite_jump.png', 7 * 128, 128],
  ['sprite_tap_reaction.png', 11 * 128, 128],
  ['sprite_go_sleep.png', 24 * 128, 128],
  ['sprite_take_chest.png', 9 * 128, 128],
  ['sprite_win_loop.png', 6 * 128, 128],
];

async function main() {
  // Validate every response before replacing any existing local asset.
  const downloads = await Promise.all(files.map(async ([file, width, height]) => {
    const response = await fetch(`https://api.minaryganar.com/assets/${prefix}/${file}`, {
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
    const data = Buffer.from(await response.arrayBuffer());
    if (data.length < 24 || !data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      || data.readUInt32BE(16) !== width || data.readUInt32BE(20) !== height) {
      throw new Error(`${file}: unexpected PNG dimensions or format`);
    }
    return { file, data };
  }));
  const directory = path.resolve(__dirname, '../public/assets', prefix);
  await fs.mkdir(directory, { recursive: true });
  for (const { file, data } of downloads) {
    // A new URL avoids the previous cutout remaining in browser/CDN caches for 30 days.
    await fs.writeFile(path.join(directory, file === 'idle.png' ? 'idle-official.png' : file), data);
    console.log(`${file}: ${data.length} bytes`);
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
