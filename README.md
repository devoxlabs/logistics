# Logistics Operations Platform

Modern logistics businesses need a single surface where customer profiles, shipment jobs, vendor spend, and statutory reporting stay in sync.  
This repository contains a full-featured logistics management system built with **Next.js 16 (App Router) + TypeScript + Tailwind CSS + Firebase**.

The UI is tuned for dispatch teams that bounce between desktop planning screens and phones/tablets in the warehouse. Every data grid feeds a detail dialog with scroll-locking so users can review records without losing context.

---

## Feature Highlights

| Domain | Capabilities |
| --- | --- |
| **Profiles** | Customer & vendor master data, consignee & service breakouts, animated dialog CRUD |
| **Shipments** | Import & export job forms with auto job numbers, mode toggles, billing/invoice linking, reusable detail reports with drill-down dialogs |
| **Billing** | Unified Invoice/Billing module (customer invoices + vendor bills). Vendor bills can link to existing invoices or auto-create one, and every update flows into ledgers + reports |
| **Expenses** | Company overhead tracker distinct from vendor services; optimized cards for mobile review |
| **Ledgers** | Customer, vendor, group, and general ledgers share a consistent table + card layout, all supporting modal detail views |
| **Accounting** | Profit & Loss, Balance Sheet, and General Ledger derive from Firestore data in real time. Balance Sheet distinguishes between vendor invoices vs standalone bills |
| **UX Enhancements** | Hover cursor cues, responsive card layouts, animated dialogs that lock background scroll, mobile-friendly filter bars |

---

## Architecture Overview

```
┌─────────┐      ┌────────────┐      ┌──────────────┐
│  UI /   │◄────►│  Services  │◄────►│   Firestore  │
│  App    │      │(data logic)│      │ + Firebase   │
└─────────┘      └────────────┘      └──────────────┘
     ▲                  ▲                   ▲
 React TSX      TypeScript modules     Replaceable DB
 Tailwind UI     (CRUD, mapping)        abstraction
```

- **Service Layer Abstraction**: `src/services/*` contains all database access; swapping Firestore for SQL/Supabase only requires touching these files.
- **Type-First Models**: Every collection has a corresponding interface in `src/models/*`. Ledger helpers (`src/lib/ledger.ts`) keep math centralized.
- **UI Principles**: Feature components live in `src/components/features/*`, all using `FeatureHeader`, dialog shells, responsive cards, and consistent tailwind tokens.

---

## Project Structure

```
src/
├─ app/                         # App Router entry points
│  ├─ (auth)/                   # Login / signup flow
│  └─ page.tsx                  # Main dashboard with tab router
├─ components/
│  ├─ features/                 # Domain-specific screens
│  │  ├─ CustomerProfile.tsx
│  │  ├─ VendorBills.tsx
│  │  ├─ InvoiceBilling.tsx
│  │  ├─ ImportShipmentForm.tsx
│  │  ├─ ImportShipmentDetailReport.tsx
│  │  ├─ GeneralLedger.tsx
│  │  └─ ... (other ledgers/reports)
│  └─ ui/                       # Shared widgets, dialogs, animations
├─ lib/                         # Firebase init, currency utils, validation helpers
├─ models/                      # TypeScript interfaces for each collection
└─ services/                    # CRUD/service modules (customers, vendors, invoices...)
```

---

## Key Workflows

### Profiles
- Customers store address, tax IDs, and nested consignees.
- Vendors are grouped by service type (airline, trucking, customs, etc.) and feed vendor bills.
- Feature dialogs provide list/search/edit flows without leaving the current page.

### Shipments
- Import & export forms support mode toggles (shipping vs flight), container/airway logic, and invoice linking.
- Auto-generated job numbers (IMP-YYYY-XXXX / EXP-YYYY-XXXX).
- Detail report screens summarize charges in any currency and now open a detail dialog on row tap.

### Billing, Vendor Bills, and Expenses
- **Invoice/Billing** tab hosts both customer invoices and vendor bills. Switching tabs keeps the same experience while hitting different Firestore documents.
- Vendor bills can link to an existing vendor invoice or auto-create one. When bills change (amount/status) the linked invoice is updated and ledgers refresh instantly.
- Expenses are for company-owned costs (salaries, bills, travel). Mobile cards show the amount/status with swipe-friendly delete buttons.

### Ledgers
- Customer, vendor, and general ledgers derive from invoices, vendor bills, and expenses. Each row/card opens the new detail dialog summarizing debit/credit/balance data.
- General Ledger provides Receivable / Payable / Expense views with summary chips that respect currency conversions.

### Reporting
- Profit & Loss: start/end date filters share a single responsive row; statements combine invoices + vendor bills + expenses.
- Balance Sheet: “As of date” filter is centered and drives receivables, account payables (vendor invoices + standalone bills), and equity.
- General Ledger detail dialogs help auditors drill into specific transactions without paging away.

---

## Security & Authentication

- Firebase Auth currently handles login/signup. Tokens are stored in cookies via `/api/auth/set-cookie`.
- `proxy.ts` enforces protected routes on the server.
- For production:
  - Store session tokens as `httpOnly` cookies.
  - Add server-side token verification and rate limiting.
  - Expand Firestore rules to scope by tenant/user role as needed (the app already leans towards multi-tenant via service-layer filtering).

---

## Getting Started

1. **Install**
   ```bash
   git clone <repo>
   cd logistic-app
   npm install
   ```

2. **Env Setup**
   ```bash
   cp .env.example .env.local
   # Fill in Firebase keys (Auth + Firestore)
   ```

3. **Development server**
   ```bash
   npm run dev
   ```

4. **Lint / Type Check**
   ```bash
   npm run lint
   npm run build   # includes TypeScript check
   ```

5. **Deploy**
   - Optimized for Vercel (`npm run build`).
   - Configure env vars on Vercel dashboard (`NEXT_PUBLIC_FIREBASE_*` + any backend secrets).

---

## Development Notes

- **Services first**: add new collections by defining a model in `src/models/*` and a service in `src/services/*`. UI components never talk to Firestore directly.
- **Detail Dialogs**: reuse `DetailDialog` with scroll locking for any drill-down (see shipment reports or ledger components).
- **Currency conversions**: use helpers from `src/lib/currency.ts` to keep totals consistent between invoices, bills, and ledgers.
- **Testing**: plug in `vitest`/`@testing-library/react` for service and component tests (not included yet, but the project is TypeScript strict).
- **Migration**: `services/` structure makes it straightforward to swap Firestore for Postgres/Supabase/Mongo. Update the service implementations, keep the rest of the app untouched.

---

## Roadmap Ideas

- Multi-tenant isolation (tenantId fields + Firestore rules).
- Server-verified auth (NextAuth or Supabase Auth) and httpOnly cookies.
- Automated backfill scripts for legacy vendor bills to ensure invoices exist for every record.
- Export to CSV/PDF from shipment reports and ledgers.

---

**Maintainers**: Refer to `src/services` for database interactions and `src/components/features` for domain screens.  
**Last major update**: November 22, 2025 – added auto-linked vendor bills, modal detail dialogs, and mobile UX upgrades.
