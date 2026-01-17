import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Only create db connection if DATABASE_URL is set (for production/database mode)
// In memory storage mode, this won't be used
export const pool = process.env.DATABASE_URL 
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

export const db = pool 
  ? drizzle(pool, { schema })
  : null as any; // Type assertion for when db is not used (memory storage mode)
