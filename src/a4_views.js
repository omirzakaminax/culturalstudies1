/* ===================== VIEWS & ROUTER ===================== */
const NAV=[["dashboard","Dashboard","◈"],["today","Today's Session","☀"],["roadmap","Course Roadmap","▦"],["endterm","Endterm Prep","★"],["theory","Theory Lab","✎"],["memory","Memory Lab","❖"],["practice","Practice Arena","◎"],["timeline","Historical Timeline","⟿"],["people","Scholar Encyclopedia","☺"],["concepts","Concepts Dictionary","Aa"],["exam","Exam Simulator","⏱"],["progress","My Progress","↗"]];
const ring=(p,size="")=>`<div class="ring ${size}" style="--p:${pct(p)}"><span>${pct(p)}%</span></div>`;
const wchips=(sel,name="wk")=>`<div class="chips" data-chipset="${name}">${KB.weeks.map(w=>`<button class="wchip ${sel.includes(w.id)?"on":""} ${w.endterm?"et":""}" data-w="${w.id}">W${w.id}</button>`).join("")}<button class="wchip all" data-wall="1">All</button><button class="wchip et2" data-wend="1">Endterm 6–10</button></div>`;
function bindChips(root,getter,setter){$$("[data-chipset]",root).forEach(cs=>{cs.onclick=e=>{const b=e.target.closest("button");if(!b)return;let sel=getter();if(b.dataset.wall)sel=KB.weeks.map(w=>w.id);else if(b.dataset.wend)sel=[...ENDW];else{const w=+b.dataset.w;sel=sel.includes(w)?sel.filter(x=>x!==w):[...sel,w];if(!sel.length)sel=[w];}setter(sel.sort((a,b)=>a-b));App.render();};});}

const Build={
 practice(mode,weeks,n){const inW=i=>weeks.includes(i.w);let pool;
  switch(mode){
   case"mcq":pool=ITEMS.filter(i=>inW(i)&&i.t==="m");break;
   case"fill":pool=ITEMS.filter(i=>inW(i)&&i.t==="f");break;
   case"short":pool=ITEMS.filter(i=>inW(i)&&i.t==="s");break;
   case"tf":pool=ITEMS.filter(i=>inW(i)&&i.t==="tf");break;
   case"who":pool=ITEMS.filter(i=>inW(i)&&i.t==="who");break;
   case"x":pool=ITEMS.filter(i=>inW(i)&&i.t==="x");break;
   case"compare":pool=ITEMS.filter(i=>inW(i)&&i.c==="compare"&&!i.gen);break;
   case"scenario":pool=ITEMS.filter(i=>inW(i)&&i.c==="apply");break;
   case"pc":pool=ITEMS.filter(i=>i.pc||(inW(i)&&i.d>=3&&!i.gen));break;
   case"match":return Array.from({length:Math.max(1,Math.round(n/3))},()=>makeMatch(weeks)).filter(Boolean);
   case"order":return Array.from({length:Math.max(1,Math.round(n/3))},()=>makeOrder(weeks,5));
   case"mistakes":pool=Object.keys(S.redo).map(id=>ITEM[id]).filter(Boolean);break;
   case"confusion":return Build.confusion(n);
   case"mixed":default:{const base=weightedPick(ITEMS.filter(i=>inW(i)&&i.t!=="s"),Math.max(1,n-2));const extra=[makeMatch(weeks),makeOrder(weeks,4)].filter(Boolean);return interleave(base).concat(extra);}
  }
  return weightedPick(pool,n);},
 confusion(n){const out=[];Object.values(S.conf).sort((a,b)=>b.n-a.n).forEach(cf=>{cf.q.forEach(id=>ITEM[id]&&out.push(ITEM[id]));
   const pa=KB.people.find(p=>p.n===cf.a),pb=KB.people.find(p=>p.n===cf.b);
   if(pa&&pb){addItem({id:"cz-"+pa.id+"-"+pb.id,t:"m",w:pa.w,tp:personTopic(pa),c:"compare",d:3,q:`Who: “${pa.c}”?`,o:[pa.n,pb.n],a:0,e:`${pa.n}: ${pa.c}. ${pb.n}: ${pb.c}.`});out.push(ITEM["cz-"+pa.id+"-"+pb.id]);
    addItem({id:"cz-"+pb.id+"-"+pa.id,t:"m",w:pb.w,tp:personTopic(pb),c:"compare",d:3,q:`Who: “${pb.c}”?`,o:[pb.n,pa.n],a:0,e:`${pb.n}: ${pb.c}. ${pa.n}: ${pa.c}.`});out.push(ITEM["cz-"+pb.id+"-"+pa.id]);}});
  return shuffle([...new Set(out)]).slice(0,n);},
 exam(kind,cfg){ // returns exactly N items (fewer only if the pool is too small)
  const W=cfg.weeks;const inW=i=>W.includes(i.w);const N=cfg.n;const types=cfg.types||["m","tf","f","s","x","who","match","order"];
  if(kind==="hard")return shuffle(weightedPick(ITEMS.filter(i=>inW(i)&&(i.d>=3||i.pc)&&i.t!=="who"),N));
  if(kind==="memory"){const it=weightedPick(ITEMS.filter(i=>inW(i)&&(i.c==="date"||i.c==="people"||i.t==="f"||i.t==="who")),N-2);it.push(makeOrder(W,5),makeOrder(W,5));return shuffle(it);}
  const base=[];const used=new Set();const take=i=>{if(i&&!used.has(i.id)){used.add(i.id);base.push(i);}};
  if(kind==="endterm"||kind==="full"){ // guarantee topic coverage: one question per topic (every Weeks 6–10 seminar topic for the endterm)
   const tps=[];KB.weeks.filter(w=>W.includes(w.id)).forEach(w=>w.topics.forEach(t=>{if(t.id!=="w6t7")tps.push(t.id);}));
   shuffle(tps).slice(0,Math.max(0,N-2)).forEach(tp=>{let c=ITEMS.filter(i=>i.tp===tp&&!i.gen&&i.t!=="s"&&types.includes(i.t));if(!c.length)c=ITEMS.filter(i=>i.tp===tp&&types.includes(i.t));take(weightedPick(c,1)[0]);});}
  const extras=[];if(types.includes("match")){const m=makeMatch(W);if(m)extras.push(m);}if(types.includes("order"))extras.push(makeOrder(W,5));
  const room=N-base.length-extras.length;const mix={m:.5,tf:.12,f:.1,s:.1,x:.08,who:.1};const qt=types.filter(t=>mix[t]);const tot=qt.reduce((s,t)=>s+mix[t],0)||1;
  qt.forEach(t=>{const want=Math.max(0,Math.round(room*mix[t]/tot));weightedPick(ITEMS.filter(i=>inW(i)&&i.t===t&&!used.has(i.id)),want).forEach(take);});
  const need=N-extras.length-base.length;if(need>0)weightedPick(ITEMS.filter(i=>inW(i)&&!used.has(i.id)&&types.includes(i.t)),need).forEach(take);
  return shuffle(base.slice(0,N-extras.length).concat(extras));}
};

/* ---------- small renderers ---------- */
function topicHTML(t,mode,opts={}){const tm=tM(t.id);const ex=KB.questions.filter(q=>q.tp===t.id).slice(0,3);
 return`<article class="topic card" id="topic-${t.id}"><div class="th"><div><div class="eyebrow">Week ${t.w} · ${badge(t.src)}</div><h3>${esc(t.title)}</h3></div><div class="tha">${stBadge(tm.status)}${S.check[t.id]?`<span class="stb self">✓ self-check</span>`:""}</div></div>
 ${mode==="quick"?`<ul class="quick">${t.quick.map(x=>`<li>${fmt(x)}</li>`).join("")}</ul>`:`<div class="deep">${fmt(t.deep)}</div>`}
 ${t.must&&t.must.length?`<div class="box must"><b>⭐ Must memorize</b><ul>${t.must.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>`:""}
 ${t.confused&&t.confused.length?`<div class="box conf"><b>⚖️ Commonly confused</b><table class="tbl small">${t.confused.map(c=>`<tr><td><b>${esc(c[0])}</b> vs <b>${esc(c[1])}</b></td><td>${esc(c[2])}</td></tr>`).join("")}</table></div>`:""}
 ${t.traps&&t.traps.length?`<div class="box trap"><b>⚠️ Exam traps</b><ul>${t.traps.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>`:""}
 ${ex.length&&!opts.noEx?`<div class="box exq"><b>📝 Exam-style questions</b>${ex.map(q=>`<details><summary>${esc(q.q)}</summary><div>${q.t==="m"||q.t==="x"?`<b>${esc(q.o[q.a])}</b> – `:q.t==="tf"?`<b>${q.a?"True":"False"}</b> – `:q.t==="f"?`<b>${esc(q.acc[0])}</b> – `:""}${esc(q.e||q.m||"")}</div></details>`).join("")}</div>`:""}
 <div class="row"><button class="btn primary sm" data-test="${t.id}">🎯 Topic mastery test</button><button class="btn sm" data-tcards="${t.w}">🃏 Week ${t.w} flashcards</button><button class="btn ghost sm" data-check="${t.id}">${S.check[t.id]?"Undo self-check":"☐ I can explain this without notes"}</button></div></article>`;}
function bindTopicBtns(root){root.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
 if(b.dataset.test){const tp=b.dataset.test;const pool=ITEMS.filter(i=>i.tp===tp);const items=weightedPick(pool,Math.min(12,pool.length));Runner.start(items,{title:"Topic test: "+TOPICS[tp].title,mode:"practice",regen:()=>weightedPick(ITEMS.filter(i=>i.tp===tp),12)});}
 if(b.dataset.tcards){const w=+b.dataset.tcards;Review.start(c=>c.w===w,`Week ${w} flashcards`);}
 if(b.dataset.check){const id=b.dataset.check;if(S.check[id])delete S.check[id];else S.check[id]=Date.now();Store.save();App.render();}
 if(b.dataset.mode){S.settings.noteMode=b.dataset.mode;Store.save();App.render();}
});}
const modeToggle=()=>`<div class="seg"><button data-mode="quick" class="${S.settings.noteMode==="quick"?"on":""}">⚡ Quick revision</button><button data-mode="deep" class="${S.settings.noteMode==="deep"?"on":""}">📖 Detailed study</button></div>`;
const legend=()=>`<div class="legend">${Object.keys(SRC).map(k=>badge(k)+`<span>${SRC[k][2]}</span>`).join("")}<span><mark>highlight</mark> = must memorize</span></div>`;

