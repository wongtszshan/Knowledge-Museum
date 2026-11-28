#!/usr/bin/env python3
"""Keep data/articles.json and data/search-index.json up to date.

Run by .github/workflows/maintain.yml after every push. It can also be run by hand:

    python3 tools/update_catalogue.py              # dates + PDF pages + search index
    python3 tools/update_catalogue.py --no-dates   # skip git dates (e.g. in a shallow clone)

What it changes:
  * created  - filled in from the file's first git commit, only when missing.
  * updated  - moved forward to the file's latest git commit date (never moved back).
  * pages    - filled in for PDFs, only when missing.
  * data/search-index.json - plain text of every exhibit, used by full-text search.

Hand-written values are never overwritten except `updated` moving forward.
Needs: git, and poppler-utils (pdftotext / pdfinfo) for PDFs.
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.request
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTICLES = os.path.join(ROOT, "data", "articles.json")
INDEX = os.path.join(ROOT, "data", "search-index.json")
HTML_CAP = 30000   # characters of text kept per HTML exhibit
PDF_CAP = 12000    # characters of text kept per PDF exhibit (keeps the index light on phones)


class TextExtractor(HTMLParser):
    SKIP = {"script", "style", "noscript", "template", "head"}
    BLOCK = {"text", "tspan", "p", "div", "section", "article", "li", "tr", "br", "h1", "h2", "h3", "h4", "h5", "h6", "td", "th", "figcaption", "blockquote"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.depth = 0
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag in self.SKIP:
            self.depth += 1
        elif tag in self.BLOCK:
            self.parts.append(" ")

    def handle_endtag(self, tag):
        if tag in self.SKIP and self.depth:
            self.depth -= 1
        elif tag in self.BLOCK:
            self.parts.append(" ")

    def handle_data(self, data):
        if not self.depth:
            self.parts.append(data)


# PDFs with embedded fonts sometimes extract as random glyphs from unrelated scripts.
# Keep Latin, Greek, CJK, kana, hangul, digits, punctuation and common symbols only.
KEEP = re.compile(r"[^\u0000-\u024F\u0370-\u03FF\u2000-\u206F\u2100-\u27BF\u3000-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFFEF]")


def clean(text):
    return re.sub(r"\s+", " ", KEEP.sub(" ", text)).strip()


def html_text(path):
    with open(path, encoding="utf-8", errors="ignore") as f:
        p = TextExtractor()
        p.feed(f.read())
    return clean("".join(p.parts))[:HTML_CAP]


def have(tool):
    return shutil.which(tool) is not None


def pdf_text(path):
    if not have("pdftotext"):
        return ""
    r = subprocess.run(["pdftotext", "-q", "-enc", "UTF-8", path, "-"], capture_output=True)
    return clean(r.stdout.decode("utf-8", "ignore"))[:PDF_CAP]


def pdf_pages(path):
    if not have("pdfinfo"):
        return None
    r = subprocess.run(["pdfinfo", path], capture_output=True)
    m = re.search(r"^Pages:\s+(\d+)", r.stdout.decode("utf-8", "ignore"), re.M)
    return int(m.group(1)) if m else None


def download(url):
    fd, tmp = tempfile.mkstemp(suffix=".pdf")
    os.close(fd)
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "knowledge-museum-maintainer"})
        with urllib.request.urlopen(req, timeout=180) as r, open(tmp, "wb") as f:
            shutil.copyfileobj(r, f)
        return tmp
    except Exception as e:  # network problems must never break the build
        print(f"  ! could not download {url}: {e}")
        os.remove(tmp)
        return None


def git_dates(relpath):
    """(first_commit_date, last_commit_date) as YYYY-MM-DD, or (None, None)."""
    def run(args):
        r = subprocess.run(["git", "-C", ROOT] + args, capture_output=True, text=True)
        return [x for x in r.stdout.split("\n") if x.strip()]
    last = run(["log", "-1", "--format=%cs", "--", relpath])
    first = run(["log", "--follow", "--diff-filter=A", "--format=%cs", "--", relpath])
    return (first[-1] if first else None), (last[0] if last else None)


def local_path(a):
    if a.get("type") == "pdf":
        if a.get("url") or re.match(r"^https?://", a.get("file", "")):
            return None
        return os.path.join("content", "pdf", a["file"])
    return os.path.join("content", "html", a["file"])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-dates", action="store_true", help="do not touch created/updated")
    ap.add_argument("--no-download", action="store_true", help="do not download remote PDFs")
    args = ap.parse_args()

    raw = open(ARTICLES, encoding="utf-8").read()
    articles = json.loads(raw)
    old_index = {}
    if os.path.exists(INDEX):
        try:
            old_index = {x["id"]: x for x in json.load(open(INDEX, encoding="utf-8")).get("items", [])}
        except Exception:
            old_index = {}

    shallow = subprocess.run(["git", "-C", ROOT, "rev-parse", "--is-shallow-repository"], capture_output=True, text=True).stdout.strip() == "true"
    if shallow and not args.no_dates:
        print("Shallow clone: skipping git dates (use fetch-depth: 0).")
        args.no_dates = True

    items = []
    for a in articles:
        rel = local_path(a)
        text, pages = "", None
        if rel:
            full = os.path.join(ROOT, rel)
            if not os.path.exists(full):
                print(f"  ! missing file for {a['id']}: {rel}")
                continue
            if a.get("type") == "pdf":
                text = pdf_text(full)
                pages = pdf_pages(full)
            else:
                text = html_text(full)
            if not args.no_dates:
                first, last = git_dates(rel)
                if first and not a.get("created"):
                    a["created"] = first
                if last and (not a.get("updated") or last > a["updated"]):
                    a["updated"] = last
        else:  # remote PDF
            prev = old_index.get(a["id"])
            if prev and prev.get("src") == a.get("url"):
                text = prev.get("text", "")
            elif not args.no_download and (have("pdftotext") or not a.get("pages")):
                print(f"  downloading {a['id']} …")
                tmp = download(a.get("url") or a["file"])
                if tmp:
                    text = pdf_text(tmp)
                    pages = pdf_pages(tmp)
                    os.remove(tmp)
        if a.get("type") == "pdf" and pages and not a.get("pages"):
            a["pages"] = pages
        entry = {"id": a["id"], "text": text}
        if not rel and a.get("url") and text:
            entry["src"] = a["url"]  # remembered so the PDF is not downloaded again
        items.append(entry)

    new_raw = json.dumps(articles, ensure_ascii=False, indent=2) + "\n"
    if new_raw != raw:
        open(ARTICLES, "w", encoding="utf-8").write(new_raw)
        print("Updated data/articles.json")
    index_raw = json.dumps({"note": "Generated by tools/update_catalogue.py - do not edit by hand.", "items": items}, ensure_ascii=False, separators=(",", ":")) + "\n"
    if not os.path.exists(INDEX) or open(INDEX, encoding="utf-8").read() != index_raw:
        open(INDEX, "w", encoding="utf-8").write(index_raw)
        print(f"Updated data/search-index.json ({len(index_raw.encode()) // 1024} KB, {len(items)} exhibits)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
