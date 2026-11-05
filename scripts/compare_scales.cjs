const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1100, height: 700 });

  const cuscuzB64 = fs.readFileSync(path.resolve(__dirname, '../public/assets/rollercoin/hamsters/pets/cuscuz/lvl50/idle-official.png')).toString('base64');
  const spriteB64 = fs.readFileSync(path.resolve(__dirname, '../public/assets/rollercoin/hamsters/pets/chillz/lvl01/sprite_idle.png')).toString('base64');

  const sizes = [78, 80, 82, 84];
  const itemsHtml = sizes.map(sz => {
    const scale = 62 / sz;
    const leftPercent = ((sz - 62) / 2) / sz * 100;
    const topPercent = (sz - 62) * 0.75 / sz * 100;
    return `
      <div class="card">
        <h3>Frame ${sz}px (${Math.round(scale * 100)}% size)</h3>
        <div class="artwork">
          <div class="member member-0"><img class="hamster-img" src="data:image/png;base64,${cuscuzB64}" /></div>
          <div class="member member-1">
            <div class="chillz-box">
              <img class="chillz-sprite" src="data:image/png;base64,${spriteB64}" style="width: ${600 * scale}%; height: ${100 * scale}%; left: ${leftPercent}%; top: ${topPercent}%;" />
            </div>
          </div>
        </div>
        <div class="roster-preview">
          <div class="roster-item"><img class="hamster-img" src="data:image/png;base64,${cuscuzB64}" /><span>CusCuz</span></div>
          <div class="roster-item"><div class="chillz-box"><img class="chillz-sprite" src="data:image/png;base64,${spriteB64}" style="width: ${600 * scale}%; height: ${100 * scale}%; left: ${leftPercent}%; top: ${topPercent}%;" /></div><span>Chillz</span></div>
        </div>
      </div>
    `;
  }).join('\n');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { background: #0b0f19; color: #fff; font-family: system-ui, sans-serif; padding: 25px; margin: 0; }
        h2 { font-size: 20px; margin-bottom: 20px; text-align: center; color: #a5b4fc; }
        .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .card { background: #111827; border: 1px solid #1f2937; border-radius: 14px; padding: 14px; display: flex; flex-direction: column; align-items: center; }
        .artwork { position: relative; width: 220px; height: 160px; background: #1e2433; border: 1px solid #343b52; border-radius: 12px; margin-bottom: 12px; overflow: hidden; }
        .member { position: absolute; width: 43%; height: 50%; display: flex; align-items: center; justify-content: center; }
        .member-0 { left: 3%; top: 0; }
        .member-1 { right: 3%; top: 0; }
        .hamster-img { width: 100%; height: 100%; object-fit: contain; image-rendering: pixelated; }
        .chillz-box { width: 100%; height: 100%; position: relative; overflow: hidden; }
        .chillz-sprite { position: absolute; image-rendering: pixelated; }
        .roster-preview { display: flex; gap: 8px; width: 100%; }
        .roster-item { flex: 1; height: 112px; background: #1e2433; border: 1px solid #343b52; border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; gap: 4px; padding: 6px; }
        .roster-item .hamster-img { width: 80px; height: 80px; }
        .roster-item .chillz-box { width: 80px; height: 80px; }
        h3 { font-size: 13px; margin: 0 0 10px; color: #cbd5e1; }
      </style>
    </head>
    <body>
      <h2>CusCuz vs Chillz Scale Comparison in Community Set</h2>
      <div class="grid">${itemsHtml}</div>
    </body>
    </html>
  `;

  await page.setContent(html);
  const outPath = path.resolve(__dirname, '../scratch_scale_test.png');
  await page.screenshot({ path: outPath, fullPage: true });
  console.log('Saved test screenshot to:', outPath);
  await browser.close();
})();
