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
├── index.html
├── viewer.html
├── manifest.webmanifest
├── sw.js
│
├── data/
│   ├── categories.json
│   └── articles.json
│
├── content/
│   └── html/
│       ├── chinese-dynasties.html
│       ├── venturi-effect.html
│       ├── inflorescence-types.html
│       └── us-stock-investing-guide.html
│
└── assets/
    ├── css/
    │   └── app.css
    └── js/
        └── app.js
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
  "description": "市场、投资、资产与个人金融知识",
  "accent": "#7A6A45",
  "order": 4
}
```

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
index.html
viewer.html
assets/js/app.js
assets/css/app.css
sw.js
manifest.webmanifest
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
