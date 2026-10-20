import { neon } from "@neondatabase/serverless";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { parseJsonBody, validateSurveyPayload } from "./validation.mjs";

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer"
  }
});

let sqlClient;
let jwks;
function getSql() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing");
  sqlClient ??= neon(process.env.DATABASE_URL);
  return sqlClient;
}
function getJwks() {
  if (!process.env.NEON_AUTH_JWKS_URL) throw new Error("NEON_AUTH_JWKS_URL missing");
  jwks ??= createRemoteJWKSet(new URL(process.env.NEON_AUTH_JWKS_URL));
  return jwks;
}
async function requireIdentity(request) {
  const auth = request.headers.get("authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  try {
    const issuer = process.env.NEON_AUTH_BASE_URL;
    if (!issuer) throw new Error("NEON_AUTH_BASE_URL missing");
    const { payload } = await jwtVerify(match[1], getJwks(), { issuer });
    if (typeof payload.sub !== "string" || payload.sub.length < 1) return null;
    return { subject: payload.sub };
  } catch {
    return null;
  }
}
async function resolveProfile(sql, subject) {
  const rows = await sql`SELECT id FROM public.user_profiles WHERE auth_subject = ${subject} AND is_active = true LIMIT 1`;
  return rows[0] ?? null;
}
async function hasProjectAccess(sql, userId, organizationId, projectId) {
  const rows = await sql`
    SELECT p.id
    FROM public.projects p
    JOIN public.organization_memberships m ON m.organization_id = p.organization_id
    WHERE p.id = ${projectId}::uuid
      AND p.organization_id = ${organizationId}::uuid
      AND m.user_id = ${userId}::uuid
      AND m.status = 'active'
    LIMIT 1
  `;
  return rows.length > 0;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") {
      return json({ service: "forma-elan-api", status: "ok", auth: "required-for-data", uploads: "disabled" });
    }
    if (url.pathname !== "/v1/surveys" || !["GET", "POST"].includes(request.method)) {
      return json({ error: "not_found" }, 404);
    }
    const identity = await requireIdentity(request);
    if (!identity) return json({ error: "unauthorized" }, 401);

    try {
      const sql = getSql();
      const profile = await resolveProfile(sql, identity.subject);
      if (!profile) return json({ error: "profile_not_provisioned" }, 403);

      if (request.method === "GET") {
        const projectId = url.searchParams.get("projectId") || "";
        const organizationId = url.searchParams.get("organizationId") || "";
        if (!projectId || !organizationId) return json({ error: "projectId_and_organizationId_required" }, 400);
        if (!await hasProjectAccess(sql, profile.id, organizationId, projectId)) {
          return json({ error: "forbidden" }, 403);
        }
        const rows = await sql`
          SELECT id, organization_id AS "organizationId", project_id AS "projectId",
                 survey_code AS "surveyCode", client_name AS "clientName",
                 surveyed_at AS "surveyedAt", site_address AS "siteAddress",
                 status, schema_version AS "schemaVersion", created_at AS "createdAt",
                 updated_at AS "updatedAt"
          FROM public.field_surveys
          WHERE organization_id = ${organizationId}::uuid AND project_id = ${projectId}::uuid
          ORDER BY surveyed_at DESC LIMIT 100
        `;
        return json({ data: rows });
      }

      const raw = await request.text();
      const parsed = parseJsonBody(raw);
      if (!parsed.ok) return json({ error: parsed.error }, parsed.error === "payload_too_large" ? 413 : 400);
      const validated = validateSurveyPayload(parsed.value);
      if (!validated.ok) return json({ error: validated.error }, 400);
      const value = validated.value;
      if (!await hasProjectAccess(sql, profile.id, value.organizationId, value.projectId)) {
        return json({ error: "forbidden" }, 403);
      }
      const inserted = await sql`
        INSERT INTO public.field_surveys
          (organization_id, project_id, survey_code, client_name, surveyor_user_id,
           site_address, notes, consent_record, schema_version, status)
        VALUES
          (${value.organizationId}::uuid, ${value.projectId}::uuid, ${value.surveyCode},
           ${value.clientName}, ${profile.id}::uuid, ${value.siteAddress}, ${value.notes},
           ${JSON.stringify(value.consentRecord)}::jsonb, ${value.schemaVersion}, 'draft')
        RETURNING id, organization_id AS "organizationId", project_id AS "projectId",
                  survey_code AS "surveyCode", status, created_at AS "createdAt"
      `;
      return json({ data: inserted[0] }, 201);
    } catch (error) {
      console.error("forma-api request failed", { name: error?.name || "Error" });
      return json({ error: "internal_error" }, 500);
    }
  }
};
