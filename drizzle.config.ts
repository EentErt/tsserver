import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "src/<path_to_schema>",
  out: "src/<path_to_generated_files>",
  dialect: "postgresql",
  dbCredentials: {
    url: "your_connection_string",
  },
});