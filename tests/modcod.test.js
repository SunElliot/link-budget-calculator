const test = require('node:test');
const assert = require('node:assert/strict');
const { loadModcod, read, fakeDom, page } = require('./harness');
const R = require('./ref');

const near = (a, b, tol, msg) =>
  assert.ok(Math.abs(a - b) <= tol, `${msg ?? ''} got ${a}, expected ${b} ± ${tol}`);
const M = loadModcod();
const mod = id => M.MODS.find(m => m.id === id);
const req = (id, ber = 1e-5) => M.reqEbN0(mod(id).f, ber);

test('2.1 erfc approximation: relative error < 1.5e-7 on [0, 6] (Numerical Recipes erfcc bound 1.2e-7)', () => {
  let worst = 0;
  for (let x = 0; x <= 6; x += 0.01) {
    const q = M.Q(x * Math.SQRT2) * 2, ref = R.erfc(x);
    worst = Math.max(worst, Math.abs(q / ref - 1));
  }
  assert.ok(worst < 1.5e-7, `worst rel err ${worst}`);
});

test('2.2 Closed-form thresholds @BER 1e-5: BPSK 9.59, DBPSK 10.34, coherent BFSK 12.60 dB (±0.01)', () => {
  const qinv = 4.264890793922825; // Q⁻¹(1e-5)
  near(req('bpsk'), R.dB(qinv * qinv / 2), 0.01, 'BPSK');
  near(req('dbpsk'), R.dB(Math.log(0.5 / 1e-5)), 0.01, 'DBPSK');
  near(req('bfsk'), R.dB(qinv * qinv), 0.01, 'BFSK');
});

test('2.3 8-PSK: nearest-neighbour approx within 0.1 dB of exact Craig-integral SER/3 @1e-5', () => {
  const Mo = 8, k = 3;
  const ser = ebdb => { // Craig 1991: Ps = 1/π ∫0^{π−π/M} exp(−γs sin²(π/M)/sin²θ) dθ
    const gs = k * R.lin(ebdb), N = 4000, a = Math.PI - Math.PI / Mo, h = a / N; let s = 0;
    for (let i = 1; i < N; i++) { const th = i * h; s += Math.exp(-gs * Math.sin(Math.PI / Mo) ** 2 / Math.sin(th) ** 2); }
    return s * h / Math.PI;
  };
  const exact = R.solveDb(eb => ser(eb) / k, 1e-5);
  near(req('8psk'), exact, 0.1, '8PSK');
});

test('2.4 Gray 16-QAM: within 0.05 dB of the exact expression (Proakis 3-term) @1e-5', () => {
  const pb = eb => { const a = Math.sqrt(0.8 * R.lin(eb));
    return 0.75 * R.Q(a) + 0.5 * R.Q(3 * a) - 0.25 * R.Q(5 * a); };
  near(req('16qam'), R.solveDb(pb, 1e-5), 0.05);
});

test('2.5 Every BER curve is monotone decreasing in Eb/N0 over −5…25 dB', () => {
  for (const m of M.MODS) {
    let prev = Infinity;
    for (let e = -5; e <= 25; e += 0.25) { const b = m.f(e); assert.ok(b <= prev + 1e-15, `${m.id} @${e}`); prev = b; }
  }
});

test('2.6 reqEbN0 admits out-of-range targets with NaN instead of clamping', () => {
  assert.ok(Number.isNaN(M.reqEbN0(mod('bpsk').f, 0.45)));   // BER(−20 dB)=0.444: already met
  assert.ok(Number.isNaN(M.reqEbN0(() => 1e-3, 1e-5)));        // flat floor: never reached
});

/* DVB-S2 APSK geometry, ETSI EN 302 307-1 §5.4.3–5.4.4 (figs. 11–12):
   16APSK inner 4 @ π/4+kπ/2, outer 12 @ π/12+kπ/6;
   32APSK inner 4 @ π/4+kπ/2, middle 12 @ π/12+kπ/6, outer 16 @ kπ/8. */
const src = read('modcod.js');
const rings = name => {
  const m = src.match(new RegExp(`${name}=apskPts\\(\\[([^\\]]+)\\]`));
  return [...m[1].matchAll(/n:(\d+),r:([\d.]+),off:([^}]+)/g)]
    .map(x => ({ n: +x[1], r: +x[2], off: Function('return ' + x[3].replace(/Math\.PI/g, String(Math.PI)))() }));
};

test('2.7 16APSK ring phases follow EN 302 307-1 (outer ring offset π/12)', () => {
  const r = rings('C16APSK');
  near(r[0].off, Math.PI / 4, 1e-9, 'inner');
  near(r[1].off % (Math.PI / 6), Math.PI / 12, 1e-9, 'outer');
});

test('2.8 32APSK ring phases follow EN 302 307-1 (middle ring offset π/12)', () => {
  const r = rings('C32APSK');
  near(r[1].off % (Math.PI / 6), Math.PI / 12, 1e-9, 'middle');
  near(r[2].off % (Math.PI / 8), 0, 1e-9, 'outer');
});

test('2.9 Impact of the APSK geometry on the plotted 16APSK curve is < 0.2 dB @1e-5', (t) => {
  // Independent union bound on the standard constellation (same bound the page uses).
  const pts = [];
  for (let k = 0; k < 4; k++) { const a = Math.PI / 4 + k * Math.PI / 2; pts.push([Math.cos(a), Math.sin(a)]); }
  for (let k = 0; k < 12; k++) { const a = Math.PI / 12 + k * Math.PI / 6; pts.push([2.85 * Math.cos(a), 2.85 * Math.sin(a)]); }
  const e = pts.reduce((s, p) => s + p[0] ** 2 + p[1] ** 2, 0) / 16, sc = 1 / Math.sqrt(e);
  const P = pts.map(p => [p[0] * sc, p[1] * sc]);
  const ber = eb => { const g = R.lin(eb); let s = 0;
    for (const a of P) for (const b of P) if (a !== b) s += R.Q(Math.sqrt(4 * g / 2) * Math.hypot(a[0] - b[0], a[1] - b[1]));
    return Math.min(s / 16 / 4, 0.5); };
  const ref = R.solveDb(ber, 1e-5), got = req('16apsk');
  t.diagnostic(`16APSK @1e-5: page ${got.toFixed(2)} dB, standard geometry ${ref.toFixed(2)} dB`);
  near(got, ref, 0.2);
});

test('2.10 Link-budget uncoded dropdown is synced from modcod.js at runtime (no drift)', () => {
  const html = read('link-budget.html');
  assert.match(html, /function syncUncodedThresholds/);
  const $ = fakeDom('link-budget.html');
  const fn = page('link-budget.html', ['syncUncodedThresholds'], { $, Modcod: M, document: {
    querySelectorAll: () => [], querySelector: () => null } });
  assert.equal(typeof fn.syncUncodedThresholds, 'function');
});
