import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  auth: true,
  functions: {
    formaapi: {
      name: "FORMA ELAN secure survey API",
      source: "backend/src/index.mjs",
    },
  },
});
