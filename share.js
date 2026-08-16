/* SatTools shareable-link helper: serializes every id'd input/select/textarea
   to a query string and restores them from one, so a specific calculation can
   be carried by link.

   Loading this file does nothing on its own — it only defines window.ShareTool.
   Every page that wants the behaviour calls ShareTool.apply() itself at the end
   of its own setup, which is why the eleven pages with inputs to restore load
   it and index.html and bands.html do not. (An earlier version of this comment
   claimed apply() "runs on every page load"; it never has, and that reading is
   what makes the 11-vs-13 gap look like a missing include. See AGENTS.md.)

   apply() reads location.search by default, so hand-built ?id=value links work;
   passed an explicit string it restores from that instead, which is how
   link-budget.html replays its pre-jump snapshot. collect() has exactly one
   caller — that same snapshot, stashed in sessionStorage rather than put in a
   URL — so nothing here ever writes user input into the address bar.

   No Share button is rendered: the top bar deliberately keeps only the language
   toggle. initButton() stays as an empty stub so pages can keep calling it
   unconditionally. */
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
