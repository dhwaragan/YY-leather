import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.VITE_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { amount, receipt } = body;
    
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'A valid payment amount is required.' })
      };
    }

    const options = {
      amount: Math.round(Number(amount) * 100),
      currency: "INR",
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    };
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Unable to create Razorpay order.' })
    };
  }
};