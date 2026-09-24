const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { page, runCompute, ROOT } = require('./harness');
const sat = require(path.join(ROOT, 'vendor', 'satellite.min.js'));

const near = (a, b, tol, msg) =>
  assert.ok(Math.abs(a - b) <= tol, `${msg ?? ''} got ${a}, expected ${b} ± ${tol}`);
const lb = page('link-budget.html', ['passContactTime']);
const MU = 398600.4418, RE = 6371, C_KM = 299792.458;

/* 550 km circular sun-synchronous orbit as a TLE, propagated with SGP4
   (satellite.js v5, vendored) over a 40°N ground station for 7 days. */
function tle(altKm, incl) {
  const a = 6378.135 + altKm, n = 86400 / (2 * Math.PI * Math.sqrt(a ** 3 / MU));
  const cs = l => { let s = 0; for (const c of l) s += c === '-' ? 1 : (c >= '0' && c <= '9' ? +c : 0); return l + (s % 10); };
  const l1 = cs('1 99999U 24001A   24001.00000000  .00000000  00000-0  00000-0 0  999');
  const l2 = cs(`2 99999 ${incl.toFixed(4).padStart(8)} 000.0000 0001000 000.0000 000.0000 ${n.toFixed(8).padStart(11)}    0`);
  return sat.twoline2satrec(l1, l2);
}
function simulatePasses(altKm, incl, latDeg, minEl, days = 7, stepS = 5) {
  const rec = tle(altKm, incl);
  const gs = { latitude: latDeg * Math.PI / 180, longitude: 116 * Math.PI / 180, height: 0.05 };
  const t0 = Date.UTC(2024, 0, 1);
  const passes = []; let cur = null;
  for (let s = 0; s <= days * 86400; s += stepS) {
    const d = new Date(t0 + s * 1000);
    const pv = sat.propagate(rec, d);
    const gmst = sat.gstime(d);
    const ecf = sat.eciToEcf(pv.position, gmst);
    const look = sat.ecfToLookAngles(gs, ecf);
    const el = look.elevation * 180 / Math.PI;
    // range rate in the Earth-fixed frame (includes Earth rotation)
    const gsE = sat.geodeticToEcf(gs);
    const vE = sat.eciToEcf(pv.velocity, gmst);
    const w = 7.292115e-5; // ω⊕ rad/s
    const vr = { x: vE.x + w * ecf.y, y: vE.y - w * ecf.x, z: vE.z };
    const rel = { x: ecf.x - gsE.x, y: ecf.y - gsE.y, z: ecf.z - gsE.z };
    const rn = Math.hypot(rel.x, rel.y, rel.z);
    const rdot = (rel.x * vr.x + rel.y * vr.y + rel.z * vr.z) / rn;
    if (el >= minEl) {
      if (!cur) cur = { start: s, maxEl: el, maxRdot: 0 };
      cur.maxEl = Math.max(cur.maxEl, el); cur.maxRdot = Math.max(cur.maxRdot, Math.abs(rdot)); cur.end = s;
    } else if (cur) { passes.push({ dur: cur.end - cur.start, maxEl: cur.maxEl, maxRdot: cur.maxRdot }); cur = null; }
  }
  return passes;
}
let SIM; const sim = () => (SIM ??= simulatePasses(550, 97.6, 40, 5));

test('4.1 Contact time equals the analytic overhead-pass value (non-rotating circular geometry)', () => {
  // independent: time for the sub-satellite central angle to sweep 2λ, λ = acos(RE cosE/(RE+h)) − E
  const h = 550, E = 5 * Math.PI / 180, r = RE + h;
  const lam = Math.acos(RE * Math.cos(E) / r) - E;
  const ref = 2 * lam / Math.sqrt(MU / r ** 3);
  near(lb.passContactTime(h, 5), ref, 0.5);
});

test('4.2 Contact time is an upper bound on SGP4 passes (≥ longest pass − 3 %)', (t) => {
  const P = sim(), page = lb.passContactTime(550, 5);
  const max = Math.max(...P.map(p => p.dur));
  t.diagnostic(`page ${(page / 60).toFixed(2)} min, longest SGP4 pass ${(max / 60).toFixed(2)} min, ${P.length} passes / 7 d`);
  assert.ok(page >= max * 0.97);
});

test('4.3 "Contact time / pass" is representative of real passes (within 25 % of the SGP4 mean)', (t) => {
  const P = sim(), page = lb.passContactTime(550, 5);
  const mean = P.reduce((s, p) => s + p.dur, 0) / P.length;
  const daily = P.reduce((s, p) => s + p.dur, 0) / 7;
  t.diagnostic(`mean pass ${(mean / 60).toFixed(2)} min vs page ${(page / 60).toFixed(2)} min; ` +
               `SGP4 daily contact ${(daily / 60).toFixed(1)} min over ${(P.length / 7).toFixed(1)} passes/day`);
  assert.ok(Math.abs(page / mean - 1) <= 0.25, `page/mean = ${(page / mean).toFixed(2)}`);
});

test('4.4 Doppler page: max Doppler and TCA Doppler rate match an independent overhead-pass model', () => {
  const $ = runCompute('doppler.html', { alt: 550, freq: 2.2, freqUnit: 'GHz', elev: 30 }, ['slant', 'elevOf', 'phiForElev', 'drawChart', 'c', 'mu', 'RE'],
    { document: { querySelectorAll: () => [], getElementById: () => null } });
  const h = 550, Rs = RE + h, w = Math.sqrt(MU / Rs ** 3), f = 2.2e9;
  // numeric range-rate sweep over the pass, station fixed in inertial space
  let maxRd = 0; const phiH = Math.acos(RE / Rs);
  for (let i = -20000; i <= 20000; i++) {
    const phi = phiH * i / 20000, t1 = phi / w, dt = 1e-3;
    const r = tt => { const p = w * tt; return Math.hypot(Rs * Math.sin(p), Rs * Math.cos(p) - RE); };
    maxRd = Math.max(maxRd, Math.abs((r(t1 + dt) - r(t1 - dt)) / (2 * dt)));
  }
  near(parseFloat($.get('r_maxdf')), maxRd / C_KM * f / 1e3, 0.05, 'max Doppler kHz');
  const rate = RE * Rs * w * w / h / C_KM * f; // r̈ at TCA = RE·Rs·ω²/h
  const got = $.get('r_rate'); const gotHz = got.endsWith('k') ? parseFloat(got) * 1e3 : parseFloat(got);
  near(gotHz / rate, 1, 0.01, 'Doppler rate');
});

test('4.5 Doppler max |Δf| covers real passes incl. Earth rotation (≥ SGP4 max − 1 %)', (t) => {
  const $ = runCompute('doppler.html', { alt: 550, freq: 2.2, freqUnit: 'GHz', elev: 30 }, ['slant', 'elevOf', 'phiForElev', 'drawChart', 'c', 'mu', 'RE'],
    { document: { querySelectorAll: () => [], getElementById: () => null } });
  const pageKHz = parseFloat($.get('r_maxdf'));
  const simKHz = Math.max(...sim().map(p => p.maxRdot)) / C_KM * 2.2e9 / 1e3;
  t.diagnostic(`page ${pageKHz.toFixed(2)} kHz, SGP4+Earth rotation max ${simKHz.toFixed(2)} kHz (above 5°)`);
  assert.ok(pageKHz >= simKHz * 0.99);
});
