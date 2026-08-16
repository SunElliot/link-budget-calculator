/* SatTools accessibility wiring.

   Every calculator row is written as

     <div class="row"><label>Tx antenna gain<span class="hint">dBi</span></label>
                      <input type="number" id="txGain" …></div>

   — visually a label, but with no `for`, so the association exists only in
   the layout. That costs the click-the-label-to-focus affordance and leaves
   screen readers announcing the inputs unnamed.

   Rather than hand-adding `for` to ~70 rows across 13 pages (and having to
   remember it on every new row), derive it from the structure that is
   already there: within a .row, the first <label> names the first control.

   Unit selects (the `<select>` next to a value input inside .ig, e.g.
   txPowerUnit) get an aria-label built from the same text, since one <label>
   can only point at one control. */
(function(){
  function labelText(label){
    // Take the main text only — drop the .hint sub-caption and any
    // jump-out links that link-budget.html appends into the label later.
    let s = '';
    label.childNodes.forEach(n=>{
      if(n.nodeType === 3) s += n.nodeValue;
      else if(n.nodeType === 1 && !n.classList.contains('hint') && !n.classList.contains('jump-links')) s += n.textContent;
    });
    return s.replace(/\s+/g,' ').trim();
  }

  // Table-shaped forms (noise-figure.html's stage chain) carry no <label> at
  // all — the column <th> is the name, and the whole tbody is re-rendered
  // through innerHTML on every edit. Name each control from its column
  // header + row position instead.
  function wireTables(){
    document.querySelectorAll('table').forEach(tbl=>{
      const heads = [...tbl.querySelectorAll('thead th')];
      if(!heads.length) return;
      heads.forEach(th=>{ if(!th.getAttribute('scope')) th.setAttribute('scope','col'); });
      const headText = heads.map(th=>th.textContent.replace(/\s+/g,' ').trim());
      [...tbl.querySelectorAll('tbody tr')].forEach((tr,ri)=>{
        [...tr.children].forEach((td,ci)=>{
          const name = headText[ci];
          if(!name) return;
          td.querySelectorAll('input,select,textarea').forEach(c=>{
            if(c.getAttribute('aria-label') || c.labels?.length) return;
            c.setAttribute('aria-label', name + ' — ' + (ri+1));
          });
        });
      });
    });
  }

  function wire(){
    wireTables();
    document.querySelectorAll('.row').forEach(row=>{
      const label = row.querySelector('label');
      if(!label || label.htmlFor) return;
      const controls = [...row.querySelectorAll('input[id],select[id],textarea[id]')];
      if(!controls.length) return;

      label.htmlFor = controls[0].id;

      const text = labelText(label);
      if(!text) return;
      controls.slice(1).forEach(c=>{
        if(c.getAttribute('aria-label')) return;
        c.setAttribute('aria-label', text + ' — ' + (c.tagName === 'SELECT' ? 'unit' : 'value'));
      });
    });

    // Charts are decorative duplicates of the numbers already in the results
    // grid, so expose them as images with a name instead of as bare canvases.
    document.querySelectorAll('canvas').forEach(c=>{
      if(c.getAttribute('role')) return;
      const card = c.closest('.card');
      const h = card && card.querySelector('h2');
      c.setAttribute('role','img');
      c.setAttribute('aria-label', h ? h.textContent.trim() : 'chart');
    });
  }

  // The static rows only need one pass — i18n.js swaps label *text* on a
  // language change, but the `for`/aria wiring is per-element and survives
  // that. Dynamically re-rendered forms do not: noise-figure.html rebuilds
  // its whole stage table through innerHTML on every keystroke, and
  // link-budget.html injects jump-out links after load. Re-run on DOM
  // changes, coalesced into one pass per frame so a burst of edits costs
  // a single re-wire.
  let queued = false;
  function schedule(){
    if(queued) return;
    queued = true;
    requestAnimationFrame(()=>{ queued = false; wire(); });
  }
  function start(){
    wire();
    new MutationObserver(schedule).observe(document.body, {childList:true, subtree:true});
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