function nextTopic(focusEnd){const ws=focusEnd?ENDW:KB.weeks.map(w=>w.id);const list=[];ws.forEach(w=>WEEK[w].topics.forEach(t=>{if(t.id!=="w6t7")list.push(t);}));
 const ns=list.find(t=>tM(t.id).status==="Not Started");if(ns)return ns;return list.sort((a,b)=>tM(a.id).m-tM(b.id).m)[0];}
function weakTopics(ws,n=5){const list=[];(ws||KB.weeks.map(w=>w.id)).forEach(w=>WEEK[w].topics.forEach(t=>{const m=tM(t.id);if(m.seen&&t.id!=="w6t7")list.push({t,m});}));return list.sort((a,b)=>a.m.m-b.m.m).slice(0,n);}
function dueCount(f=()=>true){return CARDS.filter(c=>f(c)&&SRS.due(c.id)).length;}

/* ---------- PAGES ---------- */
const Pages={};
Pages.dashboard=()=>{const lv=level(),st=streak(),em=endM();const dly=Daily.prog();const days=S.settings.endDate?Math.ceil((new Date(S.settings.endDate)-new Date(today()))/DAY):null;
 const plan=Today.plan();const doneN=plan.filter(b=>b.done).length;const wk=weakTopics(null,4);
 return`<section class="hero card"><div><div class="eyebrow">Cultural Studies · Astana IT University</div><h1>Welcome back 👋</h1><p class="lead">Learn it, recall it, distinguish it, apply it. Your mastery grows only from successful recall – reading alone does not count.</p>
 <div class="row"><a class="btn primary" href="#today">☀ Start today's session (${doneN}/5 done)</a><a class="btn" href="#memory">🃏 Review ${dueCount()} due cards</a></div></div>
 <div class="hstats"><div><b>${lv.L}</b><span>Level · ${lv.title}</span><div class="mini"><div style="width:${pct(lv.prog)}%"></div></div></div><div><b>${st}🔥</b><span>Day streak</span></div><div><b>${S.xp}</b><span>XP</span></div><div><b>${S.answered}</b><span>Answers</span></div></div></section>
 <a class="card endbanner" href="#endterm"><div>${ring(em.m,"big")}</div><div><div class="eyebrow">★ Endterm Exam Preparation · Weeks 6–10</div><h2>Endterm readiness: ${stBadge(em.status)}</h2><p>${days!=null?(days>=0?`<b>${days} day(s)</b> until your endterm.`:"Endterm date passed – keep revising for the final.")+" ":"Set your endterm date in the Endterm page. "}${dueCount(c=>ENDW.includes(c.w))} endterm cards due · ${Object.keys(S.redo).filter(id=>ITEM[id]&&ENDW.includes(ITEM[id].w)).length} mistakes to fix.</p><span class="btn primary">Open Endterm dashboard →</span></div></a>
 <div class="grid3">
  <div class="card"><h3>🎯 Daily challenge</h3><p>${esc(dly.c.txt)}</p><div class="bar"><div class="${dly.done?"hi":"mid"}" style="width:${pct(dly.v/dly.c.n)}%"></div></div><p class="small muted">${dly.v}/${dly.c.n} ${dly.done?"· completed ✓ +50 XP":""}</p></div>
  <div class="card"><h3>📌 Continue learning</h3>${(()=>{const t=nextTopic(true);return t?`<p><b>${esc(t.title)}</b><br><span class="muted small">Week ${t.w} · ${tM(t.id).status}</span></p><a class="btn sm" href="#week-${t.w}" data-scroll="topic-${t.id}">Open notes</a>`:"";})()}</div>
  <div class="card"><h3>⚠️ Weakest topics</h3>${wk.length?wk.map(o=>`<div class="mrow"><span>${esc(o.t.title)}</span><b>${pct(o.m.m)}%</b></div>`).join(""):"<p class='muted small'>Answer some questions first – weaknesses appear here.</p>"}</div>
 </div>
 <div class="card"><h3>Weekly milestones</h3><div class="weekgrid">${KB.weeks.map(w=>{const m=wM(w.id);return`<a class="wtile ${w.endterm?"et":""}" href="#week-${w.id}"><div class="wn">W${w.id}</div>${ring(m.m,"sm")}<div class="wt">${esc(w.short)}</div>${stBadge(m.status)}</a>`;}).join("")}</div></div>
 <div class="grid3">${[["practice","◎ Practice Arena","11 question formats"],["exam","⏱ Exam Simulator","Timed mock exams"],["theory","✎ Theory Lab","Quick & detailed notes"]].map(x=>`<a class="card link" href="#${x[0]}"><h3>${x[1]}</h3><p class="muted">${x[2]}</p></a>`).join("")}</div>`;};

const Today={
 plan(){const f=(S.settings.sessMin||60)/60;const d=S.sess[today()]||{};const t=nextTopic(S.settings.focus!=="all");const due=dueCount();
  return[
   {k:"srs",t:"Spaced repetition",m:Math.round(10*f),d:`${due} card(s) due now – forgotten cards come back sooner.`,done:d.srs},
   {k:"new",t:"New material",m:Math.round(15*f),d:t?`Study: <b>${esc(t.title)}</b> (Week ${t.w}). Read the notes, then take its mini test.`:"All topics started – pick your weakest topic.",done:d.new,topic:t},
   {k:"recall",t:"Active recall",m:Math.round(10*f),d:t?`Flashcards for Week ${t.w} (new + due).`:"Flashcards",done:d.recall,topic:t},
   {k:"practice",t:"Practice questions",m:Math.round(15*f),d:`${Object.keys(S.redo).length} past mistakes + weakest topics.`,done:d.practice},
   {k:"mixed",t:"Mixed revision quiz",m:Math.round(10*f),d:"Interleaved questions from different weeks (no topic hints).",done:d.mixed}];},
 mark(k){const d=S.sess[today()]||(S.sess[today()]={});d[k]=1;Store.save();},
 run(k){const p=this.plan().find(b=>b.k===k);const f=(S.settings.sessMin||60)/60;const ws=S.settings.focus==="all"?KB.weeks.map(w=>w.id):ENDW;
  if(k==="srs"){this.mark(k);Review.start(c=>true,"Spaced repetition");}
  if(k==="new"&&p.topic){this.mark(k);App.go("week-"+p.topic.w);setTimeout(()=>{const el=$("#topic-"+p.topic.id);el&&el.scrollIntoView({behavior:"smooth"});},150);}
  if(k==="recall"&&p.topic){this.mark(k);Review.start(c=>c.w===p.topic.w,`Active recall – Week ${p.topic.w}`);}
  if(k==="practice"){const n=Math.max(6,Math.round(12*f));const redo=Object.keys(S.redo).map(id=>ITEM[id]).filter(Boolean);const weak=weakTopics(ws,3).flatMap(o=>ITEMS.filter(i=>i.tp===o.t.id));let pool=[...new Set(redo.concat(weak))];if(pool.length<n)pool=pool.concat(ITEMS.filter(i=>ws.includes(i.w)));Runner.start(weightedPick([...new Set(pool)],n),{title:"Practice – mistakes & weak topics",mode:"practice",onFinish:()=>this.mark("practice")});}
  if(k==="mixed"){const n=Math.max(8,Math.round(10*f));Runner.start(Build.practice("mixed",KB.weeks.map(w=>w.id),n),{title:"Mixed revision quiz",mode:"practice",interleaved:true,onFinish:()=>this.mark("mixed")});}}
};
Pages.today=()=>{const plan=Today.plan();const tot=plan.reduce((s,b)=>s+b.m,0);
 return`<div class="pagehead"><div><div class="eyebrow">Today's Study Session · ${today()}</div><h1>Your plan for today</h1><p class="lead">Built from your due cards, unstudied topics, mistakes and weak areas. ${S.settings.focus==="all"?"Covering all 10 weeks.":"Focused on the Endterm (Weeks 6–10), with mixed revision of all weeks."}</p></div></div>
 <div class="card row wrap"><label>Session length: <b id="smin">${S.settings.sessMin} min</b></label><input type="range" min="20" max="120" step="10" value="${S.settings.sessMin}" id="sessr"><div class="seg"><button data-focus="endterm" class="${S.settings.focus!=="all"?"on":""}">★ Endterm focus</button><button data-focus="all" class="${S.settings.focus==="all"?"on":""}">All 10 weeks</button></div></div>
 <ol class="plan">${plan.map((b,i)=>`<li class="card pblock ${b.done?"done":""}"><div class="pn">${b.done?"✓":i+1}</div><div class="pb"><h3>${b.t} <span class="chip">${b.m} min</span></h3><p>${b.d}</p></div><button class="btn ${b.done?"ghost":"primary"}" data-run="${b.k}">${b.done?"Do again":"Start"}</button></li>`).join("")}</ol>
 <p class="muted small">Total ≈ ${tot} minutes. Suggested structure: 10 min spaced repetition · 15 min new material · 10 min active recall · 15 min practice · 10 min mixed quiz (scaled to your chosen length).</p>`;};
