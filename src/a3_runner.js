/* ===================== RUNNER: practice sessions & exams ===================== */
const AI={fn:null,ready:false,
 async init(){try{if(!window.claude||!window.claude.use)return;const s=await window.claude.use("sample");if(s){this.fn=s;this.ready=true;App.rerenderSoft&&App.rerenderSoft();}}catch(e){}},
 async grade(question,model,answer){if(!this.fn)throw new Error("AI tutor unavailable");
  const prompt=`You are a strict but kind university Cultural Studies examiner. Grade the student's answer against the model answer. Accept correct answers in different wording. Reply ONLY with JSON: {"score": number between 0 and 1, "verdict": "correct"|"partly"|"incorrect", "missing": [short strings of missing key points], "errors": [factual errors], "feedback": "2-3 sentences in simple B1-B2 English"}.\nQUESTION: ${question}\nMODEL ANSWER: ${model}\nSTUDENT ANSWER: ${answer}`;
  const r=await this.fn(prompt,{modelTier:"quick",cache:false});const t=(r&&r.text)||"";const m=t.match(/\{[\s\S]*\}/);if(!m)throw new Error("Could not read AI response");return JSON.parse(m[0]);}
};

function kwCheck(text,groups){const a=norm(text);const hit=[],miss=[];groups.forEach(g=>{(g.some(k=>a.includes(norm(k)))?hit:miss).push(g[0]);});return{ratio:groups.length?hit.length/groups.length:0,hit,miss};}

