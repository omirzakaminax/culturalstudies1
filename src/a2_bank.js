/* ===================== BANK: items, cards, mastery, SRS ===================== */
const CATS={def:"Definitions",date:"Dates",people:"Scholars & people",theory:"Theories",event:"Historical events",short:"Short answers",compare:"Comparisons",apply:"Application"};
const ENDW=[6,7,8,9,10];
const TOPICS={}; const WEEK={};
KB.weeks.sort((a,b)=>a.id-b.id).forEach(w=>{WEEK[w.id]=w;w.topics.forEach(t=>{t.w=w.id;TOPICS[t.id]=t;});});
const PERSON_TOPIC={robertson:"w7t1",baudrillard:"w7t1",khalfin:"w7t2",maslov:"w7t2",narymbetov:"w7t2",earley:"w7t3",vandyne:"w7t3",shea:"w7t4",gershon:"w7t4",schweibenz:"w7t5",kere:"w7t5",nixdorf:"w7t5",simmel:"w8t1",rustembekov:"w8t2",foster:"w8t2",kurokawa:"w8t2",hofstede:"w8t4",minkov:"w8t4",bond:"w8t4",oberg:"w9t1",dawkins:"w9t2",shifman:"w9t2",busa:"w9t3",lovelace:"w9t5",nazarbayev:"w10t1",steward:"w10t6",halbwachs:"w10t7",assmann:"w10t7",nora:"w10t7",martin:"w6t1",satpayev:"w6t1",kolbin:"w6t1",shakhanov:"w6t3",bokeikhanov:"w6t3",baitursynov:"w6t3",dulatuly:"w6t3",seifullin:"w6t3",zhumabayev:"w6t3",makataev:"w6t3",aibergenov:"w6t3",myrzaliev:"w6t3",ungarsynova:"w6t3"};
function personTopic(p){if(PERSON_TOPIC[p.id])return PERSON_TOPIC[p.id];if(p.w===6){return {performer:"w6t2",composer:"w6t2",writer:"w6t4",poet:"w6t3",director:"w6t5",actor:"w6t5",artist:"w6t6"}[p.r]||"w6t1";}
 const w=WEEK[p.w];return w&&w.topics[0]?w.topics[0].id:undefined;}
const surname=n=>{const parts=n.replace(/\(.*?\)/g,"").replace(/&.*/,"").trim().split(/\s+/);return parts[parts.length-1];};

