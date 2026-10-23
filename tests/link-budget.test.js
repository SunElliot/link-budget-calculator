const test = require('node:test');
const assert = require('node:assert/strict');
const { page, fakeDom } = require('./harness');
const R = require('./ref');

const near = (a, b, tol, msg) =>
  assert.ok(Math.abs(a - b) <= tol, `${msg ?? ''} got ${a}, expected ${b} ± ${tol} (Δ=${(a - b).toExponential(3)})`);

const NAMES = ['K_BOLTZMANN_DBW', 'LOOP_SNR_MIN', 'RE', 'slantRange', 'singleLinkModel', 'singleLinkInputs', 'interfCombine',
  'aggCI', 'marginModel', 'solveBisect', 'computeTTCLink', 'ttcPowerSplit', 'besselJ0', 'besselJ1',
  'TTC_CODING', 'passContactTime', 'singleLinkAtElevation', 'absPathKm', 'refElevation', 'toDBW', 'freqMHz', 'rateBps', 'num'];
const fresh = () => { const $ = fakeDom('link-budget.html'); return { $, lb: page('link-budget.html', NAMES, { $ }) }; };

/* Baseline scenario, written out by hand so the reference chain below is
   independent of the page's own defaults. */
const P = {
  txP: R.dB(2), txG: 6, txL: 1, f: 2200, d: 2000, atm: 0.5, rain: 0, pol: 0.5, point: 0.5,
  rxG: 30, Tsys: 200, rxL: 0.5, Rb: 1e6, reqEb: 4.39, impl: 1, alpha: 0.2,
  rnOn: false, skyTm: 275, isCustom: false, bps: 3, cr: 0.75, ci: NaN,
};

test('1.1 EIRP / FSPL / G/T / C/N0 / Eb/N0 / margin match an independent hand chain (±0.02 dB)', () => {
  const { lb } = fresh();
  const m = lb.singleLinkModel(P);
  const eirp = P.txP + P.txG - P.txL;
  const fspl = R.fsplDb(P.d, P.f * 1e6);
  const gt = P.rxG - R.dB(P.Tsys);
  const cn0 = eirp - fspl - (P.atm + P.pol + P.point) + gt - R.K_DBW;
  const ebn0 = cn0 - R.dB(P.Rb);
  near(m.eirp, eirp, 1e-9, 'EIRP');
  near(m.fspl, fspl, 0.02, 'FSPL');
  near(m.gt, gt, 1e-9, 'G/T');
  near(m.cn0, cn0, 0.02, 'C/N0');
  near(m.ebn0, ebn0, 0.02, 'Eb/N0');
  near(m.margin, ebn0 - P.reqEb - P.impl, 0.02, 'margin');
});

test('1.2 FSPL constant 32.44 vs exact 20log10(4π/c) = 32.4478 — bias stays < 0.01 dB', (t) => {
  const { lb } = fresh();
  for (const [d, f] of [[500, 437], [2000, 2200], [40000, 12000], [1e6, 8400]]) {
    const bias = lb.singleLinkModel({ ...P, d, f }).fspl - R.fsplDb(d, f * 1e6);
    t.diagnostic(`d=${d} km f=${f} MHz: page−exact = ${bias.toFixed(4)} dB`);
    assert.ok(Math.abs(bias) < 0.01);
  }
});

test('1.3 Boltzmann constant −228.6 vs exact −228.5991 dBW/K/Hz (< 0.001 dB)', () => {
  const { lb } = fresh();
  near(lb.K_BOLTZMANN_DBW, R.K_DBW, 0.001);
});

test('1.4 Rain sky-noise: ΔT = Tm(1−10^(−A/10)) (ITU-R P.618 §3), A=3 dB, Tm=275 K → 137.2 K', () => {
  const { lb } = fresh();
  const m = lb.singleLinkModel({ ...P, rnOn: true, atm: 1, rain: 2 });
  near(m.dT, 275 * (1 - R.lin(-3)), 1e-9);
  near(m.gt, P.rxG - R.dB(P.Tsys + m.dT), 1e-9);
});

test('1.5 C/(N+I): C/N 10 dB with C/I 10 dB → 6.99 dB (power sum)', () => {
  const { lb } = fresh();
  const Rb = 1e6, B = 1e6, cn0 = 10 + R.dB(B);
  const r = lb.interfCombine(cn0, Rb, B, 10);
  near(r.cni, R.dB(1 / (0.1 + 0.1)), 1e-9);
  near(r.d, 10 - R.dB(1 / 0.2), 1e-9);
});

