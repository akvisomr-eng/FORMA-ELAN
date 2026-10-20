# FORMA ELAN — Field Survey, Vision & Interior Proposal Pipeline

Status: **workflow specification + browser-only field-survey preview**. The page at `field-survey.html` collects one room's survey metadata and can export a versioned JSON record. It previews selected images locally only. It does not upload images, call an AI model, store records in Neon, or create renders / BOQ / RAB automatically.

## Product goal

A field officer uses an Android phone to photograph a room and upload sketches or plans. A server-side, permission-checked workflow analyzes the evidence, asks for missing dimensions, creates clearly labelled interior concept options, then derives traceable quantity take-offs and draft BOQ/RAB. The client receives a proposal only after staff review.

## End-to-end lifecycle

1. **Create project and survey** — organization, client, project, room, surveyor, date, consent/purpose and room labels.
2. **Capture evidence** — several room views, close-ups, hand sketch, plans, opening dimensions, measured length/width/height, utility constraints and notes. Each media asset gets a stable ID, capture timestamp, room ID, checksum, uploader and provenance.
3. **Private upload** — authenticated API issues a short-lived upload URL for a private object-storage bucket. Validate membership and project access server-side; allow-list MIME types; verify file signatures; impose file/size/rate limits; generate random object keys; strip EXIF/GPS by default; scan files where feasible; never expose public bucket URLs. No image payloads in logs.
4. **Vision analysis** — classify image as room photo, sketch, plan, elevation or reference; identify likely walls/openings/visible objects and OCR dimension annotations. Return confidence, evidence references, assumptions, and a list of ambiguities. Do not silently turn perspective pixels into reliable metric measurements.
5. **Measurement reconciliation** — compare model-extracted dimensions against manually measured values and drawing scale. Human-measured dimensions take precedence when recorded as verified. Request a re-measurement for missing critical dimensions or contradictory evidence.
6. **Design brief and concepts** — compile room dimensions, fixed constraints, client needs, preferred style, material preferences and budget. Generate two or three illustrative options using a permitted image model. Label them “visual concept / not construction documentation”; do not claim generated furniture or finishes fit unless dimensions have been checked.
7. **Design-to-quantity mapping** — convert the approved concept/specification into explicit work items and measurement formulas. Vision may suggest candidates; it cannot approve quantities on its own. Store links from every quantity to a room, drawing/photo, measurement, formula and revision.
8. **BOQ and RAB** — compute quantities deterministically from verified dimensions, approved waste factors and explicit rules; price from a dated, location-specific rate book with source and unit. Separate materials, labour, equipment, overhead, profit, contingency and applicable tax. Missing price or quantity means “needs input”, not an invented value.
9. **Review and revision** — show design image, room measurements, assumptions, quantity take-off, price provenance and warnings side by side. Record staff corrections and approvals. Every design or measurement change invalidates affected calculations and creates a new revision.
10. **Client proposal** — generate a PDF/web proposal with dated revision, concept renders, scope/exclusions, BOQ/RAB summary, payment terms entered by staff and approval status. No automatic binding quote until authorized.

## Proposed specialist agents

| Agent | Responsibility | Must not do |
|---|---|---|
| Survey Intake Agent | Validate fields, room identity, media metadata and missing inputs | Infer unknown measurements as facts |
| Vision & OCR Agent | Classify media, extract visible features and dimension text, cite image regions | Claim calibrated dimensions from ordinary perspective photos |
| Measurement Reconciliation Agent | Compare sketch, scale, field measurements and contradictions | Overwrite a verified measurement silently |
| Interior Concept Agent | Draft design briefs, styles, materials and render prompts | Present illustrative AI renders as technical drawings |
| Design/Scope Agent | Map approved design choices to explicit scope and assemblies | Assume concealed structure or utilities are known |
| Quantity Surveyor Agent | Suggest take-off items and formulas with evidence links | Publish quantities without formula and source |
| Cost/RAB Agent | Apply approved unit rates, waste, overhead, profit and tax settings | Fabricate local prices or current tax treatment |
| Buildability/Risk Agent | Flag access, moisture, utilities, structural and compliance questions | Certify engineering safety |
| Orchestrator/Audit Agent | Enforce prerequisites, revisions, approvals, logs and handoffs | Skip required human review |

