# Logistics Management System

A comprehensive logistics management application built with **Next.js 15 (App Router) + TypeScript + Tailwind CSS + Firebase**.

This document serves as a complete guide for developers who will maintain, extend, or migrate this application. It covers the architecture, security considerations, feature implementation, and database migration strategies.

---

## 📋 Table of Contents

1. [Tech Stack & Architecture](#tech-stack--architecture)
2. [Project Structure](#project-structure)
3. [Features Overview](#features-overview)
4. [Security & Authentication](#security--authentication)
5. [Database Layer](#database-layer)
6. [UI/UX System](#uiux-system)
7. [Adding New Features](#adding-new-features)
8. [Migrating from Firebase](#migrating-from-firebase)
9. [Development Guide](#development-guide)

---

## 🚀 Tech Stack & Architecture

### Core Technologies

- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS with custom design system
- **Icons:** Lucide React
- **Authentication:** Firebase Auth (replaceable)
- **Database:** Cloud Firestore (replaceable)
- **Deployment:** Vercel-ready

### Architecture Pattern

The application follows a **service-oriented architecture** with clear separation of concerns:

```
UI Components → Services → Database
     ↓              ↓           ↓
  React TSX    TypeScript   Firebase
                 Modules    (replaceable)
```

**Key Principles:**
- **Service Layer Abstraction**: All database operations go through service modules
- **Type Safety**: Strict TypeScript interfaces for all data models
- **Component Modularity**: Reusable UI components with consistent patterns
- **Responsive Design**: Mobile-first approach with desktop enhancements

---

## 📁 Project Structure

```
logistic-app/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Auth pages (login, signup)
│   │   │   ├── layout.tsx       # Auth layout with animated background
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── page.tsx             # Main dashboard
│   │   ├── layout.tsx           # Root layout
│   │   └── globals.css          # Global styles & theme
│   │
│   ├── components/
│   │   ├── features/            # Feature-specific components
│   │   │   ├── CustomerProfile.tsx
│   │   │   ├── VendorProfile.tsx
│   │   │   ├── ImportShipmentForm.tsx
│   │   │   ├── ExportShipmentForm.tsx
│   │   │   ├── *Ledger.tsx      # Various ledger components
│   │   │   ├── *Report.tsx      # Report components
│   │   │   └── InvoiceBilling.tsx
│   │   ├── ui/                  # Reusable UI components
│   │   │   ├── FeatureHeader.tsx
│   │   │   ├── SharedDialog.tsx
│   │   │   └── AnimatedBackground.tsx
│   │   └── Sidebar.tsx          # Main navigation
│   │
│   ├── services/                # Service layer (DATABASE ABSTRACTION)
│   │   ├── authClient.ts        # Authentication service
│   │   ├── customers.ts         # Customer CRUD operations
│   │   ├── vendors.ts           # Vendor CRUD operations
│   │   ├── shipments.ts         # Shipment operations
│   │   ├── ledger.ts            # Ledger operations
│   │   ├── invoices.ts          # Invoice operations
│   │   └── financials.ts        # Financial reports
│   │
│   ├── models/                  # TypeScript interfaces
│   │   ├── profiles.ts          # Customer & Vendor types
│   │   ├── shipments.ts         # Shipment types
│   │   ├── ledger.ts            # Ledger entry types
│   │   ├── invoices.ts          # Invoice types
│   │   └── financials.ts        # Financial report types
│   │
│   ├── lib/
│   │   ├── firebase.ts          # Firebase initialization (replaceable)
│   │   └── validation.ts        # Input validation utilities
│   │
│   └── proxy.ts                 # Route protection middleware
│
├── .env.local                   # Environment variables (DO NOT COMMIT)
├── tailwind.config.ts           # Tailwind configuration
└── tsconfig.json                # TypeScript configuration
```

---

## 🎯 Features Overview

### 1. **Profile Management**
- **Customer Profiles**: Full CRUD with consignee management
- **Vendor Profiles**: Categorized by type (Shipping Line, Transporter, Clearing Agent)
- **Features**: Search, filter, edit, delete with confirmation dialogs

### 2. **Shipment Management**
- **Import Shipments**: Track containers, customs clearance, delivery
- **Export Shipments**: Manage bookings, documentation, loading
- **Job Numbers**: Auto-generated unique identifiers
- **Status Tracking**: Multi-stage workflow (Booked → In Transit → Delivered)

### 3. **Financial Management**
- **Ledgers**: Customer, Vendor, General, and Group ledgers
- **Invoicing**: Create and track invoices with line items
- **Reports**: Profit & Loss, Balance Sheet with date filtering
- **Ledger Entries**: Manual journal entries with debit/credit

### 4. **Reporting**
- **Shipment Reports**: Detailed reports with statistics and filtering
- **Financial Reports**: Real-time P&L and Balance Sheet generation
- **Export Capabilities**: Data ready for export (future enhancement)

---

## 🔐 Security & Authentication

### Current Implementation (Firebase Auth)

**Authentication Flow:**
1. User submits credentials on `/login` or `/signup`
2. `authClient.ts` service handles Firebase Auth SDK calls
3. On success, ID token is sent to `/api/auth/set-cookie`
4. Cookie is set for session management
5. `proxy.ts` middleware protects routes based on cookie presence

**Security Layers:**

```typescript
// src/services/authClient.ts
export async function login(email: string, password: string): Promise<void> {
  const auth = getFirebaseAuth();
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await userCredential.user.getIdToken();
  await setSessionToken(idToken);  // Sets httpOnly cookie
}
```

**⚠️ Current Limitations:**
- Cookie is **not httpOnly** (client-accessible)
- Token verification happens client-side only
- No server-side session validation
- No CSRF protection
- No rate limiting on auth endpoints

### Recommended Production Security

**For Production, Implement:**

1. **Server-Side Session Management**
   ```typescript
   // Use next-auth or similar
   import NextAuth from "next-auth";
   import CredentialsProvider from "next-auth/providers/credentials";
   ```

2. **HTTP-Only Cookies**
   ```typescript
   // In API route
   cookies().set('session', token, {
     httpOnly: true,
     secure: process.env.NODE_ENV === 'production',
     sameSite: 'strict',
     maxAge: 60 * 60 * 24 * 7 // 1 week
   });
   ```

3. **Token Verification**
   ```typescript
   // Middleware to verify tokens
   export async function middleware(request: NextRequest) {
     const token = request.cookies.get('session')?.value;
     const verified = await verifyToken(token);
     if (!verified) return NextResponse.redirect('/login');
   }
   ```

4. **Rate Limiting**
   - Already implemented in `lib/validation.ts` for client-side
   - Add server-side rate limiting with Redis or similar

5. **CSRF Protection**
   ```typescript
   // Use tokens for state-changing operations
   const csrfToken = generateCSRFToken();
   ```

### Multi-Tenant Security

**If Supporting Multiple Organizations:**

```typescript
// Add to all data models
interface BaseModel {
  id: string;
  tenantId: string;  // Organization/company ID
  createdAt: string;
  updatedAt: string;
}

// Service layer filters by tenant
export async function listCustomers(): Promise<CustomerProfile[]> {
  const tenantId = await getCurrentTenantId();
  return db.collection('customers')
    .where('tenantId', '==', tenantId)
    .get();
}
```

**Database Rules (Firestore Example):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /customers/{customerId} {
      allow read, write: if request.auth != null 
        && resource.data.tenantId == request.auth.token.tenantId;
    }
  }
}
```

---

## 💾 Database Layer

### Current Structure (Firebase Firestore)

**Collections:**
- `customers` - Customer profiles with consignees
- `vendors` - Vendor profiles with service types
- `importShipments` - Import shipment records
- `exportShipments` - Export shipment records
- `ledgerEntries` - Financial ledger entries
- `invoices` - Invoice records

**Service Layer Pattern:**

All database operations are abstracted through service modules:

```typescript
// src/services/customers.ts
export async function listCustomers(): Promise<CustomerProfile[]> {
  const db = getFirebaseDb();
  const snapshot = await getDocs(collection(db, 'customers'));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString()
  } as CustomerProfile));
}

export async function createCustomer(values: CustomerFormValues): Promise<CustomerProfile> {
  const db = getFirebaseDb();
  const docRef = await addDoc(collection(db, 'customers'), {
    ...values,
    createdAt: serverTimestamp()
  });
  // Return created customer...
}
```

**Key Features:**
- ✅ Type-safe interfaces
- ✅ Centralized error handling
- ✅ Consistent data transformation
- ✅ Easy to replace with different database

---

## 🎨 UI/UX System

### Design System

**Color Palette:**
```css
/* Primary (Green) - Main actions */
--primary: #34a85a;
--primary-hover: #2c8a4e;

/* Secondary (Blue) - Accents */
--secondary: #6495ed;

/* Neutrals */
--background: #f5f7fb;
--foreground: #111827;
--slate-50 to --slate-900: Tailwind slate scale
```

**Component Patterns:**

1. **FeatureHeader** - Consistent headers across all features
   ```tsx
   <FeatureHeader
     title="Customer Profile"
     icon={<Users className="h-4 w-4" />}
     actions={<button>New Customer</button>}
   />
   ```

2. **SharedDialog** - Reusable dialog shell
   - Handles body scroll locking
   - Conditional search bar
   - Consistent styling

3. **Responsive Design**
   - Mobile: Stacked layout, full-width buttons
   - Desktop: Horizontal layout, right-aligned actions
   - Breakpoint: `md` (768px)

### Styling Guidelines

**Button Patterns:**
```tsx
// Primary action
className="bg-primary hover:bg-primary-hover cursor-pointer ..."

// Secondary action
className="border border-slate-200 hover:bg-slate-50 cursor-pointer ..."

// Destructive action
className="bg-red-600 hover:bg-red-700 cursor-pointer ..."
```

**Form Inputs:**
```tsx
className="w-full rounded-lg border-2 border-input bg-white px-4 py-2 
  hover:border-primary/40 focus:outline-none focus:border-primary 
  focus:ring-2 focus:ring-primary/20 transition-all duration-200"
```

---

## ➕ Adding New Features

### Step-by-Step Guide

**1. Define Data Model**

Create interface in `src/models/`:

```typescript
// src/models/yourFeature.ts
export interface YourFeature {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  // ... other fields
}

export interface YourFeatureFormValues {
  name: string;
  description: string;
  // ... exclude id and createdAt
}
```

**2. Create Service Layer**

Create service in `src/services/`:

```typescript
// src/services/yourFeature.ts
import { YourFeature, YourFeatureFormValues } from '@/models/yourFeature';
import { getFirebaseDb } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

export async function listYourFeatures(): Promise<YourFeature[]> {
  const db = getFirebaseDb();
  const snapshot = await getDocs(collection(db, 'yourFeatures'));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString()
  } as YourFeature));
}

export async function createYourFeature(values: YourFeatureFormValues): Promise<YourFeature> {
  const db = getFirebaseDb();
  const docRef = await addDoc(collection(db, 'yourFeatures'), {
    ...values,
    createdAt: serverTimestamp()
  });
  
  return {
    id: docRef.id,
    ...values,
    createdAt: new Date().toISOString()
  };
}

export async function updateYourFeature(id: string, values: YourFeatureFormValues): Promise<void> {
  const db = getFirebaseDb();
  await updateDoc(doc(db, 'yourFeatures', id), values);
}

export async function deleteYourFeature(id: string): Promise<void> {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, 'yourFeatures', id));
}
```

**3. Create Feature Component**

Create component in `src/components/features/`:

```typescript
// src/components/features/YourFeature.tsx
'use client';

