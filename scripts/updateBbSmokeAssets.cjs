// Official BB Smoke files from RollerCoin's CDN (13 November 2026).
// Folder ids were found next to the set preview id; levels follow the blog GIF order
// (https://rollercoin.com/blog/bb-smoke). Level 50's folder was supplied by the user (14 November 2026);
// it was created a second earlier, so its id has a different timestamp prefix.
const fs = require('node:fs/promises');
const path = require('node:path');

const cdn = 'https://static.rollercoin.com/static/img/pets/bb_smoke/';
const levels = {
  1: '6af6ff5b75067243b0eeb422', 10: '6af6ff5b75067243b0eeb418', 20: '6af6ff5b75067243b0eeb40e',
  30: '6af6ff5b75067243b0eeb404', 40: '6af6ff5b75067243b0eeb3fa', 50: '6af6ff5a75067243b0eeb3c7',
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
  const root = path.resolve(__dirname, '../public/assets/rollercoin/hamsters/pets/bb-smoke');
  for (const [file, data] of files) {
    await fs.mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await fs.writeFile(path.join(root, file), data);
  }
  console.log(`BB Smoke: ${files.length} files for levels ${Object.keys(levels).join('/')} written.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
