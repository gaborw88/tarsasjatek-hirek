// =====================================================================
//  Magyar játékcímek a BoardGameGeekről – minden mentés (push) után lefut a GitHubon
// ---------------------------------------------------------------------
//  - A cikkek `jatekok` mezőjében felsorolt (eredeti című) játékokat
//    megkeresi a BGG-n, és lekérdezi a nyelvi változataikat (Versions).
//  - Ha van magyar nyelvű kiadás, a kiadót, az évet és a lehetséges magyar
//    címet beírja a cikk `magyarCimek` mezőjébe (a szerkesztőfelületen
//    szürke, csak olvasható mező), hogy jóváhagyás előtt ellenőrizhető legyen.
//  - Az eredményeket a src/data/magyar-cimek.json gyűjti (gyorsítótár), így
//    ugyanazt a játékot nem kérdezzük le újra és újra; ezt a fájlt a
//    hírgyűjtő is elolvassa, mielőtt cikket ír.
//  - A BGG kulcsa (BGG_TOKEN) a GitHub titkos beállításai között van; ha
//    nincs megadva, a script nem csinál semmit.
//  Adatforrás: BoardGameGeek (https://boardgamegeek.com) – Powered by BGG.
// =====================================================================
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import YAML from 'yaml';
import { XMLParser } from 'fast-xml-parser';

const DIR = 'src/content/hirek';
const CACHE_FILE = 'src/data/magyar-cimek.json';
const API = 'https://boardgamegeek.com/xmlapi2';
const RECHECK_FOUND_DAYS = 90;   // ha volt magyar kiadás: ennyi naponta nézzük újra
const RECHECK_MISSING_DAYS = 21; // ha nem volt: ennyi naponta (hátha közben megjelent)
const DELAY_MS = 2500;           // két BGG-kérés között (a BGG kéri, hogy ne terheljük)
const MAX_LOOKUPS = 40;          // egy futásban legfeljebb ennyi új játék

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  isArray: (name) => ['item', 'name', 'link'].includes(name),
});

// ---------------------------------------------------------------------
//  Segédfüggvények
// ---------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .replace(/[’'"]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

