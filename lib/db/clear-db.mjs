import { db } from './src/index.ts';
import { productsTable, categoriesTable } from './src/schema/index.ts';

async function clear() {
  try {
    console.log('Clearing categories...');
    await db.delete(categoriesTable);
    console.log('Clearing products...');
    await db.delete(productsTable);
    console.log('Database cleared.');
  } catch (err) {
    console.error('Error clearing database:', err.message);
  } finally {
    process.exit(0);
  }
}

clear();
