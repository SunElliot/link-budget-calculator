/* Independent reference math. Nothing here is taken from the pages under
   test — each routine is written from first principles or from the cited
   standard, so agreement with the page is evidence, not tautology. */
const C = 299792458;             // m/s, exact (SI)
const K_DBW = 10 * Math.log10(1.380649e-23); // -228.5991 dBW/K/Hz, exact k (SI 2019)
const dB = x => 10 * Math.log10(x);
const lin = x => Math.pow(10, x / 10);

/* FSPL from the Friis definition, no rounded constant. */
const fsplDb = (dKm, fHz) => 20 * Math.log10(4 * Math.PI * dKm * 1e3 * fHz / C);

/* erfc via continued fraction (x>2) / Maclaurin series (x<=2); ~1e-14 rel. */
function erfc(x) {
  if (x < 0) return 2 - erfc(-x);
  if (x <= 2) {
    let s = 0, term = x, n = 0;
    while (Math.abs(term) > 1e-17 * Math.abs(s) || n < 5) {
      s += term / (2 * n + 1); n++; term *= -x * x / n;
      if (n > 200) break;
    }
    return 1 - 2 / Math.sqrt(Math.PI) * s;
  }
  // Lentz continued fraction for erfc
  let f = x, Cc = x, D = 0;
  for (let n = 1; n < 300; n++) {
    const a = n / 2;
    D = x + a * D; D = 1 / D;
    Cc = x + a / Cc;
    const delta = Cc * D; f *= delta;
    if (Math.abs(delta - 1) < 1e-16) break;
  }
  return Math.exp(-x * x) / Math.sqrt(Math.PI) / f;
}
const Q = x => 0.5 * erfc(x / Math.SQRT2);

/* Inverse via bisection on a monotone decreasing function of dB. */
function solveDb(f, target, lo = -10, hi = 40) {
  for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; (f(m) > target) ? lo = m : hi = m; }
  return (lo + hi) / 2;
}

/* Bessel J_n by numerical integration of the integral representation
   J_n(x) = (1/π)∫₀^π cos(nτ − x sin τ) dτ  (Simpson, 2000 panels). */
function besselJ(n, x) {
  const N = 2000, h = Math.PI / N; let s = 0;
  for (let i = 0; i <= N; i++) {
    const w = (i === 0 || i === N) ? 1 : (i % 2 ? 4 : 2);
    s += w * Math.cos(n * i * h - x * Math.sin(i * h));
  }
  return s * h / 3 / Math.PI;
}

/* Slant range by vector geometry: station at (0,RE), satellite on the
   sphere RE+h, elevation measured from the local horizontal. Solve the
   triangle numerically along the look ray (no closed-form reuse). */
function slantRangeVec(RE, h, elDeg) {
  const e = elDeg * Math.PI / 180, ux = Math.cos(e), uy = Math.sin(e);
  // |(0,RE) + d·u| = RE+h  →  d² + 2·RE·uy·d + RE² − (RE+h)² = 0
  let lo = 0, hi = 1e6;
  const g = d => Math.hypot(d * ux, RE + d * uy) - (RE + h);
  for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; g(m) > 0 ? hi = m : lo = m; }
  return (lo + hi) / 2;
}

module.exports = { C, K_DBW, dB, lin, fsplDb, erfc, Q, solveDb, besselJ, slantRangeVec };
