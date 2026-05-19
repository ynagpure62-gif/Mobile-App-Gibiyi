import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function fix() {
  try {
    console.log("Fixing product 1...");
    await supabase.from('products').update({ 
      image_url: '/api/assets/images/image-1.jpg', 
      preview_urls: '["/api/assets/images/image-1.jpg"]' 
    }).eq('id', 1);
    
    const { data: updated } = await supabase.from('products').select('*').eq('id', 1);
    console.log("Updated Product 1:");
    console.log(updated.map(p => ({id: p.id, title: p.title, imageUrl: p.image_url})));

  } catch (err) {
    console.error('Failed:', err.message);
  }
}

fix();
