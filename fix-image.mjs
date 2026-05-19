import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function fix() {
  try {
    const products = await sql`SELECT id, title, image_url FROM products`;
    console.log("Current Products:");
    console.log(products);

    // Let's find the one that might have the bad URL and fix it
    // The user mentioned they updated it but the image didn't come.
    for (const p of products) {
      if (p.image_url && !p.image_url.startsWith('/api/assets/images/') && !p.image_url.startsWith('http')) {
        console.log(`Fixing product ${p.id} (${p.title}) URL: ${p.image_url} -> /api/assets/images/image-1.jpg`);
        await sql`UPDATE products SET image_url = '/api/assets/images/image-1.jpg', preview_urls = '["/api/assets/images/image-1.jpg"]' WHERE id = ${p.id}`;
      } else if (p.image_url === '/api/assets/images/image (1).jpg' || p.image_url === 'image (1).jpg') {
        console.log(`Fixing product ${p.id} (${p.title}) URL: ${p.image_url} -> /api/assets/images/image-1.jpg`);
        await sql`UPDATE products SET image_url = '/api/assets/images/image-1.jpg', preview_urls = '["/api/assets/images/image-1.jpg"]' WHERE id = ${p.id}`;
      }
    }
    
    // Also, just to be sure, let's list them again
    const updated = await sql`SELECT id, title, image_url FROM products`;
    console.log("Updated Products:");
    console.log(updated);

  } catch (err) {
    console.error('Failed:', err.message);
  } finally {
    await sql.end();
  }
}

fix();
