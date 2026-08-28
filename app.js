(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>Array.from(document.querySelectorAll(s));
const screens=q('.screens'),normal=q('#normal'),fraction=q('#fraction');
let normalText='',normalDone=false;
let fs={mixed:false,terms:[{w:'',n:'',d:'',op:null}],selected:{i:0,k:'n'}};
const fmt=n=>Number.isInteger(n)?String(n):String(Number(n.toFixed(10)));
function calc(s){const x=s.replaceAll('×','*').replaceAll('÷','/').replaceAll('−','-');if(!x)throw 0;const n=Function('return '+x)();if(!Number.isFinite(n))throw 0;return n}
function renderN(){q('#expr').textContent=normalText||'0';try{q('#preview').textContent=normalText?'= '+fmt(calc(normalText)):''}catch{q('#preview').textContent=''}}
function ninput(v){if(normalDone){if('+-−×÷'.includes(v))normalDone=false;else{normalText='';normalDone=false}}if('+-−×÷'.includes(v)&&'+-−×÷'.includes(normalText.at(-1)))normalText=normalText.slice(0,-1);normalText+=v;renderN()}
function nact(a){if(a==='clear')normalText='';else if(a==='delete'){normalText=normalDone?'':normalText.slice(0,-1);normalDone=false}else if(a==='percent'&&/\d$/.test(normalText))normalText+='%';else if(a==='paren'){const o=(normalText.match(/\(/g)||[]).length,c=(normalText.match(/\)/g)||[]).length;normalText+=(o>c&&/[\d)]$/.test(normalText))?')':(/[\d)%]$/.test(normalText)?'×(':'(')}else if(a==='equals'){try{normalText=fmt(calc(normalText));normalDone=true}catch{}}renderN()}
normal.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;b.dataset.v!==undefined?ninput(b.dataset.v):nact(b.dataset.a)});
const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b)[a,b]=[b,a%b];return a||1};
function val(p){const d=+p.d,n=+p.n||0,w=+p.w||0;if(n&&(!d||d===0))throw 0;return w+n/(d||1)}
function rat(x){const s=x<0?-1:1;x=Math.abs(x);let w=Math.floor(x),d=1000000,n=Math.round((x-w)*d),g=gcd(n,d);n/=g;d/=g;return n?{w:w?String(s*w):'',n:String(s*n),d:String(d),op:null}:{w:String(s*w||''),n:'',d:'',op:null}}
function part(i,k){const b=document.createElement('button');b.type='button';b.className='part '+(fs.selected.i===i&&fs.selected.k===k?'selected':'');b.textContent=fs.terms[i][k]||'0';b.onclick=()=>{fs.selected={i,k};drawF()};return b}
function opbtn(i){const b=document.createElement('button');b.type='button';b.className='fraction-operator select-op';b.textContent=fs.terms[i].op||'+';b.onclick=()=>{const ops=['+','−','×','÷'],z=ops.indexOf(fs.terms[i].op);fs.terms[i].op=ops[(z+1)%4];drawF()};return b}
function evalF(){let r=val(fs.terms[0]);for(let i=1;i<fs.terms.length;i++){const x=val(fs.terms[i]),o=fs.terms[i-1].op;if(o==='+')r+=x;else if(o==='−')r-=x;else if(o==='×')r*=x;else if(o==='÷')r/=x;else throw 0}if(!Number.isFinite(r))throw 0;return r}
function drawF(){const root=q('#fracs');root.replaceChildren();fs.terms.forEach((p,i)=>{if(i)root.append(opbtn(i-1));const f=document.createElement('div');f.className='fraction';if(fs.mixed)f.append(part(i,'w'));const st=document.createElement('div');st.className='stack';st.append(part(i,'n'));const line=document.createElement('div');line.className='num';st.append(line);st.append(part(i,'d'));f.append(st);root.append(f)});try{q('#fractionResult').textContent='≈ '+fmt(evalF())}catch{q('#fractionResult').textContent=''}}
function fd(v){const p=fs.terms[fs.selected.i],k=fs.selected.k;p[k]=(p[k]||'')+v;drawF()}
function fdel(){const p=fs.terms[fs.selected.i],k=fs.selected.k;p[k]=(p[k]||'').slice(0,-1);drawF()}
function fop(v){const i=fs.selected.i,p=fs.terms[i];if(!p.n&&!p.d&&!p.w)return;p.op=v;if(i===fs.terms.length-1){fs.terms.push({w:'',n:'',d:'',op:null});fs.selected={i:i+1,k:'n'}}drawF()}
function fadd(){const p=fs.terms.at(-1);if(!p.n&&!p.d&&!p.w)return;p.op='+';fs.terms.push({w:'',n:'',d:'',op:null});fs.selected={i:fs.terms.length-1,k:'n'};drawF()}
function fremove(){if(fs.terms.length===1){fs.terms=[{w:'',n:'',d:'',op:null}];fs.selected={i:0,k:'n'}}else{const i=fs.selected.i;fs.terms.splice(i,1);fs.selected={i:Math.max(0,i-1),k:'n'}}drawF()}
function feq(){try{const r=evalF();fs.terms=[rat(r)];fs.selected={i:0,k:fs.mixed?'w':'n'};drawF();q('#fractionResult').textContent='= '+fmt(r)}catch{q('#fractionResult').textContent='計算できません'}}
function clearF(){fs={mixed:false,terms:[{w:'',n:'',d:'',op:null}],selected:{i:0,k:'n'}};drawF()}
function toggleMixed(){fs.mixed=!fs.mixed;fs.selected.k=fs.mixed?'w':'n';drawF()}
fraction.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.fv!==undefined){const v=b.dataset.fv;'+−×÷'.includes(v)?fop(v):fd(v);return}switch(b.dataset.fa){case'clear':clearF();break;case'delete':fdel();break;case'add':fadd();break;case'deleteFrac':fremove();break;case'mixed':toggleMixed();break;case'equals':feq();break}});
window.CalcFractionInput=fd;window.CalcFractionOp=fop;window.CalcFractionDelete=fdel;window.CalcFractionAdd=fadd;window.CalcFractionRemove=fremove;window.CalcFractionClear=clearF;window.CalcFractionMixed=toggleMixed;window.CalcFractionEquals=feq;
qa('.mode').forEach(btn=>btn.onclick=function(){const isF=this.getAttribute('data-mode')==='fraction';qa('.mode').forEach(x=>{const on=x===this;x.classList.toggle('active',on);x.setAttribute('aria-selected',on?'true':'false')});screens.classList.toggle('fraction-active',isF)});
renderN();drawF();
})();