# Társasjáték Hírek – utasítások Claude-nak

Ez egy magyar nyelvű hírblog a társasjáték-iparról (Astro statikus oldal, GitHub Pages).
Az oldal nem kereskedelmi célú, hirdetésmentes, és az is marad (ne javasolj monetizálást).
A tulajdonos nem programozó: vele mindig magyarul, egyszerűen, szakzsargon nélkül kommunikálj.

## Alapszabályok (minden cikkre)

- Cikkek helye: `src/content/hirek/ÉÉÉÉ-HH-NN-rovid-cim.md` (ékezet nélküli, kötőjeles fájlnév).
- **Minden általad készített cikk `published: false` értékkel kerül be.** Megjelentetni csak a tulajdonos hagyhatja jóvá (a szerkesztőfelületen pipálja be). Soha ne állíts `published: true`-t, hacsak a tulajdonos ezt kifejezetten nem kéri az adott cikkre.
- Frontmatter mezők (lásd `src/content.config.ts`):
  ```yaml
  ---
  published: false
  title: "Magyar cím"
  description: "1–2 mondatos összefoglaló"
  date: 2026-11-02T09:00:00+01:00
  type: gyujtott        # gyujtott | forditas | sajat
  author: "Szerkesztőség"
  tags: ["Kiadói hírek", "Essen Spiel"]
  sources:
    - name: "Forrás neve – cikk címe"
      url: "https://..."
  ---
  ```
- Nyelv: igényes, természetes magyar, hírportál-stílus. Játékcímeket az eredeti (angol/német) címükön hagyd, ha van hivatalos magyar kiadás, zárójelben add meg a magyar címet is. Kiadók, tervezők neve eredeti formában.
- Szerzői jog: más weboldalak szövegét **nem másolod át**. Hírösszefoglalónál saját szavaiddal írod meg a tényeket. Idézet legfeljebb egy rövid mondat, idézőjelben, forrásmegjelöléssel.
- Képek: képet **soha ne tölts le, ne linkelj be és ne tegyél az `image` mezőbe** – azt mindig egy szerkesztő tölti fel, miután ellenőrizte a felhasználási jogot.
  Helyette, ha találsz **hivatalos, sajtó számára közzétett képet** (kiadói sajtócsomag / „press kit” / „sajtóanyag” oldal,
  sajtóközlemény melletti letölthető kép, kiadói termékoldal dobozképe), írd be a linkjét az `imageSuggestion` mezőbe így:
  `imageSuggestion: "Hivatalos sajtókép: <link> – javasolt forrásmegjelölés: Fotó: <Kiadó neve>"`.
  Ne javasolj: hírportálok saját fotóit, BoardGameGeek-felhasználók képeit, közösségi médiás képeket, valódi személyekről készült fotókat.
  Ha nincs ilyen hivatalos kép, hagyd üresen a mezőt.
- Csak ellenőrizhető tényt írj. Ha valami bizonytalan (pletyka, nem megerősített), írd ki, hogy nem megerősített, vagy hagyd ki.
- Ha végeztél: commitolj érthető magyar üzenettel, és pushold a `main` ágra, majd röviden sorold fel a tulajdonosnak, milyen tervezetek várnak jóváhagyásra.

## 1. Hírgyűjtés („gyűjts híreket”, vagy ütemezett futás)

