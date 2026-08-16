# Project Instructions

> link-budget-calculator

## Guidelines

### What this is

A set of satellite-RF calculators served as a static site from GitHub Pages.
Vanilla HTML/CSS/JS loaded directly by each page — **no build step, no bundler,
no package manager, no framework.** Do not propose one, and do not introduce an
npm dependency, unless explicitly asked. `vendor/` holds third-party code
(satellite.min.js); never edit it.

Each calculator is a standalone page at the repo root (`link-budget.html`,
`antenna.html`, `doppler.html`, …). The pages are structurally near-identical,
so **drift is the dominant risk in this codebase**: a fix applied to one page
and not its twelve siblings, or shared behaviour re-implemented inline instead
of being lifted into a shared script.

### Adding or renaming a page touches five places

Miss one and the failure is silent. `noise-figure.html` shipped absent from
`sitemap.xml` exactly this way.

1. the page itself
2. `sw.js` — add it to `ASSETS`, and bump `CACHE`
3. `sitemap.xml` — add the `<url>` entry
4. `i18n.js` — add its `<h1>`, subtitle and card titles to `DICT`
5. **`aside.sidebar > ul.toolnav` on all thirteen pages** — every page carries
   its own full copy of the tool list, grouped by `li.grp` heading, and marks
   the current page with `class="active"`. There is no shared include, so a new
   tool means thirteen edits and thirteen correct `active` markers.
   (`nav.topnav` is only the brand link home — it is not the tool nav.)

### i18n is keyed on the English source text

`i18n.js` walks static text nodes and swaps any whose **exact English string**
is a key in `DICT`. So editing English copy on a page silently breaks its
Chinese translation — the key stops matching and the text just stays English.
Whenever you touch a translated string, update the `DICT` key in the same edit.

Units and symbols (dB, dBi, GHz, EIRP, QPSK) are deliberately left untranslated.
Long SEO articles and dynamically generated results stay English by design — do
not "fix" that.

Footers **are** translated: `DICT` carries a `// ---- footers ----` block with an
entry per page, and all thirteen currently match their page. (This file used to
claim footers stay English; that was wrong, and `link-budget.html`'s footer went
untranslated for a while because its key had drifted out of sync with the page.)

There is a second, separate mechanism for whole blocks: `.en-only` / `.zh-only`
elements toggled by `body.lang-zh` in CSS, for prose that has to be authored
twice rather than swapped string-for-string. Use `DICT` for short labels and
titles, `.en-only`/`.zh-only` for paragraphs.

### Asset versioning

`styles.css`, `i18n.js`, `a11y.js` and `share.js` are loaded with a `?v=NN`
cache-buster that is bumped **in lockstep across every page**, together with the
`CACHE` name in `sw.js`, in the same commit. Half-bumped versions are the
classic way to ship a broken deploy here. `linkout.js` carries its own
independent version and is not part of that lockstep.

### Markup contract that a11y.js depends on

Rows are written as:

```html
<div class="row"><label>Tx antenna gain<span class="hint">dBi</span></label>
                 <input type="number" id="txGain" step="any"></div>
```

`a11y.js` derives the `for`/`id` association from this shape — within a `.row`,
the first `<label>` names the first control. Keep new rows in the same shape and
accessibility stays correct for free; deviate and the label silently stops being
associated. Do not hand-add `for` attributes.

### Numbers must be traceable

This is an engineering reference, not a toy. Formulas cite their source
(ITU-R P.838 and P.618 for rain, P.676 for gaseous attenuation, ETSI EN 302 307
Annex A for DVB-S2 thresholds). **Never change a constant or a formula without
naming the standard it comes from**, and never silently "simplify" one.

`modcod.js` is the single source of truth for uncoded AWGN BER, shared by
`ber.html` and the link-budget MODCOD dropdown so the two can never drift. The
DVB-S2 coded thresholds in `link-budget.html` are deliberately hand-authored
constants from the standard — no closed-form formula reproduces them, so do not
try to derive them from `modcod.js`.

### The privacy claim is load-bearing

Every page's footer says the calculation **runs entirely in the visitor's
browser**. That is a claim about where computation happens, and it is true:
there is no backend, no analytics, and no telemetry. The AdSense tag is present
but commented out, and `.adslot` is hidden until it goes live. Any code that
sends user input to a service would make published copy false — don't add it.

The footers deliberately do **not** claim that nothing is transmitted. They used
to ("nothing leaves your browser", "No data leaves your browser") and that
wording was retired on 2026-08-16, because it was not true: `jumpOut()` in
`link-budget.html` puts the user's frequency into a query string and navigates,
and `linkout.js` returns via `?apply=<field>&value=<n>`. A query string travels
in the HTTP request line, so those values reach the GitHub Pages access log.
Do not restore the absolute wording while that round trip uses query strings.

Moving the round trip to a URL **fragment** (`#…`, which browsers never send to
the server) would make the stronger claim true again, and is the fix to make if
the absolute wording is ever wanted back.

`linkout.js` is otherwise privacy-tight: state moves between tools only on an
explicit jump-out round trip from `link-budget.html`. Opening a tool page
directly stores and broadcasts nothing.

## Shared Memory

**Always write new instructions, rules, and memory to `AGENTS.md` only.**

Never modify `CLAUDE.md` directly — it only imports `AGENTS.md`.
This keeps Claude Code and Codex CLI on the same context; Codex reads
`AGENTS.md` natively. (Antigravity/`agy` is not bridged in this project — see
`## Enabled Tools` in `.cc-suite.md` to add it.)

## Project Structure

- `.claude/` — Claude Code skills, agents, rules, hooks, commands
- `.agents/skills/` — symlink to `.claude/skills/` (Codex skill scan path)
- `.codex/prompts/` — Codex slash-command prompts
- `.codex/hooks.json` / `.codex/config.toml` — Codex hooks/config (optional)
- `.mcp.json` — MCP server registrations (Claude Code + Codex)