/** „Wyrmspan #410201” → { title: 'Wyrmspan', id: '410201' } */
export function parseGameEntry(entry) {
  const s = String(entry || '').trim();
  const m = s.match(/^(.*?)\s*#(\d+)\s*$/);
  return m ? { title: m[1].trim(), id: m[2] } : { title: s, id: null };
}

/** Valószínűleg magyar nyelvű-e egy cím (csak jelölt – a szerkesztő ellenőrzi). */
export function looksHungarian(name) {
  const s = String(name || '');
  if (/[őűŐŰ]/.test(s)) return true;
  if (FOREIGN.test(s)) return false;
  const w = s.toLowerCase();
  if (/[áéíóöúü]/.test(w)) return true;
  const huWord = /(^|[\s:–-])(a|az|és|egy|vagy|meg|nem)(?=[\s:–-]|$)/.test(w);
  const huSuffix = /(ság|ség|ban|ben|ból|ből|ról|ről|nak|nek|tól|től|hoz|hez|ok|ek|ák|ék|ai|ei|ája|ága|ége)(?=[\s:–!?.,-]|$)/.test(w);
  return /(gy|ny|sz|zs|cs|ly|ty)/.test(w) && (huWord || huSuffix);
}
/** Mennyire valószínű, hogy magyar (nagyobb = valószínűbb). */
export function huScore(name) {
  const w = String(name || '').toLowerCase();
  let sc = 1;
  if (/[őű]/.test(w)) sc += 4;
  if (/(^|[\s:–-])(a|az|és|egy|vagy)(?=[\s:–-]|$)/.test(w)) sc += 2;
  if (/(ság|ség|ban|ben|ból|ből|ról|ről|nak|nek|ok|ek|ák|ék|ai|ei|ája|ága|ége|vá|ve)(?=[\s:–!?.,-]|$)/.test(w)) sc += 1;
  if (/(gy|ny|sz|zs|cs|ly|ty)/.test(w)) sc += 1;
  if (/(^|\s)(der|die|das|und|von|im|zum|zur|des|den|dem|ein|eine)(\s|$)/.test(w)) sc -= 5;   // német
  if (/(^|\s)(v|ve|na|se|z|ze|pro|do|od|i|el|la|le|les|de|del|di|il|lo|o|os|as|um|uma)(\s|$)/.test(w)) sc -= 5; // cseh, latin nyelvek
  if (/(ie|ce|ci|ky|ký|ová|ský)$/.test(w.split(/\s+/).pop() || '')) sc -= 3;          // jellegzetes cseh/szlovák végződés
  return sc;
}
// Más nyelvek jellegzetes betűi, illetve nem latin írás → biztosan nem magyar
const FOREIGN = /[ñçàèâêîôûãõäßøåčřšžłęąćńśźżăşţđýěůťďňľĺŕ\u0400-\u04FF\u0370-\u03FF\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF\u0E00-\u0E7F]/i;

/** A thing?versions=1 válaszából: név, alternatív nevek, magyar kiadások. */
export function parseThing(xml) {
  const doc = parser.parse(xml);
  const item = doc?.items?.item?.[0];
  if (!item) return null;
  const names = (item.name || []).map((n) => ({ type: n.type, value: String(n.value) }));
  const primary = names.find((n) => n.type === 'primary')?.value || names[0]?.value || '';
  const alternates = names.filter((n) => n.type !== 'primary').map((n) => n.value);
  const versions = (item.versions?.item || []).map((v) => {
    const links = v.link || [];
    return {
      nev: (v.name || []).find((n) => n.type === 'primary')?.value ?? (v.name || [])[0]?.value ?? '',
      nyelvek: links.filter((l) => l.type === 'language').map((l) => String(l.value)),
      kiadok: links.filter((l) => l.type === 'boardgamepublisher').map((l) => String(l.value)),
      ev: v.yearpublished?.value ? Number(v.yearpublished.value) || null : null,
    };
  });
  const huVersions = versions
    .filter((v) => v.nyelvek.includes('Hungarian'))
    .map(({ nev, kiadok, ev, nyelvek }) => ({ nev: String(nev), kiadok, ev, tobbnyelvu: nyelvek.length > 1 }));
  // Magyar cím-jelöltek: az alternatív nevek közül a magyarnak látszók, és a magyar kiadás
  // neve, ha az nem egy általános megnevezés (pl. „Hungarian edition”).
  const generic = /\b(edition|kiadás|version|printing|reprint|first|second|third|1st|2nd|3rd|multilingual|hungarian)\b/i;
  const candidates = new Set();
  for (const v of huVersions) if (v.nev && !generic.test(v.nev)) candidates.add(v.nev);
  if (huVersions.length) {
    // A magyarnak látszó nevek közül csak a legvalószínűbbek maradnak (pl. német, cseh nevek kiszűrése)
    const scored = alternates.filter(looksHungarian).map((a) => [a, huScore(a)]);
    const best = Math.max(-99, ...scored.map(([, sc]) => sc));
    for (const [a, sc] of scored) if (sc === best && sc > 0) candidates.add(a);
  }
  // Ha nincs biztos jelölt: a latin betűs, nem idegen jellegű alternatív nevek (a szerkesztő választ)
  const egyebNevek = huVersions.length && !candidates.size
    ? alternates.filter((a) => !FOREIGN.test(a) && norm(a) !== norm(primary)).slice(0, 10) : [];
  return {
    id: String(item.id),
    nev: primary,
    tipus: item.type,
    ev: item.yearpublished?.value ? Number(item.yearpublished.value) || null : null,
    magyarKiadas: huVersions.length > 0,
    magyarKiadasok: huVersions,
    magyarCimJeloltek: [...candidates],
    egyebNevek,
  };
}

/** A search válaszából a legjobban illő játék azonosítója. */
export function pickSearchResult(xml, title) {
  const doc = parser.parse(xml);
  const items = doc?.items?.item || [];
  if (!items.length) return null;
  const want = norm(title);
  const scored = items.map((it) => {
    const n = (it.name || [])[0] || {};
    const exact = norm(n.value) === want;
    return { id: String(it.id), nev: String(n.value || ''), type: it.type, exact, primary: n.type === 'primary',
      year: Number(it.yearpublished?.value) || 0 };
  });
  // Pontos egyezés előnyben (elsődleges név > alternatív), alapjáték > kiegészítő, újabb > régebbi
  scored.sort((a, b) => (b.exact - a.exact) || (b.primary - a.primary)
    || ((a.type === 'boardgame' ? 0 : 1) - (b.type === 'boardgame' ? 0 : 1)) || (b.year - a.year));
  const best = scored[0];
  return { id: best.id, biztos: best.exact, talalatok: items.length };
}

/** A szerkesztőnek szóló sor egy játékról. */
export function describe(title, info) {
  if (!info) return `${title}: még nincs lekérdezve`;
  if (info.hiba) return `${title}: nem található a BGG-n – nézd meg kézzel`;
  const bgg = `BGG #${info.id}${info.biztos === false ? ', bizonytalan találat – ellenőrizd, jó játék-e' : ''}`;
  if (!info.magyarKiadas) return `${title}: a BGG szerint nincs magyar kiadása (${bgg})`;
  const kiadok = [...new Set(info.magyarKiadasok.flatMap((v) => v.kiadok))].join(', ') || 'ismeretlen kiadó';
  const evek = [...new Set(info.magyarKiadasok.map((v) => v.ev).filter(Boolean))].sort().join(', ');
  const tobb = info.magyarKiadasok.every((v) => v.tobbnyelvu) ? ', többnyelvű dobozban' : '';
  const kiadas = `${kiadok}${evek ? `, ${evek}` : ''}${tobb}`;
  if (info.magyarCimJeloltek.length === 1) return `${title} → ${info.magyarCimJeloltek[0]} (${kiadas}; ${bgg})`;
  if (info.magyarCimJeloltek.length > 1)
    return `${title} → VAN MAGYAR KIADÁS (${kiadas}); lehetséges magyar cím: ${info.magyarCimJeloltek.join(' / ')} (${bgg})`;
  const egyeb = (info.egyebNevek || []).length ? `; a BGG-n szereplő további nevek: ${info.egyebNevek.join(' / ')}` : '';
  return `${title} → VAN MAGYAR KIADÁS (${kiadas}), a magyar cím nem azonosítható biztosan – lehet, hogy azonos az eredetivel${egyeb} (${bgg})`;
}

// ---------------------------------------------------------------------
//  BGG-lekérdezés
// ---------------------------------------------------------------------
async function bgg(path, token) {
  for (let attempt = 1; attempt <= 6; attempt++) {
    const res = await fetch(`${API}/${path}`, {
      headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'DOBJektiv (dobjektiv.hu, non-commercial)' },
    });
    if (res.status === 200) { await sleep(DELAY_MS); return await res.text(); }
    if (res.status === 401 || res.status === 403) throw new Error(`A BGG elutasította a kulcsot (HTTP ${res.status}) – ellenőrizd a BGG_TOKEN titkot.`);
    // 202 = sorban áll, 429 = túl sok kérés, 5xx = átmeneti hiba → várunk és újra
    await sleep(DELAY_MS * attempt * 2);
  }
  throw new Error(`A BGG nem válaszolt: ${path}`);
}

