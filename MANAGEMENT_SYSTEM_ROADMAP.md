# FORMA ELAN — Management System Roadmap

## Current verified state (2026-10-20)

- Public website: static Indonesian-language site deployed through GitHub Pages.
- Repository: https://github.com/akvisomr-eng/FORMA-ELAN
- Database: Neon project `curly-meadow-68675030`, database `neondb`, target branch `br-proud-sunset-b44taoa8`.
- Production schema was initially empty.
- The first database migration has been applied to the target branch and re-verified: 15 public tables are present. This establishes the data-model foundation only; it does not mean the application is production-ready.
- Authentication is not configured yet. Do not expose management data or connect browser code directly to unrestricted database credentials.

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

- Enable and test a real authentication provider.
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

## Important limitations

- The prepared schema is a foundation, not a complete accounting, tax, payroll, inventory valuation or e-commerce implementation.
- No sample production customers, employee data, tax rates, credentials, payment integration or WhatsApp number are assumed.
- Quote/invoice totals and stock quantities must be calculated and reconciled in trusted server-side transactions before real use.
- Although the core schema is applied, authentication, authorization, server APIs and AI integrations are not yet configured or verified.
- Logo and gallery-image replacement is intentionally postponed due to the file-transfer quota constraint.
