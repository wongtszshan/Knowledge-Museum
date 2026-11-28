# Knowledge Museum 维护与配置说明

> 本文档用于说明 Knowledge Museum 的目录结构、内容添加方式、分类配置、文章登记方式、PWA 更新逻辑，以及交给其他 AI 继续维护时应遵守的规则。
>
> 如果你是新的 AI 助手：请先完整阅读本文件，再修改仓库。

---

## 1. 项目定位

Knowledge Museum 是一个基于 GitHub Pages 的个人知识库 / PWA。

核心原则：

1. **原始知识 HTML 尽量保持独立，不修改内部结构。**
2. **网站首页、分类、搜索、阅读器与内容文件分离。**
3. **新增知识内容时，优先通过配置文件更新，而不是改首页代码。**
4. **文件路径尽量稳定，分类通过 JSON 元数据管理。**
5. **PWA 更新不依赖手动修改版本号。**

---

## 2. 目录结构

当前核心结构：

```text
Knowledge-Museum/
│
├── index.html / archive.html / category.html   ← 博物馆页面
├── viewer.html / pdf-viewer.html               ← 阅读器外壳（HTML / PDF）
├── yellow-pages.html                           ← 知识黄页（独立，不与馆藏关联）
├── manifest.webmanifest
├── sw.js
│
├── data/
│   ├── categories.json      ← 展厅（手动维护）
│   ├── articles.json        ← 展品目录（手动维护；日期/页数由 Action 自动补）
│   ├── search-index.json    ← 全文搜索索引（自动生成，不要手改）
│   └── yellow-pages.json
│
├── content/
│   ├── html/                ← HTML 展品
│   └── pdf/                 ← 本地 PDF 展品
│
├── assets/
│   ├── css/app.css
│   ├── js/theme.js          ← 浅色/深色切换
│   ├── js/i18n.js           ← 简/繁/EN 界面文字
│   ├── js/core.js           ← 公共：目录读取、阅读记录、相关推荐
│   ├── js/app.js            ← 首页 / 展厅 / 全部馆藏
│   ├── js/reader.js         ← 阅读器
│   ├── icons/  splash/
│   └── covers/              ← （可选）展品封面
│
├── tools/
│   ├── validate.py          ← 检查目录是否有错
│   └── update_catalogue.py  ← 补日期、PDF 页数，生成全文索引
│
└── .github/workflows/maintain.yml  ← 每次 push 后自动运行上面两个脚本
```

---

## 3. 各文件作用

### `index.html`

Knowledge Museum 首页。

作用：
- 展示分类
- 展示文章目录
- 搜索
- 分类筛选
- 随机漫游

正常新增文章时，**不应该修改这里**。

---

### `viewer.html`

统一阅读器外壳。

作用：
- 提供“上一页”
- 提供“返回 Museum”
- 提供“全屏打开”
- 用 iframe 加载原始 HTML

原始 HTML 不需要自己带“返回首页”。

正常新增文章时，**不应该修改这里**。

---

### `content/html/`

所有独立知识 HTML 的存放位置。

例如：

```text
content/html/us-stock-investing-guide.html
```

规则：

- 推荐使用英文、小写、短横线文件名
- 不推荐中文文件名
- 不使用空格
- 不使用特殊符号
- 尽量不要频繁改文件名

推荐：

```text
coffee-water-chemistry.html
us-stock-investing-guide.html
sudoku-x-wing.html
camera-lens-language.html
```

不推荐：

```text
咖啡水质研究.html
我的新文件 1.html
美股投资 · 最新版.html
```

---

## 4. 新增一篇 HTML 的标准流程

假设你新增：

```text
coffee-water-chemistry.html
```

### 第一步：上传 HTML

放到：

```text
content/html/coffee-water-chemistry.html
```

---

### 第二步：检查是否已有合适分类

打开：

```text
data/categories.json
```

如果已有：

