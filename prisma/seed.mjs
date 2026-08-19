import pg from "pg";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const roster = JSON.parse(fs.readFileSync(path.join(__dirname, "data/roster.json"), "utf-8"));
const accounts = JSON.parse(fs.readFileSync(path.join(__dirname, "data/accounts.json"), "utf-8"));

async function main() {
  const client = await pool.connect();
  try {
    // Seed CsmRoster
    console.log("Clearing CsmRoster and CsmAccount...");
    await client.query('DELETE FROM "CsmAccount"');
    await client.query('DELETE FROM "CsmRoster"');

    console.log(`Seeding ${roster.length} roster entries...`);
    const rosterQuery = `INSERT INTO "CsmRoster" (id, "csmName", email, manager, rho, region, level, status, title, location, team, cp, "photoUrl", notes, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()) RETURNING id, "csmName"`;

    const rosterIdMap = new Map();
    for (const r of roster) {
      const res = await client.query(rosterQuery, [
        r.csmName || "",
        r.email || "",
        r.manager || "",
        r.rho || "",
        r.region || "",
        r.level || "CSM",
        r.status || "Active",
        r.title || "",
        r.location || "",
        r.team || "",
        r.cp || "",
        r.photoUrl || null,
        r.notes || null,
      ]);
      rosterIdMap.set(r.csmName, res.rows[0].id);
    }
    console.log(`${roster.length} roster entries seeded.`);

    // Seed CsmAccount
    console.log(`Seeding ${accounts.length} account entries...`);
    const accountQuery = `INSERT INTO "CsmAccount" (id, "csmName", "corporateBrand", cp, "rosterId", "createdAt")
      VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())`;

    let seeded = 0;
    for (const a of accounts) {
      if (!a.csmName || !a.corporateBrand) continue;
      const rosterId = rosterIdMap.get(a.csmName) || null;
      await client.query(accountQuery, [
        a.csmName,
        a.corporateBrand,
        a.cp || "",
        rosterId,
      ]);
      seeded++;
    }
    console.log(`${seeded} account entries seeded.`);

    // Seed AppTheme (singleton)
    console.log("Seeding default theme...");
    const existingTheme = await client.query('SELECT id FROM "AppTheme" LIMIT 1');
    if (existingTheme.rows.length === 0) {
      await client.query(`INSERT INTO "AppTheme" (id, "accentColor", "cardBackground", "cardBorder", "sidebarBackground", "pageBackground", "primaryText", "secondaryText", "cardBorderRadius", "cardSpacing", "sidebarWidth", "fontSize", "badgeStyle", "animationsEnabled", "showUrgencyColors", "updatedAt")
        VALUES (gen_random_uuid(), '#1DB954', '#181818', '#282828', '#000000', '#121212', '#FFFFFF', '#B3B3B3', 8, 'comfortable', 'default', 'medium', 'pill', true, true, NOW())`);
      console.log("Default theme created.");
    } else {
      console.log("Theme already exists, skipping.");
    }

    // Summary
    const rosterCount = await client.query('SELECT COUNT(*) FROM "CsmRoster"');
    const accountCount = await client.query('SELECT COUNT(*) FROM "CsmAccount"');
    console.log(`\nDone. ${rosterCount.rows[0].count} roster entries, ${accountCount.rows[0].count} accounts.`);

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
