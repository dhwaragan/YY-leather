import crypto from 'crypto';

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing payment verification parameters.' })
      };
    }

    const bodyString = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '4rqwmTVVaG2MV16fvGlspAt8')
      .update(bodyString.toString())
      .digest('hex');

    const isSignatureValid = expectedSignature === razorpay_signature;

    if (isSignatureValid) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ok', verified: true, payment_id: razorpay_payment_id, order_id: razorpay_order_id })
      };
    } else {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'error', verified: false, message: 'Invalid payment signature.' })
      };
    }
  } catch (error) {
    console.error('Payment verification failed:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Payment verification failed.' })
    };
  }
};