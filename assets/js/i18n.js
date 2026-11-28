/* Knowledge Museum shared UI language. Original exhibit content is never translated. */
(function(){
"use strict";
const KEY="knowledge-museum-yellow-pages-language";
const LANGS=["zh-CN","zh-TW","en"];
const original={
"zh-CN":{
"museum":"知识博物馆","hall":"← 大厅","archive":"全部馆藏","random":"随机漫游 ↗",
"heroTitle":"知识，自有其\n收藏的价值。","heroDesc":"一座关于好奇心、发现与思考的私人博物馆。\n收藏值得反复阅读的知识，探索不同领域的精彩。",
"homeKicker":"A personal collection of ideas · 私人知识博物馆",
"searchLabel":"SEARCH THE MUSEUM","homeSearch":"探索标题、主题或关键词…","search":"搜索",
"collections":"探索展厅","chooseCollection":"选择一个展厅","allCategories":"全部分类 →",
"recent":"最近新增","recentNote":"最近新增 · 最多 6 篇",
"featured":"馆藏精选","featuredNote":"精选馆藏 · 最多 6 篇",
"exploreAll":"走进完整馆藏","exploreDesc":"继续探索每一份值得收藏的知识与研究。","browseAll":"浏览全部馆藏 →",
"allCollections":"全部分类","searchCollections":"搜索分类…","close":"关闭",
"archiveTitle":"全部馆藏","archiveDesc":"在这里查看所有展品，并按分类或关键词筛选。",
"archiveSearch":"搜索标题、标签或关键词…","categorySearch":"搜索这个展厅…",
"gallery":"画廊","list":"列表","viewLabel":"切换展示方式",
"all":"全部","exhibits":"件馆藏","exhibitsCard":"件展品","noExhibits":"没有找到匹配的展品。","noCategories":"没有找到匹配的分类。","noFeatured":"暂时还没有精选展品。",
"missingCategory":"找不到这个展厅","missingCategoryDesc":"分类可能已被删除或链接不正确。",
"loadError":"目录加载失败，请通过 GitHub Pages 访问，而不是直接双击本地文件。",
"previous":"← 上一页","back":"← 返回","fullscreen":"全屏打开 ↗","originalPdf":"原始 PDF ↗",
"loading":"正在载入…","loadingPdf":"正在载入 PDF…","pdfFallbackPrefix":"如果当前设备没有内嵌显示 PDF，","pdfFallbackLink":"点这里打开原始 PDF","pdfMissing":"找不到这份 PDF。","exhibitMissing":"找不到这个展品","backMuseum":"返回 Knowledge Museum","yellowPages":"✦ 知识黄页",
"category.legacy":"展厅","archiveFooter":"KNOWLEDGE MUSEUM · Full Archive",
"categoryFooter":"KNOWLEDGE MUSEUM · Collection",
"indexFooter":"KNOWLEDGE MUSEUM · Curated by you · GitHub Pages ready"
},
"zh-TW":{
"museum":"知識博物館","hall":"← 大廳","archive":"全部館藏","random":"隨機漫遊 ↗",
"heroTitle":"知識，自有其\n收藏的價值。","heroDesc":"一座關於好奇心、發現與思考的私人博物館。\n收藏值得反覆閱讀的知識，探索不同領域的精彩。",
"homeKicker":"A personal collection of ideas · 私人知識博物館",
"searchLabel":"SEARCH THE MUSEUM","homeSearch":"探索標題、主題或關鍵字…","search":"搜尋",
"collections":"探索展廳","chooseCollection":"選擇一個展廳","allCategories":"全部分類 →",
"recent":"最近新增","recentNote":"最近新增 · 最多 6 篇",
"featured":"館藏精選","featuredNote":"精選館藏 · 最多 6 篇",
"exploreAll":"走進完整館藏","exploreDesc":"繼續探索每一份值得收藏的知識與研究。","browseAll":"瀏覽全部館藏 →",
"allCollections":"全部分類","searchCollections":"搜尋分類…","close":"關閉",
"archiveTitle":"全部館藏","archiveDesc":"在這裡查看所有展品，並按分類或關鍵字篩選。",
"archiveSearch":"搜尋標題、標籤或關鍵字…","categorySearch":"搜尋這個展廳…",
"gallery":"畫廊","list":"列表","viewLabel":"切換展示方式",
"all":"全部","exhibits":"件館藏","exhibitsCard":"件展品","noExhibits":"沒有找到符合條件的展品。","noCategories":"沒有找到符合條件的分類。","noFeatured":"暫時還沒有精選展品。",
"missingCategory":"找不到這個展廳","missingCategoryDesc":"分類可能已被刪除，或連結不正確。",
"loadError":"目錄載入失敗，請透過 GitHub Pages 瀏覽，而不是直接開啟本機檔案。",
"previous":"← 上一頁","back":"← 返回","fullscreen":"全螢幕開啟 ↗","originalPdf":"原始 PDF ↗",
"loading":"正在載入…","loadingPdf":"正在載入 PDF…","pdfFallbackPrefix":"如果目前裝置無法內嵌顯示 PDF，","pdfFallbackLink":"點這裡開啟原始 PDF","pdfMissing":"找不到這份 PDF。","exhibitMissing":"找不到這個展品","backMuseum":"返回 Knowledge Museum","yellowPages":"✦ 知識黃頁",
"category.legacy":"展廳","archiveFooter":"KNOWLEDGE MUSEUM · Full Archive",
"categoryFooter":"KNOWLEDGE MUSEUM · Collection",
"indexFooter":"KNOWLEDGE MUSEUM · Curated by you · GitHub Pages ready"
},
"en":{
"museum":"Knowledge Museum","hall":"← Home","archive":"All Exhibits","random":"Surprise Me ↗",
"heroTitle":"Knowledge is\nworth collecting.","heroDesc":"A personal museum of curiosity, discovery and ideas.\nCollect knowledge worth revisiting and explore fascinating subjects.",
"homeKicker":"A personal collection of ideas · Knowledge Museum",
"searchLabel":"SEARCH THE MUSEUM","homeSearch":"Search titles, subjects and keywords…","search":"Search",
"collections":"Explore Collections","chooseCollection":"Choose a collection","allCategories":"All Categories →",
"recent":"Recently Added","recentNote":"Up to 6 new exhibits",
"featured":"Featured Exhibits","featuredNote":"Up to 6 featured exhibits",
"exploreAll":"Discover the full collection","exploreDesc":"Continue exploring knowledge and research worth keeping.","browseAll":"Browse All Exhibits →",
"allCollections":"All Categories","searchCollections":"Search categories…","close":"Close",
"archiveTitle":"All Exhibits","archiveDesc":"Browse everything in the museum and filter by subject or keyword.",
"archiveSearch":"Search titles, tags or keywords…","categorySearch":"Search this collection…",
"gallery":"Gallery","list":"List","viewLabel":"Choose display mode",
"all":"All","exhibits":"exhibits","exhibitsCard":"EXHIBITS","noExhibits":"No matching exhibits found.","noCategories":"No matching categories found.","noFeatured":"No featured exhibits yet.",
"missingCategory":"Collection not found","missingCategoryDesc":"This collection may have been removed or the link is incorrect.",
"loadError":"Could not load the catalogue. Open the museum on GitHub Pages instead of a local file.",
"previous":"← Back","back":"← Back","fullscreen":"Open Fullscreen ↗","originalPdf":"Original PDF ↗",
"loading":"Loading…","loadingPdf":"Loading PDF…","pdfFallbackPrefix":"If your device cannot display the PDF here, ","pdfFallbackLink":"open the original PDF","pdfMissing":"This PDF could not be found.","exhibitMissing":"Exhibit not found","backMuseum":"Back to Knowledge Museum","yellowPages":"✦ Knowledge Atlas",
"category.legacy":"Collection","archiveFooter":"KNOWLEDGE MUSEUM · Full Archive",
"categoryFooter":"KNOWLEDGE MUSEUM · Collection",
"indexFooter":"KNOWLEDGE MUSEUM · Curated by you · GitHub Pages ready"
}};
const additions={
"zh-CN":{"continueReading":"继续阅读","continueNote":"从上次停下的地方继续","favorites":"我的收藏","favoritesNote":"你标记的展品","readPct":"已读 {n}%","readDone":"已读完","opened":"已打开","themeToDark":"切换到深色模式","themeToLight":"切换到浅色模式","more":"更多","share":"分享","linkCopied":"链接已复制","favorite":"收藏","favorited":"已收藏","markRead":"标记为已读","markUnread":"标记为未读","prevItem":"← 上一件","nextItem":"下一件 →","inThisHall":"本展厅","related":"相关展品","noRelated":"暂时没有相关展品","resumeAt":"上次读到 {n}%","resumeGo":"跳过去","finishedHint":"读完了，看看相关展品？","appearance":"外观与语言","tagLabel":"标签","clearFilter":"清除","fulltextHit":"正文","searchingText":"正在搜索正文…","randomHall":"随机 ↗","topics":"主题","allTopics":"全部","resultCount":"{n} 件匹配"},
"zh-TW":{"continueReading":"繼續閱讀","continueNote":"從上次停下的地方繼續","favorites":"我的收藏","favoritesNote":"你標記的展品","readPct":"已讀 {n}%","readDone":"已讀完","opened":"已開啟","themeToDark":"切換到深色模式","themeToLight":"切換到淺色模式","more":"更多","share":"分享","linkCopied":"連結已複製","favorite":"收藏","favorited":"已收藏","markRead":"標記為已讀","markUnread":"標記為未讀","prevItem":"← 上一件","nextItem":"下一件 →","inThisHall":"本展廳","related":"相關展品","noRelated":"暫時沒有相關展品","resumeAt":"上次讀到 {n}%","resumeGo":"跳過去","finishedHint":"讀完了，看看相關展品？","appearance":"外觀與語言","tagLabel":"標籤","clearFilter":"清除","fulltextHit":"正文","searchingText":"正在搜尋正文…","randomHall":"隨機 ↗","topics":"主題","allTopics":"全部","resultCount":"{n} 件符合"},
"en":{"continueReading":"Continue Reading","continueNote":"Pick up where you left off","favorites":"Favorites","favoritesNote":"Exhibits you starred","readPct":"{n}% read","readDone":"Finished","opened":"Opened","themeToDark":"Switch to dark mode","themeToLight":"Switch to light mode","more":"More","share":"Share","linkCopied":"Link copied","favorite":"Favorite","favorited":"Favorited","markRead":"Mark as read","markUnread":"Mark as unread","prevItem":"← Previous","nextItem":"Next →","inThisHall":"In this collection","related":"Related exhibits","noRelated":"No related exhibits yet","resumeAt":"You stopped at {n}%","resumeGo":"Jump there","finishedHint":"Finished? See related exhibits","appearance":"Appearance & language","tagLabel":"Tag","clearFilter":"Clear","fulltextHit":"Text","searchingText":"Searching full text…","randomHall":"Random ↗","topics":"Topics","allTopics":"All","resultCount":"{n} matches"}
};
for(const l in additions)Object.assign(original[l],additions[l]);
const categories={
"history":{trad:"歷史與文明",en:"History & Civilization",descriptionTrad:"制度、社會、文化與文明變遷",descriptionEn:"Institutions, society, culture and changing civilizations"},
"science":{trad:"科學與原理",en:"Science & Principles",descriptionTrad:"物理、自然現象與視覺化演示",descriptionEn:"Physics, natural phenomena and interactive explanations"},
"nature":{trad:"自然與生命",en:"Nature & Life",descriptionTrad:"植物、生物與自然結構",descriptionEn:"Plants, living organisms and natural structures"},
"finance":{trad:"金融與投資",en:"Finance & Investing",descriptionTrad:"市場、投資、資產與個人金融知識",descriptionEn:"Markets, investing, assets and personal finance"},
"museum-guides":{trad:"博物館手冊",en:"Museum Guides",descriptionTrad:"博物館、展覽與文化機構的導覽冊、展覽手冊與圖錄",descriptionEn:"Guides, exhibition catalogues and publications from cultural institutions"},
"coffee":{trad:"咖啡與萃取",en:"Coffee & Brewing",descriptionTrad:"咖啡萃取、器具、養豆、儲存與風味研究",descriptionEn:"Coffee brewing, equipment, resting, storage and flavor"},
"gaming-tech":{trad:"遊戲與技術",en:"Gaming & Technology",descriptionTrad:"遊戲、模擬器、硬體配置、畫質與效能最佳化",descriptionEn:"Games, emulators, hardware settings, graphics and performance"}
};
let current="zh-CN";
try{const stored=localStorage.getItem(KEY);if(LANGS.includes(stored))current=stored;else{const l=(navigator.languages?.[0]||navigator.language||"zh-CN").toLowerCase();current=l.startsWith("zh")&&(l.includes("tw")||l.includes("hk")||l.includes("hant"))?"zh-TW":l.startsWith("zh")?"zh-CN":"en"}}catch{}
function t(key,vars){let v=original[current][key]||original["zh-CN"][key]||key;if(vars)for(const k in vars)v=v.replace("{"+k+"}",vars[k]);return v}
function categoryName(c){if(!c)return "";const e=categories[c.id];if(current==="en")return c.nameEn||e?.en||c.name;if(current==="zh-TW")return c.nameTrad||e?.trad||c.name;return c.name}
function categoryDescription(c){if(!c)return "";const e=categories[c.id];if(current==="en")return c.descriptionEn||e?.descriptionEn||c.description||"";if(current==="zh-TW")return c.descriptionTrad||e?.descriptionTrad||c.description||"";return c.description||""}
function categorySubname(c){if(!c)return "";return current==="en"?(c.name||""):(c.nameEn||"")}
function apply(){
 document.documentElement.lang=current;
 document.querySelectorAll("[data-i18n]").forEach(el=>{const value=t(el.dataset.i18n);if(el.dataset.i18n==="heroTitle"||el.dataset.i18n==="heroDesc")el.textContent=value;else el.textContent=value;});
 document.querySelectorAll("[data-i18n-placeholder]").forEach(el=>el.setAttribute("placeholder",t(el.dataset.i18nPlaceholder)));
 document.querySelectorAll("[data-i18n-title]").forEach(el=>el.setAttribute("title",t(el.dataset.i18nTitle)));
 document.querySelectorAll("[data-i18n-aria]").forEach(el=>el.setAttribute("aria-label",t(el.dataset.i18nAria)));
 document.querySelectorAll("[data-lang]").forEach(el=>{const active=el.dataset.lang===current;el.classList.toggle("active",active);el.setAttribute("aria-pressed",String(active));});
}
function set(lang){
 if(!LANGS.includes(lang)||lang===current)return;
 current=lang;try{localStorage.setItem(KEY,lang)}catch{}
 apply();
 document.dispatchEvent(new CustomEvent("km-language-change",{detail:{language:lang}}));
}
function mount(){
 if(!document.querySelector(".km-language-switch")){
  const custom=document.querySelector("[data-lang-mount]");const top=custom||document.querySelector(".topbar .top-actions");
  const viewer=document.querySelector(".viewer-right");
  const pdf=document.querySelector(".pdf-viewer-actions");
  const parent=top||viewer||pdf;
  if(parent){const nav=document.createElement("nav");nav.className="km-language-switch";nav.setAttribute("aria-label","Language / 语言");
    for(const [lang,label] of [["zh-CN","简"],["zh-TW","繁"],["en","EN"]]){
      const b=document.createElement("button");b.type="button";b.dataset.lang=lang;b.textContent=label;b.addEventListener("click",()=>set(lang));nav.append(b);
    }
    if(top)parent.prepend(nav);else parent.append(nav);
  }
 }
 apply();
}
document.addEventListener("DOMContentLoaded",mount,{once:true});
window.KM_I18N={t,set,get language(){return current},categoryName,categoryDescription,categorySubname,apply,mount,storageKey:KEY};
})();