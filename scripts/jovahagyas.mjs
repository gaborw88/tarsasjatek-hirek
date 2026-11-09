// =====================================================================
//  Kétlépcsős jóváhagyás – minden mentés (push) után lefut a GitHubon
// ---------------------------------------------------------------------
//  - Szerkesztő jóváhagyja a cikket (approved: true)
//  - Ha a szerkesztő "ellenőrzés nélkül publikálhat", a cikk azonnal kimegy,
//    különben "főszerkesztőre vár", amíg a főszerkesztő is jóvá nem hagyja.
//  - Főszerkesztői jóváhagyást csak főszerkesztő adhat (máskor visszaállítjuk).
//  - A szerkesztők listáját (szerkesztok.yml) csak főszerkesztő módosíthatja.
//  - Ha egy ellenőrzött (nem megbízható) szerkesztő egy már jóváhagyott cikk
//    szövegét módosítja, a cikk újra főszerkesztői jóváhagyásra kerül.
//  - Rögzíti: ki szerkesztette utoljára, ki hagyta jóvá – időponttal együtt.
// =====================================================================
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import YAML from 'yaml';

const BEFORE = process.env.BEFORE || '';
const AFTER = process.env.AFTER || 'HEAD';
const DIR = 'src/content/hirek';
const EDITORS_FILE = 'szerkesztok.yml';
const ZERO = /^0+$/;

const sh = (cmd) => execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
const tryShow = (rev, file) => { try { return sh(`git show ${rev}:${file}`); } catch { return null; } };

function parseMd(text) {
  if (!text) return null;
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return null;
  return { data: YAML.parse(m[1]) || {}, body: m[2] };
}
function writeMd(file, data, body) {
  writeFileSync(file, `---\n${YAML.stringify(data, { lineWidth: 0 }).trimEnd()}\n---\n${body}`);
}

function loadEditors(text) {
  const list = (text && YAML.parse(text)?.szerkesztok) || [];
  const map = new Map();
  // A commit szerzője a GitHub-felhasználónév, vagy ha a profilban meg van adva, a teljes név –
  // ezért mindkettővel (és az opcionális githubNev mezővel) azonosítunk.
  for (const e of list) {
    if (!e?.github) continue;
    for (const k of [e.github, e.nev, e.githubNev]) if (k) map.set(String(k).trim().toLowerCase(), e);
  }
  return map;
}

const STATUS = { draft: '⏳ tervezet', waiting: '👀 főszerkesztőre vár', live: '✅ megjelent' };
const statusOf = (d) => (d.approved ? (d.chiefApproved ? STATUS.live : STATUS.waiting) : STATUS.draft);

// --- Mely fájlok változtak, és ki módosította őket utoljára? -----------------
const hasBefore = BEFORE && !ZERO.test(BEFORE) && tryShow(BEFORE, 'package.json') !== null;
const range = hasBefore ? `${BEFORE}..${AFTER}` : `${AFTER}~1..${AFTER}`;
const lastAuthor = new Map(); // fájl -> GitHub-felhasználónév (commit szerzője)
const lastTime = new Map();   // fájl -> a módosítás (commit) időpontja
try {
  const log = sh(`git log --reverse --format=@@%an@@%aI --name-only ${range}`);
  let author = '', time = '';
  for (const line of log.split('\n')) {
    if (line.startsWith('@@')) [, author, time] = line.split('@@').map((x) => x.trim());
    else if (line.trim()) { lastAuthor.set(line.trim(), author); lastTime.set(line.trim(), time); }
  }
} catch { /* első futás */ }

const baseRev = hasBefore ? BEFORE : `${AFTER}~1`;
let changedSomething = false;

