import test from "node:test";
import assert from "node:assert/strict";
import { parseJsonBody, validateSurveyPayload, validateWorkspacePayload } from "../backend/src/validation.mjs";

const valid = {
  projectId: "7f9f8a20-6d33-4d70-8d85-6d2b0f17c2f2",
  organizationId: "7f9f8a20-6d33-4d70-8d85-6d2b0f17c2f2",
  surveyCode: "SURVEY-001",
  clientName: "Klien",
  consentRecord: { granted: true }
};

test("parses a JSON object", () => {
  assert.deepEqual(parseJsonBody('{"ok":true}'), { ok: true, value: { ok: true } });
});
test("rejects malformed JSON and arrays", () => {
  assert.equal(parseJsonBody("{").error, "invalid_json");
  assert.equal(parseJsonBody("[]").error, "invalid_json_object");
});
test("rejects oversized bodies", () => {
  assert.equal(parseJsonBody("x".repeat(30), 10).error, "payload_too_large");
});
test("accepts valid survey payload and pins schema version", () => {
  const result = validateSurveyPayload(valid);
  assert.equal(result.ok, true);
  assert.equal(result.value.schemaVersion, "forma-elan-field-survey.v1");
  assert.equal(result.value.surveyCode, "SURVEY-001");
});
test("rejects invalid identifiers, unsafe survey codes, and oversized notes", () => {
  assert.equal(validateSurveyPayload({ ...valid, projectId: "not-a-uuid" }).ok, false);
  assert.equal(validateSurveyPayload({ ...valid, surveyCode: "bad code" }).ok, false);
  assert.equal(validateSurveyPayload({ ...valid, notes: "n".repeat(2001) }).ok, false);
});
test("rejects invalid status and non-object consent", () => {
  assert.equal(validateSurveyPayload({ ...valid, status: "published" }).ok, false);
  assert.equal(validateSurveyPayload({ ...valid, consentRecord: [] }).ok, false);
});


test("accepts a bounded workspace onboarding payload", () => {
  const result = validateWorkspacePayload({
    organizationName: "Forma Elan Studio",
    projectName: "Renovasi Rumah",
    serviceType: "Interior Design",
    siteAddress: "Surabaya"
  });
  assert.equal(result.ok, true);
  assert.equal(result.value.organizationName, "Forma Elan Studio");
});
test("rejects missing or oversized workspace names", () => {
  assert.equal(validateWorkspacePayload({ organizationName: "", projectName: "Project" }).ok, false);
  assert.equal(validateWorkspacePayload({ organizationName: "A", projectName: "x".repeat(161) }).ok, false);
});
