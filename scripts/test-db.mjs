import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

try {
  const result = await sql`SELECT 1 as test`;
  console.log("✅ DB connection OK:", result);
  
  // Test the actual query that runs on home page
  const weekStatus = await sql`
    SELECT
      gs.date::date AS date,
      COUNT(l.id)::int AS log_count
    FROM
      generate_series('2025-07-14'::date, '2025-07-20'::date, '1 day'::interval) AS gs(date)
    LEFT JOIN days d
      ON d.date = gs.date AND d.user_id = '00000000-0000-0000-0000-000000000001'
    LEFT JOIN logs l
      ON l.day_id = d.id
    GROUP BY gs.date
    ORDER BY gs.date
  `;
  console.log("✅ Week status query OK:", weekStatus);
} catch (err) {
  console.error("❌ Error:", err.message);
}
