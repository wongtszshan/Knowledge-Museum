/* Knowledge Museum light / dark theme. Load in <head> without defer so the page never flashes. */
(function(){
  "use strict";
  var KEY = "km-theme";
  var COLORS = { light: "#f4f0e7", dark: "#151613" };
  var root = document.documentElement;
  var current = "light";
  try { if (localStorage.getItem(KEY) === "dark") current = "dark"; } catch (e) {}

  function paintMeta(){
    var color = document.body && (document.body.classList.contains("viewer-body") || document.body.classList.contains("pdf-viewer-body"))
      ? "#172721" : COLORS[current];
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    if (!metas.length) { var m = document.createElement("meta"); m.name = "theme-color"; document.head.appendChild(m); metas = [m]; }
    for (var i = 0; i < metas.length; i++) metas[i].setAttribute("content", color);
  }
  function label(){
    var tr = window.KM_I18N && window.KM_I18N.t;
    var text = current === "dark" ? "themeToLight" : "themeToDark";
    return tr ? tr(text) : (current === "dark" ? "浅色模式" : "深色模式");
  }
  function refreshButtons(){
    var btns = document.querySelectorAll(".km-theme-toggle");
    for (var i = 0; i < btns.length; i++) {
      btns[i].textContent = current === "dark" ? "☀" : "☾";
      btns[i].setAttribute("aria-label", label());
      btns[i].setAttribute("title", label());
      btns[i].setAttribute("aria-pressed", String(current === "dark"));
    }
  }
  function apply(){
    root.setAttribute("data-theme", current);
    paintMeta();
    refreshButtons();
  }
  function set(theme){
    current = theme === "dark" ? "dark" : "light";
    try { localStorage.setItem(KEY, current); } catch (e) {}
    apply();
    document.dispatchEvent(new CustomEvent("km-theme-change", { detail: { theme: current } }));
  }
  function toggle(){ set(current === "dark" ? "light" : "dark"); }

  function makeButton(extraClass){
    var b = document.createElement("button");
    b.type = "button";
    b.className = "km-theme-toggle " + (extraClass || "");
    b.addEventListener("click", toggle);
    return b;
  }
  function mount(){
    if (!document.querySelector(".km-theme-toggle")) {
      var spot = document.querySelector("[data-theme-mount]");
      var top = document.querySelector(".topbar");
      if (spot) spot.appendChild(makeButton("icon-btn"));
      else if (top) top.appendChild(makeButton("icon-btn topbar-theme"));
    }
    apply();
  }

  root.setAttribute("data-theme", current);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true });
  else mount();
  document.addEventListener("km-language-change", refreshButtons);

  window.KM_THEME = { set: set, toggle: toggle, get theme(){ return current; }, mount: mount };
})();
