# setup

The storefront (`atelier-noir.html`) works standalone with no setup: cart,
wishlist and login run in memory. Follow the steps below to make auth,
cart persistence and Stripe checkout real.

## 1. Firebase (auth + cart/wishlist/order persistence)

1. Go to the [Firebase console](https://console.firebase.google.com) →
   create a project (or reuse an existing one, e.g. your `arc-9a1e1`
   project if you'd rather not spin up a new one).
2. **Build → Authentication → Get started → Sign-in method** → enable
   **Email/Password**.
3. **Build → Firestore Database → Create database** → start in
   production mode, pick a region.
4. **Project settings → General → Your apps → Add app → Web** → copy the
   `firebaseConfig` object.
5. Open `atelier-noir.html`, find the `firebaseConfig` object near the
   top of the first `<script type="module">` block, and paste your real
   values in. That's the only edit required — the file detects real
   config automatically and switches from local-only demo mode to live
   Firebase.
6. Deploy the security rules in `firestore.rules`:
   ```
   npm install -g firebase-tools
   firebase login
   firebase init firestore   # point it at this folder, use the existing firestore.rules
   firebase deploy --only firestore:rules
   ```

Once configured: registering/logging in creates a `users/{uid}` doc,
and the cart/wishlist sync to `carts/{uid}` and `wishlists/{uid}` on
every change. Orders are written to `orders/{orderId}` on checkout.

## 2. Stripe (real card checkout)

The two files in `api/` are Vercel serverless functions — Vercel picks
up any `.js` file under `api/` automatically, no framework required.

1. Get your secret key from the
   [Stripe dashboard](https://dashboard.stripe.com/apikeys) (`sk_test_…`
   while testing).
2. In your Vercel project: **Settings → Environment Variables** → add
   `STRIPE_SECRET_KEY` with that value → redeploy.
3. Deploy this whole folder to Vercel (the static `atelier-noir.html` —
   rename it to `index.html` if you want it at the root — plus
   `api/create-checkout-session.js`, `api/verify-session.js`, and
   `package.json` so Vercel installs the `stripe` package).
4. On checkout, selecting "Stripe (Card)" now creates a real Checkout
   Session and redirects to Stripe's hosted payment page. On return, the
   confirmation page calls `/api/verify-session` to confirm payment
   status.

If `STRIPE_SECRET_KEY` isn't set, or the site is opened as a plain
static file without the `api/` functions deployed, checkout gracefully
falls back to the demo confirmation flow instead of breaking.

## 3. Still UI-only

PayPal, Apple Pay, Google Pay, Flutterwave and Paystack are selectable
in checkout but not wired to a real processor yet — same pattern as
Stripe above (each needs its own server-side session/order creation
call with its own API keys). The admin dashboard is a shell with sample
data; wiring it to live Firestore data (products as a real collection,
CRUD, uploads) is a good next step once the storefront is live.

