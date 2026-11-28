#!/usr/bin/env python3
"""Maintain data/yellow-pages.json (the Knowledge Atlas / 知识黄页).

Run by .github/workflows/yellow-pages.yml. Modes:

    python3 tools/yellow_pages.py clean     # tidy names/URLs, assign ids, remove duplicates (offline)
    python3 tools/yellow_pages.py enrich    # clean + fetch description / preview image for sites that lack them
    python3 tools/yellow_pages.py check     # clean + re-check every link (+ enrich what is still missing)

Fields per site (short keys keep the file small):
  id  stable id (assigned automatically when missing)
  n   display name (cleaned)            o   original page title, kept for search when it differs
  u   URL                               c / s  category / sub-category
  t   "read" | "data"                   d   one-line description
  ds  where d came from: "meta" (the site's own description), "ai" or "manual"
  img preview image path (assets/yp-thumbs/<id>.webp)
  st  link status: "ok" | "dead" | "unknown"     ck  date of last check
Only the site's own data is fetched; descriptions written by hand ("manual") are never overwritten.
"""
import concurrent.futures as cf
import datetime as dt
import gzip
import html
import io
import json
import os
import re
import socket
import ssl
import sys
import urllib.error
import urllib.parse
import urllib.request
import zlib
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data", "yellow-pages.json")
THUMBS = os.path.join(ROOT, "assets", "yp-thumbs")
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
TODAY = dt.date.today().isoformat()

# ---------------------------------------------------------------- cleaning
TRACKING = re.compile(r"^(utm_[a-z]+|spm_id_from|vd_source|from_spmid|share_source|share_medium|share_plat|share_tag|"
                      r"share_session_id|timestamp|unique_k|bbid|ts|fbclid|gclid|mc_cid|mc_eid|from|isappinstalled)$", re.I)
GENERIC = {"首页", "主页", "官网", "官方网站", "home", "homepage", "home page", "index", "welcome", "欢迎", "main page", "ホーム", "トップ", "top", "journal home", "您的主页", "你的主页"}
# Page-section words: when a title starts with one of these, the site name usually comes last ("Paintings - Pat Perry").
SECTION = {"overview", "paintings", "painting", "artists", "artist", "works", "work", "selected works", "about", "about me",
           "gallery", "portfolio", "shop", "store", "collections", "collection", "projects", "project", "news", "blog",
           "contact", "sculpture", "sculptures", "illustration", "illustrations", "photography", "drawings", "prints",
           "exhibitions", "exhibition", "artworks", "artwork", "biography", "bio", "index of works"}
FIXED_SUFFIXES = [r"_哔哩哔哩_bilibili$", r"_哔哩哔哩 \(゜-゜\)つロ 干杯~-bilibili$", r"_bilibili$", r" - YouTube$",
                  r" - 知乎$", r"_知乎$", r" - 维基百科，自由的百科全书$", r" - Wikipedia$", r" – 世界上最大的电子图书馆。.*$",
                  r" - Powered by Discuz!$"]
SEP = re.compile(r"\s*[|｜]\s*|\s+[–—·•»:]{1,2}\s+|\s+-\s+|\s+_\s+|(?<=[^\x00-\x7f])_|_(?=[^\x00-\x7f])")
CJK = r"[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]"


def clean_url(u):
    u = u.strip()
    try:
        p = urllib.parse.urlsplit(u)
    except ValueError:
        return u
    q = [(k, v) for k, v in urllib.parse.parse_qsl(p.query, keep_blank_values=True) if not TRACKING.match(k)]
    return urllib.parse.urlunsplit((p.scheme, p.netloc, p.path, urllib.parse.urlencode(q, doseq=True), p.fragment))


def norm_url(u):
    p = urllib.parse.urlsplit(u.lower())
    return (p.netloc.removeprefix("www.") + p.path.rstrip("/") + ("?" + p.query if p.query else ""))


def clean_name(title):
    t = html.unescape(re.sub(r"\s+", " ", title or "")).strip()
    t = re.sub(rf"(?<={CJK}) (?={CJK})", "", t)  # "香 港 特 别" -> "香港特别"
    for pat in FIXED_SUFFIXES:
        t = re.sub(pat, "", t).strip()
    parts = [x.strip() for x in SEP.split(t) if x.strip()]
    parts = [x for x in parts if x.lower() not in GENERIC] or parts
    name = parts[0] if parts else t
    if len(parts) > 1 and name.lower() in SECTION:
        name = parts[1] + " · " + name
    elif len(parts) > 1 and re.fullmatch(rf"{CJK}{{2,4}}", name) and re.search(r"(网|网站|門戶|门户|平台|官网|官網)$", parts[-1]):
        name = parts[-1] + " · " + name
    # a "name" that is only a few characters of a long title is usually a section label; keep two parts then
    if len(parts) > 1 and len(name) < 3:
        name = parts[0] + " · " + parts[1]
    if len(name) > 48:
        for sep in (":", "：", "，", ",", "。"):
            if sep in name and 3 <= name.index(sep) <= 48:
                name = name[:name.index(sep)].strip()
                break
    if len(name) > 60:
        name = name[:58].rstrip() + "…"
    return name


