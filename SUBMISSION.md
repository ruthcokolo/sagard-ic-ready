# Submission note — Portfolio Metrics Extraction

**Candidate:** Ruth Okolo  
**Challenge:** Sagard Forward Deployed Engineer (FDE) — Portfolio Metrics Extraction (crawl POC)  
**Product:** ICReady · **Feature under evaluation:** Portfolio Monitoring  

**Repo:** https://github.com/ruthcokolo/sagard-ic-ready  
**Live demo:** https://sagard-ic-ready.vercel.app  

> **Reviewer path:** Use demo account (Alex Rivera) → Sign in → Switch to Portfolio  

ICReady is an associate workspace with two modes: **IC Diligence** (deal / IC readiness) and **Portfolio Monitoring** (post-investment reporting). This note covers the challenge deliverable — **Portfolio Monitoring**.

---

## Approach

Portfolio companies send reporting packages as PDFs with inconsistent structure and labels. The crawl goal is not perfect extraction of every number — it is a trustworthy loop: **ingest → extract a focused set → review with evidence → export**.

**What I built**

1. **Batch ingest** of PDF reporting packages (folder / multi-file / demo library), with duplicate and revision handling.
2. **Rule + alias extraction** (PDF.js text on the server) for six core metrics: Revenue, ARR, EBITDA, Cash, Headcount, and Churn.
3. **Human review** where every suggested value links to the source page and supporting text before approval.
4. **Organized output** for associates (Metric Review, overview coverage, CSV export of approved values).

**Why this shape**

- Six metrics prove the system without boiling the ocean; expanding coverage is configuration once the loop is trusted.
- Rules and aliases are deterministic and auditable for a crawl POC; LLMs can assist later on low-confidence cases, always with page evidence.
- A reviewable UI shows how an associate would actually use the workflow, rather than stopping at a notebook or raw JSON dump.
- Missing metrics are surfaced explicitly — absence is a signal, not a silent zero.

---

## Assumptions

1. **Selectable-text PDFs** are the crawl baseline. Scanned or image-only PDFs are detected and flagged for future OCR; this POC does not extract metrics from them.
2. **Core metrics appear with recognizable labels** somewhere in the document. Exotic custom KPIs wait until added as extraction rules.
3. **One active package per company + period** is the default; duplicates and revisions need an explicit associate decision.
4. **Automation proposes; associates verify and approve** before values are export-trusted.
5. **Browser-local persistence** (localStorage + IndexedDB) is acceptable for a POC; production would use a shared store and object storage.
6. **Email is copy-ready templates**, not real outbound delivery.

---

## Potential next steps

**Walk**

- OCR lane for scanned appendices  
- Durable backend (database + object storage) with audit  
- LLM assist on low-confidence / commentary — never as sole source of truth  
- Wider adoption of a company-facing ICReady reporting template to reduce label variance  

**Run**

- Real SSO and role-based permissions  
- Outbound communications + ticketing hooks  
- Approved-only metric warehouse feeding portfolio dashboards  
- Golden-PDF evaluation set and monitoring for extract quality / policy violations  

---

Full run instructions, architecture, and demo script: see [README.md](./README.md).
