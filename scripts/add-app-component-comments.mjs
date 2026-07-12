#!/usr/bin/env node
/**
 * One-off script: add file-level and export JSDoc comments to app components
 * (everything under components/ except portfolio-monitoring/).
 * Run from sagard-ic-ready: node scripts/add-app-component-comments.mjs
 */
import fs from "fs";
import path from "path";

const ROOT = path.join(process.cwd(), "components");
const SKIP_DIR = "portfolio-monitoring";

const FILE_DESCRIPTIONS = {
  "DealReadinessPage.tsx":
    "Standalone demo page: runs AI analysis and shows the IC readiness dashboard for one deal.",
  "DealsPipeline.tsx":
    "Legacy deals list with summary cards, filters, and links to company detail pages.",
  "ICReadyDashboard.tsx":
    "Three-step IC readiness workspace: review analysis, pick a decision, and export the package.",
  "Sidebar.tsx": "Left sidebar navigation for the legacy deals demo layout.",
  "auth/AuthProvider.tsx":
    "React context that loads the signed-in user from the session API and handles login/logout.",
  "auth/AuthShell.tsx":
    "Split-screen layout wrapper for login and onboarding pages.",
  "auth/LoginView.tsx": "Email and password sign-in form with demo account hints.",
  "company/AnalysisPipelineStatus.tsx":
    "Shows the three-step AI diligence pipeline (ingest, analyze, review) with status.",
  "company/AnalysisPreviewSection.tsx":
    "Collapsible preview of AI analysis sections before full review.",
  "company/AuditTrail.tsx": "Timeline of human and AI actions taken on a deal.",
  "company/BlockerAcknowledgeModal.tsx":
    "Modal to acknowledge a blocking conflict before proceeding with IC review.",
  "company/BlockingConflicts.tsx":
    "Lists deal-blocking issues that must be resolved before IC submission.",
  "company/ChecklistTable.tsx":
    "Diligence checklist table with completion status per item.",
  "company/CompanyDetailView.tsx":
    "Full company diligence page: profile, analysis, conflicts, and decision workflow.",
  "company/CompanyPortfolioHeader.tsx":
    "Header bar on a company page with name, stage, and portfolio context.",
  "company/CompanyProfile.tsx":
    "Company profile panel with sector, stage, and key metadata.",
  "company/CompanyProfileCard.tsx":
    "Compact company summary card for pipeline and list views.",
  "company/CompanySnapshot.tsx":
    "Quick snapshot of company facts and deal context at the top of the detail page.",
  "company/ConflictsPanel.tsx":
    "Side panel listing contradictions found across source documents.",
  "company/ConflictsSummary.tsx":
    "Summary counts of open conflicts grouped by severity.",
  "company/DealSnapshotSection.tsx":
    "Key deal metrics grid (revenue, growth, etc.) from synced sources.",
  "company/DealStatusStrip.tsx":
    "Horizontal strip showing deal stage, owner, and readiness status.",
  "company/DecisionOptionsList.tsx":
    "Radio list of IC decision choices (approve, defer, pass, etc.).",
  "company/DecisionOutcomeModal.tsx":
    "Confirmation modal after submitting an IC decision with rationale.",
  "company/DecisionPanel.tsx":
    "Panel to record the IC committee decision and rationale for a deal.",
  "company/DraftOnePager.tsx":
    "AI-generated one-pager draft for the IC package.",
  "company/DraftPanel.tsx":
    "Editable draft sections of the IC memo with source citations.",
  "company/HumanSignOffPanel.tsx":
    "Checklist for required human sign-offs before IC submission.",
  "company/ICPackageReadiness.tsx":
    "Score and breakdown of how ready the IC package is for committee review.",
  "company/ReadinessVerdict.tsx":
    "Final readiness verdict badge (ready, blocked, or needs work).",
  "company/ReviewWorkflowSidebar.tsx":
    "Right sidebar showing review steps and progress through the workflow.",
  "company/SourceEvidenceGrid.tsx":
    "Grid of synced source documents with type and freshness.",
  "company/SourceInputsPanel.tsx":
    "Panel listing uploaded and synced inputs that feed the AI analysis.",
  "company/SubmittedDecisionBanner.tsx":
    "Banner shown after a decision is submitted, with outcome summary.",
  "company/UnsupportedClaims.tsx":
    "List of AI claims that lack supporting evidence in source documents.",
  "dashboard/DashboardView.tsx":
    "Main dashboard: welcome banner, AI findings, deal table, and portfolio promo.",
  "dashboard/PortfolioFeatureBanner.tsx":
    "Promotional card linking users to the portfolio monitoring product area.",
  "dashboard/TodaysAiFindings.tsx":
    "Carousel of today's AI-detected issues and opportunities across deals.",
  "dashboard/WelcomeBanner.tsx":
    "Personalized greeting with quick stats for the signed-in user.",
  "decisions/DecisionProvider.tsx":
    "React context storing IC decisions per deal in browser storage.",
  "exports/ExportsFilterBar.tsx":
    "Search and filter controls for the diligence exports history page.",
  "exports/ExportsPagination.tsx": "Page controls for the exports table.",
  "exports/ExportsSummaryCards.tsx":
    "Summary stat cards (total exports, recent, by type) on the exports page.",
  "exports/ExportsView.tsx":
    "Full exports page with summary cards, filters, and export history table.",
  "ic-readiness/ICQueueBanner.tsx":
    "Banner at the top of the IC readiness page with queue stats.",
  "ic-readiness/ICReadinessView.tsx":
    "IC review queue page with filters, table, and pagination.",
  "ic-readiness/ReviewQueueFilterBar.tsx":
    "Filter bar for the IC review queue (stage, owner, readiness).",
  "ic-readiness/ReviewQueuePagination.tsx": "Pagination for the IC review queue table.",
  "ic-readiness/ReviewQueueTable.tsx":
    "Table of deals waiting for IC committee review with status columns.",
  "layout/AppShell.tsx":
    "Main app layout: sidebar, header bar, and scrollable page content.",
  "layout/DiligenceModeHeader.tsx":
    "Top header for IC diligence mode with product switcher and user menu.",
  "layout/ProductModeHeaderBar.tsx":
    "Shared header bar with product mode toggle and user avatar menu.",
  "layout/UserMenu.tsx": "Dropdown menu for account info, settings link, and sign out.",
  "onboarding/OnboardingView.tsx":
    "Multi-step onboarding wizard for role, integrations, and first-run setup.",
  "pipeline/PipelineBoardView.tsx":
    "Pipeline page composing summary cards, filters, table, and pagination.",
  "pipeline/PipelineComponents.tsx":
    "Shared pipeline UI pieces: stage badges, owner avatars, and status chips.",
  "pipeline/PipelineFilterBar.tsx":
    "Filter controls for the deal pipeline (stage, owner, readiness).",
  "pipeline/PipelinePagination.tsx": "Pagination controls for the pipeline table.",
  "pipeline/PipelineSummaryCards.tsx":
    "Summary stat cards at the top of the pipeline page.",
  "pipeline/PipelineTable.tsx": "Sortable table of deals with stage and readiness columns.",
  "portfolio/PortfolioMetricsView.tsx":
    "Standalone portfolio-metrics demo with PDF extraction and review table.",
  "settings/SettingsView.tsx":
    "Settings page for profile, integrations, and notification preferences.",
  "ui/BackNav.tsx": "Back link button used at the top of nested pages.",
  "ui/CompanyLogo.tsx": "Company logo or initials avatar with fallback colors.",
  "ui/DealFilterBar.tsx": "Reusable filter bar for deal list pages.",
  "ui/DealTable.tsx": "Reusable table of deals with links to company detail pages.",
  "ui/EvidenceDrawer.tsx":
    "Slide-out drawer showing source evidence for a claim or metric.",
  "ui/Icons.tsx": "Inline SVG icons used across navigation and action buttons.",
  "ui/PageChrome.tsx":
    "Page wrapper with title, subtitle, and optional action slot.",
  "ui/Pagination.tsx": "Reusable pagination controls for data tables.",
};