def clean_all(data):
    sites = data["sites"]
    used = {str(s.get("id")) for s in sites if s.get("id")}
    next_id = max([int(i) for i in used if str(i).isdigit()] + [0]) + 1
    seen, out, removed = {}, [], 0
    for s in sites:
        if not s.get("u") or not s.get("n") and not s.get("o"):
            continue
        if not s.get("id"):
            while str(next_id) in used:
                next_id += 1
            s["id"] = str(next_id)
            used.add(s["id"])
            next_id += 1
        s["id"] = str(s["id"])
        s["u"] = clean_url(s["u"])
        original = s.get("o") or s["n"]
        if s.get("nm") != 1:  # nm = 1 marks a hand-edited name
            name = clean_name(original)
            s["n"] = name
            if name != original:
                s["o"] = original
            else:
                s.pop("o", None)
        s.setdefault("t", "read")
        key = norm_url(s["u"])
        if key in seen:
            removed += 1
            continue
        seen[key] = s
        out.append(s)
    data["sites"] = out
    data["total"] = len(out)
    return removed


# ---------------------------------------------------------------- fetching
class Head(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.meta, self.title, self._in_title = {}, "", False

    def handle_starttag(self, tag, attrs):
        a = {k.lower(): (v or "") for k, v in attrs}
        if tag == "meta":
            key = (a.get("property") or a.get("name") or a.get("itemprop") or "").lower()
            if key and a.get("content") and key not in self.meta:
                self.meta[key] = a["content"].strip()
        elif tag == "title":
            self._in_title = True

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False

    def handle_data(self, data):
        if self._in_title and len(self.title) < 300:
            self.title += data


CTX = ssl.create_default_context()
LOOSE = ssl.create_default_context()
LOOSE.check_hostname = False
LOOSE.verify_mode = ssl.CERT_NONE


def get(url, limit=700_000, timeout=20, loose=False):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html,application/xhtml+xml,image/*;q=0.9,*/*;q=0.8",
                                               "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8", "Accept-Encoding": "gzip, deflate"})
    with urllib.request.urlopen(req, timeout=timeout, context=LOOSE if loose else CTX) as r:
        body = r.read(limit)
        enc = (r.headers.get("Content-Encoding") or "").lower()
        if enc == "gzip":
            try:
                body = gzip.decompress(body)
            except Exception:
                body = gzip.GzipFile(fileobj=io.BytesIO(body)).read(limit)
        elif enc == "deflate":
            body = zlib.decompress(body, -zlib.MAX_WBITS)
        return r.status, r.geturl(), r.headers.get("Content-Type", ""), body


def decode(body, ctype):
    m = re.search(r"charset=([\w-]+)", ctype or "", re.I) or re.search(rb"<meta[^>]+charset=[\"']?([\w-]+)", body[:4000], re.I)
    enc = m.group(1) if m else "utf-8"
    if isinstance(enc, bytes):
        enc = enc.decode("ascii", "ignore")
    if enc.lower() in ("gb2312", "gbk"):
        enc = "gb18030"
    try:
        return body.decode(enc, "replace")
    except LookupError:
        return body.decode("utf-8", "replace")


def classify_error(e):
    if isinstance(e, urllib.error.HTTPError):
        return ("dead" if e.code in (404, 410) else "unknown"), e.code
    reason = getattr(e, "reason", e)
    if isinstance(reason, socket.gaierror) and reason.errno in (socket.EAI_NONAME, getattr(socket, "EAI_NODATA", -5)):
        return "dead", "dns"
    return "unknown", type(reason).__name__


def fetch_page(url):
    """Returns dict(status, final, html) — tries https first for http URLs."""
    tries = [url]
    if url.startswith("http://"):
        tries = ["https://" + url[7:], url]
    last = ("unknown", None)
    for i, u in enumerate(tries):
        for loose in (False, True):
            try:
                code, final, ctype, body = get(u, loose=loose)
                text = decode(body, ctype) if "html" in ctype.lower() or body[:200].lstrip().startswith(b"<") else ""
                return {"st": "ok", "final": final, "html": text, "https": u.startswith("https://") and url.startswith("http://")}
            except ssl.SSLError:
                continue
            except urllib.error.URLError as e:
                if isinstance(getattr(e, "reason", None), ssl.SSLError) and not loose:
                    continue
                last = classify_error(e)
                break
            except Exception as e:
                last = ("unknown", type(e).__name__)
                break
    return {"st": last[0], "code": last[1]}


