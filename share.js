/* SatTools shareable-link helper.
   Serializes every id'd input/select/textarea into the URL query string and
   restores them on load, so a specific calculation can be shared by link. */
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
      if(el.type === 'checkbox') el.checked = (v === '1'); else el.value = v;
      any = true;
    });
    return any;
  }
  function initButton(){
    return; // Share button hidden — top bar keeps only the language toggle
    const nav = document.querySelector('.topnav');
    if(!nav) return;
    const btn = document.createElement('button');
    btn.className = 'sharebtn';
    btn.type = 'button';
    btn.textContent = '🔗 Share';
    btn.title = 'Copy a link to this exact calculation';
    btn.addEventListener('click', ()=>{
      const qs = collect();
      const url = location.origin + location.pathname + (qs ? '?' + qs : '');
      history.replaceState(null, '', url);
      const reset = ()=>{ btn.textContent = '✓ Link copied!'; setTimeout(()=>btn.textContent='🔗 Share', 1600); };
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(url).then(reset, reset);
      } else { reset(); }
    });
    nav.appendChild(btn);
  }
  window.ShareTool = { collect, apply, initButton };
})();
