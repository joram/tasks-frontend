(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))i(s);new MutationObserver(s=>{for(const a of s)if(a.type==="childList")for(const o of a.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&i(o)}).observe(document,{childList:!0,subtree:!0});function n(s){const a={};return s.integrity&&(a.integrity=s.integrity),s.referrerPolicy&&(a.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?a.credentials="include":s.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function i(s){if(s.ep)return;s.ep=!0;const a=n(s);fetch(s.href,a)}})();const ee="auth_token";function fe(){return localStorage.getItem(ee)}function Le(e){localStorage.setItem(ee,e)}function me(){localStorage.removeItem(ee)}function ce(){return fe()!=null}function Te(){const e=window.location.hash.slice(1)||"/";return e.startsWith("/")?e:`/${e}`}function X(){const e=Te(),t=e.split("/").filter(Boolean);return t[0]==="tasks"&&t[1]?{name:"task-detail",id:t[1]}:t[0]==="tasks"?{name:"tasks"}:t[0]==="archive"?{name:"archive"}:t[0]==="settings"?{name:"settings"}:t[0]==="envvars"?{name:"envvars"}:t[0]==="login"||e==="/"||e===""?{name:"login"}:{name:"tasks"}}function w(e){let t="/";switch(e.name){case"login":t="/login";break;case"tasks":t="/tasks";break;case"task-detail":t=`/tasks/${e.id}`;break;case"archive":t="/archive";break;case"settings":t="/settings";break;case"envvars":t="/envvars";break}window.location.hash=t}function $e(e){window.addEventListener("hashchange",e),e()}const xe={},Y=xe?.VITE_API_URL??"/api";class x extends Error{constructor(t,n,i){super(n),this.statusCode=t,this.body=i,this.name="ApiError"}get isUnauthorized(){return this.statusCode===401}}async function k(e,t,n){const i=t.startsWith("http")?t:`${Y}${t}`,s={"Content-Type":"application/json"},a=fe();a&&(s.Authorization=`Bearer ${a}`);const o=await fetch(i,{method:e,headers:s,body:n!=null?JSON.stringify(n):void 0});if(o.status===401)throw me(),new x(401,"Unauthorized");const r=await o.text();if(!o.ok)throw new x(o.status,o.statusText,r);if(r.length!==0)try{return JSON.parse(r)}catch{return}}const y={async login(e,t){return k("POST","/auth/login",{email:e,password:t})},async register(e,t){return k("POST","/auth/register",{email:e,password:t})},async changePassword(e,t){return k("POST","/auth/change-password",{current_password:e,new_password:t})},async getApkVersions(){return k("GET","/apk/versions")},async listLists(){return k("GET","/lists")},async createList(e){return k("POST","/lists",{name:e})},async updateList(e,t){return k("PATCH",`/lists/${e}`,{name:t})},async listListMembers(e){return k("GET",`/lists/${e}/members`)},async addListMember(e,t){return k("POST",`/lists/${e}/members`,{email:t})},async removeListMember(e,t){await k("DELETE",`/lists/${e}/members/${t}`)},async deleteList(e){await k("DELETE",`/lists/${e}`)},async listTasks(e,t=!1){const n=new URLSearchParams({list_id:e});return t&&n.set("archived","true"),k("GET",`/tasks?${n}`)},async getTask(e){return k("GET",`/tasks/${e}`)},async createTask(e,t){return k("POST","/tasks",{list_id:e,...t})},async updateTask(e,t){return k("PATCH",`/tasks/${e}`,t)},async reorder(e){return k("PATCH","/tasks/reorder",e)},async archiveTask(e){return k("POST",`/tasks/${e}/archive`)},async unarchiveTask(e){return k("POST",`/tasks/${e}/unarchive`)},async deleteTask(e){await k("DELETE",`/tasks/${e}`)}};function _e(e,t){let n="login";function i(){const s=n==="register";e.innerHTML=`
    <div class="app-login">
      <div class="login-card">
        <div class="logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <h1>Task Tracker</h1>
        <p style="text-align:center;color:var(--text-secondary);margin:0 0 24px 0;font-size:13px;">
          ${s?"Create an account to get started":"Sign in to continue"}
        </p>
        <form class="login-form" id="auth-form">
          <div>
            <label for="email">Email</label>
            <input type="email" id="email" name="email" placeholder="you@example.com" autocomplete="email" required />
          </div>
          <div>
            <label for="password">Password</label>
            <input type="password" id="password" name="password" placeholder="••••••••" autocomplete="${s?"new-password":"current-password"}" required minlength="${s?"8":"0"}" />
            ${s?'<p style="font-size:12px;color:var(--text-secondary);margin:4px 0 0 0;">At least 8 characters</p>':""}
          </div>
          <div class="login-error" id="login-error" style="display:none;"></div>
          <button type="submit" class="btn btn-primary btn-block" id="auth-btn">${s?"Create account":"Sign in"}</button>
        </form>
        <p style="text-align:center;margin:16px 0 0 0;font-size:13px;">
          <button type="button" class="link-btn" id="toggle-mode">${s?"Already have an account? Sign in":"Don't have an account? Create one"}</button>
        </p>
      </div>
    </div>
  `;const a=e.querySelector("#auth-form"),o=e.querySelector("#email"),r=e.querySelector("#password"),l=e.querySelector("#login-error"),c=e.querySelector("#auth-btn");e.querySelector("#toggle-mode").addEventListener("click",()=>{n=n==="login"?"register":"login",i()}),a.addEventListener("submit",async u=>{u.preventDefault(),l.style.display="none",l.textContent="",c.disabled=!0,c.textContent=s?"Creating…":"Signing in…";try{const f=s?await y.register(o.value.trim(),r.value):await y.login(o.value.trim(),r.value);Le(f.token),t()}catch(f){f instanceof x?f.statusCode===401?l.textContent="Invalid email or password":f.statusCode===409?l.textContent="That email is already registered":l.textContent=f.body||"Something went wrong":l.textContent="Connection failed",l.style.display="block",c.disabled=!1,c.textContent=s?"Create account":"Sign in"}})}i()}const Ce={BASE_URL:"/",DEV:!1,MODE:"production",PROD:!0,SSR:!1};function he(e){const n=Object.entries(Ce??{}).sort(([i],[s])=>i.localeCompare(s)).map(([i,s])=>{const a=s===void 0?"<em>undefined</em>":String(s);return`<tr><td class="envvars-key">${i}</td><td class="envvars-val">${a}</td></tr>`}).join("");e.innerHTML=`
    <h1 class="page-title">Environment Variables</h1>
    <div class="settings-section">
      <p>Variables visible to the frontend at build time (<code>import.meta.env</code>).</p>
      ${n.length>0?`
        <table class="envvars-table">
          <thead><tr><th>Variable</th><th>Value</th></tr></thead>
          <tbody>${n}</tbody>
        </table>
      `:"<p>No environment variables found.</p>"}
    </div>
  `}function Ae(e){return!e.due_date||e.status==="done"?!1:new Date(e.due_date)<new Date}function qe(e){if(!e)return"";const t=new Date(e);return t.toLocaleDateString(void 0,{month:"short",day:"numeric",year:t.getFullYear()!==new Date().getFullYear()?"numeric":void 0})}const U="task_tracker_current_list_id",j=["#7C3AED","#2563EB","#0891B2","#059669","#D97706","#DB2777","#DC2626","#EA580C"];function Ie(e){return`${parseInt(e.slice(1,3),16)}, ${parseInt(e.slice(3,5),16)}, ${parseInt(e.slice(5,7),16)}`}let _=[],b=null,T=[],B=!1,ge=!1,F=null,R=null;const P=new Set;let V=null,K=null;function ye(){return{lists:_,currentListId:b}}function De(e,t){const n=_.findIndex(i=>i.id===e);n>=0&&(_[n]={..._[n],name:t})}async function Me(e){if(e!==b){b=e;try{sessionStorage.setItem(U,e)}catch{}try{T=await y.listTasks(e,!1)}catch(t){if(t instanceof x&&t.isUnauthorized){w({name:"login"});return}T=[]}K?.()}}async function Pe(e){try{const t=await y.createList(e.trim());_=[..._,t],b=t.id;try{sessionStorage.setItem(U,t.id)}catch{}T=await y.listTasks(t.id,!1),K?.()}catch(t){if(t instanceof x&&t.isUnauthorized){w({name:"login"});return}throw new Error("Failed to create list")}}function J(){return T}function N(e){const t=new Map;for(const s of e){const a=s.parent_id??null;t.has(a)||t.set(a,[]),t.get(a).push(s)}for(const s of t.values())s.sort((a,o)=>a.sort_order-o.sort_order||a.created_at.localeCompare(o.created_at));const n=[];function i(s,a){const o=t.get(s)??[];for(const r of o)n.push({task:r,depth:a}),i(r.id,a+1)}return i(null,0),n}function Be(e){const t=new Map;for(const n of e){const i=n.parent_id??null;t.has(i)||t.set(i,[]),t.get(i).push(n)}return t}function be(e,t){const n=e.get(t)??[];let i=n.length;for(const s of n)i+=be(e,s.id);return i}function He(e,t){const n=N(e),i=[];for(let s=0;s<n.length;s++){const{task:a}=n[s];let o=!1,r=a.parent_id;for(;r!=null;){if(t.has(r)){o=!0;break}r=e.find(c=>c.id===r)?.parent_id??null}o||i.push({...n[s],fullIndex:s})}return i}function A(e,t){const n=document.querySelector(".toast-container")||(()=>{const a=document.createElement("div");return a.className="toast-container",document.body.appendChild(a),a})();R!=null&&window.clearTimeout(R);const i="t"+Date.now(),s=document.createElement("div");s.className="toast",s.id=i,s.innerHTML=t?`<span>${e}</span><button type="button" class="toast-undo">Undo</button>`:`<span>${e}</span>`,n.appendChild(s),t&&s.querySelector(".toast-undo").addEventListener("click",()=>{t(),s.remove()}),R=window.setTimeout(()=>{s.remove(),R=null},4e3)}async function Z(e){if(!B){B=!0,F=null;try{const t=await y.listLists();if(_=Array.isArray(t)?t:[],_.length===0&&(_=[await y.createList("Default")]),b=b&&_.some(n=>n.id===b)?b:_[0]?.id??null,b){try{sessionStorage.setItem(U,b)}catch{}T=await y.listTasks(b,!1)}else T=[]}catch(t){if(t instanceof x&&t.isUnauthorized){B=!1,w({name:"login"});return}F=t instanceof x?"Failed to load tasks":"Connection failed"}finally{B=!1,ge=!0,K?.();const t=document.getElementById("app-main");q(t||e)}}}async function Oe(e){if(T.some(s=>s.parent_id===e.id)){A("Archive all subtasks first");return}const n=e.id;try{await y.archiveTask(n),T=T.filter(s=>s.id!==n),A("Archived",()=>Ne(n))}catch{A("Failed to archive")}const i=document.getElementById("app-main");i&&q(i)}async function Ne(e){try{T=[await y.unarchiveTask(e),...T];const n=document.getElementById("app-main");n&&q(n)}catch{A("Failed to restore")}}async function ue(e){if(!(!e.trim()||!b))try{const t=new Date;t.setDate(t.getDate()+7);const n=await y.createTask(b,{title:e.trim(),due_date:t.toISOString()});if(T=[...T,n],V!=null){const i=N(T),s=i.findIndex(({task:o})=>o.id===V),a=i.findIndex(({task:o})=>o.id===n.id);if(s>=0&&a>=0&&a!==s+1){const o=i.map(E=>({...E})),[r]=o.splice(a,1),l=s+1,c=a<l?l-1:l;o.splice(c,0,r);const u=(c>0?o[c-1].task:null)?.parent_id??null,f=T.find(E=>E.id===n.id);f&&(f.parent_id=u),o.forEach(({task:E},v)=>{E.sort_order=v});const g=o.map(({task:E},v)=>({id:E.id,sort_order:v,...E.id===n.id?{parent_id:u}:{}}));try{await y.reorder(g)}catch{A("Failed to reorder new task")}}}V=n.id,q(document.getElementById("app-main"))}catch(t){if(t instanceof x&&t.isUnauthorized){w({name:"login"});return}A("Failed to add task")}}async function G(e,t,n=null){const i=J(),s=N(i);if(t<0||t>s.length||e===t&&n==null)return;const a=s.map(d=>({...d})),[o]=a.splice(e,1),r=e<t?t-1:t;a.splice(r,0,o);const l=o.task,c=r>0?a[r-1].task:null,h=c!==null&&c.parent_id==null,u=r===0?null:n==="indent"&&h?c.id:c?.parent_id??null,f=T.find(d=>d.id===l.id);f&&(f.parent_id=u);const g=N(J());g.forEach(({task:d},m)=>{d.sort_order=m});const E=g.map(({task:d},m)=>({id:d.id,sort_order:m,...d.id===l.id?{parent_id:u}:{}})),v=document.getElementById("app-main");v&&q(v);try{await y.reorder(E),V=l.id}catch{A("Failed to save order"),v&&Z(v)}}function Re(){try{return sessionStorage.getItem(U)}catch{return null}}async function te(){const e=document.getElementById("share-members-list");if(!(!b||!e))try{const t=await y.listListMembers(b);e.innerHTML=t.map(n=>`<li><span>${ne(n.email)}</span> <button type="button" class="btn btn-sm link-btn share-remove-btn" data-user-id="${n.user_id}">Remove</button></li>`).join(""),e.querySelectorAll(".share-remove-btn").forEach(n=>{n.addEventListener("click",async()=>{const i=n.dataset.userId;try{await y.removeListMember(b,i),te()}catch{A("Failed to remove member")}})})}catch{e.innerHTML="<li>Failed to load members</li>"}}function Ve(){const e=document.getElementById("list-share-panel");if(!e)return;const t=e.style.display!=="none";if(e.style.display=t?"none":"block",!t){const n=document.getElementById("share-error");n&&(n.style.display="none"),te()}}function q(e,t){if(K=t?.onListsChange??null,b==null&&_.length===0){const r=Re();r&&(b=r)}if(!ge){Z(e);const r=document.getElementById("app-main");r&&(r.innerHTML=`
        <h1 class="page-title">Tasks</h1>
        <div id="tasks-content"><div class="loading"><div class="spinner"></div></div></div>
      `);return}const n=J();e.innerHTML=`
    <h1 class="page-title">Tasks</h1>
    <div class="list-share-panel" id="list-share-panel" style="display:none;">
      <p class="list-share-title">Share this list</p>
      <div class="list-share-add">
        <input type="email" id="share-email-input" placeholder="Email address" />
        <button type="button" class="btn btn-primary btn-sm" id="share-add-btn">Add</button>
      </div>
      <p class="list-share-error" id="share-error" style="display:none;"></p>
      <ul class="list-share-members" id="share-members-list"></ul>
    </div>
    <div class="add-task-bar">
      <input type="text" id="new-task-title" placeholder="Add a task…" />
      <button type="button" class="btn btn-primary" id="add-task-btn">Add</button>
    </div>
    <div id="tasks-content"></div>
    <div class="toast-container" id="toast-container"></div>
  `;const i=e.querySelector("#tasks-content"),s=e.querySelector("#new-task-title"),a=e.querySelector("#add-task-btn");if(B){i.innerHTML='<div class="loading"><div class="spinner"></div></div>';return}if(F){i.innerHTML=`
      <div class="error-state">
        <p>${F}</p>
        <button type="button" class="btn btn-secondary" id="retry-btn">Retry</button>
      </div>
    `,i.querySelector("#retry-btn").addEventListener("click",()=>{const r=document.getElementById("app-main");Z(r??e)});return}if(n.length===0)i.innerHTML=`
      <div class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:64px;height:64px;">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <p>No tasks. Add one above.</p>
      </div>
    `;else{const r=Be(n),l=N(n),c=He(n,P),h=new Map;let u=0;l.forEach(({task:d})=>{d.parent_id==null&&!h.has(d.id)&&h.set(d.id,j[u++%j.length])});const f=24;i.innerHTML=`
      <ul class="task-list" id="task-list"></ul>
    `;const g=i.querySelector("#task-list");c.forEach(({task:d,depth:m,fullIndex:p},C)=>{const S=r.get(d.id)??[],W=be(r,d.id),I=P.has(d.id),M=d.parent_id==null?h.get(d.id):h.get(d.parent_id)??j[0],se=Ie(M),ae=d.parent_id!=null,L=document.createElement("li");L.className="task-row",L.dataset.taskId=d.id,L.dataset.index=String(C),L.dataset.fullIndex=String(p),L.style.marginLeft=`${f*m}px`,L.style.paddingLeft="16px",L.style.background=`rgba(${se}, ${ae?.06:.12})`,L.style.borderLeftColor=ae?`rgba(${se}, 0.5)`:M,L.style.borderLeftWidth="3px";const we=S.length>0?`<button type="button" class="task-collapse" title="${I?"Expand":"Collapse"}" aria-label="${I?"Expand":"Collapse"}">${I?"▶":"▼"}</button>${I?`<span class="task-collapse-count">${W}</span>`:""}`:"",Se=d.parent_id!=null,re=p>0?l[p-1].task:null,ie=re!==null&&re.parent_id==null,Ee=Se?'<span class="task-indent-outdent"><button type="button" class="task-outdent-btn" title="Outdent" aria-label="Outdent">‹</button></span>':`<span class="task-indent-outdent"><button type="button" class="task-indent-btn" title="Indent" aria-label="Indent" ${ie?"":"disabled"}>›</button></span>`;L.innerHTML=`
        ${Ee}
        <span class="drag-handle" data-index="${C}" data-full-index="${p}" title="Drag to reorder; drag right to indent, left to outdent">⋮⋮</span>
        ${we}
        <div class="task-body">
          <p class="task-title">${ne(d.title)}</p>
        </div>
        <span class="task-due ${Ae(d)?"overdue":""}">${qe(d.due_date)}</span>
        <div class="task-actions">
          <button type="button" class="archive-btn" title="Archive">Archive</button>
        </div>
      `,L.querySelector(".task-body").addEventListener("click",()=>w({name:"task-detail",id:d.id})),L.querySelector(".archive-btn").addEventListener("click",D=>{D.stopPropagation(),Oe(d)});const oe=L.querySelector(".task-collapse");oe&&oe.addEventListener("click",D=>{D.stopPropagation(),P.has(d.id)?P.delete(d.id):P.add(d.id),q(e)});const le=L.querySelector(".task-outdent-btn");le&&le.addEventListener("click",D=>{D.stopPropagation(),G(p,p,"outdent")});const de=L.querySelector(".task-indent-btn");de&&ie&&de.addEventListener("click",D=>{D.stopPropagation(),G(p,p,"indent")}),g.appendChild(L)});const E=document.createElement("li");E.className="task-list-drop-sentinel",E.id="task-list-bottom-drop",g.appendChild(E);const v=d=>(r.get(d)?.length??0)>0;Fe(g,(d,m,p)=>G(d,m,p),c,l.length,f,v)}if(e.querySelector("#list-share-panel")){const r=e.querySelector("#share-email-input"),l=e.querySelector("#share-add-btn"),c=e.querySelector("#share-error");l&&r&&c&&l.addEventListener("click",async()=>{const h=r.value.trim();if(!(!h||!b)){c.style.display="none";try{await y.addListMember(b,h),r.value="",te()}catch(u){const f=u instanceof x&&u.body?(()=>{try{return JSON.parse(u.body).error??u.message}catch{return u.message}})():u.message;c.textContent=f,c.style.display="block"}}})}a.addEventListener("click",()=>{const r=s.value.trim();r&&ue(r).then(()=>{s.value=""})}),s.addEventListener("keydown",r=>{if(r.key==="Enter"){r.preventDefault();const l=s.value.trim();l&&ue(l).then(()=>{s.value=""})}})}function ne(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}const pe=24;function Fe(e,t,n,i,s,a){let o=null,r=null,l=0;const c=()=>e.querySelectorAll(".task-row").length,h=()=>e.querySelector(".task-list-drop-sentinel");let u=null;function f(){u&&u.parentNode&&u.remove(),r=null}function g(v){if(r===v)return;f(),r=v;const d=v<n.length?n[v].depth:0;u||(u=document.createElement("li"),u.className="drop-indicator",u.setAttribute("aria-hidden","true")),u.style.marginLeft=`${s*d}px`;const m=e.querySelectorAll(".task-row"),p=v<m.length?m[v]:h();p&&e.insertBefore(u,p)}e.querySelectorAll(".task-row").forEach((v,d)=>{const m=v.querySelector(".drag-handle");m&&(m.setAttribute("draggable","true"),m.addEventListener("dragstart",p=>{o=d,l=p.clientX,p.dataTransfer.effectAllowed="move",p.dataTransfer.setData("text/plain",String(d)),v.classList.add("drag-source-placeholder")}),m.addEventListener("dragend",()=>{v.classList.remove("drag-source-placeholder"),o=null,f()}))}),e.addEventListener("dragover",v=>{if(v.preventDefault(),v.dataTransfer.dropEffect="move",o==null){f();return}if(v.target.closest(".task-list-drop-sentinel")){const M=c();M!==o&&g(M);return}const m=v.target.closest(".task-row");if(!m){f();return}const p=parseInt(m.getAttribute("data-index")??"-1",10);if(p===-1)return;const C=m.getBoundingClientRect(),S=C.top+C.height/2,W=v.clientY<S?p:p+1,I=Math.max(0,Math.min(W,c()));I!==o&&g(I)}),e.addEventListener("dragleave",v=>{e.contains(v.relatedTarget)||f()}),e.addEventListener("drop",v=>{if(v.preventDefault(),o==null)return;const d=r??o,m=n[o]?.fullIndex??o,p=d>=n.length?i:n[d]?.fullIndex??d,C=n[o]?.task;let S=v.clientX-l>pe?"indent":v.clientX-l<-pe?"outdent":null;C&&a(C.id)&&S==="indent"&&(S=null),f(),(m!==p||S!==null)&&t(m,p,S)})}let $=null,H=!1,O=null;async function ze(e,t){H=!0,O=null,Q(e,t);try{$=await y.getTask(t)}catch(n){if(n instanceof x&&n.isUnauthorized){w({name:"login"});return}$=null,O=n instanceof x&&n.statusCode===404?"Task not found":"Failed to load task"}finally{H=!1,Q(e,t)}}function ve(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}function Q(e,t){if($?.id!==t&&($=null),!$){t&&!H&&ze(e,t),e.innerHTML=`
    <div class="task-detail-page">
      <a href="#/tasks" id="back-link" style="display:inline-flex;align-items:center;gap:6px;color:var(--text-secondary);text-decoration:none;margin-bottom:16px;font-size:13px;">← Back to tasks</a>
      <div id="task-detail-content"></div>
    </div>
  `,e.querySelector("#back-link").addEventListener("click",h=>{h.preventDefault(),w({name:"tasks"})});const c=e.querySelector("#task-detail-content");H?c.innerHTML='<div class="loading"><div class="spinner"></div></div>':c.innerHTML=`<div class="error-state"><p>${O??"Not found"}</p><button type="button" class="btn btn-secondary" onclick="location.hash='#/tasks'">Back to list</button></div>`;return}e.innerHTML=`
    <div class="task-detail-page">
      <a href="#/tasks" id="back-link" style="display:inline-flex;align-items:center;gap:6px;color:var(--text-secondary);text-decoration:none;margin-bottom:16px;font-size:13px;">← Back to tasks</a>
      <div id="task-detail-content"></div>
    </div>
  `,e.querySelector("#back-link").addEventListener("click",c=>{c.preventDefault(),w({name:"tasks"})});const n=e.querySelector("#task-detail-content");if(H){n.innerHTML='<div class="loading"><div class="spinner"></div></div>';return}if(O||!$){n.innerHTML=`
      <div class="error-state">
        <p>${O??"Not found"}</p>
        <button type="button" class="btn btn-secondary" onclick="location.hash='#/tasks'">Back to list</button>
      </div>
    `;return}const i=$.due_date?$.due_date.slice(0,10):"";n.innerHTML=`
    <div class="task-detail-card">
      <div class="field">
        <div class="field-label">Title</div>
        <input type="text" id="detail-title" value="${ve($.title)}" />
      </div>
      <div class="field">
        <div class="field-label">Status</div>
        <div class="status-group">
          <label><input type="radio" name="status" value="pending" ${$.status==="pending"?"checked":""} /><span>Pending</span></label>
          <label><input type="radio" name="status" value="in_progress" ${$.status==="in_progress"?"checked":""} /><span>In progress</span></label>
          <label><input type="radio" name="status" value="done" ${$.status==="done"?"checked":""} /><span>Done</span></label>
        </div>
      </div>
      <div class="field">
        <div class="field-label">Due date</div>
        <input type="date" id="detail-due" value="${i}" />
      </div>
      <div class="field">
        <div class="field-label">Description</div>
        <textarea id="detail-desc" placeholder="Optional">${ve($.description||"")}</textarea>
      </div>
      <div class="detail-actions">
        <button type="button" class="btn btn-outline-archive" id="detail-archive">Archive task</button>
      </div>
    </div>
  `;const s=n.querySelector("#detail-title"),a=n.querySelectorAll('input[name="status"]'),o=n.querySelector("#detail-due"),r=n.querySelector("#detail-desc"),l=async()=>{const c=n.querySelector('input[name="status"]:checked')?.value;try{$=await y.updateTask(t,{title:s.value.trim()||$.title,description:r.value.trim()||void 0,status:c,due_date:o.value?new Date(o.value).toISOString():null})}catch(h){h instanceof x&&h.isUnauthorized&&w({name:"login"})}};s.addEventListener("blur",l),a.forEach(c=>c.addEventListener("change",l)),o.addEventListener("change",l),r.addEventListener("blur",l),n.querySelector("#detail-archive").addEventListener("click",async()=>{try{await y.archiveTask(t),w({name:"tasks"})}catch(c){c instanceof x&&c.isUnauthorized&&w({name:"login"})}})}function Ue(e){e.innerHTML=`
    <h1 class="page-title">Archive</h1>
    <p style="color:var(--text-secondary);margin:0 0 20px 0;font-size:13px;">Archived tasks. Restore to move back to the main list.</p>
    <div id="archive-content"></div>
  `;const t=e.querySelector("#archive-content");{t.innerHTML='<div class="loading"><div class="spinner"></div></div>';return}}const Ke="1.0.14";function We(e){e.innerHTML=`
    <h1 class="page-title">Settings</h1>
    <div class="settings-section">
      <h2>About</h2>
      <p>Task Tracker web — version ${Ke}</p>
      <p><a href="${Y}/apk/latest" download class="link-download-apk" id="apk-download-link">Download Android app (APK)</a></p>
    </div>
    <div class="settings-section">
      <h2>Account</h2>
      <p>Signed in. Sign out to use a different account.</p>
      <button type="button" class="btn btn-secondary" id="sign-out-btn">Sign out</button>
    </div>
    <div class="settings-section">
      <h2>Change password</h2>
      <form class="login-form" id="change-password-form">
        <label for="current-password">Current password</label>
        <input type="password" id="current-password" name="current_password" required autocomplete="current-password" placeholder="Current password">
        <label for="new-password">New password</label>
        <input type="password" id="new-password" name="new_password" required minlength="8" autocomplete="new-password" placeholder="At least 8 characters">
        <label for="confirm-password">Confirm new password</label>
        <input type="password" id="confirm-password" name="confirm_password" required minlength="8" autocomplete="new-password" placeholder="Confirm new password">
        <div class="login-error" id="change-password-error" style="display:none;"></div>
        <button type="submit" class="btn btn-primary" id="change-password-btn">Update password</button>
      </form>
    </div>
  `,y.getApkVersions().then(s=>{if(s.latest){const a=e.querySelector("#apk-download-link");a&&(a.href=`${Y}/apk/v/${s.latest}`)}}).catch(()=>{}),e.querySelector("#sign-out-btn").addEventListener("click",()=>{me(),w({name:"login"}),window.location.reload()});const t=e.querySelector("#change-password-form"),n=e.querySelector("#change-password-error"),i=e.querySelector("#change-password-btn");t.addEventListener("submit",async s=>{s.preventDefault();const a=t.querySelector("#current-password").value,o=t.querySelector("#new-password").value,r=t.querySelector("#confirm-password").value;if(n.style.display="none",n.textContent="",o!==r){n.textContent="New password and confirmation do not match.",n.style.display="block";return}if(o.length<8){n.textContent="New password must be at least 8 characters.",n.style.display="block";return}i.disabled=!0;try{await y.changePassword(a,o),t.querySelector("#current-password").value="",t.querySelector("#new-password").value="",t.querySelector("#confirm-password").value="",n.textContent="",n.style.display="none";const l=document.createElement("p");l.className="login-error",l.style.color="var(--color-success, green)",l.textContent="Password updated.",t.appendChild(l),setTimeout(()=>l.remove(),3e3)}catch(l){let c=l.message;if(l instanceof x&&l.body)try{const h=JSON.parse(l.body);h.error&&(c=h.error)}catch{}n.textContent=c,n.style.display="block"}finally{i.disabled=!1}})}const je='<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',Ge='<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>',Xe='<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';function Ye(){const{lists:e,currentListId:t}=ye(),n=t?e.find(a=>a.id===t)?.role:null;return`
    <div class="sidebar-lists">
      <div class="sidebar-lists-title">Lists</div>
      <div class="sidebar-lists-items">${e.map(a=>`<button type="button" class="sidebar-list-item ${a.id===t?"active":""}" data-list-id="${a.id}">${ne(a.name)}${a.role==="member"?" (Shared)":""}</button>`).join("")}</div>
      <button type="button" class="sidebar-list-item sidebar-list-new" id="sidebar-new-list-btn">+ List</button>
      ${t&&n==="owner"?'<button type="button" class="sidebar-list-item" id="sidebar-share-btn">Share</button>':""}
    </div>`}function ke(e,t){const n=X(),i=n.name==="tasks"||n.name==="task-detail",s=n.name==="archive",a=n.name==="settings",o=n.name==="envvars";e.innerHTML=`
    <div class="app-shell">
      <aside class="app-sidebar">
        <nav>
          <a href="#/tasks" class="${i?"active":""}" data-route="tasks">${je} Tasks</a>
          <a href="#/archive" class="${s?"active":""}" data-route="archive">${Ge} Archive</a>
          <a href="#/settings" class="${a?"active":""}" data-route="settings">${Xe} Settings</a>
          <a href="#/envvars" class="${o?"active":""}" data-route="envvars">Env Vars</a>
        </nav>
        ${Ye()}
      </aside>
      <main class="app-main" id="app-main"></main>
    </div>
  `;const r=e.querySelector("#app-main"),l=()=>ke(e,X());e.querySelectorAll("a[data-route]").forEach(u=>{u.addEventListener("click",f=>{f.preventDefault();const g=f.currentTarget.getAttribute("data-route");g==="tasks"?w({name:"tasks"}):g==="archive"?w({name:"archive"}):g==="settings"?w({name:"settings"}):g==="envvars"&&w({name:"envvars"})})}),e.querySelectorAll(".sidebar-list-item[data-list-id]").forEach(u=>{const f=u.dataset.listId;let g=null;u.addEventListener("click",()=>{g==null&&(g=window.setTimeout(async()=>{g=null,await Me(f),l()},250))}),u.addEventListener("dblclick",E=>{E.preventDefault(),g!=null&&(window.clearTimeout(g),g=null);const{lists:v}=ye(),d=v.find(S=>S.id===f);if(!d)return;const m=d.role==="member"?" (Shared)":"",p=document.createElement("input");p.type="text",p.className="list-chip-edit",p.value=d.name,p.style.cssText="width:100%;min-width:4em;padding:2px 6px;font:inherit;border:1px solid;border-radius:4px;background:var(--bg-elevated, #333);color:inherit;",u.replaceChildren(p),p.focus(),p.select();const C=async()=>{const S=p.value.trim();if(!S||S===d.name){u.textContent=d.name+m;return}try{await y.updateList(f,S),De(f,S),l()}catch{A("Failed to rename list"),u.textContent=d.name+m}};p.addEventListener("blur",C),p.addEventListener("keydown",S=>{S.key==="Enter"&&(S.preventDefault(),p.blur())})})});const c=e.querySelector("#sidebar-new-list-btn");c&&c.addEventListener("click",async()=>{const u=window.prompt("New list name","My list");if(u?.trim())try{await Pe(u.trim()),l()}catch{A("Failed to create list")}});const h=e.querySelector("#sidebar-share-btn");switch(h&&h.addEventListener("click",()=>Ve()),t.name){case"tasks":q(r,{onListsChange:l});break;case"task-detail":Q(r,t.id);break;case"archive":Ue(r);break;case"settings":We(r);break;case"envvars":he(r);break;default:q(r,{onListsChange:l})}}function z(){const e=X();if(e.name==="login"){if(ce()){w({name:"tasks"});return}_e(document.getElementById("app"),()=>{w({name:"tasks"}),z()});return}if(e.name==="envvars"){he(document.getElementById("app"));return}if(!ce()){w({name:"login"}),z();return}ke(document.getElementById("app"),e)}$e(z);z();