/* Render one item's answer UI. mode: 'practice' | 'exam'. Returns nothing; uses ctx to store responses. */
const Runner={
 cur:null,
 start(items,opt={}){ // opt: {title, mode, timer(min), examMode, scopeLabel, onFinish}
  items=items.filter(Boolean);if(!items.length){App.toast("No questions available for this selection yet.");return;}
  this.cur={items:items.map(it=>this.prep(it)),i:0,opt,resp:{},checked:{},start:Date.now(),flags:{}};
  if(opt.mode==="exam"&&opt.timer){this.cur.end=Date.now()+opt.timer*MIN;}
  App.go("run",true);},
 prep(it){const o=Object.assign({},it);if(o.o){const idx=shuffle(o.o.map((_,i)=>i));o._o=idx.map(i=>o.o[i]);o._a=idx.indexOf(o.a);}
  if(o.t==="match"){o._right=shuffle(o.pairs.map((p,i)=>i));}if(o.t==="order"){o._init=shuffle(o.seq.map((_,i)=>i));if(o._init.every((v,i)=>v===i)&&o.seq.length>1)o._init.reverse();}return o;},
 view(){const c=this.cur;if(!c)return`<div class="card"><p>No active session.</p><a class="btn" href="#practice">Go to Practice Arena</a></div>`;
  if(c.done)return this.results();
  const it=c.items[c.i];const exam=c.opt.mode==="exam";const n=c.items.length;
  let head=`<div class="run-head"><div><div class="eyebrow">${esc(c.opt.title||"Practice")}</div><div class="run-prog"><div style="width:${pct((c.i)/n)}%"></div></div></div>
   <div class="run-meta">${exam?`<span id="timer" class="timer">--:--</span>`:""}<span>${c.i+1} / ${n}</span><button class="btn ghost sm" data-act="quit">✕ ${exam?"Leave":"End"}</button></div></div>`;
  let nav="";if(exam){nav=`<div class="qnav">${c.items.map((x,i)=>`<button class="qn ${i===c.i?"on":""} ${c.resp[i]!=null?"ans":""} ${c.flags[i]?"flag":""}" data-go="${i}">${i+1}</button>`).join("")}</div>`;}
  return head+nav+`<div class="card qcard">${this.qhtml(it,c.i)}</div>`+this.footer(it);},
 typeLabel(t){return{m:"Multiple choice",tf:"True or false",f:"Fill in the blank",s:"Short answer",x:"Identify the incorrect statement",who:"Who am I?",match:"Matching pairs",order:"Chronological ordering"}[t]||"";},
 qhtml(it,i){const c=this.cur;if(it.t==="order"&&c.resp[i]==null)c.resp[i]=[...it._init];const r=c.resp[i];const chk=c.checked[i];const exam=c.opt.mode==="exam";
  const wk=it.w?`<span class="chip">Week ${it.w}</span>`:"";const tp=it.tp&&TOPICS[it.tp]?`<span class="chip">${esc(TOPICS[it.tp].title)}</span>`:"";
  let h=`<div class="qtop"><span class="qtype">${this.typeLabel(it.t)}${it.pc?" · Professor's Challenge":""}</span>${wk}${exam?"":tp}${it.d>=3?`<span class="chip hard">Hard</span>`:""}</div>`;
  if(it.t==="who"){const shown=exam?it.clues.length:(c.clueN&&c.clueN[i]||1);h+=`<h3 class="q">Who am I?</h3><ol class="clues">${it.clues.slice(0,shown).map(x=>`<li>${esc(x)}</li>`).join("")}</ol>`;
   if(!exam&&!chk&&shown<it.clues.length)h+=`<button class="btn ghost sm" data-act="clue">Show another clue</button>`;}
  else h+=`<h3 class="q">${esc(it.q)}</h3>`;
  if(it.t==="m"||it.t==="x"){h+=`<div class="opts">${it._o.map((o,k)=>{let cls="";if(chk){if(k===it._a)cls="ok";else if(k===r)cls="bad";}else if(k===r)cls="sel";return`<button class="opt ${cls}" data-opt="${k}" ${chk?"disabled":""}><span class="ol">${"ABCD"[k]||k+1}</span><span>${esc(o)}</span></button>`;}).join("")}</div>`;}
  else if(it.t==="tf"){h+=`<div class="opts tf">${[true,false].map(v=>{let cls="";if(chk){if(v===it.a)cls="ok";else if(v===r)cls="bad";}else if(v===r)cls="sel";return`<button class="opt ${cls}" data-tf="${v}" ${chk?"disabled":""}>${v?"True":"False"}</button>`;}).join("")}</div>`;}
  else if(it.t==="f"||it.t==="who"){h+=`<input class="inp big" id="ans" placeholder="Type your answer…" value="${esc(r||"")}" ${chk?"disabled":""} autocomplete="off">`;}
  else if(it.t==="s"){h+=`<textarea class="inp" id="ans" rows="6" placeholder="Write a complete answer in your own words…" ${chk?"disabled":""}>${esc(r||"")}</textarea>`;}
  else if(it.t==="match"){const sel=c.msel;const pairs=r||{};h+=`<p class="muted small">Tap an item on the left, then its partner on the right.</p><div class="match"><div>${it.pairs.map((p,k)=>{let cls=sel===k?"sel":"";if(pairs[k]!=null)cls+=" done";if(chk)cls+=(pairs[k]!=null&&it.pairs[pairs[k]][1]===p[1])?" ok":" bad";return`<button class="mi ${cls}" data-ml="${k}" ${chk?"disabled":""}>${esc(p[0])}${pairs[k]!=null?`<small>→ ${esc(it.pairs[pairs[k]][1])}</small>`:""}</button>`;}).join("")}</div><div>${it._right.map(k=>{const used=Object.values(pairs).includes(k);return`<button class="mi r ${used?"used":""}" data-mr="${k}" ${chk?"disabled":""}>${esc(it.pairs[k][1])}</button>`;}).join("")}</div></div>`;}
  else if(it.t==="order"){const ord=r||it._init;h+=`<p class="muted small">Use ▲ ▼ (or drag) to put the earliest event at the top.</p><ol class="order" id="order">${ord.map((k,pos)=>{let cls="";if(chk)cls=k===pos?"ok":"bad";return`<li class="oi ${cls}" draggable="${!chk}" data-k="${k}"><span class="oh">⋮⋮</span><span class="ot">${esc(it.seq[k].txt)}${chk?` <b class="oy">${esc(it.seq[k].y)}</b>`:""}</span>${chk?"":`<span class="oc"><button data-up="${pos}">▲</button><button data-dn="${pos}">▼</button></span>`}</li>`;}).join("")}</ol>`;}
  if(chk&&c.opt.mode!=="exam")h+=this.feedback(it,i);
  return h;},
 footer(it){const c=this.cur;const i=c.i;const exam=c.opt.mode==="exam";const chk=c.checked[i];
  if(exam){return`<div class="run-foot"><button class="btn ghost" data-act="prev" ${i===0?"disabled":""}>← Previous</button><button class="btn ghost" data-act="flag">${c.flags[i]?"★ Flagged":"☆ Flag"}</button>${i<c.items.length-1?`<button class="btn" data-act="next">Next →</button>`:`<button class="btn primary" data-act="submit">Submit exam</button>`}</div>`;}
  if(!chk)return`<div class="run-foot"><span></span><button class="btn primary" data-act="check">Check answer</button></div>`;
  return`<div class="run-foot"><span></span><button class="btn primary" data-act="next">${i<c.items.length-1?"Next question →":"See results"}</button></div>`;},
 feedback(it,i){const c=this.cur;const g=c.grade[i];let h=`<div class="fb ${g.score>=.999?"good":g.score>0?"part":"badfb"}"><div class="fbh">${g.score>=.999?"✓ Correct":g.score>0?"◐ Partly correct":"✗ Not quite"}</div>`;
  if(it.t==="f"||it.t==="who")h+=`<p>Accepted answer: <b>${esc(it.ans||it.acc[0])}</b></p>`;
  if(it.t==="tf"&&!g.score)h+=`<p>The statement is <b>${it.a?"TRUE":"FALSE"}</b>.</p>`;
  if(it.t==="s"){const k=g.kw;h+=`<p><b>Key points found:</b> ${k.hit.length?k.hit.map(x=>`<span class="kw ok">${esc(x)}</span>`).join(" "):"—"}</p><p><b>Missing / check:</b> ${k.miss.length?k.miss.map(x=>`<span class="kw bad">${esc(x)}</span>`).join(" "):"none 🎉"}</p><div class="model"><b>Model answer</b><p>${esc(it.m)}</p></div>
   <div class="selfgrade"><span>Self-assessment (compare with the model):</span><button class="btn sm ${g.self===1?"primary":""}" data-self="1">I got it right</button><button class="btn sm ${g.self===.5?"primary":""}" data-self="0.5">Partly</button><button class="btn sm ${g.self===0?"primary":""}" data-self="0">I missed it</button>${AI.ready?`<button class="btn sm ghost" data-act="ai">✨ Ask AI tutor</button>`:""}</div><div id="aibox">${g.ai?this.aiHtml(g.ai):""}</div>`;}
  if(it.e)h+=`<div class="expl">${it.t==="s"?"":"<b>Explanation:</b> "}${it.t==="order"||it.t==="match"?it.e:esc(it.e)}</div>`;
  const tip=this.confTip(it);if(tip)h+=`<div class="tip">💡 ${tip}</div>`;
  return h+`</div>`;},
 aiHtml(a){return`<div class="aires"><b>AI tutor:</b> ${esc(a.verdict||"")} (${pct(a.score||0)}%)<br>${esc(a.feedback||"")}${a.missing&&a.missing.length?`<br><b>Missing:</b> ${esc(a.missing.join("; "))}`:""}${a.errors&&a.errors.length?`<br><b>Errors:</b> ${esc(a.errors.join("; "))}`:""}</div>`;},
 confTip(it){if(!it.tp||!TOPICS[it.tp])return"";const t=TOPICS[it.tp];const txt=norm(it.q+" "+(it.o||[]).join(" "));const hit=(t.confused||[]).find(cf=>txt.includes(norm(cf[0]).split(" ")[0])||txt.includes(norm(cf[1]).split(" ")[0]));return hit?`<b>${esc(hit[0])} vs ${esc(hit[1])}:</b> ${esc(hit[2])}`:"";},
 gradeOne(it,r){ // returns {score, kw?}
  if(r==null||r==="")return{score:0};
  if(it.t==="m"||it.t==="x")return{score:r===it._a?1:0,chosen:it._o[r]};
  if(it.t==="tf")return{score:r===it.a?1:0};
  if(it.t==="f")return{score:it.acc.some(a=>fuzzyEq(r,a))?1:0};
  if(it.t==="who"){const a=norm(r);const ok=it.acc.some(x=>{const n=norm(x);return n.length>=4&&(fuzzyEq(r,x)||a.split(" ").some(tok=>tok.length>=4&&fuzzyEq(tok,n)));});return{score:ok?1:0};}
  if(it.t==="s"){const kw=kwCheck(r,it.k);const auto=kw.ratio>=.7?1:kw.ratio>=.35?.5:0;return{score:auto,kw,auto};}
  if(it.t==="match"){const p=r||{};let ok=0;it.pairs.forEach((pr,k)=>{if(p[k]!=null&&it.pairs[p[k]][1]===pr[1])ok++;});return{score:ok/it.pairs.length};}
  if(it.t==="order"){const o=r;let ok=0;o.forEach((k,pos)=>{if(k===pos)ok++;});return{score:ok/o.length};}
  return{score:0};},
 record(it,g){const correct=g.score>=.999;Att.rec(it,correct,g.chosen);
  if(it.t==="order"&&correct)S.orderPerfect++;},
 bind(root){const c=this.cur;if(!c)return;const exam=c.opt.mode==="exam";const i=c.i;const it=c.items[i];c.grade=c.grade||{};
  root.onclick=e=>{const b=e.target.closest("button");if(!b)return;
   if(b.dataset.go!=null){this.saveInput();c.i=+b.dataset.go;App.render();return;}
   if(b.dataset.opt!=null){c.resp[i]=+b.dataset.opt;App.render();return;}
   if(b.dataset.tf!=null){c.resp[i]=b.dataset.tf==="true";App.render();return;}
   if(b.dataset.ml!=null){c.msel=+b.dataset.ml;App.render();return;}
   if(b.dataset.mr!=null){if(c.msel==null)return;const p=Object.assign({},c.resp[i]||{});Object.keys(p).forEach(k=>{if(p[k]===+b.dataset.mr)delete p[k];});p[c.msel]=+b.dataset.mr;c.resp[i]=p;c.msel=null;App.render();return;}
   if(b.dataset.up!=null||b.dataset.dn!=null){const ord=[...(c.resp[i]||it._init)];const pos=+(b.dataset.up??b.dataset.dn);const np=b.dataset.up!=null?pos-1:pos+1;if(np<0||np>=ord.length)return;[ord[pos],ord[np]]=[ord[np],ord[pos]];c.resp[i]=ord;App.render();return;}
   if(b.dataset.self!=null){const g=c.grade[i];const v=+b.dataset.self;const wasCorrect=g.score>=.999;g.self=v;g.score=v;
    // re-record if self-assessment changes correctness
    const nowCorrect=v>=.999;if(wasCorrect!==nowCorrect){const a=S.att[it.id];if(a){if(nowCorrect){a.c++;a.w=Math.max(0,a.w-1);a.h=a.h.slice(0,-1)+"1";a.s++;}else{a.w++;a.c=Math.max(0,a.c-1);a.h=a.h.slice(0,-1)+"0";a.s=0;S.redo[it.id]=1;}Store.save();}}
    App.render();return;}
   const act=b.dataset.act;if(!act)return;
   if(act==="quit"){if(exam&&!c.done){App.confirm("Leave this exam? Your answers will be lost.",()=>{this.cur=null;history.back();});}else{this.finish();}return;}
   if(act==="clue"){c.clueN=c.clueN||{};c.clueN[i]=(c.clueN[i]||1)+1;App.render();return;}
   if(act==="check"){this.saveInput();const r=c.resp[i];if(r==null||r===""||(it.t==="match"&&Object.keys(r||{}).length<it.pairs.length)){if(it.t==="order"&&r==null){c.resp[i]=[...it._init];}else{App.toast(it.t==="match"?"Match all pairs first.":"Choose or type an answer first.");return;}}
    const g=this.gradeOne(it,c.resp[i]);c.grade[i]=g;c.checked[i]=true;this.record(it,g);App.render();return;}
   if(act==="next"){this.saveInput();if(i<c.items.length-1){c.i++;App.render();window.scrollTo({top:0,behavior:"smooth"});}else{exam?this.submit():this.finish();}return;}
   if(act==="prev"){this.saveInput();c.i=Math.max(0,i-1);App.render();return;}
   if(act==="flag"){c.flags[i]=!c.flags[i];App.render();return;}
   if(act==="submit"){this.saveInput();const un=c.items.filter((_,k)=>c.resp[k]==null||c.resp[k]==="").length;App.confirm(un?`${un} question(s) unanswered. Submit anyway?`:"Submit the exam now?",()=>this.submit());return;}
   if(act==="ai"){const box=$("#aibox");box.innerHTML=`<div class="muted">Asking the AI tutor…</div>`;AI.grade(it.q,it.m,c.resp[i]).then(a=>{c.grade[i].ai=a;box.innerHTML=this.aiHtml(a);}).catch(err=>{box.innerHTML=`<div class="muted">AI tutor unavailable (${esc(err.message||err.code||"error")}). Use the keyword check and model answer.</div>`;});return;}
  };
  const inp=$("#ans",root);if(inp){inp.focus();inp.oninput=()=>{c.resp[i]=inp.value;};inp.onkeydown=e=>{if(e.key==="Enter"&&inp.tagName==="INPUT"){e.preventDefault();const btn=$('[data-act="check"]',root)||$('[data-act="next"]',root);btn&&btn.click();}};}
  const ol=$("#order",root);if(ol){let drag=null;$$(".oi",ol).forEach(li=>{li.ondragstart=()=>{drag=li;li.classList.add("dragging");};li.ondragend=()=>{li.classList.remove("dragging");c.resp[i]=$$(".oi",ol).map(x=>+x.dataset.k);App.render();};li.ondragover=e=>{e.preventDefault();if(!drag||drag===li)return;const r=li.getBoundingClientRect();ol.insertBefore(drag,(e.clientY-r.top)>r.height/2?li.nextSibling:li);};});}
  if(exam&&c.end){clearInterval(this.tick);const upd=()=>{const t=$("#timer");if(!t||!this.cur||this.cur.done){clearInterval(this.tick);return;}const ms=c.end-Date.now();if(ms<=0){clearInterval(this.tick);App.toast("⏰ Time is up – exam submitted.");this.submit();return;}const m=Math.floor(ms/MIN),s=Math.floor(ms%MIN/1000);t.textContent=`${m}:${String(s).padStart(2,"0")}`;t.classList.toggle("warn",ms<2*MIN);};upd();this.tick=setInterval(upd,1000);}
 },
 saveInput(){const c=this.cur;const inp=$("#ans");if(c&&inp)c.resp[c.i]=inp.value;},
 submit(){const c=this.cur;c.grade={};c.items.forEach((it,k)=>{let r=c.resp[k];if(it.t==="order"&&r==null)r=null;const g=this.gradeOne(it,r);c.grade[k]=g;c.checked[k]=true;if(r!=null&&r!=="")this.record(it,g);else Att.rec(it,false,null);});
  this.finish();},
 finish(){const c=this.cur;if(!c){App.go("dashboard");return;}const answered=Object.keys(c.checked).map(Number);
  let score=0;answered.forEach(k=>score+=(c.grade[k]?c.grade[k].score:0));const total=c.opt.mode==="exam"?c.items.length:answered.length;
  c.done=true;c.score=score;c.total=total;c.dur=Date.now()-c.start;
  if(c.opt.interleaved&&total>=8)Daily.bump("mixed");
  if(c.opt.mode==="exam"){const byT={};c.items.forEach((it,k)=>{const key=it.tp&&TOPICS[it.tp]?it.tp:"w"+it.w;const o=byT[key]||(byT[key]={s:0,n:0});o.n++;o.s+=c.grade[k].score;});
   S.exams.push({mode:c.opt.kind||"custom",title:c.opt.title,score,total,ts:Date.now(),dur:c.dur,byT});S.xp+=50;}
  if(c.opt.onFinish)c.opt.onFinish(c);
  Store.save();Ach.check();clearInterval(this.tick);App.render();window.scrollTo({top:0});},
 results(){const c=this.cur;const exam=c.opt.mode==="exam";const p=c.total?c.score/c.total:0;
  const wrong=c.items.map((it,k)=>({it,k,g:c.grade[k]})).filter(o=>c.checked[o.k]&&o.g&&o.g.score<.999);
  const byT={},byC={};c.items.forEach((it,k)=>{if(!c.checked[k])return;const tk=it.tp&&TOPICS[it.tp]?TOPICS[it.tp].title:`Week ${it.w}`;(byT[tk]=byT[tk]||{s:0,n:0});byT[tk].n++;byT[tk].s+=c.grade[k].score;const ck=CATS[it.c]||it.c;(byC[ck]=byC[ck]||{s:0,n:0});byC[ck].n++;byC[ck].s+=c.grade[k].score;});
  const bar=(o)=>Object.entries(o).sort((a,b)=>a[1].s/a[1].n-b[1].s/b[1].n).map(([k,v])=>`<div class="mrow"><span>${esc(k)}</span><div class="bar"><div style="width:${pct(v.s/v.n)}%" class="${v.s/v.n<.6?"low":v.s/v.n<.85?"mid":"hi"}"></div></div><b>${pct(v.s/v.n)}%</b><small>${v.n} q</small></div>`).join("");
  const grade=p>=.9?"Excellent":p>=.75?"Good":p>=.6?"Satisfactory":"Needs more work";
  let h=`<div class="card result-hero"><div class="ring big" style="--p:${pct(p)}"><span>${pct(p)}%</span></div><div><div class="eyebrow">${esc(c.opt.title||"Session")} · results</div><h2>${grade}</h2><p>${Math.round(c.score*10)/10} / ${c.total} points · ${Math.round(c.dur/MIN)} min${exam?" · +50 XP for finishing":""}</p>
   <div class="row"><button class="btn primary" data-res="retry">Retry the incorrect ones (${wrong.length})</button><button class="btn" data-res="again">New set, same settings</button><a class="btn ghost" href="#dashboard">Dashboard</a></div></div></div>`;
  h+=`<div class="grid2"><div class="card"><h3>Topic-level performance</h3>${bar(byT)||"<p class='muted'>—</p>"}</div><div class="card"><h3>By skill</h3>${bar(byC)||"<p class='muted'>—</p>"}</div></div>`;
  if(wrong.length){h+=`<div class="card"><h3>Incorrect or partial answers – with explanations</h3>${wrong.map(o=>{const it=o.it;let yours=c.resp[o.k];let your="—";if(it.t==="m"||it.t==="x")your=yours!=null?it._o[yours]:"—";else if(it.t==="tf")your=yours==null?"—":yours?"True":"False";else if(it.t==="match"||it.t==="order")your=`${pct(o.g.score)}% correct`;else your=yours||"—";
   let correct=it.t==="m"||it.t==="x"?it._o[it._a]:it.t==="tf"?(it.a?"True":"False"):it.t==="f"||it.t==="who"?(it.ans||it.acc[0]):it.t==="s"?it.m:"";
   return`<div class="wrong"><div class="wq"><span class="chip">W${it.w}</span> ${esc(it.t==="who"?"Who am I? "+it.clues.join(" "):it.q)}</div><div class="wa"><span class="bad">Your answer: ${esc(String(your))}</span>${correct?`<span class="ok">Correct: ${esc(correct)}</span>`:""}</div>${it.t==="s"&&o.g.kw?`<div class="small muted">Missing key points: ${esc(o.g.kw.miss.join(", ")||"—")}</div>`:""}<div class="expl small">${it.t==="order"||it.t==="match"?it.e:esc(it.e||"")}</div></div>`;}).join("")}</div>`;}
  if(exam){const shorts=c.items.map((it,k)=>({it,k})).filter(o=>o.it.t==="s");if(shorts.length)h+=`<div class="card"><h3>Open answers – review your keyword score</h3><p class="muted small">Open answers were auto-scored by key points (full / half / zero). Compare with the model answers above or in Practice; ${AI.ready?"the AI tutor is available in Practice mode.":"AI grading needs the Claude capability; keyword self-check is used instead."}</p></div>`;}
  setTimeout(()=>{const r=$("#view");r.onclick=e=>{const b=e.target.closest("[data-res]");if(!b)return;if(b.dataset.res==="retry"){if(!wrong.length)return;this.start(wrong.map(o=>ITEM[o.it.id]||o.it),Object.assign({},c.opt,{title:(c.opt.title||"")+" – retry",mode:"practice",timer:0}));}else{c.opt.regen?this.start(c.opt.regen(),c.opt):App.go("practice");}};},0);
  return h;}
};