/* ---------- ITEMS (questions) ---------- */
const ITEMS=[]; const ITEM={};
function addItem(o){if(ITEM[o.id])return;ITEMS.push(o);ITEM[o.id]=o;}
KB.questions.forEach(q=>addItem(Object.assign({src:"bank"},q)));
(function generate(){
 const P=KB.people;
 // person -> who (from contribution)
 P.forEach(p=>{
  if(!p.c) return;
  let pool=P.filter(x=>x.id!==p.id&&x.r===p.r&&x.w===p.w); if(pool.length<3) pool=pool.concat(P.filter(x=>x.id!==p.id&&x.r===p.r&&x.w!==p.w)); if(pool.length<3) pool=pool.concat(P.filter(x=>x.id!==p.id&&!pool.includes(x)));
  addItem({id:"gp-"+p.id,t:"m",gen:1,w:p.w,tp:personTopic(p),c:"people",d:2,q:`Who is this? “${p.c}”`,o:[p.n].concat(pick(pool,3).map(x=>x.n)),a:0,e:`${p.n}${p.d?" ("+p.d+")":""}. ${p.x||""}`,card:"p:"+p.id,person:p.id});
  if(p.wk&&p.wk.length&&!/^Roles:/.test(p.wk[0])){
   const others=P.filter(x=>x.id!==p.id&&x.wk&&x.wk.length&&!/^Roles:/.test(x.wk[0])&&(x.r===p.r||x.w===p.w));
   if(others.length>=3){addItem({id:"gw-"+p.id,t:"m",gen:1,w:p.w,tp:personTopic(p),c:"people",d:2,q:`Which work is associated with ${p.n}?`,o:[p.wk[0]].concat(pick(others,3).map(x=>x.wk[0])),a:0,e:`${p.n}: ${p.wk.join("; ")}.`,person:p.id});}
  }
  const clues=(p.clues&&p.clues.length)?p.clues:[p.d?`Life dates / period: ${p.d}.`:`I belong to Week ${p.w} of the course.`, p.wk&&p.wk.length?`Associated work(s): ${p.wk.join("; ")}.`:`Context: ${p.x}.`, p.c+"."];
  addItem({id:"gwho-"+p.id,t:"who",gen:1,w:p.w,tp:personTopic(p),c:"people",d:3,q:"Who am I?",clues,acc:[p.n,surname(p.n)].concat(p.n.split(/ & | and /).map(surname)),ans:p.n,e:`${p.n}${p.d?" ("+p.d+")":""}: ${p.c}.`,person:p.id});
 });
 // concepts
 const C=KB.concepts;
 C.forEach(c=>{
  let pool=C.filter(x=>x!==c&&x.w===c.w); if(pool.length<3) pool=pool.concat(C.filter(x=>x!==c&&x.w!==c.w));
  const ds=pick(pool,3);
  addItem({id:"gc-"+slug(c.t),t:"m",gen:1,w:c.w,c:"def",d:2,q:`Which term matches this definition? “${c.d}”`,o:[c.t].concat(ds.map(x=>x.t)),a:0,e:`${c.t}: ${c.s}.`,card:"c:"+slug(c.t)});
  addItem({id:"gct-"+slug(c.t),t:"m",gen:1,w:c.w,c:"def",d:2,q:`What does “${c.t}” mean?`,o:[c.d].concat(pick(pool,3).map(x=>x.d)),a:0,e:`${c.t} – ${c.s}. Example: ${c.ex||"—"}`,card:"c:"+slug(c.t)});
 });
 // timeline
 const T=KB.timeline; const yrs=[...new Set(T.map(t=>t.y))];
 T.forEach((t,i)=>{
  const near=yrs.filter(y=>y!==t.y).map(y=>({y,dist:Math.abs((T.find(z=>z.y===y).s)-t.s)})).sort((a,b)=>a.dist-b.dist).slice(0,8).map(o=>o.y);
  addItem({id:"gt-"+i,t:"m",gen:1,w:t.w,c:"date",d:2,q:`When did this happen? ${t.e}`,o:[t.y].concat(pick(near,3)),a:0,e:`${t.y}: ${t.e}.`,card:"t:"+i});
  const m=t.y.match(/^(\d{4})$/); if(m) addItem({id:"gf-"+i,t:"f",gen:1,w:t.w,c:"date",d:2,q:`Year: ____ — ${t.e}`,acc:[m[1]],e:`${t.y}.`,card:"t:"+i});
 });
})();

/* matching sets: hand + generated */
const MATCH=[...KB.matchSets];
/* ordering sets are built on demand from the timeline */
function makeOrder(weeks,n=5){const pool=KB.timeline.filter(t=>!weeks||weeks.includes(t.w));const byYear={};pool.forEach(t=>{const k=Math.floor(t.s);(byYear[k]=byYear[k]||[]).push(t);});
 const keys=shuffle(Object.keys(byYear)).slice(0,Math.min(n,Object.keys(byYear).length));const ev=keys.map(k=>pick(byYear[k],1)[0]).sort((a,b)=>a.s-b.s);
 return {id:"ord-"+ev.map(e=>KB.timeline.indexOf(e)).join("-"),t:"order",w:ev[0]?ev[0].w:0,c:"date",d:2,q:"Arrange these events in chronological order (earliest first).",seq:ev.map(e=>({txt:e.e,y:e.y})),e:ev.map(e=>`${e.y} – ${e.e}`).join("<br>")};}
function makeMatch(weeks){const pool=MATCH.filter(m=>!weeks||weeks.includes(m.w));if(!pool.length)return null;const m=pick(pool,1)[0];const seenL=new Set(),seenR=new Set();const pairs=shuffle(m.pairs).filter(p=>{if(seenL.has(p[0])||seenR.has(p[1]))return false;seenL.add(p[0]);seenR.add(p[1]);return true;}).slice(0,5);
 return {id:"mt-"+m.id+"-"+pairs.map(p=>slug(p[0]).slice(0,6)).join(""),set:m.id,t:"match",w:m.w,c:"compare",d:2,q:`Match the pairs: ${m.title}`,pairs,e:pairs.map(p=>`${p[0]} → ${p[1]}`).join("<br>")};}

