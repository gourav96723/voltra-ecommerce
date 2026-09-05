Voltra — Full-Stack E-Commerce Platform

Internship Project — Uptricks Pvt. Ltd.
This e-commerce platform was developed as part of my Web Development internship at Uptricks Pvt. Ltd. The project was built as a practical, full-stack industry-oriented application covering customer shopping flows, authentication, product/catalog management, cart and checkout, order management, and an admin dashboard.

A production-architected e-commerce platform: React 19 + Vite + Tailwind CSS v4 on the frontend, Node.js + Express + MongoDB on the backend, with Razorpay payments and Cloudinary image hosting wired in (both optional at boot).

Read this before you deploy: the "Verified vs. Needs Credentials vs. Blocked" section near the bottom tells you exactly what has been tested end-to-end in this environment and what still needs a real database/payment/image account on your side.

1. Project Structure

ecommerce-project/
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── assets/
│   │   ├── components/     # ui/, product/, layout/, cart/, admin/, checkout/
│   │   ├── pages/          # public pages + account/ + admin/
│   │   ├── layouts/        # MainLayout, AccountLayout, AdminLayout
│   │   ├── context/        # Auth, Cart, Wishlist, Toast
│   │   ├── hooks/
│   │   ├── services/       # axios API clients, one file per resource
│   │   ├── utils/
│   │   ├── constants/
│   │   └── routes/         # route guards
│   ├── vercel.json
│   └── package.json
│
├── server/                 # Node + Express + MongoDB backend
│   ├── config/              # db, cloudinary, razorpay
│   ├── controllers/
│   ├── middleware/          # auth, error handling, validation, security
│   ├── models/               # User, Product, Category, Cart, Wishlist, Order, Review
│   ├── routes/
│   ├── validators/           # Zod schemas
│   ├── utils/
│   ├── seed/seed.js
│   └── package.json
│
├── package.json             # convenience scripts for the whole repo
├── .gitignore
└── README.md

2. Tech Stack

Layer

Technology

Frontend

React, Vite, React Router, Tailwind CSS v4, Axios, React Hook Form + Zod, Lucide React, Recharts

Backend

Node.js, Express, Mongoose

Database

MongoDB

Auth

JWT in httpOnly cookies, bcrypt password hashing, role-based authorization

Payments

Razorpay (Orders API + signature verification)

Images

Cloudinary

Security

Helmet, CORS, rate limiting, mongo-sanitize, xss-clean, Zod input validation

3. Local Setup

Prerequisites

Node.js 18+

A MongoDB instance — either installed locally, or a free MongoDB Atlas cluster

Steps

# 1. Install dependencies for both apps
npm run install:all

# 2. Configure the backend
cd server
cp .env.example .env
# Edit .env: at minimum set MONGODB_URI and JWT_SECRET.
# RAZORPAY_* and CLOUDINARY_* can stay blank — those features degrade
# gracefully (COD still works without Razorpay; you can paste image
# URLs by hand in the admin panel without Cloudinary).

# 3. Configure the frontend
cd ../client
cp .env.example .env
# Default already points to http://localhost:5000/api

# 4. Start MongoDB (skip if using Atlas)
mongod --dbpath /path/to/your/db

# 5. Seed demo data (admin, a customer, 8 categories, 32 products)
cd ../server
npm run seed

# 6. Run both apps (two terminals)
# Terminal 1 (project root):
npm run dev:server      # http://localhost:5000
# Terminal 2 (project root):
npm run dev:client      # http://localhost:5173

Demo credentials (created by the seed script)

Role

Email

Password

Admin

admin@demo.com

Admin@1234

Customer

customer@demo.com

Customer@1234

4. GitHub Setup

cd ecommerce-project
git init
git add .
git commit -m "Initial commit: Voltra e-commerce platform"
git remote add origin <your-repo-url>
git branch -M main
git push -u origin main

.env files are excluded by .gitignore — never commit real credentials. Only .env.example files are tracked.

5. Deployment

Frontend → Vercel

Import the GitHub repo into Vercel.

Set Root Directory to client.

Vercel auto-detects Vite (vercel.json is already included with the build command, output directory, and an SPA rewrite rule so client-side routes don't 404 on refresh).

Add an environment variable: VITE_API_URL=https://<your-backend-domain>/api.

Deploy.

Backend → Render / Railway / Fly.io (recommended over Vercel)

Express apps that keep a long-lived app.listen() process and a persistent MongoDB connection are not a natural fit for Vercel's serverless functions — running it there would need rewriting the app into per-route serverless handlers with per-request DB connection pooling, which is a real architectural change, not a config tweak. It runs correctly, unmodified, on any standard Node host:

Create a new Web Service on Render (or Railway/Fly).

Root directory: server. Build command: npm install. Start command: npm start.

Set environment variables from .env.example — most importantly MONGODB_URI (use MongoDB Atlas for a hosted database), JWT_SECRET, and CLIENT_URL (your deployed Vercel frontend URL, for CORS).

Deploy. Note the resulting URL and put it into the frontend's VITE_API_URL.

Once both are live, run npm run seed locally with MONGODB_URI pointed at your Atlas cluster to populate demo data, or build your own admin account by registering a user and manually flipping their role to admin in the database.

MongoDB Atlas

Create a free cluster at mongodb.com/cloud/atlas.

Create a database user and allow network access from your backend host (or 0.0.0.0/0 for simplicity in a demo).

Copy the connection string into MONGODB_URI.

Razorpay

Create an account at razorpay.com and generate API keys (test mode is fine for a demo).

Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on the backend.

Until these are set, the checkout still shows the exact final payable amount and keeps online payment disabled; Cash on Delivery remains available. Once Razorpay credentials are configured, online checkout opens Razorpay for the exact server-calculated amount.

Payment behavior without Razorpay credentials

The checkout always calculates and displays the final amount from server-backed cart pricing. If Razorpay is not configured, the online-payment option is visibly unavailable and no pending online-payment order is created. Cash on Delivery remains usable. After RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are configured, the same final server-calculated amount is sent to Razorpay; only a verified captured payment can confirm the online order and deduct inventory.

Cloudinary

Create a free account at cloudinary.com.

Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET on the backend.

Until these are set, the admin product form's "Upload Image" button returns a clear 503 message — admins can still add products by pasting an image URL directly (there's a manual URL field right next to the uploader).

