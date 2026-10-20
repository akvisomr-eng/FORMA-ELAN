# FORMA ELAN — Commercial Launch Checklist

Last updated: 2026-10-20

This checklist distinguishes committed code, configured services, tested flows, and public release. Do not mark an item complete without evidence.

## Verified during this work

- [x] Initial Neon schema migration applied to target branch `production` (`br-proud-sunset-b44taoa8`) and 15 public tables re-checked.
- [x] Neon Managed Auth (Better Auth) provisioned on the target branch.
- [x] GitHub Pages trusted origin registered for `https://akvisomr-eng.github.io`.
- [x] Public website contains an Indonesian text companion and browser speech hooks for voice input/output.
- [x] Companion states that its answers are local FAQ preview and are not yet connected to generative AI or business data.
- [x] Management dashboard labels itself as a prototype/demo.
- [x] GitHub Actions static-site checks added.
- [x] GitHub Pages deployment now packages only `index.html`, `management-prototype.html`, and optional `assets/`, rather than the whole repository root.

## Must pass before accepting real customers or internal business records

### Release / website
- [ ] Latest quality-check workflow completes successfully.
- [ ] Latest Pages deployment completes successfully. The workflow now runs automated post-deploy smoke tests against the homepage and management prototype, but a successful run is not yet verified.
- [ ] Verify live homepage, mobile layout, all nav links, consultation form, and companion on desktop and Android.
- [ ] Verify speech recognition support/permission errors and Indonesian speech quality; text must remain available when voice is unsupported.
- [ ] Replace the reference gallery with approved real project images and verify all claims/portfolio captions.

### Identity and authorization
- [ ] Implement and test sign-up, sign-in, sign-out, session restore, password reset, and error/loading states using Neon Auth.
- [ ] Configure production email delivery/branding and decide whether email verification is required. Shared SMTP is a setup default, not the final production mail setup.
- [ ] Restrict who can create internal accounts; public visitors must not gain management access just by signing up.
- [ ] Enforce role-based authorization and organization isolation in trusted server-side handlers, not only in the UI.
- [ ] Verify direct unauthenticated requests to protected APIs return 401/403.
- [ ] Add server-side validation, rate limits, abuse controls, and audit records.

### Multi-agent AI and companion
- [x] Commit the first deterministic construction estimate engine and a browser-only manual-entry RAB/BOQ preview. This is a calculation foundation only, not automatic drawing analysis or a production estimator.
- [ ] Verify the new calculation test suite passes in GitHub Actions and the deployed estimator page passes its live smoke test.
- [ ] Implement the construction-specialist workflow specified in [CONSTRUCTION_AI_AGENTS.md](CONSTRUCTION_AI_AGENTS.md): drawing intake/vision, concept visualization, quantity take-off, BOQ/RAB/AHSP, buildability/risk, and project cost control.
- [ ] Build deterministic quantity/cost calculations, source-linked measurements, versioned local price books, uncertainty flags, reviewer approval, and reconciled exports before calling estimates production-grade.
- [ ] Add private document storage and organization/project-level authorization before enabling real drawing uploads; use synthetic data for early tests.
- [ ] Choose a provider and verify current free-tier quotas, privacy, model availability, rate limits, and fallback before enabling generative calls.
- [ ] Store provider credentials only as server-side secrets; never in static HTML or browser JavaScript.
- [ ] Implement coordinator plus scoped agents for public FAQ/sales, project planning, inventory, quotes/invoices, and management reporting.
- [ ] Require human confirmation for external messages and consequential writes (quote, invoice, expense approval, stock, project status, payroll).
- [ ] Test prompt injection, data leakage, cross-organization access, tool permission boundaries, model failure, and budget limits.
- [ ] Test speech-to-text and text-to-speech quality in Indonesian across supported browsers and devices.

### Business operations
- [ ] Complete customer/lead capture API and verify duplicate handling and spam controls.
- [ ] Add suppliers, purchase orders, payments, accounting journals, tax configuration, and reconciliation only after workflows are defined.
- [ ] Implement stock movements and quote/invoice totals in trusted transactions; do not trust browser-submitted totals.
- [ ] Implement employee/attendance/payroll only with restricted HR/finance permissions and locally reviewed calculations.
- [ ] Add privacy notice, terms, data-retention policy, backup/restore procedure, incident contact, and support process.
- [ ] Confirm pricing, invoicing, tax treatment, domain/brand ownership, and customer-support arrangements with the owner.

## Cost policy

- Keep GitHub Pages and existing Neon free-tier usage as the default path.
- Do not buy plans, enable paid add-ons, or invoke metered model APIs without explicit owner approval.
- Free-tier quotas and product terms can change; re-check before public commercial traffic.
- Never claim the project is commercially production-ready while any critical security, AI, or operational gate above remains unchecked.

## Current status

The public static site and the database/auth foundation are present. The website's companion is still a local FAQ/voice preview; the management UI is a mock prototype; and the new RAB/BOQ page is a browser-only preview using manually entered data. Its test suite is committed but not yet verified as passing in CI. Authentication flows, protected APIs, drawing analysis, design image generation, generative multi-agent orchestration, end-to-end tests, and live release smoke tests remain unverified. This is a development/prelaunch state, not yet a complete commercial release.
