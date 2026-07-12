/**
 * Generate synthetic demo-report PDFs for batch-upload / duplicate demos.
 * Output lives under public/demo-reports/ and is gated by NEXT_PUBLIC_ENABLE_DEMO_REPORTS.
 *
 * Usage: npx tsx scripts/generate-demo-reports.ts
 */
import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const ROOT = path.join(process.cwd(), "public", "demo-reports");

async function writeNarrativePdf(
  filePath: string,
  title: string,
  lines: string[],
  opts?: { landscape?: boolean }
) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const size = opts?.landscape ? ([792, 612] as const) : ([612, 792] as const);
  let page = doc.addPage([...size]);
  let y = size[1] - 52;
  page.drawText(title.slice(0, 70), {
    x: 48,
    y,
    size: 15,
    font: bold,
    color: rgb(0.39, 0.13, 0.18),
  });
  y -= 26;
  for (const line of lines) {
    if (y < 56) {
      page = doc.addPage([...size]);
      y = size[1] - 52;
    }
    page.drawText(line.slice(0, opts?.landscape ? 110 : 95), {
      x: 48,
      y,
      size: 10,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= 14;
  }
  const bytes = await doc.save();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, bytes);
  console.log("Wrote", path.relative(process.cwd(), filePath));
}

async function writeTableHeavyPdf(filePath: string, company: string, period: string) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([612, 792]);
  page.drawText(`${company} — ${period} Financial Pack`, {
    x: 40,
    y: 750,
    size: 14,
    font: bold,
    color: rgb(0.39, 0.13, 0.18),
  });
  page.drawText("Real estate management accounts · Currency USD", {
    x: 40,
    y: 730,
    size: 9,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });
  const headers = ["Metric", "Actual", "Prior", "Budget", "Forecast"];
  const rows = [
    ["Total Revenue", "$37.8M", "$35.2M", "$37.0M", "$39.5M"],
    ["Net Operating Income", "$18.6M", "$17.1M", "$18.0M", "$19.2M"],
    ["Adjusted EBITDA", "$15.4M", "$14.0M", "$15.0M", "$16.1M"],
    ["Cash", "$12.4M", "$10.8M", "$11.5M", "$12.0M"],
    ["Headcount", "92", "86", "90", "95"],
  ];
  let y = 700;
  headers.forEach((h, i) => {
    page.drawText(h, { x: 40 + i * 100, y, size: 10, font: bold });
  });
  y -= 18;
  for (const row of rows) {
    row.forEach((cell, i) => {
      page.drawText(cell, { x: 40 + i * 100, y, size: 10, font });
    });
    y -= 16;
  }
  page.drawText("ARR is not applicable to this real estate portfolio company.", {
    x: 40,
    y: y - 16,
    size: 9,
    font,
  });
  page.drawText("Total secured debt outstanding: $218M (capital structure — not ARR).", {
    x: 40,
    y: y - 32,
    size: 9,
    font,
  });
  page.drawText("Aligned with Stonegate Q2 Portfolio Report revenue actual of $37.8M.", {
    x: 40,
    y: y - 48,
    size: 9,
    font,
    color: rgb(0.45, 0.45, 0.45),
  });
  const bytes = await doc.save();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, bytes);
  console.log("Wrote", path.relative(process.cwd(), filePath));
}

