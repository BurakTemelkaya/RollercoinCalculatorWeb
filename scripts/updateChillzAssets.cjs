// Official Chillz sprites from Minaryganar (same source as updateCuscuzAssets.cjs).
// Their idle.png is really an animated 160x160 GIF; it is split into idle.png + sprite_idle.png
// because HamsterSprite plays idle animations from a horizontal PNG strip.
const fs = require('node:fs/promises');
const path = require('node:path');
const puppeteer = require('puppeteer');

const prefix = 'rollercoin/hamsters/pets/chillz/lvl01';
const sprites = [
  ['sprite_walk.png', 8], ['sprite_jump.png', 7], ['sprite_tap_reaction.png', 11],
  ['sprite_go_sleep.png', 24], ['sprite_take_chest.png', 9], ['sprite_win_loop.png', 6],
];
const PNG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

async function download(file) {
  const response = await fetch(`https://api.minaryganar.com/assets/${prefix}/${file}`, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

async function splitGif(gif) {
  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    // ImageDecoder needs a secure context; serve an empty page from a fake https origin, offline.
    await page.setRequestInterception(true);
    page.on('request', request => request.respond({ contentType: 'text/html', body: '' }));
    await page.goto('https://chillz.invalid/');
    return await page.evaluate(async base64 => {
      const data = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const decoder = new ImageDecoder({ data, type: 'image/gif' });
      await decoder.tracks.ready;
      const count = decoder.tracks.selectedTrack.frameCount;
      const frames = [];
      for (let i = 0; i < count; i++) frames.push((await decoder.decode({ frameIndex: i })).image);
      const { displayWidth: w, displayHeight: h } = frames[0];
      const toPng = async (n) => {
        const canvas = new OffscreenCanvas(w * n, h);
        const ctx = canvas.getContext('2d');
        frames.slice(0, n).forEach((frame, i) => ctx.drawImage(frame, i * w, 0));
        const blob = await canvas.convertToBlob({ type: 'image/png' });
        return btoa(String.fromCharCode(...new Uint8Array(await blob.arrayBuffer())));
      };
      return { w, h, count, durations: frames.map(f => f.duration / 1000), idle: await toPng(1), strip: await toPng(count) };
    }, gif.toString('base64'));
  } finally {
    await browser.close();
  }
}

async function main() {
  // Validate every download before replacing any local asset.
  const files = await Promise.all(sprites.map(async ([file, frames]) => {
    const data = await download(file);
    if (!data.subarray(0, 8).equals(PNG) || data.readUInt32BE(16) !== frames * 128 || data.readUInt32BE(20) !== 128) {
      throw new Error(`${file}: expected a ${frames * 128}x128 PNG`);
    }
    return [file, data];
  }));
  const gif = await download('idle.png');
  if (gif.subarray(0, 6).toString() !== 'GIF89a') throw new Error('idle.png: expected an animated GIF');
  const idle = await splitGif(gif);
  if (idle.w !== 160 || idle.h !== 160 || idle.count < 2) throw new Error(`idle: unexpected ${idle.w}x${idle.h}, ${idle.count} frames`);
  files.push(['idle.png', Buffer.from(idle.idle, 'base64')], ['sprite_idle.png', Buffer.from(idle.strip, 'base64')]);

  const directory = path.resolve(__dirname, '../public/assets', prefix);
  for (const [file, data] of files) await fs.writeFile(path.join(directory, file), data);
  console.log(`Chillz: 6 sprites + idle (${idle.count} frames, durations ${[...new Set(idle.durations)].join('/')} ms) written.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
