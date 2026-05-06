# OmniShop - Project Documentation

OmniShop is a modern, high-performance multi-vendor e-commerce platform built with React and Firebase. It features a robust architecture for handling products, multi-step ordering, real-time notifications, and specialized dashboards for Buyers, Sellers, and Delivery personnel.

## 🚀 Technology Stack

- **Frontend Framework**: [React](https://reactjs.org/) (v18+) with [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) for utility-first design
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives)
- **Backend/Database**: [Firebase](https://firebase.google.com/) (Firestore & Authentication)
- **State Management**: [TanStack Query](https://tanstack.com/query/latest) (React Query) for server state
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 📂 Project Structure

```text
OmniShop/
├── public/              # Static assets
├── src/
│   ├── api/             # API client configurations
│   ├── components/      # Reusable UI components
│   │   └── ui/          # shadcn/ui components (Radix)
│   ├── firebase/        # Firebase configuration (firebaseConfig.js)
│   ├── hooks/           # Custom React hooks (useAuth, useCart, etc.)
│   ├── lib/             # Utility libraries (utils.js for tailwind-merge)
│   ├── pages/           # Page-level components
│   ├── services/        # Business logic & Firestore interaction (firestoreService.js)
│   ├── utils/           # Helper functions
│   ├── App.jsx          # Main application entry and routing
│   └── main.jsx         # ReactDOM entry point
├── firestore.rules      # Firestore Security Rules
├── firestore.indexes.json # Firestore Composite Indexes
└── tailwind.config.js   # Tailwind configuration
```

## 🛠️ Core Concepts & Patterns

### 1. Data Persistence (Firestore)
All database interactions are centralized in `src/services/firestoreService.js`.
- **Collections**: `products`, `orders`, `cartItems`, `reviews`, `notifications`, `sellerApplications`, `deliveryApplications`, `deliveryAssignments`, `users`.
- **Naming Convention**: Use `camelCase` for function names and `snake_case` for database fields (to match Firebase/Firestore conventions).
- **Batch Writes**: Use `writeBatch` for atomic operations (e.g., clearing a cart).

### 2. Authentication
Authentication is managed via `AuthContext` (provided in `App.jsx`).
- Uses `onAuthStateChanged` to track user state.
- Supports Email/Password and Google Sign-In.
- Profile data is synced with the `users` collection in Firestore.

### 3. Server State (React Query)
Use React Query for fetching and caching data from Firestore. This reduces unnecessary reads and provides built-in loading/error states.

### 4. UI/UX Standards
- **Responsive Design**: Mobile-first approach using Tailwind's `sm:`, `md:`, `lg:` prefixes.
- **Glassmorphism**: Use backdrop-blur and subtle borders for premium cards and overlays.
- **Micro-animations**: Subtle transitions using Framer Motion for page changes and interactive elements.
- **Dark Mode**: Configured via `next-themes` and Tailwind's `dark:` utility.

## 📜 Coding Standards

- **Functional Components**: Use arrow functions for components.
- **Typed Imports**: Prefer absolute paths using `@/` alias (configured in `vite.config.js`).
- **Clean Code**: Keep components small; extract complex logic into hooks or services.
- **Error Handling**: Always wrap Firestore calls in `try/catch` and provide user feedback via `Toast`.

## 📦 Key Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Deploy to Firebase
firebase deploy
```

## ⚠️ Important Notes

- **Security Rules**: Always test security rules locally before deploying.
- **Indexes**: Composite indexes for complex queries (e.g., filtering by status AND ordering by date) must be defined in `firestore.indexes.json`.
- **Environment Variables**: Ensure `.env` contains all necessary `VITE_FIREBASE_*` keys for the project to function.