Pages.today.bind=root=>{const r=$("#sessr",root);r.oninput=()=>{$("#smin").textContent=r.value+" min";};r.onchange=()=>{S.settings.sessMin=+r.value;Store.save();App.render();};
 root.onclick=e=>{const b=e.target.closest("button");if(!b)return;if(b.dataset.run)Today.run(b.dataset.run);if(b.dataset.focus){S.settings.focus=b.dataset.focus;Store.save();App.render();}};};

Pages.roadmap=()=>`<div class="pagehead"><div><div class="eyebrow">Course Roadmap</div><h1>Weeks 1–10</h1><p class="lead">Each week has its own learning page with quick revision notes, detailed study notes, key terms, people, dates, commonly confused concepts, exam-style questions and a mastery test.</p></div></div>${legend()}
 <div class="roadgrid">${KB.weeks.map(w=>{const m=wM(w.id);return`<a class="card wcard ${w.endterm?"et":""}" href="#week-${w.id}"><div class="wch"><span class="wbig">${w.id}</span>${ring(m.m,"sm")}</div><h3>${esc(w.title)}</h3><p class="muted small">${w.topics.length} topics · ${w.files.length?esc(w.files.join(" · ")):""}</p><div class="row">${stBadge(m.status)}${w.endterm?`<span class="stb et">Endterm</span>`:""}${w.noLecture?`<span class="stb warn">No lecture file</span>`:""}</div></a>`;}).join("")}</div>`;

