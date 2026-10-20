# FORMA ELAN — Construction Intelligence & Estimation Agents

Status: **specification / planned implementation**. This document defines the intended workflow; it is not evidence that drawing analysis, quantity take-off, pricing, or document export is already operational.

## Product goal

Provide a construction-focused AI workspace that helps the team move from drawings and site evidence to a reviewable quantity take-off, BOQ, RAB, material schedule, and project cost control. The website AI Companion can hand off a construction task to these specialist agents after the user chooses the task and uploads the relevant files.

## User workflow

1. **Create a project** — project type, location, floor count, area, units, scope, design stage, estimate date, pricing basis, and responsible reviewer.
2. **Upload source files** — PDF drawings, image scans/photos, schedules, written specifications, and (later, only with a tested parser) CAD/BIM exports. Record filename, revision, date, sheet number, scale, and source.
3. **Check drawing quality** — identify pages/sheets, rotation, scale and dimension strings where legible. Ask for calibration dimensions when scale cannot be trusted. Flag low-resolution, conflicting, missing, or unreadable details.
4. **Build a drawing register and take-off** — extracted measurements must retain a reference to the source sheet, region/mark, formula, unit, and confidence/verification status. Users can correct measurements and rerun affected calculations.
5. **Generate design concepts when requested** — image-generation outputs are concepts for discussion, clearly marked “visual concept — not a construction/structural drawing”. Never silently substitute AI concept imagery for issued-for-construction documents.
6. **Calculate quantities** — apply named, versioned formulas and explicit assumptions. Separate measured quantities from allowances, provisional sums, waste factors, and user overrides.
7. **Price the BOQ/RAB** — use a dated, location-specific price library and approved analysis coefficients. Every rate must state its source/date, unit, labour/material/equipment components and whether tax/overhead/margin are included.
8. **Review and export** — reviewer resolves warnings, approves quantities/rates, then exports the approved revision. Preserve version history and who approved it.
9. **Track actuals** — compare approved BOQ with purchases, stock issues, work progress, change orders, and actual costs; flag variances without changing the approved baseline automatically.

## Specialist agents

### 1. Drawing Intake & Vision Agent
- Reads uploaded drawing sheets/images, creates a drawing register, detects visible labels/dimensions and proposes room/element classifications.
- Detects revision differences when source files support comparison.
- Outputs evidence-linked observations, not unqualified facts.
- Must label unreadable or ambiguous measurements and request human input rather than inventing them.

### 2. Design Concept & Visualization Agent
- Generates optional interior/exterior mood boards and concept images based on approved brief, style, material and constraints.
- Records prompt, source brief, output version and changes.
- All generated images carry a visible concept label; dimensions, code compliance and constructability need separate professional review.

### 3. Quantity Surveyor / Quantity Take-off Agent
- Organizes work breakdown structure (WBS) by trade, floor, zone and element.
- Supports configured measurement rules for earthworks, concrete, reinforcement, masonry, plaster, flooring, ceiling, painting, roofing, doors/windows and MEP when sufficient information exists.
- Shows calculation trace: source dimensions, formula, deductions, units, conversion, waste/allowance, result and reviewer status.
- Does not infer hidden structure or MEP routes as confirmed quantities without drawings/specification or explicit assumptions.

### 4. BOQ & RAB / Cost Engineer Agent
- Produces BOQ (descriptions, units, quantities) and RAB with unit rates and subtotals.
- Supports project-specific AHSP/coefficient libraries, labour, materials, equipment, wastage, overhead, profit, contingency, tax and rounding rules as configurable inputs.
- Keeps direct cost, indirect cost, tax and margin separated; prevents double-counting.
- Uses Indonesian Rupiah by default, but does not hard-code a universal price list or tax rate. Rates must be supplied/imported and timestamped for the project's location.
- Can produce material requirement schedules and quote requests to suppliers; no purchase/order or customer quote is sent without explicit confirmation.

### 5. Buildability, Compliance & Risk Agent
- Checks for missing sheets/specifications, inconsistent dimensions, duplicated line items, implausible units, scope gaps, quantity outliers and price anomalies.
- Produces a review checklist and risk register.
- Does not certify structural safety, building-code compliance, engineering adequacy or permit readiness. Those require qualified professionals and applicable local requirements.

### 6. Project Cost Control Agent
- Compares approved baseline vs revised estimates, purchase orders, inventory movements, progress and actual expenses.
- Explains cost/schedule variance and flags change orders for approval.
- Never overwrites an approved baseline or approves expenditure by itself.

### 7. Orchestrator & Audit Agent
- Routes a task to the smallest relevant specialist agents, shares only the minimum authorized project context, and combines outputs with citations to source sheets/rate libraries.
- Treats uploaded files and drawing annotations as untrusted data, not instructions to override system policy.
- Records agent/model version, source document revisions, assumptions, calculation versions, tool calls and human approvals.