The first production version should use deterministic workflow/state transitions around these agents. An LLM must not be the source of truth for arithmetic, permissions, project IDs or approval state.

## Data contract (proposed API, not deployed)

- `POST /api/v1/projects/{projectId}/surveys` — create survey record with schema version and room list.
- `POST /api/v1/surveys/{surveyId}/media-upload-intents` — authorize upload only after project membership check; return short-lived signed URL and opaque media ID.
- `POST /api/v1/surveys/{surveyId}/analysis-jobs` — enqueue an idempotent analysis job referring to stored media IDs, never client-supplied arbitrary URLs.
- `GET /api/v1/jobs/{jobId}` — status, safe progress, warnings and review-required state.
- `POST /api/v1/surveys/{surveyId}/measurements` — save dimensions, unit, source, confidence, verification status, author and revision.
- `POST /api/v1/design-options` — create concept job from an approved brief; store output privately.
- `POST /api/v1/estimates` — calculate deterministic estimate from approved quantity items and versioned rate book.
- `POST /api/v1/estimates/{estimateId}/approvals` — authorized staff approval with revision and audit trail.

Every route requires authentication, organization-scoped authorization, input validation, rate limits, request-size limits and audit events. Never trust `organization_id`, role, cost or approval state supplied by the browser. Use server-side authorization on every object read/write. Do not ship database credentials or AI-provider keys to GitHub Pages.

## Minimum records

- `projects`, `surveys`, `survey_rooms`, `survey_media`, `measurements`
- `vision_analysis_runs`, `design_briefs`, `design_options`
- `work_items`, `quantity_takeoffs`, `rate_book_versions`, `rate_book_items`
- `estimates`, `estimate_items`, `approvals`, `audit_events`

Use immutable revision identifiers and organization ownership. Before schema changes, reconcile this proposed domain model with existing Neon tables; do not blindly create duplicate project, customer, quote, or audit tables.

## Confidence and approval rules

- Every extracted measurement includes unit, value, source media/region, method, confidence and status: `unverified`, `verified`, or `rejected`.
- A low-confidence or contradictory dimension is a blocking question for affected quantities.
- The image model can describe visible finishes and objects, but hidden layers, structure, wiring and plumbing require inspection or documentation.
- Any quantity formula must be inspectable and deterministically reproducible.
- Every unit price records currency, region, effective date, unit, source and reviewer.
- AI-generated concepts and cost estimates remain drafts until an authorized person approves them.
- A human professional must assess structural changes, electrical/plumbing safety, local code and specialist trade requirements.

## Cost-safe implementation sequence

1. Complete and test the mobile survey UX and JSON schema.
2. Implement authentication and organization/project authorization for server APIs.
3. Add private file storage and signed uploads; test unauthorized access and file validation.
4. Add job queue/status and deterministic JSON schema validation.
5. Connect a vision provider only after checking current pricing, retention, privacy, permitted commercial use and a no-cost test budget. Keep keys server-side.
6. Add design-image generation as a separate optional job, with per-project consent, quotas and cost ceilings.
7. Connect verified take-offs to the existing deterministic estimator and versioned rate book.
8. Run test fixtures for rotated/blurred sketches, conflicting dimensions, missing scale, duplicate uploads, prompt injection in uploaded documents, cross-organization access, interrupted mobile connectivity, and export accuracy.
9. Only then enable controlled pilot access; verify CI and public deployment smoke tests before announcing availability.

## Current boundary

The static survey page is a workflow prototype only. Selected images are not uploaded or embedded in the JSON export. The server API, private storage, authentication gate, image analysis, render generation and automatic take-off pipeline are not implemented by this document. Do not use this prototype to store confidential client surveys or represent it as a production survey system.