import { useState, useEffect } from 'react';
import { YourFeature, YourFeatureFormValues } from '@/models/yourFeature';
import { listYourFeatures, createYourFeature } from '@/services/yourFeature';
import FeatureHeader from '@/components/ui/FeatureHeader';

export default function YourFeatureComponent() {
  const [items, setItems] = useState<YourFeature[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await listYourFeatures();
      setItems(data);
    } catch (error) {
      console.error('Failed to load data', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full min-h-[60vh] md:min-h-full rounded-xl border border-slate-200 bg-white flex flex-col">
      <FeatureHeader
        title="Your Feature"
        icon={<YourIcon className="h-4 w-4" />}
      />
      
      {/* Your feature UI here */}
    </div>
  );
}
```

**4. Add to Sidebar**

Update `src/components/Sidebar.tsx`:

```typescript
import { YourIcon } from 'lucide-react';

const MENU_ITEMS = [
  // ... existing items
  {
    id: 'your-section',
    label: 'Your Section',
    Icon: YourIcon,
    children: [
      {
        id: 'your-feature',
        label: 'Your Feature',
        Icon: YourIcon,
      },
    ],
  },
];
```

**5. Add to Main Page**

Update `src/app/page.tsx`:

```typescript
import YourFeatureComponent from '@/components/features/YourFeature';

// In TAB_TITLES
const TAB_TITLES: Record<string, string> = {
  // ... existing titles
  'your-feature': 'Your Feature',
};

// In render logic
{selectedId === 'your-feature' ? (
  <YourFeatureComponent />
) : ...}
```

---

## 🔄 Migrating from Firebase

### Why Migrate?

**Reasons to Consider:**
- Cost optimization for large-scale applications
- Need for complex queries or joins
- Existing infrastructure with PostgreSQL/MySQL
- Compliance requirements for data location
- Advanced features (stored procedures, triggers)

### Migration Strategy

#### Option 1: PostgreSQL with Prisma

**1. Install Dependencies**
```bash
npm install @prisma/client
npm install -D prisma
npx prisma init
```

**2. Define Schema**
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Customer {
  id            String   @id @default(cuid())
  customerName  String
  address       String
  city          String
  country       String
  email1        String
  contact1      String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([customerName])
}
```

**3. Update Service Layer**
```typescript
// src/services/customers.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function listCustomers(): Promise<CustomerProfile[]> {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: 'desc' }
  });
  
  return customers.map(c => ({
    ...c,
    createdAt: c.createdAt.toISOString()
  }));
}

export async function createCustomer(values: CustomerFormValues): Promise<CustomerProfile> {
  const customer = await prisma.customer.create({
    data: values
  });
  
  return {
    ...customer,
    createdAt: customer.createdAt.toISOString()
  };
}
```

**4. Environment Variables**
```env
# .env.local
DATABASE_URL="postgresql://user:password@localhost:5432/logistics"
```

#### Option 2: MongoDB with Mongoose

**1. Install Dependencies**
```bash
npm install mongoose
```

**2. Define Models**
```typescript
// src/lib/mongodb.ts
import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  address: String,
  city: String,
  country: String,
  email1: String,
  contact1: String,
  consignees: [{
    name: String,
    tradeLicense: String
  }]
}, { timestamps: true });

export const Customer = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
```

**3. Update Service Layer**
```typescript
// src/services/customers.ts
import { Customer } from '@/lib/mongodb';

export async function listCustomers(): Promise<CustomerProfile[]> {
  await connectDB();
  const customers = await Customer.find().sort({ createdAt: -1 });
  
  return customers.map(c => ({
    id: c._id.toString(),
    ...c.toObject(),
    createdAt: c.createdAt.toISOString()
  }));
}
```

#### Option 3: Supabase (PostgreSQL with Auth)

**1. Install Dependencies**
```bash
npm install @supabase/supabase-js
```

**2. Initialize Client**
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

**3. Update Services**
```typescript
// src/services/customers.ts
import { supabase } from '@/lib/supabase';

export async function listCustomers(): Promise<CustomerProfile[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}
```

**4. Update Auth Service**
```typescript
// src/services/authClient.ts
import { supabase } from '@/lib/supabase';

export async function login(email: string, password: string): Promise<void> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) throw error;
  // Session is automatically managed by Supabase
}
```

### Migration Checklist

- [ ] Choose new database system
- [ ] Set up database instance (local/cloud)
- [ ] Define schema/models matching current data structure
- [ ] Update all service files (`src/services/*.ts`)
- [ ] Update authentication service (`src/services/authClient.ts`)
- [ ] Migrate existing data (write migration scripts)
- [ ] Update environment variables
- [ ] Test all CRUD operations
- [ ] Update middleware/proxy for new auth system
- [ ] Deploy and monitor

---

## 🛠️ Development Guide

### Getting Started

**1. Clone and Install**
```bash
git clone <repository-url>
cd logistic-app
npm install
```

**2. Environment Setup**
```bash
# Copy example env file
cp .env.example .env.local

# Add your Firebase credentials (or other DB credentials)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
# ... etc
```

**3. Run Development Server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Code Quality

**TypeScript Strict Mode**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}
```

**Linting**
```bash
npm run lint
```

**Type Checking**
```bash
npm run type-check
```

### Testing Strategy

**Recommended Testing Stack:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

**Example Test:**
```typescript
// src/services/__tests__/customers.test.ts
import { describe, it, expect, vi } from 'vitest';
import { listCustomers } from '../customers';

