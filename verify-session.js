// Vercel serverless function — GET /api/verify-session?session_id=...
// Confirms a Stripe Checkout Session's payment status after the customer
// is redirected back to the order confirmation page.

import Stripe from 'stripe';

export default async function handler(req, res) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'STRIPE_SECRET_KEY is not set on the server' });
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ error: 'Missing session_id' });

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    return res.status(200).json({
      paid: session.payment_status === 'paid',
      amount_total: session.amount_total,
      currency: session.currency,
      customer_email: session.customer_details?.email || null,
      orderId: session.metadata?.orderId || null,
    });
  } catch (err) {
    console.error('verify-session error:', err);
    return res.status(500).json({ error: err.message });
  }
}
