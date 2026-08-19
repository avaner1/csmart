import { Pool } from "pg";
import fs from "fs";
import path from "path";

let initialized = false;

function getPoolConfig() {
  const connectionString = process.env.DATABASE_URL ?? "";
  const poolConfig: Record<string, unknown> = {};

  const hostMatch = connectionString.match(/[?&]host=([^&]+)/);
  if (hostMatch && hostMatch[1].startsWith("/cloudsql")) {
    const url = new URL(connectionString.replace(/\?host=.*$/, ""));
    poolConfig.user = url.username;
    poolConfig.password = url.password;
    poolConfig.database = url.pathname.slice(1);
    poolConfig.host = hostMatch[1];
  } else {
    poolConfig.connectionString = connectionString;
    if (connectionString.includes("sslmode=require") || connectionString.includes("neon.tech")) {
      poolConfig.ssl = { rejectUnauthorized: false };
    }
  }

  return poolConfig;
}

export async function ensureDbSetup() {
  if (initialized) return;

  try {
    const pool = new Pool(getPoolConfig());
    const client = await pool.connect();

    try {
      const sqlPath = path.join(process.cwd(), "prisma/setup.sql");
      if (fs.existsSync(sqlPath)) {
        const sql = fs.readFileSync(sqlPath, "utf-8");
        // Split into individual statements and run each separately
        const statements = sql
          .split(";")
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && !s.startsWith("--"));

        for (const stmt of statements) {
          try {
            await client.query(stmt);
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            // Ignore "already exists" errors
            if (!msg.includes("already exists") && !msg.includes("duplicate")) {
              console.warn("DB setup statement warning:", msg.slice(0, 100));
            }
          }
        }
        console.log("Database schema synced.");
      }
    } finally {
      client.release();
      await pool.end();
    }

    initialized = true;
  } catch (e) {
    console.error("DB setup error:", e);
    initialized = true;
  }
}
