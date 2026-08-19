import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function setup() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log("No DATABASE_URL — skipping DB setup");
    return;
  }

  console.log("Running database setup...");

  // Parse Cloud SQL socket format
  const poolConfig = {};
  const hostMatch = dbUrl.match(/[?&]host=([^&]+)/);
  if (hostMatch && hostMatch[1].startsWith("/cloudsql")) {
    const url = new URL(dbUrl.replace(/\?host=.*$/, ""));
    poolConfig.user = url.username;
    poolConfig.password = url.password;
    poolConfig.database = url.pathname.slice(1);
    poolConfig.host = hostMatch[1];
  } else {
    poolConfig.connectionString = dbUrl;
    if (dbUrl.includes("sslmode=require") || dbUrl.includes("neon.tech")) {
      poolConfig.ssl = { rejectUnauthorized: false };
    }
  }

  const pool = new pg.Pool(poolConfig);
  const client = await pool.connect();

  try {
    // Run schema setup
    const sql = fs.readFileSync(path.join(__dirname, "../prisma/setup.sql"), "utf-8");
    await client.query(sql);
    console.log("Schema setup complete.");

    // Check if roster data exists
    const rosterCount = await client.query('SELECT COUNT(*) FROM "CsmRoster"');
    if (parseInt(rosterCount.rows[0].count) === 0) {
      console.log("Seeding roster data...");

      const rosterPath = path.join(__dirname, "../prisma/data/roster.json");
      const accountsPath = path.join(__dirname, "../prisma/data/accounts.json");

      if (fs.existsSync(rosterPath) && fs.existsSync(accountsPath)) {
        const roster = JSON.parse(fs.readFileSync(rosterPath, "utf-8"));
        const accounts = JSON.parse(fs.readFileSync(accountsPath, "utf-8"));

        const rosterQuery = `INSERT INTO "CsmRoster" (id, "csmName", email, manager, rho, region, level, status, title, location, team, cp, "photoUrl", notes, "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()) RETURNING id, "csmName"`;

        const rosterIdMap = new Map();
        for (const r of roster) {
          const res = await client.query(rosterQuery, [
            r.csmName || "", r.email || "", r.manager || "", r.rho || "",
            r.region || "", r.level || "CSM", r.status || "Active",
            r.title || "", r.location || "", r.team || "", r.cp || "",
            r.photoUrl || null, r.notes || null,
          ]);
          rosterIdMap.set(r.csmName, res.rows[0].id);
        }
        console.log(`${roster.length} roster entries seeded.`);

        const accountQuery = `INSERT INTO "CsmAccount" (id, "csmName", "corporateBrand", cp, "rosterId", "createdAt")
          VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())`;

        let seeded = 0;
        for (const a of accounts) {
          if (!a.csmName || !a.corporateBrand) continue;
          await client.query(accountQuery, [
            a.csmName, a.corporateBrand, a.cp || "", rosterIdMap.get(a.csmName) || null,
          ]);
          seeded++;
        }
        console.log(`${seeded} account entries seeded.`);
      } else {
        console.log("Roster data files not found — skipping seed.");
      }
    } else {
      console.log(`Roster already has ${rosterCount.rows[0].count} entries.`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

setup()
  .then(() => console.log("DB setup complete."))
  .catch((e) => console.error("DB setup error (continuing anyway):", e.message))
  .finally(() => {
    console.log("Starting Next.js...");
    const port = process.env.PORT || "8080";
    execSync(`npx next start -p ${port}`, { stdio: "inherit" });
  });
