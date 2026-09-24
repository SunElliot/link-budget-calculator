# Engineering verification suite

```
node --test tests/*.test.js
```

Zero dependencies (Node ≥ 18 built-in `node:test`); no package.json, per AGENTS.md.

## How it works

- `harness.js` pulls named functions/constants **verbatim** out of each page's
  inline `<script>` and runs them in a `vm` sandbox with a fake DOM seeded from
  the page's own HTML defaults. The page code is executed, never copied.
- `ref.js` holds independent reference math (exact SI constants, high-precision
  erfc, Bessel by numerical integration, vector slant-range geometry).
- Expected values come from the cited standards (ETSI EN 302 307-1 Table 13,
  ITU-R P.838-3 Table 5, P.618-13 §2.2.1.1, CCSDS 401 / DSN 810-005) or from
  first-principles models (SGP4 via the vendored satellite.js for passes and
  Doppler). They are never read back from the code under test.

## Fixed findings

The first verification run found five defects (eight failing tests). All are
fixed; the tests that exposed them now guard against regression.

| ID | Tests | Finding → fix |
|----|-------|---------------|
| F1 | 1.18–1.21 | Margin-vs-elevation sweep held atm/rain loss and sky-noise ΔT constant. Now `singleLinkAtElevation()` scales them by path length from the elevation implied by the entered range (P.618 step 2 geometry); continuous with the main result at that elevation. |
| F2 | 3.7, 3.9 | `gas.html` silently evaluated f > 54 GHz at 54 GHz. Now refuses (–) with an explanation; below 1 GHz states that the 1 GHz value is a conservative bound. |
| F3 | 3.4 | `rain.html` returned NaN when hs ≥ hR. Now 0 dB per P.618 step 2, with a note. |
| F4 | 1.12, 1.13, 1.22 | DVB-S2 used bps×rate instead of Table 13 η. Options now carry `data-eta`; thresholds = Es/N0 − 10log10(η), rounded up. |
| F5 | 2.7, 2.8 | 16/32APSK ring phases now follow EN 302 307-1 (π/12 offset). |

## Page smoke test

Beyond the sandboxed unit tests, the changed pages were loaded in headless
Chrome over HTTP (CDP) and checked for script errors and rendered results.
That harness is not part of this suite (it needs a local Chrome).

## Mutation check

The suite was checked by injecting faults into the sources (then restoring
them): FSPL constant +0.1 dB → 1.1, 1.2 fail; a P.838 coefficient typo →
3.1 fails; dropping the ranging J0² suppression on data → 1.15 fails.