```json
{
  "id": "coffee",
  "name": "咖啡",
  "nameEn": "Coffee",
  "description": "咖啡、萃取、品种、烘焙与风味",
  "accent": "#8A5A44",
  "order": 5
}
```

则直接使用 `coffee`。

如果没有，则先新增分类。

---

### 第三步：在 `articles.json` 登记文章

打开：

```text
data/articles.json
```

新增：

```json
{
  "id": "coffee-water-chemistry",
  "title": "咖啡水质与风味",
  "subtitle": "冲煮水中的矿物质、硬度、碱度与萃取",
  "file": "coffee-water-chemistry.html",
  "categories": ["coffee"],
  "tags": ["咖啡", "手冲", "水质", "矿物质", "萃取"],
  "summary": "介绍冲煮水中矿物质组成与咖啡萃取、风味表现之间的关系。",
  "created": "2026-10-05",
  "updated": "2026-10-05",
  "featured": true
}
```

完成后，首页会自动读取这篇文章。

---

## 5. `articles.json` 字段说明

### `id`

文章唯一 ID。

规则：
- 英文
- 小写
- 用短横线
- 不允许重复

示例：

```text
us-stock-investing-guide
coffee-water-chemistry
venturi-effect
```

---

### `title`

首页显示的中文主标题。

---

### `subtitle`

副标题。

用于辅助说明文章主题。

---

### `file`

对应 `content/html/` 里的文件名。

例如：

```json
"file": "us-stock-investing-guide.html"
```

实际路径会自动组成：

```text
content/html/us-stock-investing-guide.html
```

---

### `categories`

文章所属分类。

允许多个分类：

```json
"categories": ["coffee", "science"]
```

分类 ID 必须已经存在于：

```text
data/categories.json
```

---

### `tags`

文章标签。

标签比分类更自由。

例如：

```json
"tags": ["美股", "ETF", "投资", "股票", "风险管理"]
```

---

### `summary`

文章简介。

建议 20～80 个中文字符。

---

### `created`

首次加入知识库日期。

格式：

```text
YYYY-MM-DD
```

---

### `updated`

最后更新时间。

如果文章内容发生明显修改，更新这个日期。

---

### `featured`

是否作为重点内容。

当前可以填写：

```json
true
```

或：

```json
false
```

---

## 6. `categories.json` 字段说明

示例：

```json
{
  "id": "finance",
  "name": "金融与投资",
  "nameEn": "Finance & Investing",
  "nameTrad": "金融與投資",
  "description": "市场、投资、资产与个人金融知识",
  "descriptionTrad": "市場、投資、資產與個人金融知識",
  "descriptionEn": "Markets, investing, assets and personal finance",
  "accent": "#7A6A45",
  "tint": "#e9e3d1",
  "symbol": "F",
  "order": 4
}
```

新增字段（2026-11）：

- `nameTrad` / `descriptionTrad`：繁体界面显示的名称和简介（缺省时显示简体）。
- `descriptionEn`：英文界面显示的简介。
- `tint`：首页展厅卡片的浅底色，`#RRGGBB`。
- `symbol`：首页卡片右上角的大字母，一个字符。

加新展厅时把这些一起填上，**不需要改任何 JS**。

### `id`

分类唯一 ID。

必须英文、小写、短横线风格。

---

### `name`

中文分类名。

---

### `nameEn`

英文分类名。

---

### `description`

分类简介。

---

### `accent`

分类主题色。

格式：

```text
#RRGGBB
```

---

### `order`

首页分类显示顺序。

数字越小越靠前。

例如：

```text
1 = 历史
2 = 科学
3 = 自然
4 = 金融
```

---

## 7. 分类设计原则

Knowledge Museum 使用：

```text
Category + Tags
```

而不是依赖文件夹分类。

例如：

```text
Category:
金融与投资

Tags:
美股
ETF
股票
资产配置
风险管理
```

同一篇文章也可以属于多个分类：

```json
"categories": ["finance", "science"]
```

因此不要为了改变分类去移动 HTML 文件。

---

