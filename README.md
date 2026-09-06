# intelyAI - PoC job scraper

This repository contains a proof-of-concept Python scraper (scraper.py) that demonstrates a focused, seed-driven approach to discovering job postings and extracting skill keywords. It is intentionally minimal and must be adapted per target site.

Usage

1. Create a virtual environment and install requirements:

    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt

2. Run the PoC:

    python3 scraper.py

Important notes

- Always check and respect each target site's robots.txt and Terms of Service before scraping.
- Replace the CSS selectors in scraper.py with site-specific selectors for reliable results.
- This PoC is not intended for high-scale scraping — use Scrapy and obey per-domain rate limits and politeness rules for production.
