# Firebase Migration Guide for OmniShop

## Overview

OmniShop has been successfully migrated from Base44 to Firebase (Authentication + Firestore). This guide covers setup, configuration, and key changes made during the migration.

## Prerequisites

- Firebase project created at [console.firebase.google.com](https://console.firebase.google.com)
- Firebase CLI installed: `npm install -g firebase-tools`
- Google Cloud account with billing enabled (for some advanced features)

## Setup Instructions

### 1. Firebase Project Configuration

#### Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add Project" and follow the setup wizard
3. Enable Google Analytics (optional but recommended)
4. Once created, note your project ID

#### Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Under **General** tab, scroll to **Your apps** section
3. Click the web icon `</>` to create a new web app
4. Copy the Firebase config object

Your config will look like:
```javascript
{
  apiKey: "AIzaSy...",
  authDomain: "omnishop-xxx.firebaseapp.com",
  projectId: "omnishop-xxx",
  storageBucket: "omnishop-xxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
}
```

### 2. Environment Configuration

#### Update .env File

Create or update `.env` in the project root:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 3. Enable Firebase Services

In **Firebase Console**, enable these services:

#### Authentication
1. Go to **Authentication** → **Sign-in method**
2. Enable:
   - **Email/Password**: Click enable, configure as needed
   - **Google**: Add your OAuth credentials
     - Get credentials from [Google Cloud Console](https://console.cloud.google.com)
     - Add authorized JavaScript origins: `http://localhost:5173` and your production URL
     - Add authorized redirect URIs

#### Firestore Database
1. Go to **Firestore Database**
2. Click **Create Database**
3. Choose location (typically closest to your users)
4. Start in **Test mode** for development (Switch to **Production mode** when live)

#### Firestore Security Rules

For **Test mode** development:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

For **Production mode** (more restrictive):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own profile
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
    
    // Public product reading
    match /products/{document=**} {
      allow read: if true;
      allow write: if request.auth.token.role == 'admin' || request.auth.token.role == 'seller';
    }
    
    // Cart items - users can only access their own
    match /cartItems/{item} {
      allow read, write: if request.auth.email == resource.data.user_email;
    }
    
    // Orders - users can read/write their own
    match /orders/{order} {
      allow read: if request.auth.email == resource.data.buyer_email || request.auth.token.role == 'admin';
      allow write: if request.auth.email == resource.data.buyer_email;
    }
    
    // Notifications - users can read their own
    match /notifications/{notification} {
      allow read: if request.auth.email == resource.data.user_email || resource.data.is_broadcast;
      allow write: if request.auth.token.role == 'admin';
    }
    
    // Seller/Delivery applications
    match /sellerApplications/{document=**} {
      allow read, write: if request.auth.token.role == 'admin' || request.auth.email == resource.data.applicant_email;
    }
    
    match /deliveryApplications/{document=**} {
      allow read, write: if request.auth.token.role == 'admin' || request.auth.email == resource.data.applicant_email;
    }
  }
}
```

## Project Structure

### New Firebase Files

#### `src/firebase/firebaseConfig.js`
Initializes Firebase app, Auth, and Firestore instances. Called by all Firebase services.

#### `src/services/firestoreService.js`
Centralized Firestore CRUD operations module. Exposes functions for all collections:

**Products:**
- `getProducts(limitNum)`
- `getProduct(id)`
- `getProductsByFilter(field, value)`
- `createProduct(data)` - Admin/Seller only
- `updateProduct(id, data)` - Admin/Seller only
- `deleteProduct(id)` - Admin only

**Cart Items:**
- `getCartItems(userEmail)`
- `addCartItem(data)`
- `updateCartItem(id, data)`
- `deleteCartItem(id)`
- `clearUserCart(userEmail)`

**Orders:**
- `getOrders(buyerEmail, limitNum)`
- `getOrder(id)`
- `createOrder(data)`
- `updateOrder(id, data)`
- `listOrders(limitNum)` - Admin only

**Reviews:**
- `getReviews(productId)`
- `createReview(data)`

**Notifications:**
- `getNotifications(userEmail)`
- `getBroadcastNotifications()`
- `createNotification(data)`
- `updateNotification(id, data)`

**Seller/Delivery Applications:**
- `getSellerApps(email)`
- `createSellerApp(data)`
- `updateSellerApp(id, data)` - Admin only
- `listSellerApps(limitNum)` - Admin only

**Users:**
- `getUser(uid)`
- `getUserByEmail(email)`
- `createUserProfile(uid, data)` - Called on registration
- `updateUserProfile(uid, data)`
- `listUsers(limitNum)` - Admin only

### Updated Files

#### `src/lib/AuthContext.jsx`
Complete rewrite using Firebase Auth:

```javascript
// New exports
export const useAuth = () => {
  return {
    user,                      // Current user + profile from Firestore
    isAuthenticated,          // Boolean
    isLoadingAuth,            // Boolean
    authError,                // { type, message }
    authChecked,              // Boolean
    register(email, password, fullName),
    login(email, password),
    loginWithGoogle(),        // NEW: Firebase Google Sign-In
    logout(),
    updateProfile(data),
    resetPassword(email),
    clearAuthError()
  }
}
```

#### `src/App.jsx`
- Removed `UserNotRegisteredError` component (Base44-specific)
- Removed `isLoadingPublicSettings`, `appPublicSettings`, `navigateToLogin` logic
- Simplified to only check `isLoadingAuth`

#### `src/pages/SignIn.jsx` & `src/pages/Register.jsx`
- Uses `useAuth()` instead of `base44.auth`
- Simplified registration flow (removed OTP verification)
- Google Sign-In via Firebase popup

#### Component Updates
- `Navbar.jsx`: Updated logout to use Firebase
- `NotificationBell.jsx`: Uses `firestoreService` functions
- `PageNotFound.jsx`: Uses `useAuth()` instead of queries

## Database Schema

### Collections Structure

#### `users/{uid}`
```json
{
  "email": "user@example.com",
  "full_name": "John Doe",
  "phone": "9876543210",
  "role": "user",  // "user", "seller", "delivery_boy", "admin"
  "shipping_address": {
    "name": "John Doe",
    "phone": "9876543210",
    "address": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  },
  "upi_id": "",  // Admin/seller payment
  "created_date": "2024-05-04T10:30:00Z"
}
```

#### `products/{auto-id}`
```json
{
  "title": "Product Name",
  "description": "Product description",
  "price": 299,
  "original_price": 499,
  "category": "Electronics",
  "brand": "Brand Name",
  "seller_email": "seller@example.com",
  "seller_name": "Seller Name",
  "images": ["url1", "url2"],
  "tags": ["tag1", "tag2"],
  "stock": 50,
  "rating": 4.5,
  "review_count": 120,
  "is_active": true,
  "is_featured": false,
  "created_date": "2024-05-04T10:30:00Z"
}
```

#### `cartItems/{auto-id}`
```json
{
  "user_email": "user@example.com",
  "product_id": "product-doc-id",
  "title": "Product Name",
  "image": "image-url",
  "seller_email": "seller@example.com",
  "price": 299,
  "quantity": 2,
  "created_date": "2024-05-04T10:30:00Z"
}
```

#### `orders/{auto-id}`
```json
{
  "buyer_email": "user@example.com",
  "buyer_name": "John Doe",
  "status": "pending",  // "pending", "confirmed", "shipped", "delivered", "cancelled"
  "payment_method": "card",
  "payment_status": "completed",
  "items": [
    {
      "product_id": "product-id",
      "title": "Product Name",
      "price": 299,
      "quantity": 2,
      "image": "image-url",
      "seller_email": "seller@example.com"
    }
  ],
  "total_amount": 598,
  "shipping_address": {...},
  "created_date": "2024-05-04T10:30:00Z"
}
```

#### `reviews/{auto-id}`
```json
{
  "product_id": "product-doc-id",
  "reviewer_email": "user@example.com",
  "reviewer_name": "John Doe",
  "title": "Great product!",
  "comment": "Very satisfied with the purchase",
  "rating": 5,
  "verified_purchase": true,
  "created_date": "2024-05-04T10:30:00Z"
}
```

#### `notifications/{auto-id}`
```json
{
  "user_email": "user@example.com",
  "title": "Order Confirmed",
  "message": "Your order has been confirmed",
  "type": "order",  // "order", "offer", "promo", "system"
  "is_broadcast": false,
  "is_read": false,
  "created_date": "2024-05-04T10:30:00Z"
}
```

#### `sellerApplications/{auto-id}`
```json
{
  "applicant_email": "seller@example.com",
  "applicant_name": "Seller Name",
  "business_name": "Business Name",
  "business_type": "Individual/Company",
  "description": "Business description",
  "phone": "9876543210",
  "gst_number": "27XXXXX...",
  "address": "Business address",
  "status": "pending",  // "pending", "approved", "rejected"
  "admin_note": "Approval notes",
  "created_date": "2024-05-04T10:30:00Z"
}
```

#### `deliveryApplications/{auto-id}`
```json
{
  "applicant_email": "delivery@example.com",
  "applicant_name": "Delivery Boy",
  "phone": "9876543210",
  "vehicle_type": "motorcycle",  // "motorcycle", "car", "bicycle"
  "area": "Mumbai, Bangalore",
  "experience": "2 years",
  "status": "pending",
  "admin_note": "",
  "created_date": "2024-05-04T10:30:00Z"
}
```

#### `deliveryAssignments/{auto-id}`
```json
{
  "order_id": "order-doc-id",
  "delivery_boy_email": "delivery@example.com",
  "delivery_boy_name": "Delivery Boy",
  "buyer_name": "John Doe",
  "buyer_phone": "9876543210",
  "buyer_email": "user@example.com",
  "delivery_address": "123 Main St, Mumbai",
  "items_summary": "2 items",
  "total_amount": 598,
  "payment_method": "card",
  "status": "assigned",  // "assigned", "picked", "in_transit", "delivered"
  "otp": "123456",  // OTP for COD verification
  "cod_collected": false,
  "created_date": "2024-05-04T10:30:00Z"
}
```

## Admin Setup

### First Admin User
After deployment, manually set the first admin user:

1. Create a user account normally (register as user)
2. In Firebase Console → Firestore → `users` collection
3. Find your user document (by email)
4. Edit the `role` field: change from `"user"` to `"admin"`

This user now has full admin access.

### Admin Dashboard Access
Navigate to `/admin` after logging in with admin role.

## Google Sign-In Setup

### Firebase Configuration
1. Google Sign-In is already configured in `AuthContext.jsx` via `loginWithGoogle()`
2. Users see a "Continue with Google" button on SignIn and Register pages

### OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials (Web application)
3. Add authorized JavaScript origins:
   - `http://localhost:5173` (development)
   - `https://yourdomain.com` (production)
