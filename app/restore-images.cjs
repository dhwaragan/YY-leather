const fs = require('fs');
const { parse } = require('csv-parse');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xslhdwoiqbpnzzhjxzod.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzbGhkd29pcWJwbnp6aGp4em9kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjcwNDY5MCwiZXhwIjoyMTAyMjgwNjkwfQ.wym9k3nBqRQXjyXDaHO9L83u8f7w3djaNI8SBLYzN38';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CSV_FILE = 'c:\\Users\\Administrator\\Downloads\\yy_store_sync_rows (2).csv';

console.log('Reading CSV file:', CSV_FILE);

fs.createReadStream(CSV_FILE)
  .pipe(parse({ columns: true }))
  .on('data', async (row) => {
    if (row.key === 'products') {
      console.log('Found products row! Parsing JSON...');
      try {
        const productsJSON = JSON.parse(row.value);
        console.log(`Parsed ${productsJSON.length} products.`);
        
        if (productsJSON.length > 0) {
          console.log('Sample image URL from first product:', productsJSON[0].images[0]);
        }

        const { error } = await supabase
          .from('yy_store_sync')
          .upsert({
             id: row.id || undefined,
             key: 'products',
             value: productsJSON,
             updated_at: new Date().toISOString()
          }, { onConflict: 'key' });
        
        if (error) {
          console.error('Error updating Supabase:', error);
        } else {
          console.log('✅ Successfully restored products with new images to Supabase!');
          
          const dbFile = './db.json';
          if (fs.existsSync(dbFile)) {
            const db = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
            db.products = productsJSON;
            fs.writeFileSync(dbFile, JSON.stringify(db, null, 2), 'utf8');
            console.log('✅ Updated local db.json as well.');
          }
        }
      } catch (e) {
         console.error('Error parsing JSON from CSV:', e);
      }
    }
  })
  .on('end', () => {
    console.log('Finished reading CSV.');
  });
