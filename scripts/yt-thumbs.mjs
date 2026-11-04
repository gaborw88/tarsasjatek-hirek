// Építés előtt letölti a cikkekben szereplő YouTube-videók előnézeti képeit a public/yt/ mappába,
// így a látogató böngészője nem kapcsolódik a YouTube-hoz (adatvédelem). Hiba esetén csak kihagyja.
import { readdirSync, readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
const dir = 'src/content/hirek';
const out = 'public/yt';
mkdirSync(out, { recursive: true });
const ids = new Set();
for (const f of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
  const m = readFileSync(`${dir}/${f}`, 'utf8').match(/^youtube:\s*['"]?([^'"\n]+)/m);
  const id = m && m[1].match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/|\/live\/)([A-Za-z0-9_-]{11})/)?.[1];
  if (id) ids.add(id);
}
for (const id of ids) {
  const file = `${out}/${id}.jpg`;
  if (existsSync(file)) continue;
  for (const q of ['maxresdefault', 'sddefault', 'hqdefault']) {
    try {
      const r = await fetch(`https://i.ytimg.com/vi/${id}/${q}.jpg`);
      if (!r.ok) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length < 2000) continue; // üres helyettesítő kép
      writeFileSync(file, buf);
      console.log(`YouTube-előnézet letöltve: ${id} (${q})`);
      break;
    } catch (e) {
      console.warn(`Nem sikerült letölteni: ${id} (${q})`);
    }
  }
}
