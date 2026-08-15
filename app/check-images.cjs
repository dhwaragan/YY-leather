const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://xslhdwoiqbpnzzhjxzod.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzbGhkd29pcWJwbnp6aGp4em9kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjcwNDY5MCwiZXhwIjoyMTAyMjgwNjkwfQ.wym9k3nBqRQXjyXDaHO9L83u8f7w3djaNI8SBLYzN38';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
  const { data, error } = await supabase.storage.from('yy-images').list('products', { limit: 100 });
  if (error) {
    console.error('Error fetching from new bucket:', error);
  } else {
    console.log('Found', data.length, 'files in new bucket:');
    console.log(data.map(d => d.name).slice(0, 10));
  }
}
check();