test('1.6 Aggregate C/I of three 20 dB entries = 20 − 10log10(3) = 15.23 dB', () => {
  const { $, lb } = fresh();
  $.set({ ciAdj: 20, ciXpol: 20, ciIm: 20 });
  near(lb.aggCI(['ciAdj', 'ciXpol', 'ciIm']), 20 - R.dB(3), 1e-9);
});

test('1.7 C/N = Eb/N0 + 10log10(Rb/B), B = Rs(1+α) (bandwidth identity)', () => {
  const { lb } = fresh();
  const m = lb.singleLinkModel(P);
  const Rs = P.Rb / (P.bps * P.cr), B = Rs * (1 + P.alpha);
  near(m.bwHz, B, 1e-6);
  near(m.cnRx, m.ebn0 + R.dB(P.Rb / B), 1e-9);
});

test('1.8 Invalid physics yields NaN, never a plausible number (0 W, 0 km, 0 K)', () => {
  const { lb } = fresh();
  assert.ok(Number.isNaN(lb.toDBW(0, 'W')));
  assert.ok(!isFinite(lb.singleLinkModel({ ...P, d: 0 }).margin));
  assert.ok(!isFinite(lb.singleLinkModel({ ...P, Tsys: 0 }).margin));
  assert.ok(!isFinite(lb.singleLinkModel({ ...P, Rb: 0 }).margin));
});

test('1.9 Slant range matches vector geometry for LEO…GEO, 1°–90° (±0.01 km)', () => {
  const { lb } = fresh();
  for (const h of [300, 550, 1200, 20200, 35786])
    for (const e of [1, 5, 10, 30, 60, 90])
      near(lb.slantRange(h, e), R.slantRangeVec(6371, h, e), 0.01, `h=${h} e=${e}`);
});

test('1.10 Reverse solver round-trip: solved rate / power / range reproduce the target margin (±0.01 dB)', () => {
  const { $, lb } = fresh();
  const target = 3;
  const x = lb.solveBisect(x => lb.marginModel({ rate: Math.pow(10, x) }), 0, 12, target);
  near(lb.marginModel({ rate: Math.pow(10, x) }), target, 0.01, 'rate');
  const p = lb.solveBisect(p => lb.marginModel({ txPdBW: p }), -40, 60, target);
  near(lb.marginModel({ txPdBW: p }), target, 0.01, 'power');
  const d = lb.solveBisect(x => lb.marginModel({ dist: Math.pow(10, x) }), 0, 6, target);
  near(lb.marginModel({ dist: Math.pow(10, d) }), target, 0.01, 'range');
  // analytic: max rate = 10^((Eb/N0_rx − margin_now + target) …) — margin is 1:1 in 10log(Rb)
  const m0 = lb.marginModel({ rate: 1e6 });
  near(Math.log10(Math.pow(10, x)), 6 + (m0 - target) / 10, 1e-6, 'rate analytic');
  assert.ok($);
});

/* ETSI EN 302 307-1 V1.4.1 Table 13: ideal Es/N0 (normal FECFRAME, AWGN,
   QEF) and Table 13's spectral efficiency η (incl. BCH, LDPC, PLHEADER,
   no pilots). Required information-bit Eb/N0 = Es/N0 − 10log10(η). */
const DVBS2 = {
  's2-qpsk12': [1.00, 0.988858], 's2-qpsk34': [4.03, 1.487473], 's2-qpsk56': [5.18, 1.654663],
  's2-8psk23': [6.62, 1.980636], 's2-8psk34': [7.91, 2.228124], 's2-8psk56': [9.35, 2.478562],
  's2-16a34': [10.21, 2.966728], 's2-16a56': [11.61, 3.300184],
  's2-32a34': [12.73, 3.703295], 's2-32a56': [14.28, 4.119540],
};
const html = require('./harness').read('link-budget.html');
const optAttr = (v, a) => parseFloat(html.match(new RegExp(`value="${v}"[^>]*data-${a}="([^"]+)"`))[1]);

test('1.11 DVB-S2 required Eb/N0 within 0.1 dB of EN 302 307-1 Table 13', (t) => {
  for (const [v, [esn0, eta]] of Object.entries(DVBS2)) {
    const ref = esn0 - R.dB(eta), got = optAttr(v, 'ebn0');
    t.diagnostic(`${v}: page ${got.toFixed(2)} / standard ${ref.toFixed(2)} dB (Δ ${(got - ref).toFixed(3)})`);
    near(got, ref, 0.1, v);
  }
});