const EXPORT_JS_DOC = {
  AuthProvider:
    "Wraps the app and exposes login state, user profile, and auth actions.",
  useAuth: "Read the current user and auth helpers from AuthProvider.",
  DecisionProvider:
    "Stores and loads IC decisions per deal from browser local storage.",
  useDecision: "Read or update the IC decision for a deal from DecisionProvider.",
  usePortfolioSidebar:
    "Read sidebar collapsed state from the portfolio shell (if mounted).",
  DealReadinessPage:
    "Full-page demo that fetches AI analysis and renders ICReadyDashboard.",
  ICReadyDashboard:
    "Three-step review UI: analysis summary, decision form, and export.",
  CompanyDetailView:
    "Orchestrates all company diligence panels for a single deal ID.",
  DashboardView: "Composes dashboard sections into the main home screen.",
  ExportsView: "Full-page exports history with filters and pagination.",
  ICReadinessView: "IC review queue page with banner, filters, and table.",
  PipelineBoardView: "Full pipeline page with cards, filters, and deal table.",
  OnboardingView: "Step-by-step first-run setup wizard for new users.",
  SettingsView: "Account and integration settings form.",
  PortfolioMetricsView:
    "Demo workflow for uploading PDFs and reviewing extracted metrics.",
  AppShell: "Page layout with sidebar navigation and header.",
  LoginView: "Sign-in form that calls the login API and redirects on success.",
  AuthShell: "Centered card layout for auth and onboarding screens.",
  NavIcon: "Renders a named SVG icon from the shared icon set.",
  EvidenceDrawer: "Side drawer that shows linked source documents and quotes.",
  PageChrome: "Standard page header with title and optional right-side actions.",
  SummaryCard: "Small stat card with label, value, and hint text.",
  runAnalysis: "Triggers the diligence AI pipeline via the analyze API.",
};

