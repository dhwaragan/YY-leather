// Preorders Netlify Function - Reads/Writes directly to Supabase for persistence
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || "https://xslhdwoiqbpnzzhjxzod.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzbGhkd29pcWJwbnp6aGp4em9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MDQ2OTAsImV4cCI6MjEwMjI4MDY5MH0.3y36PEio0C_kNuU5i2_PklPq8fgSJPCX1ebDkql7rT0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  // Handle preflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // GET - Fetch all preorders from Supabase
    if (event.httpMethod === 'GET') {
      const { data, error } = await supabase
        .from('yy_store_sync')
        .select('value')
        .eq('key', 'preorders')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching preorders:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
      }
      
      const preorders = data?.value || [];
      return { statusCode: 200, headers, body: JSON.stringify(preorders) };
    }

    // POST - Create new preorder
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      const {
        user_id, name, email, phone, product_id, product_name,
        message, status
      } = body;

      // Fetch current preorders
      const { data: existingData, error: fetchError } = await supabase
        .from('yy_store_sync')
        .select('value')
        .eq('key', 'preorders')
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching existing preorders:', fetchError);
        return { statusCode: 500, headers, body: JSON.stringify({ error: fetchError.message }) };
      }

      const existingPreorders = existingData?.value || [];

      const newPreorder = {
        id: `YY-PRE-${Math.floor(10000 + Math.random() * 90000)}`,
        user_id,
        name,
        email,
        phone: phone || '',
        product_id,
        product_name,
        message: message || '',
        status: status || 'Pending',
        created_at: new Date().toISOString()
      };

      const updatedPreorders = [newPreorder, ...existingPreorders];

      // Save to Supabase
      const { error: saveError } = await supabase
        .from('yy_store_sync')
        .upsert(
          { key: 'preorders', value: updatedPreorders, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );

      if (saveError) {
        console.error('Error saving preorder to Supabase:', saveError);
        return { statusCode: 500, headers, body: JSON.stringify({ error: saveError.message }) };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, preorder: newPreorder })
      };
    }

    // PUT - Update preorder status
    if (event.httpMethod === 'PUT') {
      const body = JSON.parse(event.body);
      const { status, admin_note, estimated_delivery } = body;
      
      // Extract preorder ID from URL path: /.netlify/functions/preorders/YY-PRE-12345
      const pathParts = event.path.split('/');
      const preorderId = pathParts[pathParts.length - 1];

      if (!preorderId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Preorder ID is required' }) };
      }

      // Fetch current preorders
      const { data: existingData, error: fetchError } = await supabase
        .from('yy_store_sync')
        .select('value')
        .eq('key', 'preorders')
        .single();

      if (fetchError) {
        console.error('Error fetching preorders:', fetchError);
        return { statusCode: 500, headers, body: JSON.stringify({ error: fetchError.message }) };
      }

      const existingPreorders = existingData?.value || [];
      const updatedPreorders = existingPreorders.map(p => {
        if (p.id === preorderId) {
          const updated = { ...p, status };
          if (admin_note) updated.admin_note = admin_note;
          if (estimated_delivery) updated.estimated_delivery = estimated_delivery;
          return updated;
        }
        return p;
      });

      // Save to Supabase
      const { error: saveError } = await supabase
        .from('yy_store_sync')
        .upsert(
          { key: 'preorders', value: updatedPreorders, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );

      if (saveError) {
        console.error('Error updating preorder in Supabase:', saveError);
        return { statusCode: 500, headers, body: JSON.stringify({ error: saveError.message }) };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not supported' })
    };
  } catch (error) {
    console.error('Preorders function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Internal server error' })
    };
  }
};