/* ---------- FLASHCARDS ---------- */
const CARDS=[]; const CARD={};
function addCard(o){CARDS.push(o);CARD[o.id]=o;}
KB.concepts.forEach(c=>{const k=slug(c.t);addCard({id:"c:"+k,w:c.w,cat:"def",front:c.t,frontNote:"Define the term",back:`<b>${esc(c.d)}</b><br><span class="muted">In simple words: ${esc(c.s)}${c.ex?" · Example: "+esc(c.ex):""}</span>`});
 addCard({id:"cr:"+k,w:c.w,cat:"def",front:c.d,frontNote:"Which term is this?",back:`<b>${esc(c.t)}</b>`});});
KB.people.forEach(p=>{addCard({id:"p:"+p.id,w:p.w,cat:"people",front:p.n+(p.d?` (${p.d})`:""),frontNote:"Main contribution & works?",back:`<b>${esc(p.c)}</b>${p.wk&&p.wk.length?`<br><span class="muted">Works: ${esc(p.wk.join("; "))}</span>`:""}`});
 addCard({id:"pr:"+p.id,w:p.w,cat:"people",front:p.c,frontNote:"Who is this?",back:`<b>${esc(p.n)}</b>${p.d?` <span class="muted">(${esc(p.d)})</span>`:""}`});});
const yCount={};KB.timeline.forEach(t=>yCount[t.y]=(yCount[t.y]||0)+1);
KB.timeline.forEach((t,i)=>{addCard({id:"t:"+i,w:t.w,cat:"date",front:t.e,frontNote:"When?",back:`<b>${esc(t.y)}</b>`});
 if(yCount[t.y]===1) addCard({id:"tr:"+i,w:t.w,cat:"event",front:t.y,frontNote:"What happened?",back:`<b>${esc(t.e)}</b>`});});
KB.extraCards.forEach((x,i)=>{addCard({id:"x:"+i,w:x.w,cat:x.c,front:x.f,frontNote:"Recall the answer",back:`<b>${esc(x.b)}</b>`});
 if(x.b.length<70) addCard({id:"xr:"+i,w:x.w,cat:x.c,front:x.b,frontNote:"What is the question/term?",back:`<b>${esc(x.f)}</b>`});});

/* ---------- SRS (SM-2 style with learning steps) ---------- */
const SRS={
 state(id){return S.srs[id];},
 isNew(id){return !S.srs[id];},
 due(id){const s=S.srs[id];return s&&s.d<=Date.now();},
 newLeft(){if(S.newDay.d!==today())S.newDay={d:today(),n:0};return Math.max(0,S.settings.newPerDay-S.newDay.n);},
 queue(filter,{includeNew=true,limit=60}={}){const pool=CARDS.filter(filter);const due=pool.filter(c=>this.due(c.id)).sort((a,b)=>S.srs[a.id].d-S.srs[b.id].d);
  let q=due;if(includeNew){const nl=this.newLeft();q=q.concat(shuffle(pool.filter(c=>this.isNew(c.id))).slice(0,nl));}return q.slice(0,limit);},
 preview(id,g){const s=S.srs[id]||{iv:0,ef:2.5,r:0,n:0};const now=Date.now();let iv=s.iv,ef=s.ef,d;
  if(!s.r||s.iv<1){ // learning
   if(g===0){d=now+MIN;iv=0;} else if(g===1){d=now+6*MIN;iv=0;} else if(g===2){iv=1;d=now+DAY;} else {iv=4;d=now+4*DAY;}
  } else {
   if(g===0){ef=Math.max(1.3,ef-0.2);iv=Math.max(1,iv*0.3);d=now+10*MIN;}
   else if(g===1){ef=Math.max(1.3,ef-0.15);iv=Math.max(1,iv*1.2);d=now+iv*DAY;}
   else if(g===2){iv=iv*ef;d=now+iv*DAY;}
   else {ef=ef+0.15;iv=iv*ef*1.3;d=now+iv*DAY;}
  }
  return {d,iv,ef};},
 label(id,g){const p=this.preview(id,g);const ms=p.d-Date.now();return ms<60*MIN?Math.round(ms/MIN)+"m":ms<DAY?Math.round(ms/36e5)+"h":Math.round(ms/DAY)+"d";},
 grade(id,g){const wasNew=!S.srs[id];const s=S.srs[id]||{iv:0,ef:2.5,r:0,n:0};const p=this.preview(id,g);
  S.srs[id]={d:p.d,iv:p.iv,ef:p.ef,r:s.r+1,n:s.n+(g===0?1:0),l:Date.now()};
  if(wasNew){if(S.newDay.d!==today())S.newDay={d:today(),n:0};S.newDay.n++;}
  S.reviews++;Daily.bump("cards");logActivity(g===0?1:g===3?5:3);},
 strength(id){const s=S.srs[id];if(!s)return 0;if(s.iv>=21)return 1;if(s.iv>=7)return .8;if(s.iv>=3)return .65;if(s.iv>=1)return .45;return .15;},
 bump(id){if(S.srs[id]){S.srs[id].d=Date.now();}} // forgotten fact -> due now
};

