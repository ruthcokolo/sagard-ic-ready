# Sample Portfolio PDFs

Synthetic reporting packages for the Portfolio Monitoring demo. There are **two clearly different categories** — company-formatted PDFs (this folder) and ICReady template PDFs (`icready-template/`).

**Location:** `sagard-ic-ready/sample-portfolio-pdfs/` (project root).  
Synced to `public/sample-portfolio-pdfs/` for app downloads and “Load sample PDF & process.”

## Two categories

### 1. Company-formatted PDFs (this folder)

**Varied company reporting formats — realistic but less standardized for extraction.**

These represent **today’s inconsistent company-provided reports** — what Sagard receives during the crawl phase:

- Cover page with company name, period, and confidentiality notice
- Executive summary, financial overview, operating metrics, commentary, risks
- **Varied labels** across companies (net revenue, sales, net sales, run-rate, etc.)
- Mix of **paragraph prose** and **table-like** layouts
- **Prior-period**, **budget**, and **forecast** values mixed with current actuals
- Some reports **intentionally omit** one or two metrics
- Realistic noise so extraction is credible but not trivial

The extractor should prefer current-period actuals and ignore prior-period / forecast lines where possible.

### 2. ICReady template PDFs (`icready-template/`)

**Standardized reporting format — consistent labels for higher extraction confidence.**

These represent a **production scaling strategy**: as reporting volume grows, Sagard could provide an official template with exact field labels and consistent structure. Same PDF format, but standardized sections improve extraction confidence and reduce validation workload.

See [`icready-template/README.md`](./icready-template/README.md).

## Goal of the demo

Show that extraction **can work on company-formatted inputs**, but **standardized templates improve accuracy** and lower human validation burden. Human validation is still required before official reporting in both cases.

## Company-formatted PDF files

| PDF | Company | Period | Notes |
|-----|---------|--------|-------|
| Northwind Logistics - Q2 2026 Board Pack.pdf | Northwind Logistics | Q2 2026 | Table + labels; all 6 metrics |
| Cyberdyne Systems - Q2 2026 Board Report.pdf | Cyberdyne Systems | Q2 2026 | Paragraph form; **churn missing** |
| Helix Energy - Q1 2026 Report.pdf | Helix Energy | Q1 2026 | Table labels; **cash missing** (deferred) |
| Apex Manufacturing - Q1 2026 Results.pdf | Apex Manufacturing | Q1 2026 | Mixed format; **cash & churn missing** |
| Lumos Health - Q2 2026 Board Pack.pdf | Lumos Health | Q2 2026 | Compact table; **headcount missing** |

## How to use in ICReady

1. Open **Portfolio Monitoring → Reporting Packages**
2. Select **Company-formatted PDFs**
3. Choose company and period → upload or **Load sample PDF & process**
4. **Metric Review** → validate suggested metrics with source evidence
5. Compare against **ICReady template PDFs** on Portfolio Overview

## Regenerate

```bash
npm run generate:sample-pdfs      # company-formatted PDFs (this folder)
npm run generate:template-pdfs    # ICReady template PDFs
npm run generate:all-pdfs         # both
```

## Notes

- Selectable text only (not scanned images). No OCR in this POC.
- Regenerating overwrites files in this folder and syncs to `public/`.
