const test = require('node:test');
const assert = require('node:assert/strict');
const { runCompute, page, fakeDom } = require('./harness');
const R = require('./ref');

const near = (a, b, tol, msg) =>
  assert.ok(Math.abs(a - b) <= tol, `${msg ?? ''} got ${a}, expected ${b} ± ${tol}`);
const num = ($, id) => parseFloat($.get(id));

test('5.1 Parabolic gain G = η(πD/λ)²: 3 m @2.2 GHz η=0.55 and 4.5 m @8.2 GHz η=0.6 (±0.01 dB)', () => {
  for (const [D, fG, eff] of [[3, 2.2, 0.55], [4.5, 8.2, 0.6]]) {
    const $ = runCompute('antenna.html', { dia: D, freq: fG, freqUnit: 'GHz', eff }, ['C']);
    const lam = R.C / (fG * 1e9);
    near(num($, 'r_gain'), R.dB(eff * (Math.PI * D / lam) ** 2), 0.01, `${D} m`);
    near(num($, 'r_hpbw'), 70 * lam / D, 0.01, 'HPBW 70λ/D');
  }
});

test('5.2 G/T at the aperture equals G/T at the LNA input (reference-plane invariance)', () => {
  const inp = { gain: 34, ta: 50, lfeed: 0.4, tp: 290, nflna: 0.8, glna: 35, nfrx: 3 };
  const $ = runCompute('gt.html', inp, ['T0', 'teFromNF']);
  const L = R.lin(inp.lfeed), Te = nf => (R.lin(nf) - 1) * 290;
  // referred to LNA input: T = TA/L + Tp(1−1/L) + T_LNA + T_rx/G_LNA, gain = G − Lfeed
  const Tin = inp.ta / L + inp.tp * (1 - 1 / L) + Te(inp.nflna) + Te(inp.nfrx) / R.lin(inp.glna);
  near(num($, 'r_gt'), (inp.gain - inp.lfeed) - R.dB(Tin), 0.01);
});

const NF_FNS = ['T0', 'esc'];
function nfChain(stages, ta = 0) {
  const $ = fakeDom('noise-figure.html'); $.set({ ta });
  const st = stages.map((s, i) => ({ id: i, name: '', tphys: 290, ...s, gain: s.type === 'loss' ? -s.nf : s.gain }));
  const fns = page('noise-figure.html', [...NF_FNS, 'compute'], { $, stages: st });
  fns.compute();
  return $;
}

test('5.3 Friis cascade NF/Te: loss 1 dB → LNA 0.5/30 → mixer 8/−6 → IF 3/20', () => {
  const $ = nfChain([{ type: 'loss', nf: 1 }, { type: 'amp', nf: 0.5, gain: 30 },
                     { type: 'amp', nf: 8, gain: -6 }, { type: 'amp', nf: 3, gain: 20 }], 50);
  const F = [R.lin(1), R.lin(0.5), R.lin(8), R.lin(3)], G = [R.lin(-1), R.lin(30), R.lin(-6)];
  const Ft = F[0] + (F[1] - 1) / G[0] + (F[2] - 1) / (G[0] * G[1]) + (F[3] - 1) / (G[0] * G[1] * G[2]);
  near(num($, 'r_nf'), R.dB(Ft), 0.01, 'NF');
  near(num($, 'r_te'), (Ft - 1) * 290, 0.1, 'Te');
  near(num($, 'r_tsys'), 50 + (Ft - 1) * 290, 0.1, 'Tsys = TA + Te');
});

test('5.4 A lossy element at T_phys ≠ 290 K contributes (L−1)·T_phys (cryogenic feed, 50 K)', () => {
  const $ = nfChain([{ type: 'loss', nf: 0.5, tphys: 50 }]);
  near(num($, 'r_te'), (R.lin(0.5) - 1) * 50, 0.1);
});

test('5.5 Phased array: G0 = Ge + 10logN − taper, scan loss 10log cos θ, grating-lobe limit asin(λ/d − 1)', () => {
  const $ = runCompute('phased-array.html', { freq: 10, frequnit: 'GHz', nx: 8, ny: 8, dx: 0.7, dy: 0.7, ge: 6, scan: 30, taper: 1 }, ['C', 'L10', 'PI']);
  near(num($, 'r_g0'), 6 + R.dB(64) - 1, 0.06, 'G0 (page shows 0.1 dB)');
  near(num($, 'r_gs'), 6 + R.dB(64) - 1 + R.dB(Math.cos(Math.PI / 6)), 0.06, 'G@scan');
  near(num($, 'r_gl'), Math.asin(1 / 0.7 - 1) * 180 / Math.PI, 0.06, 'grating-lobe-free scan');
  assert.match($.get('note'), /grating/i, 'must warn: 30° > 25.4° limit');
});

const HPA_FNS = ['dbwToW', 'salehFwd', 'salehInv', 'rappFwd', 'rappInv', 'modelFwd', 'modelInv', 'drawChart'];
const hpa = inp => runCompute('hpa-backoff.html', { hpaType: 'twta', psat: 100, psatUnit: 'W', g0: 50, nCarriers: 1,
  boMode: 'ibo', oboRef: 3, ci3Ref: 15, rappP: 2, ...inp }, HPA_FNS, { location: { search: '' } });

test('5.6 Saleh TWTA AM/AM: OBO(IBO) = −10log(4ρ/(1+ρ)²) — IBO 0→0, 3→0.51, 10→4.81 dB', () => {
  for (const ibo of [0, 3, 10]) {
    const rho = R.lin(-ibo);
    near(num(hpa({ boVal: ibo }), 'r_obo'), -R.dB(4 * rho / (1 + rho) ** 2), 0.01, `IBO ${ibo}`);
  }
});

test('5.7 Rapp SSPA (p=2) AM/AM in amplitude form: A = r/(1+r^{2p})^{1/2p}', () => {
  const ibo = 3, r = Math.sqrt(R.lin(-ibo)), A = r / (1 + r ** 4) ** 0.25;
  near(num(hpa({ hpaType: 'sspa', boVal: ibo }), 'r_obo'), -R.dB(A * A), 0.01);
});

test('5.8 C/I3 improves 2 dB per dB of input backoff', () => {
  const a = num(hpa({ boVal: 6 }), 'r_ci3'), b = num(hpa({ boVal: 10 }), 'r_ci3');
  near(b - a, 8, 0.01);
});
