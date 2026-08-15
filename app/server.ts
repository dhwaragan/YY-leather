/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

import { GoogleGenAI } from "@google/genai";
import Stripe from 'stripe';
import Razorpay from 'razorpay';
import cors from 'cors';
import crypto from 'crypto';

dotenv.config();

const _filename = typeof __filename !== 'undefined' ? __filename : (import.meta.url ? fileURLToPath(import.meta.url) : '');
const _dirname = typeof __dirname !== 'undefined' ? __dirname : (_filename ? path.dirname(_filename) : process.cwd());

// Initialize Gemini Client
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    if (!process.env.GEMINI_API_KEY) {
       throw new Error('GEMINI_API_KEY is missing');
    }
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Initialize Supabase Client - uses environment variables from .env file
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://xslhdwoiqbpnzzhjxzod.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzbGhkd29pcWJwbnp6aGp4em9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MDQ2OTAsImV4cCI6MjEwMjI4MDY5MH0.3y36PEio0C_kNuU5i2_PklPq8fgSJPCX1ebDkql7rT0";
console.log('[Supabase] Connecting to:', SUPABASE_URL);

// Use Service Key if available to bypass RLS, otherwise fallback to Anon Key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY);



// Initialize Stripe (server-only secret key from environment)
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let stripe: any = null;
if (stripeSecretKey) {
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-06-20',
  });
}

// Initialize Razorpay (server-only secret key from environment)
const razorpayKeyId = process.env.VITE_RAZORPAY_KEY_ID || "rzp_test_TCC3Up2fPxpuKN";
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || "4rqwmTVVaG2MV16fvGlspAt8";

const razorpay = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
});

const app = express();
const PORT = Number(process.env.PORT || 3000);

const getDeliveryCharge = (region: string, weightKg: number) => {
  switch (region) {
    case 'TN':
      return 80 * weightKg;
    case 'South':
      return 100 * weightKg;
    case 'North':
      return 150 * weightKg;
    case 'North East':
      return 250 * weightKg;
    case 'North West':
      return 200 * weightKg;
    case 'Himachal':
      return 200 * weightKg;
    default:
      return 0;
  }
};

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors()); // Enable CORS

// Security Headers Middleware
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Content Security Policy - Updated to allow Razorpay, Supabase, and Cloudinary assets
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://api.razorpay.com https://cdn.razorpay.com *.supabase.co; " +
    "style-src 'self' 'unsafe-inline' https:; " +
    "img-src 'self' data: https: http:; " +
    "font-src 'self' data: https:; " +
    "connect-src 'self' https: wss: https://checkout.razorpay.com https://api.razorpay.com https://cdn.razorpay.com *.supabase.co https://res.cloudinary.com; " +
    "frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com; " +
    "media-src 'self' https://res.cloudinary.com; " +
    "frame-ancestors 'none';"
  );
  // Permissions Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// Admin emails list
const ADMIN_EMAILS = (process.env.VITE_ADMIN_EMAILS || "").split(",").map(e => e.trim()).filter(Boolean);

// Helper to get current admin password (env var first - ZERO Supabase egress for auth)
const getAdminPassword = async () => {
  // EGRESS FIX: Check env var FIRST (no Supabase query needed)
  const envPass = process.env.VITE_ADMIN_PASSWORD || process.env.VITE_DATABASE_PASSWORD;
  if (envPass) {
    return envPass;
  }
  
  // Check in-memory cache second (no Supabase query)
  if (cachedAdminPassword) {
    return cachedAdminPassword;
  }
  
  // Check local DB (no Supabase query)
  try {
    if (db && db.content_blocks && Array.isArray(db.content_blocks)) {
      const contentBlock = db.content_blocks.find((cb: any) => cb.key === 'admin_password');
      if (contentBlock && contentBlock.value) {
        cachedAdminPassword = contentBlock.value;
        return contentBlock.value;
      }
    }
  } catch (e) {
    console.error('Error reading admin password from local DB:', e);
  }
  
  // Final fallback: Supabase (only used when password was changed via UI)
  try {
    const { data, error } = await supabase
      .from('yy_store_sync')
      .select('value')
      .eq('key', 'content_blocks')
      .single();
    
    if (!error && data?.value && Array.isArray(data.value)) {
      const contentBlock = data.value.find((cb: any) => cb.key === 'admin_password');
      if (contentBlock && contentBlock.value) {
        cachedAdminPassword = contentBlock.value;
        return contentBlock.value;
      }
    }
  } catch (e) {
    console.error('Error reading admin password from Supabase:', e);
  }
  
  // Absolute fallback
  return "chennaileather2026";
};

// Admin Authentication Middleware
// EGRESS FIX: Check env var and cache FIRST. Only hit Supabase if user changed password via UI.
const authenticateAdmin = async (req: any, res: any, next: any) => {
  const adminEmail = req.headers['x-admin-email'] || req.body?.admin_email || req.query?.admin_email;
  const adminPassword = req.headers['x-admin-password'] || req.body?.admin_password || req.query?.admin_password;
  
  // Check if email is in admin list (case-insensitive)
  const isValidAdminEmail = ADMIN_EMAILS.some(
    validEmail => validEmail.toLowerCase() === (adminEmail || '').toLowerCase()
  );
  
  if (!isValidAdminEmail || !adminPassword) {
    res.status(403).json({ success: false, error: 'Admin authentication required' });
    return;
  }
  
  const normalizedPassword = (adminPassword || '').trim();
  
  // STEP 1: Check environment variable (ZERO Supabase egress)
  const envPass = process.env.VITE_ADMIN_PASSWORD || process.env.VITE_DATABASE_PASSWORD;
  if (envPass && normalizedPassword === envPass) {
    return next();
  }
  
  // STEP 2: Check in-memory cache (ZERO Supabase egress)
  if (cachedAdminPassword && normalizedPassword === cachedAdminPassword) {
    return next();
  }
  
  // STEP 3: Check local database (ZERO Supabase egress)
  try {
    if (db && db.content_blocks && Array.isArray(db.content_blocks)) {
      const contentBlock = db.content_blocks.find((cb: any) => cb.key === 'admin_password');
      const localPass = contentBlock?.value;
      if (localPass && normalizedPassword === localPass) {
        cachedAdminPassword = localPass;
        return next();
      }
    }
  } catch (e) {
    console.error('Error checking admin password in DB:', e);
  }
  
  // STEP 4: Only reach Supabase if password was changed via admin UI (not in env)
  // This handles the case where admin changed their password through the settings panel
  try {
    const { data, error } = await supabase
      .from('yy_store_sync')
      .select('value')
      .eq('key', 'content_blocks')
      .single();
    
    if (!error && data?.value && Array.isArray(data.value)) {
      const supabaseBlock = data.value.find((cb: any) => cb.key === 'admin_password');
      const supabasePass = supabaseBlock?.value;
      if (supabasePass && normalizedPassword === supabasePass) {
        cachedAdminPassword = supabasePass;
        // Update local DB to avoid hitting Supabase next time
        if (db && db.content_blocks && Array.isArray(db.content_blocks)) {
          const idx = db.content_blocks.findIndex((cb: any) => cb.key === 'admin_password');
          if (idx !== -1) db.content_blocks[idx].value = supabasePass;
          else db.content_blocks.push({ id: 'cb-admin_password', key: 'admin_password', value: supabasePass });
          if (!IS_SERVERLESS) {
            try { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8'); } catch {}
          }
        }
        return next();
      }
    }
  } catch (supabaseError) {
    console.error('Error checking Supabase password:', supabaseError);
  }
  
  // STEP 5: Absolute hardcoded fallback — the initial default password ALWAYS works
  // Allow default if cache is empty (no custom password set) or cache itself is the default
  const HARDCODED_DEFAULT = "chennaileather2026";
  if (normalizedPassword === HARDCODED_DEFAULT) {
    const customPasswordSet = cachedAdminPassword && cachedAdminPassword !== HARDCODED_DEFAULT;
    if (!customPasswordSet) {
      return next();
    }
  }
  
  console.log('[Auth] AUTHENTICATION FAILED for email:', adminEmail);
  res.status(403).json({ success: false, error: 'Invalid email or password. Access denied.' });
};

// Rate limiting middleware (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const rateLimit = (maxRequests: number, windowMs: number) => {
  return (req: any, res: any, next: any) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const limit = rateLimitMap.get(key);
    
    if (!limit || now > limit.resetTime) {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      next();
    } else if (limit.count < maxRequests) {
      limit.count++;
      next();
    } else {
      res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
  };
};