function weekPage(id){const w=WEEK[id];if(!w)return"<p>Unknown week</p>";const m=wM(id);const mode=S.settings.noteMode;
 const people=KB.people.filter(p=>p.w===id),dates=KB.timeline.filter(t=>t.w===id),terms=KB.concepts.filter(c=>c.w===id),mn=KB.mnemonics.filter(x=>x.w===id);
 return`<div class="pagehead"><div><div class="eyebrow">${w.endterm?"★ Endterm week · ":""}Week ${id}</div><h1>${esc(w.title)}</h1><p class="small muted">Sources analysed: ${esc(w.files.join(" · "))}</p></div><div>${ring(m.m,"big")}<div class="center">${stBadge(m.status)}</div></div></div>
 ${w.noLecture?`<div class="note">ℹ️ No Week 10 lecture presentation was uploaded. All Week 10 content was prepared from the official seminar topics and external academic sources (marked <span class="src src-x">External</span>). Upload the lecture later to align details with your professor's slides.</div>`:""}
 <div class="grid2"><div class="card"><h3>Learning goals</h3><ul>${w.goals.map(g=>`<li>${esc(g)}</li>`).join("")}</ul></div><div class="card"><h3>${w.seminarQs.length?"Official seminar questions":"Seminar"}</h3>${w.seminarQs.length?`<ul>${w.seminarQs.map(g=>`<li>${esc(g)}</li>`).join("")}</ul>`:"<p class='muted'>No separate seminar file for this week.</p>"}</div></div>
 <div class="row wrap sticky-tools">${modeToggle()}<button class="btn" data-wtest="${id}">🎯 Week mastery test</button><button class="btn" data-wcards="${id}">🃏 Flashcards (${CARDS.filter(c=>c.w===id).length})</button><button class="btn ghost" data-wprac="${id}">◎ Practice this week</button></div>
 <nav class="toc">${w.topics.map(t=>`<a href="#week-${id}" data-scroll="topic-${t.id}">${esc(t.title)}</a>`).join("")}</nav>
 ${w.topics.map(t=>topicHTML(t,mode)).join("")}
 <div class="grid2"><div class="card"><h3>Key terms (${terms.length})</h3><div class="terms">${terms.map(c=>`<details><summary>${esc(c.t)}</summary><p>${esc(c.d)}</p><p class="muted small">${esc(c.s)}${c.ex?" · e.g. "+esc(c.ex):""}</p></details>`).join("")||"<p class='muted'>—</p>"}</div></div>
 <div class="card"><h3>People (${people.length})</h3>${people.map(p=>`<details><summary><b>${esc(p.n)}</b> <span class="muted small">${esc(p.d)}</span></summary><p>${esc(p.c)}</p>${p.wk.length?`<p class="small">Works: ${esc(p.wk.join("; "))}</p>`:""}${p.cf?`<p class="small muted">Don't confuse with: ${esc(p.cf)}</p>`:""}</details>`).join("")||"<p class='muted'>—</p>"}</div></div>
 <div class="grid2"><div class="card"><h3>Dates & events</h3><table class="tbl small">${dates.map(t=>`<tr><td><b>${esc(t.y)}</b></td><td>${esc(t.e)}</td></tr>`).join("")||"<tr><td>—</td></tr>"}</table></div>
 <div class="card"><h3>Memory aids</h3>${mn.map(x=>`<div class="mn"><span class="chip">${esc(x.kind)}</span> <b>${esc(x.title)}</b><p>${esc(x.text)}</p></div>`).join("")||"<p class='muted'>—</p>"}</div></div>`;}
function bindWeek(root){bindTopicBtns(root);root.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
 if(b.dataset.wtest){const w=+b.dataset.wtest;App.examStart("weekly",{weeks:[w],n:20,min:25,title:`Week ${w} mastery test`});}
 if(b.dataset.wcards){const w=+b.dataset.wcards;Review.start(c=>c.w===w,`Week ${w} flashcards`);}
 if(b.dataset.wprac){const w=+b.dataset.wprac;Runner.start(Build.practice("mixed",[w],15),{title:`Practice – Week ${w}`,mode:"practice",regen:()=>Build.practice("mixed",[w],15)});}});}

/* ---------- ENDTERM ---------- */
Pages.endterm=()=>{const em=endM();const tab=App.etab||"overview";const days=S.settings.endDate?Math.ceil((new Date(S.settings.endDate)-new Date(today()))/DAY):null;
 const tabs=[["overview","Dashboard"],["roadmap","Roadmap & checklist"],["notes","Study notes"],["memory","Flashcards & memory"],["practice","Practice Arena"],["mock","Mock exams"],["progress","Progress & weaknesses"]];
 let h=`<section class="card endhero"><div><div class="eyebrow">★ ENDTERM EXAM PREPARATION</div><h1>Weeks 6–10</h1><p class="lead">Everything you need for the Endterm in one place – separate from your general course progress. All official seminar questions are included.</p>
 <div class="row wrap"><label class="small">Endterm date: <input type="date" id="enddate" value="${esc(S.settings.endDate)}"></label>${days!=null?`<span class="chip big">${days>=0?days+" day(s) left":"date passed"}</span>`:""}</div></div><div class="center">${ring(em.m,"xl")}<div>${stBadge(em.status)}</div><div class="small muted">Endterm readiness</div></div></section>
 <div class="tabs">${tabs.map(t=>`<button class="${tab===t[0]?"on":""}" data-etab="${t[0]}">${t[1]}</button>`).join("")}</div>`;
 const weeks=KB.weeks.filter(w=>w.endterm);
 if(tab==="overview"){const cats=Object.keys(CATS).map(c=>[c,catM(c,ENDW)]);const wk=weakTopics(ENDW,5);
  h+=`<div class="grid3"><div class="card stat"><b>${dueCount(c=>ENDW.includes(c.w))}</b><span>Endterm cards due</span><button class="btn sm primary" data-ego="cards">Review now</button></div><div class="card stat"><b>${Object.keys(S.redo).filter(id=>ITEM[id]&&ENDW.includes(ITEM[id].w)).length}</b><span>Mistakes to fix</span><button class="btn sm" data-ego="mistakes">Fix mistakes</button></div><div class="card stat"><b>${S.exams.filter(e=>e.mode==="endterm").length}</b><span>Endterm mocks taken</span><button class="btn sm" data-ego="mock">Take a mock</button></div></div>
  <div class="card"><h3>Weeks 6–10 at a glance</h3>${weeks.map(w=>{const m=wM(w.id);return`<div class="mrow"><a href="#week-${w.id}">W${w.id} · ${esc(w.short)}</a><div class="bar"><div class="${m.m<.35?"low":m.m<.6?"mid":"hi"}" style="width:${pct(m.m)}%"></div></div><b>${pct(m.m)}%</b>${stBadge(m.status)}</div>`;}).join("")}</div>
  <div class="grid2"><div class="card"><h3>Mastery by skill (W6–10)</h3>${cats.map(([c,m])=>`<div class="mrow"><span>${CATS[c]}</span><div class="bar"><div class="${m.m<.35?"low":m.m<.6?"mid":"hi"}" style="width:${pct(m.m)}%"></div></div><b>${pct(m.m)}%</b></div>`).join("")}</div><div class="card"><h3>Weakest endterm topics</h3>${wk.length?wk.map(o=>`<div class="mrow"><span>${esc(o.t.title)}</span><b>${pct(o.m.m)}%</b><button class="btn sm" data-test="${o.t.id}">Test</button></div>`).join(""):"<p class='muted'>No data yet – start with the roadmap.</p>"}</div></div>`;}
 if(tab==="roadmap"){h+=`<div class="card"><h3>Endterm topic checklist</h3><p class="muted small">Status comes from your recall performance. The ☐ self-check is your own confidence mark and does NOT count towards mastery.</p>${weeks.map(w=>`<h4>Week ${w.id} – ${esc(w.title)}</h4><table class="tbl check">${w.topics.filter(t=>t.id!=="w6t7").map(t=>{const m=tM(t.id);return`<tr><td><a href="#week-${w.id}" data-scroll="topic-${t.id}">${esc(t.title)}</a> ${badge(t.src)}</td><td>${stBadge(m.status)}</td><td>${pct(m.m)}%</td><td><button class="btn sm ghost" data-check="${t.id}">${S.check[t.id]?"☑ self-check":"☐ self-check"}</button></td><td><button class="btn sm" data-test="${t.id}">Test</button></td></tr>`;}).join("")}</table><p class="small muted">Official seminar questions: ${esc(w.seminarQs.join(" · "))}</p>`).join("")}</div>`;}
 if(tab==="notes"){h+=`<div class="row">${modeToggle()}</div>${legend()}`+weeks.map(w=>`<h2 class="wsep">Week ${w.id} · ${esc(w.title)}</h2>`+w.topics.map(t=>topicHTML(t,S.settings.noteMode)).join("")).join("");}
 if(tab==="memory"){h+=`<div class="grid3">${weeks.map(w=>`<div class="card"><h3>W${w.id} · ${esc(w.short)}</h3><p class="muted small">${CARDS.filter(c=>c.w===w.id).length} cards · ${dueCount(c=>c.w===w.id)} due</p><button class="btn sm primary" data-ecards="${w.id}">Review</button></div>`).join("")}<div class="card"><h3>All endterm cards</h3><p class="muted small">${CARDS.filter(c=>ENDW.includes(c.w)).length} cards</p><button class="btn sm primary" data-ego="cards">Review all</button></div></div>
  <div class="card"><h3>Memorization system – mnemonics for Weeks 6–10</h3>${KB.mnemonics.filter(x=>ENDW.includes(x.w)).map(x=>`<div class="mn"><span class="chip">W${x.w} · ${esc(x.kind)}</span> <b>${esc(x.title)}</b><p>${esc(x.text)}</p></div>`).join("")}</div>
  <div class="card"><h3>Who's who – distinguishing names</h3>${topicHTML(TOPICS.w6t7,"deep",{noEx:true})}</div>`;}
 if(tab==="practice"){h+=practiceGrid(ENDW,true);}
 if(tab==="mock"){h+=`<div class="card"><h3>Endterm mock exam</h3><p>Timed, randomized, mixed formats, no hints. Every Weeks 6–10 seminar topic is guaranteed at least one question. ⚠️ Your real exam format was not provided (the syllabus says paper-based MCQ quizzes and a final exam), so this simulator mixes formats to train deeper recall.</p>
  <div class="row wrap">${[[30,40],[40,50],[60,75]].map(([n,m])=>`<button class="btn ${n===40?"primary":""}" data-mock="${n}" data-min="${m}">${n} questions · ${m} min</button>`).join("")}</div></div>
  <div class="card"><h3>Previous endterm mocks</h3>${examHistory("endterm")}</div>`;}
 if(tab==="progress"){h+=progressBlock(ENDW,true);}
 return h;};
Pages.endterm.bind=root=>{bindTopicBtns(root);const d=$("#enddate",root);if(d)d.onchange=()=>{S.settings.endDate=d.value;Store.save();App.render();};
 root.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;if(b.dataset.etab){App.etab=b.dataset.etab;App.render();}
  if(b.dataset.ego==="cards")Review.start(c=>ENDW.includes(c.w),"Endterm flashcards");
  if(b.dataset.ego==="mistakes"){const it=Object.keys(S.redo).map(id=>ITEM[id]).filter(i=>i&&ENDW.includes(i.w));Runner.start(shuffle(it).slice(0,20),{title:"Endterm – fix mistakes",mode:"practice"});}
  if(b.dataset.ego==="mock"){App.etab="mock";App.render();}
  if(b.dataset.ecards){const w=+b.dataset.ecards;Review.start(c=>c.w===w,`Week ${w} flashcards`);}
  if(b.dataset.mock)App.examStart("endterm",{weeks:ENDW,n:+b.dataset.mock,min:+b.dataset.min,title:"Endterm mock exam"});});
 bindPractice(root,()=>ENDW);};

/* ---------- THEORY LAB ---------- */
Pages.theory=()=>{const sel=App.tw||KB.weeks.map(w=>w.id);const q=App.tq||"";const qn=norm(q);
 const topics=[];sel.forEach(w=>WEEK[w].topics.forEach(t=>{if(!qn||norm(t.title+" "+strip(t.deep)+" "+t.quick.join(" ")).includes(qn))topics.push(t);}));
 return`<div class="pagehead"><div><div class="eyebrow">Theory Lab</div><h1>Complete study materials</h1><p class="lead">Two versions for every topic: ⚡ quick revision (facts, dates, names, distinctions) and 📖 detailed study (explanations, context, examples, connections).</p></div></div>
 <div class="card tools">${modeToggle()}${wchips(sel,"tw")}<input class="inp" id="tq" placeholder="Search inside notes (e.g. 'Barthes', '1934', 'glocalization')…" value="${esc(q)}"></div>${legend()}
 <p class="muted small">${topics.length} topic(s)</p>${topics.map(t=>topicHTML(t,S.settings.noteMode)).join("")}`;};
Pages.theory.bind=root=>{bindTopicBtns(root);bindChips(root,()=>App.tw||KB.weeks.map(w=>w.id),v=>App.tw=v);const i=$("#tq",root);let to;i.oninput=()=>{clearTimeout(to);to=setTimeout(()=>{App.tq=i.value;App.render();const j=$("#tq");j.focus();j.setSelectionRange(j.value.length,j.value.length);},350);};};

