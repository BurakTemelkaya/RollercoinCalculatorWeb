// Find every appearance (skin) folder of a RollerCoin hamster on its CDN, starting from one known folder.
// Usage: node scripts/findHamsterSkinFolders.cjs <code> <known folder id> [counterRange=512] [seconds=2]
//   e.g. node scripts/findHamsterSkinFolders.cjs bb_smoke 6af6ff5b75067243b0eeb422
// The known id usually comes from the Hamster Sets API idle_url (the level 1 look).
// Folder ids are MongoDB ObjectIds: 4-byte timestamp + 5-byte process id + 3-byte counter. A hamster's
// looks are created together, so they share the process id and have nearby counters, but the timestamp can
// differ by a second (BB Smoke's level 50 was 1 s earlier and 51 counter steps away). So we scan
// counter ± counterRange for every timestamp within ± seconds, using HEAD on idle.png (200 = exists).
const [code, known, counterRange = '512', seconds = '2'] = process.argv.slice(2);
if (!code || !/^[0-9a-f]{24}$/.test(known ?? '')) {
  console.error('Usage: node scripts/findHamsterSkinFolders.cjs <code> <24-hex folder id> [counterRange] [seconds]');
  process.exit(1);
}
const time = parseInt(known.slice(0, 8), 16);
const middle = known.slice(8, 18);
const counter = parseInt(known.slice(18), 16);
const hex = (value, width) => value.toString(16).padStart(width, '0');

const ids = [];
for (let dt = -Number(seconds); dt <= Number(seconds); dt++) {
  for (let dc = -Number(counterRange); dc <= Number(counterRange); dc++) ids.push(hex(time + dt, 8) + middle + hex(counter + dc, 6));
}

async function exists(id) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(`https://static.rollercoin.com/static/img/pets/${code}/${id}/idle.png`, { method: 'HEAD', signal: AbortSignal.timeout(20000) });
      return response.status === 200;
    } catch { /* retry network errors */ }
  }
  throw new Error(`${id}: request kept failing`);
}

async function main() {
  const found = [];
  let next = 0;
  // A modest pool keeps the load on RollerCoin's CDN low.
  await Promise.all(Array.from({ length: 12 }, async () => {
    while (next < ids.length) {
      const id = ids[next++];
      if (await exists(id)) found.push(id);
    }
  }));
  // ObjectIds sort by creation; RollerCoin creates looks from the highest level down, so the newest is level 1.
  found.sort().reverse();
  if (!found.includes(known)) throw new Error(`The known folder ${known} was not found; check the code`);
  console.log(`Scanned ${ids.length} ids, found ${found.length} folder(s), newest first (usually level 1, 10, 20, ...):`);
  for (const id of found) console.log(`  ${id}  https://static.rollercoin.com/static/img/pets/${code}/${id}/idle.png`);
  console.log('Confirm each level by comparing the idle images with the blog post before using them.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
