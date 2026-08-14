const { createClient } = require('@supabase/supabase-js');

// 1. Put your OLD keys here (from the blocked Supabase)
const OLD_URL = 'https://joutnmqckfwtfwicfqrm.supabase.co'; // Replace if different
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvdXRubXFja2Z3dGZ3aWNmcXJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NTk5NDEsImV4cCI6MjEwMTQzNTk0MX0._cscygUUrJdwnfDhJm5IXGK5fo6X7ig6SaR2rDYcb8o';

// 2. Put your NEW keys here (from the new Supabase)
const NEW_URL = 'https://xslhdwoiqbpnzzhjxzod.supabase.co';
const NEW_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzbGhkd29pcWJwbnp6aGp4em9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MDQ2OTAsImV4cCI6MjEwMjI4MDY5MH0.3y36PEio0C_kNuU5i2_PklPq8fgSJPCX1ebDkql7rT0';

async function migrate() {
  console.log("Connecting to Old Supabase...");
  const oldDb = createClient(OLD_URL, OLD_KEY);
  
  console.log("Connecting to New Supabase...");
  const newDb = createClient(NEW_URL, NEW_KEY);

  console.log("Fetching all data from Old Supabase...");
  const { data: rows, error: fetchError } = await oldDb
    .from('yy_store_sync')
    .select('*');

  if (fetchError) {
    console.error("Error fetching old data:", fetchError);
    return;
  }

  console.log(`Found ${rows.length} rows. Pushing to New Supabase...`);
  
  for (const row of rows) {
    console.log(`Pushing ${row.key}...`);
    const { error: insertError } = await newDb
      .from('yy_store_sync')
      .upsert({ 
        key: row.key, 
        value: row.value,
        updated_at: new Date().toISOString()
      });
      
    if (insertError) {
      console.error(`Error pushing ${row.key}:`, insertError);
    } else {
      console.log(`Success: ${row.key}`);
    }
  }
  
  console.log("Migration Complete! All your latest live data is now in the new Supabase!");
}

migrate();
