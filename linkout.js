/* SatTools "jump out, compute, bring the value back" deep-link helper.
   Replaces the old ambient cross-tab broadcast (every change on any open
   tab used to silently offer itself to every other tab). Now nothing is
   shared unless the user explicitly followed a jump-out link from
   link-budget.html: only then does the destination tool show a return
   bar, and only that one round trip ever touches link-budget.html.
   Visiting a tool page directly (sidebar, bookmark, search) has zero
   effect on link-budget.html — no banner, no state, nothing stored. */
(function(){
  function qs(name){ return new URLSearchParams(location.search).get(name); }

  /* ---- tool-page side ---- */
  let barBtn = null, barField = null;
  function initReturnBar(){
    barField = qs('back');
    if(!barField) return false;
    const bar = document.createElement('div');
    bar.className = 'linkback-bar';
    barBtn = document.createElement('button');
    barBtn.type = 'button';
    barBtn.className = 'linkback-btn';
    barBtn.disabled = true;
    bar.appendChild(barBtn);
    document.body.insertBefore(bar, document.body.firstChild);
    barBtn.addEventListener('click', () => {
      if(barBtn.dataset.value === undefined) return;
      const url = new URL('link-budget.html', location.href);
      url.searchParams.set('apply', barField);
      url.searchParams.set('value', barBtn.dataset.value);
      location.href = url.toString();
    });
    updateReturnBar(NaN);
    return true;
  }
  function updateReturnBar(value){
    if(!barBtn) return;
    const ok = typeof value === 'number' && isFinite(value);
    barBtn.disabled = !ok;
    const lead = window.t
      ? window.t('← Use this value in Link Budget','← 带这个值返回链路预算')
      : '← Use this value in Link Budget';
    if(ok){ barBtn.dataset.value = value; barBtn.textContent = lead+': '+value.toFixed(2); }
    else { delete barBtn.dataset.value; barBtn.textContent = lead; }
  }

  /* ---- link-budget.html side ---- */
  // Reads a pending ?apply=<fieldId>&value=<n> exactly once, then strips
  // both from the URL (history.replaceState) so refresh/back can't replay it.
  function consumeApply(){
    const field = qs('apply');
    const value = qs('value');
    if(field == null || value == null || !isFinite(parseFloat(value))) return null;
    const url = new URL(location.href);
    url.searchParams.delete('apply');
    url.searchParams.delete('value');
    history.replaceState(null, '', url.toString());
    return {field, value: parseFloat(value)};
  }

  window.LinkOut = {initReturnBar, updateReturnBar, consumeApply};
})();
