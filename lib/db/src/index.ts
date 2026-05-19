import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";
import dotenv from "dotenv";
import path from "path";

// Load .env from workspace root if not already loaded
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set in environment variables");
}

const client = postgres(connectionString || "");
export const db = drizzle(client, { schema });

export * from "./schema/index.js";