// --- 1. Szerkesztők listája: csak főszerkesztő módosíthatja -------------------
const prevEditorsText = tryShow(baseRev, EDITORS_FILE);
const prevEditors = loadEditors(prevEditorsText);
let editors = loadEditors(existsSync(EDITORS_FILE) ? readFileSync(EDITORS_FILE, 'utf8') : '');
if (lastAuthor.has(EDITORS_FILE) && prevEditorsText !== null) {
  const who = (lastAuthor.get(EDITORS_FILE) || '').toLowerCase();
  const role = prevEditors.get(who)?.szerep;
  if (role !== 'foszerkeszto') {
    console.log(`A szerkesztők listáját nem főszerkesztő (${who}) módosította – visszaállítva.`);
    writeFileSync(EDITORS_FILE, prevEditorsText.endsWith('\n') ? prevEditorsText : prevEditorsText + '\n');
    editors = prevEditors;
    changedSomething = true;
  }
}
const nameOf = (login) => editors.get(login)?.nev || login;
// Időbélyegző a név mögé, budapesti idő szerint – pl. „Weszprémy Gábor · 2026. 11. 09. 09:24”
const stamp = (who, iso) => {
  const t = new Date(iso || Date.now());
  const s = new Intl.DateTimeFormat('hu-HU', { timeZone: 'Europe/Budapest', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(t);
  return `${who} · ${s}`;
};

// --- 1/b. Fix oldalak (Rólunk, Impresszum): csak főszerkesztő vagy a hírgyűjtő (kérésre) módosíthatja ---
for (const [file, who] of lastAuthor) {
  if (!file.startsWith('src/content/oldalak/')) continue;
  const isBot = who === 'Claude';
  if (isBot || editors.get(who.toLowerCase())?.szerep === 'foszerkeszto') continue;
  const prevText = tryShow(baseRev, file);
  if (prevText !== null) {
    console.log(`${file}: nem főszerkesztő (${who}) módosította – visszaállítva.`);
    writeFileSync(file, prevText.endsWith('\n') ? prevText : prevText + '\n');
    changedSomething = true;
  }
}

// --- 2. Cikkek -----------------------------------------------------------------
for (const f of readdirSync(DIR).filter((x) => x.endsWith('.md'))) {
  const file = `${DIR}/${f}`;
  const cur = parseMd(readFileSync(file, 'utf8'));
  if (!cur) continue;
  const d = cur.data;
  const before = JSON.stringify(d);

  // Régi cikkek átállítása az új mezőkre
  if (d.approved === undefined) d.approved = !!d.published;
  if (d.chiefApproved === undefined) d.chiefApproved = !!d.published;

  if (lastAuthor.has(file)) {
    const loginRaw = lastAuthor.get(file) || '';
    const login = loginRaw.toLowerCase();
    const isBot = loginRaw === 'Claude' || /\[bot\]$/.test(loginRaw) || login === 'github-actions';
    const ed = editors.get(login);
    const isChief = !isBot && ed?.szerep === 'foszerkeszto';
    const trusted = !isBot && (isChief || ed?.ellenorzesNelkul === true);
    const when = lastTime.get(file);
    const prev = parseMd(tryShow(baseRev, file));
    const p = prev?.data || {};
    const pApproved = p.approved ?? !!p.published;
    const pChief = p.chiefApproved ?? !!p.published;

    // Utolsó szerkesztő
    d.lastEditedBy = stamp(isBot ? 'Hírgyűjtő (nyelvi modell)' : nameOf(login), when);

    // Jóváhagyást a hírgyűjtő vagy listán kívüli felhasználó nem adhat
    if ((isBot || !ed) && d.approved && !pApproved) { d.approved = false; console.log(`${f}: jóváhagyás visszavonva (${loginRaw} nem szerkesztő)`); }
    // Főszerkesztői jóváhagyást csak főszerkesztő adhat
    if (d.chiefApproved && !pChief && !isChief && !(trusted && d.approved)) {
      d.chiefApproved = false; console.log(`${f}: főszerkesztői jóváhagyás visszavonva (${loginRaw})`);
    }

    // Szerkesztői jóváhagyás most történt
    if (d.approved && !pApproved) {
      d.approvedBy = stamp(nameOf(login), when);
      if (trusted) {
        d.chiefApproved = true;
        d.chiefApprovedBy = stamp(isChief ? nameOf(login) : 'automatikus', when);
      }
    }
    // Főszerkesztő most hagyta jóvá
    if (d.chiefApproved && !pChief && isChief) {
      d.chiefApprovedBy = stamp(nameOf(login), when);
      if (!d.approved) { d.approved = true; d.approvedBy = d.approvedBy || stamp(nameOf(login), when); }
    }
    // Ellenőrzött szerkesztő módosította egy már jóváhagyott cikk szövegét -> újra ellenőrzés
    if (prev && pChief && d.chiefApproved && !trusted && !isBot && ed) {
      const contentChanged = prev.body !== cur.body || p.title !== d.title || p.description !== d.description;
      if (contentChanged) { d.chiefApproved = false; d.chiefApprovedBy = ''; console.log(`${f}: módosult, újra főszerkesztőre vár`); }
    }
    // Visszavonások
    if (!d.approved) { d.chiefApproved = false; d.approvedBy = ''; d.chiefApprovedBy = ''; }
    if (!d.chiefApproved) d.chiefApprovedBy = '';
  }

  d.published = !!(d.approved && d.chiefApproved);
  d.status = statusOf(d);
  // A megjelenés (jóváhagyás) időpontja – az RSS-csatorna és a Facebook-posztolás ehhez igazodik
  if (d.published && !d.publishedAt) {
    d.publishedAt = lastAuthor.has(file) ? new Date().toISOString() : new Date(d.date).toISOString();
  }
  if (!d.published && 'publishedAt' in d) delete d.publishedAt;

  if (JSON.stringify(d) !== before) {
    writeMd(file, d, cur.body);
    changedSomething = true;
    console.log(`${f}: ${d.status}`);
  }
}

console.log(changedSomething ? 'VALTOZOTT' : 'nincs változás');
