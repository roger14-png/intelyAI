#!/usr/bin/env python3
"""
PoC focused scraper for intelyAI
- seeds: list of site search URLs (one per small combination)
- fetch -> parse -> extract fields -> extract skills -> append CSV

Usage:
    python3 scraper.py

Notes:
- This is a proof-of-concept. Replace site selectors per target site and check each site's Terms of Service before scraping.
- The scraper is intentionally polite: it uses a clear User-Agent, randomized delays, and simple rate-limiting.
"""

import csv
import time
import random
import re
from typing import List
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

# Basic config
HEADERS = {
    "User-Agent": "intelyAI-poc/1.0 (+https://github.com/roger14-png/intelyAI) - research crawler",
}
RATE_DELAY = (1.0, 3.0)  # seconds between requests per domain (randomized)

# Simple skill dictionary (extend this)
SKILLS = [
    "python", "javascript", "typescript", "react", "node", "django", "flask",
    "aws", "docker", "kubernetes", "sql", "postgres", "mongodb"
]


def polite_get(url: str) -> str:
    time.sleep(random.uniform(*RATE_DELAY))
    resp = requests.get(url, headers=HEADERS, timeout=15)
    resp.raise_for_status()
    return resp.text


def normalize_skill(token: str) -> str:
    t = token.lower().strip()
    t = re.sub(r"[^a-z0-9\+\.#\- ]", "", t)
    if t in ("py", "python3"):
        return "python"
    return t


def extract_skills_from_text(text: str, skill_list: List[str]) -> List[str]:
    found = set()
    lower = text.lower()
    for s in skill_list:
        if re.search(r"\b" + re.escape(s.lower()) + r"\b", lower):
            found.add(s)
    return sorted(found)


def parse_job_card(card_soup: BeautifulSoup, base_url: str):
    # Example parsing heuristics - change per-site
    title = card_soup.select_one(".job-title, h2, h1")
    company = card_soup.select_one(".company, .company-name")
    location = card_soup.select_one(".location")
    link_el = card_soup.select_one("a[href]")
    url = urljoin(base_url, link_el["href"]) if link_el else base_url
    desc_snippet = card_soup.get_text(" ", strip=True)
    skills = extract_skills_from_text(desc_snippet, SKILLS)
    return {
        "title": title.get_text(strip=True) if title else "",
        "company": company.get_text(strip=True) if company else "",
        "location": location.get_text(strip=True) if location else "",
        "url": url,
        "skills": ";".join(skills),
        "snippet": desc_snippet[:300]
    }


def crawl_search_page(search_url: str):
    html = polite_get(search_url)
    soup = BeautifulSoup(html, "html.parser")
    # Per-site: change selector. Here we try common patterns.
    cards = soup.select(".job, .job-card, .listing, li.job")
    if not cards:
        # fallback: find links that look like job pages
        links = [a for a in soup.select("a[href]") if re.search(r"/job|/jobs|/positions?/", a["href"], re.I)]
        cards = []
        for a in links:
            wrapper = a.parent
            cards.append(wrapper)
    results = []
    for c in cards:
        try:
            parsed = parse_job_card(c, search_url)
            results.append(parsed)
        except Exception:
            continue
    return results


def write_csv(rows, path="jobs_output.csv"):
    keys = ["title", "company", "location", "url", "skills", "snippet"]
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=keys)
        writer.writeheader()
        for r in rows:
            writer.writerow(r)


def run_poc():
    # Example seeds: each seed is a focused small-set combination (site+role+skill)
    seeds = [
        "https://remoteok.com/remote-dev-jobs",
        # Add site-specific search URLs or queries generated from axes (role/location/skill)
    ]
    all_jobs = []
    for s in seeds:
        try:
            jobs = crawl_search_page(s)
            print(f"Found {len(jobs)} jobs on {s}")
            all_jobs.extend(jobs)
        except Exception as e:
            print("Error crawling", s, e)
    write_csv(all_jobs)
    print("Wrote", len(all_jobs), "rows to jobs_output.csv")


if __name__ == "__main__":
    run_poc()
