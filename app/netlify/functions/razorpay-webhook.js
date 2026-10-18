import crypto from 'crypto';

// In-memory database for orders (in production, use a real database)
let orders = [];

export const handler = async (event) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.warn('RAZORPAY_WEBHOOK_SECRET not configured. Skipping webhook verification.');
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: "ok", message: "Webhook received (no verification configured)." })
    };
  }

  const expectedSignature = event.headers['x-razorpay-signature'];
  if (!expectedSignature) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: "error", message: "Missing signature header." })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const expectedSig = crypto
      .createHmac('sha256', webhookSecret)
      .update(event.body)
      .digest('hex');

    if (expectedSig !== expectedSignature) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: "error", message: "Invalid webhook signature." })
      };
    }

    const webhookEvent = body.event;
    if (webhookEvent === 'payment.captured' || webhookEvent === 'order.paid') {
      const payment = body.payload?.payment?.entity;
      const orderEntity = body.payload?.order?.entity;
      
      if (payment && orderEntity) {
        const orderId = `YY-ORD-${Math.floor(10000 + Math.random() * 90000)}`;
        const newOrder = {
          id: orderId,
          user_id: payment.notes?.user_id || 'guest',
          customer_name: payment.notes?.customer_name || 'Customer',
          customer_email: payment.email || payment.notes?.email || '',
          items: payment.notes?.items ? JSON.parse(payment.notes.items) : [],
          total: (orderEntity.amount || 0) / 100,
          status: 'Paid',
          address: payment.notes?.address || '',
          phone: payment.contact || payment.notes?.phone || '',
          delivery_region: payment.notes?.delivery_region || 'TN',
          delivery_charge: parseFloat(payment.notes?.delivery_charge || '0'),
          estimated_weight_kg: parseFloat(payment.notes?.estimated_weight_kg || '0'),
          razorpay_order_id: orderEntity.id,
          razorpay_payment_id: payment.id,
          created_at: new Date().toISOString()
        };
        orders.unshift(newOrder);
        console.log('Order saved from Razorpay webhook:', newOrder);
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: "ok" })
    };
  } catch (error) {
    console.error('Webhook processing failed:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: "error", message: error.message })
    };
  }
};