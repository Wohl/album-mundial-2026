// Fix wrong player photos — uses exact Wikipedia article titles to bypass ambiguous searches
// Usage: node scripts/fix-wrong-photos.mjs

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const sharp = require('sharp');

const ROOT = process.cwd();
const USER_AGENT = 'AlbumMundial2026/1.0 (personal/educational project)';
const TARGET_W = 240;
const TARGET_H = 320;
const MIN_SRC_W = 100;

// Each entry: { file, wikiTitle, lang? }
// wikiTitle = exact Wikipedia article name that unambiguously identifies the footballer
const FIXES = [
  // BRA_3: Bento the goalkeeper — not the Japanese food
  { file: 'BRA/BRA_3.png', titles: ['Bento (footballer)', 'Bento (footballer, born 1999)'], lang: 'en' },
  // BRA_7: Danilo Luiz da Silva — not a politician (already fixed, keeping as safety)
  { file: 'BRA/BRA_7.png', titles: ['Danilo Luiz da Silva', 'Danilo (footballer, born 1991)'], lang: 'en' },
  // BRA_8: Wesley França, Brazilian winger at Fluminense — not a Leicester player
  { file: 'BRA/BRA_8.png', titles: ['Wesley França', 'Wesley (footballer, born 2003)', 'Wesley (footballer, born April 1996)'], lang: 'en' },
  // BRA_12: Luiz Henrique (born 2001) — already fixed, keeping as safety
  { file: 'BRA/BRA_12.png', titles: ['Luiz Henrique (footballer, born 2001)', 'Luiz Henrique (footballer)'], lang: 'en' },
  // BRA_18: Gabriel Martinelli at Arsenal — already fixed, keeping as safety
  { file: 'BRA/BRA_18.png', titles: ['Gabriel Martinelli'], lang: 'en' },
  // USA_11: Christian Roldán, Seattle Sounders midfielder — not an actor
  { file: 'USA/USA_11.png', titles: ['Christian Roldán', 'Christian Roldan (soccer player)', 'Christian Roldan'], lang: 'en' },
  // USA_14: Diego Luna USMNT (born 2003) — not the Mexican actor
  { file: 'USA/USA_14.png', titles: ['Diego Luna (soccer, born 2003)', 'Diego Luna (American soccer player)'], lang: 'en' },
  // AUS_9: Lewis Miller, Australian defender at Hibernian — not Sam Kerr
  { file: 'AUS/AUS_9.png', titles: ['Lewis Miller (footballer)', 'Lewis Miller (Australian footballer)', 'Lewis Miller (soccer)'], lang: 'en' },
  // QAT_7: Pedro Miguel, naturalized Qatari left back — not the Azores parish
  { file: 'QAT/QAT_7.png', titles: ['Pedro Miguel (Qatari footballer)', 'Pedro Miguel (footballer)', 'Pedro Miguel Carvalho'], lang: 'en' },
  // PAR_2: Roberto Fernández, Paraguayan goalkeeper — not a PSG player
  { file: 'PAR/PAR_2.png', titles: ['Roberto Fernández (Paraguayan footballer)', 'Roberto Fernández (goalkeeper)', 'Roberto Fernández (footballer, born 1981)', 'Roberto Fernandez (goalkeeper)'], lang: 'en' },
  // PAR_18: Ramón Sosa, Paraguayan winger at Nottingham Forest
  { file: 'PAR/PAR_18.png', titles: ['Ramón Sosa (footballer)', 'Ramon Sosa (footballer)', 'Ramón Sosa'], lang: 'en' },
];

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchRetry(url, options = {}, maxRetries = 4) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, options);
    if (res.status !== 429) return res;
    const wait = Math.pow(2, attempt + 1) * 2000;
    await sleep(wait);
  }
  throw new Error(`Rate-limited: ${url}`);
}

async function getImageUrlFromWikiTitle(title, lang = 'en') {
  // Step 1: get page image filename via pageimages API
  const metaUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&formatversion=2`;
  const metaRes = await fetchRetry(metaUrl, { headers: { 'User-Agent': USER_AGENT } });
  if (!metaRes.ok) return null;
  const metaData = await metaRes.json();
  const page = (metaData.query?.pages ?? [])[0];
  const filename = page?.pageimage;
  if (!filename) return null;

  // Step 2: resolve to 400px thumbnail via Commons
  const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&iiurlwidth=400&format=json&formatversion=2`;
  const commonsRes = await fetchRetry(commonsUrl, { headers: { 'User-Agent': USER_AGENT } });
  if (!commonsRes.ok) return null;
  const commonsData = await commonsRes.json();
  const filePage = (commonsData.query?.pages ?? [])[0];
  return filePage?.imageinfo?.[0]?.thumburl ?? null;
}

async function getImageUrlFallback(title, lang = 'en') {
  // REST summary fallback (thumbnail, smaller)
  const slug = encodeURIComponent(title.replace(/ /g, '_'));
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${slug}`;
  try {
    const res = await fetchRetry(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.thumbnail?.source ?? null;
  } catch { return null; }
}

async function downloadAndCrop(imgUrl, filepath) {
  const res = await fetchRetry(imgUrl, {
    headers: { 'User-Agent': USER_AGENT, 'Referer': 'https://en.wikipedia.org/' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const tmpPath = filepath + '.tmp';
  fs.writeFileSync(tmpPath, buffer);

  const meta = await sharp(tmpPath).metadata();
  if (!meta.width || meta.width < MIN_SRC_W) {
    fs.unlinkSync(tmpPath);
    throw new Error(`Source too small: ${meta.width ?? '?'}px wide`);
  }

  const cropped = await sharp(tmpPath)
    .resize(TARGET_W, TARGET_H, { fit: 'cover', position: 'attention' })
    .png({ compressionLevel: 8 })
    .toBuffer();
  fs.writeFileSync(filepath, cropped);
  fs.unlinkSync(tmpPath);
}

async function main() {
  console.log('\nFix wrong player photos\n');
  let fixed = 0, failed = 0;

  for (const { file, titles, lang = 'en' } of FIXES) {
    const filepath = path.join(ROOT, 'public', 'players', file);
    const shortFile = file.split('/')[1];
    process.stdout.write(`  ${shortFile.padEnd(12)}`);

    let imgUrl = null;
    for (const title of titles) {
      process.stdout.write(` [${title}]`);
      imgUrl = await getImageUrlFromWikiTitle(title, lang);
      if (!imgUrl) imgUrl = await getImageUrlFromWikiTitle(title, 'pt');
      if (!imgUrl) imgUrl = await getImageUrlFromWikiTitle(title, 'es');
      if (!imgUrl) imgUrl = await getImageUrlFallback(title, lang);
      if (imgUrl) break;
      await sleep(400);
    }

    if (!imgUrl) {
      console.log(' ✗ no image found');
      failed++;
      continue;
    }

    try {
      await downloadAndCrop(imgUrl, filepath);
      console.log(' ✓');
      fixed++;
    } catch (e) {
      console.log(` ! ${e.message}`);
      failed++;
    }
    await sleep(400);
  }

  console.log(`\n═══════════════════`);
  console.log(`✓ Fixed  : ${fixed}`);
  console.log(`✗ Failed : ${failed}`);
  console.log(`═══════════════════\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
