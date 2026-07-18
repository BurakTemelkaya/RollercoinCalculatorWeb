import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appTsxPath = path.join(__dirname, '../src/App.tsx');

function getTimestampVersion() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // e.g. 20260505
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, ''); // e.g. 214150
  return `${dateStr}.${timeStr}`;
}

const newVersion = getTimestampVersion();

function bumpVersion(content) {
  return content.replace(/CURRENT_CACHE_VERSION\s*=\s*['"]([^'"]+)['"]/, (match) => {
    return `CURRENT_CACHE_VERSION = '${newVersion}'`;
  });
}

let appContent = fs.readFileSync(appTsxPath, 'utf8');
const newAppContent = bumpVersion(appContent);
if (appContent !== newAppContent) {
  fs.writeFileSync(appTsxPath, newAppContent);
  console.log(`Updated App.tsx version to ${newVersion}`);
}