async function main() {
  await writeNarrativePdf(
    path.join(ROOT, "company-formatted", "Sagard-Auto", "sagard auto report.pdf"),
    "Sagard Auto — Q2 2026 Operating Review",
    [
      "Confidential",
      "Company: Sagard Auto",
      "Reporting period: Q2 2026",
      "Currency: USD",
      "",
      "Financial performance",
      "Revenue (actual): $42.1M",
      "EBITDA (actual): $6.4M",
      "Cash balance: $11.2M",
      "Headcount: 312",
      "",
      "ARR is not used for this industrial portfolio company.",
      "Contact: reporting@sagard-auto.example",
      "Website: www.sagard-auto.example",
      "",
      "Uploaded for duplicate-detection demo on July 9, 2026.",
    ]
  );

  // Second period for Sagard Auto
  await writeNarrativePdf(
    path.join(ROOT, "company-formatted", "Sagard-Auto", "Sagard_Auto_Q1_2026_Board_Update.pdf"),
    "Sagard Auto — Q1 2026 Board Update",
    [
      "Company: Sagard Auto",
      "Reporting period: Q1 2026",
      "Revenue (actual): $39.8M",
      "EBITDA (actual): $5.9M",
      "Cash: $10.1M",
      "Headcount: 305",
    ]
  );

  // Prefer the detailed generated Stonegate Q1 operating review when available.
  const stonegateQ1Sample = path.join(
    process.cwd(),
    "public",
    "sample-portfolio-pdfs",
    "Stonegate_Properties_Q1_2026_Operating_Review.pdf"
  );
  const stonegateQ1Demo = path.join(
    ROOT,
    "company-formatted",
    "Stonegate-Properties",
    "Stonegate_Properties_Q1_2026_Operating_Review.pdf"
  );
  fs.mkdirSync(path.dirname(stonegateQ1Demo), { recursive: true });
  if (fs.existsSync(stonegateQ1Sample)) {
    fs.copyFileSync(stonegateQ1Sample, stonegateQ1Demo);
    console.log("Copied", path.relative(process.cwd(), stonegateQ1Demo));
  } else {
    await writeNarrativePdf(
      stonegateQ1Demo,
      "Stonegate Properties — Q1 2026 Operating Review",
      [
        "Real estate operating review",
        "Company: Stonegate Properties",
        "Reporting period: Q1 2026",
        "Total Revenue (rental + other): $28.4M",
        "Net Operating Income (NOI): $14.1M",
        "Adjusted EBITDA: $11.8M",
        "Cash and cash equivalents: $9.2M",
        "Occupancy: 94%",
        "Total secured debt outstanding: $210M",
        "Headcount: 86",
        "ARR is not applicable to this real estate portfolio company.",
        "Contact: finance@stonegate.example",
      ]
    );
  }

  await writeTableHeavyPdf(
    path.join(
      ROOT,
      "company-formatted",
      "Stonegate-Properties",
      "Stonegate_Properties_Q2_2026_Financial_Pack.pdf"
    ),
    "Stonegate Properties",
    "Q2 2026"
  );

  // Prefer the richer sample Veridian board pack when available.
  const veridianSample = path.join(
    process.cwd(),
    "public",
    "sample-portfolio-pdfs",
    "Veridian_Cloud_Systems_Q2_2026_Board_Update.pdf"
  );
  const veridianDemo = path.join(
    ROOT,
    "company-formatted",
    "Veridian-Cloud-Systems",
    "Veridian_Cloud_Systems_Q2_2026_Board_Update.pdf"
  );
  fs.mkdirSync(path.dirname(veridianDemo), { recursive: true });
  if (fs.existsSync(veridianSample)) {
    fs.copyFileSync(veridianSample, veridianDemo);
    console.log("Copied", path.relative(process.cwd(), veridianDemo));
  } else {
    await writeNarrativePdf(
      veridianDemo,
      "Veridian Cloud Systems — Q2 2026 Board Update",
      [
        "Company: Veridian Cloud Systems",
        "Reporting period: Q2 2026",
        "Executive summary",
        "Q2 Revenue $18.6M while maintaining disciplined opex.",
        "ARR $74.2M",
        "Cash $41.0M",
        "Headcount 286",
        "Churn 1.8%",
        "Website: www.veridiancloud.example",
        "Contact: ir@veridiancloud.example",
        "Appendix: revenue outlook to $75.8M while maintaining discipline.",
      ]
    );
  }

  // Copy detailed Q1 Veridian board update when generated via sample PDFs.
  const veridianQ1Sample = path.join(
    process.cwd(),
    "public",
    "sample-portfolio-pdfs",
    "Veridian_Cloud_Systems_Q1_2026_Board_Update.pdf"
  );
  const veridianQ1Demo = path.join(
    ROOT,
    "company-formatted",
    "Veridian-Cloud-Systems",
    "Veridian_Cloud_Systems_Q1_2026_Board_Update.pdf"
  );
  if (fs.existsSync(veridianQ1Sample)) {
    fs.copyFileSync(veridianQ1Sample, veridianQ1Demo);
    console.log("Copied", path.relative(process.cwd(), veridianQ1Demo));
  }

  const northwindConsumerQ1Sample = path.join(
    process.cwd(),
    "public",
    "sample-portfolio-pdfs",
    "Northwind_Consumer_Q1_2026_Category_Review.pdf"
  );
  const northwindConsumerQ1Demo = path.join(
    ROOT,
    "company-formatted",
    "Northwind-Consumer-Group",
    "Northwind_Consumer_Q1_2026_Category_Review.pdf"
  );
  if (fs.existsSync(northwindConsumerQ1Sample)) {
    fs.mkdirSync(path.dirname(northwindConsumerQ1Demo), { recursive: true });
    fs.copyFileSync(northwindConsumerQ1Sample, northwindConsumerQ1Demo);
    console.log("Copied", path.relative(process.cwd(), northwindConsumerQ1Demo));
  }

  // Prefer the richer sample Horizon operating review when available.
  const horizonQ2Sample = path.join(
    process.cwd(),
    "public",
    "sample-portfolio-pdfs",
    "Horizon_Care_Network_Q2_2026_Operating_Review.pdf"
  );
  const horizonQ2Demo = path.join(
    ROOT,
    "company-formatted",
    "Horizon-Care-Network",
    "Horizon_Care_Network_Q2_2026_Operating_Review.pdf"
  );
  fs.mkdirSync(path.dirname(horizonQ2Demo), { recursive: true });
  if (fs.existsSync(horizonQ2Sample)) {
    fs.copyFileSync(horizonQ2Sample, horizonQ2Demo);
    console.log("Copied", path.relative(process.cwd(), horizonQ2Demo));
  } else {
    await writeNarrativePdf(
      horizonQ2Demo,
      "Horizon Care Network — Q2 2026 Operating Review",
      [
        "Company: Horizon Care Network",
        "Reporting period: Q2 2026",
        "Patient visits: 184,000",
        "Revenue: $52.3M",
        "EBITDA: $7.1M",
        "Cash: $14.8M",
        "Headcount: 1,240",
        "ARR is not applicable for healthcare services.",
      ]
    );
  }

  await writeNarrativePdf(
    path.join(
      ROOT,
      "company-formatted",
      "Nova-Financial-Group",
      "Nova_Financial_Group_H1_2026_Investor_Update.pdf"
    ),
    "Nova Financial Group — H1 2026 Investor Update",
    [
      "Company: Nova Financial Group",
      "Reporting period: H1 2026",
      "AUM: $4.2B",
      "Revenue: $88.0M",
      "Net income: $21.4M",
      "Cash / liquidity: $62.0M",
      "Headcount: 510",
      "Note: filename may say Q2 while content is H1 — confirm period.",
    ]
  );

  await writeNarrativePdf(
    path.join(
      ROOT,
      "company-formatted",
      "Summit-Industrial-Solutions",
      "Summit_Industrial_Q2_2026_Management_Report.pdf"
    ),
    "Summit Industrial Solutions — Q2 2026",
    [
      "Company: Summit Industrial Solutions",
      "Reporting period: Q2 2026",
      "Revenue: $33.5M",
      "EBITDA: $4.2M",
      "Cash: $8.6M",
      "Headcount: 620",
      "Segment note: North America revenue $21.0M (segment, not consolidated).",
      "Consolidated Revenue (actual): $33.5M",
    ]
  );

  await writeNarrativePdf(
    path.join(
      ROOT,
      "company-formatted",
      "Northwind-Consumer-Group",
      "Northwind_Consumer_Q2_2026_Board_Pack.pdf"
    ),
    "Northwind Consumer Group — Q2 2026 Board Pack",
    [
      "Company: Northwind Consumer Group",
      "Reporting period: Q2 2026",
      "Revenue: $120.4M",
      "EBITDA: $15.2M",
      "Cash: —",
      "Cash balance not disclosed this period.",
      "Headcount: 2,100",
      "Dash cells are not zero.",
    ]
  );

  // Landscape investor presentation
  await writeNarrativePdf(
    path.join(
      ROOT,
      "company-formatted",
      "Summit-Industrial-Solutions",
      "Summit_Industrial_Q1_2026_Investor_Deck.pdf"
    ),
    "Summit Industrial — Q1 2026 Investor Presentation",
    [
      "Landscape-style investor deck",
      "Company: Summit Industrial Solutions",
      "Reporting period: Q1 2026",
      "Revenue (actual): $31.2M",
      "EBITDA (actual): $3.8M",
      "Cash: $7.9M",
    ],
    { landscape: true }
  );

  // Scanned / OCR-required stub — still extractable after OCR recovery lines
  await writeNarrativePdf(
    path.join(
      ROOT,
      "company-formatted",
      "Horizon-Care-Network",
      "Horizon_Care_Network_Q1_2026_Scanned_Appendix.pdf"
    ),
    "Horizon Care — Scanned Appendix (OCR required)",
    [
      "[Scanned page placeholder]",
      "This appendix had limited selectable text; OCR recovered the figures below.",
      "Company: Horizon Care Network",
      "Reporting period: Q1 2026",
      "Currency: USD",
      "Revenue (actual): $41.2M",
      "EBITDA (actual): $5.1M",
      "Cash balance: $8.4M",
      "Headcount: 640",
      "Treat as OCR-assisted extraction for scanned PDF demos.",
    ]
  );

  // ICReady templates (Q1 + Q2)
  const templateCompanies = [
    ["BrightPeak-Energy", "BrightPeak Energy", "$61.0M", "$12.4M", "$18.0M", "540"],
    ["Atlas-Logistics", "Atlas Logistics", "$44.2M", "$6.8M", "$9.5M", "890"],
    ["Meridian-Healthcare-Services", "Meridian Healthcare Services", "$55.1M", "$8.2M", "$12.0M", "1,100"],
    ["Crestline-Software", "Crestline Software", "$29.4M", "$4.1M", "$35.0M", "210"],
    ["Oakridge-Consumer-Products", "Oakridge Consumer Products", "$70.0M", "$9.3M", "$11.2M", "1,450"],
    ["Harbor-Financial-Partners", "Harbor Financial Partners", "$48.6M", "$14.0M", "$40.0M", "320"],
  ] as const;

  function scaleDemoMoney(value: string, factor: number): string {
    const match = value.match(/^\$([\d,]+(?:\.\d+)?)([MBK]?)$/i);
    if (!match) return value;
    const n = parseFloat(match[1].replace(/,/g, "")) * factor;
    const suffix = match[2] || "";
    const rounded = n >= 100 ? Math.round(n) : Math.round(n * 10) / 10;
    return `$${rounded}${suffix}`;
  }

  function scaleDemoCount(value: string, factor: number): string {
    const n = Math.round(parseFloat(value.replace(/,/g, "")) * factor);
    return n.toLocaleString("en-US");
  }

  for (const [folder, name, rev, ebitda, cash, hc] of templateCompanies) {
    for (const period of ["Q2 2026", "Q1 2026"] as const) {
      const factor = period === "Q1 2026" ? 0.92 : 1;
      await writeNarrativePdf(
        path.join(
          ROOT,
          "icready-template",
          folder,
          `ICReady_Template_${folder.replace(/-/g, "_")}_${period.replace(/\s+/g, "_")}.pdf`
        ),
        `ICReady Template — ${name} ${period}`,
        [
          "ICREADY_TEMPLATE_V1",
          `Company: ${name}`,
          `Reporting period: ${period}`,
          "Currency: USD",
          `Revenue (actual): ${scaleDemoMoney(rev, factor)}`,
          `EBITDA (actual): ${scaleDemoMoney(ebitda, factor)}`,
          `Cash (actual): ${scaleDemoMoney(cash, factor)}`,
          `Headcount: ${scaleDemoCount(hc, period === "Q1 2026" ? 0.97 : 1)}`,
          `Reporting contact: ir@${folder.toLowerCase()}.example`,
          "Explicit actual/budget/forecast context on standardized tables.",
        ]
      );
    }
  }

  // README markers
  fs.writeFileSync(
    path.join(ROOT, "README.txt"),
    "Synthetic demo reports only. Gated by NEXT_PUBLIC_ENABLE_DEMO_REPORTS. Not production data.\n"
  );

  console.log("Demo report generation complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
