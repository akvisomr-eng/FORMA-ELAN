# FORMA ELAN — Management System Roadmap

## Current verified state (2026-10-20)

- Public website: static Indonesian-language site deployed through GitHub Pages.
- Repository: https://github.com/akvisomr-eng/FORMA-ELAN
- Database: Neon project `curly-meadow-68675030`, database `neondb`, target branch `br-proud-sunset-b44taoa8`.
- Production schema was initially empty.
- A first database migration has been prepared on a temporary Neon branch and verified there. It has **not** been applied to the target branch.
- Authentication is not configured yet. Do not expose management data or connect browser code directly to unrestricted database credentials.

## Phase 1 — Core business data model

Prepared schema: 15 tables, 33 indexes, 35 foreign keys, verified on temporary branch.

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

## Phase 2 — Security before real data

- Enable and test a real authentication provider.
- Enforce organization isolation and role-based authorization in a trusted server/API layer.
- Never put database connection strings or privileged credentials in frontend JavaScript.
- Add server-side validation, rate limiting, input validation, safe error handling and audit logging.
- Add row-level protections only after the selected authentication/authorization model is designed and tested.
- Use fake/test records until authorization tests pass.

## Phase 3 — Build the management interface and APIs

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
- The migration must be explicitly approved before it is applied to the target Neon branch.
- Logo and gallery-image replacement is intentionally postponed due to the file-transfer quota constraint.