def first(meta, *keys):
    for k in keys:
        v = meta.get(k)
        if v and len(v.strip()) > 1:
            return html.unescape(re.sub(r"\s+", " ", v)).strip()
    return ""


def make_thumb(img_url, sid):
    try:
        from PIL import Image
    except ImportError:
        return None
    try:
        _, _, ctype, body = get(img_url, limit=6_000_000, timeout=25, loose=True)
        if "svg" in ctype:
            return None
        im = Image.open(io.BytesIO(body))
        im.load()
        if im.width < 200 or im.height < 100:
            return None
        im = im.convert("RGB")
        w = 520
        h = round(im.height * w / im.width)
        im = im.resize((w, h), Image.LANCZOS)
        if h > round(w * 0.75):  # very tall images: keep the top part
            im = im.crop((0, 0, w, round(w * 0.75)))
        os.makedirs(THUMBS, exist_ok=True)
        path = os.path.join(THUMBS, sid + ".webp")
        im.save(path, "WEBP", quality=66, method=6)
        return "assets/yp-thumbs/" + sid + ".webp"
    except Exception:
        return None


def process(site, want_meta):
    r = fetch_page(site["u"])
    out = {"st": r["st"], "ck": TODAY}
    if r["st"] != "ok":
        return out
    if r.get("https"):
        out["u"] = "https://" + site["u"][7:]
    if not want_meta or not r.get("html"):
        return out
    p = Head()
    try:
        p.feed(r["html"][:400_000])
    except Exception:
        pass
    desc = first(p.meta, "og:description", "description", "twitter:description")
    if desc:
        out["d"] = desc[:180] + ("…" if len(desc) > 180 else "")
    img = first(p.meta, "og:image", "og:image:url", "og:image:secure_url", "twitter:image", "twitter:image:src", "image")
    if img and not site.get("img"):
        thumb = make_thumb(urllib.parse.urljoin(r["final"], img), site["id"])
        if thumb:
            out["img"] = thumb
    return out


def run(mode):
    data = json.load(open(DATA, encoding="utf-8"))
    removed = clean_all(data)
    if removed:
        print(f"Removed {removed} duplicate(s)")
    sites = data["sites"]
    if mode in ("enrich", "check"):
        todo = []
        for s in sites:
            need_meta = s.get("ds") not in ("manual", "ai") and not s.get("d") or (not s.get("img") and not s.get("ck"))
            if mode == "check" or need_meta or not s.get("ck"):
                todo.append((s, need_meta))
        print(f"Fetching {len(todo)} site(s)…")
        stats = {"ok": 0, "dead": 0, "unknown": 0, "d": 0, "img": 0, "https": 0}
        with cf.ThreadPoolExecutor(max_workers=24) as ex:
            futs = {ex.submit(process, s, need): s for s, need in todo}
            for i, f in enumerate(cf.as_completed(futs), 1):
                s = futs[f]
                try:
                    res = f.result()
                except Exception as e:
                    res = {"st": "unknown", "ck": TODAY}
                stats[res["st"]] += 1
                if "u" in res:
                    s["u"] = res["u"]; stats["https"] += 1
                if res.get("d") and s.get("ds") not in ("manual", "ai"):
                    s["d"] = res["d"]; s["ds"] = "meta"; stats["d"] += 1
                if res.get("img"):
                    s["img"] = res["img"]; stats["img"] += 1
                s["st"], s["ck"] = res["st"], res["ck"]
                if i % 50 == 0:
                    print(f"  {i}/{len(todo)}")
        print("Result:", stats)
    data["version"] = TODAY
    raw = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    # one site per line keeps git diffs readable
    raw = raw.replace(',"sites":[{', ',"sites":[\n{').replace('},{"id"', '},\n{"id"').replace("}]}", "}\n]}") + "\n"
    open(DATA, "w", encoding="utf-8").write(raw)
    total = len(sites)
    print(f"Sites: {total} · with description: {sum(1 for s in sites if s.get('d'))} · with image: {sum(1 for s in sites if s.get('img'))} · "
          f"dead: {sum(1 for s in sites if s.get('st') == 'dead')} · unknown: {sum(1 for s in sites if s.get('st') == 'unknown')}")


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "clean"
    if mode not in ("clean", "enrich", "check"):
        sys.exit(__doc__)
    run(mode)
