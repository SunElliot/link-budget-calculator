const test = require('node:test');
const assert = require('node:assert/strict');
const { page, runCompute } = require('./harness');

const near = (a, b, tol, msg) =>
  assert.ok(Math.abs(a - b) <= tol, `${msg ?? ''} got ${a}, expected ${b} ± ${tol}`);
const RAIN_FNS = ['kH', 'kV', 'aH', 'aV', 'tval', 'p618core', 'scaleTo', 'outageStr'];
const rain = page('rain.html', RAIN_FNS);
const GAS_FNS = ['rp_', 'rt_', 'phi', 'gammaO', 'g', 'gammaW', 'heights'];
const gas = page('gas.html', GAS_FNS);

/* ITU-R P.838-3 Table 5 (tabulated k, α). The table is the recommendation's
   own evaluation of its equations, so it pins the coefficient transcription. */
const P838 = [ // f GHz, kH, αH, kV, αV
  [10, 0.01217, 1.2571, 0.01129, 1.2156],
  [12, 0.02386, 1.1825, 0.02455, 1.1216],
  [20, 0.09164, 1.0568, 0.09611, 0.9847],
  [30, 0.2403, 0.9485, 0.2291, 0.9129],
];

/* Tolerance = half a unit in the table's last printed digit (+1 % slack),
   so any coefficient slip bigger than the table's own rounding is caught. */
const halfUlp = x => 0.505 * 10 ** -((String(x).split('.')[1] || '').length);

test('3.1 P.838-3 k and α reproduce Table 5 to the table\'s printed precision', () => {
  for (const [f, kh, ah, kv, av] of P838) {
    near(10 ** rain.tval(rain.kH, f), kh, halfUlp(kh), `kH@${f}`);
    near(10 ** rain.tval(rain.kV, f), kv, halfUlp(kv), `kV@${f}`);
    near(rain.tval(rain.aH, f), ah, halfUlp(ah), `αH@${f}`);
    near(rain.tval(rain.aV, f), av, halfUlp(av), `αV@${f}`);
  }
});

/* Second, independent transcription of ITU-R P.618-13 §2.2.1.1 steps 2–10.
   Guards against transcription slips in the page (different author,
   different structure). */
function p618ref(f, el, R001, lat, hs, hR, tau, p) {
  const th = el * Math.PI / 180;
  if (hR - hs <= 0) return 0;                             // step 2 note
  const Ls = (hR - hs) / Math.sin(th);                    // step 2 (θ ≥ 5°)
  const LG = Ls * Math.cos(th);                           // step 3
  const k = (x, a) => a; void k;
  const kh = 10 ** rain.tval(rain.kH, f), kv = 10 ** rain.tval(rain.kV, f);
  const ah = rain.tval(rain.aH, f), av = rain.tval(rain.aV, f);
  const c = Math.cos(th) ** 2 * Math.cos(2 * tau * Math.PI / 180);
  const kk = (kh + kv + (kh - kv) * c) / 2;               // P.838-3 eq (4)
  const aa = (kh * ah + kv * av + (kh * ah - kv * av) * c) / (2 * kk); // eq (5)
  const gR = kk * R001 ** aa;                             // step 4
  const r = 1 / (1 + 0.78 * Math.sqrt(LG * gR / f) - 0.38 * (1 - Math.exp(-2 * LG))); // step 5
  const zeta = Math.atan((hR - hs) / (LG * r));           // step 6
  const LR = zeta > th ? LG * r / Math.cos(th) : (hR - hs) / Math.sin(th);
  const chi = Math.abs(lat) < 36 ? 36 - Math.abs(lat) : 0;
  const v = 1 / (1 + Math.sqrt(Math.sin(th)) * (31 * (1 - Math.exp(-el / (1 + chi))) * Math.sqrt(LR * gR) / (f * f) - 0.45));
  const A001 = gR * LR * v;                               // steps 7–8
  const beta = (p >= 1 || Math.abs(lat) >= 36) ? 0      // step 10
    : (el >= 25 ? -0.005 * (Math.abs(lat) - 36) : -0.005 * (Math.abs(lat) - 36) + 1.8 - 4.25 * Math.sin(th));
  return A001 * (p / 0.01) ** -(0.655 + 0.033 * Math.log(p) - 0.045 * Math.log(A001) - beta * (1 - p) * Math.sin(th));
}

test('3.2 P.618 A_p agrees with an independent transcription (±0.01 dB) across f, θ, lat, p', () => {
  for (const f of [4, 8, 12, 20, 30, 40]) for (const el of [5, 10, 20, 30, 60])
    for (const lat of [10, 30, 45]) for (const p of [1, 0.1, 0.01, 0.001]) {
      const core = rain.p618core(f, el, 42, lat, 0.1, 3.5, 45);
      const got = rain.scaleTo(core.A001, p, el, lat);
      near(got, p618ref(f, el, 42, lat, 0.1, 3.5, 45, p), 0.01, `f=${f} el=${el} lat=${lat} p=${p}`);
    }
});