// ---------------- STRIPE INTEGRATION ----------------
app.post('/api/stripe/create-payment-intent', async (req, res) => {
  const {
    amount,
    currency = 'inr',
    email,
    customer_name,
    address,
    phone,
    items,
    delivery_region,
    delivery_charge,
    estimated_weight_kg,
    student_discount_requested,
    student_discount_details,
    birthday_benefit_requested,
    birthday_benefit_details,
    buyback_requested,
    buyback_details,
    applied_offer,
  } = req.body;

  if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'A valid payment amount is required.' });
  }
  if (!email || !customer_name) {
    return res.status(400).json({ error: 'Customer name and email are required.' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Shopping cart cannot be empty.' });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(amount) * 100),
      currency,
      automatic_payment_methods: { enabled: true },
      receipt_email: email,
      metadata: {
        customer_name,
        address: address || '',
        phone: phone || '',
        delivery_region: delivery_region || 'TN',
        delivery_charge: String(delivery_charge || 0),
        estimated_weight_kg: String(estimated_weight_kg || 0),
        items: JSON.stringify(items),
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('Payment intent creation failed:', error);
    res.status(500).json({ error: error.message || 'Unable to initialize payment.' });
  }
});

app.post('/api/stripe/create-checkout-session', async (req, res) => {
  const { address, phone, email, customer_name, items, total, delivery_region, delivery_charge, estimated_weight_kg, buyback_requested, buyback_details, birthday_benefit_requested, birthday_benefit_details, student_discount_requested, student_discount_details, applied_offer } = req.body;

  try {
    const resolvedWeightKg = Number(estimated_weight_kg) || 1;
    const resolvedDeliveryCharge = getDeliveryCharge(delivery_region, resolvedWeightKg);
    const pendingOrder = {
      id: `YY-ORD-${Math.floor(10000 + Math.random() * 90000)}`,
      user_id: req.body.user_id || 'guest',
      customer_name: customer_name || 'Guest',
      customer_email: email || 'guest@example.com',
      items,
      total: Number(total) || 0,
      status: 'Pending',
      address,
      phone,
      buyback_requested: Boolean(buyback_requested),
      buyback_details: buyback_requested ? { ...buyback_details, status: 'Pending' } : null,
      birthday_benefit_requested: Boolean(birthday_benefit_requested),
      birthday_benefit_details: birthday_benefit_requested ? { ...birthday_benefit_details, status: 'Pending' } : null,
      student_discount_requested: Boolean(student_discount_requested),
      student_discount_details: student_discount_requested ? { ...student_discount_details, status: 'Pending' } : null,
      applied_offer: applied_offer || 'none',
      created_at: new Date().toISOString(),
    };
    db.orders.unshift(pendingOrder);
    saveDatabase(db, 'orders');

    const line_items = items.map((item: any) => ({
      price_data: {
        currency: 'inr',
        product_data: {
          name: item.product.name,
          images: item.product.images,
          metadata: {
            product_id: item.product.id,
            size: item.selectedSize,
          },
        },
        unit_amount: Math.round((Number(item.product?.price ?? item.price ?? 0)) * 100),
      },
      quantity: item.quantity,
    }));

    if (resolvedDeliveryCharge > 0) {
      line_items.push({
        price_data: {
          currency: 'inr',
          product_data: {
            name: 'Delivery Charge',
            metadata: {
              region: delivery_region,
              weight_kg: estimated_weight_kg,
            },
          },
          unit_amount: resolvedDeliveryCharge * 100, // Amount in paise
        },
        quantity: 1,
      });
    }

      // Add a placeholder for processing fee, if necessary
    const processingFee = Math.round(total * 0.025);
    if (processingFee > 0) {
      line_items.push({
        price_data: {
          currency: 'inr',
          product_data: {
            name: 'Processing Fee',
            metadata: {
              type: 'payment_gateway',
            },
          },
          unit_amount: processingFee * 100,
        },
        quantity: 1,
      });
    }

    const origin = req.headers.origin || 'http://localhost:3000';
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${origin}/?orderSuccess=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?orderCancelled=true`,
      customer_email: email,
      metadata: {
        order_id: pendingOrder.id,
        user_id: req.body.user_id || 'guest',
        customer_name: customer_name,
        address: address,
        phone: phone,
        delivery_region: delivery_region,
        delivery_charge: resolvedDeliveryCharge,
        estimated_weight_kg: resolvedWeightKg,
        items: JSON.stringify(items),
        buyback_requested: String(Boolean(buyback_requested)),
        buyback_details: JSON.stringify(buyback_requested ? { ...buyback_details, status: 'Pending' } : null),
        birthday_benefit_requested: String(Boolean(birthday_benefit_requested)),
        birthday_benefit_details: JSON.stringify(birthday_benefit_requested ? { ...birthday_benefit_details, status: 'Pending' } : null),
      },
    });

    res.json({ url: session.url, orderId: pendingOrder.id });
  } catch (error: any) {
    console.error('Stripe checkout session creation failed:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(500).send('Webhook secret not configured');
  }

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      // Fulfill the purchase, e.g., save order to your database
      console.log('Checkout session completed:', session);
      // TODO: Implement actual order saving to db.orders
      // For now, we'll log it and assume success.

      const { metadata } = session;
      const orderId = metadata?.order_id || `YY-ORD-${Math.floor(10000 + Math.random() * 90000)}`;
      const existingOrder = db.orders.find((order: any) => order.id === orderId);
      const newOrder = {
        id: orderId,
        user_id: metadata?.user_id || 'guest',
        customer_name: metadata?.customer_name || 'N/A',
        customer_email: session.customer_details?.email || 'N/A',
        items: JSON.parse(metadata?.items || '[]'),
        total: session.amount_total ? session.amount_total / 100 : 0,
        status: 'Paid',
        address: metadata?.address || 'N/A',
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string,
        delivery_region: metadata?.delivery_region,
        delivery_charge: parseFloat(metadata?.delivery_charge || '0'),
        estimated_weight_kg: parseFloat(metadata?.estimated_weight_kg || '0'),
        buyback_requested: metadata?.buyback_requested === 'true',
        buyback_details: metadata?.buyback_details ? JSON.parse(metadata.buyback_details) : null,
        birthday_benefit_requested: metadata?.birthday_benefit_requested === 'true',
        birthday_benefit_details: metadata?.birthday_benefit_details ? JSON.parse(metadata.birthday_benefit_details) : null,
        created_at: new Date().toISOString(),
      };

      if (existingOrder) {
        Object.assign(existingOrder, newOrder, { created_at: existingOrder.created_at || newOrder.created_at });
      } else {
        db.orders.unshift(newOrder);
      }
      saveDatabase(db, 'orders');
      console.log('Order saved to DB:', newOrder);

      break;
    case 'payment_intent.succeeded':
      const paymentIntentSucceeded = event.data.object;
      console.log('PaymentIntent was successful!', paymentIntentSucceeded);
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).json({ received: true });
});

const IS_SERVERLESS = !!(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.AWS_EXECUTION_ENV);

// Persistent database file
const DB_FILE = IS_SERVERLESS ? '/tmp/db.json' : path.join(_dirname, 'db.json');


// Interface representation for DB
interface Database {
  profiles: any[];
  products: any[];
  orders: any[];
  preorders: any[];
  offers: any[];
  content_blocks: any[];
}

// Initial seed data
  const initialDB: Database = {
  profiles: [
    {
      id: "admin-id",
      email: "dhwaragandhwaragan9@gmail.com",
      name: "Store Administrator",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
      phone: "+91 98765 43210",
      role: "admin",
      address: "YY Leathers, Khader Nawaz Khan Road, Nungambakkam, Chennai, Tamil Nadu - 600006",
      created_at: new Date().toISOString()
    },
    {
      id: "customer-id",
      email: "customer@example.com",
      name: "Rajesh Kumar",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
      phone: "+91 98400 12345",
      role: "customer",
      address: "12, TTK Road, Alwarpet, Chennai, Tamil Nadu - 600018",
      created_at: new Date().toISOString()
    }
  ],
  products: [
    {
      id: "prod-1021",
      name: "Leather Chelsea Boot for Men's - 1021",
      description: "VOGUISH Masterpiece. Hand-crafted premium high-ankle Chelsea boot featuring premium full-grain leather upper, sweat-wicking leather lining, durable double elasticated side gussets, front and back leather pull tabs, and a supportive cushioned heel step with dynamic anti-slip sole. Chennai's ultimate style icon.",
      price: 4999,
      category: "Boots",
      images: [
        "https://images.unsplash.com/photo-1634825212488-8b9f713e7104?q=80&w=600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?q=80&w=600&auto=format&fit=crop"
      ],
      is_new_arrival: true,
      is_best_seller: true,
      is_published: true,
      created_at: new Date().toISOString()
    },
    {
      id: "prod-1",
      name: "The Imperial Wingtip Derby",
      description: "Masterpiece derby crafted from full-grain French calfskin with hand-bushed mahogany patina. Hand-stitched wingtip brogue detailing, Blake welted construction with single-layer oak bark tanned leather sole. Chennai's peak bespoke shoe.",
      price: 18500,
      category: "Derby",
      images: [
        "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?q=80&w=600&auto=format&fit=crop"
      ],
      is_new_arrival: false,
      is_best_seller: true,
      is_published: true,
      created_at: new Date().toISOString()
    },
    {
      id: "prod-2",
      name: "The Royal Chelsea Boot",
      description: "Sleek, continuous single-piece leather cut Chelsea boot in rich Italian tan leather. Generous elasticated gussets, leather pull tabs, and robust storm-welted leather soles. Epitomizes royal elegance combined with modern durable craft.",
      price: 24000,
      category: "Boots",
      images: [
        "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1634825212488-8b9f713e7104?q=80&w=600&auto=format&fit=crop"
      ],
      is_new_arrival: true,
      is_best_seller: true,
      is_published: true,
      created_at: new Date().toISOString()
    },
    {
      id: "prod-3",
      name: "The Chennai Legacy Monkstraps",
      description: "Distinctive double-buckle monkstrap shoes using gold-burnished solid brass buckles. Tailored using premium locally tanned deep dark leather, presenting an exceptional dark sheen under sunlight. Fully customizable shoe depth and instep fit.",
      price: 19500,
      category: "Monkstrap",
      images: [
        "https://images.unsplash.com/photo-1614252304915-d36c53fc36d9?q=80&w=600&auto=format&fit=crop"
      ],
      is_new_arrival: false,
      is_best_seller: true,
      is_published: true,
      created_at: new Date().toISOString()
    },
    {
      id: "prod-4",
      name: "The Heirloom Oxford",
      description: "Unmatched formal elegance. Strict cap-toe oxford constructed on a custom high-arch royal last. Handmade detailing across blind eyelets and double-waxed braided corded laces. Rich tan finish matches custom designer drapes.",
      price: 16800,
      category: "Oxford",
      images: [
        "https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?q=80&w=600&auto=format&fit=crop"
      ],
      is_new_arrival: true,
      is_best_seller: false,
      is_published: true,
      created_at: new Date().toISOString()
    },
    {
      id: "prod-5",
      name: "The Estate Velvet Loafer",
      description: "Slip-on penny loafer incorporating supple full-grain chocolate brown suede. Unlined structure gives lightweight flexibility and supreme barefoot luxury feel. Hand-sewn apron stitching with customized heel counters.",
      price: 15500,
      category: "PENNY LOAFERS",
      images: [
        "https://images.unsplash.com/photo-1533867617858-e7b97e060509?q=80&w=600&auto=format&fit=crop"
      ],
      is_new_arrival: true,
      is_best_seller: false,
      is_published: true,
      created_at: new Date().toISOString()
    },
    {
      id: "prod-6",
      name: "Classic Leather Belt",
      description: "Premium full grain leather belt with solid brass buckle.",
      price: 2500,
      category: "BELT",
      images: [
        "https://images.unsplash.com/photo-1627092104085-f2adba578508?q=80&w=600&auto=format&fit=crop"
      ],
      is_new_arrival: true,
      is_best_seller: true,
      is_published: true,
      created_at: new Date().toISOString()
    },
    {
      id: "prod-7",
      name: "Minimalist Suede Mules",
      description: "Handcrafted suede mules for effortless style.",
      price: 9500,
      category: "MULES",
      images: [
        "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?q=80&w=600&auto=format&fit=crop"
      ],
      is_new_arrival: true,
      is_best_seller: false,
      is_published: true,
      created_at: new Date().toISOString()
    }
  ],
  orders: [
    {
      id: "YY-ORD-94812",
      user_id: "customer-id",
      customer_name: "Rajesh Kumar",
      customer_email: "customer@example.com",
      items: [
        {
          product: {
            id: "prod-1",
            name: "The Imperial Wingtip Derby",
            price: 18500,
            images: ["https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=600&auto=format&fit=crop"]
          },
          quantity: 1,
          selectedSize: "9"
        }
      ],
      total: 18500,
      status: "Delivered",
      address: "12, TTK Road, Alwarpet, Chennai, Tamil Nadu - 600018",
      razorpay_order_id: "order_mock_112233",
      razorpay_payment_id: "pay_mock_223344",
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  preorders: [
    {
      id: "YY-PRE-8105",
      user_id: "customer-id",
      name: "Rajesh Kumar",
      email: "customer@example.com",
      phone: "+91 98400 12345",
      style_desc: "Custom Crocodile-Embossed Wingtip Boots. Royal dark green color wanted with golden buckles.",
      image_urls: ["https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=600&auto=format&fit=crop"],
      size: "10",
      color: "Royal Forest Green & Mahogany",
      sole: "Double Red Dainite Rubber Sole",
      budget_range: "₹25,000 - ₹35,000",
      notes: "Please add extra memory foam premium inner cushions. Ensure fitting matches wide-toes sizing.",
      status: "Confirmed",
      admin_note: "Sourcing premium full-grain Italian calf crust. Confirmed to build onto custom extra-wide last. Hand dye process assigned.",
      estimated_delivery: "2026-07-15",
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  offers: [
    {
      id: "off-1",
      title: "Royal Mid-Summer Sovereign Offer",
      description: "Acquire our royal leather masterpiece footwear series with premium customization options. Earn complimentary aromatic cedar shoe trees with every order.",
      discount_percent: 15,
      banner_url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1200&auto=format&fit=crop",
      valid_until: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      is_active: true
    },
    {
      id: "off-2",
      title: "Heritage Collection Early Access",
      description: "First look at our new handmade collection. Sign up now and enjoy an exclusive discount on your next full-price purchase.",
      discount_percent: 25,
      banner_url: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=1200&auto=format&fit=crop",
      valid_until: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      is_active: true
    }
  ],
  content_blocks: [
    {
      id: "cb-about",
      key: "about",
      value: JSON.stringify({
        title: "The Legacy of YY Leathers",
        tagline: "Where Leather Meets Legacy — Bespoke Shoemakers",
        paragraphs: [
          "Nestled in the historical center of premium leather processing in Chennai, India, YY Leathers began as a humble atelier with a singular vision: to preserve the delicate art of hand-crafted footwear. Every pair that enters our workshop goes through 150 meticulous steps, from selecting pristine full-grain calf skins to the precise, patient double stitches of leather welt.",
          "We synthesize time-honored European Cordwaining techniques with native Indian shoe construction wisdom, fashioning masterwork shoes that last generations. Under the stewardship of master craftsmen, YY Leathers forms an iconic emblem of style, confidence, and uncompromising Indian heritage."
        ],
        founder: "Yogesh & Yashwanth (Master Shoemakers)",
        mission: "To offer Chennai the world's finest premium hand-crafted leather shoes, built strictly customized, and backed by our lifetime-grade circular Buy Back guarantee."
      })
    },
    {
      id: "cb-history",
      key: "history",
      value: JSON.stringify([
        { year: "Founding", title: "Atelier Foundation", desc: "First custom workshop opened in Chennai, offering bespoke fitting for royal dignitaries." },
        { year: "2002", title: "Masters' Union Creation", desc: "Built our Master Guild uniting third-generation shoemakers to define bespoke Indian design standards." },
        { year: "2010", title: "The Blake Handwelt Launch", desc: "Introduced our signature Blake-stitched single oak-bark sole model, bringing ultimate flexibility." },
        { year: "2018", title: "Circular Buy Back Scheme", desc: "Pioneered India's first organic shoe recycling pledge, buy-backs that refurbish worn items." },
        { year: "2026", title: "Digital Luxury Experience", desc: "Bringing bespoke royal ordering and premium pre-orders directly to national connoisseurs." }
      ])
    },
    {
      id: "cb-policies",
      key: "policies",
      value: JSON.stringify({
        returns: "If your customized ready-to-wear shoe doesn't fit beautifully, we provide a complimentary re-sizing and fit adjustment services within 14 days of delivery. For orders custom crafted to individual measures, returns are not eligible but full bespoke scaling and alteration support is provided by our Chennai shop.",
        privacy: "YY Leathers protects customer fit records and billing information under stringent data privacy. We do not distribute foot measurement blueprints or contact info to any marketing partner.",
        shipping: "Within Chennai, courier deliveries are scheduled with white-gloved specialists. For other tier-1 metros in India, standard shipping completes securely within 3-5 working days.",
        buyback: "Every authentic YY Leather pair qualifies for our circular restoration ecosystem. Depending on leather depth and structural preservation, we grant up to 20% of original price as store-credit coupon codes or instant cash support.",
        preorders: "Pre-order items represent bespoke crafting allocated individually. Handcraft cycles require 15-25 days from confirmation of physical sizing. Standard token non-refundable down-payment of 30% binds the reservation."
      })
    }
  ]
};

// Database read/write helpers
function loadDatabase(): Database {
  if (IS_SERVERLESS) {
    return initialDB;
  }
  if (!fs.existsSync(DB_FILE)) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDB, null, 2), 'utf8');
    } catch (err) {
      console.error("Failed to write seed db.json", err);
    }
    return initialDB;
  }
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to parse db.json, falling back to seed", error);
    return initialDB;
  }
}

// Background async sync to Supabase
async function syncToSupabase(key: string, value: any) {
  try {
    const { error } = await supabase
      .from('yy_store_sync')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    
    if (error) {
      if (error.code === '42P01') {
        console.warn(`[Supabase Sync] Table 'yy_store_sync' does not exist yet. Cloud sync will operate when table is created.`);
      } else {
        console.error(`[Supabase Sync] Error syncing key '${key}':`, error);
      }
    } else {
      console.log(`[Supabase Sync] Synced key '${key}' successfully to cloud Supabase.`);
    }
  } catch (err) {
    console.error(`[Supabase Sync] Network failed for '${key}':`, err);
  }
}

// TTL guard: prevent re-pulling Supabase data more than once per 2 minutes (critical for serverless)
// Each Netlify function invocation is a cold start — without this guard, EVERY request downloads all data.
let lastPullTime = 0;
const PULL_COOLDOWN_MS = IS_SERVERLESS ? 120_000 : 300_000; // 2 min serverless, 5 min local

// Global pull on startup
async function pullFromSupabase() {
  // EGRESS FIX: Don't re-pull if we pulled recently (critical for serverless cold starts)
  const now = Date.now();
  if (now - lastPullTime < PULL_COOLDOWN_MS) {
    console.log(`[Supabase Sync] Skipping pull — last pull was ${Math.round((now - lastPullTime)/1000)}s ago (cooldown: ${PULL_COOLDOWN_MS/1000}s)`);
    return true; // Treat as success — data is fresh enough
  }
  
  console.log("[Supabase Sync] Pulling from Supabase...");
  try {
    // EGRESS FIX: Exclude orders/preorders from public pull — admin panel fetches those separately
    // orders and preorders can be 100s of KB and are NOT needed on every API request
    const { data, error } = await supabase
      .from('yy_store_sync')
      .select('key, value')
      .in('key', ['products', 'offers', 'content_blocks', 'custom_categories']);
    
    if (error) {
      if (error.code === '42P01') {
        console.warn("[Supabase Sync] 'yy_store_sync' table missing. Using local db.json.");
        lastPullTime = now; // Don't retry immediately
        return false;
      }
      console.error("[Supabase Sync] Pull error:", error);
      return false;
    }

    if (data && data.length > 0) {
      console.log(`[Supabase Sync] Merging ${data.length} keys from Supabase.`);
      const tempDb = { ...db };
      let anyMerged = false;
      for (const row of data) {
        if (row.key in tempDb) {
          (tempDb as any)[row.key] = row.value;
          anyMerged = true;
        }
      }
      if (anyMerged) {
        db = tempDb;
        // Update password cache if content_blocks were updated
        if (db.content_blocks && Array.isArray(db.content_blocks)) {
          const pwBlock = db.content_blocks.find((cb: any) => cb.key === 'admin_password');
          if (pwBlock?.value) cachedAdminPassword = pwBlock.value;
        }
        // Cache to local filesystem (Only if not serverless)
        if (!IS_SERVERLESS) {
          try {
            fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
          } catch (err) {
            console.error("Failed to write updated db.json", err);
          }
        }
        lastPullTime = now;
        return true;
      }
    } else {
      console.log("[Supabase Sync] Supabase table is empty. Pre-seeding Supabase with ALL local data...");
      const keysToSync: Array<keyof Database> = ['products', 'offers', 'content_blocks', 'orders', 'preorders', 'profiles', 'custom_categories', 'hero_slides'];
      for (const key of keysToSync) {
        await syncToSupabase(key, db[key]);
      }
    }
    lastPullTime = now;
  } catch (err) {
    console.error("[Supabase Sync] Connection error during initial restore:", err);
  }
  return false;
}

async function saveDatabase(newDb: Database, changedKey?: string) {
  try {
    db = newDb;
    
    if (!IS_SERVERLESS) {
      // In local dev, write to file
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
    }
    
    // KEY OPTIMIZATION: Only sync the changed key, NOT all 6 collections on every mutation.
    // This prevents re-uploading everything when only one field changes.
    const keysToSync: Array<keyof Database> = changedKey 
      ? [changedKey as keyof Database]
      : ['profiles', 'products', 'orders', 'preorders', 'offers', 'content_blocks'];
      
    await Promise.all(keysToSync.map(key => 
      syncToSupabase(String(key), db[key]).catch(err => {
        console.error(`[Supabase Sync] Failed to sync '${key}':`, err);
      })
    ));
  } catch (error) {
    console.error("Failed to save database", error);
  }
}

// Ensure database is initialized
let db = loadDatabase();

// Synchronous password cache - initialized at startup
let cachedAdminPassword: string | null = null;

// Initialize password cache synchronously on startup
function initializePasswordCache() {
  // Try to get password synchronously from local DB first
  try {
    if (db && db.content_blocks && Array.isArray(db.content_blocks)) {
      const contentBlock = db.content_blocks.find((cb: any) => cb.key === 'admin_password');
      if (contentBlock && contentBlock.value) {
        cachedAdminPassword = contentBlock.value;
        console.log('[Auth] Initialized password cache from local DB');
        return;
      }
    }
  } catch (e) {
    console.error('Error reading admin password from local DB:', e);
  }
  
  // Fallback to environment variable
  const envPass = process.env.VITE_ADMIN_PASSWORD || process.env.VITE_DATABASE_PASSWORD;
  if (envPass) {
    cachedAdminPassword = envPass;
    console.log('[Auth] Initialized password cache from environment variable');
    return;
  }
  
  // Final fallback to default
  cachedAdminPassword = "chennaileather2026";
  console.log('[Auth] Initialized password cache with default password');
}

// Update password cache whenever it's changed
async function invalidatePasswordCache() {
  cachedAdminPassword = null;
}

// EGRESS FIX: In serverless, use the TTL-guarded pullFromSupabase() instead of a simple boolean flag.
// The old boolean flag reset to false on every cold start, causing a full Supabase download per request.
app.use(async (req, res, next) => {
  if (req.url.startsWith('/.netlify/functions/api')) {
    req.url = req.url.replace('/.netlify/functions/api', '/api');
  }
  
  // In serverless mode, pullFromSupabase() is TTL-guarded internally (2 min cooldown)
  // It will skip the actual fetch if data was pulled recently
  if (IS_SERVERLESS && req.url.startsWith('/api')) {
    try {
      await pullFromSupabase();
    } catch (e) {
      console.error("Serverless Supabase pull failed", e);
    }
  }
  next();
});

// API Endpoints

// ---------------- AUTH / PROFILES ----------------
app.post('/api/auth/verify-password', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ valid: false, error: 'Email and password required' });
  }
  
  const normalizedPassword = (password || '').trim();
  
  const isAdmin = ADMIN_EMAILS.some(
    adminEmail => adminEmail.toLowerCase() === email.toLowerCase()
  );
  
  if (!isAdmin) {
    return res.status(403).json({ valid: false, error: 'Not an admin email' });
  }
  
  // STEP 1: Check env var first (zero Supabase cost)
  const envPass = process.env.VITE_ADMIN_PASSWORD || process.env.VITE_DATABASE_PASSWORD;
  if (envPass && normalizedPassword === envPass) {
    return res.json({ valid: true });
  }
  
  // STEP 2: Check in-memory cache
  if (cachedAdminPassword && normalizedPassword === cachedAdminPassword) {
    return res.json({ valid: true });
  }
  
  // STEP 3: Check local database
  try {
    if (db && db.content_blocks && Array.isArray(db.content_blocks)) {
      const contentBlock = db.content_blocks.find((cb: any) => cb.key === 'admin_password');
      if (contentBlock && contentBlock.value && normalizedPassword === contentBlock.value) {
        cachedAdminPassword = contentBlock.value;
        return res.json({ valid: true });
      }
    }
  } catch (e) {
    console.error('Error checking admin password in DB:', e);
  }
  
  // STEP 4: Check Supabase (only when password was changed via admin UI)
  try {
    const { data, error } = await supabase
      .from('yy_store_sync')
      .select('value')
      .eq('key', 'content_blocks')
      .single();
    
    if (!error && data?.value && Array.isArray(data.value)) {
      const supabaseBlock = data.value.find((cb: any) => cb.key === 'admin_password');
      if (supabaseBlock && supabaseBlock.value && normalizedPassword === supabaseBlock.value) {
        cachedAdminPassword = supabaseBlock.value;
        return res.json({ valid: true });
      }
    }
  } catch (supabaseError) {
    console.error('Error checking Supabase password:', supabaseError);
  }
  
  // STEP 5: Absolute hardcoded fallback — default password always works if no custom password set
  const HARDCODED_DEFAULT = "chennaileather2026";
  if (normalizedPassword === HARDCODED_DEFAULT) {
    const customPasswordSet = cachedAdminPassword && cachedAdminPassword !== HARDCODED_DEFAULT;
    if (!customPasswordSet) {
      return res.json({ valid: true });
    }
  }
  
  return res.status(401).json({ valid: false, error: 'Invalid password' });
});

app.get('/api/auth/profile/:email', (req, res) => {
  const { email } = req.params;
  const user = db.profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
  if (user) {
    return res.json(user);
  }
  // Create an on-the-fly customer if profile not found
  const newProfile = {
    id: `cust-${Date.now()}`,
    email: email.toLowerCase(),
    name: email.split('@')[0].toUpperCase(),
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop",
    phone: "",
    role: "customer",
    address: "",
    created_at: new Date().toISOString()
  };
  db.profiles.push(newProfile);
  saveDatabase(db, 'profiles');
  res.json(newProfile);
});

app.post('/api/auth/profile', (req, res) => {
  const updatedProfile = req.body;
  const index = db.profiles.findIndex(p => p.email.toLowerCase() === updatedProfile.email.toLowerCase());
  if (index !== -1) {
    db.profiles[index] = { ...db.profiles[index], ...updatedProfile };
  } else {
    updatedProfile.id = updatedProfile.id || `cust-${Date.now()}`;
    updatedProfile.role = updatedProfile.role || 'customer';
    updatedProfile.created_at = new Date().toISOString();
    db.profiles.push(updatedProfile);
  }
  saveDatabase(db, 'profiles');
  res.json({ success: true, profile: db.profiles.find(p => p.email.toLowerCase() === updatedProfile.email.toLowerCase()) });
});




// ---------------- PRODUCTS ----------------
app.get('/api/products', (req, res) => {
  res.json(db.products);
});

app.post('/api/products', authenticateAdmin, (req, res) => {
  const newProduct = req.body;
  newProduct.id = `prod-${Date.now()}`;
  newProduct.created_at = new Date().toISOString();
  // Set default values if empty
  newProduct.images = newProduct.images?.length ? newProduct.images : ["https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=600&auto=format&fit=crop"];
  newProduct.price = Number(newProduct.price) || 12000;
  newProduct.is_new_arrival = !!newProduct.is_new_arrival;
  newProduct.is_best_seller = !!newProduct.is_best_seller;
  newProduct.is_published = newProduct.is_published !== false;

  db.products.unshift(newProduct);
  saveDatabase(db, 'products');
  res.json({ success: true, product: newProduct });
});

app.put('/api/products/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  const index = db.products.findIndex(p => p.id === id);
  if (index !== -1) {
    db.products[index] = { ...db.products[index], ...updatedData, id };
    saveDatabase(db, 'products');
    return res.json({ success: true, product: db.products[index] });
  }
  res.status(404).json({ success: false, message: "Footwear not found." });
});

app.delete('/api/products/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const initialCount = db.products.length;
  db.products = db.products.filter(p => p.id !== id);
  if (db.products.length < initialCount) {
    saveDatabase(db, 'products');
    return res.json({ success: true });
  }
  res.status(404).json({ success: false, message: "Product not found." });
});


// ---------------- ORDERS ----------------
app.get('/api/orders', async (req, res) => {
  // If local db has no orders, pull from Supabase (localhost dev scenario)
  // This lets you see live orders from the Netlify deployment on your local machine
  if (!db.orders || db.orders.length === 0) {
    try {
      console.log('[Orders] Local db has no orders — pulling from Supabase...');
      const { data, error } = await supabase
        .from('yy_store_sync')
        .select('value')
        .eq('key', 'orders')
        .single();
      if (!error && data?.value && Array.isArray(data.value) && data.value.length > 0) {
        db.orders = data.value;
        // Cache to local db.json so subsequent requests are instant
        if (!IS_SERVERLESS) {
          try { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8'); } catch {}
        }
        console.log(`[Orders] Synced ${db.orders.length} orders from Supabase.`);
      }
    } catch (e) {
      console.warn('[Orders] Could not pull orders from Supabase:', e);
    }
  }
  res.json(db.orders);
});

// Admin: force-sync orders from Supabase (useful for localhost to see live orders)
app.get('/api/orders/sync-from-supabase', authenticateAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('yy_store_sync')
      .select('value')
      .eq('key', 'orders')
      .single();
    if (!error && data?.value && Array.isArray(data.value)) {
      db.orders = data.value;
      if (!IS_SERVERLESS) {
        try { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8'); } catch {}
      }
      return res.json({ success: true, count: db.orders.length, message: `Synced ${db.orders.length} orders from Supabase.` });
    }
    res.json({ success: false, message: 'No orders in Supabase or fetch failed.', error });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get('/api/orders/user/:userId', async (req, res) => {
  const { userId } = req.params;
  let currentOrders = db.orders;
  
  if (IS_SERVERLESS) {
    const { data } = await supabase.from('yy_store_sync').select('value').eq('key', 'orders').single();
    if (data?.value) {
      currentOrders = data.value;
      db.orders = currentOrders;
    }
  }
  
  const userOrders = currentOrders.filter((o: any) => o.user_id === userId);
  res.json(userOrders);
});

app.post('/api/orders', async (req, res) => {
  // Allow public to create orders (customers)
  const { 
    user_id, items, total, address, phone, customer_name, customer_email, 
    razorpay_order_id, razorpay_payment_id, 
    delivery_region, delivery_charge, estimated_weight_kg,
    student_discount_requested, student_discount_details,
    birthday_benefit_requested, birthday_benefit_details,
    buyback_requested, buyback_details,
    applied_offer,
    is_admin_free_order, admin_password
  } = req.body;
  
  if (is_admin_free_order) {
    const adminEmailsStr = process.env.VITE_ADMIN_EMAILS || 'dhwaraganwebsite@gmail.com,yomeyom786@gmail.com';
    const allowedEmails = adminEmailsStr.split(',').map(e => e.trim().toLowerCase());
    
    if (!allowedEmails.includes(customer_email?.toLowerCase())) {
      return res.status(403).json({ success: false, message: 'Only admins can place free orders' });
    }
    
    const correctPassword = process.env.VITE_ADMIN_PASSWORD || 'YYLeathers@SecureAdmin2026!';
    if (admin_password !== correctPassword) {
      return res.status(401).json({ success: false, message: 'Invalid Admin Password' });
    }
  }
  
  const newOrder = {
    id: `YY-ORD-${Math.floor(10000 + Math.random() * 90000)}`,
    user_id,
    customer_name,
    customer_email,
    phone: phone || '',
    items,
    total: is_admin_free_order ? 0 : total,
    status: "Ordered",
    address,
    razorpay_order_id: is_admin_free_order ? 'admin_free_order' : (razorpay_order_id || `order_rp_${Date.now()}`),
    razorpay_payment_id: is_admin_free_order ? 'admin_free_order' : (razorpay_payment_id || `pay_rp_${Date.now()}`),
    delivery_region: delivery_region || 'TN',
    delivery_charge: is_admin_free_order ? 0 : (delivery_charge || 0),
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
  
  if (IS_SERVERLESS) {
    try {
      const { data } = await supabase.from('yy_store_sync').select('value').eq('key', 'orders').single();
      if (data?.value && Array.isArray(data.value)) {
        db.orders = data.value;
      }
    } catch (e) {
      console.error('Failed to pull orders before POST:', e);
    }
  }
  
  db.orders.unshift(newOrder);
  await saveDatabase(db, 'orders');
  res.json({ success: true, order: newOrder });
});

app.put('/api/orders/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  
  // In serverless, always fetch the latest to avoid overwriting concurrent orders
  if (IS_SERVERLESS) {
    const { data } = await supabase.from('yy_store_sync').select('value').eq('key', 'orders').single();
    if (data?.value) db.orders = data.value;
  }
  
  const index = db.orders.findIndex(o => o.id === id);
  if (index !== -1) {
    // Merge all fields from the request body (status, buyback_details, total, etc.)
    db.orders[index] = { ...db.orders[index], ...req.body };
    await saveDatabase(db, 'orders');
    return res.json({ success: true, order: db.orders[index] });
  }
  res.status(404).json({ success: false, message: "Order records not found." });
});

app.delete('/api/orders/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  
  if (IS_SERVERLESS) {
    const { data } = await supabase.from('yy_store_sync').select('value').eq('key', 'orders').single();
    if (data?.value) db.orders = data.value;
  }
  
  const index = db.orders.findIndex(o => o.id === id);
  if (index !== -1) {
    db.orders.splice(index, 1);
    await saveDatabase(db, 'orders');
    return res.json({ success: true, message: "Order deleted successfully" });
  }
  res.status(404).json({ success: false, message: "Order not found" });
});


// ---------------- RAZORPAY INTEGRATION ----------------
app.post('/api/razorpay/create-order', async (req, res) => {
  try {
    const { amount, receipt } = req.body;
    
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'A valid payment amount is required.' });
    }

    const options = {
      amount: Math.round(Number(amount) * 100), // Amount in paise
      currency: "INR",
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error: any) {
    console.error('Razorpay order creation failed:', error);
    res.status(500).json({ error: error.message || 'Unable to create Razorpay order.' });
  }
});

app.post('/api/razorpay/verify-payment', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification parameters.' });
    }

    // Generate expected signature using HMAC SHA256
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(body.toString())
      .digest('hex');

    const isSignatureValid = expectedSignature === razorpay_signature;

    if (isSignatureValid) {
      res.json({ status: 'ok', verified: true, payment_id: razorpay_payment_id, order_id: razorpay_order_id });
    } else {
      res.status(400).json({ status: 'error', verified: false, message: 'Invalid payment signature.' });
    }
  } catch (error: any) {
    console.error('Payment verification failed:', error);
    res.status(500).json({ error: error.message || 'Payment verification failed.' });
  }
});

app.post('/api/razorpay/webhook', (req, res) => {
  // Webhook confirmation update
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.warn('RAZORPAY_WEBHOOK_SECRET not configured. Skipping webhook verification.');
    return res.json({ status: "ok", message: "Webhook received (no verification configured)." });
  }

  const expectedSignature = req.headers['x-razorpay-signature'] as string;
  if (!expectedSignature) {
    return res.status(400).json({ status: "error", message: "Missing signature header." });
  }

  try {
    const body = JSON.stringify(req.body);
    const expectedSig = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (expectedSig !== expectedSignature) {
      return res.status(400).json({ status: "error", message: "Invalid webhook signature." });
    }

    const event = req.body.event;
    if (event === 'payment.captured' || event === 'order.paid') {
      const payment = req.body.payload?.payment?.entity;
      const orderEntity = req.body.payload?.order?.entity;
      
      if (payment && orderEntity) {
        // Create and save the order
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
        db.orders.unshift(newOrder);
        saveDatabase(db, 'orders');
        console.log('Order saved from Razorpay webhook:', newOrder);
      }
    }

    res.json({ status: "ok" });
  } catch (error: any) {
    console.error('Webhook processing failed:', error);
    res.status(500).json({ status: "error", message: error.message });
  }
});


// ---------------- PRE-ORDERS ----------------
app.get('/api/preorders', (req, res) => {
  res.json(db.preorders);
});

app.get('/api/preorders/user/:userId', async (req, res) => {
  const { userId } = req.params;
  let currentPreorders = db.preorders;
  
  if (IS_SERVERLESS) {
    const { data } = await supabase.from('yy_store_sync').select('value').eq('key', 'preorders').single();
    if (data?.value) {
      currentPreorders = data.value;
      db.preorders = currentPreorders;
    }
  }
  
  const userPreorders = currentPreorders.filter((p: any) => p.user_id === userId);
  res.json(userPreorders);
});

app.post('/api/preorders', (req, res) => {
  const preorderData = req.body;
  preorderData.id = `YY-PRE-${Math.floor(1000 + Math.random() * 9000)}`;
  preorderData.status = "Under Review";
  preorderData.created_at = new Date().toISOString();
  preorderData.image_urls = preorderData.image_urls || ["https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=600&auto=format&fit=crop"];

  db.preorders.unshift(preorderData);
  saveDatabase(db, 'preorders');
  res.json({ success: true, preorder: preorderData });
});

app.put('/api/preorders/:id', async (req, res) => {
  const { id } = req.params;
  const { status, admin_note, estimated_delivery } = req.body;
  
  if (IS_SERVERLESS) {
    const { data } = await supabase.from('yy_store_sync').select('value').eq('key', 'preorders').single();
    if (data?.value) db.preorders = data.value;
  }
  
  const index = db.preorders.findIndex(p => p.id === id);
  if (index !== -1) {
    if (status) db.preorders[index].status = status;
    if (admin_note !== undefined) db.preorders[index].admin_note = admin_note;
    if (estimated_delivery !== undefined) db.preorders[index].estimated_delivery = estimated_delivery;
    saveDatabase(db, 'preorders');
    return res.json({ success: true, preorder: db.preorders[index] });
  }
  res.status(404).json({ success: false, message: "Pre-order records not found." });
});


// ---------------- OFFERS ----------------
app.get('/api/offers', (req, res) => {
  res.json(db.offers);
});

app.post('/api/offers', authenticateAdmin, (req, res) => {
  const newOffer = req.body;
  newOffer.id = `off-${Date.now()}`;
  newOffer.is_active = newOffer.is_active !== false;
  newOffer.discount_percent = Number(newOffer.discount_percent) || 10;
  newOffer.banner_url = newOffer.banner_url || "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1200 auto=format&fit=crop";

  db.offers.unshift(newOffer);
  saveDatabase(db, 'offers');
  res.json({ success: true, offer: newOffer });
});

app.delete('/api/offers/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  db.offers = db.offers.filter(o => o.id !== id);
  saveDatabase(db, 'offers');
  res.json({ success: true });
});


// ---------------- CONTENT BLOCKS ----------------
app.get('/api/content-blocks', (req, res) => {
  res.json(db.content_blocks);
});

// Generic store-sync key-value save endpoint to bypass RLS issues on client
app.post('/api/admin/store-sync/:key', authenticateAdmin, async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  try {
    if (key in db) {
      (db as any)[key] = value;
      saveDatabase(db, key);
    } else {
      await syncToSupabase(key, value);
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error(`Error syncing key '${key}':`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/content-blocks', authenticateAdmin, (req, res) => {
  const { key, value } = req.body;
  const index = db.content_blocks.findIndex(cb => cb.key === key);
  if (index !== -1) {
    db.content_blocks[index].value = typeof value === 'object' ? JSON.stringify(value) : value;
  } else {
    db.content_blocks.push({
      id: `cb-${key}`,
      key,
      value: typeof value === 'object' ? JSON.stringify(value) : value
    });
  }
  saveDatabase(db, 'content_blocks');
  res.json({ success: true, content_blocks: db.content_blocks });
});


// ---------------- CHATBOT ----------------
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API Key is not configured." });
    }

    const systemInstruction = `You are the official AI Customer Support Assistant for YY Leathers, a premium leather goods brand. Your goal is to provide helpful, polite, and concise support to customers browsing the website or looking at their profiles.

### Tone & Style:
- Professional, welcoming, and premium yet approachable.
- Keep answers short and direct (1-3 sentences maximum per response) so it fits well inside a compact web chat widget.
- Use bullet points if listing steps or multiple items.

### Core Knowledge Base & App Navigation:
1. About YY Leathers: We specialize in high-quality leather products, including men's collections, new arrivals, and custom pre-orders.
2. Offline Store & Location: We have an offline flagship store and workshop located in Surapet, Chennai. Customers can visit us to experience our leather goods firsthand.
3. Our Collections: We feature categories such as "Best Sellers" and "New Arrivals". Users can find these directly on the "Shop" page.
4. Ordering: Customers can place standard Orders (shipped online) or Pre-orders (for store reservations or custom pickups). 
5. Order Tracking: Customers can check their order status, past purchases, or active pre-orders by clicking on the Profile icon (top right or bottom navigation) and selecting the "My Orders" or "Store Reservations" tab.
6. Browsing & Filtering: On the Shop page, users can filter by categories (Shoes, Bags, Belts), collections (Best Sellers, New Arrivals), or sort products by price (Low to High, High to Low).

### Guiding the User:
- If a user asks where to find something, give them exact instructions (e.g., "Go to the Shop page and use the Sort by Price option at the top" or "Click the Profile icon and navigate to 'My Orders'").

### Guardrails & Hand-off Rules:
- If a user asks about a specific order status or personal account issue, remind them to log in and check their Profile, or offer human support.
- If a customer asks a question outside of product details, store policies, or order support, politely guide them back to the topic.
- If you do not know the answer, say: "I'm sorry I can't resolve this right now. Please leave your email address and order number, and a human support representative will get back to you shortly."`;

    const ai = getAi();
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      history: history, // array of { role: 'user' | 'model', parts: [{text: string}] }
      config: {
        systemInstruction: systemInstruction,
      },
    });

    const response = await chat.sendMessage({ message });
    res.json({ response: response.text });
  } catch (err: any) {
    console.error("Chat Error:", err);
    
    // Optional: Return a highly visible error code if it's a rate limit
    if (err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("Quota")) {
      return res.status(429).json({ error: "AI service is currently busy. Please try again later." });
    }

    res.status(500).json({ error: "Failed to process chat message." });
  }
});


// ---------------- SUPABASE CLOUD STATUS & DIAGNOSTICS ----------------
app.get('/api/supabase-status', async (req, res) => {
  try {
    const start = Date.now();
    const { data, error } = await supabase
      .from('yy_store_sync')
      .select('key, updated_at')
      .limit(10);
    
    const latency = Date.now() - start;
    
    if (error) {
      if (error.code === '42P01') {
        return res.json({
          configured: true,
          connected: true,
          table_exists: false,
          supabase_url: SUPABASE_URL,
          error: "Table 'yy_store_sync' does not exist in your Supabase schema.",
          sql_migration: `CREATE TABLE IF NOT EXISTS yy_store_sync (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS) to secure or open up client access
ALTER TABLE yy_store_sync ENABLE ROW LEVEL SECURITY;

-- Allow unrestricted anonymous select and write access for key-value records
CREATE POLICY "Allow anon read" ON yy_store_sync FOR SELECT USING (true);
CREATE POLICY "Allow anon upsert" ON yy_store_sync FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON yy_store_sync FOR UPDATE USING (true);
`
        });
      }
      return res.json({
        configured: true,
        connected: false,
        table_exists: false,
        supabase_url: SUPABASE_URL,
        error: error.message
      });
    }

    return res.json({
      configured: true,
      connected: true,
      table_exists: true,
      supabase_url: SUPABASE_URL,
      latency_ms: latency,
      records: data
    });

  } catch (err: any) {
    res.json({
      configured: true,
      connected: false,
      table_exists: false,
      supabase_url: SUPABASE_URL,
      error: err.message || String(err)
    });
  }
});

app.post('/api/supabase-sync/push', authenticateAdmin, async (req, res) => {
  try {
    const keys: Array<keyof Database> = ['profiles', 'products', 'orders', 'preorders', 'offers', 'content_blocks'];
    let successCount = 0;
    
    for (const key of keys) {
      const { error } = await supabase
        .from('yy_store_sync')
        .upsert({ key, value: db[key], updated_at: new Date().toISOString() }, { onConflict: 'key' });
      if (!error) {
        successCount++;
      } else {
        console.error(`[Manual Sync Push] Error pushing '${key}':`, error);
      }
    }
    
    res.json({ success: true, message: `Pushed ${successCount} collections to Supabase Cloud.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/supabase-sync/pull', authenticateAdmin, async (req, res) => {
  try {
    const ok = await pullFromSupabase();
    if (ok) {
      res.json({ success: true, message: "Successfully synchronized and pulled fresh state from Supabase Cloud." });
    } else {
      res.status(400).json({ success: false, message: "Failed to pull state. Please run SQL migration script to construct 'yy_store_sync' table." });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Invalidate admin password cache (called when password is changed)
app.post('/api/admin/invalidate-password-cache', authenticateAdmin, async (req, res) => {
  try {
    await invalidatePasswordCache();
    res.json({ success: true, message: "Password cache invalidated" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// Catch-all for missing API routes to return JSON instead of Vite HTML string
app.all('/api/*', (req, res) => {
  res.status(404).json({ success: false, error: 'API route not found' });
});

// Vite Dev vs Prod deployment routing
async function startServer() {
  // Initialize password cache synchronously
  initializePasswordCache();
  
  // Sync state from Supabase on launch (TTL-guarded — won't double-pull)
  // Note: pullFromSupabase() has a 5-minute cooldown for local dev
  try {
    await pullFromSupabase();
  } catch (e) {
    console.error("Initial Supabase cloud state restore pass skipped.", e);
  }

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        watch: {
          ignored: ['**/db.json']
        }
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (IS_SERVERLESS) {
    // If running in Netlify Functions, don't start the listener.
    // The wrapper will handle routing.
  } else {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`YY Leathers Server listening on host 0.0.0.0 port ${PORT}`);
    });
  }
}

if (!IS_SERVERLESS) {
  startServer();
} else {
  // Serverless environment: initialize password cache on file import
  // NOTE: pullFromSupabase() is called per-request in the middleware above, with TTL guard.
  // We do NOT call it here again to avoid double-download on the first request.
  initializePasswordCache();
}

export default app;