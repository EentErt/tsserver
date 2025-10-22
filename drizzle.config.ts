import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "src/db/schemas",
  out: "src/db",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgres://postgres:postgres@localhost:5432/chirpy?sslmode=disable",
  },
});