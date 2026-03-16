(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))o(s);new MutationObserver(s=>{for(const r of s)if(r.type==="childList")for(const l of r.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&o(l)}).observe(document,{childList:!0,subtree:!0});function a(s){const r={};return s.integrity&&(r.integrity=s.integrity),s.referrerPolicy&&(r.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?r.credentials="include":s.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function o(s){if(s.ep)return;s.ep=!0;const r=a(s);fetch(s.href,r)}})();const $="auth_token";function I(){return localStorage.getItem($)}function N(t){localStorage.setItem($,t)}function _(){localStorage.removeItem($)}function M(){return I()!=null}function U(){const t=window.location.hash.slice(1)||"/";return t.startsWith("/")?t:`/${t}`}function P(){const t=U(),e=t.split("/").filter(Boolean);return e[0]==="tasks"&&e[1]?{name:"task-detail",id:e[1]}:e[0]==="tasks"?{name:"tasks"}:e[0]==="archive"?{name:"archive"}:e[0]==="settings"?{name:"settings"}:e[0]==="login"||t==="/"||t===""?{name:"login"}:{name:"tasks"}}function u(t){let e="/";switch(t.name){case"login":e="/login";break;case"tasks":e="/tasks";break;case"task-detail":e=`/tasks/${t.id}`;break;case"archive":e="/archive";break;case"settings":e="/settings";break}window.location.hash=e}function z(t){window.addEventListener("hashchange",t),t()}const R={},q=R?.VITE_API_URL??"/api";class m extends Error{constructor(e,a,o){super(a),this.statusCode=e,this.body=o,this.name="ApiError"}get isUnauthorized(){return this.statusCode===401}}async function v(t,e,a){const o=e.startsWith("http")?e:`${q}${e}`,s={"Content-Type":"application/json"},r=I();r&&(s.Authorization=`Bearer ${r}`);const l=await fetch(o,{method:t,headers:s,body:a!=null?JSON.stringify(a):void 0});if(l.status===401)throw _(),new m(401,"Unauthorized");const i=await l.text();if(!l.ok)throw new m(l.status,l.statusText,i);if(i.length!==0)try{return JSON.parse(i)}catch{return}}const h={async login(t,e){return v("POST","/auth/login",{email:t,password:e})},async getLabels(){return v("GET","/labels")},async listTasks(t=!1,e){const a=new URLSearchParams;t&&a.set("archived","true"),e&&a.set("label",e);const o=a.toString()?`?${a}`:"";return v("GET",`/tasks${o}`)},async getTask(t){return v("GET",`/tasks/${t}`)},async createTask(t){return v("POST","/tasks",t)},async updateTask(t,e){return v("PATCH",`/tasks/${t}`,e)},async reorder(t){return v("PATCH","/tasks/reorder",t)},async archiveTask(t){return v("POST",`/tasks/${t}/archive`)},async unarchiveTask(t){return v("POST",`/tasks/${t}/unarchive`)},async deleteTask(t){await v("DELETE",`/tasks/${t}`)}};function F(t,e){t.innerHTML=`
    <div class="app-login">
      <div class="login-card">
        <div class="logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <h1>Task Tracker</h1>
        <p style="text-align:center;color:var(--text-secondary);margin:0 0 24px 0;font-size:13px;">Sign in to continue</p>
        <form class="login-form" id="login-form">
          <div>
            <label for="email">Email</label>
            <input type="email" id="email" name="email" placeholder="you@example.com" autocomplete="email" required />
          </div>
          <div>
            <label for="password">Password</label>
            <input type="password" id="password" name="password" placeholder="••••••••" autocomplete="current-password" required />
          </div>
          <div class="login-error" id="login-error" style="display:none;"></div>
          <button type="submit" class="btn btn-primary btn-block" id="login-btn">Sign in</button>
        </form>
      </div>
    </div>
  `;const a=t.querySelector("#login-form"),o=t.querySelector("#email"),s=t.querySelector("#password"),r=t.querySelector("#login-error"),l=t.querySelector("#login-btn");a.addEventListener("submit",async i=>{i.preventDefault(),r.style.display="none",r.textContent="",l.disabled=!0,l.textContent="Signing in…";try{const{token:n}=await h.login(o.value.trim(),s.value);N(n),e()}catch(n){n instanceof m?r.textContent=n.statusCode===401?"Invalid email or password":"Something went wrong":r.textContent="Connection failed",r.style.display="block",l.disabled=!1,l.textContent="Sign in"}})}function V(t){return!t.due_date||t.status==="done"?!1:new Date(t.due_date)<new Date}function K(t){if(!t)return"";const e=new Date(t);return e.toLocaleDateString(void 0,{month:"short",day:"numeric",year:e.getFullYear()!==new Date().getFullYear()?"numeric":void 0})}let y=[],p=[],b=null,w=!1,T=null,L=null;function B(){return b?p.filter(t=>t.label===b):p}function S(t,e){const a=document.querySelector(".toast-container")||(()=>{const r=document.createElement("div");return r.className="toast-container",document.body.appendChild(r),r})();L!=null&&window.clearTimeout(L);const o="t"+Date.now(),s=document.createElement("div");s.className="toast",s.id=o,s.innerHTML=e?`<span>${t}</span><button type="button" class="toast-undo">Undo</button>`:`<span>${t}</span>`,a.appendChild(s),e&&s.querySelector(".toast-undo").addEventListener("click",()=>{e(),s.remove()}),L=window.setTimeout(()=>{s.remove(),L=null},4e3)}async function x(t){if(!w){w=!0,T=null,f(t);try{const[e,a]=await Promise.all([h.getLabels(),h.listTasks(!1)]);y=e,p=a}catch(e){if(e instanceof m&&e.isUnauthorized){u({name:"login"});return}T=e instanceof m?"Failed to load tasks":"Connection failed"}finally{w=!1,f(t)}}}async function G(t){const e=t.id;try{await h.archiveTask(e),p=p.filter(o=>o.id!==e),S("Archived",()=>Y(e))}catch{S("Failed to archive")}const a=document.getElementById("app-main");a&&f(a)}async function Y(t){try{p=[await h.unarchiveTask(t),...p];const a=document.getElementById("app-main");a&&f(a)}catch{S("Failed to restore")}}async function H(t){if(t.trim())try{const e=new Date;e.setDate(e.getDate()+7);const a=await h.createTask({title:t.trim(),due_date:e.toISOString()});p=[...p,a],f(document.getElementById("app-main"))}catch(e){if(e instanceof m&&e.isUnauthorized){u({name:"login"});return}S("Failed to add task")}}async function W(t,e){const a=B();if(t===e||e<0||e>=a.length)return;const o=a[t];a.splice(t,1),a.splice(e,0,o);const s=a.map((i,n)=>({id:i.id,sort_order:n})),r=new Map(p.map(i=>[i.id,i]));s.forEach(({id:i,sort_order:n})=>{const c=r.get(i);c&&(c.sort_order=n)}),p.sort((i,n)=>i.sort_order-n.sort_order);const l=document.getElementById("app-main");l&&f(l);try{await h.reorder(s)}catch{S("Failed to save order"),l&&x(l)}}function f(t){if(!w&&p.length===0&&y.length===0&&!T){x(t);return}const e=B(),a=i=>y.find(n=>n.slug===i)?.name??"",o=`${q}/apk/latest`;t.innerHTML=`
    <h1 class="page-title">Tasks</h1>
    <div class="add-task-bar">
      <input type="text" id="new-task-title" placeholder="Add a task…" />
      <button type="button" class="btn btn-primary" id="add-task-btn">Add</button>
      <a href="${o}" download class="get-app-link" title="Download Android app">Get the app</a>
    </div>
    <div class="filter-bar">
      <button type="button" class="filter-chip ${b===null?"active":""}" data-filter="">All</button>
      ${y.map(i=>`<button type="button" class="filter-chip ${b===i.slug?"active":""}" data-filter="${i.slug}">${i.name}</button>`).join("")}
    </div>
    <div id="tasks-content"></div>
    <div class="toast-container" id="toast-container"></div>
  `;const s=t.querySelector("#tasks-content"),r=t.querySelector("#new-task-title"),l=t.querySelector("#add-task-btn");if(w){s.innerHTML='<div class="loading"><div class="spinner"></div></div>';return}if(T){s.innerHTML=`
      <div class="error-state">
        <p>${T}</p>
        <button type="button" class="btn btn-secondary" id="retry-btn">Retry</button>
      </div>
    `,s.querySelector("#retry-btn").addEventListener("click",()=>x(t));return}if(e.length===0)s.innerHTML=`
      <div class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:64px;height:64px;">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <p>No tasks. Add one above or use the filter to see others.</p>
      </div>
    `;else{s.innerHTML=`
      <ul class="task-list" id="task-list"></ul>
    `;const i=s.querySelector("#task-list");e.forEach((n,c)=>{const d=document.createElement("li");d.className="task-row",d.dataset.taskId=n.id,d.dataset.index=String(c);const g=n.label?y.find(k=>k.slug===n.label):null;d.innerHTML=`
        <span class="drag-handle" data-index="${c}" title="Drag to reorder">⋮⋮</span>
        <span class="label-dot" style="background:${g?.color??"transparent"};${g?"":"visibility:hidden"}"></span>
        <div class="task-body">
          <p class="task-title">${C(n.title)}</p>
          ${n.label?`<p class="task-meta">${C(a(n.label))}</p>`:""}
        </div>
        <span class="task-due ${V(n)?"overdue":""}">${K(n.due_date)}</span>
        <div class="task-actions">
          <button type="button" class="archive-btn" title="Archive">Archive</button>
        </div>
      `,d.querySelector(".task-body").addEventListener("click",()=>u({name:"task-detail",id:n.id})),d.querySelector(".archive-btn").addEventListener("click",k=>{k.stopPropagation(),G(n)}),i.appendChild(d)}),j(i,(n,c)=>W(n,c))}t.querySelectorAll(".filter-chip").forEach(i=>{i.addEventListener("click",()=>{b=i.dataset.filter||null,f(t)})}),l.addEventListener("click",()=>{const i=r.value.trim();i&&H(i).then(()=>{r.value=""})}),r.addEventListener("keydown",i=>{if(i.key==="Enter"){const n=r.value.trim();n&&H(n).then(()=>{r.value=""})}})}function C(t){const e=document.createElement("div");return e.textContent=t,e.innerHTML}function j(t,e){let a=null,o=null;const s=()=>t.querySelectorAll(".task-row").length;function r(){t.querySelectorAll(".task-row.drop-target").forEach(n=>n.classList.remove("drop-target")),o=null}function l(n){if(o===n)return;r(),o=n;const c=t.querySelectorAll(".task-row");n>=0&&n<c.length&&c[n].classList.add("drop-target")}t.querySelectorAll(".task-row").forEach((n,c)=>{const d=n.querySelector(".drag-handle");d&&(d.setAttribute("draggable","true"),d.addEventListener("dragstart",g=>{a=c,g.dataTransfer.effectAllowed="move",g.dataTransfer.setData("text/plain",String(c)),n.classList.add("dragging")}),d.addEventListener("dragend",()=>{n.classList.remove("dragging"),a=null,r()}))}),t.addEventListener("dragover",n=>{n.preventDefault(),n.dataTransfer.dropEffect="move";const c=n.target.closest(".task-row");if(!c||a==null){r();return}const d=parseInt(c.getAttribute("data-index")??"-1",10);if(d===-1)return;const g=c.getBoundingClientRect(),k=g.top+g.height/2,O=n.clientY<k?d:d+1,D=Math.max(0,Math.min(O,s()));D!==a&&l(D)}),t.addEventListener("dragleave",n=>{t.contains(n.relatedTarget)||r()}),t.addEventListener("drop",n=>{if(n.preventDefault(),a==null)return;const c=o??a;r(),c!==a&&e(a,c)})}let A=null;function J(t,e){if(A?.id!==e&&(A=null),!A){t.innerHTML=`
    <div class="task-detail-page">
      <a href="#/tasks" id="back-link" style="display:inline-flex;align-items:center;gap:6px;color:var(--text-secondary);text-decoration:none;margin-bottom:16px;font-size:13px;">← Back to tasks</a>
      <div id="task-detail-content"></div>
    </div>
  `,t.querySelector("#back-link").addEventListener("click",s=>{s.preventDefault(),u({name:"tasks"})});const o=t.querySelector("#task-detail-content");o.innerHTML='<div class="loading"><div class="spinner"></div></div>';return}t.innerHTML=`
    <div class="task-detail-page">
      <a href="#/tasks" id="back-link" style="display:inline-flex;align-items:center;gap:6px;color:var(--text-secondary);text-decoration:none;margin-bottom:16px;font-size:13px;">← Back to tasks</a>
      <div id="task-detail-content"></div>
    </div>
  `,t.querySelector("#back-link").addEventListener("click",o=>{o.preventDefault(),u({name:"tasks"})});const a=t.querySelector("#task-detail-content");{a.innerHTML='<div class="loading"><div class="spinner"></div></div>';return}}function Q(t){t.innerHTML=`
    <h1 class="page-title">Archive</h1>
    <p style="color:var(--text-secondary);margin:0 0 20px 0;font-size:13px;">Archived tasks. Restore to move back to the main list.</p>
    <div id="archive-content"></div>
  `;const e=t.querySelector("#archive-content");{e.innerHTML='<div class="loading"><div class="spinner"></div></div>';return}}const X="1.0.1",Z=`${q}/apk/latest`;function tt(t){t.innerHTML=`
    <h1 class="page-title">Settings</h1>
    <div class="settings-section">
      <h2>About</h2>
      <p>Task Tracker web — version ${X}</p>
      <p><a href="${Z}" download class="link-download-apk">Download Android app (APK)</a></p>
    </div>
    <div class="settings-section">
      <h2>Account</h2>
      <p>Signed in. Sign out to use a different account.</p>
      <button type="button" class="btn btn-secondary" id="sign-out-btn">Sign out</button>
    </div>
  `,t.querySelector("#sign-out-btn").addEventListener("click",()=>{_(),u({name:"login"}),window.location.reload()})}const et='<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',nt='<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>',at='<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';function st(t,e){const a=P(),o=a.name==="tasks"||a.name==="task-detail",s=a.name==="archive",r=a.name==="settings";t.innerHTML=`
    <div class="app-shell">
      <aside class="app-sidebar">
        <nav>
          <a href="#/tasks" class="${o?"active":""}" data-route="tasks">${et} Tasks</a>
          <a href="#/archive" class="${s?"active":""}" data-route="archive">${nt} Archive</a>
          <a href="#/settings" class="${r?"active":""}" data-route="settings">${at} Settings</a>
        </nav>
      </aside>
      <main class="app-main" id="app-main"></main>
    </div>
  `;const l=t.querySelector("#app-main");switch(t.querySelectorAll("a[data-route]").forEach(i=>{i.addEventListener("click",n=>{n.preventDefault();const c=n.currentTarget.getAttribute("data-route");c==="tasks"?u({name:"tasks"}):c==="archive"?u({name:"archive"}):c==="settings"&&u({name:"settings"})})}),e.name){case"tasks":f(l);break;case"task-detail":J(l,e.id);break;case"archive":Q(l);break;case"settings":tt(l);break;default:f(l)}}function E(){const t=P();if(t.name==="login"){if(M()){u({name:"tasks"});return}F(document.getElementById("app"),()=>{u({name:"tasks"}),E()});return}if(!M()){u({name:"login"}),E();return}st(document.getElementById("app"),t)}z(E);E();