/* ---------- ATTEMPTS, MASTERY, WEIGHTING ---------- */
const Att={
 rec(item,correct,chosen){const id=item.id;const a=S.att[id]||{c:0,w:0,s:0,h:""};
  if(correct){a.c++;a.s++;}else{a.w++;a.s=0;}a.l=Date.now();a.h=(a.h+(correct?"1":"0")).slice(-6);S.att[id]=a;S.answered++;
  if(!correct){S.redo[id]=1;if(item.card&&S.srs[item.card])SRS.bump(item.card);
   if(chosen!=null&&item.o){const A=item.o[item.a],B=chosen;if(A!==B){const k=[A,B].sort().join(" ⟷ ");const cf=S.conf[k]||{n:0,q:[]};cf.n++;cf.a=A;cf.b=B;if(!cf.q.includes(id))cf.q.push(id);cf.l=Date.now();S.conf[k]=cf;}}}
  else if(a.s>=2) delete S.redo[id];
  Daily.bump("q");if(correct)Daily.bump("qc");logActivity(correct?(item.d>=3?15:10):2);},
 strength(id){const a=S.att[id];if(!a)return 0;const h=a.h||"";let w=0,t=0;for(let i=0;i<h.length;i++){const wt=i+1;t+=wt;if(h[i]==="1")w+=wt;}let st=t?w/t:0;if(a.s>=3)st=Math.min(1,st+.1);return st;},
 weight(item){const a=S.att[item.id];if(S.redo[item.id])return 4;if(!a)return 1.6;const since=(Date.now()-(a.l||0))/DAY;const base=1/(1+a.s*a.s);return base*(0.6+Math.min(since,7)/7);}
};
function weightedPick(pool,n){const out=[];const arr=pool.map(it=>({it,w:Att.weight(it)}));while(out.length<n&&arr.length){const tot=arr.reduce((s,x)=>s+x.w,0);let r=Math.random()*tot;let i=0;for(;i<arr.length;i++){r-=arr[i].w;if(r<=0)break;}i=Math.min(i,arr.length-1);out.push(arr[i].it);arr.splice(i,1);}return out;}
function interleave(list){const by={};list.forEach(x=>(by[x.w]=by[x.w]||[]).push(x));const ks=shuffle(Object.keys(by));const out=[];let added=true;while(added){added=false;for(const k of ks){if(by[k].length){out.push(by[k].shift());added=true;}}}return out;}

/* Mastery of a scope = average strength over all items + cards in scope (unseen count 0) */
function scopeItems(f){return ITEMS.filter(f);}function scopeCards(f){return CARDS.filter(f);}
function mastery(fItem,fCard){const its=scopeItems(fItem),cs=fCard?scopeCards(fCard):[];const n=its.length+cs.length;if(!n)return{m:0,seen:0,n:0,acc:null,status:"Not Started"};
 let sum=0,seen=0,cor=0,tot=0;its.forEach(i=>{const a=S.att[i.id];if(a){seen++;cor+=a.c;tot+=a.c+a.w;}sum+=Att.strength(i.id);});cs.forEach(c=>{if(S.srs[c.id])seen++;sum+=SRS.strength(c.id);});
 const m=sum/n;const acc=tot?cor/tot:null;let status="Not Started";
 if(seen){status=m>=.85?"Mastered":m>=.6?"Almost Mastered":(acc!=null&&acc<.6&&tot>=4)?"Needs Revision":m>=.35?"Needs Revision":"Learning";if(status==="Mastered"&&acc!=null&&acc<.7)status="Almost Mastered";}
 return{m,seen,n,acc,status};}
