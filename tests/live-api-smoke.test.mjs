import test from "node:test";
import assert from "node:assert/strict";

const baseUrl = (process.env.FORMA_API_URL || "https://br-proud-sunset-b44taoa8-formaapi.compute.c-6.us-east-2.aws.neon.tech").replace(/\/$/, "");
const allowedOrigin = "https://akvisomr-eng.github.io";

async function request(path, options = {}) {
  return fetch(new URL(path, baseUrl), {
    redirect: "manual",
    ...options,
    headers: { ...(options.headers || {}) }
  });
}

test("live API health endpoint is available and advertises disabled uploads", async () => {
  const response = await request("/health", { headers: { origin: allowedOrigin } });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), allowedOrigin);
  const body = await response.json();
  assert.equal(body.service, "forma-elan-api");
  assert.equal(body.status, "ok");
  assert.equal(body.auth, "required-for-data");
  assert.equal(body.uploads, "disabled");
});

test("bootstrap rejects requests without a bearer token", async () => {
  const response = await request("/v1/me/bootstrap", {
    method: "POST",
    headers: { origin: allowedOrigin, "content-type": "application/json" },
    body: "{}"
  });
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "unauthorized" });
});

test("bootstrap rejects a malformed bearer token", async () => {
  const response = await request("/v1/me/bootstrap", {
    method: "POST",
    headers: {
      origin: allowedOrigin,
      authorization: "Bearer definitely-not-a-jwt",
      "content-type": "application/json"
    },
    body: "{}"
  });
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "unauthorized" });
});

test("browser origin outside the allowlist is rejected", async () => {
  const response = await request("/health", { headers: { origin: "https://example.invalid" } });
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: "origin_not_allowed" });
});

test("unimplemented upload endpoint stays unavailable", async () => {
  const response = await request("/v1/uploads", {
    method: "POST",
    headers: { origin: allowedOrigin, "content-type": "application/json" },
    body: "{}"
  });
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "not_found" });
});
