#!/usr/bin/env python3
"""
Scrape shade/product data (code, name, finish, image) from the Greenlam
laminates website (greenlam.co.in) across every laminate-related product
category, and download the swatch images into a local folder structure
mirroring "Merino Shades" (Greenlam Shades/<Category>/<file>.jpg +
manifest.csv).

The site is a server-rendered Magento catalog, so plain HTTP GET + HTML
parsing is enough (no JS execution needed) - confirmed via robots.txt which
explicitly allows crawling (and allows ClaudeBot by name).

Usage:
    python3 scripts/scrape-greenlam.py
    python3 scripts/scrape-greenlam.py --only hpl,afx   # limit to some categories
    python3 scripts/scrape-greenlam.py --skip-images    # manifest only, no downloads
"""

import argparse
import csv
import re
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path
from urllib.parse import urljoin

from bs4 import BeautifulSoup

BASE = "https://www.greenlam.co.in"
OUT_DIR = Path(__file__).resolve().parent.parent.parent / "eightbyfour-assets" / "Greenlam Shades"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; ClaudeBot research scrape)"}
REQUEST_DELAY = 0.4  # seconds between HTTP requests, be polite to the server

# (category folder name, category url path)
CATEGORIES = [
    ("HPL", "/architects-designers/laminates/hpl/"),
    ("Door Special", "/architects-designers/laminates/door/"),
    ("AFX", "/afx/"),
    ("Unicore", "/architects-designers/laminates/unicore-architect-in/"),
    ("HD Gloss", "/architects-designers/laminates/hdgloss/"),
    ("Countertop", "/architects-designers/laminates/counter-top/"),
    ("Infinia Countertop", "/architects-designers/laminates/infinia-countertop/"),
    ("VRB", "/architects-designers/laminates/vrb/"),
    ("Digital-Custom", "/architects-designers/laminates/digital-custom/"),
    ("Four X Ten", "/architects-designers/laminates/four-x-ten/"),
    ("Chalk Grade", "/architects-designers/laminates/chalk-grade/"),
    ("Marker Grade", "/architects-designers/laminates/marker-grade/"),
    ("Fire Retardant", "/architects-designers/laminates/fire-retardant/"),
    ("ESD Laminates", "/architects-designers/laminates/antistatic-laminates/"),
    ("Door Laminates", "/architects-designers/laminates/door-laminates/"),
    ("Lexus Collection", "/architects-designers/laminates/lexus-collection"),
    ("Standard Compacts", "/architects-designers/compact-laminates/compact-laminate/"),
    ("Lab Guardian", "/architects-designers/compact-laminates/lab-guardian/"),
    ("Unicore Compact", "/architects-designers/compact-laminates/unicore-compact/"),
    ("Sandwich Compact", "/architects-designers/compact-laminates/sandwich-compact/"),
    ("Digital-Custom Compact", "/architects-designers/compact-laminates/reflection-compact/"),
    ("Stratus Collection", "/architects-designers/compact-laminates/stratus-collection"),
    ("Restroom Cubicles Locker Solutions", "/architects-designers/compact-laminates/restroom-cubicles-locker-solutions-68"),
    ("Exterior Grade Cladding", "/architects-designers/compact-laminates/exterior-grade-cladding"),
    ("Interior Grade Cladding", "/architects-designers/compact-laminates/clads-interior"),
    ("Veneer Laminates", "/architects-designers/veneer-laminates"),
    ("MFC", "/architects-designers/mfc"),
]

ITEMS_RE = re.compile(r"Items\s+\d+\s+to\s+\d+\s+of\s+(\d+)\s+total")


