// Orders Netlify Function - Reads/Writes directly to Supabase for persistence
import { createClient } from '@supabase/supabase-js';

let SUPABASE_URL = process.env.SUPABASE_URL || "https://pxavmpkgvonxckmbaksh.supabase.co";
if (!SUPABASE_URL.includes('pxavmpkgvonxckmbaksh')) {
  SUPABASE_URL = "https://pxavmpkgvonxckmbaksh.supabase.co";
}
const NEW_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4YXZtcGtndm9ueGNrbWJha3NoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDQ4NTQ4OCwiZXhwIjoyMTA2MDYxNDg4fQ.n0RwNKeeBsbPzPMFAVUwMBMBasL3564cezigfLMMboo";
let SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || NEW_SERVICE_KEY;
if (!SUPABASE_SERVICE_KEY.includes('pxavmpkgvonxckmbaksh')) {
  SUPABASE_SERVICE_KEY = NEW_SERVICE_KEY;
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export const handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-email, x-admin-password, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  // Handle preflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // GET - Fetch orders from Supabase (user-scoped or active)
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
      
      let orders = data?.value || [];

      // Check if user-specific query
      const pathParts = (event.path || '').split('/');
      const userIndex = pathParts.indexOf('user');
      const userIdFromPath = userIndex !== -1 && pathParts[userIndex + 1] ? pathParts[userIndex + 1] : null;
      const targetUserId = userIdFromPath || event.queryStringParameters?.user_id;
      const targetEmail = event.queryStringParameters?.customer_email?.toLowerCase();

      if (targetUserId || targetEmail) {
        // Filter orders for this specific customer
        const filtered = orders.filter(o => 
          (targetUserId && o.user_id === targetUserId) ||
          (targetEmail && o.customer_email && o.customer_email.toLowerCase() === targetEmail)
        );
        return { statusCode: 200, headers, body: JSON.stringify(filtered) };
      }

      // Check if archived orders endpoint requested
      if (event.path.includes('archive') || event.queryStringParameters?.only_archived === 'true') {
        const { data: archData } = await supabase
          .from('yy_store_sync')
          .select('value')
          .eq('key', 'orders_archive')
          .single();
        return { statusCode: 200, headers, body: JSON.stringify(archData?.value || []) };
      }

      // Auto-archive orders completed over 7 days ago
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const activeOrders = [];
      const toArchive = [];
      for (const o of orders) {
        const isCompleted = o.status === 'Delivered' || o.status === 'Cancelled';
        const orderTime = o.created_at ? new Date(o.created_at).getTime() : 0;
        if (isCompleted && orderTime < sevenDaysAgo) {
          toArchive.push(o);
        } else {
          activeOrders.push(o);
        }
      }

      if (toArchive.length > 0) {
        // Run background sync to archive
        supabase.from('yy_store_sync').select('value').eq('key', 'orders_archive').single().then(({ data: currentArch }) => {
          const existing = currentArch?.value && Array.isArray(currentArch.value) ? currentArch.value : [];
          const cleaned = toArchive.map(o => {
            const c = { ...o };
            if (c.student_discount_details?.id_photo_url?.startsWith('data:image/')) {
              c.student_discount_details.id_photo_url = 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg';
            }
            if (c.birthday_benefit_details?.id_photo_url?.startsWith('data:image/')) {
              c.birthday_benefit_details.id_photo_url = 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg';
            }
            return c;
          });
          supabase.from('yy_store_sync').upsert({ key: 'orders_archive', value: [...cleaned, ...existing], updated_at: new Date().toISOString() }, { onConflict: 'key' }).catch(console.error);
          supabase.from('yy_store_sync').upsert({ key: 'orders', value: activeOrders, updated_at: new Date().toISOString() }, { onConflict: 'key' }).catch(console.error);
        }).catch(console.error);
        orders = activeOrders;
      }

      return { statusCode: 200, headers, body: JSON.stringify(orders) };
    }

    // POST - Create new order
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      
      // Admin free order verification
      if (body.is_admin_free_order) {
        const adminEmailsStr = process.env.VITE_ADMIN_EMAILS || 'dhwaragandhwaragan9@gmail.com,Yomeyom786@gmail.com,stanislauscbe@gmail.com,dhwaraganwebsite@gmail.com';
        const allowedEmails = adminEmailsStr.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
        
        const customerEmail = (body.customer_email || '').trim().toLowerCase();
        if (!customerEmail || !allowedEmails.includes(customerEmail)) {
          return { statusCode: 403, headers, body: JSON.stringify({ success: false, message: 'Only admins can place free orders' }) };
        }
        
        const enteredPass = (body.admin_password || '').trim();
        const validPasswords = [
          'chennaileather2026',
          'YYLeathers@SecureAdmin2026!',
          process.env.VITE_ADMIN_PASSWORD,
          process.env.ADMIN_PASSWORD,
          process.env.VITE_DATABASE_PASSWORD
        ].map(p => (p || '').trim()).filter(Boolean);

        let isPassValid = validPasswords.includes(enteredPass);

        // If not matched static/env passwords, check Supabase content_blocks for custom password
        if (!isPassValid && enteredPass) {
          try {
            const { data: cbData } = await supabase
              .from('yy_store_sync')
              .select('value')
              .eq('key', 'content_blocks')
              .single();
            if (cbData && Array.isArray(cbData.value)) {
              const pwBlock = cbData.value.find(cb => cb && cb.key === 'admin_password');
              if (pwBlock && pwBlock.value && pwBlock.value.trim() === enteredPass) {
                isPassValid = true;
              }
            }
          } catch (e) {
            console.error('Error fetching admin password from Supabase in orders.js:', e);
          }
        }

        if (!isPassValid) {
          return { statusCode: 401, headers, body: JSON.stringify({ success: false, message: 'Invalid Admin Password' }) };
        }
      }

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
        total: body.is_admin_free_order ? 0 : total,
        status: "Ordered",
        address,
        razorpay_order_id: body.is_admin_free_order ? 'admin_free_order' : (razorpay_order_id || `order_rp_${Date.now()}`),
        razorpay_payment_id: body.is_admin_free_order ? 'admin_free_order' : (razorpay_payment_id || `pay_rp_${Date.now()}`),
        delivery_region: delivery_region || 'TN',
        delivery_charge: body.is_admin_free_order ? 0 : (delivery_charge || 0),
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
      const body = JSON.parse(event.body || '{}');
      const { status, rejection_comment } = body;
      
      // Robust order ID extraction from regex, query parameter, or path
      const match = (event.path || '').match(/YY-ORD-\d+/);
      const pathParts = (event.path || '').split('/');
      const lastPart = pathParts[pathParts.length - 1];
      const orderId = match ? match[0] : (event.queryStringParameters?.id || (lastPart !== 'orders' ? lastPart : null));

      if (!orderId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Order ID is required' }) };
      }

      // 1. Check and update active orders
      const { data: existingData, error: fetchError } = await supabase
        .from('yy_store_sync')
        .select('value')
        .eq('key', 'orders')
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching orders:', fetchError);
        return { statusCode: 500, headers, body: JSON.stringify({ error: fetchError.message }) };
      }

      const existingOrders = existingData?.value || [];
      const orderIndex = existingOrders.findIndex(o => o.id === orderId);

      if (orderIndex !== -1) {
        const updated = { ...existingOrders[orderIndex], ...body };
        if (status) updated.status = status;
        if (rejection_comment) updated.rejection_comment = rejection_comment;
        existingOrders[orderIndex] = updated;

        const { error: saveError } = await supabase
          .from('yy_store_sync')
          .upsert(
            { key: 'orders', value: existingOrders, updated_at: new Date().toISOString() },
            { onConflict: 'key' }
          );

        if (saveError) {
          console.error('Error updating order in Supabase:', saveError);
          return { statusCode: 500, headers, body: JSON.stringify({ error: saveError.message }) };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, order: updated })
        };
      }

      // 2. Check and update orders_archive
      const { data: archData } = await supabase
        .from('yy_store_sync')
        .select('value')
        .eq('key', 'orders_archive')
        .single();

      const archOrders = archData?.value || [];
      const archIndex = archOrders.findIndex(o => o.id === orderId);

      if (archIndex !== -1) {
        const updatedArch = { ...archOrders[archIndex], ...body };
        if (status) updatedArch.status = status;
        if (rejection_comment) updatedArch.rejection_comment = rejection_comment;
        archOrders[archIndex] = updatedArch;

        const { error: saveArchError } = await supabase
          .from('yy_store_sync')
          .upsert(
            { key: 'orders_archive', value: archOrders, updated_at: new Date().toISOString() },
            { onConflict: 'key' }
          );

        if (saveArchError) {
          console.error('Error updating archived order in Supabase:', saveArchError);
          return { statusCode: 500, headers, body: JSON.stringify({ error: saveArchError.message }) };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, order: updatedArch })
        };
      }

      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ success: false, error: 'Order not found' })
      };
    }

    // DELETE - Delete order from active or archive
    if (event.httpMethod === 'DELETE') {
      const match = (event.path || '').match(/YY-ORD-\d+/);
      const pathParts = (event.path || '').split('/');
      const lastPart = pathParts[pathParts.length - 1];
      const orderId = match ? match[0] : (event.queryStringParameters?.id || (lastPart !== 'orders' ? lastPart : null));

      if (!orderId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Order ID is required' }) };
      }

      // 1. Check and delete from active orders
      const { data: existingData } = await supabase
        .from('yy_store_sync')
        .select('value')
        .eq('key', 'orders')
        .single();

      const existingOrders = existingData?.value || [];
      const orderFound = existingOrders.some(o => o.id === orderId);

      if (orderFound) {
        const filtered = existingOrders.filter(o => o.id !== orderId);
        const { error: saveError } = await supabase
          .from('yy_store_sync')
          .upsert(
            { key: 'orders', value: filtered, updated_at: new Date().toISOString() },
            { onConflict: 'key' }
          );

        if (saveError) {
          console.error('Error deleting order from Supabase:', saveError);
          return { statusCode: 500, headers, body: JSON.stringify({ error: saveError.message }) };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'Order deleted successfully' })
        };
      }

      // 2. Check and delete from orders_archive
      const { data: archData } = await supabase
        .from('yy_store_sync')
        .select('value')
        .eq('key', 'orders_archive')
        .single();

      const archOrders = archData?.value || [];
      const archFound = archOrders.some(o => o.id === orderId);

      if (archFound) {
        const filteredArch = archOrders.filter(o => o.id !== orderId);
        const { error: saveArchError } = await supabase
          .from('yy_store_sync')
          .upsert(
            { key: 'orders_archive', value: filteredArch, updated_at: new Date().toISOString() },
            { onConflict: 'key' }
          );

        if (saveArchError) {
          console.error('Error deleting archived order from Supabase:', saveArchError);
          return { statusCode: 500, headers, body: JSON.stringify({ error: saveArchError.message }) };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'Archived order deleted successfully' })
        };
      }

      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ success: false, error: 'Order not found' })
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