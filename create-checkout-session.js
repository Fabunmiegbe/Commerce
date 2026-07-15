// Vercel serverless function — POST /api/create-checkout-session
// Requires the STRIPE_SECRET_KEY environment variable to be set in your
// Vercel project settings (Project → Settings → Environment Variables).
// Uses Stripe Checkout in redirect mode, so no card data ever touches
// your own server or client code.

import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'STRIPE_SECRET_KEY is not set on the server' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const { items, orderId, successUrl, cancelUrl } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items provided' });
    }
    if (!successUrl || !cancelUrl) {
      return res.status(400).json({ error: 'Missing successUrl or cancelUrl' });
    }

    const line_items = items.map((i) => ({
      price_data: {
        currency: 'usd',
        product_data: { name: `${i.name}${i.color ? ' — ' + i.color : ''}${i.size ? ', ' + i.size : ''}` },
        unit_amount: Math.round(Number(i.price) * 100),
      },
      quantity: Math.max(1, Number(i.qty) || 1),
    }));

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { orderId: orderId || '' },
    });

    return res.status(200).json({ url: session.url, id: session.id });
  } catch (err) {
    console.error('create-checkout-session error:', err);
    return res.status(500).json({ error: err.message });
  }
}
