(function(){
const app=document.getElementById('app');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=n=>{const r=Math.round(n*100)/100;return String(r).replace('.',',')};
const sgn=n=>(n>0?'+':n<0?'−':'')+fmt(Math.abs(n));
const LSK='gb-dsblanc-v1';
let mem=null;
function load(){if(mem)return mem;let d=null;try{d=JSON.parse(localStorage.getItem(LSK)||'null')}catch(e){}mem=Object.assign({mast:{},ratio:1/3,hist:[]},d||{});return mem}
function save(){try{localStorage.setItem(LSK,JSON.stringify(mem))}catch(e){}}
load();

const CH={};BANK.forEach(c=>CH[c.id]=c);
const ALL=[];BANK.forEach(c=>c.qs.forEach((q,i)=>ALL.push({id:c.id+'.'+(i+1),ch:c.id,pts:q[0],q:q[1],o:q[2],e:q[3]})));
const ById={};ALL.forEach(q=>ById[q.id]=q);

/* ---------- maîtrise : 2 bonnes réponses d'affilée, une erreur remet à zéro ---------- */
function status(id){const m=mem.mast[id];if(!m||!m.seen)return 'new';if(m.lw)return 'wrong';if(m.streak>=2)return 'mastered';return 'prog'}
const W={wrong:4,new:3,prog:2,mastered:1};
function record(id,ok){const m=mem.mast[id]||(mem.mast[id]={seen:0,streak:0,lw:false});m.seen++;if(ok){m.streak++;m.lw=false}else{m.streak=0;m.lw=true}}
function chStats(cid){let seen=0,mast=0,tot=0;ALL.forEach(q=>{if(q.ch!==cid)return;tot++;const s=status(q.id);if(s!=='new'){seen++;if(s==='mastered')mast++}});return{seen,mast,tot,pct:seen?Math.round(100*mast/seen):0}}
const lvl=p=>p>=75?'g':p>=40?'o':'r';
function wrongList(){return ALL.filter(q=>status(q.id)==='wrong')}

/* ---------- tirage ---------- */
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
function pickWeighted(pool,n){const res=[];let p=pool.slice();while(res.length<n&&p.length){const tw=p.reduce((s,q)=>s+W[status(q.id)],0);let r=Math.random()*tw,k=0;for(;k<p.length;k++){r-=W[status(p[k].id)];if(r<=0)break}if(k>=p.length)k=p.length-1;res.push(p[k]);p.splice(k,1)}return shuffle(res)}
function instance(q){const idx=shuffle([0,1,2,3]);return{id:q.id,ch:q.ch,pts:q.pts,q:q.q,opts:idx.map(i=>q.o[i]),a:idx.indexOf(0),e:q.e}}

/* ---------- session ---------- */
let S=null,timer=null;
function start(mode,pool,n,minutes,label){
  const list=(n>=pool.length?shuffle(pool):pickWeighted(pool,n)).map(instance);
  S={mode,label,qs:list,i:0,ans:list.map(()=>null),flag:list.map(()=>false),done:list.map(()=>false),t0:Date.now(),end:minutes?Date.now()+minutes*60000:null,minutes};
  clearInterval(timer);
  if(S.end)timer=setInterval(tick,1000);
  renderQ();
}
function tick(){
  if(!S||S.over)return clearInterval(timer);
  const el=document.getElementById('tm');const left=Math.max(0,S.end-Date.now());
  if(el){const s=Math.ceil(left/1000);el.textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0');el.classList.toggle('warn',left<120000)}
  if(left<=0)finish(true);
}
const maxPts=()=>S.qs.reduce((s,q)=>s+q.pts,0);

function ask(msg,yes,cb){const ov=document.createElement('div');ov.className='ov';ov.innerHTML=`<div class="sheet"><p>${esc(msg)}</p><div class="nav"><button class="btn" id="n">Annuler</button><button class="btn primary" id="y">${esc(yes)}</button></div></div>`;document.body.appendChild(ov);ov.querySelector('#n').onclick=()=>ov.remove();ov.querySelector('#y').onclick=()=>{ov.remove();cb()}}

/* ---------- accueil ---------- */
function home(){
  clearInterval(timer);S=null;
  const r=mem.ratio,wl=wrongList();
  const ratios=[[0,'0 (pas de malus)'],[0.25,'¼ des points'],[1/3,'⅓ des points'],[0.5,'½ des points'],[1,'tous les points']];
  app.innerHTML=`
  <header class="hd"><a class="lnk" href="index.html">← Révisions DS</a><div class="eyebrow">ECAM · Amélioration continue · Green Belt Lean Six Sigma</div>
  <h1>DS blancs</h1>
  <p class="lead">160 questions tirées du cours, des TD, des quiz et du DS 2022. Comme au DS : questions pondérées, <b>points négatifs</b>, pas de correction avant la fin.</p></header>

  <section class="card">
    <h2>Les règles du DS blanc</h2>
    <ul class="rules">
      <li><b>Bonne réponse</b> : + le nombre de points de la question (1 à 3).</li>
      <li><b>Mauvaise réponse</b> : − une fraction des points de la question (réglable ci-dessous).</li>
      <li><b>Question passée</b> : 0 point. Mieux vaut passer que répondre au hasard quand on n'a aucune idée.</li>
      <li>Pas de correction avant la fin, chronomètre, calculatrice autorisée, aucun document.</li>
      <li>Note finale = points obtenus / total × 20, ramenée à 0 au minimum.</li>
    </ul>
    <label class="fl">Malus par mauvaise réponse
      <select id="ratio">${ratios.map(([v,l])=>`<option value="${v}"${Math.abs(v-r)<1e-6?' selected':''}>${l}</option>`).join('')}</select></label>
    <p class="hint">Avec 4 choix, répondre au hasard rapporte en moyenne ${sgn(0.25-0.75*r)} × les points de la question${Math.abs(r-1/3)<1e-6?' (nul : le malus est calibré pour décourager le hasard)':''}. Si tu peux éliminer 2 réponses, tenter devient rentable.</p>
  </section>

  <section class="card">
    <h2>Lancer un DS blanc</h2>
    <p class="hint">Les questions sont tirées de toute la banque, en favorisant celles que tu as ratées ou jamais vues.</p>
    <label class="chk"><input type="checkbox" id="timer" checked> Chronomètre (arrêt automatique à la fin du temps)</label>
    <div class="grid3">
      <button class="btn big" data-ds="20">Express<small>20 questions · 25 min</small></button>
      <button class="btn big" data-ds="30">Standard<small>30 questions · 40 min</small></button>
      <button class="btn big primary" data-ds="40">Complet<small>40 questions · 55 min</small></button>
    </div>
  </section>

  <section class="card">
    <h2>S'entraîner par chapitre</h2>
    <p class="hint">Correction immédiate après chaque question, même barème. Maîtrisée = 2 bonnes réponses d'affilée.</p>
    ${wl.length?`<button class="btn redo" id="redo">Refaire mes ${wl.length} erreur${wl.length>1?'s':''}</button>`:''}
    <div class="chl">${BANK.map(c=>{const s=chStats(c.id);return`<div class="ch"><div class="cht"><b>${esc(c.title)}</b><span class="sub">${esc(c.sub)}</span></div>
      <div class="chm"><span class="dot ${s.seen?lvl(s.pct):'n'}"></span><span class="mono">${s.seen?s.pct+' %':'—'} · ${s.seen}/${s.tot} vues</span></div>
      <div class="cha"><button class="btn sm" data-tr="${c.id}" data-n="10">10 q.</button><button class="btn sm" data-tr="${c.id}" data-n="99">Tout (${c.qs.length})</button></div></div>`}).join('')}</div>
  </section>

  ${mem.hist.length?`<section class="card"><h2>Mes derniers DS blancs</h2><div class="hist">${mem.hist.slice(0,8).map(h=>`<div class="hr"><span>${esc(h.d)} · ${esc(h.l)}</span><b class="mono">${fmt(h.n)} / 20</b></div>`).join('')}</div></section>`:''}

  <p class="foot"><button class="lnk" id="reset">Effacer ma progression</button></p>`;
  document.getElementById('ratio').onchange=e=>{mem.ratio=parseFloat(e.target.value);save();home()};
  app.querySelectorAll('[data-ds]').forEach(b=>b.onclick=()=>{const n=+b.dataset.ds;const t=document.getElementById('timer').checked;const m={20:25,30:40,40:55}[n];start('exam',ALL,n,t?m:0,'DS blanc '+n+' q.')});
  app.querySelectorAll('[data-tr]').forEach(b=>b.onclick=()=>start('practice',ALL.filter(q=>q.ch===b.dataset.tr),+b.dataset.n,0,CH[b.dataset.tr].title));
  const rd=document.getElementById('redo');if(rd)rd.onclick=()=>start('practice',wrongList(),99,0,'Mes erreurs');
  document.getElementById('reset').onclick=()=>ask('Effacer toute ta progression et ton historique ?','Effacer',()=>{mem.mast={};mem.hist=[];save();home()});
  window.scrollTo(0,0);
}

/* ---------- question ---------- */
function renderQ(){
  const q=S.qs[S.i],ex=S.mode==='exam',v=S.done[S.i],a=S.ans[S.i],r=mem.ratio;
  const last=S.i===S.qs.length-1;
  const answered=S.ans.filter(x=>x!==null).length;
  app.innerHTML=`
  <div class="bar"><button class="lnk" id="quit">✕ Quitter</button>
    <span class="lab">${esc(S.label)}</span>
    ${S.end?`<span class="tm mono" id="tm"></span>`:'<span></span>'}
    <button class="lnk" id="pal">Questions</button></div>
  <div class="prog"><i style="width:${100*(S.i+1)/S.qs.length}%"></i></div>
  <section class="qc">
    <div class="chips"><span class="chip">Q ${S.i+1} / ${S.qs.length}</span><span class="chip">${esc(CH[q.ch].title)}</span><span class="chip pts">${fmt(q.pts)} pt${q.pts>1?'s':''} · ${r?'faux '+sgn(-q.pts*r):'pas de malus'}</span>${S.flag[S.i]?'<span class="chip fl">🚩 à revoir</span>':''}</div>
    <h2 class="qt">${esc(q.q)}</h2>
    <div class="opts">${q.opts.map((o,k)=>{let c='opt';if(ex||!v){if(a===k)c+=' sel'}else{if(k===q.a)c+=' good';else if(a===k)c+=' bad'}return`<button class="${c}" data-k="${k}"${v&&!ex?' disabled':''}><span class="L">${'ABCD'[k]}</span><span>${esc(o)}</span></button>`}).join('')}</div>
    ${!ex&&v?`<div class="fb ${a===q.a?'ok':a===null?'bl':'ko'}"><b>${a===q.a?'Juste '+sgn(q.pts):a===null?'Passée · 0':'Faux '+sgn(-q.pts*r)}</b><p>${esc(q.e)}</p></div>`:''}
  </section>
  <div class="nav">
    ${ex?`<button class="btn" id="prev"${S.i?'':' disabled'}>◀</button><button class="btn" id="flag">🚩</button>
    <button class="btn" id="skip">Passer</button>
    <button class="btn primary" id="next">${last?'Terminer':'Suivant ▶'}</button>`
    :v?`<button class="btn primary wide" id="next">${last?'Voir mon bilan':'Question suivante ▶'}</button>`
    :`<button class="btn" id="skip">Passer</button><button class="btn primary" id="val"${a===null?' disabled':''}>Valider</button>`}
  </div>
  ${ex?`<p class="hint c">${answered} / ${S.qs.length} répondues</p>`:''}`;
  app.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{if(!ex&&S.done[S.i])return;const k=+b.dataset.k;S.ans[S.i]=(ex&&S.ans[S.i]===k)?null:k;renderQ()});
  document.getElementById('quit').onclick=()=>ask('Quitter ce test ? Les réponses de ce DS en cours seront perdues.','Quitter',home);
  document.getElementById('pal').onclick=palette;
  const $n=document.getElementById('next');
  if(ex){
    document.getElementById('prev').onclick=()=>{S.i--;renderQ();window.scrollTo(0,0)};
    document.getElementById('flag').onclick=()=>{S.flag[S.i]=!S.flag[S.i];renderQ()};
    document.getElementById('skip').onclick=()=>{S.ans[S.i]=null;go(1)};
    $n.onclick=()=>last?confirmEnd():go(1);
  }else if(v){$n.onclick=()=>last?finish(false):go(1)}
  else{
    document.getElementById('skip').onclick=()=>{S.ans[S.i]=null;S.done[S.i]=true;renderQ()};
    document.getElementById('val').onclick=()=>{S.done[S.i]=true;record(q.id,S.ans[S.i]===q.a);save();renderQ()};
  }
  if(S.end)tick();
  window.scrollTo(0,0);
}
function go(d){S.i=Math.min(S.qs.length-1,Math.max(0,S.i+d));renderQ()}
function palette(){
  const ov=document.createElement('div');ov.className='ov';
  ov.innerHTML=`<div class="sheet"><div class="sh"><b>Questions</b><button class="lnk" id="cl">Fermer</button></div>
  <div class="pg">${S.qs.map((q,i)=>{const st=S.mode==='exam'?(S.ans[i]!==null?'a':'b'):(S.done[i]?'a':'b');return`<button class="pn ${st}${i===S.i?' cur':''}" data-i="${i}">${i+1}${S.flag[i]?'🚩':''}</button>`}).join('')}</div>
  <p class="hint">Bleu = répondue · gris = pas encore répondue · 🚩 = à revoir</p>
  ${S.mode==='exam'?'<button class="btn primary wide" id="end">Terminer le DS</button>':''}</div>`;
  document.body.appendChild(ov);
  ov.querySelector('#cl').onclick=()=>ov.remove();
  ov.onclick=e=>{if(e.target===ov)ov.remove()};
  ov.querySelectorAll('.pn').forEach(b=>b.onclick=()=>{S.i=+b.dataset.i;ov.remove();renderQ()});
  const en=ov.querySelector('#end');if(en)en.onclick=()=>{ov.remove();confirmEnd()};
}
function confirmEnd(){
  const blank=S.ans.filter(x=>x===null).length,fl=S.flag.filter(Boolean).length;
  const ov=document.createElement('div');ov.className='ov';
  ov.innerHTML=`<div class="sheet"><div class="sh"><b>Terminer le DS ?</b></div>
  <p>${blank?`<b>${blank}</b> question${blank>1?'s':''} sans réponse (0 point).`:'Toutes les questions ont une réponse.'}${fl?` <b>${fl}</b> marquée${fl>1?'s':''} 🚩.`:''}</p>
  <p class="hint">Après validation, tu ne peux plus modifier tes réponses.</p>
  <div class="nav"><button class="btn" id="no">Continuer</button><button class="btn primary" id="yes">Terminer et voir ma note</button></div></div>`;
  document.body.appendChild(ov);
  ov.querySelector('#no').onclick=()=>ov.remove();
  ov.querySelector('#yes').onclick=()=>{ov.remove();finish(false)};
}

/* ---------- bilan ---------- */
function finish(timeUp){
  if(!S||S.over)return;S.over=true;clearInterval(timer);
  const r=mem.ratio;
  const res=S.qs.map((q,i)=>{const a=S.ans[i];const st=a===null?'blank':a===q.a?'ok':'ko';const d=st==='ok'?q.pts:st==='ko'?-q.pts*r:0;return{q,a,st,d}});
  if(S.mode==='exam')res.forEach(x=>{if(x.st!=='blank')record(x.q.id,x.st==='ok')});
  const total=res.reduce((s,x)=>s+x.d,0),max=maxPts();
  const gain=res.filter(x=>x.st==='ok').reduce((s,x)=>s+x.q.pts,0),malus=res.filter(x=>x.st==='ko').reduce((s,x)=>s+x.q.pts*r,0);
  const note=Math.max(0,total)/max*20,noteSans=gain/max*20;
  const nok=res.filter(x=>x.st==='ok').length,nko=res.filter(x=>x.st==='ko').length,nbl=res.filter(x=>x.st==='blank').length;
  if(S.mode==='exam'){mem.hist.unshift({d:new Date().toLocaleDateString('fr-FR'),l:S.label,n:Math.round(note*100)/100});mem.hist=mem.hist.slice(0,20)}
  save();
  const bych={};res.forEach(x=>{const b=bych[x.q.ch]||(bych[x.q.ch]={ok:0,ko:0,bl:0,pts:0,max:0});b.max+=x.q.pts;b.pts+=x.d;if(x.st==='ok')b.ok++;else if(x.st==='ko')b.ko++;else b.bl++});
  const verdict=note>=16?'Excellent. Tu es prêt.':note>=13?'Solide. Retravaille tes erreurs.':note>=10?'Moyen. Les erreurs coûtent cher avec le malus.':'Insuffisant. Reprends les chapitres en rouge puis refais un test.';
  const errs=res.filter(x=>x.st==='ko');
  S.res=res;
  app.innerHTML=`
  <div class="bar"><button class="lnk" id="hm">← Accueil</button><span class="lab">${esc(S.label)}</span><span></span></div>
  <section class="card res">
    ${timeUp?'<div class="tu">Temps écoulé : le DS a été rendu automatiquement.</div>':''}
    <div class="eyebrow">Ta note</div>
    <div class="grade">${fmt(note)}<small> / 20</small></div>
    <p class="lead">${verdict}</p>
    <div class="kpi"><div><b class="mono g">+${fmt(gain)}</b><span>points gagnés</span></div><div><b class="mono r">−${fmt(malus)}</b><span>malus</span></div><div><b class="mono">${fmt(total)} / ${fmt(max)}</b><span>total brut</span></div></div>
    <p class="hint">${nok} juste${nok>1?'s':''} · ${nko} fausse${nko>1?'s':''} · ${nbl} passée${nbl>1?'s':''}. Sans malus tu aurais eu ${fmt(noteSans)} / 20 : le malus t'a coûté ${fmt(noteSans-note)} point${noteSans-note>=2?'s':''}.</p>
  </section>
  <section class="card"><h2>Par chapitre</h2>${Object.keys(bych).map(k=>{const b=bych[k];const p=Math.max(0,b.pts)/b.max*100;return`<div class="cb"><div class="cbt"><span>${esc(CH[k].title)}</span><span class="mono">${b.ok}✓ ${b.ko}✗ ${b.bl}–</span></div><div class="meter"><i class="${lvl(p)}" style="width:${p}%"></i></div></div>`}).join('')}</section>
  <div class="nav col">
    ${errs.length?`<button class="btn primary wide" id="again">Refaire mes ${errs.length} erreur${errs.length>1?'s':''}</button><button class="btn wide" id="copy">Copier une demande de résumé de cours</button>`:''}
    <button class="btn wide" id="new">Nouveau DS blanc</button>
  </div>
  <section class="card"><h2>Correction</h2>
  <div class="tabs"><button class="tab on" data-f="bad">À revoir (${nko+nbl})</button><button class="tab" data-f="all">Tout (${res.length})</button></div>
  <div id="rv"></div></section>`;
  const draw=f=>{const rows=res.map((x,i)=>({x,i})).filter(({x})=>f==='all'||x.st!=='ok');document.getElementById('rv').innerHTML=rows.length?rows.map(({x,i})=>`<details class="rv"${x.st!=='ok'?' open':''}><summary><span class="mk ${x.st}">${x.st==='ok'?'Juste '+sgn(x.d):x.st==='ko'?'Faux '+sgn(x.d):'Passée'}</span><span>${i+1}. ${esc(x.q.q)}</span></summary>
    <div class="body">${x.a!==null&&x.st==='ko'?`<p class="ans">Ta réponse : ${esc(x.q.opts[x.a])}</p>`:''}<p><b>Bonne réponse : ${esc(x.q.opts[x.q.a])}</b></p><p>${esc(x.q.e)}</p></div></details>`).join(''):'<p class="hint">Rien à revoir. Beau travail.</p>'};
  draw('bad');
  app.querySelectorAll('.tab').forEach(t=>t.onclick=()=>{app.querySelectorAll('.tab').forEach(u=>u.classList.remove('on'));t.classList.add('on');draw(t.dataset.f)});
  document.getElementById('hm').onclick=home;document.getElementById('new').onclick=home;
  const ag=document.getElementById('again');if(ag)ag.onclick=()=>start('practice',errs.map(x=>ById[x.q.id]),99,0,'Mes erreurs');
  const cp=document.getElementById('copy');if(cp)cp.onclick=()=>{
    const chs=[...new Set(errs.map(x=>CH[x.q.ch].title))];
    const txt="Je prépare le DS Green Belt Lean Six Sigma (ECAM). Fais-moi un résumé de cours clair, avec formules et pièges classiques, sur les points suivants où j'ai fait des erreurs :\n"+chs.map(c=>"- "+c+" : "+errs.filter(x=>CH[x.q.ch].title===c).map(x=>x.q.q).join(' / ')).join("\n");
    const ok=()=>{cp.textContent='Copié ✓'};
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(ok,()=>fallback(txt,ok));else fallback(txt,ok);
  };
  window.scrollTo(0,0);
}
function fallback(t,ok){const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');ok()}catch(e){}ta.remove()}

home();
})();
