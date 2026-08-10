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

    // Seed AdminItems
    console.log("Seeding admin items...");
    await client.query('DELETE FROM "AdminItem"');

    let adminUser = await client.query('SELECT id FROM "User" WHERE "isAdmin" = true LIMIT 1');
    let adminId;
    if (adminUser.rows.length > 0) {
      adminId = adminUser.rows[0].id;
    } else {
      const firstUser = await client.query('SELECT id FROM "User" LIMIT 1');
      if (firstUser.rows.length > 0) {
        adminId = firstUser.rows[0].id;
        await client.query('UPDATE "User" SET "isAdmin" = true WHERE id = $1', [adminId]);
      } else {
        console.log("No users found — skipping admin items.");
        return;
      }
    }

    const now = new Date();
    function daysFromNow(d) { const dt = new Date(now); dt.setDate(dt.getDate() + d); return dt.toISOString(); }

    const adminItems = [
      { title: "Q3 Time-Spent Survey", description: "Complete the quarterly time-spent survey. Required for all CSMs.", date: daysFromNow(3), itemType: "deadline", category: "surveys", priority: "urgent" },
      { title: "Training Americas: New Dashboard Features", description: "Walk-through of new dashboard capabilities and reporting tools.", date: daysFromNow(7), itemType: "training", category: "meetings", priority: "normal" },
      { title: "ACN Survey Window Opens", description: "ACN survey window is now open. Complete by end of window.", date: daysFromNow(14), itemType: "survey", category: "surveys", priority: "normal" },
      { title: "Mid-Year Feedback Window", description: "Submit mid-year feedback for your direct reports and peers.", date: daysFromNow(5), itemType: "deadline", category: "surveys", priority: "high" },
      { title: "Measurement Enablement Cohort 4 Kickoff", description: "Kickoff session for the 4th measurement enablement cohort.", date: daysFromNow(14), itemType: "training", category: "programs", priority: "normal" },
      { title: "All-Hands: Ad Sales QBR", description: "Quarterly business review for Americas ad sales.", date: daysFromNow(21), itemType: "all-hands", category: "meetings", priority: "normal" },
      { title: "Programming Days: Q3 Planning", description: "Dedicated planning days for Q3 programming initiatives.", date: daysFromNow(7), itemType: "deadline", category: "programs", priority: "high" },
      { title: "New: Audience Insights 2.0", description: "Audience Insights 2.0 is now live with enhanced demographic and behavioral data.", date: daysFromNow(2), itemType: "new-release", category: "announcements", priority: "normal" },
      { title: "Deprecation: Legacy Campaign Reporter", description: "Legacy Campaign Reporter will be sunset. Migrate to new reporting dashboard.", date: daysFromNow(30), itemType: "deprecation", category: "announcements", priority: "high" },
      { title: "New: Real-Time Pacing Dashboard", description: "Real-time campaign pacing is now available in the new dashboard.", date: daysFromNow(14), itemType: "new-release", category: "announcements", priority: "normal" },
      { title: "Deprecation: Old Targeting Interface", description: "The old targeting interface will be removed. Use the new Audience Builder.", date: daysFromNow(45), itemType: "deprecation", category: "announcements", priority: "normal" },
      { title: "Americas CSM Weekly Sync", description: "Weekly sync for all Americas CSMs. Agenda shared in Slack.", date: daysFromNow(1), itemType: "training", category: "meetings", priority: "normal", isRecurring: true, recurrencePattern: "weekly" },
      { title: "Training: Ad Analytics Certification", description: "Complete the Ad Analytics certification program.", date: daysFromNow(21), itemType: "training", category: "meetings", priority: "normal" },
      { title: "Campaign Deadline: Q3 Mid-Flight Reviews", description: "All Q3 campaigns must have mid-flight reviews completed.", date: daysFromNow(10), itemType: "deadline", category: "campaigns", priority: "high" },
      { title: "All-Hands: Product Roadmap Preview", description: "Preview of upcoming product features and roadmap for H2.", date: daysFromNow(30), itemType: "all-hands", category: "meetings", priority: "normal" },
    ];

    const adminQuery = `INSERT INTO "AdminItem" (id, "createdById", title, description, date, "endDate", "itemType", category, priority, link, "isRecurring", "recurrencePattern", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, $3, $4, NULL, $5, $6, $7, NULL, $8, $9, NOW(), NOW())`;

    for (const item of adminItems) {
      await client.query(adminQuery, [
        adminId, item.title, item.description, item.date,
        item.itemType, item.category, item.priority,
        item.isRecurring ?? false, item.recurrencePattern ?? null,
      ]);
    }
    console.log(`${adminItems.length} admin items seeded.`);

    // Seed sample SavedItems
    console.log("Seeding sample saved items...");
    const existingSaved = await client.query('SELECT COUNT(*) FROM "SavedItem"');
    if (parseInt(existingSaved.rows[0].count) === 0) {
      const savedQuery = `INSERT INTO "SavedItem" (id, "userId", "sourceType", "sourceId", title, content, "sourceUrl", tags, notes, "isArchived", "savedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, false, NOW())`;

      await client.query(savedQuery, [adminId, "slack", "slack-sample-1", "Targeting best practices for Tech vertical", "Hey team, here are the updated targeting best practices for Tech accounts:\n\n1. Use Audience Insights 2.0 for demographic overlap\n2. Layer contextual targeting with behavioral segments\n3. Always include a frequency cap of 3x/week for awareness campaigns\n4. For consideration campaigns, use the new interest-based segments", null, "{follow-up,reference}", "Good reference for onboarding new Tech CSMs"]);
      await client.query(savedQuery, [adminId, "slack", "slack-sample-2", "Campaign pacing issue — solution found", "For anyone hitting the pacing issue with Q3 campaigns: the fix is to go into Campaign Settings > Delivery > and toggle 'Smart Pacing' off and back on. This resets the delivery algorithm.", null, "{solution-found,urgent}", "Share with team if they hit this issue"]);
      await client.query(savedQuery, [adminId, "slack", "slack-sample-3", "Q3 survey response template", "Here's the template I use for the Q3 time-spent survey responses:\n\n- Client meetings: 40%\n- Campaign management: 25%\n- Internal sync/planning: 15%\n- Training/enablement: 10%\n- Admin/other: 10%", null, "{reference}", null]);
      console.log("3 sample saved items seeded.");
    } else {
      console.log("Saved items already exist, skipping.");
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