## 8. 重命名 HTML 的正确方式

如果原文件叫：

```text
美股投资入门学习计划 · 散户进化手册.html
```

建议改成：

```text
us-stock-investing-guide.html
```

重命名时必须同时检查：

```text
data/articles.json
```

对应记录中的：

```json
"file": "us-stock-investing-guide.html"
```

否则首页能看到文章，但点击后会找不到文件。

---

## 9. 不需要每次改版本号

普通新增文章时：

- 不需要改 `v1 / v2 / v3`
- 不需要删除手机上的 PWA
- 不需要重新添加到主屏幕
- 不需要修改 `CACHE_NAME`

GitHub 每次提交都会自动保留历史版本。

---

## 10. PWA 更新逻辑

当前 `sw.js` 的设计目标：

### 目录配置

```text
data/articles.json
data/categories.json
```

采用：

```text
Network First
```

优先读取 GitHub Pages 上的最新版。

---

### 知识 HTML

```text
content/html/*.html
```

采用：

```text
Network First
```

联网时优先最新内容。

如果离线，则读取之前缓存过的版本。

---

### 网站外壳

例如：

```text
index.html
viewer.html
assets/css/app.css
assets/js/app.js
```

允许缓存，并自动后台更新。

---

## 11. 手机 PWA 更新验证方法

验证自动更新时：

1. 先打开 GitHub Pages
2. 添加到手机桌面
3. 确认当前文章数量
4. GitHub 新增一篇文章
5. 更新 `articles.json`
6. 等 GitHub Pages 部署完成
7. 再打开手机桌面的 Knowledge Museum

正常情况下，新文章会自动出现。

---

## 12. GitHub Pages 部署

当前建议：

```text
Settings
→ Pages
→ Build and deployment
→ Deploy from a branch
→ main
→ / (root)
```

仓库：

```text
wongtszshan/Knowledge-Museum
```

预计站点：

```text
https://wongtszshan.github.io/Knowledge-Museum/
```

---

## 13. 手动新增文章的最简清单

每次新增内容，只需要检查：

- [ ] HTML 是否放入 `content/html/`
- [ ] 文件名是否使用英文、小写、短横线
- [ ] 分类是否已存在
- [ ] 如没有分类，更新 `categories.json`
- [ ] 更新 `articles.json`
- [ ] `id` 是否唯一
- [ ] `file` 是否与实际文件名完全一致
- [ ] JSON 格式是否正确
- [ ] 提交到 `main`
- [ ] 等待 GitHub Pages 自动部署

---

# 14. 给 AI 助手的维护规则

如果用户要求“把新的 HTML 加到 Knowledge Museum”，请按以下流程操作：

### A. 先读取

必须先检查：

```text
KNOWLEDGE_MUSEUM_GUIDE.md
data/categories.json
data/articles.json
```

---

### B. 检查新 HTML

确认：

- 文件标题
- 主题
- 是否已有合适分类
- 是否需要新分类
- 是否需要重命名为英文文件名

---

### C. 文件名规范

默认使用：

```text
lowercase-kebab-case.html
```

示例：

```text
us-stock-investing-guide.html
```

除非用户明确要求，否则不要保留复杂中文文件名。

---

### D. 不要修改原始 HTML 内容

如果用户只是要求“加入知识库”，默认：

> 原始 HTML 作为独立展品保留。

不要为了加入 Knowledge Museum 而：
- 改内部 CSS
- 改排版
- 插入返回首页按钮
- 重构原文件

统一导航由：

```text
viewer.html
```

负责。

---

### E. 分类策略

优先复用已有分类。

只有明显不存在合适分类时，才新增分类。

不要因为每篇文章主题不同就无限创建新分类。

细粒度主题优先使用：

```text
tags
```

---

### F. 更新文章配置

每个新 HTML 必须在：

```text
data/articles.json
```

登记。

否则网站不会显示。

---

### G. 不要随意修改

正常新增内容时不要改：