test('1.12 DVB-S2 thresholds are not optimistic vs Table 13 (page ≥ standard − 0.005 dB)', () => {
  const bad = [];
  for (const [v, [esn0, eta]] of Object.entries(DVBS2)) {
    const ref = esn0 - R.dB(eta), got = optAttr(v, 'ebn0');
    if (got < ref - 0.005) bad.push(`${v} ${(got - ref).toFixed(3)} dB`);
  }
  assert.deepEqual(bad, [], 'optimistic thresholds');
});

/* Select an option exactly as the browser would expose it: its value and
   every data-* attribute from the page's own markup. */
function selectModcod($, v) {
  const tag = html.match(new RegExp(`<option value="${v}"[^>]*>`))[0];
  const dataset = {};
  for (const d of tag.matchAll(/data-([a-z0-9-]+)="([^"]*)"/g)) dataset[d[1]] = d[2];
  $('modcod').value = v;
  $('modcod').selectedOptions = [{ dataset, textContent: v }];
}

test('1.13 DVB-S2 occupied bandwidth uses the real η (symbol rate = Rb/η, ±0.5 %) through the form path', () => {
  const { $, lb } = fresh();
  const bad = [];
  for (const [v, [, eta]] of Object.entries(DVBS2)) {
    selectModcod($, v);
    $.set({ rate: 1, rateUnit: 'Mbps' });
    const m = lb.singleLinkModel(lb.singleLinkInputs());
    const ref = 1e6 / eta;
    const err = m.symRate / ref - 1;
    if (Math.abs(err) > 0.005) bad.push(`${v} ${(err * 100).toFixed(2)} %`);
  }
  assert.deepEqual(bad, []);
});

test('1.14 TT&C coding table: every ebn0 ≥ its own cited standard value (the table\'s "uniformly conservative" claim)', () => {
  const { lb } = fresh();
  for (const g of lb.TTC_CODING) for (const o of g.opts)
    if (o.std !== undefined) assert.ok(o.ebn0 >= o.std, `${o.v}: ${o.ebn0} < ${o.std}`);
  const unc = lb.TTC_CODING[0].opts.find(o => o.v === 'uncoded');
  near(unc.ebn0, R.dB(Math.pow(4.264890793922825, 2) / 2), 0.05, 'uncoded BPSK @1e-5 = 9.59 dB');
});

test('1.15 Residual-carrier power split vs Bessel integrals (CCSDS 401 / DSN 810-005 mod. 207)', () => {
  const { lb } = fresh();
  for (const md of [0.3, 0.8, 1.2, 1.4, 2.0]) for (const mr of [0.4, 0.7, 1.0]) {
    const sq = lb.ttcPowerSplit('pcm-psk-pm-sq', md, true, mr);
    near(sq.pc, Math.cos(md) ** 2 * R.besselJ(0, mr) ** 2, 1e-9, `sq pc md=${md} mr=${mr}`);
    near(sq.pd, Math.sin(md) ** 2 * R.besselJ(0, mr) ** 2, 1e-9, 'sq pd');
    near(sq.pr, Math.cos(md) ** 2 * 2 * R.besselJ(1, mr) ** 2, 1e-9, 'sq pr');
    const sn = lb.ttcPowerSplit('pcm-psk-pm-sin', md, true, mr);
    near(sn.pc, R.besselJ(0, md) ** 2 * R.besselJ(0, mr) ** 2, 1e-9, 'sin pc');
    near(sn.pd, 2 * R.besselJ(1, md) ** 2 * R.besselJ(0, mr) ** 2, 1e-9, 'sin pd');
    near(sn.pr, R.besselJ(0, md) ** 2 * 2 * R.besselJ(1, mr) ** 2, 1e-9, 'sin pr');
  }
  // PCM/PM without ranging conserves power exactly
  const pm = lb.ttcPowerSplit('pcm-pm', 1.2, false, 0);
  near(pm.pc + pm.pd, 1, 1e-12);
  near(R.dB(pm.pc), -8.82, 0.01, 'm=1.2 rad carrier suppression');
});