## Required output pack

- Drawing register and list of missing/unclear information.
- Quantity take-off (QTO) with formulas and sheet/region references.
- BOQ grouped by work package, floor/zone and trade.
- RAB summary and detailed line items.
- AHSP / unit-price breakdown for each applicable work item.
- Material and labour requirement schedule.
- Assumptions, exclusions, provisional items, risks and unanswered RFIs.
- Revision comparison and approval/sign-off page.
- Export target: CSV/XLSX first; PDF report after formatting and numeric validation are tested.

## Core calculation rules

- Store canonical quantities and prices as decimal numeric values with explicit units; avoid binary floating-point for money totals.
- Use deterministic server-side calculations for arithmetic. The model may propose inputs and explain results, but must not be the source of truth for sums.
- Validate dimensional units and conversion factors. Keep formula, rounded display value and unrounded calculation value separate.
- Every line item must have an ID, work package, description, unit, quantity, rate, amount, source/assumption, status and revision.
- Subtotal = sum of approved line amounts. Grand total follows the project's configured cost build-up order; show each applied percentage and base clearly.
- Do not present a single precise total while material inputs are unresolved. Show ranges/scenarios or mark the estimate **provisional**.
- Quantity confidence and cost confidence are separate. A precise supplier price does not fix uncertain quantities.

## Data model additions to plan

Keep existing organization, project, product, inventory, quote, invoice and audit tables as the foundation. Design a reviewed migration for dedicated tables such as:
- `project_documents`: project, storage key, filename, MIME type, checksum, revision, sheet metadata, uploader and access policy.
- `drawing_sheets`: document, sheet number/title, scale/calibration, page dimensions and review status.
- `takeoff_items`: work item, location/zone, quantity, unit, formula JSON/version, source-sheet references, confidence, assumptions and approval status.
- `price_books` and `price_book_items`: geography, effective date, supplier/source, unit, components, currency and evidence.
- `estimate_revisions`, `estimate_items`, `estimate_approvals`: immutable versions, snapshots, approver and timestamps.
- `agent_runs`: task type, model/provider, token/cost metadata if available, source references, outcome, errors and retention.
- `change_orders` and `project_actuals`: approved scope changes and actual costs/quantities.
Do not apply a new migration until schema design, organization isolation, file access controls, retention and rollback have been reviewed.

## Security, privacy and cost controls

- Store uploads in private object storage, not in the public GitHub Pages bundle. Use expiring signed links and enforce organization/project permissions server-side.
- Validate file types, sizes and page counts; scan files where feasible; protect against malicious PDFs, prompt injection in drawings and excessive upload/processing costs.
- Never expose database credentials or AI-provider keys in browser code. The static GitHub Pages frontend cannot safely hold secrets or enforce private access by itself.
- Use mock files and deterministic sample calculations until authenticated backend endpoints, private storage and authorization tests exist.
- No paid AI/image-generation/OCR/CAD service or metered deployment without owner approval. Use local/free-tier or manual fallback where feasible and show limits.
- Rate-limit uploads and model calls; set per-user/project budgets; log failures; provide a non-AI manual entry path.

## Acceptance tests before commercial use

1. Known sample drawing: extracted dimensions are traceable to sheet/region; ambiguous data is flagged.
2. Quantity calculation fixtures cover zero, negative, missing, fractional and unit-conversion cases.
3. A small reference project reproduces independently verified BOQ/RAB totals within the documented rounding policy.
4. Duplicate items, missing specifications, inconsistent scales and drawing revisions produce warnings.
5. Price book dates/locations are visible; missing rates never silently become zero or fabricated market prices.
6. Uploads, documents, take-offs and estimates are isolated across organizations and roles; direct unauthorized requests fail.
7. Approval is required before quote issuance, purchases, baseline changes or external sharing.
8. Exported CSV/XLSX/PDF totals reconcile to the approved internal estimate.
9. Provider outage, exhausted quota and unsupported file formats return safe, actionable fallback messages.
10. A qualified construction professional reviews measurement rules, AHSP assumptions, local regulations and sample outputs.

## Implementation sequence

**Stage A — deterministic MVP:** project setup, manual dimensions, work-item catalogue, editable take-off table, configurable price book, calculation engine, RAB/BOQ export and audit trail using synthetic data.

**Stage B — secure file workflow:** private storage, authentication/authorization, PDF/image intake, drawing register and user-verified dimension extraction.

**Stage C — scoped AI agents:** vision/OCR adapter, design concept adapter, QTO assistant, cost engineer, risk checker and orchestrator with provider-independent interfaces and strict budgets.

**Stage D — production assurance:** reference-project benchmarking, security/privacy tests, reviewer approval, operational monitoring, backups and customer-facing documentation.

**Current implementation status:** specification only. Do not describe any of these specialist agents or calculation workflows as implemented until code, tests and a live end-to-end run provide evidence.