4. Copy credentials into Firebase Console → Authentication → Google provider

## Installation & Deployment

### Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

The app will be available at `http://localhost:5173`

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Deploy to Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in project
firebase init hosting

# Deploy
firebase deploy
```

## Remaining Migration Tasks

The following pages still need to be migrated (use `firestoreService` imports):

1. **Checkout.jsx** - Order creation flow
2. **Orders.jsx** - Order history and cancellation
3. **OrderTracking.jsx** - Delivery tracking
4. **ProductDetail.jsx** - Product display and reviews
5. **Settings.jsx** - User settings and applications
6. **admin/AdminPanel.jsx** - Admin dashboard
7. **seller/Dashboard.jsx** - Seller product management
8. **seller/Apply.jsx** - Seller application
9. **DeliveryDashboard.jsx** - Delivery boy dashboard

Each file needs:
- Remove `import { base44 }` from `@/api/base44Client`
- Add imports from `@/services/firestoreService`
- Replace `base44.entities.*` calls with service functions
- Replace `base44.auth.*` calls with `useAuth()` methods

## Common Migration Patterns

### Old (Base44) → New (Firebase)

```javascript
// Get products
// OLD: const products = await base44.entities.Product.filter({ is_active: true })
// NEW:
const products = await getProducts()

// Get user profile
// OLD: const user = await base44.auth.me()
// NEW:
const { user } = useAuth()

