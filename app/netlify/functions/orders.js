// Orders Netlify Function - Reads/Writes directly to Supabase for persistence
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
    // GET - Fetch all orders from Supabase
    if (event.httpMethod === 'GET') {
      const { data, error } = await supabase
        .from('yy_store_sync')
        .select('value')
        .eq('key', 'orders')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching orders:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
      }
      
      const orders = data?.value || [];
      return { statusCode: 200, headers, body: JSON.stringify(orders) };
    }

    // POST - Create new order
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      const {
        user_id, items, total, address, phone, customer_name, customer_email,
        razorpay_order_id, razorpay_payment_id,
        delivery_region, delivery_charge, estimated_weight_kg,
        student_discount_requested, student_discount_details,
        birthday_benefit_requested, birthday_benefit_details,
        buyback_requested, buyback_details,
        applied_offer
      } = body;

      // Fetch current orders
      const { data: existingData, error: fetchError } = await supabase
        .from('yy_store_sync')
        .select('value')
        .eq('key', 'orders')
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching existing orders:', fetchError);
        return { statusCode: 500, headers, body: JSON.stringify({ error: fetchError.message }) };
      }

      const existingOrders = existingData?.value || [];

      const newOrder = {
        id: `YY-ORD-${Math.floor(10000 + Math.random() * 90000)}`,
        user_id,
        customer_name,
        customer_email,
        phone: phone || '',
        items,
        total,
        status: "Ordered",
        address,
        razorpay_order_id: razorpay_order_id || `order_rp_${Date.now()}`,
        razorpay_payment_id: razorpay_payment_id || `pay_rp_${Date.now()}`,
        delivery_region: delivery_region || 'TN',
        delivery_charge: delivery_charge || 0,
        estimated_weight_kg: estimated_weight_kg || 1,
        student_discount_requested: student_discount_requested || false,
        student_discount_details: student_discount_details || null,
        birthday_benefit_requested: birthday_benefit_requested || false,
        birthday_benefit_details: birthday_benefit_details || null,
        buyback_requested: buyback_requested || false,
        buyback_details: buyback_details || null,
        applied_offer: applied_offer || 'none',
        created_at: new Date().toISOString()
      };

      const updatedOrders = [newOrder, ...existingOrders];

      // Save to Supabase
      const { error: saveError } = await supabase
        .from('yy_store_sync')
        .upsert(
          { key: 'orders', value: updatedOrders, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );

      if (saveError) {
        console.error('Error saving order to Supabase:', saveError);
        return { statusCode: 500, headers, body: JSON.stringify({ error: saveError.message }) };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, order: newOrder })
      };
    }

    // PUT - Update order status
    if (event.httpMethod === 'PUT') {
      const body = JSON.parse(event.body);
      const { status, rejection_comment } = body;
      
      // Extract order ID from URL path: /.netlify/functions/orders/YY-ORD-12345
      const pathParts = event.path.split('/');
      const orderId = pathParts[pathParts.length - 1];

      if (!orderId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Order ID is required' }) };
      }

      // Fetch current orders
      const { data: existingData, error: fetchError } = await supabase
        .from('yy_store_sync')
        .select('value')
        .eq('key', 'orders')
        .single();

      if (fetchError) {
        console.error('Error fetching orders:', fetchError);
        return { statusCode: 500, headers, body: JSON.stringify({ error: fetchError.message }) };
      }

      const existingOrders = existingData?.value || [];
      const updatedOrders = existingOrders.map(o => {
        if (o.id === orderId) {
          const updated = { ...o, status };
          if (rejection_comment) {
            updated.rejection_comment = rejection_comment;
          }
          return updated;
        }
        return o;
      });

      // Save to Supabase
      const { error: saveError } = await supabase
        .from('yy_store_sync')
        .upsert(
          { key: 'orders', value: updatedOrders, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );

      if (saveError) {
        console.error('Error updating order in Supabase:', saveError);
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
    console.error('Orders function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Internal server error' })
    };
  }
};