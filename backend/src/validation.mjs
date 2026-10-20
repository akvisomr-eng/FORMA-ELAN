export const MAX_JSON_BYTES = 64 * 1024;
export const ALLOWED_SURVEY_STATUSES = new Set([
  "draft", "submitted", "analysis_pending", "in_review", "approved", "archived"
]);

export function parseJsonBody(raw, maxBytes = MAX_JSON_BYTES) {
  if (typeof raw !== "string" || Buffer.byteLength(raw, "utf8") > maxBytes) {
    return { ok: false, error: "payload_too_large" };
  }
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return { ok: false, error: "invalid_json_object" };
    }
    return { ok: true, value };
  } catch {
    return { ok: false, error: "invalid_json" };
  }
}

export function validateSurveyPayload(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: "invalid_payload" };
  }
  const surveyCode = typeof input.surveyCode === "string" ? input.surveyCode.trim() : "";
  const projectId = typeof input.projectId === "string" ? input.projectId : "";
  const organizationId = typeof input.organizationId === "string" ? input.organizationId : "";
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuid.test(projectId) || !uuid.test(organizationId)) {
    return { ok: false, error: "invalid_project_or_organization_id" };
  }
  if (!surveyCode || surveyCode.length > 80 || !/^[\p{L}\p{N}._/-]+$/u.test(surveyCode)) {
    return { ok: false, error: "invalid_survey_code" };
  }
  const clientName = input.clientName == null ? null : String(input.clientName).trim();
  const siteAddress = input.siteAddress == null ? null : String(input.siteAddress).trim();
  const notes = input.notes == null ? null : String(input.notes).trim();
  if ([clientName, siteAddress, notes].some(v => v !== null && v.length > 2000)) {
    return { ok: false, error: "field_too_long" };
  }
  if (input.status !== undefined && !ALLOWED_SURVEY_STATUSES.has(input.status)) {
    return { ok: false, error: "invalid_status" };
  }
  if (input.consentRecord !== undefined &&
      (!input.consentRecord || typeof input.consentRecord !== "object" || Array.isArray(input.consentRecord))) {
    return { ok: false, error: "invalid_consent_record" };
  }
  return {
    ok: true,
    value: {
      projectId,
      organizationId,
      surveyCode,
      clientName,
      siteAddress,
      notes,
      consentRecord: input.consentRecord ?? {},
      schemaVersion: "forma-elan-field-survey.v1"
    }
  };
}
