/* Test harness: runs the REAL page code, never a copy of it.
   Each calculator keeps its logic in one inline <script>; we pull named
   declarations out of that source text verbatim and evaluate them in a vm
   sandbox with a minimal fake DOM. Zero dependencies (node:test only), in
   keeping with AGENTS.md's no-npm rule. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

/* The page's main logic = its longest attribute-less inline <script>. */
function mainScript(file) {
  const html = read(file);
  const re = /<script>([\s\S]*?)<\/script>/g;
  let best = '', m;
  while ((m = re.exec(html))) if (m[1].length > best.length) best = m[1];
  return best;
}

/* Walk JS source from `i` at bracket depth `depth`, skipping strings,
   template literals (with nested ${}), comments and regex literals, until
   `stop(c, depth)` is true. Returns that index, or -1. Every inner loop is
   bounded by src.length so malformed input cannot hang the suite. */
function scan(src, i, depth, stop) {
  const N = src.length, tpl = []; // depths at which a template ${ was opened
  const skipQuoted = (j, q) => { j++; while (j < N && src[j] !== q) j += src[j] === '\\' ? 2 : 1; return j + 1; };
  const skipTemplate = j => { // j just past ` or past the } closing a ${
    while (j < N) {
      if (src[j] === '\\') { j += 2; continue; }
      if (src[j] === '`') return j + 1;
      if (src[j] === '$' && src[j + 1] === '{') { tpl.push(depth); depth++; return j + 2; }
      j++;
    }
    return N;
  };
  let prev = '(';
  while (i < N) {
    const c = src[i], n = src[i + 1];
    if (c === '/' && n === '/') { const e = src.indexOf('\n', i); i = e < 0 ? N : e; continue; }
    if (c === '/' && n === '*') { const e = src.indexOf('*/', i); i = e < 0 ? N : e + 2; continue; }
    if (c === '"' || c === "'") { i = skipQuoted(i, c); prev = 'a'; continue; }
    if (c === '`') { i = skipTemplate(i + 1); prev = 'a'; continue; }
    if (c === '/' && '(,=:[!&|?{};+-*%<>~^'.includes(prev)) { // regex literal
      let j = i + 1, cls = false;
      while (j < N && (cls || src[j] !== '/')) { if (src[j] === '\\') j++; else if (src[j] === '[') cls = true; else if (src[j] === ']') cls = false; j++; }
      i = j + 1; while (/[a-z]/.test(src[i])) i++; prev = 'a'; continue;
    }
    if (c === '}' && tpl.length && tpl[tpl.length - 1] === depth - 1) { tpl.pop(); depth--; i = skipTemplate(i + 1); prev = 'a'; continue; }
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) depth--;
    if (stop(c, depth)) return i;
    if (!/\s/.test(c)) prev = /[\w$]/.test(c) ? 'a' : c;
    i++;
  }
  return -1;
}

/* Verbatim source of `function name(...) {...}` or of the whole
   `const|let name ... ;` statement that declares `name`. */
function extract(src, name) {
  let k = src.search(new RegExp(`function\\s+${name}\\s*\\(`));
  if (k >= 0) {
    const pe = scan(src, src.indexOf('(', k) + 1, 1, (c, d) => c === ')' && d === 0);
    const b = src.indexOf('{', pe);
    const be = scan(src, b + 1, 1, (c, d) => c === '}' && d === 0);
    if (be < 0) throw new Error(`unterminated function ${name}`);
    return src.slice(k, be + 1);
  }
  k = src.search(new RegExp(`(^|[\\s;])(const|let|var)\\s+${name}\\s*=`, 'm'));
  if (k < 0) {
    // second declarator in a list, e.g. `const a=..., name=...;`
    const j = src.search(new RegExp(`,\\s*${name}\\s*=`));
    if (j < 0) throw new Error(`declaration of ${name} not found`);
    k = src.lastIndexOf('const', j);
  }
  while (/\s|;/.test(src[k])) k++;
  const e = scan(src, k, 0, (c, d) => c === ';' && d === 0);
  if (e < 0) throw new Error(`unterminated declaration ${name}`);
  return src.slice(k, e + 1);
}

