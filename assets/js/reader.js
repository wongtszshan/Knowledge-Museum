/* Knowledge Museum reader shell for HTML and PDF exhibits. Needs core.js + i18n.js.
   The exhibit itself is never modified: everything here lives around the iframe. */
(function(){
  "use strict";
  const KM = window.KM;
  const { $, esc, tr } = KM;
  const kind = document.body.dataset.reader; // "html" | "pdf"
  const id = new URLSearchParams(location.search).get("id");
  const frame = $("#frame"), drawer = $("#readerDrawer"), moreBtn = $("#moreBtn");
  let article = null;

  $("#backBtn").addEventListener("click", () => {
    if (history.length > 1 && document.referrer && new URL(document.referrer).origin === location.origin) history.back();
    else location.href = "index.html";
  });

  /* ---------- drawer ---------- */
  function openDrawer(){
    const t = document.querySelector(".km-toast"); if (t) t.classList.remove("show");
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    moreBtn.setAttribute("aria-expanded", "true");
    setTimeout(() => $("#drawerClose").focus(), 60);
  }
  function closeDrawer(){
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    moreBtn.setAttribute("aria-expanded", "false");
  }
  moreBtn.addEventListener("click", () => drawer.classList.contains("open") ? closeDrawer() : openDrawer());
  $("#drawerClose").addEventListener("click", closeDrawer);
  $("#drawerBackdrop").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeDrawer(); });

  /* ---------- favourites / read state ---------- */
  function paintState(){
    if (!article) return;
    const r = KM.reading.get(article.id) || {};
    const fav = $("#favBtn");
    fav.textContent = r.fav ? "★" : "☆";
    fav.classList.toggle("is-on", !!r.fav);
    fav.setAttribute("aria-pressed", String(!!r.fav));
    fav.setAttribute("aria-label", r.fav ? tr("favorited") : tr("favorite"));
    fav.title = r.fav ? tr("favorited") : tr("favorite");
    $("#drawerFav").textContent = (r.fav ? "★ " : "☆ ") + (r.fav ? tr("favorited") : tr("favorite"));
    $("#drawerFav").classList.toggle("is-on", !!r.fav);
    $("#drawerDone").textContent = r.done ? "↺ " + tr("markUnread") : "✓ " + tr("markRead");
  }
  const toggleFav = () => { if (article) { KM.reading.toggleFav(article.id); paintState(); } };
  $("#favBtn").addEventListener("click", toggleFav);
  $("#drawerFav").addEventListener("click", toggleFav);
  $("#drawerDone").addEventListener("click", () => {
    if (!article) return;
    const r = KM.reading.get(article.id) || {};
    KM.reading.setDone(article.id, !r.done);
    paintState();
  });
  const share = () => article && KM.share(article.title, location.href);
  $("#shareBtn").addEventListener("click", share);
  $("#drawerShare").addEventListener("click", share);

  /* ---------- drawer content ---------- */
  function miniItem(a, label){
    return '<a class="drawer-item" href="' + KM.articleUrl(a) + '">' +
      (label ? '<span class="drawer-item-label">' + esc(label) + "</span>" : "") +
      "<strong>" + esc(a.title) + "</strong>" +
      '<span class="drawer-item-meta">' + (a.type === "pdf" ? "PDF" : "HTML") + (a.subtitle ? " · " + esc(a.subtitle) : "") + "</span></a>";
  }
  function paintDrawer(){
    const nb = KM.neighbours(article);
    const cat = nb.category;
    $("#drawerKicker").textContent = cat ? KM.catSubtitle(cat) : "Exhibit";
    $("#drawerTitle").textContent = article.title;
    const catLink = $("#drawerCat"), head = $("#readerCat");
    if (cat) {
      catLink.textContent = KM.catName(cat); catLink.href = KM.categoryUrl(cat.id);
      head.textContent = KM.catName(cat); head.href = KM.categoryUrl(cat.id);
      document.documentElement.style.setProperty("--page-accent", cat.accent || "");
    }
    $("#drawerNav").innerHTML =
      (nb.prev ? miniItem(nb.prev, tr("prevItem")) : '<span class="drawer-item is-empty">' + esc(tr("prevItem")) + "</span>") +
      (nb.next ? miniItem(nb.next, tr("nextItem")) : '<span class="drawer-item is-empty">' + esc(tr("nextItem")) + "</span>");
    const rel = KM.related(article, 3);
    $("#drawerRelated").innerHTML = rel.length ? rel.map(a => miniItem(a)).join("") : '<p class="drawer-empty">' + esc(tr("noRelated")) + "</p>";
    paintState();
  }
  document.addEventListener("km-language-change", () => { if (article) paintDrawer(); });

  /* ---------- HTML: progress, resume, auto-hiding bar ---------- */
  function trackHtml(previous){
    let win, doc;
    try { win = frame.contentWindow; doc = win.document; void doc.body; } catch (e) { return; }
    const bar = $("#progressBar");
    let lastY = 0, ticking = false, lastSave = 0, finishedShown = (previous.progress || 0) >= 0.95;
    let scroller = null; // set when the exhibit scrolls inside its own container
    const metrics = () => {
      if (scroller) return { y: scroller.scrollTop, max: scroller.scrollHeight - scroller.clientHeight };
      const el = doc.scrollingElement || doc.documentElement;
      return { y: win.scrollY || el.scrollTop, max: el.scrollHeight - win.innerHeight };
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const m = metrics();
        const p = m.max > 40 ? Math.min(1, Math.max(0, m.y / m.max)) : 0;
        if (bar) bar.style.width = (p * 100).toFixed(1) + "%";
        if (m.y > lastY + 10 && m.y > 90) document.body.classList.add("bar-hidden");
        else if (m.y < lastY - 10 || m.y < 40) document.body.classList.remove("bar-hidden");
        lastY = m.y;
        const now = Date.now();
        if (m.max > 40 && (now - lastSave > 900 || p >= 0.95)) { lastSave = now; KM.reading.progress(article.id, p); }
        if (p >= 0.95 && !finishedShown) {
          finishedShown = true;
          const t = KM.toast(esc(tr("finishedHint")) + ' <button type="button" class="toast-btn">' + esc(tr("related")) + "</button>", { duration: 6000 });
          t.querySelector(".toast-btn").onclick = () => { t.classList.remove("show"); openDrawer(); };
        }
      });
    };
    win.addEventListener("scroll", onScroll, { passive: true });
    doc.addEventListener("scroll", e => {
      const t = e.target;
      if (t && t !== doc && t.nodeType === 1 && t.scrollHeight - t.clientHeight > 200) { scroller = t; onScroll(); }
    }, { passive: true, capture: true });

    const p0 = previous.progress || 0;
    if (p0 >= 0.05 && p0 < 0.95 && !previous.done) {
      const t = KM.toast(esc(tr("resumeAt", { n: Math.round(p0 * 100) })) + ' <button type="button" class="toast-btn">' + esc(tr("resumeGo")) + "</button>", { duration: 7000 });
      t.querySelector(".toast-btn").onclick = () => {
        t.classList.remove("show");
        const el = doc.scrollingElement || doc.documentElement;
        win.scrollTo({ top: p0 * (el.scrollHeight - win.innerHeight), behavior: "smooth" });
      };
    }
  }

  /* ---------- boot ---------- */
  function missing(){
    $("#readerTitle").textContent = tr(kind === "pdf" ? "pdfMissing" : "exhibitMissing");
    frame.style.display = "none";
    ["#openRaw", "#favBtn", "#shareBtn", "#drawerRaw"].forEach(s => { const el = $(s); if (el) el.style.display = "none"; });
    const fb = $("#readerFallback");
    if (fb) fb.innerHTML = esc(tr("pdfMissing")) + '<br><a href="index.html">' + esc(tr("backMuseum")) + "</a>";
  }
  async function init(){
    try { await KM.loadCatalogue(); } catch (e) { missing(); return; }
    article = KM.state.articles.find(a => a.id === id && (kind === "pdf" ? a.type === "pdf" : a.type !== "pdf"));
    if (!article) {
      const other = KM.state.articles.find(a => a.id === id);
      if (other) { location.replace(KM.articleUrl(other)); return; }
      missing(); return;
    }
    document.title = article.title + " · Knowledge Museum";
    const title = $("#readerTitle");
    title.removeAttribute("data-i18n");
    title.textContent = article.title;
    const previous = Object.assign({}, KM.reading.get(article.id) || {});
    KM.reading.open(article.id);
    paintDrawer();

    if (kind === "pdf") {
      const raw = KM.pdfUrl(article);
      $("#openRaw").href = raw; $("#drawerRaw").href = raw;
      const fb = $("#readerFallback");
      frame.title = article.title;
      frame.addEventListener("load", () => { fb.style.display = "none"; }, { once: true });
      frame.src = raw + (raw.includes("#") ? "" : "#view=FitH");
      setTimeout(() => {
        if (fb.style.display !== "none") fb.innerHTML = esc(tr("pdfFallbackPrefix")) + '<a href="' + esc(raw) + '" target="_blank" rel="noopener">' + esc(tr("pdfFallbackLink")) + "</a>。";
      }, 2500);
    } else {
      const src = "content/html/" + article.file;
      $("#openRaw").href = src; $("#drawerRaw").href = src;
      frame.title = article.title;
      frame.addEventListener("load", () => trackHtml(previous), { once: true });
      frame.src = src;
    }
  }
  init();
  KM.registerSW();
})();