def slugify(s):
    s = s.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def fetch(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read()


def fetch_with_retry(url, attempts=3):
    last_err = None
    for i in range(attempts):
        try:
            return fetch(url)
        except (urllib.error.URLError, TimeoutError) as e:
            last_err = e
            time.sleep(1.5 * (i + 1))
    raise last_err


def parse_listing(html):
    soup = BeautifulSoup(html, "html.parser")
    total = None
    m = ITEMS_RE.search(soup.get_text(" ", strip=True))
    if m:
        total = int(m.group(1))

    products = []
    for block in soup.select("div.product-block"):
        img = block.select_one("img")
        name_a = block.select_one("h3.product-name a")
        attr = block.select_one("h4.attributes")
        if not img or not name_a:
            continue
        raw_name = name_a.get_text(strip=True)
        zoom_a = block.select_one("a.product-zoom")
        img_url = (zoom_a.get("href") if zoom_a else None) or img.get("data-original") or img.get("src") or ""
        code, name = raw_name, raw_name
        m2 = re.match(r"^\s*([A-Za-z0-9]+)\s*-\s*(.+)$", raw_name)
        if m2:
            code, name = m2.group(1).strip(), m2.group(2).strip()
        finish_full = attr.get_text(strip=True) if attr else ""
        finish_code = ""
        m3 = re.search(r"\(([^)]+)\)\s*$", finish_full)
        if m3:
            finish_code = m3.group(1).strip()
        products.append({
            "code": code,
            "name": name,
            "finish": finish_full,
            "finish_code": finish_code,
            "image_url": urljoin(BASE, img_url) if img_url else "",
            "product_url": urljoin(BASE, name_a.get("href") or ""),
        })
    return total, products


def scrape_category(name, path, skip_images, images_dir):
    url = urljoin(BASE, path)
    print(f"\n=== {name} === {url}")
    try:
        html = fetch_with_retry(url)
    except Exception as e:
        print(f"  FAILED to fetch page 1: {e}")
        return []
    time.sleep(REQUEST_DELAY)

    total, products = parse_listing(html)
    rows = []
    seen_urls = set()

    def add_rows(prods, page_no):
        for p in prods:
            if p["product_url"] in seen_urls and p["image_url"] in [r["source_image_url"] for r in rows]:
                continue
            seen_urls.add(p["product_url"])
            fname = ""
            if not skip_images and p["image_url"]:
                ext = Path(p["image_url"]).suffix.split("?")[0] or ".jpg"
                fname = f"{slugify(p['code'])}-{slugify(p['finish_code'] or p['finish'])}-{slugify(p['name'])}{ext}"[:150]
                dest = images_dir / fname
                if not dest.exists():
                    try:
                        data = fetch_with_retry(p["image_url"])
                        dest.write_bytes(data)
                        time.sleep(REQUEST_DELAY)
                    except Exception as e:
                        print(f"    image failed ({p['code']} {p['finish']}): {e}")
                        fname = ""
            rows.append({
                "category": name,
                "code": p["code"],
                "name": p["name"],
                "finish": p["finish"],
                "finish_code": p["finish_code"],
                "image_file": fname,
                "source_image_url": p["image_url"],
                "product_url": p["product_url"],
                "page": page_no,
            })

    add_rows(products, 1)
    print(f"  page 1: {len(products)} products" + (f" (of {total} total)" if total else ""))

    if total:
        page_size = len(products) or 60
        n_pages = (total + page_size - 1) // page_size
        for pno in range(2, n_pages + 1):
            page_url = f"{url.rstrip('/')}?p={pno}"
            try:
                phtml = fetch_with_retry(page_url)
            except Exception as e:
                print(f"  page {pno}: FAILED ({e})")
                continue
            time.sleep(REQUEST_DELAY)
            _, pprods = parse_listing(phtml)
            add_rows(pprods, pno)
            print(f"  page {pno}: {len(pprods)} products")

    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="comma-separated category folder names (case-insensitive) to limit to")
    ap.add_argument("--skip-images", action="store_true", help="manifest only, skip image downloads")
    args = ap.parse_args()

    cats = CATEGORIES
    if args.only:
        wanted = {s.strip().lower() for s in args.only.split(",")}
        cats = [c for c in CATEGORIES if c[0].lower() in wanted]

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    all_rows = []
    for name, path in cats:
        images_dir = OUT_DIR / name
        if not args.skip_images:
            images_dir.mkdir(parents=True, exist_ok=True)
        rows = scrape_category(name, path, args.skip_images, images_dir)
        all_rows.extend(rows)

        # write manifest incrementally so partial progress isn't lost on a crash
        manifest_path = OUT_DIR / "manifest.csv"
        fieldnames = ["category", "code", "name", "finish", "finish_code",
                      "image_file", "source_image_url", "product_url", "page"]
        with open(manifest_path, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=fieldnames)
            w.writeheader()
            w.writerows(all_rows)

    print(f"\nDone. {len(all_rows)} total shade rows across {len(cats)} categories.")
    print(f"Manifest: {OUT_DIR / 'manifest.csv'}")


if __name__ == "__main__":
    main()