```text
index.html / archive.html / category.html
viewer.html / pdf-viewer.html
assets/js/*.js
assets/css/app.css
sw.js
manifest.webmanifest
data/search-index.json（自动生成）
```

只有用户明确要求网站功能或界面调整时才修改。

---

### H. 不要为了新增文章修改 PWA 版本号

新增 HTML / 分类 / 文章配置时，不需要修改 Service Worker 缓存版本。

---

### I. 提交后检查

至少验证：

1. HTML 文件存在
2. `articles.json` 的 `file` 与实际文件名一致
3. 分类 ID 存在
4. JSON 可正常解析
5. GitHub `main` 已更新

---

## 15. 给新的 AI 的推荐提示词

用户以后可以直接说：

> 请先读取仓库里的 `KNOWLEDGE_MUSEUM_GUIDE.md`，然后按照里面的规则维护 Knowledge Museum。我要新增一个 HTML，请帮我判断分类、规范文件名、上传到 `content/html/`，并同步更新 `categories.json` 和 `articles.json`。除非必要，不要修改网站主程序。

---

## 16. 当前已有分类

当前分类：

```text
history  → 历史与文明
science  → 科学与原理
nature   → 自然与生命
finance  → 金融与投资
```

以后以实际 `data/categories.json` 为准。

---

## 17. 当前维护原则总结

最重要的规则只有一句：

> **HTML 是展品，JSON 是馆藏目录，index / viewer 是博物馆本体。**

新增展品时，尽量只动：

```text
content/html/
data/articles.json
data/categories.json
```

不要让每次新增知识都变成一次网站开发。


---

## 18. PDF 展品

Knowledge Museum 支持两种主要展品类型：

```text
HTML → content/html/
PDF  → content/pdf/
```

PDF 文件同样推荐使用英文、小写、短横线文件名，例如：

```text
royal-screen-of-empire.pdf
louvre-exhibition-guide.pdf
museum-map-guide.pdf
```

展示标题可以继续使用中文。

PDF 在 `data/articles.json` 中必须包含：

```json
{
  "id": "royal-screen-of-empire",
  "title": "藩屏天下：湖北明代宗藩文物特展",
  "file": "royal-screen-of-empire.pdf",
  "type": "pdf",
  "pages": 20,
  "categories": ["museum-guides"],
  "tags": ["博物馆", "展览手册"]
}
```

HTML 展品建议明确使用：

```json
"type": "html"
```

点击 HTML 时进入 `viewer.html`；点击 PDF 时进入 `pdf-viewer.html`。

PDF 默认不加入 Service Worker 离线预缓存，因为博物馆手册可能较大，避免手机无意义占用大量缓存空间。PDF 在线阅读时由浏览器正常加载。

### 新增 PDF 最简流程

- [ ] 将 PDF 文件改为英文 kebab-case 文件名
- [ ] 上传到 `content/pdf/`
- [ ] 检查 / 新增合适分类
- [ ] 在 `data/articles.json` 添加记录并设置 `"type": "pdf"`
- [ ] 如已知页数，可填写 `"pages"`
- [ ] 提交到 `main`
- [ ] 不需要修改 `pdf-viewer.html`、首页或 Service Worker

当前 PDF 专用分类：

```text
museum-guides → 博物馆手册 / Museum Guides
```


### 18.2 远程 PDF（Cloudflare R2）

PDF 展品同时支持 GitHub 本地文件和远程 URL。

本地 PDF：

```json
{
  "type": "pdf",
  "file": "example.pdf"
}
```

读取路径为 `content/pdf/example.pdf`。

远程 PDF：

```json
{
  "type": "pdf",
  "file": "example.pdf",
  "url": "https://example.r2.dev/example.pdf"
}
```

当 `url` 存在时，PDF 阅读器优先使用远程 URL；没有 `url` 时才读取本地 `content/pdf/` 文件。因此本地小 PDF 和 R2 大 PDF 可以同时存在。


---

## 19. 自动维护（GitHub Action）