/* ---------- MEMORY LAB ---------- */
Pages.memory=()=>{const tab=App.mtab||"cards";const tabs=[["cards","Flashcards (SRS)"],["mnemonics","Mnemonics & associations"],["timeline","Timeline memory"],["scholars","Scholar memory"],["feynman","Feynman technique"],["interleave","Interleaved revision"]];
 let h=`<div class="pagehead"><div><div class="eyebrow">Memory Lab</div><h1>Memorize it – for real</h1><p class="lead">Active recall + spaced repetition. Rate each card: <b>Again</b> (forgot) · <b>Hard</b> · <b>Good</b> · <b>Easy</b>. Forgotten cards return sooner; easy ones later.</p></div></div><div class="tabs">${tabs.map(t=>`<button class="${tab===t[0]?"on":""}" data-mtab="${t[0]}">${t[1]}</button>`).join("")}</div>`;
 if(tab==="cards"){const sel=App.mw||KB.weeks.map(w=>w.id);const cats=App.mc||Object.keys(CATS);const f=c=>sel.includes(c.w)&&cats.includes(c.cat);const tot=CARDS.filter(f).length,due=dueCount(f),nw=CARDS.filter(c=>f(c)&&SRS.isNew(c.id)).length,mat=CARDS.filter(c=>f(c)&&S.srs[c.id]&&S.srs[c.id].iv>=21).length;
  h+=`<div class="card tools">${wchips(sel,"mw")}<div class="chips">${Object.keys(CATS).map(c=>`<button class="wchip ${cats.includes(c)?"on":""}" data-mc="${c}">${CATS[c]}</button>`).join("")}</div></div>
  <div class="grid3"><div class="card stat"><b>${due}</b><span>due now</span></div><div class="card stat"><b>${nw}</b><span>new (≤${SRS.newLeft()} today)</span></div><div class="card stat"><b>${mat}/${tot}</b><span>mature (≥21 days)</span></div></div>
  <div class="row"><button class="btn primary big" data-startcards="1">Start review</button><label class="small">New cards per day <input type="number" id="npd" min="0" max="200" value="${S.settings.newPerDay}" style="width:70px"></label></div>
  <div class="card"><h3>Card types (both directions)</h3><p class="small muted">Term → Definition · Definition → Term · Person → Contribution · Contribution → Person · Event → Date · Date → Event · Film → Director · Writer → Work · Museum → Purpose · Concept → Example. Answers are hidden until you try to recall them.</p></div>`;}
 if(tab==="mnemonics"){h+=KB.weeks.map(w=>{const ms=KB.mnemonics.filter(x=>x.w===w.id);return ms.length?`<div class="card"><h3>Week ${w.id} · ${esc(w.short)}</h3>${ms.map(x=>`<div class="mn"><span class="chip">${esc(x.kind)}</span> <b>${esc(x.title)}</b><p>${esc(x.text)}</p></div>`).join("")}</div>`:"";}).join("")+`<p class="muted small">Associations are memory hooks only – always check them against the notes; they never replace the academic meaning.</p>`;}
 if(tab==="timeline"){h+=`<div class="grid3"><div class="card"><h3>⟿ Arrange events</h3><p class="muted small">Put 5 random events in chronological order.</p><button class="btn primary" data-mem="order">Start</button></div><div class="card"><h3>📅 Date → event / event → date</h3><p class="muted small">Random date drill with multiple choice and typing.</p><button class="btn primary" data-mem="dates">Start</button></div><div class="card"><h3>🙈 Hidden timeline</h3><p class="muted small">Browse the timeline with dates or events hidden; click to reveal.</p><a class="btn" href="#timeline">Open timeline</a></div></div>`;}
 if(tab==="scholars"){h+=`<div class="grid3"><div class="card"><h3>Contribution → person</h3><button class="btn primary" data-mem="who">Start</button></div><div class="card"><h3>Person → work</h3><button class="btn primary" data-mem="works">Start</button></div><div class="card"><h3>Who am I? (clues)</h3><button class="btn primary" data-mem="whoami">Start</button></div></div><div class="card"><h3>Confusion drill</h3><p class="muted small">Built from the pairs you personally confused (${Object.keys(S.conf).length} recorded).</p><button class="btn" data-mem="conf" ${Object.keys(S.conf).length?"":"disabled"}>Start confusion drill</button></div>`;}
 if(tab==="feynman"){const fi=App.fi??0;const fp=KB.feynman[fi];const res=App.fres;
  h+=`<div class="card"><h3>Explain it in your own words</h3><p class="muted small">Pick a concept, explain it as if teaching a younger student. The checker looks for the key ideas; ${AI.ready?"the AI tutor can give detailed feedback.":"(AI feedback is available when the page runs inside Claude with the AI capability; otherwise keyword checking is used.)"}</p>
  <select id="fsel" class="inp">${KB.feynman.map((x,i)=>`<option value="${i}" ${i===fi?"selected":""}>W${x.w} · ${esc(x.concept)}</option>`).join("")}</select>
  <textarea id="ftext" class="inp" rows="7" placeholder="Explain: ${esc(fp.concept)}…">${esc(App.ftext||"")}</textarea>
  <div class="row"><button class="btn primary" data-fey="check">Check my explanation</button>${AI.ready?`<button class="btn" data-fey="ai">✨ AI tutor feedback</button>`:""}</div><div id="fres">${res||""}</div></div>`;}
 if(tab==="interleave"){h+=`<div class="card"><h3>Interleaved revision</h3><p>Questions from different weeks in alternating order (e.g. cinema → CQ → UNESCO → Digital Kazakhstan) so you learn to retrieve without topic context.</p><div class="row wrap">${[10,20,30].map(n=>`<button class="btn ${n===20?"primary":""}" data-inter="${n}">${n} questions</button>`).join("")}<button class="btn ghost" data-inter-end="20">Endterm weeks only (20)</button></div></div>`;}
 return h;};
Pages.memory.bind=root=>{bindChips(root,()=>App.mw||KB.weeks.map(w=>w.id),v=>App.mw=v);
 const npd=$("#npd",root);if(npd)npd.onchange=()=>{S.settings.newPerDay=clamp(+npd.value||0,0,200);Store.save();App.render();};
 const fs=$("#fsel",root);if(fs)fs.onchange=()=>{App.fi=+fs.value;App.fres="";App.ftext="";App.render();};
 const ft=$("#ftext",root);if(ft)ft.oninput=()=>App.ftext=ft.value;
 root.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
  if(b.dataset.mtab){App.mtab=b.dataset.mtab;App.render();}
  if(b.dataset.mc){let c=App.mc||Object.keys(CATS);c=c.includes(b.dataset.mc)?c.filter(x=>x!==b.dataset.mc):[...c,b.dataset.mc];if(!c.length)c=[b.dataset.mc];App.mc=c;App.render();}
  if(b.dataset.startcards){const sel=App.mw||KB.weeks.map(w=>w.id);const cats=App.mc||Object.keys(CATS);Review.start(c=>sel.includes(c.w)&&cats.includes(c.cat),"Flashcards");}
  const all=KB.weeks.map(w=>w.id);
  if(b.dataset.mem==="order")Runner.start(Array.from({length:4},()=>makeOrder(all,5)),{title:"Timeline – arrange events",mode:"practice",regen:()=>Array.from({length:4},()=>makeOrder(all,5))});
  if(b.dataset.mem==="dates")Runner.start(weightedPick(ITEMS.filter(i=>i.c==="date"&&i.gen),15),{title:"Date drill",mode:"practice",regen:()=>weightedPick(ITEMS.filter(i=>i.c==="date"&&i.gen),15)});
  if(b.dataset.mem==="who")Runner.start(weightedPick(ITEMS.filter(i=>i.id.startsWith("gp-")),15),{title:"Scholar challenge: contribution → person",mode:"practice",regen:()=>weightedPick(ITEMS.filter(i=>i.id.startsWith("gp-")),15)});
  if(b.dataset.mem==="works")Runner.start(weightedPick(ITEMS.filter(i=>i.id.startsWith("gw-")),15),{title:"Scholar challenge: person → work",mode:"practice"});
  if(b.dataset.mem==="whoami")Runner.start(weightedPick(ITEMS.filter(i=>i.t==="who"),10),{title:"Who am I?",mode:"practice"});
  if(b.dataset.mem==="conf")Runner.start(Build.confusion(16),{title:"Confusion drill",mode:"practice"});
  if(b.dataset.inter)Runner.start(Build.practice("mixed",all,+b.dataset.inter),{title:"Interleaved revision",mode:"practice",interleaved:true});
  if(b.dataset.interEnd)Runner.start(Build.practice("mixed",ENDW,20),{title:"Interleaved – Endterm",mode:"practice",interleaved:true});
  if(b.dataset.fey){const fp=KB.feynman[App.fi??0];const txt=App.ftext||"";if(txt.trim().split(/\s+/).length<15){App.toast("Write at least 15 words first.");return;}
   const k=kwCheck(txt,fp.keys);let html=`<div class="fb ${k.ratio>=.8?"good":k.ratio>=.5?"part":"badfb"}"><div class="fbh">Coverage: ${pct(k.ratio)}%</div><p><b>Covered:</b> ${k.hit.map(x=>`<span class="kw ok">${esc(x)}</span>`).join(" ")||"—"}</p><p><b>Missing ideas to add:</b> ${k.miss.map(x=>`<span class="kw bad">${esc(x)}</span>`).join(" ")||"none 🎉"}</p>${k.ratio<.8?"<p>Improve your explanation by adding the missing ideas, then check again.</p>":"<p>Great – you can explain this concept. Try teaching it aloud without notes.</p>"}</div>`;
   if(b.dataset.fey==="check"){App.fres=html;if(k.ratio>=.6){S.feyn++;Daily.bump("feyn");logActivity(20);}App.render();}
   else{$("#fres").innerHTML=html+`<div class="muted">Asking the AI tutor…</div>`;AI.grade(`Explain: ${fp.concept}`,`Key ideas: ${fp.keys.map(g=>g[0]).join(", ")}`,txt).then(a=>{App.fres=html+Runner.aiHtml(a);$("#fres").innerHTML=App.fres;if((a.score||0)>=.6){S.feyn++;Daily.bump("feyn");logActivity(20);}}).catch(()=>{$("#fres").innerHTML=html+`<div class="muted">AI tutor unavailable – keyword check shown.</div>`;});}}
 });};