function camelToWords(name) {
  return name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .toLowerCase();
}

function defaultExportDoc(name, kind) {
  if (EXPORT_JS_DOC[name]) return EXPORT_JS_DOC[name];
  const words = camelToWords(name);
  if (kind === "type") return `Type shape used by ${words}.`;
  if (kind === "const" && name.startsWith("DEFAULT_")) return `Default ${words.replace(/^default /, "")}.`;
  if (kind === "const" && name.endsWith("_LABELS")) return `Labels for each ${words.replace(/ labels$/, "")} option.`;
  if (kind === "const" && name.endsWith("_HREF")) return `URL path for ${words.replace(/ href$/, "")}.`;
  if (name.startsWith("use")) return `Hook to read ${words.replace(/^use /, "")} state.`;
  return `Renders the ${words} UI.`;
}

function hasFileHeader(content) {
  const lines = content.split("\n").slice(0, 10);
  return lines.some((l) => l.trim().startsWith("/**") && l.includes("."));
}

function insertFileHeader(content, description) {
  if (hasFileHeader(content)) return content;
  const header = `/** ${description} */\n`;
  if (content.startsWith('"use client";\n\n')) {
    return content.replace('"use client";\n\n', `"use client";\n\n${header}`);
  }
  if (content.startsWith('"use client";\n')) {
    return content.replace('"use client";\n', `"use client";\n\n${header}`);
  }
  return `${header}\n${content}`;
}

function addExportJsDoc(content) {
  const lines = content.split("\n");
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^export (function|const|type|async function) ([A-Za-z0-9_]+)/);
    if (match) {
      const kind = match[1];
      const name = match[2];
      const prevNonEmpty = [...out].reverse().find((l) => l.trim() !== "");
      const hasJsDoc = prevNonEmpty?.trim().endsWith("*/");
      const isComponentAlias = kind === "const" && /^[A-Z]/.test(name);
      const isNamedConst =
        kind === "const" &&
        (name.startsWith("DEFAULT_") ||
          name.endsWith("_HREF") ||
          name.endsWith("_LABELS") ||
          name.endsWith("_FILTERS") ||
          name === "navItems");
      const shouldDoc =
        !hasJsDoc &&
        (kind === "function" ||
          kind === "async function" ||
          kind === "type" ||
          isComponentAlias ||
          isNamedConst);
      if (shouldDoc) {
        out.push(`/** ${defaultExportDoc(name, kind)} */`);
      }
    }
    out.push(line);
  }
  return out.join("\n");
}

function processFile(relPath) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) return false;
  let content = fs.readFileSync(full, "utf8");
  const original = content;
  const desc = FILE_DESCRIPTIONS[relPath];
  if (desc) content = insertFileHeader(content, desc);
  content = addExportJsDoc(content);
  if (content !== original) {
    fs.writeFileSync(full, content);
    return true;
  }
  return false;
}

let updated = 0;
function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === SKIP_DIR) continue;
      walk(p);
    } else if (/\.(ts|tsx)$/.test(ent.name)) {
      const rel = path.relative(ROOT, p).split(path.sep).join("/");
      if (processFile(rel)) updated++;
    }
  }
}
walk(ROOT);
console.log(`Updated ${updated} component files`);