test('3.3 P.618 scaling is the identity at p = 0.01 % and monotone in p', () => {
  const c = rain.p618core(20, 30, 42, 40, 0.1, 3, 45);
  near(rain.scaleTo(c.A001, 0.01, 30, 40), c.A001, 1e-9);
  let prev = Infinity;
  for (const p of [0.001, 0.003, 0.01, 0.03, 0.1, 0.3, 1, 3, 5]) {
    const a = rain.scaleTo(c.A001, p, 30, 40); assert.ok(a < prev, `p=${p}`); prev = a;
  }
});

test('3.4 P.618 step 2: station above the rain height (hs ≥ hR) gives 0 dB, not NaN/negative', () => {
  const c = rain.p618core(20, 30, 42, 40, 3.5, 3.0, 45);
  assert.ok(c.A001 === 0, `A0.01 = ${c.A001}`);
  for (const p of [0.001, 0.01, 0.1, 1, 5])
    assert.ok(rain.scaleTo(0, p, 30, 40) === 0, `A_p(${p}) = ${rain.scaleTo(0, p, 30, 40)}`);
  const $ = runCompute('rain.html', { freq: 20, elev: 30, R: 42, lat: 40, hs: 3.5, hR: 3, avail: 99.99, pol: 45 }, RAIN_FNS);
  assert.equal($.get('r_ap'), '0.00');
  assert.match($.get('rnote'), /rain height/i);
});

test('3.5 P.676 Annex 2: slant = zenith / sin θ, and dry air (ρ=0) has γ_w = 0', () => {
  const f = 20, p = 1013.25, T = 15;
  assert.equal(gas.gammaW(f, p, T, 0), 0);
  const $ = runCompute('gas.html', { freq: 20, elev: 30, p: 1013.25, t: 15, rho: 7.5 }, GAS_FNS);
  near(parseFloat($.get('r_slant')), parseFloat($.get('r_zen')) / 0.5, 0.002);
});

/* Plausibility bands read off ITU-R P.676 zenith-attenuation curves for the
   reference atmosphere (1013 hPa, 15 °C, 7.5 g/m³). Deliberately wide: this
   catches order-of-magnitude or line-position errors, it is not a
   precision check (Annex 1 line-by-line tables are not reproduced here). */
test('3.6 P.676 zenith attenuation lies in plausibility bands (2, 12, 22.235, 30, 50 GHz)', (t) => {
  const bands = [[2, 0.02, 0.06], [12, 0.04, 0.15], [22.235, 0.2, 0.8], [30, 0.1, 0.4], [50, 1, 4]];
  for (const [f, lo, hi] of bands) {
    const { ho, hw } = gas.heights(f, 1013.25, 15);
    const z = gas.gammaO(f, 1013.25, 15) * ho + gas.gammaW(f, 1013.25, 15, 7.5) * hw;
    t.diagnostic(`${f} GHz: zenith ${z.toFixed(3)} dB (band ${lo}–${hi})`);
    assert.ok(z >= lo && z <= hi, `${f} GHz: ${z}`);
  }
});

test('3.7 gas.html warns when the frequency is outside Annex 2\'s ≤ 54 GHz range instead of silently clamping', () => {
  const $ = runCompute('gas.html', { freq: 80, elev: 30, p: 1013.25, t: 15, rho: 7.5 }, GAS_FNS);
  const note = $.get('note');
  // The normal "Add ~x dB … at 54 GHz" sentence must not count as a warning.
  assert.match(note, /clamp|outside|not cover|valid|limited|raised|lowered/i, `note was: "${note}"`);
  // 80 GHz sits in the 70–90 GHz window; a 54 GHz O2-edge value (~24 dB slant) is not an answer
  // for it. Declining to answer ("–") is acceptable; reporting the 54 GHz number is not.
  const slant = parseFloat($.get('r_slant'));
  assert.ok(!isFinite(slant) || slant < 5, `80 GHz / 30° slant loss reported as ${slant} dB`);
});

test('3.9 gas.html below 1 GHz states that the 1 GHz value is used (conservative upper bound)', () => {
  const $ = runCompute('gas.html', { freq: 0.437, elev: 30, p: 1013.25, t: 15, rho: 7.5 }, GAS_FNS);
  // must be an explicit statement, not the normal "Add ~x dB … at 1 GHz" sentence
  assert.match($.get('note'), /conservative|upper bound|below 1 GHz/i);
  assert.ok(isFinite(parseFloat($.get('r_slant'))));
});

test('3.8 gas.html announces the 5° elevation clamp', () => {
  const $ = runCompute('gas.html', { freq: 20, elev: 2, p: 1013.25, t: 15, rho: 7.5 }, GAS_FNS);
  assert.match($.get('note'), /5°/);
});
