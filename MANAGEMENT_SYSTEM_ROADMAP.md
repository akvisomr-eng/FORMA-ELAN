# FORMA ELAN — Management System Roadmap

## Current verified state (2026-10-20)

- Public website: static Indonesian-language site deployed through GitHub Pages.
- Repository: https://github.com/akvisomr-eng/FORMA-ELAN
- Database: Neon project `curly-meadow-68675030`, database `neondb`, target branch `br-proud-sunset-b44taoa8`.
- Production schema was initially empty.
- The first database migration has been applied to the target branch and re-verified: 15 public tables are present. This establishes the data-model foundation only; it does not mean the application is production-ready.
- Neon Managed Auth has been provisioned and the GitHub Pages origin trusted, but sign-in/session flows and protected server-side APIs remain unimplemented or unverified. Do not expose management data or connect browser code directly to unrestricted database credentials.

## Phase 1 — Core business data model

Applied schema: 15 tables, 33 indexes, 35 foreign keys. The migration was tested on a temporary branch, applied after user approval, and the target branch was checked to confirm all 15 tables exist.

1. `organizations`: company profile, currency and timezone.
2. `user_profiles`: application profile placeholder; not a replacement for a real identity provider.
3. `organization_memberships`: organization membership and role labels.
4. `customers`: individual/company customer master data.
5. `leads`: sales prospects, pipeline status and follow-up.
6. `projects`: interior, architecture, renovation and build projects.
7. `project_tasks`: task ownership, priority and due dates.
8. `products`: material/product master and stock thresholds.
9. `inventory_movements`: stock movement ledger.
10. `quotes` and `quote_items`: customer quotations.
11. `invoices` and `invoice_items`: invoice and line items.
12. `expenses`: expense submissions and approvals.
13. `audit_logs`: application activity trail.

## Phase 2 — AI multi-agent and website AI companion (core product requirement)

FORMA ELAN must not become only a static website plus ordinary CRUD dashboard. The planned experience includes a multi-agent AI system and a visible website AI companion with both text and voice interaction.

- **Website companion:** a responsive, accessible chat companion available from the public site, with text input/output and an explicit voice mode using microphone capture and spoken responses where the browser supports it. Always provide a text fallback; ask permission before microphone use; show recording/listening state; allow stop/mute; do not listen continuously by default.
- **Indonesian-first UX:** Indonesian as the default interface and response language, with language-aware handling and natural Indonesian speech where supported by the selected speech provider/browser. Test pronunciation and device/browser compatibility instead of assuming quality.
- **Multi-agent orchestration:** a coordinator routes work to narrowly scoped agents rather than letting one unrestricted agent do everything. Initial agent roles: (1) visitor/FAQ and service information, (2) sales/lead qualification, (3) project planning and progress summaries, (4) materials/inventory assistance, (5) quotation/invoice explanation, and (6) management reporting. HR/payroll and financial actions must be permission-restricted.
- **Tool access and permissions:** agents may read or change business records only through authenticated server-side tools with organization/role checks. Any consequential action (send a quote, change a project status, approve an expense, issue an invoice, alter stock or payroll) requires human confirmation and is audited.
- **Knowledge grounding:** use approved FORMA ELAN service information, policies, catalog and project records; distinguish verified records from suggestions; disclose when the answer is uncertain; never invent portfolio images, prices, project status or customer facts.
- **Cost-safe rollout:** begin with a provider-agnostic orchestration interface, deterministic FAQ and mock/test data. Select a free-tier AI/STT/TTS option only after checking current limits, privacy, Indonesian language quality, and fallback behavior. Do not place provider API keys in public frontend code.
- **Release gates:** test prompt injection, data isolation, tool permissions, microphone permissions, text-only fallback, Indonesian speech quality, accessibility, rate limits and provider outages before enabling public access. Public visitors must not access internal CRM, project, finance, HR or customer data.

## Phase 3 — Security before real data

- Neon Managed Auth (Better Auth) has been enabled on the target branch, and `https://akvisomr-eng.github.io` has been added as a trusted origin. Actual sign-up/sign-in/session/protected-route flows are not yet integrated or tested.
- Enforce organization isolation and role-based authorization in a trusted server/API layer.
- Never put database connection strings or privileged credentials in frontend JavaScript.
- Add server-side validation, rate limiting, input validation, safe error handling and audit logging.
- Add row-level protections only after the selected authentication/authorization model is designed and tested.
- Use fake/test records until authorization tests pass.

## Phase 4 — Build the management interface and APIs

Recommended implementation order:
1. Admin shell, sign-in, organization context and dashboard.
2. Customer master and CRM lead pipeline.
3. Projects, tasks, milestones and progress reporting.
4. Product/material catalog, suppliers, purchase orders and stock movement workflows.
5. Quotations, invoices, payment records and project expenses.
6. Accounting journals, tax configuration and financial reports.
7. Employee master, attendance and payroll, with restricted HR/finance access.
8. E-commerce catalog, cart, orders, payment-provider integration and order fulfilment.

## Delivery and CI safeguards

- GitHub Actions now includes a static-site quality check for required Indonesian website sections, text/voice companion hooks, truthful prototype notices, and obvious credential/connection-string patterns.
- The Pages deployment workflow is restricted to the public website files (`index.html`, `management-prototype.html`, and optional `assets/`) rather than uploading the whole repository root.
- These workflow changes need a successful Actions run and a live URL smoke test before being marked released.

## Important limitations

- The prepared schema is a foundation, not a complete accounting, tax, payroll, inventory valuation or e-commerce implementation.
- No sample production customers, employee data, tax rates, credentials, payment integration or WhatsApp number are assumed.
- Quote/invoice totals and stock quantities must be calculated and reconciled in trusted server-side transactions before real use.
- Although the core schema is applied, authentication, authorization, server APIs and AI integrations are not yet configured or verified.
- Logo and gallery-image replacement is intentionally postponed due to the file-transfer quota constraint.


## Phase 2B — Construction Intelligence & Estimation (new core module)

See [CONSTRUCTION_AI_AGENTS.md](CONSTRUCTION_AI_AGENTS.md) for the full specification. FORMA ELAN is intended to handle a traceable workflow from drawing intake and AI design concepts through quantity take-off, BOQ, RAB/AHSP, material schedules and project cost control.

The specialist roles are Drawing Intake & Vision, Design Concept & Visualization, Quantity Surveyor, BOQ/RAB Cost Engineer, Buildability & Risk, Project Cost Control, and a permission-aware Orchestrator/Audit Agent. Arithmetic and money totals must be deterministic server-side calculations; AI proposes/labels inputs but does not become the calculation source of truth. Drawing-derived quantities need sheet references, formulas, units, assumptions, uncertainty flags and human review. No invented dimensions or market rates.

This is a specification, not an implemented feature. Initial implementation should be a deterministic MVP using synthetic/reference data, manual dimension entry, configurable price books and tested CSV/XLSX exports. Secure private document storage and server-side access controls must precede real customer uploads or project data. AI image generation and metered OCR/model calls require provider/licensing/privacy review and explicit owner approval where costs may occur.
