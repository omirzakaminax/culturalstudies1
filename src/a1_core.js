/* ===================== CORE: utils, state, persistence ===================== */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const slug=s=>String(s).toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,48);
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const pick=(a,n)=>shuffle(a).slice(0,n);
const today=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");};
const DAY=864e5, MIN=6e4;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const pct=x=>Math.round(x*100);
const hashStr=s=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
const norm=s=>String(s??"").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g,"").replace(/[ʼ'`’‘"“”«»]/g,"").replace(/[^a-z0-9Ѐ-ӿ.% ]+/g," ").replace(/\s+/g," ").trim();
function lev(a,b){if(a===b)return 0;const m=a.length,n=b.length;if(!m)return n;if(!n)return m;let p=Array.from({length:n+1},(_,i)=>i);for(let i=1;i<=m;i++){let c=[i];for(let j=1;j<=n;j++)c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=c;}return p[n];}
/* Fuzzy answer match: exact after normalisation, numeric equality, or small typo distance */
function fuzzyEq(input,target){const a=norm(input),b=norm(target);if(!a)return false;if(a===b)return true;
 const na=a.replace(/[^0-9.]/g,""),nb=b.replace(/[^0-9.]/g,"");if(nb&&/^[0-9.]+$/.test(b.replace(/ /g,""))&&na===nb)return true;
 const tol=b.length>=10?2:b.length>=5?1:0;return lev(a,b)<=tol;}
/* formatting tokens used in notes */
const SRC={L:["Lecture","src-l","Explicitly covered in the lecture slides"],S:["Seminar","src-s","From the official seminar slides / seminar instructions"],X:["External","src-x","Additional academic information from external sources (researched)"],C:["Study aid","src-c","Explanation, example or memory association written for this platform"]};
const badge=k=>SRC[k]?`<span class="src ${SRC[k][1]}" title="${SRC[k][2]}">${SRC[k][0]}</span>`:"";
const fmt=s=>String(s).replace(/==(.+?)==/g,'<mark>$1</mark>').replace(/\{([LSXC])\}/g,(m,k)=>badge(k));
const strip=s=>String(s).replace(/<[^>]+>/g," ").replace(/\{[LSXC]\}/g,"").replace(/==/g,"").replace(/\s+/g," ");

/* ---------- STATE ---------- */
const KEY="csx-platform-v1";
const DEF_STATE=()=>({v:1,upd:0,xp:0,days:{},att:{},srs:{},newDay:{d:"",n:0},conf:{},redo:{},exams:[],ach:{},daily:{},sess:{},check:{},feyn:0,reviews:0,answered:0,orderPerfect:0,read:{},
 settings:{theme:"auto",newPerDay:25,endDate:"",sessMin:60,noteMode:"quick"}});
let S=DEF_STATE();
const Store={
 local:null, db:null, ref:null, syncing:false, dirty:false, timer:null, status:"local",
 load(){try{const raw=localStorage.getItem(KEY);if(raw){const o=JSON.parse(raw);S=Object.assign(DEF_STATE(),o);S.settings=Object.assign(DEF_STATE().settings,o.settings||{});}this.local=true;}catch(e){this.local=false;}},
 save(){S.upd=Date.now();try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}this.dirty=true;clearTimeout(this.timer);this.timer=setTimeout(()=>this.push(),2500);},
 async connect(){
  try{ if(!window.claude||!window.claude.use) return;
   const db=await window.claude.use("db"); const user=await window.claude.use("user");
   if(!db||!user) return; const id=await user.id(); if(!id) return;
   this.db=db; this.ref=db.collection("data/users/"+id).doc("progress");
   const done=new Promise(res=>setTimeout(()=>res(null),10000));
   const r=await Promise.race([this.ref.get(),done]);
   let data=r; if(r&&typeof r.data==="function") data=r.data(); else if(r&&r.data&&typeof r.data==="object"&&!r.json) data=r.data;
   if(data&&data.json){const remote=JSON.parse(data.json); if((remote.upd||0)>(S.upd||0)){S=Object.assign(DEF_STATE(),remote);S.settings=Object.assign(DEF_STATE().settings,remote.settings||{});try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){} App.rerender();}}
   this.status="cloud"; App.syncBadge(); if(this.dirty||!data) this.push();
  }catch(e){ console.log("db unavailable",e&&e.message); this.status=this.local?"local":"memory"; App.syncBadge(); }
 },
 async push(){ if(!this.ref||this.syncing) return; this.syncing=true; this.dirty=false;
  try{ await this.ref.set({json:JSON.stringify(S),upd:S.upd}); this.status="cloud"; }catch(e){ this.status="local"; this.dirty=true; }
  this.syncing=false; App.syncBadge(); if(this.dirty){clearTimeout(this.timer);this.timer=setTimeout(()=>this.push(),5000);} }
};

/* ---------- ACTIVITY / XP ---------- */
function logActivity(xp){S.xp+=xp;const d=today();S.days[d]=(S.days[d]||0)+1;Store.save();App.toastXP(xp);Ach.check();}
function streak(){let n=0;let d=new Date();if(!S.days[today()])d=new Date(Date.now()-DAY);
 for(;;){const k=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");if(S.days[k]){n++;d=new Date(d.getTime()-DAY);}else break;}return n;}
const LEVELS=["Novice","Apprentice","Learner","Scholar","Researcher","Analyst","Expert","Master","Grandmaster","Professor"];
function level(){const L=Math.floor(Math.sqrt(S.xp/120))+1;const cur=120*(L-1)**2,next=120*L**2;return{L,title:LEVELS[Math.min(L-1,LEVELS.length-1)],cur,next,prog:(S.xp-cur)/(next-cur)};}
