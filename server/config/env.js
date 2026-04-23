import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../../.env");

// Load .env ONLY if it exists (local dev)
const result = dotenv.config({ path: envPath });

// Merge: env vars take priority over .env
const config = {
  ...result.parsed,   // values from .env (may be undefined)
  ...process.env     // overrides with actual environment (Render)
};

export default config;