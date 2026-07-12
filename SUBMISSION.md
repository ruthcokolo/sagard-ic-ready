# Submission Note: Portfolio Metrics Extraction

**Candidate:** Ruth Okolo  
**Challenge:** Sagard Forward Deployed Engineer Technical Challenge  
**Product:** ICReady  
**Feature under evaluation:** Portfolio Monitoring  

**GitHub:** https://github.com/ruthcokolo/sagard-ic-ready  
**Live demo:** https://sagard-ic-ready.vercel.app  

> **Reviewer path:** Use demo account (Alex Rivera) → Sign in → Switch to Portfolio

## Approach

I focused on proving the complete workflow rather than supporting every possible metric or document type.

ICReady can process a batch of portfolio company PDF reports, find six key business metrics, show where each suggested value came from in the original document, let a person review the results, and export approved values as a CSV file.

The six metrics are Revenue, ARR, EBITDA, Cash, Headcount, and Churn.

## Assumptions

- The proof of concept supports PDFs with selectable text.
- Scanned or image-only PDFs are flagged for future OCR support.
- The six selected metrics demonstrate the approach and do not represent every metric Sagard may track.
- A person must review and approve extracted values before they are treated as final.
- Browser-based storage and demo accounts are acceptable for this early version.

## Potential next steps

The next phase would add support for scanned PDFs, shared storage for data and files, stronger permissions and audit history, more company- and sector-specific metrics, and AI assistance for uncertain results while keeping the original source visible for review.

The goal was to demonstrate a practical and trustworthy workflow that can start small and expand as reporting needs grow.

For full setup instructions, architecture, and the demo walkthrough, see the README.