/* Fake DOM seeded from the page's own HTML defaults: every <input id>
   gets its value="" and every <select id> its selected (else first)
   <option>, including data-* attributes. Unknown ids are created on
   demand so result writes (textContent/innerHTML) are captured. */
/* Absorbs any canvas/DOM call chain: every property is itself, every call returns itself. */
const NOOP = new Proxy(function () {}, { get: (_, k) => (k === Symbol.toPrimitive ? () => 0 : NOOP), apply: () => NOOP, set: () => true });

function fakeDom(file) {
  const html = file ? read(file) : '';
  const els = {};
  const mk = (id, extra = {}) => (els[id] = Object.assign({
    id, value: '', textContent: '', innerHTML: '', style: {}, dataset: {},
    selectedOptions: [{ dataset: {}, textContent: '' }],
    setAttribute() {}, removeAttribute() {}, classList: { toggle() {}, add() {}, remove() {} },
    width: 1000, height: 420, getContext: () => NOOP, querySelector: () => NOOP,
  }, extra));
  const attr = (tag, a) => { const m = tag.match(new RegExp(`\\s${a}="([^"]*)"`)); return m ? m[1] : undefined; };
  for (const m of html.matchAll(/<input\b[^>]*>/g)) {
    const id = attr(m[0], 'id'); if (id) mk(id, { value: attr(m[0], 'value') ?? '' });
  }
  for (const m of html.matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select>/g)) {
    const id = attr(m[0], 'id'); if (!id) continue;
    const opts = [...m[2].matchAll(/<option\b([^>]*)>([^<]*)/g)];
    if (!opts.length) { mk(id); continue; }
    const sel = opts.find(o => /\sselected\b/.test(o[1])) || opts[0];
    const dataset = {};
    for (const d of sel[1].matchAll(/data-([a-z0-9-]+)="([^"]*)"/g)) dataset[d[1]] = d[2];
    mk(id, { value: attr(sel[0], 'value') ?? sel[2], selectedOptions: [{ dataset, textContent: sel[2] }] });
  }
  const $ = id => els[id] || mk(id);
  $.els = els;
  $.set = (vals) => { for (const k in vals) $(k).value = String(vals[k]); };
  $.get = id => $(id).textContent;
  return $;
}

/* Evaluate the named declarations from `src` in a sandbox and return
   them. `globals` are injected first (e.g. {$}). */
function load(src, names, globals = {}) {
  const seen = new Set(), parts = [];
  for (const n of names) { const s = extract(src, n); if (!seen.has(s)) { seen.add(s); parts.push(s); } }
  const ctx = vm.createContext({
    Math, Number, isFinite, isNaN, parseFloat, parseInt, String, Array, Object, JSON, Date,
    URLSearchParams, console,
    t: (en) => en, // i18n.js stand-in: always English
    window: {}, document: { querySelectorAll: () => [] },
    ...globals,
  });
  ctx.window = ctx;
  return vm.runInContext(parts.join('\n') + `\n;({${names.join(',')}})`, ctx);
}

const page = (file, names, globals) => load(mainScript(file), names, globals);

/* Run a whole compute() against the fake DOM and return the DOM. */
function runCompute(file, inputs, extraNames = [], extraGlobals = {}) {
  const $ = fakeDom(file);
  $.set(inputs || {});
  const src = mainScript(file);
  const names = [];
  for (const n of ['num', 'toDBW', 'fHz', ...extraNames])
    try { extract(src, n); names.push(n); } catch { /* page doesn't have it */ }
  const fns = load(src, [...names, 'compute'], { $, ...extraGlobals });
  fns.compute();
  return $;
}

const loadModcod = () => {
  const ctx = vm.createContext({ Math, window: {} });
  vm.runInContext(read('modcod.js'), ctx);
  return ctx.window.Modcod;
};

module.exports = { ROOT, read, mainScript, extract, fakeDom, load, page, runCompute, loadModcod };
