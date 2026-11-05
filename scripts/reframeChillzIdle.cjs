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

const dir = path.resolve(__dirname, '../public/assets/rollercoin/hamsters/pets/chillz/lvl01');
const srcSprite = decodePng(path.join(dir, 'sprite_idle.png'));

// If it's already 372x62, nothing to do
if (srcSprite.w === 372 && srcSprite.h === 62) {
  console.log('sprite_idle.png is already 372x62.');
  process.exit(0);
}

const TARGET_FRAME_W = 62;
const TARGET_FRAME_H = 62;
const OFFSET_X = 7;
const OFFSET_Y = 12;
const FRAMES = 6;

const dstW = TARGET_FRAME_W * FRAMES;
const dstH = TARGET_FRAME_H;
const dstSprite = Buffer.alloc(dstW * dstH * 4, 0);

for (let f = 0; f < FRAMES; f++) {
  for (let y = 0; y < 48; y++) {
    for (let x = 0; x < 48; x++) {
      const srcIdx = (y * srcSprite.w + f * 48 + x) * 4;
      const dstX = f * TARGET_FRAME_W + x + OFFSET_X;
      const dstY = y + OFFSET_Y;
      const dstIdx = (dstY * dstW + dstX) * 4;
      srcSprite.pixels.copy(dstSprite, dstIdx, srcIdx, srcIdx + 4);
    }
  }
}

const encodedSprite = encodePng(dstW, dstH, dstSprite);
fs.writeFileSync(path.join(dir, 'sprite_idle.png'), encodedSprite);

const dstIdle = Buffer.alloc(TARGET_FRAME_W * TARGET_FRAME_H * 4, 0);
for (let y = 0; y < 48; y++) {
  for (let x = 0; x < 48; x++) {
    const srcIdx = (y * srcSprite.w + x) * 4;
    const dstIdx = ((y + OFFSET_Y) * TARGET_FRAME_W + x + OFFSET_X) * 4;
    srcSprite.pixels.copy(dstIdle, dstIdx, srcIdx, srcIdx + 4);
  }
}

const encodedIdle = encodePng(TARGET_FRAME_W, TARGET_FRAME_H, dstIdle);
fs.writeFileSync(path.join(dir, 'idle.png'), encodedIdle);

console.log('Successfully reframed Chillz idle.png (62x62) and sprite_idle.png (372x62).');
