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

I focused on proving the full workflow rather than trying to support every possible metric or document type. ICReady’s **Portfolio Monitoring** feature processes batches of portfolio company PDFs, finds six key metrics, shows the source of each suggested value, and requires human review before approved results can be exported.

## Assumptions

This proof of concept supports PDFs with selectable text. Scanned documents are flagged for future OCR support. The six selected metrics demonstrate the approach but do not represent every metric Sagard may track. The current version uses browser-based storage and demo accounts instead of production infrastructure.

## Potential next steps

The next phase would add support for scanned PDFs, shared database and file storage, stronger permissions and audit history, more company- and sector-specific metrics, and AI assistance for uncertain results while keeping source evidence visible for review.

The goal was to demonstrate a practical, trustworthy workflow that can start small and expand as reporting needs grow.
