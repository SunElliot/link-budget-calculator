/* SatTools cross-tool workspace.
   A tiny localStorage value bus: one calculator's headline result can be
   offered — never silently applied — to a matching field in another
   calculator. Producers call set() at the end of their own compute().
   Consumers call hint() once per relevant field, each time their own
   compute() runs, to show/refresh a small "use this value" prompt. */
(function(){
  const KEY = 'sattools_workspace_v1';

  function readAll(){
    try{
      const v = JSON.parse(localStorage.getItem(KEY));
      return (v && typeof v === 'object') ? v : {};
    }catch(e){ return {}; }
  }
  function writeAll(obj){
    try{ localStorage.setItem(KEY, JSON.stringify(obj)); }catch(e){}
  }
  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  }

  function set(key, value, source){
    if(typeof value !== 'number' || !isFinite(value)) return;
    const all = readAll();
    all[key] = {value, source: String(source||''), ts: Date.now()};
    writeAll(all);
  }
  function get(key){
    return readAll()[key] || null;
  }

  // Registers fn to run whenever another tab/window writes a new value via
  // set() — lets an already-open consumer page's hints refresh live instead
  // of only on the consumer's own next input/compute(). The native `storage`
  // event only fires in *other* tabs of the same origin, never the tab that
  // made the write, so this can't loop back on itself.
  const changeListeners = [];
  function onChange(fn){
    if(typeof fn === 'function') changeListeners.push(fn);
  }
  window.addEventListener('storage', e => {
    if(e.key !== KEY) return;
    changeListeners.forEach(fn => { try{ fn(); }catch(err){} });
  });

  // Shows/hides a small hint right after inputEl's `.row` ancestor.
  // currentValue: inputEl's own current numeric value, so the hint can hide
  // itself once it matches (e.g. right after the user clicks "Use").
  // applyFn(entry): set field(s) + recompute; left entirely to the caller.
  function hint(inputEl, key, currentValue, applyFn){
    if(!inputEl) return;
    const id = inputEl.id + '_sync';
    let el = document.getElementById(id);
    if(!el){
      el = document.createElement('div');
      el.id = id;
      el.className = 'sync-hint';
      const row = inputEl.closest('.row') || inputEl.parentNode;
      row.insertAdjacentElement('afterend', el);
    }
    const entry = get(key);
    if(!entry || typeof currentValue !== 'number' || !isFinite(currentValue) ||
       Math.abs(entry.value - currentValue) < 1e-9){
      el.style.display = 'none';
      el.innerHTML = '';
      return;
    }
    const useLabel = window.t ? window.t('Use','使用') : 'Use';
    el.style.display = 'flex';
    el.innerHTML = `<span>\u{1F4A1} ${escapeHtml(entry.source)}: <b>${entry.value}</b></span>`; // \u{1F4A1} = "💡"
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = useLabel;
    btn.addEventListener('click', () => applyFn(entry));
    el.appendChild(btn);
  }

  window.Workspace = {set, get, hint, escapeHtml, onChange};
})();
