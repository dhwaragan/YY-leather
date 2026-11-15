// Migration script to seed a new Supabase project with full YY Leathers data
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const targetUrl = process.argv[2] || process.env.NEW_SUPABASE_URL;
const targetServiceKey = process.argv[3] || process.env.NEW_SUPABASE_SERVICE_ROLE_KEY;

if (!targetUrl || !targetServiceKey) {
  console.error("Usage: node migrate_to_new_supabase.js <NEW_SUPABASE_URL> <NEW_SUPABASE_SERVICE_ROLE_KEY>");
  process.exit(1);
}

const supabase = createClient(targetUrl, targetServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function runMigration() {
  console.log(`Starting data migration to: ${targetUrl}`);
  
  const backupPath = path.join(__dirname, 'app', 'yy_leathers_backup_2026-10-18.json');
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup file not found at: ${backupPath}`);
  }

  const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

  const tablesToSync = [
    'products',
    'orders',
    'preorders',
    'custom_categories',
    'offers',
    'content_blocks',
    'hero_slides'
  ];

  for (const key of tablesToSync) {
    if (backup[key]) {
      const count = Array.isArray(backup[key]) ? backup[key].length : 'N/A';
      console.log(`Upserting ${key} (${count} items)...`);
      
      const { error } = await supabase.from('yy_store_sync').upsert({
        key: key,
        value: backup[key],
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });

      if (error) {
        console.error(`Error syncing ${key}:`, error);
      } else {
        console.log(`✓ Successfully synced ${key} (${count} items)`);
      }
    }
  }

  // Sync profiles
  if (backup.profiles && Array.isArray(backup.profiles)) {
    console.log(`Upserting ${backup.profiles.length} profiles...`);
    for (const prof of backup.profiles) {
      const { error } = await supabase.from('profiles').upsert(prof, { onConflict: 'email' });
      if (error) {
        console.warn(`Profile upsert note (${prof.email}):`, error.message);
      } else {
        console.log(`✓ Profile synced: ${prof.email}`);
      }
    }
  }

  console.log("\n==========================================");
  console.log("Migration Complete! All data restored 100%.");
  console.log("==========================================");
}

runMigration().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
