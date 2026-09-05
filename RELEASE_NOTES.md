# Voltra Release Notes

This package is the reviewed/fixed release prepared for local verification and deployment.

Key fixes include product-admin route ordering, protected inactive-category access, Razorpay verification hardening,
inventory tracking/restoration for cancellations, COD payment completion on delivery, duplicate payment protection,
wishlist stock validation, address-default maintenance, safer pagination/search handling, and GitHub Actions CI.

Run `npm run install:all`, configure `server/.env` and `client/.env`, then use the browser test flow in README.md.


## Catalog refresh
- Replaced placeholder demo products with a realistic 32-product retail catalog across 8 categories.
- Added realistic brands, prices, discounts, stock levels, ratings, review counts, specifications and retail-oriented descriptions.
- Added relevant product imagery URLs and featured products.
- Added IPv4-first DNS resolution for MongoDB Atlas connections on networks using IPv6/NAT64.
