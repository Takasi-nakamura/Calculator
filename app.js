(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const exprEl = $('#expr');
  const previewEl = $('#preview');
  const normalPad = $('#normal');
  const fractionMode = $('#fraction');

  let expression = '';
  let justEvaluated = false;

  function safeEval(input) {
    const s = input.replaceAll('×','*').replaceAll('÷','/').replaceAll('−','-')
      .replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');
    if (!s || !/^[0-9+\-*/().%\s]+$/.test(s)) throw new Error('invalid');
    const value = Function('"use strict"; return (' + s + ')')();
    if (!Number.isFinite(value)) throw new Error('math');
    return value;
  }

  function renderNormal() {
    exprEl.textContent = expression || '0';
    if (!expression) { previewEl.textContent = ''; return; }
    try { previewEl.textContent = '= ' + safeEval(expression); }
    catch { previewEl.textContent = ''; }
  }

  function inputNormal(value) {
    if (justEvaluated) { expression = ''; justEvaluated = false; }
    const last = expression.slice(-1);
    if ('+−×÷'.includes(value) && '+−×÷'.includes(last)) expression = expression.slice(0,-1);
    if (value === '.' && /(?:^|[+−×÷(])\d*\.\d*$/.test(expression)) return;
    expression += value;
    renderNormal();
  }

  function normalAction(action) {
    if (action === 'clear') { expression=''; justEvaluated=false; renderNormal(); return; }
    if (action === 'delete') { expression=expression.slice(0,-1); renderNormal(); return; }
    if (action === 'percent') { if (expression && /\d$/.test(expression)) expression += '%'; renderNormal(); return; }
    if (action === 'paren') {
      const opens=(expression.match(/\(/g)||[]).length;
      const closes=(expression.match(/\)/g)||[]).length;
      if (opens>closes && /[0-9)]$/.test(expression)) expression+=')'; else if (!/[0-9)%]$/.test(expression)) expression+='('; else expression+='×(';
      renderNormal(); return;
    }
    if (action === 'equals') {
      try { expression=String(safeEval(expression)); justEvaluated=true; exprEl.textContent=expression; previewEl.textContent=''; }
      catch { previewEl.textContent='Error'; }
    }
  }

  normalPad.addEventListener('click', (e) => {
    const button=e.target.closest('button'); if(!button) return;
    if(button.dataset.v !== undefined) inputNormal(button.dataset.v);
    else normalAction(button.dataset.a);
  });

  $$('.mode').forEach((button) => button.addEventListener('click', () => {
    $$('.mode').forEach(b => { b.classList.toggle('active',b===button); b.setAttribute('aria-selected',b===button?'true':'false'); });
    const fraction=button.dataset.mode==='fraction';
    normalPad.hidden=fraction; fractionMode.hidden=!fraction;
    if(fraction) renderFractions(); else renderNormal();
  }));

  let mixed=false;
  let items=[{w:'',n:'',d:'',op:''}];
  let selected={i:0,k:'n'};

  function gcd(a,b){ a=Math.abs(a); b=Math.abs(b); while(b){ [a,b]=[b,a%b]; } return a||1; }
  function fractionValue(p){
    const d=Number(p.d||0); if(d===0 && p.n) throw new Error('denominator');
    return Number(p.w||0)+(Number(p.n||0)/(d||1));
  }
  function makeFraction(x){
    if(!Number.isFinite(x)) throw new Error('math');
    const sign=x<0?-1:1; x=Math.abs(x);
    let whole=Math.floor(x), den=1000000, num=Math.round((x-whole)*den);
    const g=gcd(num,den); num/=g; den/=g;
    if(den===1) return {w:String(sign*whole),n:'',d:'',op:''};
    return {w:whole?String(sign*whole):'',n:String(sign*num),d:String(den),op:''};
  }

  function partButton(i,k,text){
    const b=document.createElement('button'); b.type='button'; b.className='part'+(selected.i===i&&selected.k===k?' selected':''); b.textContent=text;
    b.addEventListener('click',(e)=>{e.preventDefault();selected={i,k};renderFractions();});
    return b;
  }

  function renderFractions(){
    const root=$('#fracs'); root.innerHTML='';
    items.forEach((p,i)=>{
      if(i){ const op=document.createElement('span'); op.className='operator'; op.textContent=p.op||'+'; root.append(op); }
      const f=document.createElement('div'); f.className='fraction';
      if(mixed) f.append(partButton(i,'w',p.w||'0'));
      const stack=document.createElement('div'); stack.className='stack';
      stack.append(partButton(i,'n',p.n||'0'));
      const line=document.createElement('div'); line.className='num'; stack.append(line);
      stack.append(partButton(i,'d',p.d||'0')); f.append(stack); root.append(f);
    });
    try{
      let result=fractionValue(items[0]);
      for(let i=1;i<items.length;i++){const x=fractionValue(items[i]),op=items[i].op; if(op==='+')result+=x; if(op==='−')result-=x; if(op==='×')result*=x; if(op==='÷')result/=x;}
      previewEl.textContent=Number.isFinite(result)?'≈ '+result:'';
    }catch{previewEl.textContent='';}
  }

  function fractionDigit(v){ const p=items[selected.i]; p[selected.k]=(p[selected.k]||'')+v; renderFractions(); }
  function fractionDelete(){ const p=items[selected.i]; p[selected.k]=(p[selected.k]||'').slice(0,-1); renderFractions(); }
  function fractionOperator(op){
    if(!items[selected.i].n && !items[selected.i].d && !items[selected.i].w) return;
    items[selected.i].op=op;
    items.push({w:'',n:'',d:'',op:''});
    selected={i:items.length-1,k:'n'}; renderFractions();
  }
  function addFraction(){ items.push({w:'',n:'',d:'',op:'+'}); selected={i:items.length-1,k:'n'}; renderFractions(); }
  function deleteFraction(){ if(items.length===1) items=[{w:'',n:'',d:'',op:''}]; else {items.splice(selected.i,1);selected={i:Math.max(0,selected.i-1),k:'n'};} renderFractions(); }
  function fractionEquals(){
    try{
      let result=fractionValue(items[0]);
      for(let i=1;i<items.length;i++){const x=fractionValue(items[i]),op=items[i-1].op; if(op==='+')result+=x; if(op==='−')result-=x; if(op==='×')result*=x; if(op==='÷')result/=x;}
      const normalized=makeFraction(result); items=[normalized]; selected={i:0,k:mixed?'w':'n'}; renderFractions(); previewEl.textContent='= '+result;
    }catch{previewEl.textContent='Error';}
  }

  fractionMode.addEventListener('click',(e)=>{
    const b=e.target.closest('button'); if(!b) return;
    if(b.dataset.fv!==undefined){
      if('+−×÷'.includes(b.dataset.fv)) fractionOperator(b.dataset.fv); else fractionDigit(b.dataset.fv);
      return;
    }
    const a=b.dataset.fa;
    if(a==='clear'){items=[{w:'',n:'',d:'',op:''}];selected={i:0,k:'n'};renderFractions();}
    if(a==='delete') fractionDelete();
    if(a==='add') addFraction();
    if(a==='deleteFrac') deleteFraction();
    if(a==='mixed'){mixed=!mixed;renderFractions();}
    if(a==='equals') fractionEquals();
  });

  document.addEventListener('keydown',(e)=>{
    if(!fractionMode.hidden) return;
    if(/^\d$/.test(e.key)||'.'.includes(e.key)) inputNormal(e.key);
    else if(e.key==='Enter'||e.key==='=') normalAction('equals');
    else if(e.key==='Backspace') normalAction('delete');
    else if(e.key==='Escape') normalAction('clear');
    else if(e.key==='+') inputNormal('+'); else if(e.key==='-') inputNormal('−'); else if(e.key==='*') inputNormal('×'); else if(e.key==='/') inputNormal('÷');
  });

  renderNormal(); renderFractions();
  if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
})();