# OmniShop

Production-ready e-commerce platform with role-based workflows for buyers, sellers, delivery partners, and admins.

## Tech Stack
- Frontend: React + Vite + Tailwind CSS + Firebase Web SDK
- Backend: Node.js + Express
- Database/Auth: Firebase (Firestore + Firebase Auth)
- Email: Resend
- Payments: Stripe
- Deploy: Vercel (frontend), Render (backend)

## Core Features
- Secure auth and role-aware UI
- Product catalog, cart, checkout, and order tracking
- Seller and delivery-partner application flows
- Admin management panel
- Automatic delivery assignment with per-day capacity scheduling

## Repository Structure
- `src/` frontend app (Vite)
- `backend/` Express API server
- `firestore.rules` Firestore security rules
- `render.yaml` Render Blueprint
- `vercel.json` Vercel SPA + security headers config
- `public/robots.txt` and `public/sitemap.xml` SEO crawl files

## Local Setup
1. Install frontend deps
```bash
npm install
```

2. Install backend deps
```bash
cd backend
npm install
cd ..
```

3. Environment files
- Backend: copy `backend/.env.example` to `backend/.env`
- Frontend: app runs from repo root; use `frontend/.env.example` as template and set values in root `.env` for local Vite

4. Run backend
```bash
cd backend
npm run dev
```

5. Run frontend
```bash
npm run dev
```

## Environment Variables

### Backend (`backend/.env`)
See [backend/.env.example](/c:/Users/Admin/Desktop/OmniShop/backend/.env.example).

### Frontend (Vite)
See [frontend/.env.example](/c:/Users/Admin/Desktop/OmniShop/frontend/.env.example).

Important:
- `VITE_API_URL` must point to your Render backend in production.
- Firebase Admin credentials must exist only in backend env vars, never frontend.

## Render Deployment (Backend)
1. Create a Render Web Service from `backend/`.
2. Build command: `npm install`
3. Start command: `npm start`
4. Set environment variables from `backend/.env.example`.
5. Set `NODE_ENV=production`.
6. Set `ALLOWED_ORIGINS` to your Vercel domain(s), comma-separated.
7. Deploy and note backend URL, e.g. `https://your-api.onrender.com`.

## Vercel Deployment (Frontend)
1. Import repo in Vercel.
2. Framework preset: Vite.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Set Vercel env vars from `frontend/.env.example`.
6. Set `VITE_API_URL` to your Render backend URL.
7. Deploy.

## SEO Architecture
- Route-aware metadata is managed in [src/components/seo/SeoManager.jsx](/c:/Users/Admin/Desktop/OmniShop/src/components/seo/SeoManager.jsx) and [src/seo/seoConfig.js](/c:/Users/Admin/Desktop/OmniShop/src/seo/seoConfig.js).
- Includes dynamic title/description/canonical/robots tags.
- Includes Open Graph + Twitter cards.
- Includes JSON-LD (Organization, Website search action, Breadcrumbs).
- `robots.txt` and `sitemap.xml` are in `public/`.

## Firebase Setup
1. Create Firebase project.
2. Enable Authentication providers you use.
3. Create Firestore database.
4. Deploy `firestore.rules` and indexes.
5. Frontend gets Firebase public config (`VITE_FIREBASE_*`).
6. Backend gets Admin SDK vars (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`).

## Admin Setup
- Promote an existing user doc role to `admin` in Firestore `users` collection.
- Admin panel route is protected by frontend role + backend auth checks.

## Screenshots
- `docs/screenshots/home.png`
- `docs/screenshots/checkout.png`
- `docs/screenshots/admin-panel.png`
- `docs/screenshots/delivery-dashboard.png`

## Security Notes
- Never commit `.env` files or service account keys.
- Keep secrets in Render/Vercel environment variables only.
- Rotate keys immediately if ever exposed.

## Search Console And Analytics
1. Add both apex and `www` domains in Google Search Console.
2. Submit sitemap: `https://your-domain/sitemap.xml`.
3. Verify indexing for homepage, category, and product URLs.
4. Add GA4 or equivalent analytics and monitor Core Web Vitals.
5. Track crawl and indexing errors weekly in Search Console.

## Final Production Validation Checklist
- [ ] Frontend `npm run build` succeeds
- [ ] Backend `npm start` succeeds
- [ ] Auth signup/login works
- [ ] Checkout and order finalization work
- [ ] Admin panel actions work
- [ ] Stripe payment session flow works
- [ ] Delivery auto-assignment fields appear on new orders
- [ ] Delivery dashboard shows assigned orders by delivery date
- [ ] No secrets committed in git history/repo files
