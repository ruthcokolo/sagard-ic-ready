# ICReady Portfolio Reporting Template PDFs

**Location:** `sagard-ic-ready/sample-portfolio-pdfs/icready-template/` (project root).  
Synced to `public/sample-portfolio-pdfs/icready-template/` for app downloads.

**Standardized reporting format — consistent labels for higher extraction confidence.**

## Production scaling strategy

These PDFs represent how portfolio reporting could work **at scale**:

- Portfolio companies still submit **PDFs**
- Core metrics use **exact required field labels** and **consistent structure**
- Extraction runs in **template mode** (high confidence, clear evidence)
- Human validation remains required before official reporting

Compare against **company-formatted PDFs** in the parent folder — varied company reporting formats that are realistic but less standardized for extraction.

## Structure (every template PDF)

1. **Title:** ICReady Portfolio Reporting Template  
2. **Header:** Company Name, Reporting Period, Report Type, Currency, Units, Submitted By, Submitted Date  
3. **Section 1:** Total Revenue, ARR, Adjusted EBITDA, Cash and Cash Equivalents  
4. **Section 2:** Total Employees, Logo Churn, Revenue Churn, Customer Count  
5. **Section 3:** Management Commentary, Key Risks, Follow-up Items  
6. **Section 4:** Certification  

All six core portfolio metrics are present with standardized labels.

## Files

20 PDFs named like `ICReady_Template_Atlas_Logic_Q2_2026.pdf` across SaaS, Healthcare IT, Fintech, Logistics, Real estate technology, Data infrastructure, Retail technology, Manufacturing software, Climate software, and Payments.

## How to use in ICReady

1. **Reporting Packages** → **ICReady template PDFs**
2. Select a template company → **Load sample PDF & process**
3. **Metric Review** — expect **High** confidence and clear evidence snippets
4. **Portfolio Overview** → compare **Source format impact** vs company-formatted PDFs

## Regenerate

```bash
npm run generate:template-pdfs
# or
npm run generate:all-pdfs
```
