#!/usr/bin/env python3
"""Check the museum catalogue before it goes live.

    python3 tools/validate.py

Errors (exit code 1) stop the GitHub Action and show up as a red ✗ on the commit:
  * articles.json / categories.json is not valid JSON
  * missing required fields, duplicate ids, bad id format
  * a category id used by an article does not exist
  * the file an article points to does not exist
  * dates not in YYYY-MM-DD format, colours not in #RRGGBB format
Warnings (printed, never fail): HTML/PDF files in content/ that no article uses, etc.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
errors, warnings = [], []
ID_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
COLOR_RE = re.compile(r"^#[0-9A-Fa-f]{6}$")


def load(rel):
    path = os.path.join(ROOT, rel)
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        errors.append(f"{rel}: file not found")
    except json.JSONDecodeError as e:
        errors.append(f"{rel}: invalid JSON at line {e.lineno}, column {e.colno}: {e.msg}")
    return None


def check_categories(cats):
    if not isinstance(cats, list):
        errors.append("categories.json must be a list")
        return set()
    ids = set()
    for i, c in enumerate(cats):
        where = f"categories.json #{i + 1} ({c.get('id', '?')})"
        for k in ("id", "name", "nameEn", "description", "accent", "order"):
            if k not in c or c[k] in ("", None):
                errors.append(f"{where}: missing '{k}'")
        cid = c.get("id", "")
        if cid and not ID_RE.match(cid):
            errors.append(f"{where}: id must be lowercase-with-dashes")
        if cid in ids:
            errors.append(f"{where}: duplicate id '{cid}'")
        ids.add(cid)
        for k in ("accent", "tint"):
            if c.get(k) and not COLOR_RE.match(c[k]):
                errors.append(f"{where}: '{k}' must look like #RRGGBB")
        if "order" in c and not isinstance(c["order"], (int, float)):
            errors.append(f"{where}: 'order' must be a number")
        if not c.get("tint") or not c.get("symbol"):
            warnings.append(f"{where}: no 'tint'/'symbol' - the home card will use defaults")
    return ids


def check_articles(arts, cat_ids):
    if not isinstance(arts, list):
        errors.append("articles.json must be a list")
        return
    ids, used_html, used_pdf = set(), set(), set()
    for i, a in enumerate(arts):
        where = f"articles.json #{i + 1} ({a.get('id', '?')})"
        for k in ("id", "title", "file", "categories"):
            if k not in a or a[k] in ("", None, []):
                errors.append(f"{where}: missing '{k}'")
        aid = a.get("id", "")
        if aid and not ID_RE.match(aid):
            errors.append(f"{where}: id must be lowercase-with-dashes")
        if aid in ids:
            errors.append(f"{where}: duplicate id '{aid}'")
        ids.add(aid)
        t = a.get("type", "html")
        if t not in ("html", "pdf"):
            errors.append(f"{where}: type must be 'html' or 'pdf'")
        cats = a.get("categories", [])
        if not isinstance(cats, list):
            errors.append(f"{where}: 'categories' must be a list")
            cats = []
        for c in cats:
            if c not in cat_ids:
                errors.append(f"{where}: category '{c}' does not exist in categories.json")
        if "tags" in a and not isinstance(a["tags"], list):
            errors.append(f"{where}: 'tags' must be a list")
        for k in ("created", "updated"):
            if a.get(k) and not DATE_RE.match(str(a[k])):
                errors.append(f"{where}: '{k}' must be YYYY-MM-DD")
        if "featured" in a and not isinstance(a["featured"], bool):
            errors.append(f"{where}: 'featured' must be true or false")
        f = a.get("file", "")
        if t == "pdf":
            remote = a.get("url") or re.match(r"^https?://", f)
            if not remote:
                used_pdf.add(f)
                if f and not os.path.exists(os.path.join(ROOT, "content", "pdf", f)):
                    errors.append(f"{where}: content/pdf/{f} not found")
            elif a.get("url") and not str(a["url"]).startswith("https://"):
                warnings.append(f"{where}: url should start with https://")
        else:
            used_html.add(f)
            if f and not os.path.exists(os.path.join(ROOT, "content", "html", f)):
                errors.append(f"{where}: content/html/{f} not found")
        if a.get("cover") and not re.match(r"^https?://", a["cover"]) and not os.path.exists(os.path.join(ROOT, a["cover"])):
            errors.append(f"{where}: cover image {a['cover']} not found")
        if not a.get("summary") and not a.get("subtitle"):
            warnings.append(f"{where}: no subtitle or summary")
    for folder, used in (("html", used_html), ("pdf", used_pdf)):
        d = os.path.join(ROOT, "content", folder)
        if os.path.isdir(d):
            for name in sorted(os.listdir(d)):
                if name.startswith(".") or name in used:
                    continue
                warnings.append(f"content/{folder}/{name} is not listed in articles.json")


def main():
    cats = load("data/categories.json")
    arts = load("data/articles.json")
    cat_ids = check_categories(cats) if cats is not None else set()
    if arts is not None:
        check_articles(arts, cat_ids)
    for w in warnings:
        print(f"⚠ {w}")
    for e in errors:
        print(f"✗ {e}")
        if os.environ.get("GITHUB_ACTIONS"):
            print(f"::error::{e}")
    if errors:
        print(f"\n{len(errors)} error(s). Fix them and push again.")
        return 1
    print(f"✓ Catalogue OK ({len(arts or [])} exhibits, {len(cat_ids)} collections, {len(warnings)} warning(s)).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
