/* SatTools shareable-link helper.
   Serializes every id'd input/select/textarea into the URL query string and
   restores them on load, so a specific calculation can be shared by link.

   No Share button is rendered — the top bar deliberately keeps only the
   language toggle — but apply() still runs on every page load, so
   hand-built ?id=value links and the jump-out round trip in linkout.js
   keep working. */
(function(){
  function collect(){
    const p = new URLSearchParams();
    document.querySelectorAll('input[id],select[id],textarea[id]').forEach(el=>{
      if(el.type === 'checkbox'){ p.set(el.id, el.checked ? '1' : '0'); return; }
      if(el.value !== '') p.set(el.id, el.value);
    });
    return p.toString();
  }
  function apply(qs){
    const p = new URLSearchParams(qs !== undefined ? qs : location.search);
    let any = false;
    p.forEach((v,k)=>{
      const el = document.getElementById(k);
      if(!el) return;
      if(el.type === 'checkbox'){ el.checked = (v === '1'); any = true; return; }
      // A <select> assigned a value no <option> carries silently goes to
      // selectedIndex −1, and the calculators read selectedOptions[0].dataset
      // straight away — a stale or hand-edited link would throw there and kill
      // the whole compute() pass. Ignore values the select can't represent.
      if(el.tagName === 'SELECT' && ![...el.options].some(o=>o.value === v)) return;
      el.value = v;
      any = true;
    });
    return any;
  }
  window.ShareTool = { collect, apply, initButton(){} };
})();
