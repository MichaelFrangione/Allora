// Run with: node scripts/gen-conjugations.js
const fs = require("fs");
const path = require("path");

// ── Conjugation helpers ────────────────────────────────────────────────────────

function are(verb, meaning) {
  const stem = verb.slice(0, -3); // remove -are

  // -care: add h before i endings (cercare, giocare)
  if (verb.endsWith("care")) {
    const s = verb.slice(0, -4);
    return make(verb, meaning, "presente", "regular -ARE",
      s+"co", s+"chi", s+"ca", s+"chiamo", s+"cate", s+"cano");
  }
  // -gare: add h before i endings (pagare, pregare, spiegare)
  if (verb.endsWith("gare")) {
    const s = verb.slice(0, -4);
    return make(verb, meaning, "presente", "regular -ARE",
      s+"go", s+"ghi", s+"ga", s+"ghiamo", s+"gate", s+"gano");
  }
  // stems ending in -i (baciare, studiare, viaggiare, etc.)
  // tu = stem (not stem+i), noi = stem+amo (not stem+iamo)
  if (stem.endsWith("i")) {
    return make(verb, meaning, "presente", "regular -ARE",
      stem+"o", stem, stem+"a", stem+"amo", stem+"ate", stem+"ano");
  }
  // standard regular -ARE
  return make(verb, meaning, "presente", "regular -ARE",
    stem+"o", stem+"i", stem+"a", stem+"iamo", stem+"ate", stem+"ano");
}

function ere(verb, meaning) {
  const stem = verb.slice(0, -3);
  return make(verb, meaning, "presente", "regular -ERE",
    stem+"o", stem+"i", stem+"e", stem+"iamo", stem+"ete", stem+"ono");
}

function ire1(verb, meaning) {
  const stem = verb.slice(0, -3);
  return make(verb, meaning, "presente", "regular -IRE",
    stem+"o", stem+"i", stem+"e", stem+"iamo", stem+"ite", stem+"ono");
}

function isc(verb, meaning) {
  const stem = verb.slice(0, -3);
  return make(verb, meaning, "presente", "regular -IRE (-isc-)",
    stem+"isco", stem+"isci", stem+"isce", stem+"iamo", stem+"ite", stem+"iscono");
}

function irr(verb, meaning, io, tu, luilei, noi, voi, loro) {
  return make(verb, meaning, "presente", "irregular",
    io, tu, luilei, noi, voi, loro);
}

function make(verb, meaning, tense, type, io, tu, luilei, noi, voi, loro) {
  return { verb, meaning: `${meaning} (${type})`, tense, forms: {
    "io": io, "tu": tu, "lui/lei": luilei, "noi": noi, "voi": voi, "loro": loro
  }};
}

// ── New conjugations ───────────────────────────────────────────────────────────

const newConjs = [
  // Regular -ARE
  are("abbracciare",  "to hug"),
  are("abitare",      "to live, reside"),
  are("amare",        "to love"),
  are("ascoltare",    "to listen"),
  are("assomigliare", "to resemble"),
  are("baciare",      "to kiss"),
  are("ballare",      "to dance"),
  are("camminare",    "to walk"),
  are("cantare",      "to sing"),
  are("cercare",      "to look for"),
  are("chiacchierare","to chat"),
  are("chiamare",     "to call"),
  are("cominciare",   "to begin"),
  are("comprare",     "to buy"),
  are("costare",      "to cost"),
  are("cucinare",     "to cook"),
  are("domandare",    "to ask"),
  are("firmare",      "to sign"),
  are("guardare",     "to look, watch"),
  are("guidare",      "to drive"),
  are("imparare",     "to learn"),
  are("insegnare",    "to teach"),
  are("odiare",       "to hate"),
  are("ordinare",     "to order"),
  are("pagare",       "to pay"),
  are("portare",      "to bring, carry"),
  are("pranzare",     "to have lunch"),
  are("pregare",      "to pray"),
  are("prenotare",    "to book, reserve"),
  are("preparare",    "to prepare"),
  are("respirare",    "to breathe"),
  are("ringraziare",  "to thank"),
  are("sbagliare",    "to make a mistake"),
  are("sperare",      "to hope"),
  are("spiegare",     "to explain"),
  are("studiare",     "to study"),
  are("trovare",      "to find"),
  are("viaggiare",    "to travel"),
  are("visitare",     "to visit"),
  are("volare",       "to fly"),
  are("affittare",    "to rent"),
  are("arrivare",     "to arrive"),
  are("aspettare",    "to wait for"),
  are("cambiare",     "to change"),
  are("giocare",      "to play (a game/sport)"),
  are("suonare",      "to play (an instrument)"),
  are("nuotare",      "to swim"),
  are("ritornare",    "to return"),
  are("sembrare",     "to seem"),
  are("cenare",       "to have dinner"),

  // Regular -ERE
  ere("battere",      "to hit, beat"),
  ere("cadere",       "to fall"),
  ere("conoscere",    "to know (a person/place)"),
  ere("correre",      "to run"),
  ere("credere",      "to believe"),
  ere("decidere",     "to decide"),
  ere("descrivere",   "to describe"),
  ere("mettere",      "to put, place"),
  ere("mordere",      "to bite"),
  ere("offendere",    "to offend"),
  ere("perdere",      "to lose"),
  ere("ridere",       "to laugh"),
  ere("rompere",      "to break"),
  ere("scrivere",     "to write"),
  ere("sopravvivere", "to survive"),
  ere("sorridere",    "to smile"),
  ere("vivere",       "to live"),
  ere("rispondere",   "to answer"),
  ere("dipingere",    "to paint"),

  // Regular -IRE type 1
  ire1("aprire",   "to open"),
  ire1("bollire",  "to boil"),
  ire1("coprire",  "to cover"),
  ire1("mentire",  "to lie"),
  ire1("offrire",  "to offer"),
  ire1("scoprire", "to discover"),
  ire1("seguire",  "to follow"),
  ire1("sentire",  "to hear, feel"),
  ire1("servire",  "to serve"),
  ire1("soffrire", "to suffer"),
  ire1("vestire",  "to dress"),
  // cucire is slightly irregular (io cucio not cuco)
  irr("cucire", "to sew", "cucio", "cuci", "cuce", "cuciamo", "cucite", "cuciono"),

  // Regular -IRE type 2 (-isc-)
  isc("pulire",      "to clean"),
  isc("sparire",     "to disappear"),
  isc("suggerire",   "to suggest"),
];

// ── Load existing and merge ────────────────────────────────────────────────────

const existing = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../data/conjugations.json"), "utf8")
);

const existingVerbs = new Set(existing.map((c) => c.verb));
const toAdd = newConjs.filter((c) => !existingVerbs.has(c.verb));

// Assign IDs starting after last existing
const lastId = existing.reduce((max, c) => {
  const n = parseInt(c.id.replace("c", ""), 10);
  return n > max ? n : max;
}, 0);

const withIds = toAdd.map((c, i) => ({
  id: `c${String(lastId + i + 1).padStart(3, "0")}`,
  ...c,
}));

const merged = [...existing, ...withIds];

fs.writeFileSync(
  path.join(__dirname, "../data/conjugations.json"),
  JSON.stringify(merged, null, 2)
);

console.log(`Added ${withIds.length} conjugations. Total: ${merged.length}`);
withIds.forEach((c) => console.log(`  ${c.id}: ${c.verb} — ${c.forms["io"]}, ${c.forms["tu"]}, ...`));