1. Keress az elmúlt 1–3 nap társasjátékos híreire a weben. Jó források például:
   BoardGameGeek News, Dicebreaker, BoardGameWire, Meeple Mountain, Tabletop Gaming Magazine,
   Spielbox / brettspiel-news.de, a nagy kiadók (Asmodee, CMON, Stonemaier, Pegasus, KOSMOS, Lookout,
   Czech Games Edition stb.) sajtóközleményei, Kickstarter / Gamefound kampányok, díjak (Spiel des Jahres,
   Golden Geek, As d'Or), rendezvények (Essen Spiel, Gen Con, UK Games Expo, Budapesti Társasjáték Fesztivál stb.).
2. **Magyar megjelenések – kiemelt téma, minden futásnál nézd át!** Keresd a magyar kiadók és forgalmazók
   friss bejelentéseit: új magyar nyelvű kiadások, előrendelések, „hamarosan érkezik” listák, újranyomások,
   magyar fejlesztésű játékok, közösségi finanszírozású (Kickstarter/Gamefound) magyar projektek.
   Rendszeresen figyelendő kiadók és forgalmazók (honlap „újdonságok” / „előrendelés” rovata, blog, hírlevél):
   - Gémklub, Reflexshop (és saját kiadása), Delta Vision, Pagony (Pagony Játékok), Vagabund Kiadó
   - Compaya, Piatnik Budapest, REGIO JÁTÉK, Mindclash Games
   - A lista nem teljes: ha új magyar kiadót vagy forgalmazót találsz (például a Társasjátékok Ünnepe
     kiállítói között, vagy a magyar társasjátékos közösségi oldalakon), vedd fel ide ebbe a listába is.
   Ilyen cikknél: `tags` között legyen a „Magyar megjelenések” és a kiadó neve; add meg a magyar címet és az
   eredeti címet, a kiadót, a megjelenés várható idejét és – ha a kiadó közölte – az árat. Több apró
   bejelentésből készülhet egy gyűjtőcikk is (pl. „Magyar megjelenések a héten”).
3. Mielőtt írsz, nézd meg a `src/content/hirek/` mappát: ne írj meg olyan hírt, ami már szerepel (tervezetként sem).
4. Válaszd ki a legfontosabb, egymástól különböző híreket (ütemezett futásnál 1–3, kézi kérésnél 3–5). Mindegyikből külön cikk legyen:
   - `type: gyujtott`
   - 150–350 szó, saját megfogalmazásban, 1–2 alcímmel ha indokolt
   - lehetőleg 2 független forrás a `sources` listában
5. Mentsd, commitold („Új hírtervezetek: …”), pushold. Ha nincs érdemi új hír, ne írj semmit – ez is rendben van.

## 2. Fordítás linkből („fordítsd le: <link>”)

1. Nyisd meg a linket (WebFetch). Ha nem érhető el, szólj, és kérd meg a tulajdonost, hogy másolja be a szöveget.
2. Készíts hű, de természetes magyar fordítást (nem szó szerinti). A cím legyen magyar hírcím.
3. `type: forditas`, a `sources` első eleme az eredeti cikk (szerzővel, ha ismert: „Dicebreaker – Szerző Neve”).
4. A szöveg elejére ne írj megjegyzést; a forrás megjelenítését az oldal automatikusan elvégzi.
5. **Jelezd a tulajdonosnak: egy cikk teljes fordításának közléséhez az eredeti kiadó/szerző engedélye szükséges** (a fordítás jogilag átdolgozás, Szjt. 29. §). A tervezet engedély nélkül ne jelenjen meg. Ha nincs engedély, ajánld fel, hogy a fordítás helyett saját szavas hírösszefoglaló készüljön ugyanabból (az a tényeket veszi át, nem a szöveget).
6. Mentsd `published: false`-szal, commitold, pushold.

## 3. Saját cikk segítése

Ha a tulajdonos vázlatot, jegyzetet vagy diktált szöveget ad: formázd cikké (`type: sajat`,
`author` az ő neve, ha megadta), javítsd a helyesírást, de a stílusát és véleményét tartsd meg.

## 4. Videóajánló („írj videóajánlót: <YouTube-link>”, vagy hírgyűjtés közben)

1. Nyisd meg a videó oldalát (WebFetch): cím, csatorna, feltöltés dátuma, leírás. A videót nem látod és
   átirat sincs, ezért **csak azt írd le, ami a címből és a leírásból biztosan kiderül** – ne találd ki, mit
   mond a videó, és ne írj véleményt a készítő nevében.
2. `type: video`, `youtube: "<a videó linkje>"` (az oldal beágyazza a videót), a `sources` első eleme a videó
   („YouTube – Csatorna neve: Videó címe”).
3. 80–200 szó: ki készítette (pár szóban a csatornáról), miről szól a videó a leírás alapján, és ha a videó egy
   játékról szól, röviden a játékról (kiadó, tervező, van-e magyar kiadása) – ezt más forrásból ellenőrizd.
4. Tags: „Videó”, a csatorna neve, és a játék/téma. `published: false`, commit, push.

**Figyelt YouTube-csatornák** (hírgyűjtésnél nézd meg, van-e új videójuk az elmúlt napokban – WebSearch,
pl. a csatorna nevével és `allowed_domains: ["youtube.com"]`; a videó oldalán ellenőrizd a feltöltés dátumát,
régi videóról ne írj):
A cél a **hírek**, nem a játékkritikák: olyan videót keress, ami bejelentésről, megjelenésről,
iparági eseményről, rendezvényről vagy díjról szól.
- **The Dice Tower** – főleg a heti hírműsoruk (*Dice Tower Now*), rendezvénybeszámolók, nagy bejelentések
- **BoardGameGeek** – rendezvényes kiadói bemutatók (pl. Essen, Gen Con előzetesek), bejelentések
- **Shut Up & Sit Down** – csak ha hírértékű (pl. nagy rendezvényről szóló videó, iparági téma), kritikáról nem
Kritikáról, szabálymagyarázatról, játékmenet-videóról ne írj videóajánlót. Futásonként legfeljebb 1 videóajánló készüljön.

## Technikai jegyzetek

- Előnézet: `npm run dev` (fejlesztői módban a tervezetek is látszanak, sárga „Tervezet” jelöléssel).
- Az oldal neve, szlogenje, e-mail címe: `src/site.config.ts`.
- Szerkesztőfelület: `public/admin/config.yml` (Sveltia CMS, GitHub backend).
- Közzététel: `.github/workflows/deploy.yml` – minden push a `main` ágra automatikusan frissíti az oldalt.
