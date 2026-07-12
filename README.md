# ICReady — Portfolio Metrics Extraction POC

**Sagard Forward Deployed Engineer (FDE) technical challenge**  
*Portfolio Metrics Extraction — crawl-phase proof of concept*

ICReady is a working end-to-end demonstration of how Sagard can turn messy portfolio-company PDF reporting packages into structured, reviewable metrics — then validate evidence and export approved numbers for analysis.

This repository implements the **crawl** phase of a crawl → walk → run roadmap: extract a meaningful subset of metrics from real PDFs, organize them for associate review, and make the next-step path to production obvious.

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

### How to navigate to Portfolio Monitoring

> **Reviewer path (exact clicks):**  
> **Use demo account (Alex Rivera)** → **Sign in** → **Switch to Portfolio**

1. On the login screen, click **Use demo account (Alex Rivera)** — this fills the demo credentials.
2. Click **Sign in**.
3. On the IC Diligence dashboard, click **Switch to Portfolio** (top right).
4. You land on **Portfolio Overview** at `/dashboard/portfolio` — this is the challenge deliverable surface.

From there:

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

1. **Crawl, don’t boil the ocean** — six core metrics, selectable-text PDFs, explicit human validation. Edge cases are surfaced, not silently guessed.
2. **Evidence over magic** — every suggested value should be inspectable against the source page. Associates should never approve a number they cannot locate.
3. **Messy documents are the product** — company-formatted layouts, alias dictionaries, missing metrics, duplicates, and low-confidence company matches are first-class.
4. **Product-shaped POC** — a reviewable UI beats a notebook dump for FDE work: it shows how an associate would actually use the system.
5. **Honest boundaries** — no fake OCR, no pretend email send, no fabricated production database. What looks real *is* real extraction; what is mocked is labeled.

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

### Secondary (same app shell)

IC Diligence mode (pipeline / IC readiness / Northwind demo) is included so the product can show a full associate workspace. **The challenge evaluation path is Portfolio Monitoring** via **Switch to Portfolio**.

---

## Assumptions

1. **Selectable text PDFs** are the crawl baseline. Scanned/image-only PDFs are detected and flagged (`OCR required` / lower confidence); this POC does **not** run a real OCR engine.
2. **Core metrics appear with recognizable labels** somewhere in the document (tables, bullets, or prose). Exotic custom KPIs are out of scope until added as rules.
3. **One active reporting package per company + period** is the default operating model; duplicates and revisions require an explicit associate decision.
4. **Human validation is required** before metrics are export-trusted — automation proposes; associates dispose.
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

Built as a Sagard FDE take-home to show how a Forward Deployed Engineer turns an open-ended document problem into a scoped, demoable product with a clear path to production.