describe('Customer Service', () => {
  it('should list customers', async () => {
    const customers = await listCustomers();
    expect(Array.isArray(customers)).toBe(true);
  });
});
```

### Deployment

**Vercel (Recommended)**
```bash
npm install -g vercel
vercel
```

**Environment Variables on Vercel:**
- Add all `NEXT_PUBLIC_*` variables
- Add `DATABASE_URL` if using external DB
- Ensure secrets are not committed to git

**Build Command:**
```bash
npm run build
```

---

## 📝 Best Practices

### Security
- ✅ Never commit `.env.local` to version control
- ✅ Use environment variables for all secrets
- ✅ Implement proper authentication and authorization
- ✅ Validate all user inputs on both client and server
- ✅ Use HTTPS in production
- ✅ Implement rate limiting
- ✅ Regular security audits

### Performance
- ✅ Use React Server Components where possible
- ✅ Implement proper loading states
- ✅ Optimize images with Next.js Image component
- ✅ Lazy load heavy components
- ✅ Use pagination for large lists
- ✅ Implement proper caching strategies

### Code Organization
- ✅ Keep components small and focused
- ✅ Use TypeScript interfaces for all data
- ✅ Abstract database operations in services
- ✅ Follow consistent naming conventions
- ✅ Document complex logic
- ✅ Write reusable utility functions

---

## 🤝 Contributing

When contributing to this project:

1. Create a feature branch from `main`
2. Follow existing code patterns and conventions
3. Update this README if adding major features
4. Test thoroughly before submitting PR
5. Update TypeScript interfaces for any data changes

---

## 📄 License

[Your License Here]

---

## 🆘 Support

For questions or issues:
- Check existing documentation
- Review service layer for database operations
- Consult TypeScript interfaces for data structures
- Check component patterns in `src/components/ui/`

**Key Files for Reference:**
- `src/services/` - All database operations
- `src/models/` - Data type definitions
- `src/components/ui/FeatureHeader.tsx` - Standard header pattern
- `src/components/features/CustomerProfile.tsx` - Complete CRUD example

---

**Last Updated:** 2025-11-22
**Version:** 1.0.0