/* ---------- PRACTICE ARENA ---------- */
const PMODES=[["mcq","Multiple choice","4 options with realistic distractors"],["fill","Fill in the blanks","Type names, dates, terms"],["short","Short answer","Full answers, key-point check + model"],["match","Matching pairs","Writer↔work, film↔director…"],["order","Chronological ordering","Arrange events by date"],["tf","True or false","Tricky statements explained"],["who","Who am I?","Identify a person from clues"],["x","Identify the incorrect statement","Find the false one of four"],["compare","Compare & contrast","Distinguish similar items"],["scenario","Scenario-based","Apply concepts to situations"],["pc","Professor's Challenge","Hard, multi-topic questions"],["mistakes","My mistakes","Re-try questions you got wrong"]];
function practiceGrid(weeks,end){const sel=end?ENDW:(App.pw||KB.weeks.map(w=>w.id));const counts=m=>{try{return m==="match"||m==="order"?"∞":m==="mistakes"?Object.keys(S.redo).length:Build.practice(m,sel,999).length;}catch(e){return 0;}};
 return`${end?"":`<div class="card tools">${wchips(sel,"pw")}</div>`}<div class="row"><label>Questions per set: <select id="pn" class="inp sm">${[5,10,15,20,30].map(n=>`<option ${n===(App.pn||10)?"selected":""}>${n}</option>`).join("")}</select></label></div>
 <div class="pgrid">${PMODES.map(m=>`<button class="card pmode" data-pm="${m[0]}"><b>${m[1]}</b><span class="muted small">${m[2]}</span><span class="chip">${counts(m[0])} available</span></button>`).join("")}<button class="card pmode mixed" data-pm="mixed"><b>🔀 Mixed – all formats</b><span class="muted small">Interleaved across selected weeks</span></button></div>`;}
function bindPractice(root,getWeeks){const pn=$("#pn",root);if(pn)pn.onchange=()=>App.pn=+pn.value;
 root.addEventListener("click",e=>{const b=e.target.closest("[data-pm]");if(!b)return;const m=b.dataset.pm;const ws=getWeeks();const n=App.pn||10;const items=Build.practice(m,ws,n);const name=(PMODES.find(x=>x[0]===m)||[0,"Mixed"])[1];
  if(!items.length){App.toast(m==="mistakes"?"No mistakes recorded – great!":"No questions of this type for the selected weeks.");return;}
  Runner.start(items,{title:name,mode:"practice",interleaved:m==="mixed",regen:()=>Build.practice(m,ws,n)});});}
Pages.practice=()=>`<div class="pagehead"><div><div class="eyebrow">Practice Arena</div><h1>Answer · type · match · arrange · recall</h1><p class="lead">Immediate feedback with explanations. Questions you miss come back more often; questions you answer correctly several times appear less.</p></div></div>${practiceGrid()}`;
Pages.practice.bind=root=>{bindChips(root,()=>App.pw||KB.weeks.map(w=>w.id),v=>App.pw=v);bindPractice(root,()=>App.pw||KB.weeks.map(w=>w.id));};

/* ---------- TIMELINE ---------- */
Pages.timeline=()=>{const sel=App.lw||KB.weeks.map(w=>w.id);const per=App.lp||"";const typ=App.lt||"";const hide=App.lh||"";
 const periods=[...new Set(KB.timeline.map(t=>t.p))],types=[...new Set(KB.timeline.map(t=>t.t))].sort();
 const list=KB.timeline.filter(t=>sel.includes(t.w)&&(!per||t.p===per)&&(!typ||t.t===typ)).sort((a,b)=>a.s-b.s);
 return`<div class="pagehead"><div><div class="eyebrow">Historical Timeline</div><h1>${KB.timeline.length} dates & events</h1></div></div>
 <div class="card tools">${wchips(sel,"lw")}<div class="row wrap"><select id="lp" class="inp sm"><option value="">All periods</option>${periods.map(p=>`<option ${p===per?"selected":""}>${esc(p)}</option>`).join("")}</select><select id="lt" class="inp sm"><option value="">All event types</option>${types.map(p=>`<option ${p===typ?"selected":""}>${esc(p)}</option>`).join("")}</select>
 <div class="seg"><button data-lh="" class="${!hide?"on":""}">Show all</button><button data-lh="date" class="${hide==="date"?"on":""}">Hide dates</button><button data-lh="event" class="${hide==="event"?"on":""}">Hide events</button></div><button class="btn sm" data-lord="1">Order challenge</button></div></div>
 <ol class="tline">${list.map(t=>`<li class="${hide?"hid":""}"><span class="ty ${hide==="date"?"blur":""}">${esc(t.y)}</span><span class="te ${hide==="event"?"blur":""}">${esc(t.e)}</span><span class="tm">W${t.w} · ${esc(t.t)} ${badge(t.src)}</span></li>`).join("")}</ol>`;};
Pages.timeline.bind=root=>{bindChips(root,()=>App.lw||KB.weeks.map(w=>w.id),v=>App.lw=v);$("#lp",root).onchange=e=>{App.lp=e.target.value;App.render();};$("#lt",root).onchange=e=>{App.lt=e.target.value;App.render();};
 root.addEventListener("click",e=>{const bl=e.target.closest(".blur");if(bl){bl.classList.remove("blur");return;}const b=e.target.closest("button");if(!b)return;if(b.dataset.lh!=null){App.lh=b.dataset.lh;App.render();}if(b.dataset.lord){const ws=App.lw||KB.weeks.map(w=>w.id);Runner.start(Array.from({length:4},()=>makeOrder(ws,5)),{title:"Order challenge",mode:"practice"});}});};

/* ---------- PEOPLE ---------- */
const ROLES={scholar:"Scholars",philosopher:"Philosophers",writer:"Writers",poet:"Poets",performer:"Performers",composer:"Composers",director:"Directors",actor:"Actors",artist:"Artists",architect:"Architects",figure:"Historical figures"};
Pages.people=()=>{const sel=App.ew||KB.weeks.map(w=>w.id);const role=App.er||"";const q=norm(App.eq||"");const hide=App.eh;
 const list=KB.people.filter(p=>sel.includes(p.w)&&(!role||p.r===role)&&(!q||norm(p.n+" "+p.c+" "+p.wk.join(" ")+" "+p.k.join(" ")).includes(q)));
 return`<div class="pagehead"><div><div class="eyebrow">Scholar & Important People Encyclopedia</div><h1>${KB.people.length} people</h1></div></div>
 <div class="card tools">${wchips(sel,"ew")}<div class="row wrap"><input class="inp" id="eq" placeholder="Search names, works, concepts…" value="${esc(App.eq||"")}"><select id="er" class="inp sm"><option value="">All roles</option>${Object.entries(ROLES).map(([k,v])=>`<option value="${k}" ${k===role?"selected":""}>${v}</option>`).join("")}</select><button class="btn sm ${hide?"primary":""}" data-eh="1">${hide?"Show names":"🙈 Hide names (recall)"}</button><button class="btn sm" data-ech="1">Scholar challenge</button></div></div>
 <div class="pgrid2">${list.map(p=>`<div class="card person"><div class="pt"><span class="chip">W${p.w}</span><span class="chip">${esc(ROLES[p.r]||p.r)}</span>${badge(p.s)}</div><h3 class="${hide?"blur":""}">${esc(p.n)}</h3><div class="muted small ${hide?"blur":""}">${esc(p.d||"")}</div><p>${esc(p.c)}</p>${p.wk.length?`<p class="small"><b>Works:</b> ${esc(p.wk.join("; "))}</p>`:""}${p.k.length?`<p class="small"><b>Concepts:</b> ${esc(p.k.join(", "))}</p>`:""}${p.x?`<p class="small muted"><b>Context:</b> ${esc(p.x)}</p>`:""}${p.cf?`<p class="small warnline">Don't confuse with: ${esc(p.cf)}</p>`:""}</div>`).join("")}</div>`;};
