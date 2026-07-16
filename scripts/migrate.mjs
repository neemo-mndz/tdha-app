import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function run() {
  console.log("Running migrations...\n");

  // 1. Users table
  await sql`CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  console.log("✓ users table");

  // 2. Days table
  await sql`CREATE TABLE IF NOT EXISTS days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  console.log("✓ days table");

  // 3. Days unique index
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS days_user_id_date_unique ON days(user_id, date)`;
  console.log("✓ days unique index");

  // 4. Tasks table
  await sql`CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    default_qty INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  console.log("✓ tasks table");

  // 5. Week plans table
  await sql`CREATE TABLE IF NOT EXISTS week_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  console.log("✓ week_plans table");

  // 6. Week plans unique index
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS week_plans_user_id_week_start_unique ON week_plans(user_id, week_start)`;
  console.log("✓ week_plans unique index");

  // 7. Week plan tasks table
  await sql`CREATE TABLE IF NOT EXISTS week_plan_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_plan_id UUID NOT NULL REFERENCES week_plans(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE RESTRICT,
    goal INTEGER NOT NULL DEFAULT 1,
    done INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  console.log("✓ week_plan_tasks table");

  // 8. Logs table
  await sql`CREATE TABLE IF NOT EXISTS logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_id UUID NOT NULL REFERENCES days(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    mood INTEGER,
    week_plan_task_id UUID REFERENCES week_plan_tasks(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  console.log("✓ logs table");

  // 9. Add week_plan_task_id to logs if it doesn't exist (for existing installs)
  await sql`ALTER TABLE logs ADD COLUMN IF NOT EXISTS week_plan_task_id UUID REFERENCES week_plan_tasks(id) ON DELETE SET NULL`;
  console.log("✓ logs.week_plan_task_id column");

  // 10. Reminders table
  await sql`CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hour INTEGER NOT NULL,
    minute INTEGER NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  console.log("✓ reminders table");

  // 11. Create stub user for development
  await sql`INSERT INTO users (id) VALUES ('00000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING`;
  console.log("✓ stub user created");

  console.log("\n✅ All migrations applied successfully!");
}

run().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
