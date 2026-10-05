const state={articles:[],categories:[]};
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];

async function loadJSON(path){
  const r=await fetch(path,{cache:'no-store'});
  if(!r.ok) throw new Error(path);
  return r.json();
}
const articleUrl=id=>`viewer.html?id=${encodeURIComponent(id)}`;
const categoryUrl=id=>`category.html?id=${encodeURIComponent(id)}`;

function searchableText(a){
  return [a.title,a.subtitle,a.summary,...(a.tags||[])].join(' ').toLowerCase();
}
function articleRow(a,i=0){
  return `<a class="article" href="${articleUrl(a.id)}">
    <div class="article-index">${String(i+1).padStart(2,'0')}</div>
    <div>
      <div class="article-title">${a.title}</div>
      <div class="article-meta">${a.subtitle||a.summary||''}<br>${(a.tags||[]).map(t=>`#${t}`).join(' · ')}</div>
    </div>
    <div class="article-arrow">↗</div>
  </a>`;
}
function articleCard(a,i=0){
  const catNames=(a.categories||[]).map(id=>state.categories.find(c=>c.id===id)?.nameEn||id).join(' · ');
  return `<a class="exhibit-card" href="${articleUrl(a.id)}">
    <div class="exhibit-card-top">
      <span class="exhibit-no">${String(i+1).padStart(2,'0')}</span>
      <span class="exhibit-open">↗</span>
    </div>
    <div class="exhibit-category">${catNames}</div>
    <h3>${a.title}</h3>
    <p class="exhibit-subtitle">${a.subtitle||a.summary||''}</p>
    <div class="exhibit-tags">${(a.tags||[]).slice(0,4).map(t=>`#${t}`).join(' · ')}</div>
    <div class="exhibit-date">${a.updated||a.created||''}</div>
  </a>`;
}
function renderRows(target,items,empty='没有找到匹配的展品。'){
  const el=$(target);
  if(!el)return;
  const mode=el.dataset.view||'list';
  if(!items.length){
    el.innerHTML=`<div class="empty">${empty}</div>`;
    return;
  }
  el.innerHTML=mode==='gallery'
    ? items.map((a,i)=>articleCard(a,i)).join('')
    : items.map((a,i)=>articleRow(a,i)).join('');
}
function setupViewToggle(target){
  const el=$(target);
  if(!el)return;
  const saved=localStorage.getItem('km-exhibit-view')||'gallery';
  const apply=(mode)=>{
    el.dataset.view=mode;
    el.classList.toggle('gallery-view',mode==='gallery');
    el.classList.toggle('list-view',mode==='list');
    $('.view-btn').forEach(btn=>btn.classList.toggle('active',btn.dataset.view===mode));
    localStorage.setItem('km-exhibit-view',mode);
  };
  $('.view-btn').forEach(btn=>btn.addEventListener('click',()=>apply(btn.dataset.view)));
  apply(saved);
}
function sortRecent(items){
  return [...items].sort((a,b)=>(b.updated||b.created||'').localeCompare(a.updated||a.created||''));
}
function bindRandom(){
  const btn=$('#randomBtn');
  if(!btn)return;
  btn.onclick=()=>{
    if(!state.articles.length)return;
    const a=state.articles[Math.floor(Math.random()*state.articles.length)];
    location.href=articleUrl(a.id);
  };
}

function renderHome(){
  const grid=$('#categoryGrid');
  const cats=[...state.categories].sort((a,b)=>(a.order||999)-(b.order||999));
  if(grid){
    grid.innerHTML=cats.map((c,i)=>{
      const count=state.articles.filter(a=>(a.categories||[]).includes(c.id)).length;
      return `<a class="category" href="${categoryUrl(c.id)}" style="text-align:left">
        <div class="num">${String(i+1).padStart(2,'0')} · ${count} EXHIBITS</div>
        <h3>${c.name}</h3>
        <p>${c.nameEn}<br>${c.description||''}</p>
      </a>`;
    }).join('');
  }

  renderRows('#recentList',sortRecent(state.articles).slice(0,6));
  renderRows('#featuredList',state.articles.filter(a=>a.featured).slice(0,6),'暂时还没有精选展品。');

  const search=$('#homeSearch');
  const go=()=>{
    const q=(search?.value||'').trim();
    location.href=q?`archive.html?q=${encodeURIComponent(q)}`:'archive.html';
  };
  $('#homeSearchBtn')?.addEventListener('click',go);
  search?.addEventListener('keydown',e=>{if(e.key==='Enter')go()});
  bindRandom();
}

function renderCategory(){
  const id=new URLSearchParams(location.search).get('id');
  const cat=state.categories.find(c=>c.id===id);
  if(!cat){
    $('#categoryTitle').textContent='找不到这个展厅';
    $('#categoryDesc').textContent='分类可能已被删除或链接不正确。';
    return;
  }
  document.title=`${cat.name} · Knowledge Museum`;
  $('#categoryKicker').textContent=cat.nameEn||'Collection';
  $('#categoryTitle').textContent=cat.name;
  $('#categoryDesc').textContent=cat.description||'';
  const all=state.articles.filter(a=>(a.categories||[]).includes(id));
  $('#categoryCount').textContent=`${all.length} Exhibits`;
  const input=$('#categorySearch');
  const target=$('#categoryArticleList');
  setupViewToggle('#categoryArticleList');
  const update=()=>{
    const q=(input.value||'').trim().toLowerCase();
    const items=q?all.filter(a=>searchableText(a).includes(q)):all;
    renderRows('#categoryArticleList',items);
  };
  input.addEventListener('input',update);
  $('.view-btn').forEach(btn=>btn.addEventListener('click',update));
  update();
}

function renderArchive(){
  const params=new URLSearchParams(location.search);
  const q0=params.get('q')||'';
  let active='all';
  const input=$('#archiveSearch');
  input.value=q0;

  const filters=$('#archiveFilters');
  const cats=[...state.categories].sort((a,b)=>(a.order||999)-(b.order||999));
  filters.innerHTML=
    `<button class="chip active" data-filter="all">全部</button>`+
    cats.map(c=>`<button class="chip" data-filter="${c.id}">${c.name}</button>`).join('');

  setupViewToggle('#archiveList');
  const update=()=>{
    const q=(input.value||'').trim().toLowerCase();
    const items=state.articles.filter(a=>
      (active==='all'||(a.categories||[]).includes(active)) &&
      (!q||searchableText(a).includes(q))
    );
    $('#archiveCount').textContent=`${items.length} / ${state.articles.length} Exhibits`;
    renderRows('#archiveList',items);
  };

  filters.querySelectorAll('.chip').forEach(btn=>btn.addEventListener('click',()=>{
    active=btn.dataset.filter;
    filters.querySelectorAll('.chip').forEach(x=>x.classList.toggle('active',x===btn));
    update();
  }));
  input.addEventListener('input',update);
  $('.view-btn').forEach(btn=>btn.addEventListener('click',update));
  bindRandom();
  update();
}

async function init(){
  try{
    [state.categories,state.articles]=await Promise.all([
      loadJSON('data/categories.json'),
      loadJSON('data/articles.json')
    ]);
    const page=document.body.dataset.page;
    if(page==='home')renderHome();
    else if(page==='category')renderCategory();
    else if(page==='archive')renderArchive();
  }catch(e){
    const target=$('#recentList')||$('#categoryArticleList')||$('#archiveList');
    if(target)target.innerHTML='<div class="empty">目录加载失败，请通过 GitHub Pages 访问，而不是直接双击本地文件。</div>';
  }
}
init();