# ICReady — Portfolio Metrics Extraction POC

**Sagard Forward Deployed Engineer (FDE) technical challenge**  
*Portfolio Metrics Extraction — crawl-phase proof of concept*

**ICReady** is an associate workspace for Sagard-style investment workflows. It includes two product modes:

| Mode | What it is | Role in this submission |
|------|------------|-------------------------|
| **Portfolio Monitoring** | Turn portfolio-company PDF reporting packages into structured, reviewable metrics | **Challenge deliverable** — the crawl POC to evaluate |
| **IC Diligence** | Deal pipeline, IC readiness, and diligence review (e.g. Northwind demo) | Supporting product context in the same app |

**Portfolio Monitoring** is the feature built for this challenge: it ingests reporting packages, extracts six core metrics with source evidence, routes results through human validation, and exports approved values for analysis.

This repository implements the **crawl** phase of a crawl → walk → run roadmap for Portfolio Monitoring: extract a meaningful subset of metrics from real PDFs, organize them for associate review, and make the next-step path to production obvious.

**Core metrics:** Revenue, ARR, EBITDA, Cash, Headcount, and Churn.

---

## Live demo

**Production:** [https://sagard-ic-ready.vercel.app](https://sagard-ic-ready.vercel.app)

**GitHub:** [https://github.com/ruthcokolo/sagard-ic-ready](https://github.com/ruthcokolo/sagard-ic-ready)

> **Reviewer path:** **Use demo account (Alex Rivera)** → **Sign in** → **Switch to Portfolio**

---

## Quick start

```bash
cd sagard-ic-ready
npm install
npm run dev
```

Open **[http://localhost:3001](http://localhost:3001)**.

### Demo login

| Field | Value |
|-------|--------|
| Email | `alex.rivera@sagard.com` |
| Password | `ICReady` *(case-sensitive)* |

Alternate account: `jordan.lee@sagard.com` / `ICReady`.

After sign-in, click **Switch to Portfolio** (top right) to open Portfolio Monitoring at `/dashboard/portfolio`.

| Go to | To do |
|-------|--------|
| **Reporting Packages** | Upload / load demo PDFs and process extraction |
| **Metric Review** | Validate extracted values against PDF evidence |
| **Exports** | Download approved metrics as CSV |
| **Extraction Rules** | Inspect aliases used for messy labels |
| **Reporting Requirements** | See sector / company metric expectations |

---

## The problem (as framed by Sagard)

Portfolio companies send reporting packages as PDFs. Each company structures and labels metrics differently. Comparing performance across companies and over time is still largely manual.

This POC shows how software can:

1. **Ingest** a batch of reporting PDFs (folder / multi-file / demo library)
2. **Extract** a focused set of portfolio-monitoring metrics
3. **Organize** results for human review, with evidence preserved
4. **Export** approved metrics into a structure that can feed dashboards and reports

---

## Approach

### Design principles

1. **Focused scope, complete workflow** — Portfolio Monitoring extracts six core metrics from selectable-text PDFs, routes every result through human validation, and flags uncertain or unsupported cases instead of guessing.
2. **Evidence-first extraction** — every suggested value links to the exact source page and supporting text, so associates can verify it before approval.
3. **Designed for messy reporting** — company-specific layouts, aliases, missing values, duplicates, and uncertain company matches are treated as core workflow states rather than exceptions.
4. **A product-shaped POC** — the interface demonstrates how an associate would actually ingest, inspect, validate, and export metrics, rather than stopping at a notebook or raw JSON output.
5. **Honest boundaries** — PDF text extraction, evidence matching, review, duplicate detection, and CSV export are implemented. OCR, outbound email, shared backend persistence, and production authentication are intentionally out of scope.

### Pipeline (high level)

```
PDF batch
  → expand ZIP / preserve folder paths
  → hash + metadata detection (company, period, format)
  → duplicate / revision checks
  → PDF.js text extraction (server)
  → alias / rule matching → candidates + missing metrics
  → Metric Review (approve / reject / edit with evidence)
  → CSV export of approved values
```

### Technical choices

| Choice | Why |
|--------|-----|
| **Next.js 15 + TypeScript + Tailwind** | Fast to ship a credible associate UI; easy for reviewers to run |
| **pdfjs-dist on the server** (`POST /api/portfolio/extract`) | Robust text extraction without shipping a PDF worker to the browser |
| **Rule + alias extraction** (not LLM-first) | Deterministic, auditable, cheap, and appropriate for a crawl POC; LLMs can layer on later for commentary / low-confidence cases |
| **localStorage + IndexedDB** | Zero-setup demo persistence for state and source PDFs |
| **Batch upload drawer** | Matches how associates receive “a folder of packages,” not one file at a time |

### Extraction strategy

1. Reconstruct page text from PDF.js text items (reading-order grouping).
2. Match metrics using **Extraction Rules**: canonical metric name, unit, aliases, matching guidance.
3. Prefer table / period context when available (e.g. “Q1 2026 Actual”).
4. Emit **candidates** with confidence, source page, and evidence snippet.
5. Emit **missing** metrics so gaps are visible — absence is a signal, not a silent zero.
6. Keep humans in the loop: Metric Review requires evidence location before approval when configured.

---

## Why these metrics

I selected a **small, high-signal set** that investment associates actually use in portfolio monitoring conversations:

| Metric | Why it matters |
|--------|----------------|
| **Revenue** | Top-line health; appears in nearly every board pack |
| **ARR** | Standard for SaaS / recurring businesses; often labeled inconsistently (“Annual Recurring Revenue”, “ARR (ending)”) |
| **EBITDA** | Operating profitability proxy across strategies |
| **Cash** | Liquidity / runway proxy; often “cash & equivalents” |
| **Headcount** | Operating scale; useful across software and services |
| **Churn** | Retention quality for recurring models; often missing for non-SaaS (correctly surfaced as missing) |

**Why not twenty metrics?**  
A crawl POC should prove the *system* (ingest → extract → review → export) on metrics that are both important and realistically present. Expanding the dictionary is configuration work once the pipeline is trusted — see Extraction Rules and Reporting Requirements in the app.

**Sector nuance**  
Reporting Requirements encode that not every metric applies to every sector (e.g. ARR / Churn for software vs NOI-oriented real-estate packs). The extractor still attempts matches; requirements guide what “complete” means for review.

---

## What’s implemented

### Portfolio Monitoring (challenge core)

- **Portfolio Overview** — KPIs, needs attention, submission status, recent activity  
- **Reporting Packages** — batch upload, demo PDF library, process queue, package ops table  
- **Duplicate / revision detection** — exact hash, same filename revision, same company+period related docs  
- **Metric Review** — validation queue, evidence drawer, PDF page highlight, approve / reject / edit  
- **Metrics Explorer** — cross-company comparison of approved values  
- **Exports** — CSV of approved metrics + history  
- **Extraction Rules** — aliases and units for messy labels  
- **Reporting Requirements** — sector defaults + company overrides  
- **Communication templates** — copy-ready follow-ups (clipboard; not SMTP)  
- **Activity** — full recent-activity feed  

### IC Diligence (same product, not the challenge core)

IC Diligence (pipeline, IC readiness, Northwind diligence demo) lives in the same ICReady app so associates can move between **pre-deal diligence** and **post-investment portfolio monitoring**. It is supporting product context.

**For evaluation of this take-home, use Portfolio Monitoring** via **Switch to Portfolio**.

---

## Out of scope for the crawl POC

- OCR for scanned or image-only PDFs
- Shared production database
- Real outbound email delivery
- Production-grade authentication and permissions
- Full metric coverage across all sectors
- Background job orchestration and monitoring

---

## Assumptions

1. **Selectable-text PDFs are the crawl baseline.** Image-only or scanned PDFs are detected and flagged for future OCR processing; this POC does not attempt to extract metrics from them.
2. **Core metrics appear with recognizable labels** somewhere in the document (tables, bullets, or prose). Exotic custom KPIs are out of scope until added as rules.
3. **One active reporting package per company + period** is the default operating model; duplicates and revisions require an explicit associate decision.
4. **Human validation is required** before metrics are export-trusted — automation proposes; associates verify and approve.
5. **Browser-local persistence is acceptable for a POC** (localStorage state, IndexedDB PDF blobs). Production would use a proper store and object storage.
6. **Demo accounts are fixed** for interviewer convenience; password is `ICReady`.
7. **Communications are templates**, not a mailer — the value is the workflow and copy, not inbox delivery.

---

## Demo script (≈8–10 minutes)

1. **Login** — Use demo account (Alex Rivera) → Sign in → **Switch to Portfolio**.  
2. **Overview** — Point at Needs attention, submission coverage, and recent activity.  
3. **Upload** — Reporting Packages → Upload → **Load demo PDFs** → select a few company reports (+ optional ICReady template) → Process ready.  
4. **Independence** — Show that one file needing confirmation does not block the rest of the batch.  
5. **Duplicates** — Re-add `sagard auto report.pdf` (or process the duplicate test set) and walk Skip / new version / replace.  
6. **Metric Review** — Open a processed package; show extracted value, confidence, evidence highlight on the PDF. Approve one metric; reject or edit another.  
7. **Missing metrics** — Show a metric marked missing and how follow-up templates help.  
8. **Export** — Export approved metrics; open the CSV.  
9. **Configuration** — Briefly open Extraction Rules (aliases) and Reporting Requirements (sector expectations).  
10. **Close** — Summarize crawl scope and the walk/run roadmap below.

---

## Architecture (concise)

```
app/
  api/portfolio/extract   → server PDF.js + rules extraction
  dashboard/portfolio/*   → Portfolio Monitoring UI
components/portfolio-monitoring/
lib/portfolio/            → extraction, duplicates, selectors, seed catalogs
public/demo-reports/      → generated company + template PDFs
public/sample-portfolio-pdfs/
```

**State:** `localStorage` key `icready-portfolio-state`  
**PDF blobs:** IndexedDB `icready-portfolio-pdfs`  
**Extract API:** real text extraction (not mocked)

Regenerate demo PDFs if missing:

```bash
npm run generate:all-pdfs
```

---

## Potential next steps (walk → run)

### Walk (near-term)

1. **OCR lane** for scanned appendices (async job + confidence penalty).  
2. **Durable backend** (Postgres + object storage) with multi-user sync and audit.  
3. **LLM assist on low-confidence / commentary** — never as sole source of truth; always cite page evidence.  
4. **Company-provided ICReady template** adoption to reduce label variance at the source.  
5. **Assignment & SLA** hardening (already prototyped in Metric Review).

### Run (production)

1. SSO / role-based permissions that actually differ by associate vs principal.  
2. Real outbound communications + CRM/ticketing hooks.  
3. Portfolio dashboards fed by approved-only metric warehouse.  
4. Continuous evaluation set: golden PDFs, precision/recall on aliases, regression on extract.  
5. Monitoring for extract latency, failure rate, and “approve without evidence” policy violations.

---

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind CSS · pdfjs-dist · pdf-lib (PDF generation scripts)

---

## Project structure (challenge-relevant)

```
sagard-ic-ready/
├── README.md                          ← you are here
├── app/dashboard/portfolio/           ← Portfolio Monitoring routes
├── app/api/portfolio/extract/         ← PDF extraction API
├── components/portfolio-monitoring/   ← UI
├── lib/portfolio/                     ← domain logic
├── public/demo-reports/               ← demo PDFs
├── public/sample-portfolio-pdfs/
└── scripts/                           ← PDF generators + monitoring tests
```

---

## Deploy (optional)

```bash
cd sagard-ic-ready
npx vercel
npx vercel --prod
```

Root directory of the Vercel project should be `sagard-ic-ready`.  
`ANTHROPIC_API_KEY` is optional and only affects the separate IC Diligence / Northwind analysis path.

---

## What interviewers should judge

| Criterion | Where to look |
|-----------|----------------|
| Ambiguity & scoping | This README — crawl choices and explicit non-goals |
| Extraction approach | `lib/portfolio/pdf-extract.ts`, `extraction.ts`, Extraction Rules UI |
| Messy documents | Demo PDF library, aliases, missing metrics, duplicate flows |
| Reviewer UX | Metric Review + evidence highlight |
| Extensibility | Reporting Requirements, templates, next-steps roadmap |

---

Built as a Sagard FDE take-home to demonstrate how a Forward Deployed Engineer can turn an ambiguous document-processing problem into a scoped, evidence-driven workflow with a credible path to production.
