/* SatTools shared uncoded-modulation BER engine.
   Single source of truth for AWGN bit-error-rate formulas, shared by
   ber.html (interactive BER curve plotter) and link-budget.html (the
   "Uncoded" MODCOD dropdown's required-Eb/N0 thresholds) — so the two
   pages can never independently drift on the same modulation's number.
   DVB-S2 LDPC+BCH coded thresholds in link-budget.html are NOT derived
   from this engine: they are real coded-performance figures from the
   DVB-S2 standard (ETSI EN 302 307 Annex A, QEF) that no closed-form
   uncoded formula can reproduce, so they stay as hand-authored constants
   there. */
(function(){
  function erfc(x){
    const z=Math.abs(x), t=1/(1+0.5*z);
    const tau=t*Math.exp(-z*z-1.26551223+t*(1.00002368+t*(0.37409196+t*(0.09678418+
      t*(-0.18628806+t*(0.27886807+t*(-1.13520398+t*(1.48851587+t*(-0.82215223+t*0.17087277)))))))));
    return x>=0?tau:2-tau;
  }
  const Q=x=>0.5*erfc(x/Math.SQRT2);
  const g=db=>Math.pow(10,db/10);

  // DVB-S2-style APSK: build constellation (unit mean energy) + nearest-neighbour union-bound BER
  function apskPts(rings){
    let pts=[],e=0;
    rings.forEach(R=>{for(let k=0;k<R.n;k++){const a=R.off+2*Math.PI*k/R.n;pts.push([R.r*Math.cos(a),R.r*Math.sin(a)]);}});
    pts.forEach(p=>e+=p[0]*p[0]+p[1]*p[1]); e/=pts.length;
    const s=1/Math.sqrt(e); return pts.map(p=>[p[0]*s,p[1]*s]);
  }
  function apskBer(pts,k){
    const M=pts.length;
    return db=>{const ga=g(db); let ser=0;
      for(let i=0;i<M;i++)for(let j=0;j<M;j++){if(i===j)continue;
        const dx=pts[i][0]-pts[j][0],dy=pts[i][1]-pts[j][1];
        ser+=Q(Math.sqrt(k*ga/2)*Math.sqrt(dx*dx+dy*dy));}
      return Math.min(ser/M/k,0.5);};
  }
  const C16APSK=apskPts([{n:4,r:1,off:Math.PI/4},{n:12,r:2.85,off:0}]);              // 4+12, γ≈2.85
  const C32APSK=apskPts([{n:4,r:1,off:Math.PI/4},{n:12,r:2.84,off:0},{n:16,r:5.27,off:0}]); // 4+12+16

  const MODS=[
    {id:'bpsk', name:'BPSK / QPSK', k:1, color:'#2563eb', f:db=>Q(Math.sqrt(2*g(db)))},
    {id:'8psk', name:'8-PSK',       k:3, color:'#16a34a', f:db=>(2/3)*Q(Math.sqrt(6*g(db))*Math.sin(Math.PI/8))},
    {id:'16psk',name:'16-PSK',      k:4, color:'#0891b2', f:db=>(2/4)*Q(Math.sqrt(8*g(db))*Math.sin(Math.PI/16))},
    {id:'16qam',name:'16-QAM',      k:4, color:'#d97706', f:db=>0.75*Q(Math.sqrt(0.8*g(db)))},
    {id:'64qam',name:'64-QAM',      k:6, color:'#dc2626', f:db=>(4/6)*(1-1/8)*Q(Math.sqrt((18/63)*g(db)))},
    {id:'256qam',name:'256-QAM',    k:8, color:'#7c3aed', f:db=>(4/8)*(1-1/16)*Q(Math.sqrt((24/255)*g(db)))},
    {id:'16apsk',name:'16-APSK *',  k:4, color:'#0d9488', f:apskBer(C16APSK,4)},
    {id:'32apsk',name:'32-APSK *',  k:5, color:'#be123c', f:apskBer(C32APSK,5)},
    {id:'bfsk',name:'BFSK (coh.)',  k:1, color:'#db2777', f:db=>Q(Math.sqrt(g(db)))},
    {id:'dbpsk',name:'DBPSK',       k:1, color:'#65a30d', f:db=>0.5*Math.exp(-g(db))},
  ];

  /* Smallest Eb/N0 (dB) at which f(db) <= target, by bisection.
     Both ends are checked, because bisection is only meaningful when the
     root is inside the bracket: NaN when the target cannot be reached even
     at hi, and NaN when it is already met at lo. The floor used to be -5 dB
     with no lower check, so a target looser than the BER at -5 dB silently
     returned "-5 dB required" instead of admitting the root was off-scale.
     -20 dB is below 0.22 BER for every curve here — past a coin flip, so
     nothing useful lives under it. */
  function reqEbN0(f,target){
    if(target<=0)return NaN;
    let lo=-20,hi=50;
    if(f(hi)>target)return NaN;
    if(f(lo)<=target)return NaN;
    for(let i=0;i<60;i++){const m=(lo+hi)/2;(f(m)>target)?lo=m:hi=m;}
    return (lo+hi)/2;
  }

  window.Modcod = {Q, g, MODS, reqEbN0};
})();
