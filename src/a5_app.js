/* ===================== APP: router, shell, overlays, boot ===================== */
const App={
 route:"dashboard",
 shell(){const lv=level();
  return`<div class="shell"><aside class="side" id="side"><div class="brand"><div class="logo">Cs</div><div><b>Cultural Studies</b><small>Learning & exam platform</small></div></div>
  <nav class="nav" id="nav">${NAV.map(([k,t,i])=>`<a href="#${k}" data-nav="${k}" class="${k==="endterm"?"etnav":""}"><span class="ni">${i}</span>${t}${k==="memory"?`<span class="nb" id="duebadge"></span>`:""}</a>`).join("")}</nav>
  <div class="side-foot"><div class="lvl"><span id="sflvl">Level ${lv.L} · ${lv.title}</span><span id="sfxp">${S.xp} XP</span></div><div class="mini"><div id="sfbar" style="width:${pct(lv.prog)}%"></div></div><div style="margin-top:8px" id="syncline"></div></div></aside>
  <div class="scrim" id="scrim"></div>
  <div class="main"><header class="top"><button class="burger" id="burger" aria-label="Menu">☰</button>
   <div class="sbox"><span class="si">⌕</span><input id="gsearch" placeholder="Search scholars, dates, concepts, topics…  ( / )" autocomplete="off"><div class="sres" id="sres"></div></div>
   <div class="tright"><span class="pill resume" id="resume" style="display:none">⏱ Resume session</span><span class="pill" id="streakpill"></span><button class="iconbtn" id="themebtn" title="Toggle dark mode">☾</button></div></header>
  <main id="view"></main></div></div><div class="toasts" id="toasts"></div>`;},
 init(){document.body.innerHTML=this.shell();this.applyTheme();
  window.addEventListener("hashchange",()=>this.fromHash());
  $("#burger").onclick=()=>this.side(true);$("#scrim").onclick=()=>this.side(false);
  $("#nav").onclick=e=>{if(e.target.closest("a"))this.side(false);};
  $("#themebtn").onclick=()=>{const cur=document.documentElement.dataset.theme;S.settings.theme=cur==="dark"?"light":"dark";Store.save();this.applyTheme();};
  $("#resume").onclick=()=>this.go(Runner.cur&&!Runner.cur.done?"run":"review");
  this.bindSearch();
  document.addEventListener("keydown",e=>{Review.key(e);if(e.key==="/"&&!e.target.matches("input,textarea,select")){e.preventDefault();$("#gsearch").focus();}if(e.key==="Escape"){this.closeSearch();}});
  document.addEventListener("click",e=>{const a=e.target.closest("[data-scroll]");if(!a)return;e.preventDefault();const target=a.getAttribute("data-scroll");const href=(a.getAttribute("href")||"").replace(/^#/,"");
   const doScroll=()=>{const el=document.getElementById(target);if(el){el.scrollIntoView({behavior:"smooth",block:"start"});el.animate&&el.animate([{boxShadow:"0 0 0 3px var(--p300)"},{boxShadow:"0 0 0 0 transparent"}],{duration:1400});}};
   if(href&&href!==this.route){this.go(href);setTimeout(doScroll,120);}else doScroll();});
  matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change",()=>this.applyTheme());
  this.fromHash();},
 side(open){$("#side").classList.toggle("open",open);$("#scrim").classList.toggle("on",open);},
 fromHash(){let h=decodeURIComponent(location.hash.replace(/^#/,""))||"dashboard";if(!(Pages[h]||/^week-(10|[1-9])$/.test(h)||h==="run"||h==="review"))h="dashboard";
  if(this.route==="run"&&h!=="run"&&Runner.cur&&!Runner.cur.done&&Runner.cur.opt.mode==="exam"){/* exam keeps running; resume pill shown */}
  this.route=h;this.render();window.scrollTo({top:0});},
 go(r,force){if(location.hash.slice(1)===r){this.route=r;this.render();window.scrollTo({top:0});}else location.hash=r;},
 render(){const r=this.route;let html="",bind=null;
  try{
   if(r==="run"){html=Runner.view();bind=v=>Runner.bind(v);}
   else if(r==="review"){html=Review.view();bind=v=>Review.bind(v);}
   else if(r.startsWith("week-")){html=weekPage(+r.slice(5));bind=bindWeek;}
   else{html=Pages[r]();bind=Object.prototype.hasOwnProperty.call(Pages[r],"bind")?Pages[r].bind:null;}
  }catch(err){console.error(err);html=`<div class="card"><h3>Something went wrong on this page</h3><p class="muted">${esc(err.message)}</p><a class="btn" href="#dashboard">Back to dashboard</a></div>`;}
  const old=$("#view");const v=document.createElement("main");v.id="view";v.innerHTML=html;old.replaceWith(v);
  if(bind){try{bind(v);}catch(err){console.error(err);}}
  $$("#nav a").forEach(a=>a.classList.toggle("on",a.dataset.nav===r||(r.startsWith("week-")&&a.dataset.nav==="roadmap")||(r==="run"&&a.dataset.nav==="practice")||(r==="review"&&a.dataset.nav==="memory")));
  this.chrome();},
 rerender(){this.render();},
 rerenderSoft(){if(["memory","run","exam"].includes(this.route)&&!(this.route==="run"&&Runner.cur&&Runner.cur.opt.mode==="exam"))this.render();},
 chrome(){const lv=level();const set=(id,t)=>{const e=$("#"+id);if(e)e.textContent=t;};set("sflvl",`Level ${lv.L} · ${lv.title}`);set("sfxp",`${S.xp} XP`);const b=$("#sfbar");if(b)b.style.width=pct(lv.prog)+"%";
  const due=dueCount();set("duebadge",due?String(due>999?"999+":due):"");const db=$("#duebadge");if(db)db.style.display=due?"":"none";
  set("streakpill",`🔥 ${streak()} · ✦ ${S.xp} XP`);
  const res=$("#resume");if(res){const active=(Runner.cur&&!Runner.cur.done&&this.route!=="run")||(Review.cur&&Review.cur.i<Review.cur.q.length&&this.route!=="review"&&Review.cur.n>0);res.style.display=active?"":"none";res.textContent=Runner.cur&&!Runner.cur.done?(Runner.cur.opt.mode==="exam"?"⏱ Resume exam":"↻ Resume practice"):"↻ Resume flashcards";}
  this.syncBadge();},
 syncText(){return Store.status==="cloud"?"☁ Synced to your Claude account":Store.status==="memory"?"⚠ Not saved (storage blocked) – use Copy backup":"💾 Saved in this browser";},
 syncBadge(){const e=$("#syncline");if(e)e.textContent=this.syncText();const s=$("#syncst");if(s)s.textContent=this.syncText();},
 applyTheme(){const t=S.settings.theme;const dark=t==="dark"||(t==="auto"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=dark?"dark":"light";const b=$("#themebtn");if(b)b.textContent=dark?"☀":"☾";},
 toast(msg,cls=""){const box=$("#toasts");if(!box)return;const t=document.createElement("div");t.className="toast "+cls;t.textContent=msg;box.appendChild(t);setTimeout(()=>{t.style.transition="opacity .3s";t.style.opacity="0";setTimeout(()=>t.remove(),320);},2600);},
 _xp:0,_xpT:null,
 toastXP(xp){if(!xp)return;this._xp+=xp;clearTimeout(this._xpT);this._xpT=setTimeout(()=>{this.toast(`+${this._xp} XP`,"xp");this._xp=0;this.chrome();},700);},
 confirm(msg,yes){const m=document.createElement("div");m.className="modal";m.innerHTML=`<div class="card"><h3>Please confirm</h3><p>${esc(msg)}</p><div class="row" style="justify-content:flex-end"><button class="btn ghost" data-c="0">Cancel</button><button class="btn primary" data-c="1">Yes, continue</button></div></div>`;document.body.appendChild(m);
  m.onclick=e=>{const b=e.target.closest("[data-c]");if(e.target===m||b){m.remove();if(b&&b.dataset.c==="1")yes();}};},
 examStart(kind,cfg){const items=Build.exam(kind,cfg);Runner.start(items,{title:cfg.title,mode:"exam",timer:cfg.min,kind,regen:()=>Build.exam(kind,cfg)});},
 /* ---------- global search ---------- */
 bindSearch(){const inp=$("#gsearch"),box=$("#sres");let hl=-1,res=[];
  const draw=()=>{if(!res.length){box.innerHTML=inp.value.trim().length>=2?`<div class="muted small" style="padding:10px">No results for “${esc(inp.value)}”.</div>`:"";box.classList.toggle("on",inp.value.trim().length>=2);return;}
   box.innerHTML=res.map((x,i)=>`<a href="${x.href}" data-i="${i}" class="${i===hl?"hl":""}"><span class="sk">${x.k}</span><b>${esc(x.t)}</b><span class="ss">${esc(strip(x.s))}</span></a>`).join("");box.classList.add("on");};
  const open=i=>{const x=res[i];if(!x)return;if(x.q!=null){App.eq=x.q;App.ew=null;App.er="";}if(x.cq!=null){App.cq=x.cq;App.cw=null;}if(x.k==="Date"){App.lw=null;App.lp="";App.lt="";App.lh="";}
   const route=x.href.slice(1);this.closeSearch();inp.value="";inp.blur();
   if(route===this.route)this.render();else this.go(route);
   if(x.scroll)setTimeout(()=>{const el=document.getElementById(x.scroll);el&&el.scrollIntoView({behavior:"smooth"});},150);};
  inp.oninput=()=>{res=search(inp.value);hl=res.length?0:-1;draw();};
  inp.onfocus=()=>{if(inp.value.trim().length>=2){res=search(inp.value);draw();}};
  inp.onkeydown=e=>{if(e.key==="ArrowDown"){e.preventDefault();hl=Math.min(res.length-1,hl+1);draw();}else if(e.key==="ArrowUp"){e.preventDefault();hl=Math.max(0,hl-1);draw();}else if(e.key==="Enter"){e.preventDefault();open(hl<0?0:hl);}};
  box.onmousedown=e=>{const a=e.target.closest("a");if(!a)return;e.preventDefault();open(+a.dataset.i);};
  document.addEventListener("click",e=>{if(!e.target.closest(".sbox"))this.closeSearch();});},
 closeSearch(){const b=$("#sres");if(b)b.classList.remove("on");}
};

/* ---------- boot ---------- */
(function boot(){Store.load();
 const start=()=>{App.init();Ach.check();
  // light up optional platform features (cloud progress + AI tutor) when available
  let n=0;const tryConnect=()=>{if(window.claude&&typeof window.claude.use==="function"){Store.connect();AI.init();}else if(++n<24)setTimeout(tryConnect,250);};tryConnect();};
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
 window.addEventListener("beforeunload",()=>{try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}});
})();
