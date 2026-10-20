import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  functions: {
    formaapi: {
      name: "FORMA ELAN secure survey API",
      source: "backend/src/index.mjs",
      env: {
        NEON_AUTH_JWKS_URL: "https://ep-jolly-water-b44zew0e.neonauth.c-6.us-east-2.aws.neon.tech/neondb/auth/.well-known/jwks.json",
        NEON_AUTH_BASE_URL: "https://ep-jolly-water-b44zew0e.neonauth.c-6.us-east-2.aws.neon.tech/neondb/auth",
      },
    },
  },
});