6. What's Implemented

Customer-facing: Home, Shop (search/filter/sort/pagination, mobile filter drawer), Search Results, Product Details (gallery, specs, verified-purchase reviews, related products), Cart, Wishlist, multi-step Checkout (Address → Summary → Payment), Razorpay checkout + Cash on Delivery, Order Success, Order History, Order Details with a visual tracking timeline, order cancellation, payment retry, Profile, Change Password, Address management, Login/Register, 404.

Admin: Dashboard (revenue/orders/users/products stats, revenue-over-time and top-products charts, category breakdown, low-stock list, recent orders), Product management (create/edit/deactivate, Cloudinary upload or manual image URL, specs, tags), Category management, Order management (search/filter, status updates with a note trail), User management (search, view order history, activate/deactivate).

Backend architecture: role-based authorization that always re-checks the database (never trusts a client-supplied role), server-computed cart/order totals (a client can never send its own price), atomic conditional stock decrements so concurrent checkouts can't oversell, stock is only deducted on confirmed payment (a failed or abandoned Razorpay session never locks inventory), Razorpay signature verification, and stock restoration on cancellation/refund.

7. Validation & Quality Gates

The repository includes a GitHub Actions CI workflow at .github/workflows/ci.yml that runs on pushes and pull requests to main.

The CI pipeline:

installs the backend and frontend from their lockfiles with npm ci

verifies every backend .js file with Node's syntax checker

runs the frontend oxlint

creates the frontend production build with Vite

Additional hardening included in this version:

fixed Express route ordering so /api/products/admin/* cannot be swallowed by the public /:slug route

made inactive categories admin-only instead of exposing them through the public categories endpoint

made payment verification idempotency-aware to reduce duplicate stock decrements from repeated Razorpay callbacks

verifies the Razorpay order ID belongs to the application order and uses constant-time signature comparison

added automatic Razorpay refunds for paid customer/admin cancellations

tracks whether order inventory was actually deducted, including COD cancellations

restores stock when a COD order is cancelled

marks COD payment as paid when the admin marks the order Delivered

added safe multi-item stock compensation if one line cannot be decremented

fixed the customer order → product review link by returning the product slug

fixed wishlist → cart stock checks

keeps a default address when the current default address is deleted or unset

added safer pagination and search handling for admin/product APIs

8. What Was NOT Testable In This Environment

(Be Aware)

This review environment does not provide a reachable MongoDB instance or outbound access to Razorpay/Cloudinary, and package registry access was not available long enough to complete a fresh dependency install. That means:

❌ Not verified here: live database reads/writes — registration, login, browsing seeded products, placing an order, the admin dashboard's real numbers, and the seed script against a live MongoDB instance.

❌ Not verified here: a real Razorpay checkout round-trip or Cloudinary upload.

Before you treat this as production-ready, run it locally with a real MongoDB connection (npm run seed should complete without errors — if it doesn't, that's the first thing to debug) and walk through: register → browse → add to cart → checkout with Cash on Delivery → view order → (as admin) update its status → mark it Delivered → leave a review. That is the one full loop this sandbox could not exercise for you.

9. Status Summary

CODE-REVIEWED: Backend JavaScript syntax, local import integrity, route ordering, validation boundaries, inventory/payment edge cases, and deployment configuration were reviewed in this pass.

CI-READY: GitHub Actions will perform the real dependency install, frontend lint, and production build on every push/PR.

NEEDS YOUR ENVIRONMENT: Live MongoDB, Razorpay, Cloudinary, and the final browser/mobile end-to-end flow require the corresponding external services and credentials.

10. Remaining Limitations / Suggested Next Steps

No automated test suite (Jest/Vitest + Supertest) is included — the testing above was manual/scripted smoke testing, not a CI-enforced suite. Worth adding before production use.

No forgot-password email flow (the schema/route slots exist as passwordResetToken/passwordResetExpires on the User model, but sending actual reset emails needs a transactional email provider, which wasn't part of the required stack).

Product image storage falls back to picsum.photos seed placeholders when Cloudinary isn't configured — replace with real product photography before going live.

Rate limits, JWT expiry, and shipping/tax logic in cartController.js use reasonable demo defaults — tune them for your actual business rules.