test('1.16 TT&C link: Pc/N0, loop SNR in 2B_L and Pr/N0 follow from C/N0 and the split', () => {
  const { $, lb } = fresh();
  $.set({ ul_modScheme: 'pcm-psk-pm-sin', ul_modIdx: 1.2, ul_ranging: 'on', ul_rngIdx: 0.7, ul_loopBw: 100, ul_reqPrN0: 20 });
  const d = lb.slantRange(550, 10);
  const L = lb.computeTTCLink('ul_', d);
  const eirp = R.dB(50) + 30 - 1;
  const cn0 = eirp - R.fsplDb(d, 2025e6) - 2 + (3 - R.dB(500)) - R.K_DBW;
  near(L.cn0, cn0, 0.02, 'C/N0');
  const pc = R.besselJ(0, 1.2) ** 2 * R.besselJ(0, 0.7) ** 2;
  near(L.pcN0, cn0 + R.dB(pc), 0.02, 'Pc/N0');
  near(L.loopSnr, cn0 + R.dB(pc) - R.dB(200), 0.02, 'loop SNR');
  near(L.prN0, cn0 + R.dB(R.besselJ(0, 1.2) ** 2 * 2 * R.besselJ(1, 0.7) ** 2), 0.02, 'Pr/N0');
});

test('1.17 Coherent turnaround ratios are the CCSDS 401 (2.1.x) values: S/S 240/221, X/X 880/749', () => {
  assert.match(html, /value="240\/221"/);
  assert.match(html, /value="880\/749"/);
  assert.match(html, /240\/221 : 880\/749/);
});

/* ---- Physical-fidelity expectations for the elevation sweep ----
   The entered atmospheric/rain losses belong to the entered slant range; the
   sweep must re-scale them along the path (and the sky noise they cause) as
   the elevation changes. singleLinkAtElevation(h, e) is what the chart plots. */
test('1.18 Margin-vs-elevation sweep scales absorptive path loss with elevation (≈ A_zen/sin E)', () => {
  const { $, lb } = fresh();
  const h = 550;
  // Entered range = zenith range, so the entered 1 dB is the zenith gas loss.
  $.set({ altitude: h, dist: lb.slantRange(h, 90), atmLoss: 1, rainLoss: 0, polLoss: 0, pointLoss: 0 });
  const dm = lb.singleLinkAtElevation(h, 90).margin - lb.singleLinkAtElevation(h, 5).margin;
  const dF = R.fsplDb(lb.slantRange(h, 5), 2.2e9) - R.fsplDb(lb.slantRange(h, 90), 2.2e9);
  const extraGas = 1 / Math.sin(5 * Math.PI / 180) - 1; // ≈ 10.5 dB more at 5°
  near(dm, dF + extraGas, 0.5, 'margin(90°) − margin(5°)');
});

test('1.19 Margin-vs-elevation sweep raises T_sys at low elevation when sky-noise coupling is on', () => {
  const { $, lb } = fresh();
  $.set({ altitude: 550, dist: lb.slantRange(550, 90), atmLoss: 1, rainLoss: 0, rainNoise: 'on' });
  const low = lb.singleLinkAtElevation(550, 5).dT, zen = lb.singleLinkAtElevation(550, 90).dT;
  assert.ok(low > zen + 1, `ΔT at 5° (${low.toFixed(1)} K) should exceed zenith (${zen.toFixed(1)} K)`);
});

test('1.20 Sweep is continuous with the main result: at the elevation of the entered range it gives the same margin', () => {
  const { $, lb } = fresh();
  $.set({ altitude: 550, dist: 1500, atmLoss: 0.8, rainLoss: 2, rainNoise: 'on' });
  // elevation at which slantRange(550, e) = 1500 km, found independently
  const eRef = R.solveDb(e => R.slantRangeVec(6371, 550, e), 1500, 0.1, 90);
  near(lb.singleLinkAtElevation(550, eRef).margin, lb.marginModel(), 0.01);
});

test('1.21 The chart\'s "link closes" elevation is taken from the elevation-scaled model', () => {
  const { $, lb } = fresh();
  $.set({ altitude: 550, dist: lb.slantRange(550, 90), atmLoss: 1.5, rainLoss: 0, txPower: 0.5 });
  const fns = page('link-budget.html', [...NAMES, 'drawChart', 'singleLinkAtElevation'], { $ });
  fns.drawChart();
  let e0 = null;
  for (let e = 1; e <= 90; e++) if (fns.singleLinkAtElevation(550, e).margin >= 0) { e0 = e; break; }
  assert.ok(e0 !== null && e0 > 1, `scenario should close only above 1°, got ${e0}`);
  assert.match($('elevSummary').innerHTML, new RegExp(`≥ ${e0}°`));
  assert.ok(lb);
});

test('1.22 Default Required Eb/N0 field matches the default-selected MODCOD\'s threshold', () => {
  const sel = html.match(/<option value="([^"]+)"[^>]*data-ebn0="([^"]+)"[^>]*selected/);
  const field = html.match(/id="reqEbN0" value="([^"]+)"/)[1];
  assert.equal(parseFloat(field), parseFloat(sel[2]), `${sel[1]}`);
});