Pages.people.bind=root=>{bindChips(root,()=>App.ew||KB.weeks.map(w=>w.id),v=>App.ew=v);const i=$("#eq",root);let to;i.oninput=()=>{clearTimeout(to);to=setTimeout(()=>{App.eq=i.value;App.render();const j=$("#eq");j.focus();j.setSelectionRange(j.value.length,j.value.length);},300);};$("#er",root).onchange=e=>{App.er=e.target.value;App.render();};
 root.addEventListener("click",e=>{const bl=e.target.closest(".blur");if(bl){bl.classList.remove("blur");return;}const b=e.target.closest("button");if(!b)return;if(b.dataset.eh){App.eh=!App.eh;App.render();}if(b.dataset.ech){const ws=App.ew||KB.weeks.map(w=>w.id);Runner.start(weightedPick(ITEMS.filter(i=>(i.id.startsWith("gp-")||i.id.startsWith("gw-")||i.t==="who")&&ws.includes(i.w)),15),{title:"Scholar challenge",mode:"practice"});}});};

/* ---------- CONCEPTS ---------- */
Pages.concepts=()=>{const sel=App.cw||KB.weeks.map(w=>w.id);const q=norm(App.cq||"");const hide=App.ch;
 const list=KB.concepts.filter(c=>sel.includes(c.w)&&(!q||norm(c.t+" "+c.d+" "+c.s).includes(q))).sort((a,b)=>a.t.localeCompare(b.t));const letters=[...new Set(list.map(c=>c.t[0].toUpperCase().replace(/[^A-Z]/,"#")))];
 return`<div class="pagehead"><div><div class="eyebrow">Concepts & Definitions Dictionary</div><h1>${KB.concepts.length} terms A–Z</h1></div></div>
 <div class="card tools">${wchips(sel,"cw")}<div class="row wrap"><input class="inp" id="cq" placeholder="Search terms and definitions…" value="${esc(App.cq||"")}"><button class="btn sm ${hide?"primary":""}" data-ch="1">${hide?"Show definitions":"🙈 Hide definitions (recall)"}</button><button class="btn sm" data-cch="1">Definition quiz</button></div><div class="letters">${letters.map(l=>`<a href="#concepts" data-scroll="L-${l}">${l}</a>`).join("")}</div></div>
 <div class="dict">${list.map((c,i)=>{const L=c.t[0].toUpperCase().replace(/[^A-Z]/,"#");const first=i===0||list[i-1].t[0].toUpperCase().replace(/[^A-Z]/,"#")!==L;return`${first?`<h2 id="L-${L}" class="letter">${L}</h2>`:""}<div class="card term"><div class="pt"><b class="tt">${esc(c.t)}</b><span class="chip">W${c.w}</span></div><p class="${hide?"blur":""}">${esc(c.d)}</p><p class="small ${hide?"blur":""}"><b>Simply:</b> ${esc(c.s)}${c.ex?` · <b>Example:</b> ${esc(c.ex)}`:""}</p><p class="small muted">Course context: ${esc(WEEK[c.w].title)}${c.rel.length?` · Related: ${esc(c.rel.join(", "))}`:""}</p></div>`;}).join("")}</div>`;};
Pages.concepts.bind=root=>{bindChips(root,()=>App.cw||KB.weeks.map(w=>w.id),v=>App.cw=v);const i=$("#cq",root);let to;i.oninput=()=>{clearTimeout(to);to=setTimeout(()=>{App.cq=i.value;App.render();const j=$("#cq");j.focus();j.setSelectionRange(j.value.length,j.value.length);},300);};
 root.addEventListener("click",e=>{const bl=e.target.closest(".blur");if(bl){bl.classList.remove("blur");return;}const b=e.target.closest("button");if(!b)return;if(b.dataset.ch){App.ch=!App.ch;App.render();}if(b.dataset.cch){const ws=App.cw||KB.weeks.map(w=>w.id);Runner.start(weightedPick(ITEMS.filter(i=>i.c==="def"&&i.gen&&ws.includes(i.w)),15),{title:"Definition quiz",mode:"practice"});}});};

/* ---------- EXAM SIMULATOR ---------- */
function examHistory(mode){const ex=S.exams.filter(e=>!mode||e.mode===mode).slice(-10).reverse();return ex.length?`<table class="tbl small"><tr><th>Date</th><th>Exam</th><th>Score</th><th>Time</th></tr>${ex.map(e=>`<tr><td>${new Date(e.ts).toLocaleDateString()}</td><td>${esc(e.title)}</td><td><b>${pct(e.score/e.total)}%</b> (${Math.round(e.score*10)/10}/${e.total})</td><td>${Math.round(e.dur/MIN)} min</td></tr>`).join("")}</table>`:"<p class='muted'>No exams yet.</p>";}
Pages.exam=()=>{const xw=App.xw||[1];const cw=App.xcw||KB.weeks.map(w=>w.id);const types=App.xt||["m","tf","f","s","x","who","match","order"];
 const card=(k,t,d,body)=>`<div class="card exam-card"><h3>${t}</h3><p class="muted small">${d}</p>${body}</div>`;
 return`<div class="pagehead"><div><div class="eyebrow">Final Exam Simulator</div><h1>Realistic timed exams</h1><p class="lead">Countdown timer · randomized questions · mixed formats · no hints or answer previews · automatic grading · detailed explanations after submission · topic-level analysis.</p></div></div>
 <div class="note">Your actual exam format and a sample exam were not provided. The syllabus states paper-based MCQ quizzes (midterm/endterm) and a final exam worth 40%. These simulations therefore mix MCQ with harder formats. If you upload a sample exam, its format can be matched.</div>
 <div class="examgrid">
 ${card("w","1 · Weekly quiz","One selected week, 20 questions, 25 min.",`<div class="chips">${KB.weeks.map(w=>`<button class="wchip ${xw.includes(w.id)?"on":""}" data-xw="${w.id}">W${w.id}</button>`).join("")}</div><button class="btn primary" data-ex="weekly">Start weekly quiz</button>`)}
 ${card("c","2 · Cumulative quiz","Multiple weeks of your choice, 30 questions, 40 min.",`${wchips(cw,"xcw")}<button class="btn primary" data-ex="cumulative">Start cumulative quiz</button>`)}
 ${card("f","3 · Full 10-week exam","All weeks, 60 questions, 75 min.",`<button class="btn primary" data-ex="full">Start full exam</button>`)}
 ${card("e","4 · Endterm exam (Weeks 6–10)","All mandatory seminar topics covered, 40 questions, 50 min.",`<button class="btn primary" data-ex="endterm">Start endterm exam</button>`)}
 ${card("h","5 · Difficult questions only","Hard and Professor's-Challenge questions, 25 q, 35 min.",`<button class="btn primary" data-ex="hard">Start</button>`)}
 ${card("m","6 · Memory challenge","Dates, names, fill-ins, who-am-I and orderings, 30 q, 30 min.",`<button class="btn primary" data-ex="memory">Start</button>`)}
 ${card("u","7 · Custom exam","Choose weeks (above, cumulative selector), formats, length and time.",`<div class="chips">${[["m","MCQ"],["tf","T/F"],["f","Fill"],["s","Short"],["x","Incorrect stmt"],["who","Who am I"],["match","Matching"],["order","Ordering"]].map(([k,l])=>`<button class="wchip ${types.includes(k)?"on":""}" data-xt="${k}">${l}</button>`).join("")}</div><div class="row"><label>Questions <input type="number" id="xn" class="inp sm" value="${App.xn||30}" min="5" max="100" style="width:70px"></label><label>Minutes <input type="number" id="xm" class="inp sm" value="${App.xm||35}" min="5" max="180" style="width:70px"></label></div><button class="btn primary" data-ex="custom">Start custom exam</button>`)}
 </div><div class="card"><h3>Exam history</h3>${examHistory()}</div>`;};
Pages.exam.bind=root=>{bindChips(root,()=>App.xcw||KB.weeks.map(w=>w.id),v=>App.xcw=v);const xn=$("#xn",root),xm=$("#xm",root);xn.onchange=()=>App.xn=+xn.value;xm.onchange=()=>App.xm=+xm.value;
 root.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;if(b.dataset.xw){App.xw=[+b.dataset.xw];App.render();}
  if(b.dataset.xt){let t=App.xt||["m","tf","f","s","x","who","match","order"];t=t.includes(b.dataset.xt)?t.filter(x=>x!==b.dataset.xt):[...t,b.dataset.xt];if(!t.length)return;App.xt=t;App.render();}
  const k=b.dataset.ex;if(!k)return;const all=KB.weeks.map(w=>w.id);
  if(k==="weekly")App.examStart("weekly",{weeks:App.xw||[1],n:20,min:25,title:`Week ${(App.xw||[1])[0]} quiz`});
  if(k==="cumulative")App.examStart("cumulative",{weeks:App.xcw||all,n:30,min:40,title:"Cumulative quiz"});
  if(k==="full")App.examStart("full",{weeks:all,n:60,min:75,title:"Full 10-week exam"});
  if(k==="endterm")App.examStart("endterm",{weeks:ENDW,n:40,min:50,title:"Endterm exam (W6–10)"});
  if(k==="hard")App.examStart("hard",{weeks:all,n:25,min:35,title:"Difficult questions only"});
  if(k==="memory")App.examStart("memory",{weeks:all,n:30,min:30,title:"Memory challenge"});
  if(k==="custom")App.examStart("custom",{weeks:App.xcw||all,n:App.xn||30,min:App.xm||35,types:App.xt,title:"Custom exam"});});};

