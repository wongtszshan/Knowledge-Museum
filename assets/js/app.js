/* Knowledge Museum listing pages: home, collection, archive. Needs core.js + i18n.js. */
(function(){
  "use strict";
  const KM = window.KM;
  const { $, $$, esc, tr } = KM;
  let refresh = null;
  document.addEventListener("km-language-change", () => { if (typeof refresh === "function") refresh(); });

  /* ---------- recent ordering ---------- */
  function sortRecent(items){
    const order = new Map(KM.state.articles.map((a, i) => [a.id, i]));
    return [...items].sort((a, b) =>
      (b.created || b.updated || "").localeCompare(a.created || a.updated || "") || order.get(b.id) - order.get(a.id));
  }
  /* Alternate HTML and PDF so one big batch of catalogues can't fill the whole shelf. */
  function interleaveByType(items){
    const html = items.filter(a => a.type !== "pdf"), pdf = items.filter(a => a.type === "pdf");
    const out = [];
    let takeHtml = !items.length || items[0].type !== "pdf";
    while (html.length || pdf.length) {
      const q = takeHtml ? (html.length ? html : pdf) : (pdf.length ? pdf : html);
      out.push(q.shift());
      takeHtml = !takeHtml;
    }
    return out;
  }

  /* ---------- search (metadata + optional full-text index) ---------- */
  let indexPromise = null;
  function loadIndex(){
    if (!indexPromise) indexPromise = KM.loadJSON("data/search-index.json")
      .then(d => new Map((d.items || []).map(x => [x.id, String(x.text || "")])))
      .catch(() => new Map());
    return indexPromise;
  }
  function metaText(a){
    const cats = (a.categories || []).map(id => { const c = KM.category(id); return c ? [c.name, c.nameEn, c.nameTrad, KM.catName(c)].join(" ") : id; });
    return [a.title, a.subtitle, a.summary, ...(a.tags || []), ...cats].join(" ").toLowerCase();
  }
  function terms(q){ return q.toLowerCase().split(/\s+/).filter(Boolean); }
  function snippetFor(text, ts){
    const lower = text.toLowerCase();
    let pos = -1, hit = "";
    for (const t of ts) { const p = lower.indexOf(t); if (p >= 0 && (pos < 0 || p < pos)) { pos = p; hit = t; } }
    if (pos < 0) return "";
    const start = Math.max(0, pos - 38), end = Math.min(text.length, pos + hit.length + 60);
    let s = esc(text.slice(start, end));
    for (const t of ts) {
      const re = new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      s = s.replace(re, m => "<mark>" + m + "</mark>");
    }
    return (start > 0 ? "…" : "") + s + (end < text.length ? "…" : "");
  }
  /* Returns [{a, snippet}] — metadata hits first, then exhibits that only match in their full text. */
  function search(items, q, index){
    const ts = terms(q);
    if (!ts.length) return items.map(a => ({ a }));
    const meta = [], body = [];
    for (const a of items) {
      const m = metaText(a), t = index ? (index.get(a.id) || "") : "";
      const tl = t.toLowerCase();
      if (ts.every(x => m.includes(x))) meta.push({ a });
      else if (t && ts.every(x => m.includes(x) || tl.includes(x))) body.push({ a, snippet: snippetFor(t, ts) });
    }
    return meta.concat(body);
  }

  /* ---------- cards ---------- */
  function typeLabel(a){ return a.type === "pdf" ? "PDF" + (a.pages ? " · " + a.pages + " PAGES" : "") : "HTML"; }
  function status(a){
    const r = KM.reading.get(a.id) || {};
    const bits = [];
    if (r.fav) bits.push('<span class="st-fav" title="' + esc(tr("favorited")) + '">★</span>');
    if (r.done) bits.push('<span class="st-done">' + esc(tr("readDone")) + "</span>");
    else if (r.progress >= 0.03) bits.push('<span class="st-progress">' + esc(tr("readPct", { n: Math.round(r.progress * 100) })) + "</span>");
    else if (r.last) bits.push('<span class="st-opened">' + esc(tr("opened")) + "</span>");
    const bar = !r.done && r.progress >= 0.03 ? '<div class="read-bar" aria-hidden="true"><i style="width:' + Math.round(r.progress * 100) + '%"></i></div>' : "";
    return { html: bits.length ? '<span class="exhibit-status">' + bits.join("") + "</span>" : "", bar, done: !!r.done };
  }
  const tagLinks = (a, n) => (a.tags || []).slice(0, n || 99).map(t => '<a class="tag-link" href="' + KM.tagUrl(t) + '">#' + esc(t) + "</a>").join(" ");
  function accentOf(a){ const c = KM.state.categories.find(c => (a.categories || []).includes(c.id)); return (c && c.accent) || "#193d36"; }

  function articleRow(item, i){
    const a = item.a || item, st = status(a);
    return '<div class="article' + (st.done ? " is-done" : "") + '">' +
      '<div class="article-index">' + String(i + 1).padStart(2, "0") + "</div>" +
      "<div>" +
        '<div class="article-title"><a class="card-link" href="' + KM.articleUrl(a) + '">' + esc(a.title) + "</a> " +
          '<span class="content-type-badge">' + typeLabel(a) + "</span>" + st.html + "</div>" +
        '<div class="article-meta">' + esc(a.subtitle || a.summary || "") +
          (item.snippet ? '<div class="search-snippet"><b>' + esc(tr("fulltextHit")) + "</b>" + item.snippet + "</div>" : "<br>") +
          '<span class="tag-row">' + tagLinks(a) + "</span></div>" +
        st.bar +
      "</div>" +
      '<div class="article-arrow" aria-hidden="true">↗</div>' +
    "</div>";
  }
  function articleCard(item, i){
    const a = item.a || item, st = status(a);
    const catNames = (a.categories || []).map(id => { const c = KM.category(id); return c ? KM.catName(c) : id; }).join(" · ");
    const cover = a.cover ? '<div class="exhibit-cover"><img src="' + esc(a.cover) + '" alt="" loading="lazy" decoding="async"></div>' : "";
    return '<article class="exhibit-card' + (a.cover ? " has-cover" : "") + (st.done ? " is-done" : "") + '" style="--exhibit-accent:' + accentOf(a) + '">' +
      cover +
      '<div class="exhibit-card-top"><span class="exhibit-no">' + String(i + 1).padStart(2, "0") + "</span>" + st.html + '<span class="exhibit-open" aria-hidden="true">↗</span></div>' +
      '<div class="exhibit-category">' + esc(catNames) + ' · <span class="content-type-inline">' + typeLabel(a) + "</span></div>" +
      '<h3><a class="card-link" href="' + KM.articleUrl(a) + '">' + esc(a.title) + "</a></h3>" +
      '<p class="exhibit-subtitle">' + esc(a.subtitle || a.summary || "") + "</p>" +
      (item.snippet ? '<p class="search-snippet"><b>' + esc(tr("fulltextHit")) + "</b>" + item.snippet + "</p>" : "") +
      '<div class="exhibit-tags">' + tagLinks(a, 4) + "</div>" +
      '<div class="exhibit-date">' + esc(a.updated || a.created || "") + "</div>" +
      st.bar +
    "</article>";
  }
  function renderRows(target, items, empty){
    const el = $(target);
    if (!el) return;
    if (!items.length) { el.innerHTML = '<div class="empty">' + esc(empty || tr("noExhibits")) + "</div>"; return; }
    const gallery = (el.dataset.view || "list") === "gallery";
    el.innerHTML = items.map((x, i) => gallery ? articleCard(x, i) : articleRow(x, i)).join("");
  }
  function skeleton(target, n){
    const el = $(target);
    if (!el || el.children.length) return;
    const gallery = el.dataset.view === "gallery" || el.classList.contains("gallery-view");
    el.innerHTML = Array.from({ length: n }, () => gallery
      ? '<div class="skeleton skeleton-card"><i></i><i></i><i></i></div>'
      : '<div class="skeleton skeleton-row"><i></i><i></i></div>').join("");
  }
  function setupViewToggle(target, onChange){
    const el = $(target);
    if (!el) return;
    let saved = "gallery";
    try { saved = localStorage.getItem("km-exhibit-view") || "gallery"; } catch (e) {}
    const apply = mode => {
      el.dataset.view = mode;
      el.classList.toggle("gallery-view", mode === "gallery");
      el.classList.toggle("list-view", mode === "list");
      $$(".view-btn").forEach(b => b.classList.toggle("active", b.dataset.view === mode));
      try { localStorage.setItem("km-exhibit-view", mode); } catch (e) {}
    };
    $$(".view-btn").forEach(b => b.addEventListener("click", () => { apply(b.dataset.view); onChange && onChange(); }));
    apply(saved);
  }
  function bindRandom(getPool){
    const btn = $("#randomBtn");
    if (!btn) return;
    btn.onclick = () => { const a = KM.randomFrom(getPool ? getPool() : null); if (a) location.href = KM.articleUrl(a); };
  }
  function setSection(id, visible){ const s = document.getElementById(id); if (s) s.hidden = !visible; }

  /* ---------- home ---------- */
  function renderHome(){
    const grid = $("#categoryGrid");
    const cats = KM.state.categories;
    const count = c => KM.state.articles.filter(a => (a.categories || []).includes(c.id)).length;
    const card = (c, i) => '<a class="category home-category-card" style="--category-accent:' + esc(c.accent || "#193d36") + ";--category-tint:" + esc(c.tint || "#eee8de") + '" data-symbol="' + esc(c.symbol || (c.nameEn || c.id || "K").charAt(0).toUpperCase()) + '" href="' + KM.categoryUrl(c.id) + '">' +
      '<div class="num">' + String(i + 1).padStart(2, "0") + " · " + count(c) + " " + esc(tr("exhibitsCard")) + "</div>" +
      "<h3>" + esc(KM.catName(c)) + "</h3><p>" + esc(KM.catSubtitle(c)) + "</p></a>";

    const modal = $("#collectionsModal"), list = $("#collectionsList"), modalSearch = $("#collectionsSearch");
    const renderAll = () => {
      if (!list) return;
      const q = (modalSearch && modalSearch.value || "").trim().toLowerCase();
      const filtered = cats.filter(c => !q || [c.name, c.nameEn, c.nameTrad, c.description, KM.catName(c), KM.catDescription(c), c.id].join(" ").toLowerCase().includes(q));
      list.innerHTML = filtered.length
        ? filtered.map(c => '<a class="collection-list-item" href="' + KM.categoryUrl(c.id) + '"><div><strong>' + esc(KM.catName(c)) + "</strong><span>" + esc(KM.catSubtitle(c)) + "</span></div><em>" + count(c) + "</em></a>").join("")
        : '<div class="empty">' + esc(tr("noCategories")) + "</div>";
    };
    const open = () => { if (!modal) return; renderAll(); modal.classList.add("open"); modal.setAttribute("aria-hidden", "false"); document.body.classList.add("modal-open"); setTimeout(() => modalSearch && modalSearch.focus(), 120); };
    const close = () => { if (!modal) return; modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true"); document.body.classList.remove("modal-open"); };
    $("#allCollectionsBtn") && $("#allCollectionsBtn").addEventListener("click", open);
    $("#collectionsClose") && $("#collectionsClose").addEventListener("click", close);
    $("#collectionsBackdrop") && $("#collectionsBackdrop").addEventListener("click", close);
    modalSearch && modalSearch.addEventListener("input", renderAll);
    document.addEventListener("keydown", e => { if (e.key === "Escape" && modal && modal.classList.contains("open")) close(); });

    const draw = () => {
      if (grid) grid.innerHTML = cats.map(card).join("");
      renderAll();
      const cont = KM.reading.inProgress().slice(0, 4);
      setSection("continueSection", cont.length > 0);
      renderRows("#continueList", cont);
      const favs = KM.reading.favorites().slice(0, 6);
      setSection("favoritesSection", favs.length > 0);
      renderRows("#favoritesList", favs);
      renderRows("#recentList", interleaveByType(sortRecent(KM.state.articles)).slice(0, 6));
      renderRows("#featuredList", KM.state.articles.filter(a => a.featured).slice(0, 6), tr("noFeatured"));
    };
    draw();
    refresh = draw;
    /* Returning from a reader via the back button restores this page from cache: redraw progress. */
    addEventListener("pageshow", e => { if (e.persisted) draw(); });

    const input = $("#homeSearch");
    const go = () => { const q = (input && input.value || "").trim(); location.href = q ? "archive.html?q=" + encodeURIComponent(q) : "archive.html"; };
    $("#homeSearchBtn") && $("#homeSearchBtn").addEventListener("click", go);
    input && input.addEventListener("keydown", e => { if (e.key === "Enter") go(); });
    bindRandom();
  }

  /* ---------- collection ---------- */
  function topicTags(items){
    const counts = new Map();
    items.forEach(a => (a.tags || []).forEach(t => counts.set(t, (counts.get(t) || 0) + 1)));
    return [...counts.entries()]
      .filter(([, n]) => n >= 2 && !(items.length > 3 && n >= items.length * 0.8))
      .sort((x, y) => y[1] - x[1])
      .slice(0, 12);
  }
  function renderCategory(){
    const id = new URLSearchParams(location.search).get("id");
    const cat = KM.category(id);
    if (!cat) { $("#categoryTitle").textContent = tr("missingCategory"); $("#categoryDesc").textContent = tr("missingCategoryDesc"); return; }
    const all = KM.state.articles.filter(a => (a.categories || []).includes(id));
    const input = $("#categorySearch"), topicsEl = $("#categoryTopics");
    let topic = "", index = null;
    const topics = topicTags(all);
    const drawTopics = () => {
      if (!topicsEl) return;
      topicsEl.hidden = !topics.length;
      topicsEl.innerHTML = topics.length ? '<span class="chip-label">' + esc(tr("topics")) + "</span>" +
        '<button class="chip' + (topic ? "" : " active") + '" data-topic="">' + esc(tr("allTopics")) + "</button>" +
        topics.map(([t, n]) => '<button class="chip' + (topic === t ? " active" : "") + '" data-topic="' + esc(t) + '">' + esc(t) + " <small>" + n + "</small></button>").join("") : "";
    };
    const header = () => {
      document.title = KM.catName(cat) + " · Knowledge Museum";
      $("#categoryKicker").textContent = KM.catSubtitle(cat) || tr("category.legacy");
      $("#categoryTitle").textContent = KM.catName(cat);
      $("#categoryDesc").textContent = KM.catDescription(cat);
      $("#categoryCount").textContent = all.length + " " + tr("exhibits");
      document.documentElement.style.setProperty("--page-accent", cat.accent || "");
    };
    const update = () => {
      const q = (input.value || "").trim();
      const pool = topic ? all.filter(a => (a.tags || []).includes(topic)) : all;
      if (q && !index) loadIndex().then(m => { index = m; update(); });
      renderRows("#categoryArticleList", search(pool, q, index));
    };
    topicsEl && topicsEl.addEventListener("click", e => { const b = e.target.closest("[data-topic]"); if (!b) return; topic = b.dataset.topic; drawTopics(); update(); });
    setupViewToggle("#categoryArticleList", update);
    input.addEventListener("input", update);
    bindRandom(() => topic ? all.filter(a => (a.tags || []).includes(topic)) : all);
    header(); drawTopics(); update();
    refresh = () => { header(); drawTopics(); update(); };
    addEventListener("pageshow", e => { if (e.persisted) update(); });
  }

  /* ---------- archive ---------- */
  function renderArchive(){
    const params = new URLSearchParams(location.search);
    let active = "all", tag = params.get("tag") || "", index = null;
    const input = $("#archiveSearch");
    input.value = params.get("q") || "";
    const filters = $("#archiveFilters"), tagBar = $("#archiveTag");
    const cats = KM.state.categories;
    const drawFilters = () => {
      filters.innerHTML = '<button class="chip' + (active === "all" ? " active" : "") + '" data-filter="all">' + esc(tr("all")) + "</button>" +
        cats.map(c => '<button class="chip' + (active === c.id ? " active" : "") + '" data-filter="' + esc(c.id) + '">' + esc(KM.catName(c)) + "</button>").join("");
      if (tagBar) {
        tagBar.hidden = !tag;
        tagBar.innerHTML = tag ? '<span class="chip-label">' + esc(tr("tagLabel")) + '</span><button class="chip active tag-chip" id="clearTag" aria-label="' + esc(tr("clearFilter")) + '">#' + esc(tag) + " <b aria-hidden=\"true\">×</b></button>" : "";
      }
    };
    const pool = () => KM.state.articles.filter(a => (active === "all" || (a.categories || []).includes(active)) && (!tag || (a.tags || []).includes(tag)));
    const syncUrl = () => {
      const p = new URLSearchParams();
      const q = input.value.trim();
      if (q) p.set("q", q);
      if (tag) p.set("tag", tag);
      history.replaceState(null, "", "archive.html" + (p.toString() ? "?" + p : ""));
    };
    const update = () => {
      const q = input.value.trim();
      if (q && !index) loadIndex().then(m => { index = m; update(); });
      const items = search(pool(), q, index);
      $("#archiveCount").textContent = items.length + " / " + KM.state.articles.length + " " + tr("exhibits");
      renderRows("#archiveList", items);
    };
    filters.addEventListener("click", e => { const b = e.target.closest("[data-filter]"); if (!b) return; active = b.dataset.filter; drawFilters(); update(); });
    tagBar && tagBar.addEventListener("click", e => { if (e.target.closest("#clearTag")) { tag = ""; drawFilters(); syncUrl(); update(); } });
    input.addEventListener("input", () => { syncUrl(); update(); });
    setupViewToggle("#archiveList", update);
    bindRandom(pool);
    drawFilters(); update();
    refresh = () => { drawFilters(); update(); };
    addEventListener("pageshow", e => { if (e.persisted) update(); });
  }

  /* ---------- boot ---------- */
  async function init(){
    const page = document.body.dataset.page;
    ["#continueList", "#favoritesList"].forEach(s => { const el = $(s); if (el) el.dataset.view = "list"; });
    ["#recentList", "#featuredList", "#categoryArticleList", "#archiveList"].forEach(s => skeleton(s, page === "home" ? 3 : 4));
    try {
      await KM.loadCatalogue();
      if (page === "home") renderHome();
      else if (page === "category") renderCategory();
      else if (page === "archive") renderArchive();
    } catch (e) {
      console.error(e);
      const target = $("#recentList") || $("#categoryArticleList") || $("#archiveList");
      if (target) target.innerHTML = '<div class="empty">' + esc(tr("loadError")) + "</div>";
    }
  }
  init();
  KM.registerSW();
})();