文件：`.github/workflows/maintain.yml`。每次 push 到 `main`，只要改动了 `content/`、`data/articles.json`、`data/categories.json` 或 `tools/`，就会自动：

1. **检查目录**（`tools/validate.py`）：JSON 格式、必填字段、重复 id、分类是否存在、`file` 指向的文件是否存在、日期和颜色格式。
   - 有错误时，这次运行显示红色 ✗，GitHub 的 Actions 页面会列出具体是哪一条、哪个字段出错。
   - `content/` 里有没登记的文件只会提示（⚠），不算错误。
2. **自动补信息**（`tools/update_catalogue.py`）：
   - `created` 为空时，用这个文件第一次提交的日期补上；
   - `updated` 自动更新为这个文件最近一次提交的日期（只会往后更新，不会改回去）；
   - PDF 的 `pages` 为空时自动补页数；
   - 重新生成 `data/search-index.json`（全文搜索用）。
3. 有改动就由 `github-actions[bot]` 自动提交回 `main`，GitHub Pages 随后重新部署。

所以新增展品时，`created` / `updated` / `pages` **可以不填**。手填的值会被保留（`updated` 除外，它会跟随文件的实际修改时间）。

本地手动运行：

```bash
python3 tools/validate.py
python3 tools/update_catalogue.py --no-dates   # 浅克隆时跳过日期
```

需要 `poppler-utils`（`pdftotext`、`pdfinfo`）来处理 PDF；Action 里已自动安装。远程 R2 PDF 会下载一次提取文字，之后会复用索引里已有的结果，不会每次都下载。

---

## 20. 全文搜索、阅读记录与其它功能

- **全文搜索**：全部馆藏和展厅页的搜索框会同时搜索标题、标签、简介和展品正文（来自 `search-index.json`）。只在正文中匹配到的结果排在后面，并显示命中的那句话。扫描版 PDF 没有文字层，搜不到正文。
- **标签**：卡片上的 `#标签` 可以点击，跳到 `archive.html?tag=标签`，列出所有带这个标签的展品。
- **展厅主题**：展厅页会自动把展厅内出现 2 次以上的标签做成筛选按钮（几乎所有展品都有的标签，例如「博物馆」，会自动略过）。
- **阅读记录**：记录在当前浏览器的 localStorage（`km-reading-v1`），不上传、不跨设备同步。
  - HTML 展品会自动记录阅读进度，读到 95% 标记为「已读完」；PDF 只记录「已打开」，可在阅读器「更多」里手动标记已读。
  - 首页会显示「继续阅读」和「我的收藏」（有内容时才出现）。
- **阅读器**：顶栏显示所属展厅；☆ 收藏；「更多」里有上一件 / 下一件（同展厅）、相关展品（按共同标签和展厅推荐）、分享、标记已读、外观与语言。HTML 展品往下滚动时顶栏自动收起，往上滚动时出现。
- **随机漫游**：优先挑没打开过的展品；在展厅页只在本展厅（和当前主题）里随机，在全部馆藏页跟随当前筛选。
- **深色模式**：顶栏 ☾ / ☀ 按钮手动切换，默认浅色。只作用于博物馆外壳，展品 HTML 本身保持原样。

### 展品封面 `cover`（目前不使用）

馆主决定**不加封面**，保持纯文字卡片。新增展品时不要填 `cover`，也不要生成封面图。以下仅说明代码仍支持这个字段：

```json
"cover": "assets/covers/venturi-effect.webp"
```

有 `cover` 时，画廊视图的卡片顶部会显示这张图（16:9，从顶部裁切）。没有就保持原来的纯文字卡片。建议 WebP、宽 800px 左右。

### 不再需要版本号

页面引用 CSS / JS 时不再带 `?v=...`。Service Worker 对页面、JS、CSS 使用「联网优先」，改完代码 push 后，下次打开就是新版本。只有修改 `sw.js` 里的预缓存清单时才需要改 `CACHE_NAME`。


---

