// Official Homie Hamtana files from RollerCoin's CDN (27 November 2026).
// The level 1 id came from https://rollercoin.com/landing-sale-event/homie-hamtana; the others were found with
// findHamsterSkinFolders.cjs. Levels follow the blog GIF order (https://rollercoin.com/blog/meet-homie-hamtana).
const fs = require('node:fs/promises');
const path = require('node:path');

const cdn = 'https://static.rollercoin.com/static/img/pets/homie_hamtana/';
const levels = {
  1: '6b06fb1965083d65b0a132b1', 10: '6b06fb1965083d65b0a132a7', 20: '6b06fb1965083d65b0a1329d',
  30: '6b06fb1965083d65b0a13293', 40: '6b06fb1965083d65b0a13289', 50: '6b06fb1965083d65b0a13256',
};
const frames = { walk: 8, jump: 7, tap_reaction: 10, go_sleep: 24, take_chest: 9, win_loop: 6 };
const PNG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

async function download(url, width, height) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  const data = Buffer.from(await response.arrayBuffer());
  if (!data.subarray(0, 8).equals(PNG) || data.readUInt32BE(16) !== width || data.readUInt32BE(20) !== height) {
    throw new Error(`${url}: expected a ${width}x${height} PNG`);
  }
  return data;
}

async function main() {
  // Validate every download before writing any local asset.
  const files = (await Promise.all(Object.entries(levels).map(async ([level, id]) => {
    const dir = `lvl${level.padStart(2, '0')}`;
    const sprites = await Promise.all(Object.entries(frames).map(async ([action, count]) =>
      [`${dir}/sprite_${action}.png`, await download(`${cdn}${id}/sprite/${action}.png`, count * 128, 128)]));
    return [[`${dir}/idle.png`, await download(`${cdn}${id}/idle.png`, 160, 160)], ...sprites];
  }))).flat();
  files.push(['background.png', await download(`${cdn}background.png`, 400, 400)]);
  const root = path.resolve(__dirname, '../public/assets/rollercoin/hamsters/pets/homie-hamtana');
  for (const [file, data] of files) {
    await fs.mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await fs.writeFile(path.join(root, file), data);
  }
  console.log(`Homie Hamtana: ${files.length} files for levels ${Object.keys(levels).join('/')} written.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
