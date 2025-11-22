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

### Files You’ll Touch Most Often

| Area | Primary Files | Notes |
| --- | --- | --- |
| Shipments | `src/components/features/ImportShipmentForm.tsx`, `ExportShipmentForm.tsx`, `src/services/shipments.ts` | Linking jobs to invoices + calculating totals lives here. |
| Billing / Vendor Bills | `InvoiceBilling.tsx`, `VendorBills.tsx`, `src/services/invoices.ts`, `src/services/vendorBills.ts` | `syncInvoiceFromBill` auto-creates/updates vendor invoices. |
| Ledgers & Reports | `CustomerLedger.tsx`, `VendorLedger.tsx`, `GeneralLedger.tsx`, `src/services/financials.ts`, `src/lib/ledger.ts` | Any math change happens in the service/helper layer, not the components. |
| UI Shell | `src/components/ui/*`, `src/components/Sidebar.tsx`, `src/app/page.tsx` | Update these if you add a new feature tab or shared component. |

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
- Balance Sheet: "As of date" filter is centered and drives receivables, account payables (vendor invoices + standalone bills), and equity.
- General Ledger detail dialogs help auditors drill into specific transactions without paging away.

---

## Developer Notes & Extension Guide

### Service Layer Contracts

All persistence goes through `src/services`. Each service exposes simple CRUD helpers:

```ts
// src/services/customers.ts
export async function listCustomers(): Promise<CustomerProfile[]> { /* ... */ }
export async function createCustomer(values: CustomerFormValues): Promise<CustomerProfile> { /* ... */ }
export async function updateCustomer(id: string, values: CustomerFormValues): Promise<void> { /* ... */ }
export async function deleteCustomer(id: string): Promise<void> { /* ... */ }
```

**When adding/changing fields**
1. Update the model interface (`src/models/*.ts`).
2. Update forms/components to collect/show the field.
3. Update service payloads (`create*`, `update*`) so Firestore (or your DB) stores it.
4. Update derived helpers (`src/lib/ledger.ts`, `src/services/financials.ts`) if the field participates in totals.

### Removing Firebase / Using Another DB

| Step | What to touch | Tips |
| --- | --- | --- |
| Swap client | Replace `getFirebaseDb()` in `src/lib/firebase.ts` with your DB client (Prisma, Supabase, Mongo, etc.). | Keep the exported helpers (e.g., `getFirebaseAuth`) or rename and update imports. |
| Rewrite services | Update `src/services/*.ts` to use the new client. | Preserve return shapes from services so UI stays unchanged. |
| Replace auth | Update `src/services/authClient.ts` + `/api/auth/set-cookie` to use your auth provider. | Ensure `proxy.ts` verifies the new session token. |
| Update rules/security | Firestore rules become SQL row-level security or API auth. Scope by tenant/user in the new backend. | Reference the Firestore rules in the README as a starting point. |

**Example**: Port invoices to Prisma/PostgreSQL

```ts
// src/services/invoices.ts
import prisma from '@/lib/prisma';

export async function listInvoices(): Promise<Invoice[]> {
  const rows = await prisma.invoice.findMany({ orderBy: { invoiceDate: 'desc' } });
  return rows.map((row) => ({
    ...row,
    id: row.id,
    lineItems: row.lineItems as InvoiceLineItem[],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}
```

### Where Logic Lives

- **Math & conversions**: `src/lib/currency.ts`, `src/lib/ledger.ts`, `src/services/financials.ts`.
- **Dialogs**: `src/components/ui/DetailDialog.tsx` handles scroll locking + animation. Wrap any detail content inside this component.
- **Auto numbering**: `generateImportJobNumber`, `generateExportJobNumber`, and `generateVendorJobNumber` live in `src/services/shipments.ts` / `src/services/vendorBills.ts`.
- **Invoice/bill syncing**: `syncInvoiceFromBill` inside `VendorBills.tsx`.

### Quick Tweaks Cheat Sheet

| Goal | Steps |
| --- | --- |
| Add a new vendor bill category | Update `VENDOR_BILL_CATEGORIES` + dropdowns in `VendorBills.tsx`. |
| Change ledger columns | Extend `DerivedLedgerEntry` in `src/lib/ledger.ts`, then update each ledger component render. |
| Add a brand-new feature tab | Create `src/components/features/MyFeature.tsx`, import it in `src/app/page.tsx`, and add the entry to `TAB_TITLES` + `Sidebar.tsx`. |
| Backfill invoices for existing vendor bills | Loop through `listVendorBills()` and call `syncInvoiceFromBill` manually (see the function in `VendorBills.tsx`). |

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

### Quick Checklist for Common Tweaks

| Scenario | Checklist |
| --- | --- |
| Add new Firestore collection | 1) Create model in `src/models` 2) Add service in `src/services` 3) Build UI component under `src/components/features` 4) Add to sidebar + router. |
| Replace Firebase Auth | Update `src/services/authClient.ts`, `/api/auth/set-cookie`, and `proxy.ts`. Verify new cookies inside middleware. |
| Support multiple tenants | Add `tenantId` to models, filter by the signed-in user's tenant in every service, and update Firestore rules (or DB security) accordingly. |

---

## Roadmap Ideas

- Multi-tenant isolation (tenantId fields + Firestore rules).
- Server-verified auth (NextAuth or Supabase Auth) and httpOnly cookies.
- Automated backfill scripts for legacy vendor bills to ensure invoices exist for every record.
- Export to CSV/PDF from shipment reports and ledgers.

---

**Maintainers**: Refer to `src/services` for database interactions and `src/components/features` for domain screens.  
**Last major update**: November 22, 2025 – added auto-linked vendor bills, modal detail dialogs, and mobile UX upgrades.
