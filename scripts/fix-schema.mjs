import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function run() {
  console.log("Fixing database schema...\n");

  // Drop old tables in correct order (respecting FK constraints)
  await sql`DROP TABLE IF EXISTS logs CASCADE`;
  console.log("✓ Dropped old logs table");

  await sql`DROP TABLE IF EXISTS days CASCADE`;
  console.log("✓ Dropped old days table");

  await sql`DROP TABLE IF EXISTS playing_with_neon CASCADE`;
  console.log("✓ Dropped playing_with_neon table");

  // Recreate days with correct schema
  await sql`CREATE TABLE days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  console.log("✓ Created days table (correct schema)");

  await sql`CREATE UNIQUE INDEX days_user_id_date_unique ON days(user_id, date)`;
  console.log("✓ Created days unique index");

  // Recreate logs with correct schema
  await sql`CREATE TABLE logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_id UUID NOT NULL REFERENCES days(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    mood INTEGER,
    week_plan_task_id UUID REFERENCES week_plan_tasks(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  console.log("✓ Created logs table (correct schema with day_id FK)");

  // Verify
  const cols = await sql`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'logs' AND table_schema = 'public'
    ORDER BY ordinal_position
  `;
  console.log("\n✅ logs columns:", cols.map(c => c.column_name));
}

run().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