/* ===================== FLASHCARD REVIEWER ===================== */
const Review={cur:null,
 start(filter,title){const q=SRS.queue(filter,{limit:80});if(!q.length){App.toast("🎉 No cards due in this deck right now. Come back later or add new cards.");return;}this.cur={q,i:0,flip:false,title,filter,n:0,again:0};App.go("review",true);},
 view(){const r=this.cur;if(!r)return`<div class="card"><p>No review in progress.</p><a class="btn" href="#memory">Open Memory Lab</a></div>`;
  if(r.i>=r.q.length)return`<div class="card result-hero"><div class="ring big" style="--p:100"><span>✓</span></div><div><div class="eyebrow">${esc(r.title)}</div><h2>Session complete</h2><p>${r.n} reviews · ${r.again} forgotten cards will return soon.</p><div class="row"><button class="btn primary" data-rv="more">Continue with this deck</button><a class="btn ghost" href="#memory">Memory Lab</a></div></div></div>`;
  const c=r.q[r.i];const isNew=SRS.isNew(c.id);
  return`<div class="run-head"><div><div class="eyebrow">${esc(r.title)}</div><div class="run-prog"><div style="width:${pct(r.i/r.q.length)}%"></div></div></div><div class="run-meta"><span>${r.i+1} / ${r.q.length}</span>${isNew?`<span class="chip">new</span>`:""}<a class="btn ghost sm" href="#memory">✕ End</a></div></div>
  <div class="flash ${r.flip?"flipped":""}"><div class="fmeta"><span class="chip">Week ${c.w}</span><span class="chip">${esc(CATS[c.cat]||c.cat)}</span></div><div class="fnote">${esc(c.frontNote)}</div><div class="ffront">${esc(c.front)}</div>
  ${r.flip?`<div class="fback">${c.back}</div>`:`<p class="muted small center">Try to recall the answer aloud or in your head first.</p>`}</div>
  ${r.flip?`<div class="grades">${["Again","Hard","Good","Easy"].map((g,k)=>`<button class="gbtn g${k}" data-g="${k}"><b>${g}</b><small>${["I forgot","I struggled","I remembered","Knew it instantly"][k]} · ${SRS.label(c.id,k)}</small></button>`).join("")}</div>`:`<div class="center"><button class="btn primary big" data-rv="flip">Show answer <kbd>Space</kbd></button></div>`}`;},
 bind(root){const r=this.cur;if(!r)return;root.onclick=e=>{const b=e.target.closest("button");if(!b)return;if(b.dataset.rv==="flip"){r.flip=true;App.render();}else if(b.dataset.rv==="more"){this.start(r.filter,r.title);}else if(b.dataset.g!=null){this.grade(+b.dataset.g);}};},
 grade(g){const r=this.cur;const c=r.q[r.i];SRS.grade(c.id,g);r.n++;if(g===0){r.again++;r.q.push(c);}r.i++;r.flip=false;App.render();},
 key(e){if(!this.cur||App.route!=="review")return;if(e.target.matches("input,textarea"))return;if(e.code==="Space"){e.preventDefault();if(!this.cur.flip){this.cur.flip=true;App.render();}}else if(this.cur.flip&&["1","2","3","4"].includes(e.key)){this.grade(+e.key-1);}}
};