async function lookup(entry, token) {
  const { title, id: pinned } = parseGameEntry(entry);
  let id = pinned, biztos = true;
  if (!id) {
    const q = encodeURIComponent(title);
    let pick = pickSearchResult(await bgg(`search?query=${q}&type=boardgame,boardgameexpansion&exact=1`, token), title);
    if (!pick) pick = pickSearchResult(await bgg(`search?query=${q}&type=boardgame,boardgameexpansion`, token), title);
    if (!pick) return { hiba: 'nincs találat' };
    id = pick.id; biztos = pick.biztos;
  }
  const info = parseThing(await bgg(`thing?id=${id}&versions=1`, token));
  if (!info) return { hiba: 'nincs adat', id };
  return { ...info, biztos };
}

// ---------------------------------------------------------------------
//  Cikkek feldolgozása
// ---------------------------------------------------------------------
function parseMd(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  return m ? { data: YAML.parse(m[1]) || {}, body: m[2] } : null;
}
function writeMd(file, data, body) {
  writeFileSync(file, `---\n${YAML.stringify(data, { lineWidth: 0 }).trimEnd()}\n---\n${body}`);
}
const daysSince = (iso) => (Date.now() - new Date(iso || 0).getTime()) / 86400000;

async function main() {
  const token = process.env.BGG_TOKEN;
  if (!token) { console.log('BGG: nincs BGG_TOKEN beállítva – a magyar címek lekérdezése kimarad.'); return; }

  const cache = existsSync(CACHE_FILE) ? JSON.parse(readFileSync(CACHE_FILE, 'utf8')) : {};
  const articles = readdirSync(DIR).filter((f) => f.endsWith('.md')).map((f) => {
    const file = `${DIR}/${f}`;
    return { file, md: parseMd(readFileSync(file, 'utf8')) };
  }).filter((a) => a.md);

  // Mely játékokat kell (újra) lekérdezni?
  const wanted = new Set();
  for (const { md } of articles) for (const g of md.data.jatekok || []) if (String(g).trim()) wanted.add(String(g).trim());
  const due = [...wanted].filter((g) => {
    const c = cache[g];
    if (!c) return true;
    return daysSince(c.ellenorizve) > (c.magyarKiadas ? RECHECK_FOUND_DAYS : RECHECK_MISSING_DAYS);
  }).slice(0, MAX_LOOKUPS);

  let changed = false;
  for (const g of due) {
    try {
      const info = await lookup(g, token);
      cache[g] = { ...info, ellenorizve: new Date().toISOString().slice(0, 10) };
      console.log('BGG:', describe(g, cache[g]));
      changed = true;
    } catch (e) {
      console.log(`BGG: hiba – ${g}: ${e.message}`);
      if (/elutasította a kulcsot/.test(e.message)) break;
    }
  }
  if (changed) {
    mkdirSync('src/data', { recursive: true });
    const sorted = Object.fromEntries(Object.keys(cache).sort((a, b) => a.localeCompare(b, 'hu')).map((k) => [k, cache[k]]));
    writeFileSync(CACHE_FILE, JSON.stringify(sorted, null, 2) + '\n');
  }

  // A cikkek „Magyar címek (BGG)” mezőjének frissítése
  for (const { file, md } of articles) {
    const list = (md.data.jatekok || []).map((g) => String(g).trim()).filter(Boolean);
    const text = list.length ? list.map((g) => describe(parseGameEntry(g).title, cache[g])).join('\n') : undefined;
    if ((md.data.magyarCimek || undefined) === text) continue;
    if (text) md.data.magyarCimek = text; else delete md.data.magyarCimek;
    writeMd(file, md.data, md.body);
    changed = true;
  }
  if (changed) console.log('VALTOZOTT');
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch((e) => { console.log('BGG: váratlan hiba –', e.message); });
}