const STATUS_CLS={"Not Started":"st0","Learning":"st1","Needs Revision":"st2","Almost Mastered":"st3","Mastered":"st4"};
const stBadge=st=>`<span class="stb ${STATUS_CLS[st]}">${st}</span>`;
const wM=w=>mastery(i=>i.w===w,c=>c.w===w);
const tM=t=>mastery(i=>i.tp===t);
const catM=(c,ws)=>mastery(i=>i.c===c&&(!ws||ws.includes(i.w)),cd=>cd.cat===c&&(!ws||ws.includes(cd.w)));
const endM=()=>mastery(i=>ENDW.includes(i.w),c=>ENDW.includes(c.w));

/* ---------- DAILY CHALLENGE ---------- */
const Daily={
 defs:[{k:"q",n:20,txt:"Answer 20 questions in any mode"},{k:"cards",n:30,txt:"Review 30 flashcards"},{k:"qc",n:15,txt:"Get 15 correct answers"},{k:"mixed",n:1,txt:"Finish one interleaved (mixed-week) quiz"},{k:"feyn",n:1,txt:"Explain one concept in the Feynman lab"}],
 cur(){const d=today();return this.defs[hashStr(d)%this.defs.length];},
 bump(k){const d=today();const o=S.daily[d]||(S.daily[d]={});o[k]=(o[k]||0)+1;const c=this.cur();if(c.k===k&&o[k]===c.n&&!o.done){o.done=1;S.xp+=50;setTimeout(()=>App.toast("🎯 Daily challenge complete! +50 XP"),300);}},
 prog(){const c=this.cur();const o=S.daily[today()]||{};return{c,v:Math.min(c.n,o[c.k]||0),done:!!o.done};}
};

/* ---------- ACHIEVEMENTS ---------- */
const Ach={
 list:[
  {id:"first-steps",ic:"🌱",t:"First Steps",d:"Answer your first 10 questions",f:()=>S.answered>=10},
  {id:"first-week",ic:"📘",t:"First Week Completed",d:"Reach 70% mastery in any week",f:()=>KB.weeks.some(w=>wM(w.id).m>=.7)},
  {id:"scholar-expert",ic:"🎓",t:"Scholar Expert",d:"80% mastery in Scholars & People (Weeks 1–10)",f:()=>catM("people").m>=.8},
  {id:"timeline-master",ic:"⏳",t:"Timeline Master",d:"5 perfect chronological orderings",f:()=>S.orderPerfect>=5},
  {id:"cultural-historian",ic:"🏛️",t:"Cultural Historian",d:"Answer 300 questions",f:()=>S.answered>=300},
  {id:"memory-champion",ic:"🧠",t:"Memory Champion",d:"500 flashcard reviews",f:()=>S.reviews>=500},
  {id:"theory-master",ic:"📐",t:"Theory Master",d:"80% mastery in Theories and Definitions",f:()=>catM("theory").m>=.8&&catM("def").m>=.8},
  {id:"feynman",ic:"🗣️",t:"Feynman Explainer",d:"Complete 5 Feynman explanations",f:()=>S.feyn>=5},
  {id:"streak7",ic:"🔥",t:"Seven-Day Flame",d:"Study 7 days in a row",f:()=>streak()>=7},
  {id:"first-mock",ic:"📝",t:"First Mock Exam",d:"Finish any exam simulation",f:()=>S.exams.length>=1},
  {id:"flawless",ic:"💎",t:"Flawless",d:"Score 100% in an exam of 15+ questions",f:()=>S.exams.some(e=>e.total>=15&&e.score>=e.total-0.001)},
  {id:"endterm-ready",ic:"🏁",t:"Endterm Ready",d:"85% Endterm readiness and an Endterm mock ≥ 80%",f:()=>endM().m>=.85&&S.exams.some(e=>e.mode==="endterm"&&e.score/e.total>=.8)},
  {id:"ten-week",ic:"👑",t:"10-Week Master",d:"85% mastery in all 10 weeks",f:()=>KB.weeks.every(w=>wM(w.id).m>=.85)}
 ],
 check(){let changed=false;this.list.forEach(a=>{if(!S.ach[a.id]&&a.f()){S.ach[a.id]=Date.now();changed=true;setTimeout(()=>App.toast(`${a.ic} Achievement unlocked: ${a.t}`),600);}});if(changed){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}}
};
