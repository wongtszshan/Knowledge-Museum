/* Knowledge Museum shared core: catalogue loading, reading records, small helpers.
   Used by the listing pages (app.js) and both readers (reader.js). */
(function(){
  "use strict";
  const KM = window.KM = window.KM || {};
  const tr = (k, vars) => window.KM_I18N ? window.KM_I18N.t(k, vars) : k;
  KM.tr = tr;
  KM.$ = s => document.querySelector(s);
  KM.$$ = s => [...document.querySelectorAll(s)];
  KM.esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));

  /* ---------- catalogue ---------- */
  KM.state = { articles: [], categories: [] };
  async function loadJSON(path){
    const r = await fetch(path, { cache: "no-store" });
    if (!r.ok) throw new Error(path);
    return r.json();
  }
  KM.loadJSON = loadJSON;
  KM.loadCatalogue = async function(){
    const [cats, arts] = await Promise.all([loadJSON("data/categories.json"), loadJSON("data/articles.json")]);
    KM.state.categories = [...cats].sort((a, b) => (a.order || 999) - (b.order || 999));
    KM.state.articles = arts;
    return KM.state;
  };
  KM.category = id => KM.state.categories.find(c => c.id === id);
  KM.catName = c => (window.KM_I18N ? window.KM_I18N.categoryName(c) : c && c.name) || "";
  KM.catDescription = c => (window.KM_I18N ? window.KM_I18N.categoryDescription(c) : c && c.description) || "";
  KM.catSubtitle = c => (window.KM_I18N ? window.KM_I18N.categorySubname(c) : c && c.nameEn) || "";
  KM.articleUrl = a => (a.type === "pdf" ? "pdf-viewer.html" : "viewer.html") + "?id=" + encodeURIComponent(a.id);
  KM.categoryUrl = id => "category.html?id=" + encodeURIComponent(id);
  KM.tagUrl = tag => "archive.html?tag=" + encodeURIComponent(tag);
  KM.pdfUrl = a => {
    const encodePath = p => p.split("/").map(encodeURIComponent).join("/");
    return a.url || (/^https?:\/\//i.test(a.file || "") ? a.file : "content/pdf/" + encodePath(a.file || ""));
  };

  /* Related: shared tags weigh more than a shared collection. */
  KM.related = function(article, limit){
    const tags = new Set(article.tags || []);
    const cats = new Set(article.categories || []);
    return KM.state.articles
      .filter(a => a.id !== article.id)
      .map(a => {
        const sharedTags = (a.tags || []).filter(t => tags.has(t)).length;
        const sharedCats = (a.categories || []).filter(c => cats.has(c)).length;
        return { a, score: sharedTags * 2 + sharedCats };
      })
      .filter(x => x.score > 0)
      .sort((x, y) => y.score - x.score || (y.a.updated || "").localeCompare(x.a.updated || ""))
      .slice(0, limit || 3)
      .map(x => x.a);
  };
  /* Previous / next inside the article's first collection, in catalogue order. */
  KM.neighbours = function(article){
    const cat = (article.categories || [])[0];
    const list = KM.state.articles.filter(a => (a.categories || []).includes(cat));
    const i = list.findIndex(a => a.id === article.id);
    return { prev: i > 0 ? list[i - 1] : null, next: i >= 0 && i < list.length - 1 ? list[i + 1] : null, category: KM.category(cat) };
  };

  /* ---------- reading records (this browser only) ---------- */
  const RKEY = "km-reading-v1";
  let records = {};
  try { records = JSON.parse(localStorage.getItem(RKEY) || "{}") || {}; } catch (e) { records = {}; }
  const save = () => { try { localStorage.setItem(RKEY, JSON.stringify(records)); } catch (e) {} };
  KM.reading = {
    get: id => records[id] || null,
    all: () => records,
    open(id){
      const r = records[id] || (records[id] = {});
      r.last = Date.now();
      r.visits = (r.visits || 0) + 1;
      save();
    },
    progress(id, p){
      const r = records[id] || (records[id] = {});
      r.progress = Math.max(0, Math.min(1, p));
      r.last = Date.now();
      if (r.progress >= 0.95) r.done = true;
      save();
    },
    setDone(id, done){
      const r = records[id] || (records[id] = {});
      r.done = !!done;
      if (!done) r.progress = Math.min(r.progress || 0, 0.9);
      r.last = Date.now();
      save();
    },
    toggleFav(id){
      const r = records[id] || (records[id] = {});
      r.fav = !r.fav;
      r.favAt = Date.now();
      save();
      return r.fav;
    },
    isUnread: id => !records[id] || !records[id].last,
    inProgress(){
      return KM.state.articles
        .map(a => ({ a, r: records[a.id] }))
        .filter(x => x.r && x.r.last && !x.r.done && (x.r.progress || 0) >= 0.03)
        .sort((x, y) => y.r.last - x.r.last)
        .map(x => x.a);
    },
    favorites(){
      return KM.state.articles
        .filter(a => records[a.id] && records[a.id].fav)
        .sort((x, y) => (records[y.id].favAt || 0) - (records[x.id].favAt || 0));
    }
  };

  /* Random exhibit: unread first; falls back to everything in the pool. */
  KM.randomFrom = function(pool){
    pool = pool && pool.length ? pool : KM.state.articles;
    if (!pool.length) return null;
    const unread = pool.filter(a => KM.reading.isUnread(a.id));
    const from = unread.length ? unread : pool;
    return from[Math.floor(Math.random() * from.length)];
  };

  /* Small toast used by the readers and the share action. */
  KM.toast = function(html, opts){
    opts = opts || {};
    let el = document.querySelector(".km-toast");
    if (!el) { el = document.createElement("div"); el.className = "km-toast"; el.setAttribute("role", "status"); document.body.appendChild(el); }
    el.innerHTML = html;
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove("show"), opts.duration || 2600);
    return el;
  };

  KM.share = async function(title, url){
    url = url || location.href;
    try {
      if (navigator.share) { await navigator.share({ title, url }); return; }
    } catch (e) { if (e && e.name === "AbortError") return; }
    try { await navigator.clipboard.writeText(url); KM.toast(KM.esc(tr("linkCopied"))); }
    catch (e) { prompt(tr("share"), url); }
  };

  KM.registerSW = function(){
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).catch(() => {});
  };
})();
