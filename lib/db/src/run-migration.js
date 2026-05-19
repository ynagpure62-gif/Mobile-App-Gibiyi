import postgres from 'postgres';

const DATABASE_URL = 'postgresql://postgres:Prayaam2002%40@db.pwienecsxvnievazcjdw.supabase.co:6543/postgres?sslmode=require';

async function run() {
  console.log('Connecting to database...');
  const sql = postgres(DATABASE_URL);
  
  try {
    console.log('Adding column "utr" to "orders" table...');
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS utr TEXT UNIQUE;`;
    console.log('Successfully added "utr" column!');

    console.log('Adding column "screenshot_url" to "orders" table...');
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS screenshot_url TEXT;`;
    console.log('Successfully added "screenshot_url" column!');
  } catch (err) {
    console.error('Error during migration:', err);
  } finally {
    await sql.end();
  }
}

run();
