(function(){
const D=window.QUIZ,CH=D.chapters,Q=D.q,app=document.getElementById('app');
let state={};
function qk(t){let h=0;for(let i=0;i<t.length;i++)h=(h*31+t.charCodeAt(i))|0;return String(h)}
function rec(item,ok){try{const k='dsScores:'+D.id;const o=JSON.parse(localStorage.getItem(k)||'{}');const key=qk(item[1]);const v=o[key]||0;o[key]=ok?Math.min(2,Math.min(2,v)+1):0;localStorage.setItem(k,JSON.stringify(o))}catch(e){}}
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
function home(){
  const counts=CH.map((_,i)=>Q.filter(q=>q[0]===i).length);
  app.innerHTML=`<a class="back" href="./">← Matières</a>
  <h1>${D.title}</h1><p class="sub">${Q.length} questions</p>
  <div class="card"><h2>Chapitres</h2>${CH.map((c,i)=>`<label class="chap"><input type="checkbox" data-i="${i}" checked> ${c}<span class="n">${counts[i]}</span></label>`).join('')}</div>
  <div class="card"><h2>Nombre de questions</h2><div class="seg" id="len"><button data-n="10">10</button><button data-n="20" class="on">20</button><button data-n="0">Toutes</button></div></div>
  <button class="btn" id="go">Commencer</button>`;
  let n=20;
  app.querySelectorAll('#len button').forEach(b=>b.onclick=()=>{app.querySelectorAll('#len button').forEach(x=>x.classList.remove('on'));b.classList.add('on');n=+b.dataset.n});
  document.getElementById('go').onclick=()=>{
    const sel=[...app.querySelectorAll('.chap input')].filter(x=>x.checked).map(x=>+x.dataset.i);
    if(!sel.length)return;
    let pool=shuffle(Q.filter(q=>sel.includes(q[0])));
    if(n&&pool.length>n)pool=pool.slice(0,n);
    start(pool);
  };
}
function start(pool){state={pool,i:0,score:0,wrong:[]};show()}
function show(){
  const {pool,i}=state;
  if(i>=pool.length)return end();
  const [c,q,good,bad,exp]=pool[i];
  app.innerHTML=`<div class="top"><span>Question ${i+1}/${pool.length}</span><span>Score ${state.score}</span></div>
  <div class="bar"><i style="width:${i/pool.length*100}%"></i></div>
  <div class="card"><div class="tag">${CH[c]}</div><p class="q"></p><div id="opts"></div><div id="fb"></div></div><div id="nx"></div>`;
  app.querySelector('.q').textContent=q;
  const box=document.getElementById('opts');
  shuffle([good,...bad]).forEach(o=>{const b=document.createElement('button');b.className='opt';b.textContent=o;b.onclick=()=>answer(b,o===good,good,exp,pool[i]);box.appendChild(b)});
  window.scrollTo(0,0);
}
function answer(btn,ok,good,exp,item){
  document.querySelectorAll('.opt').forEach(b=>{b.disabled=true;if(b.textContent===good)b.classList.add('ok')});
  rec(item,ok);
  if(ok)state.score++;else{btn.classList.add('ko');state.wrong.push({item,picked:btn.textContent})}
  document.getElementById('fb').innerHTML=`<div class="exp"><b class="${ok?'g':'r'}">${ok?'Correct !':'Raté.'}</b> ${exp}</div>`;
  const last=state.i+1>=state.pool.length;
  document.getElementById('nx').innerHTML=`<button class="btn">${last?'Voir le résultat':'Suivant'}</button>`;
  document.querySelector('#nx button').onclick=()=>{state.i++;show()};
  document.getElementById('nx').scrollIntoView({behavior:'smooth',block:'end'});
}
function esc(t){return String(t).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}
function buildPrompt(){
  const {pool,score,wrong}=state;
  const byCh={};wrong.forEach(w=>{(byCh[w.item[0]]=byCh[w.item[0]]||[]).push(w)});
  let t=`Je viens de faire un quiz de révision « ${D.title} » : ${score}/${pool.length}.\nVoici les questions que j'ai ratées. Fais-moi un résumé de cours ciblé sur ces notions (en français, définitions, points clés, pièges classiques, mini-exemples), en t'appuyant sur les cours du projet.\n`;
  Object.keys(byCh).forEach(c=>{t+=`\n## ${CH[c]}\n`;byCh[c].forEach(w=>{t+=`- Q : ${w.item[1]}\n  Ma réponse : ${w.picked}\n  Bonne réponse : ${w.item[2]}\n  Rappel : ${w.item[4]}\n`})});
  return t;
}
function copy(t){
  return (navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(t):Promise.reject()).catch(()=>{
    const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand('copy')}catch(e){}ta.remove();
  });
}
function end(){
  const {pool,score,wrong}=state,pct=Math.round(score/pool.length*100);
  const byCh={};wrong.forEach(w=>{(byCh[w.item[0]]=byCh[w.item[0]]||[]).push(w)});
  const chs=Object.keys(byCh).sort((a,b)=>byCh[b].length-byCh[a].length);
  const point=wrong.length?`<div class="card"><h2>Point sur tes erreurs</h2>
    <p class="sub">${wrong.length} raté${wrong.length>1?'es':'e'} — à retravailler en priorité : <b>${chs.slice(0,3).map(c=>CH[c]+' ('+byCh[c].length+')').join(', ')}</b></p>
    ${chs.map(c=>`<div class="tag" style="margin-top:10px">${CH[c]} · ${byCh[c].length}</div>`+byCh[c].map(w=>`<div class="wrong"><b>${esc(w.item[1])}</b>Ta réponse : ${esc(w.picked)}<br>✔ ${esc(w.item[2])}<br><span style="color:var(--mute)">${esc(w.item[4])}</span></div>`).join('')).join('')}</div>
    <div class="card"><h2>Résumé de cours</h2><p class="sub">Je peux générer un résumé de cours ciblé sur ces erreurs. Copie la demande, puis colle-la dans Claude (projet Scolaire).</p>
    <button class="btn" id="cp">Copier la demande de résumé</button><a class="btn sec" href="https://claude.ai/new" target="_blank" rel="noopener">Ouvrir Claude</a></div>
    <button class="btn" id="rw" style="margin-bottom:10px">Refaire mes erreurs</button>`:`<div class="card"><p class="center">Aucune erreur, rien à résumer 👌</p></div>`;
  app.innerHTML=`<div class="card"><h2>Résultat</h2><div class="score">${score}/${pool.length}</div>
  <p class="center">${pct}% — ${pct>=80?'Solide.':pct>=60?'Pas mal, revois les erreurs.':'À retravailler, refais les erreurs.'}</p></div>${point}
  <button class="btn sec" id="hm">Recommencer</button><a class="btn sec" href="./">Retour aux matières</a>`;
  if(wrong.length){document.getElementById('rw').onclick=()=>start(shuffle(wrong.map(w=>w.item)));
    const cp=document.getElementById('cp');cp.onclick=()=>copy(buildPrompt()).then(()=>{cp.textContent='Copié ✔ — colle-le dans Claude'})}
  document.getElementById('hm').onclick=home;
}
home();
})();
