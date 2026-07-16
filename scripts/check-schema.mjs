import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const tables = await sql`
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' 
  ORDER BY table_name
`;
console.log("Tables:", tables.map(t => t.table_name));

for (const t of tables) {
  const cols = await sql`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = ${t.table_name} AND table_schema = 'public'
    ORDER BY ordinal_position
  `;
  console.log(`\n${t.table_name}:`);
  for (const c of cols) {
    console.log(`  ${c.column_name} (${c.data_type}, nullable: ${c.is_nullable})`);
  }
}
