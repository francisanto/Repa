import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Replit provides DATABASE_URL automatically when database is provisioned
// For local dev, use memory storage if DATABASE_URL is not set
const databaseUrl = process.env.DATABASE_URL || process.env.REPLIT_DATABASE_URL;

export const pool = databaseUrl
  ? new Pool({ connectionString: databaseUrl })
  : null;

export const db = pool 
  ? drizzle(pool, { schema })
  : null as any; // Type assertion for when db is not used (memory storage mode)

if (pool) {
  console.log("✅ Connected to PostgreSQL database");
} else {
  console.log("⚠️  Running in memory storage mode (no DATABASE_URL set)");
}