/* ---------- PROGRESS ---------- */
function progressBlock(ws,end){const cats=Object.keys(CATS).map(c=>[c,catM(c,ws)]);const topics=[];ws.forEach(w=>WEEK[w].topics.forEach(t=>{if(t.id!=="w6t7")topics.push(t);}));
 const conf=Object.entries(S.conf).filter(([k,v])=>!end||v.q.some(id=>ITEM[id]&&ws.includes(ITEM[id].w))).sort((a,b)=>b[1].n-a[1].n).slice(0,8);
 const missed=Object.entries(S.att).filter(([id,a])=>ITEM[id]&&ws.includes(ITEM[id].w)&&a.w>=2).sort((a,b)=>b[1].w-a[1].w).slice(0,8);
 return`<div class="grid2"><div class="card"><h3>Mastery by week</h3>${ws.map(w=>{const m=wM(w);return`<div class="mrow"><a href="#week-${w}">W${w} · ${esc(WEEK[w].short)}</a><div class="bar"><div class="${m.m<.35?"low":m.m<.6?"mid":"hi"}" style="width:${pct(m.m)}%"></div></div><b>${pct(m.m)}%</b>${stBadge(m.status)}</div>`;}).join("")}</div>
 <div class="card"><h3>Mastery by skill</h3>${cats.map(([c,m])=>`<div class="mrow"><span>${CATS[c]}</span><div class="bar"><div class="${m.m<.35?"low":m.m<.6?"mid":"hi"}" style="width:${pct(m.m)}%"></div></div><b>${pct(m.m)}%</b>${stBadge(m.status)}</div>`).join("")}</div></div>
 <div class="card"><h3>Topics</h3><table class="tbl small"><tr><th>Topic</th><th>Status</th><th>Mastery</th><th>Accuracy</th><th></th></tr>${topics.map(t=>{const m=tM(t.id);return`<tr><td>W${t.w} · ${esc(t.title)}</td><td>${stBadge(m.status)}</td><td>${pct(m.m)}%</td><td>${m.acc==null?"—":pct(m.acc)+"%"}</td><td><button class="btn sm" data-test="${t.id}">Test</button></td></tr>`;}).join("")}</table></div>
 <div class="grid2"><div class="card"><h3>Weakness analysis – confused pairs</h3>${conf.length?conf.map(([k,v])=>`<div class="mrow"><span>${esc(k)}</span><b>${v.n}×</b></div>`).join("")+`<button class="btn sm primary" data-cdrill="1">Practice these pairs</button>`:"<p class='muted small'>No confusions recorded yet.</p>"}</div>
 <div class="card"><h3>Frequently missed questions</h3>${missed.length?missed.map(([id,a])=>`<div class="wrong small"><span class="chip">W${ITEM[id].w}</span> ${esc((ITEM[id].q||"Who am I?").slice(0,110))} <b class="bad">✗${a.w}</b></div>`).join("")+`<button class="btn sm primary" data-mdrill="1">Re-practice mistakes</button>`:"<p class='muted small'>Nothing yet.</p>"}</div></div>`;}
Pages.progress=()=>{const lv=level();return`<div class="pagehead"><div><div class="eyebrow">My Progress</div><h1>Level ${lv.L} · ${lv.title}</h1><p class="lead">${S.xp} XP · ${streak()}-day streak · ${S.answered} answers · ${S.reviews} card reviews. Mastery depends on successful recall and practice – reading notes does not count.</p></div><div>${ring(mastery(()=>true,()=>true).m,"big")}<div class="small muted center">Whole course</div></div></div>
 <div class="card"><h3>Achievements</h3><div class="achgrid">${Ach.list.map(a=>`<div class="ach ${S.ach[a.id]?"on":""}"><span>${a.ic}</span><b>${esc(a.t)}</b><small>${esc(a.d)}</small>${S.ach[a.id]?`<em>${new Date(S.ach[a.id]).toLocaleDateString()}</em>`:""}</div>`).join("")}</div></div>
 ${progressBlock(KB.weeks.map(w=>w.id))}
 <div class="card"><h3>Exam history</h3>${examHistory()}</div>
 <div class="card"><h3>Status legend</h3><p>${["Not Started","Learning","Needs Revision","Almost Mastered","Mastered"].map(stBadge).join(" ")}</p><p class="small muted">Mastery = average recall strength of every question and flashcard in a scope (unseen items count as 0). Recent answers weigh more. "Needs Revision" also appears when accuracy drops below 60%.</p></div>
 <div class="card"><h3>Settings & data</h3><div class="row wrap"><label>Theme <select id="theme" class="inp sm">${["auto","light","dark"].map(t=>`<option ${S.settings.theme===t?"selected":""}>${t}</option>`).join("")}</select></label><span class="small muted">Progress storage: <b id="syncst">${App.syncText()}</b></span></div>
 <div class="row wrap"><button class="btn" data-io="export">Copy progress backup</button><button class="btn" data-io="import">Restore from backup</button><button class="btn ghost danger" data-io="reset">Reset all progress</button></div><div id="iobox"></div></div>`;};
Pages.progress.bind=root=>{bindTopicBtns(root);$("#theme",root).onchange=e=>{S.settings.theme=e.target.value;Store.save();App.applyTheme();};
 root.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
  if(b.dataset.cdrill)Runner.start(Build.confusion(16),{title:"Confusion drill",mode:"practice"});
  if(b.dataset.mdrill)Runner.start(Build.practice("mistakes",[],20),{title:"My mistakes",mode:"practice"});
  if(b.dataset.io==="export"){const txt=JSON.stringify(S);const box=$("#iobox");box.innerHTML=`<textarea class="inp" rows="4" readonly>${esc(txt)}</textarea><p class="small muted">Copy this text and keep it somewhere safe.</p>`;try{navigator.clipboard.writeText(txt).then(()=>App.toast("Backup copied to clipboard"),()=>{});}catch(err){}}
  if(b.dataset.io==="import"){const box=$("#iobox");box.innerHTML=`<textarea class="inp" id="imp" rows="4" placeholder="Paste your backup here"></textarea><button class="btn primary" data-io="doimport">Restore</button>`;}
  if(b.dataset.io==="doimport"){try{const o=JSON.parse($("#imp").value);if(!o||o.v!==1)throw 0;S=Object.assign(DEF_STATE(),o);Store.save();App.toast("Progress restored");App.render();}catch(err){App.toast("That backup could not be read.");}}
  if(b.dataset.io==="reset")App.confirm("Delete ALL progress (XP, cards, answers, exams)? This cannot be undone.",()=>{const st=S.settings;S=DEF_STATE();S.settings=st;Store.save();App.render();App.toast("Progress reset");});});
 const tb=root;bindTopicBtns;};

/* ---------- SEARCH ---------- */
const SearchIdx=[];
(function(){KB.weeks.forEach(w=>w.topics.forEach(t=>SearchIdx.push({k:"Topic",t:t.title,s:`Week ${w.id}`,txt:norm(t.title+" "+t.quick.join(" ")+" "+strip(t.deep)),href:`#week-${w.id}`,scroll:"topic-"+t.id})));
 KB.people.forEach(p=>SearchIdx.push({k:"Person",t:p.n,s:`${p.d} · ${p.c}`,txt:norm(p.n+" "+p.c+" "+p.wk.join(" ")+" "+p.k.join(" ")),href:"#people",q:p.n}));
 KB.concepts.forEach(c=>SearchIdx.push({k:"Concept",t:c.t,s:c.d,txt:norm(c.t+" "+c.d+" "+c.s),href:"#concepts",cq:c.t}));
 KB.timeline.forEach(t=>SearchIdx.push({k:"Date",t:t.y,s:t.e,txt:norm(t.y+" "+t.e),href:"#timeline"}));
 KB.mnemonics.forEach(m=>SearchIdx.push({k:"Mnemonic",t:m.title,s:m.text,txt:norm(m.title+" "+m.text),href:"#memory"}));})();
function search(q){const n=norm(q);if(n.length<2)return[];const toks=n.split(" ");return SearchIdx.map(x=>{let sc=0;toks.forEach(t=>{if(x.txt.includes(t))sc++;if(norm(x.t).includes(t))sc+=2;});return{x,sc};}).filter(o=>o.sc>=toks.length).sort((a,b)=>b.sc-a.sc).slice(0,24).map(o=>o.x);}
