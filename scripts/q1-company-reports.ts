/**
 * Detailed Q1 2026 company-formatted report specs.
 * Each company uses a distinct layout voice so demos feel like real submissions.
 */
import type { CompanyFormattedReportSpec } from "./company-formatted-report-types";

export const Q1_COMPANY_FORMATTED_REPORTS: CompanyFormattedReportSpec[] = [
  {
    fileName: "Northwind Logistics - Q1 2026 Operations Pack.pdf",
    cover: {
      companyName: "Northwind Logistics",
      reportTitle: "Q1 Operations & Financial Pack",
      period: "Q1 2026",
      reportType: "Operations Pack · Portfolio Company Submission",
      submittedDate: "April 12, 2026",
      confidentiality:
        "CONFIDENTIAL — Sagard Holdings portfolio review. Internal distribution only.",
    },
    sections: [
      {
        heading: "Quarter Snapshot",
        blocks: [
          {
            type: "paragraph",
            text: "Northwind opened 2026 with steady enterprise contract renewals and improved on-time delivery across the Midwest corridor. Volume was ahead of the seasonally soft Q4 2025 baseline.",
          },
          {
            type: "bullets",
            items: [
              "On-time delivery: 96.4% (target 95%)",
              "Avg. lane utilization: 81%",
              "New enterprise logos signed: 6",
            ],
          },
        ],
      },
      {
        heading: "Financial Actuals — Q1 2026",
        pageBreakBefore: true,
        blocks: [
          { type: "table-header", cols: ["Metric", "Q1 2026 Actual", "Q4 2025 Prior", "YoY"] },
          { type: "table-row", cols: ["Total Revenue", "$48.2M", "$46.8M", "+7.1%"] },
          { type: "table-row", cols: ["Annual Recurring Revenue (ARR)", "$42.1M", "$40.6M", "+9.4%"] },
          { type: "table-row", cols: ["Adjusted EBITDA", "$9.4M", "$8.9M", "+11.2%"] },
          { type: "table-row", cols: ["Cash and cash equivalents", "$22.6M", "$21.1M", "—"] },
          {
            type: "line",
            text: "Note: YoY compares to Q1 2025. Budget variance analysis is in Appendix B (not attached).",
            muted: true,
          },
        ],
      },
      {
        heading: "Fleet & Workforce",
        pageBreakBefore: true,
        blocks: [
          { type: "line", text: "Total employees: 346 FTE at March 31, 2026 (includes contractors)." },
          { type: "line", text: "Logo churn: 2.2% quarterly (Q1 2026 actual)." },
          { type: "line", text: "Active tractors: 412 · Owner-operator share: 28%." },
          {
            type: "paragraph",
            text: "Recruiting for regional dispatch roles remained competitive; overtime hours declined 6% vs Q4 as route densification improved.",
          },
        ],
      },
      {
        heading: "Management Narrative",
        pageBreakBefore: true,
        blocks: [
          {
            type: "paragraph",
            text: "Fuel hedges covered approximately 60% of expected Q2 volumes. Management prioritized warehouse automation pilots in two hubs ahead of peak season.",
          },
        ],
      },
      {
        heading: "Risks & Board Asks",
        pageBreakBefore: true,
        blocks: [
          {
            type: "bullets",
            items: [
              "Diesel price spikes could compress gross margin if hedges roll off early.",
              "Customer concentration: top 5 accounts = 41% of Q1 revenue.",
              "Ask: approve incremental $1.8M capex for WMS upgrade in Q2.",
            ],
          },
        ],
      },
    ],
  },
  {
    fileName: "Cyberdyne Systems - Q1 2026 Investor Memo.pdf",
    cover: {
      companyName: "Cyberdyne Systems",
      reportTitle: "Investor Memo — First Quarter",
      period: "Q1 2026",
      reportType: "Investor Memo · Confidential",
      submittedDate: "April 8, 2026",
      confidentiality:
        "PRIVATE & CONFIDENTIAL — For Sagard portfolio monitoring. Do not redistribute.",
    },
    sections: [
      {
        heading: "Opening Letter",
        blocks: [
          {
            type: "paragraph",
            text: "Dear investors — Q1 was a foundation quarter. We closed three multi-year platform expansions and kept opex growth below revenue growth for the third consecutive period.",
          },
          {
            type: "paragraph",
            text: "Net revenue for Q1 2026 was $31.5 million. For context, Q4 2025 net revenue was $30.1M and Q1 2025 was $27.4M (historical references only).",
          },
        ],
      },
      {
        heading: "Scorecard",
        pageBreakBefore: true,
        blocks: [
          { type: "line", text: "ARR (quarter-end): $28.9M  ·  Prior quarter ARR: $27.2M" },
          { type: "line", text: "Adjusted EBITDA: $5.1M  ·  Margin: 16.2%" },
          { type: "line", text: "Cash balance: $16.2M  ·  Net burn: modestly positive" },
          { type: "line", text: "Total employees: 218 FTE at March 31, 2026" },
          {
            type: "line",
            text: "Logo / revenue churn: deferred — analytics refresh scheduled for mid-Q2.",
            muted: true,
          },
        ],
      },
      {
        heading: "Go-to-Market Notes",
        pageBreakBefore: true,
        blocks: [
          {
            type: "paragraph",
            text: "Pipeline coverage for Q2 sits at 3.1x quota. Win rates in regulated verticals improved after SOC 2 Type II renewal. Competitive displacement deals lengthened by ~12 days on average.",
          },
          {
            type: "bullets",
            items: [
              "Enterprise ACV up 8% vs Q4 2025",
              "Net new ARR from expansions: $1.1M",
              "Two late-stage RFPs slipped into early Q2",
            ],
          },
        ],
      },
      {
        heading: "Product & Engineering",
        pageBreakBefore: true,
        blocks: [
          {
            type: "paragraph",
            text: "Platform v4.2 shipped on schedule with improved audit logging. Reliability SLO for core APIs remained at 99.95% for the quarter.",
          },
        ],
      },
      {
        heading: "Follow-ups for the Board",
        pageBreakBefore: true,
        blocks: [
          {
            type: "bullets",
            items: [
              "Provide churn pack once customer analytics refresh completes.",
              "Approve hiring plan for two solutions architects in regulated verticals.",
              "Review pricing test for mid-market annual prepay discount.",
            ],
          },
        ],
      },
    ],
  },
  {
    fileName: "Lumos Health - Q1 2026 Clinical & Finance Review.pdf",
    cover: {
      companyName: "Lumos Health",
      reportTitle: "Clinical Operations & Finance Review",
      period: "Q1 2026",
      reportType: "Combined Clinical / Finance Packet",
      submittedDate: "April 20, 2026",
      confidentiality:
        "CONFIDENTIAL — Sagard portfolio monitoring. PHI excluded from this packet.",
    },
    sections: [
      {
        heading: "Clinical Operations Snapshot",
        blocks: [
          {
            type: "paragraph",
            text: "Lumos expanded two payer contracts in Q1 and opened a satellite clinic in Phoenix. Visit volumes tracked 4% above the internal seasonal plan.",
          },
          { type: "table-header", cols: ["Clinical KPI", "Q1 2026", "Q4 2025", "Target"] },
          { type: "table-row", cols: ["Billable visits", "62,400", "59,100", "60,000"] },
          { type: "table-row", cols: ["Avg. days to claim", "11.2", "12.4", "<=12"] },
          { type: "table-row", cols: ["Patient NPS", "68", "65", ">=65"] },
        ],
      },
      {
        heading: "Financial Results",
        pageBreakBefore: true,
        blocks: [
          { type: "table-header", cols: ["Measure", "Q1 2026 Actual", "Q4 2025 Prior"] },
          { type: "table-row", cols: ["Net sales", "$25.1M", "$23.8M"] },
          { type: "table-row", cols: ["ARR (software + care mgmt)", "$22.4M", "$21.1M"] },
          { type: "table-row", cols: ["Adjusted EBITDA", "$3.2M", "$2.9M"] },
          { type: "table-row", cols: ["Cash and cash equivalents", "$12.4M", "$11.6M"] },
          {
            type: "line",
            text: "FY26 net sales budget: $108M (planning target — not an actual).",
            muted: true,
          },
        ],
      },
      {
        heading: "People & Retention",
        pageBreakBefore: true,
        blocks: [
          { type: "line", text: "Workforce census: 412 FTE at March 31, 2026 (clinical + corporate)." },
          { type: "line", text: "Gross churn (payer / employer logos): 2.8% quarterly." },
          {
            type: "paragraph",
            text: "Unlike the Q2 pack, this Q1 submission includes the full workforce census. Clinical hiring for Phoenix is complete.",
          },
        ],
      },
      {
        heading: "Payer & Compliance Commentary",
        pageBreakBefore: true,
        blocks: [
          {
            type: "paragraph",
            text: "Two large renewals are in legal review for July 1 start dates. Compliance investments ahead of enterprise RFP season remain on track.",
          },
        ],
      },
      {
        heading: "Risks & Follow-up",
        pageBreakBefore: true,
        blocks: [
          {
            type: "bullets",
            items: [
              "Reimbursement timing may stretch DSO if one regional payer delays remits.",
              "Follow-up: share Phoenix ramp cohort economics in the May ops update.",
            ],
          },
        ],
      },
    ],
  },
  {
    fileName: "Veridian_Cloud_Systems_Q1_2026_Board_Update.pdf",
    cover: {
      companyName: "Veridian Cloud Systems",
      reportTitle: "Board Update — Q1 2026",
      period: "Q1 2026",
      reportType: "Board Update · SaaS Portfolio Company",
      submittedDate: "April 15, 2026",
      confidentiality:
        "CONFIDENTIAL — Prepared for Sagard. Contains forward-looking statements marked as such.",
    },
    sections: [
      {
        heading: "Executive Highlights",
        blocks: [
          {
            type: "paragraph",
            text: "Veridian entered 2026 with ARR of $69.8M and finished Q1 at $71.5M. Net revenue retention held above 110% as expansion motion in existing accounts offset modest logo churn.",
          },
          {
            type: "bullets",
            items: [
              "Q1 Revenue: $16.9M",
              "ARR: $71.5M (+$1.7M QoQ)",
              "Cash: $38.4M",
              "Headcount: 274",
              "Logo churn: 2.1% · Revenue churn: 1.6%",
            ],
          },
        ],
      },
      {
        heading: "ARR Bridge",
        pageBreakBefore: true,
        blocks: [
          { type: "table-header", cols: ["Component", "Amount", "Notes", ""] },
          { type: "table-row", cols: ["Opening ARR (Jan 1)", "$69.8M", "Board-approved", ""] },
          { type: "table-row", cols: ["New logo ARR", "+$1.4M", "11 logos", ""] },
          { type: "table-row", cols: ["Expansion ARR", "+$1.2M", "Upsell / seats", ""] },
          { type: "table-row", cols: ["Churn / contraction", "-$0.9M", "3 logos", ""] },
          { type: "table-row", cols: ["Ending ARR (Mar 31)", "$71.5M", "—", ""] },
          {
            type: "line",
            text: "Internal Q2 ending ARR forecast: ~$74M (projection only — not actual).",
            muted: true,
          },
        ],
      },
      {
        heading: "P&L & Liquidity",
        pageBreakBefore: true,
        blocks: [
          { type: "table-header", cols: ["Metric", "Q1 2026", "Q4 2025", "Budget"] },
          { type: "table-row", cols: ["Revenue", "$16.9M", "$16.1M", "$16.5M"] },
          { type: "table-row", cols: ["Adjusted EBITDA", "$2.4M", "$2.1M", "$2.2M"] },
          { type: "table-row", cols: ["Cash", "$38.4M", "$36.9M", "—"] },
          { type: "line", text: "Website: www.veridiancloud.example · IR: ir@veridiancloud.example" },
        ],
      },
      {
        heading: "Product & GTM Commentary",
        pageBreakBefore: true,
        blocks: [
          {
            type: "paragraph",
            text: "Cloud observability SKU attach rate rose to 34% of new deals. Sales cycle length for six-figure ACV remained stable at 78 days median.",
          },
        ],
      },
      {
        heading: "Risks & Asks",
        pageBreakBefore: true,
        blocks: [
          {
            type: "bullets",
            items: [
              "Hyperscaler partner co-sell motion slower than plan in EMEA.",
              "Ask: confirm Q2 hiring envelope for solutions engineers (+8).",
              "Follow-up: deliver cohort retention appendix with May board materials.",
            ],
          },
        ],
      },
    ],
  },
  {
    fileName: "Northwind_Consumer_Q1_2026_Category_Review.pdf",
    cover: {
      companyName: "Northwind Consumer Group",
      reportTitle: "Category Performance Review",
      period: "Q1 2026",
      reportType: "Category Review · Retail / CPG Portfolio",
      submittedDate: "April 18, 2026",
      confidentiality:
        "CONFIDENTIAL — Sagard portfolio company materials. Not for retailer redistribution.",
    },
    sections: [
      {
        heading: "Retail Landscape",
        blocks: [
          {
            type: "paragraph",
            text: "Q1 retail sell-through was resilient despite promotional intensity at club and mass. Same-store sales finished +2.4% with online contributing 19% of revenue.",
          },
        ],
      },
      {
        heading: "Category Mix — Net Sales",
        pageBreakBefore: true,
        blocks: [
          { type: "table-header", cols: ["Category", "Q1 2026 Sales", "% of Total", "YoY"] },
          { type: "table-row", cols: ["Core pantry", "$48.6M", "43%", "+1.8%"] },
          { type: "table-row", cols: ["Better-for-you", "$31.2M", "28%", "+6.4%"] },
          { type: "table-row", cols: ["Impulse / seasonal", "$19.4M", "17%", "-1.2%"] },
          { type: "table-row", cols: ["Foodservice / other", "$13.6M", "12%", "+3.1%"] },
          { type: "table-row", cols: ["Total net sales", "$112.8M", "100%", "+2.6%"] },
        ],
      },
      {
        heading: "P&L Summary",
        pageBreakBefore: true,
        blocks: [
          { type: "line", text: "Revenue (net sales): $112.8M" },
          { type: "line", text: "Adjusted EBITDA: $13.9M (12.3% margin)" },
          { type: "line", text: "Cash balance: $18.6M (disclosed this period)" },
          { type: "line", text: "Headcount: 2,040 FTEs across manufacturing and G&A" },
          {
            type: "line",
            text: "ARR is not a primary KPI for this consumer business model.",
            muted: true,
          },
          {
            type: "paragraph",
            text: "Unlike the Q2 board pack (which omitted cash), Q1 includes the full liquidity line after treasury closed the period books.",
          },
        ],
      },
      {
        heading: "Trade & Supply Notes",
        pageBreakBefore: true,
        blocks: [
          {
            type: "paragraph",
            text: "Trade spend ran 40 bps above plan due to club-channel promotions. Cocoa and packaging cost inflation moderated vs Q4. Two SKUs were delisted at a regional grocery banner; pipeline replacements are in shelf-reset for May.",
          },
        ],
      },
      {
        heading: "Board Follow-ups",
        pageBreakBefore: true,
        blocks: [
          {
            type: "bullets",
            items: [
              "Approve H2 innovation slate (4 SKUs) with $2.1M launch budget.",
              "Review club-channel margin waterfalls in the May deep dive.",
              "Confirm summer capacity plan for the Midwest plant.",
            ],
          },
        ],
      },
    ],
  },
  {
    fileName: "Stonegate_Properties_Q1_2026_Operating_Review.pdf",
    cover: {
      companyName: "Stonegate Properties",
      reportTitle: "Q1 2026 Operating Review",
      period: "Q1 2026",
      reportType: "Real Estate Operating Review · Portfolio Company Submission",
      submittedDate: "April 16, 2026",
      confidentiality:
        "CONFIDENTIAL — Sagard Holdings portfolio review. Real estate operating metrics only.",
    },
    sections: [
      {
        heading: "Portfolio Snapshot",
        blocks: [
          {
            type: "paragraph",
            text: "Stonegate closed Q1 2026 with stable occupancy across the multifamily and light-industrial book. Same-store NOI tracked modestly ahead of the internal plan.",
          },
          {
            type: "bullets",
            items: [
              "Occupancy (stabilized): 94%",
              "Same-store NOI growth vs Q1 2025: +3.1%",
              "Assets under management: 42 properties",
            ],
          },
        ],
      },
      {
        heading: "Financial Actuals — Q1 2026",
        pageBreakBefore: true,
        blocks: [
          { type: "table-header", cols: ["Metric", "Q1 2026 Actual", "Q4 2025 Prior", "Notes"] },
          { type: "table-row", cols: ["Total Revenue (rental + other)", "$28.4M", "$27.1M", "Actual"] },
          { type: "table-row", cols: ["Net Operating Income (NOI)", "$14.1M", "$13.6M", "Actual"] },
          { type: "table-row", cols: ["Adjusted EBITDA", "$11.8M", "$11.2M", "Actual"] },
          { type: "table-row", cols: ["Cash and cash equivalents", "$9.2M", "$8.7M", "Actual"] },
          {
            type: "table-row",
            cols: ["Annual Recurring Revenue (ARR)", "Not applicable", "—", "Real estate model"],
            muted: true,
          },
          {
            type: "line",
            text: "ARR is not applicable to this real estate portfolio company and is intentionally omitted as a KPI.",
            muted: true,
          },
        ],
      },
      {
        heading: "Balance Sheet & Capital",
        pageBreakBefore: true,
        blocks: [
          { type: "line", text: "Total secured debt outstanding: $210M (mortgage / facility balances)." },
          { type: "line", text: "Weighted average cost of debt: 5.4%." },
          { type: "line", text: "Headcount: 86 FTEs across asset management and corporate." },
          {
            type: "paragraph",
            text: "Debt figures above are capital structure items, not recurring revenue metrics. Do not map debt balances to ARR.",
          },
        ],
      },
      {
        heading: "Operating Commentary",
        pageBreakBefore: true,
        blocks: [
          {
            type: "paragraph",
            text: "Leasing velocity improved in two light-industrial parks. Multifamily renewals held at 58% with moderate rent bumps. Capex for Q1 totaled $4.2M, primarily unit turns and lobby upgrades.",
          },
        ],
      },
      {
        heading: "Risks & Follow-up",
        pageBreakBefore: true,
        blocks: [
          {
            type: "bullets",
            items: [
              "Interest-rate resets on two maturities in H2 2026.",
              "Follow-up: provide rent-roll aging appendix with the May ops update.",
              "Contact: finance@stonegate.example",
            ],
          },
        ],
      },
    ],
  },
];
