// Add your Supabase project URL and anon/public key here. Never put a service-role key in this file.
const SUPABASE_URL = "PASTE_YOUR_SUPABASE_PROJECT_URL_HERE";
const SUPABASE_ANON_KEY = "PASTE_YOUR_SUPABASE_ANON_KEY_HERE";

const configured = SUPABASE_URL.startsWith("https://") && !SUPABASE_URL.includes("PASTE_") && !SUPABASE_ANON_KEY.includes("PASTE_");
const db = configured && window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const $ = (id) => document.getElementById(id);
let currentUser = null;
let bots = [];

$("year").textContent = new Date().getFullYear();
const loginModal = $("adminModal"), dashboardModal = $("dashboardModal");
function showModal(el){el.classList.add("open");el.setAttribute("aria-hidden","false")}
function hideModal(el){el.classList.remove("open");el.setAttribute("aria-hidden","true")}
document.querySelectorAll("[data-close]").forEach(el=>el.addEventListener("click",()=>{hideModal(loginModal);hideModal(dashboardModal)}));
$("adminOpen").addEventListener("click",()=>showModal(currentUser?dashboardModal:loginModal));
$("searchInput").addEventListener("input",renderBots);
$("categoryFilter").addEventListener("change",renderBots);

function setMessage(id,msg,ok=false){const el=$(id);el.textContent=msg;el.style.color=ok?"#42d392":"#ff737b"}
function safeUrl(value){try{const u=new URL(value);return ["http:","https:"].includes(u.protocol)?u.href:"#"}catch{return "#"}}
function escapeHtml(value=""){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}

async function loadBots(){
  if(!db){bots=[];renderBots();$("botGrid").innerHTML='<div class="empty-state">Connect your Supabase project to publish and manage bots.<br><br>Follow the setup guide included with this website.</div>';return}
  const {data,error}=await db.from("bots").select("*").eq("active",true).order("created_at",{ascending:false});
  if(error){$("botGrid").innerHTML='<div class="empty-state">Could not load bots. Check your Supabase setup.</div>';return}
  bots=data||[];populateCategories();renderBots();
}
function populateCategories(){
  const select=$("categoryFilter"),old=select.value;
  const categories=[...new Set(bots.map(b=>b.category).filter(Boolean))].sort();
  select.innerHTML='<option value="">All categories</option>'+categories.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  select.value=categories.includes(old)?old:"";
}
function renderBots(){
  const query=$("searchInput").value.trim().toLowerCase(),category=$("categoryFilter").value;
  const filtered=bots.filter(b=>(!category||b.category===category)&&(`${b.name} ${b.description} ${b.category||""}`).toLowerCase().includes(query));
  $("botCount").textContent=`${filtered.length} BOTS`;
  $("botGrid").innerHTML=filtered.length?filtered.map(b=>`<article class="bot-card"><div class="bot-image">${b.image_url?`<img src="${escapeHtml(safeUrl(b.image_url))}" alt="${escapeHtml(b.name)}" loading="lazy" onerror="this.remove()">`:'<span class="fallback">✦</span>'}</div><div class="bot-content"><div class="bot-meta"><span class="tag">${escapeHtml(b.category||"BOT")}</span><span class="live-dot"></span></div><h3>${escapeHtml(b.name)}</h3><p>${escapeHtml(b.description)}</p><a class="visit-link" href="${escapeHtml(safeUrl(b.link_url))}" target="_blank" rel="noopener noreferrer">OPEN BOT <span>↗</span></a></div></article>`).join(""):'<div class="empty-state">No bots found. Try another search.</div>';
}
$("loginForm").addEventListener("submit",async e=>{
  e.preventDefault();
  if(!db){setMessage("loginMessage","First connect Supabase using the included setup guide.");return}
  setMessage("loginMessage","Signing in...");
  const {data,error}=await db.auth.signInWithPassword({email:$("loginEmail").value.trim(),password:$("loginPassword").value});
  if(error){setMessage("loginMessage","Login failed. Check your email and password.");return}
  currentUser=data.user;hideModal(loginModal);$("loginForm").reset();await openDashboard();
});
async function openDashboard(){showModal(dashboardModal);await loadAdminBots()}
$("logoutButton").addEventListener("click",async()=>{if(db)await db.auth.signOut();currentUser=null;hideModal(dashboardModal)});
async function loadAdminBots(){
  if(!db)return;
  const {data,error}=await db.from("bots").select("*").order("created_at",{ascending:false});
  if(error){setMessage("dashboardMessage","Could not load admin list. Check admin permissions.");return}
  const rows=data||[];$("adminBotCount").textContent=`${rows.length} BOTS`;
  $("adminBotList").innerHTML=rows.length?rows.map(b=>`<div class="admin-row"><div><strong>${escapeHtml(b.name)}</strong><small>${escapeHtml(b.category||"Uncategorised")} · ${b.active?"Visible":"Hidden"}</small></div><div class="admin-actions"><button class="small-button" data-edit="${b.id}">Edit</button><button class="small-button danger" data-delete="${b.id}">Delete</button></div></div>`).join(""):'<div class="empty-state">No bots yet. Add your first bot above.</div>';
  $("adminBotList").querySelectorAll("[data-edit]").forEach(btn=>btn.addEventListener("click",()=>editBot(rows.find(b=>b.id===btn.dataset.edit))));
  $("adminBotList").querySelectorAll("[data-delete]").forEach(btn=>btn.addEventListener("click",()=>deleteBot(btn.dataset.delete)));
}
function editBot(b){$("botId").value=b.id;$("botName").value=b.name;$("botCategory").value=b.category||"";$("botDescription").value=b.description;$("botImage").value=b.image_url||"";$("botLink").value=b.link_url;$("botActive").checked=b.active;$("saveBotButton").textContent="Save changes";$("botName").focus()}
function clearBotForm(){$("botForm").reset();$("botId").value="";$("botActive").checked=true;$("saveBotButton").textContent="Add bot"}
$("cancelEditButton").addEventListener("click",clearBotForm);
$("botForm").addEventListener("submit",async e=>{
  e.preventDefault();if(!db||!currentUser)return;
  const id=$("botId").value;
  const payload={name:$("botName").value.trim(),category:$("botCategory").value.trim()||"General",description:$("botDescription").value.trim(),image_url:$("botImage").value.trim()||null,link_url:safeUrl($("botLink").value.trim()),active:$("botActive").checked};
  if(payload.link_url==="#"){setMessage("dashboardMessage","Please enter a valid https:// or http:// bot link.");return}
  const result=id?await db.from("bots").update(payload).eq("id",id):await db.from("bots").insert(payload);
  if(result.error){setMessage("dashboardMessage","Could not save bot. Check database permissions.");return}
  setMessage("dashboardMessage",id?"Bot updated successfully.":"Bot added successfully.",true);clearBotForm();await loadAdminBots();await loadBots();
});
async function deleteBot(id){
  if(!confirm("Delete this bot permanently?"))return;
  const {error}=await db.from("bots").delete().eq("id",id);
  if(error){setMessage("dashboardMessage","Could not delete bot. Check admin permissions.");return}
  setMessage("dashboardMessage","Bot deleted.",true);await loadAdminBots();await loadBots();
}
async function restoreSession(){
  if(!db)return;
  const {data}=await db.auth.getSession();
  if(data.session){currentUser=data.session.user;await openDashboard()}
}
loadBots();restoreSession();