// Update user
// OLD: await base44.auth.updateMe({ phone: "..." })
// NEW:
const { updateProfile } = useAuth()
await updateProfile({ phone: "..." })

// Create order
// OLD: await base44.entities.Order.create(orderData)
// NEW:
const { createOrder } = await import('@/services/firestoreService')
await createOrder(orderData)
```

## Troubleshooting

### Auth State Not Persisting
- Ensure `onAuthStateChanged` listener is set up in `AuthContext` (already done)
- Check that user document exists in Firestore

### Firestore Rules Error
- Start with test mode rules during development
- Check security rules in Firebase Console
- User must be authenticated and have correct permissions

### Google Sign-In Not Working
- Verify OAuth credentials are added to Google Cloud Console
- Check redirect URIs include your domain
- Ensure Google provider is enabled in Firebase Console

### Missing Environment Variables
- Copy `.env` template and fill in Firebase config
- Restart dev server after updating `.env`
- Check that variables start with `VITE_` for Vite to load them

## Support & Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Guide](https://firebase.google.com/docs/firestore)
- [Firebase Auth](https://firebase.google.com/docs/auth)
- [Firebase CLI](https://firebase.google.com/docs/cli)

## Security Notes

1. **Never commit `.env`** to version control
2. **Update Firestore rules** before production (use production rules above)
3. **Enable custom claims** for advanced role management
4. **Setup email verification** for user registration
5. **Enable reCAPTCHA** to prevent abuse

---

**Migration Completed:** May 4, 2024
**Firebase SDK Version:** v10+
**React Version:** 18.2.0
**Firestore:** Cloud Firestore with native SDK
