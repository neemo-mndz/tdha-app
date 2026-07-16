import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function run() {
  console.log("=== Verifying database state ===\n");

  // Check stub user exists
  const users = await sql`SELECT id FROM users WHERE id = '00000000-0000-0000-0000-000000000001'`;
  console.log("Stub user exists:", users.length > 0);
  
  if (users.length === 0) {
    await sql`INSERT INTO users (id) VALUES ('00000000-0000-0000-0000-000000000001')`;
    console.log("✓ Created stub user");
  }

  // Test the exact queries that the app uses:
  
  // 1. getWeekStatus (home page)
  try {
    const weekStatus = await sql`
      SELECT gs.date::date AS date, COUNT(l.id)::int AS log_count
      FROM generate_series('2025-07-14'::date, '2025-07-20'::date, '1 day'::interval) AS gs(date)
      LEFT JOIN days d ON d.date = gs.date AND d.user_id = '00000000-0000-0000-0000-000000000001'
      LEFT JOIN logs l ON l.day_id = d.id
      GROUP BY gs.date ORDER BY gs.date
    `;
    console.log("✓ getWeekStatus query works:", weekStatus.length, "rows");
  } catch (e) {
    console.error("✗ getWeekStatus failed:", e.message);
  }

  // 2. getUserTasks
  try {
    const tasks = await sql`SELECT * FROM tasks WHERE user_id = '00000000-0000-0000-0000-000000000001' ORDER BY created_at`;
    console.log("✓ getUserTasks works:", tasks.length, "tasks");
  } catch (e) {
    console.error("✗ getUserTasks failed:", e.message);
  }

  // 3. getWeekPlan
  try {
    const plans = await sql`SELECT * FROM week_plans WHERE user_id = '00000000-0000-0000-0000-000000000001'`;
    console.log("✓ getWeekPlan works:", plans.length, "plans");
  } catch (e) {
    console.error("✗ getWeekPlan failed:", e.message);
  }

  // 4. getReminders
  try {
    const reminders = await sql`SELECT * FROM reminders WHERE user_id = '00000000-0000-0000-0000-000000000001'`;
    console.log("✓ getReminders works:", reminders.length, "reminders");
  } catch (e) {
    console.error("✗ getReminders failed:", e.message);
  }

  // 5. Test upsertDay + insertLog (the create log flow)
  try {
    await sql`INSERT INTO days (user_id, date) VALUES ('00000000-0000-0000-0000-000000000001', '2025-07-16') ON CONFLICT DO NOTHING`;
    const day = await sql`SELECT id FROM days WHERE user_id = '00000000-0000-0000-0000-000000000001' AND date = '2025-07-16'`;
    console.log("✓ upsertDay works, day id:", day[0]?.id);
    
    if (day[0]) {
      await sql`INSERT INTO logs (day_id, content) VALUES (${day[0].id}, 'test log') RETURNING id`;
      console.log("✓ insertLog works");
      // cleanup
      await sql`DELETE FROM logs WHERE day_id = ${day[0].id}`;
      await sql`DELETE FROM days WHERE id = ${day[0].id}`;
      console.log("✓ cleanup done");
    }
  } catch (e) {
    console.error("✗ upsertDay/insertLog failed:", e.message);
  }

  console.log("\n=== All checks complete ===");
}

run().catch(e => { console.error("Fatal:", e.message); process.exit(1); });
