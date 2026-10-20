# FORMA ELAN API (secure foundation)

This API is designed for Neon Functions and uses the branch-injected `DATABASE_URL`, `NEON_AUTH_JWKS_URL`, and `NEON_AUTH_BASE_URL`. It never accepts a user ID from the request body as identity.

## Routes

- `GET /health`: non-sensitive service status only.
- `POST /v1/me/bootstrap`: validates the caller's Neon Auth JWT, loads the corresponding `neon_auth.user` record, and creates/updates only that caller's `user_profiles` row. It does not grant organization membership.
- `POST /v1/onboarding/workspace`: creates a first organization, active owner membership, and starter project for the authenticated profile. The request cannot supply a user ID. A per-subject advisory transaction lock prevents concurrent first-workspace requests from creating duplicate workspaces.
- `GET /v1/surveys?organizationId=<uuid>&projectId=<uuid>`: requires a valid Neon Auth JWT, a provisioned active `user_profiles` row whose `auth_subject` matches the token `sub`, and an active organization membership for the selected project.
- `POST /v1/surveys`: same authorization requirements; accepts project/organization IDs, survey code, client name, site address, notes, and a consent record. Status is always created as `draft`.

## Security boundaries

- JWT signature, issuer, and expiration are checked using Neon Auth JWKS.
- Database operations use parameterized SQL.
- Membership is checked on every read/write because the database owner can bypass table RLS.
- RLS is enabled on survey tables with no browser-facing policies. This function is the only planned application access path for now.
- Uploads, AI analysis, object storage, client-facing sharing, and automatic measurements remain disabled.
- A missing profile mapping fails closed with `profile_not_provisioned`; the authenticated bootstrap route can provision the caller from Neon Auth's own user row. Membership is still separately required.
- Do not deploy a public frontend pointing at this API until sign-up/sign-in, profile mapping, and authorization have passed end-to-end tests.

## Local checks

Run `node --test tests/backend-validation.test.mjs`. Runtime dependencies are listed in `package.json`.

## Deployment status

Source and configuration are committed to GitHub; the function has not yet been deployed. Deploying requires a successful bundle/build, Neon Function deployment, and authenticated integration tests, including the new workspace-onboarding route. Do not put database URLs, OAuth secrets, or API keys in GitHub or the browser.
