import postgres from 'postgres';

const passwords = ['Prayaam2002', 'Prayaam2002@', 'Prayaam2002#', 'Prayaam2002!'];
const host = 'db.pwienecsxvnievazcjdw.supabase.co';

async function test() {
  for (const pass of passwords) {
    console.log(`Testing password: ${pass} on port 6543`);
    const sql = postgres(`postgresql://postgres:${encodeURIComponent(pass)}@${host}:6543/postgres?sslmode=require`, {
      connect_timeout: 10
    });
    try {
      const result = await sql`SELECT 1 as connected`;
      console.log(`SUCCESS with password: ${pass}`);
      await sql.end();
      return;
    } catch (err) {
      console.log(`FAILED with password: ${pass} - Error: ${err.message}`);
    } finally {
      await sql.end();
    }
  }
}

test();