## 21. 知识黄页（`yellow-pages.html`）

黄页是独立的网站收藏，**不与博物馆馆藏关联**，视觉风格也保持独立。数据在 `data/yellow-pages.json`。

### 21.1 页面功能

- **刷一刷**（默认）：信息流卡片，每次打开顺序都不同。没看过的、有预览图的、属于你点过 ♡ 的领域的网站更容易出现；隐藏的和已失效的不出现。可以按领域筛选，点「换一批」重新洗牌。
- **分类**：按领域、子分类浏览，可搜索（名称、原标题、简介、域名都能搜），可按名称或随机排序。
- **喜欢**：点过 ♡ 的网站；底部可以恢复「不感兴趣」隐藏掉的网站。
- 喜欢 / 隐藏 / 看过 只保存在当前浏览器（`km-atlas-v1`），不上传、不跨设备。
- 打开网站后再回来，会回到刷到的位置。

### 21.2 新增网站（手动）

在 `data/yellow-pages.json` 的 `sites` 列表里加一行，**只需要 4 个字段**：

```json
{"n":"网站名称","u":"https://example.com/","c":"科学自然与地理","s":"天文与太空"},
```

- `c`（领域）和 `s`（子分类）尽量用已有的名称，这样会归到现有分类里，翻译也能对上。
- 每个网站一行，放在列表任意位置都可以（注意逗号：除了最后一行，每行末尾都要有逗号）。
- push 后，GitHub Action「Yellow pages」会自动：分配 `id`、清理名称和跟踪参数、抓取网站自己的简介和预览图、检查链接。大约 2–5 分钟后页面上就能看到完整卡片。

如果想自己写简介，加上 `"d":"一句话简介","ds":"manual"`，以后不会被覆盖。想固定名称不被自动清理，加 `"nm":1`。

### 21.3 删除或修改网站

- **删除**：在 `data/yellow-pages.json` 里删掉那一行（注意前后逗号）。预览图 `assets/yp-thumbs/<id>.webp` 可以一起删，也可以留着。
- **修改分类**：直接改那一行的 `c` / `s`。
- **修改名称**：改 `n` 并加 `"nm":1`。

### 21.4 字段说明

| 字段 | 含义 | 谁来填 |
|---|---|---|
| `id` | 唯一编号 | 自动 |
| `n` | 显示名称 | 手填，自动清理（`nm:1` 时不清理） |
| `o` | 网页原标题（名称被清理过时保留，用于搜索） | 自动 |
| `u` | 网址 | 手填（自动去掉跟踪参数，能用 https 的自动升级） |
| `c` / `s` | 领域 / 子分类 | 手填 |
| `t` | `read` 或 `data`（数据查询类） | 可选 |
| `d` | 一句话简介 | 自动抓取；也可手写 |
| `ds` | 简介来源：`meta` 网站自带 / `ai` AI 撰写（页面上标「AI 简介」）/ `manual` 手写 | 自动 |
| `img` | 预览图（网站自带的分享图，压缩后存在 `assets/yp-thumbs/`） | 自动 |
| `st` / `ck` | 链接状态（`ok` / `dead` / `unknown`）/ 检查日期 | 自动 |

### 21.5 自动维护

文件：`.github/workflows/yellow-pages.yml`，脚本：`tools/yellow_pages.py`。

- `data/yellow-pages.json` 有改动并 push 时：补全新网站的信息。
- **每月 1 日**：重新检查所有链接。只有域名已不存在、或深层链接返回 404/410 时才标「可能已失效」；首页返回 404、超时、拒绝访问等情况算「未知」，不会标失效（很多中文网站会拦截海外服务器的访问）。
- 标「可能已失效」的网站不会出现在「刷一刷」里，在「分类」里会附上「网页存档」（Wayback Machine）链接。
- 也可以手动运行：GitHub 仓库 → Actions → Yellow pages → Run workflow，选 `enrich`（只补缺的）或 `check`（重新检查全部链接）。
