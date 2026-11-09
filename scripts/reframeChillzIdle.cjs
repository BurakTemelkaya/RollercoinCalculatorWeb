const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

function decodePng(filepath) {
  const buf = fs.readFileSync(filepath);
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  let pos = 8;
  const idats = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.subarray(pos + 4, pos + 8).toString('ascii');
    if (type === 'IDAT') idats.push(buf.subarray(pos + 8, pos + 8 + len));
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idats));
  const bpp = 4;
  const stride = 1 + w * bpp;
  const pixels = Buffer.alloc(w * h * bpp);

  for (let y = 0; y < h; y++) {
    const filter = raw[y * stride];
    for (let x = 0; x < w * bpp; x++) {
      const byte = raw[y * stride + 1 + x];
      const a = x >= bpp ? pixels[y * w * bpp + x - bpp] : 0;
      const b = y > 0 ? pixels[(y - 1) * w * bpp + x] : 0;
      const c = (y > 0 && x >= bpp) ? pixels[(y - 1) * w * bpp + x - bpp] : 0;
      let val = 0;
      if (filter === 0) val = byte;
      else if (filter === 1) val = (byte + a) & 0xff;
      else if (filter === 2) val = (byte + b) & 0xff;
      else if (filter === 3) val = (byte + Math.floor((a + b) / 2)) & 0xff;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        const pr = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
        val = (byte + pr) & 0xff;
      }
      pixels[y * w * bpp + x] = val;
    }
  }
  return { w, h, pixels };
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  const checksum = zlib.crc32(Buffer.concat([typeBuf, data]));
  crc.writeUInt32BE(checksum, 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(width, height, rgbaBuffer) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const scanlines = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    scanlines[y * (1 + width * 4)] = 0;
    rgbaBuffer.copy(scanlines, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = zlib.deflateSync(scanlines);
  return Buffer.concat([sig, makeChunk('IHDR', ihdr), makeChunk('IDAT', idat), makeChunk('IEND', Buffer.alloc(0))]);
}

// Source: 6 native 48x48 frames from the user's Chillz_idle_preview.gif (kept in scripts/).
// Output follows the official idle standard: 160x160 cells, feet on row 147.
// Official idles are 4x game pixels; Chillz's walk sprite is 27 rows tall, so the idle should be ~108px.
// The 40-row source needs 2.75x (a regular 3,3,3,2 pixel pattern) to reach 110px.
const SRC = 48, SCALE = 2.75, CELL = 160, FRAMES = 6, FEET_Y = 147;
const SIZE = Math.ceil(SRC * SCALE);
const dir = path.resolve(__dirname, '../public/assets/rollercoin/hamsters/pets/chillz/lvl01');
const src = decodePng(path.join(__dirname, 'chillz-idle-source.png'));
if (src.w !== SRC * FRAMES || src.h !== SRC) throw new Error(`Unexpected source size ${src.w}x${src.h}`);

let bottom = 0;
for (let y = 0; y < SRC; y++) for (let x = 0; x < src.w; x++) if (src.pixels[(y * src.w + x) * 4 + 3]) bottom = y;
const offsetX = Math.floor((CELL - SIZE) / 2);
const offsetY = FEET_Y - (Math.ceil((bottom + 1) * SCALE) - 1);
if (offsetY < 0 || offsetY + SIZE > CELL) throw new Error('Scaled frame does not fit the cell');

function render(frames) {
  const w = CELL * frames;
  const out = Buffer.alloc(w * CELL * 4, 0);
  for (let f = 0; f < frames; f++) for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const from = (Math.floor(y / SCALE) * src.w + f * SRC + Math.floor(x / SCALE)) * 4;
    src.pixels.copy(out, ((y + offsetY) * w + f * CELL + x + offsetX) * 4, from, from + 4);
  }
  return encodePng(w, CELL, out);
}

fs.writeFileSync(path.join(dir, 'sprite_idle.png'), render(FRAMES));
fs.writeFileSync(path.join(dir, 'idle.png'), render(1));
console.log(`Chillz idle.png (160x160) and sprite_idle.png (960x160) written, ${SCALE}x scale, feet on row ${FEET_Y}.`);
