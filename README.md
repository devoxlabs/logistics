# Logistic App Frontend

Business dashboard frontend built with **Next.js (App Router) + TypeScript + Tailwind CSS**.  
Firebase Auth + Firestore are wired in only as a **temporary test backend** so you can run and verify flows locally; they are deliberately simple and are meant to be replaced by a real backend.

This document is written for the backend / full‑stack engineer who will take over from here. It explains:

- The stack & structure.
- How colors, layout and responsiveness are wired.
- Where CRUD logic lives and how dialogs work.
- How Firebase is attached, where to unplug it, and what to replace.

---

## 1. Tech Stack & Project Layout

**Stack**

- **Framework:** Next.js 16, App Router (`src/app`), TypeScript.
- **Styling:** Tailwind CSS (via `@import "tailwindcss";` in `src/app/globals.css`).
- **UI Icons:** `lucide-react`.
- **Auth (temp):** Firebase Auth (client‑side SDK).
- **Data (temp):** Cloud Firestore (client‑side SDK).

**Key directories**

- `src/app/page.tsx` – main dashboard screen: sidebar + Customer/Vendor profile UI + all dialogs.
- `src/components/Sidebar.tsx` – responsive, collapsible sidebar (desktop + mobile).
- `src/app/(auth)/layout.tsx` – layout wrapper for auth pages.
- `src/app/(auth)/login/page.tsx` – login screen with Firebase Auth.
- `src/app/(auth)/signup/page.tsx` – signup screen with Firebase Auth.
- `src/lib/firebase.ts` – Firebase client initialization (Auth + Firestore).
- `src/proxy.ts` – simple proxy/middleware‑style guard for `/`, `/login`, `/signup` (cookie‑based).
- `src/app/api/auth/set-cookie/route.ts` – endpoint to set a `firebaseAuthToken` cookie after login/signup.
- `.env.local` – Firebase config (currently filled for the dev project; must NOT be committed to public repos).

The app is otherwise a single‑page dashboard; routing is minimal: `/` for the main app, `/login` and `/signup` for auth.

---

## 2. Color System & Theming

The design is intentionally a **light, business‑style dashboard** with soft neutrals and two main accents:

- **Primary:** `#34a85a` – green (main actions, save buttons, active vendor/customer icon).
- **Secondary:** `#6495ed` – blue (focus rings, some header buttons, sidebar accents).

### 2.1 Global background & text

File: `src/app/globals.css`

- Root theme variables (used by the `@theme inline` Tailwind setup):

```css
:root {
  /* Soft app background + default text */
  --background: #f5f7fb;
  --foreground: #111827;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}
```

To change the overall app background or default text color, update `--background` and `--foreground` here.

### 2.2 Layout background

File: `src/app/layout.tsx`

```tsx
<body
  className={[
    geistSans.variable,
    geistMono.variable,
    'antialiased bg-[#f5f7fb] text-slate-900',
  ].join(' ')}
>
```

This is consistent with `globals.css`. If you change the background variable, you generally want to mirror it here or drop the `bg[...]` utility and rely entirely on `body { background: var(--background) }`.

### 2.3 Sidebar theme

File: `src/components/Sidebar.tsx`

Top‑level sidebar container:

```tsx
const rootClasses = [
  'bg-[#f8fafc] flex flex-col shadow-sm transition-all duration-200',
  // width/height classes depending on variant...
].join(' ');
```

Active parent item (e.g., “Add Jobs”) uses a subtle blue accent:

```tsx
const isParentActive = hasChildren
  ? item.children!.some(child => child.id === activeId)
  : activeId === item.id;

const buttonClasses = [
  'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left cursor-pointer transition-all duration-150 ease-out hover:-translate-y-[1px] border-l-4 border-transparent',
  isParentActive
    ? 'bg-slate-50 text-slate-900 border-[#6495ed] font-semibold'
    : 'text-slate-700 hover:bg-slate-50',
].join(' ');
```

Parent icon pill:

```tsx
<span
  className={[
    'flex h-7 w-7 items-center justify-center rounded-md text-sm border',
    isParentActive
      ? 'bg-[#6495ed1a] text-[#6495ed] border-[#6495ed33]'
      : 'bg-slate-100 text-slate-500 border-transparent',
  ].join(' ')}
>
  <item.Icon className='h-4 w-4' />
</span>
```

Active **child** tab (e.g., “Customer Profile”, “Vendor Profile”) uses the primary green:

```tsx
const childClasses = [
  'flex w-full items-center rounded-lg px-3 py-1.5 text-left text-xs cursor-pointer transition-all duration-150 ease-out hover:-translate-y-[1px] border-l-4 border-transparent',
  isChildActive
    ? 'bg-[#e6f6ec] text-[#185a32] font-semibold border-[#34a85a]'
    : 'text-slate-600 hover:bg-slate-50',
].join(' ');

<span
  className={[
    'mr-2 flex h-6 w-6 items-center justify-center rounded-md border text-[11px]',
    isChildActive
      ? 'bg-[#34a85a] text-slate-900 border-[#34a85a]'
      : 'bg-slate-100 text-slate-500 border-transparent',
  ].join(' ')}
>
  <child.Icon className='h-3.5 w-3.5' />
</span>
```

**Tweaking colors:** change `#34a85a` for a different primary and `#6495ed` for a different secondary. The rest is built on greys (`slate-*`), so they will blend with most corporate palettes.

### 2.4 Main action buttons

File: `src/app/page.tsx`

- **Save Customer** (main form):

```tsx
<button
  type='submit'
  disabled={isSaving}
  className='inline-flex w-full items-center justify-center rounded-md bg-[#34a85a] px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-[#2c8a4e] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer'
>
  {isSaving ? (
    <span className='inline-flex items-center gap-2'>
      <span className='h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin' />
      <span>Saving...</span>
    </span>
  ) : (
    'Save Customer'
  )}
</button>
```

- **Save Vendor** (main form) button is identical, also using `bg-[#34a85a]` / `hover:bg-[#2c8a4e]`.

- **Save Changes** in Edit dialogs (Customer & Vendor) use the same primary styling so they stay consistent.

### 2.5 Auth page theme

File: `src/app/(auth)/layout.tsx`

```tsx
<div className='min-h-screen flex items-center justify-center bg-[#f5f7fb] px-4 py-8 sm:px-6'>
  <div className='w-full max-w-md bg-white shadow-sm rounded-xl border border-slate-200 p-6 sm:p-8'>
    {children}
  </div>
</div>
```

Buttons in `login` and `signup` pages share the same primary green, plus pointer and disabled states:

```tsx
className='w-full mt-2 rounded-lg bg-[#34a85a] text-white text-sm font-medium py-2.5 hover:bg-[#2c8a4e] transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer'
```

To tweak the entire auth theme, adjust the background in the layout and the button classes in both auth pages.

---

## 3. Main UI: Customer / Vendor Dashboard

File: `src/app/page.tsx`

This is the primary dashboard screen. It is a **client component** (`'use client';`) and uses extensive local state for forms and dialogs.

### 3.1 Data Models (UI layer)

Types at the top of `page.tsx`:

- `Consignee` – `{ name: string; tradeLicense: string }`
- `CustomerFormValues`

  ```ts
  type CustomerFormValues = {
    customerName: string;
    address: string;
    city: string;
    country: string;
    email1: string;
    email2: string;
    email3: string;
    contact1: string;
    contact2: string;
    contact3: string;
    mainCommodity: string;
    otherCommodity: string;
    ntnNumber: string;
    gstNumber: string;
    srbNumber: string;
    consignees: Consignee[]; // always 12 entries in UI
  };
  ```

- `CustomerProfile` – extends `CustomerFormValues` with `id: string; createdAt: string;` (UI‑level profile).

- `VendorFormValues` and `VendorProfile` mirror the Excel definitions:

  ```ts
  type VendorFormValues = {
    vendorName: string;
    address: string;
    city: string;
    country: string;
    email1: string;
    email2: string;
    email3: string;
    contact1: string;
    contact2: string;
    contact3: string;
    type: string;      // dropdown: Shipping Line, Transporter, Clearing Agent
    services: string;
    ntnNumber: string;
    gstNumber: string;
    srbNumber: string;
  };
  ```

These types are the **UI contract**. A backend engineer can keep them stable and map any backend DTOs to/from these structures in a service layer.

### 3.2 Layout & responsiveness

The root layout in `Home()`:

- Desktop: left sidebar (fixed), right main content.
- Mobile: top bar with a hamburger (`Menu` icon) → slide‑in sidebar.

Key structure:

```tsx
return (
  <div className='min-h-screen flex bg-[#f5f7fb]'>
    {/* Desktop sidebar */}
    <div className='hidden md:block'>
      <Sidebar variant='desktop' selectedId={selectedId} onSelect={setSelectedId} />
    </div>

    {/* Main content */}
    <main className='flex-1 flex flex-col'>
      {/* Mobile top bar */}
      <div className='md:hidden ...'>
        <button ... aria-label='Open menu'>
          <Menu ... />
        </button>
      </div>

      {/* Content area, switches on selectedId */}
      <div className='flex-1 p-4 md:p-8'>
        {selectedId === 'customer-profile' ? (
          {/* Customer Profile card + form */}
        ) : selectedId === 'vendor-profile' ? (
          {/* Vendor Profile card + form */}
        ) : (
          {/* Placeholder card for all other tabs */}
        )}
      </div>
    </main>

    {/* Mobile sidebar overlay */}
    <div className='fixed inset-0 z-30 md:hidden ...'>
      {/* backdrop + sliding Sidebar variant='mobile' */}
    </div>
  </div>
);
```

The `Sidebar` component receives `selectedId` and an `onSelect` callback. Top‑level items only expand/collapse; actual navigation happens through sub‑item IDs (`'customer-profile'`, `'vendor-profile'`, etc.).

---

## 4. CRUD Logic & Dialogs

### 4.1 State overview (top of `Home`)

Customer & vendor state:

- `customers: CustomerProfile[]`
- `formValues: CustomerFormValues`
- `vendors: VendorProfile[]`
- `vendorFormValues: VendorFormValues`

Saving and validation:

- `isSaving`, `saveError`, `saveMessage`, `fieldErrors` for customers.
- `vendorIsSaving`, `vendorSaveError`, `vendorSaveMessage`, `vendorFieldErrors` for vendors.

Dialog state:

- `dialogMode: 'open' | 'edit' | 'delete' | null` – for **customer** dialogs.
- `dialogStep: 'list' | 'detail'` – search/list step vs detail view.
- `selectedDialogCustomer: CustomerProfile | null`
- `editValues: CustomerFormValues | null`
- `pendingDelete: CustomerProfile | null` – for the custom confirmation popup.
- `vendorDialogMode`, `vendorDialogSearch`, `vendorDialogStep` – same concepts for vendors.
- `selectedDialogVendor`, `editVendorValues`, `pendingVendorDelete` – vendor equivalents.

Scroll lock:

- `anyOverlayOpen` derived from dialog state, and a `useEffect` sets `document.body.style.overflow = 'hidden'` while any dialog or delete confirmation is open.

### 4.2 Firestore integration (temporary)

Data loading (`useEffect` near top of `Home`):

```ts
useEffect(() => {
  const load = async () => {
    const db = getFirebaseDb();

    // Customers
    const snap = await getDocs(collection(db, 'customers'));
    const items: CustomerProfile[] = snap.docs.map(docSnap => { ... });
    setCustomers(items);

    // Vendors
    const vendorSnap = await getDocs(collection(db, 'vendors'));
    const vendorItems: VendorProfile[] = vendorSnap.docs.map(docSnap => { ... });
    setVendors(vendorItems);
  };
  load();
}, []);
```

**Create (Customer):** `handleCustomerSubmit` (around line ~200)

- Validates:
  - `customerName` is required.
  - At least one email (`email1/2/3`) required.
  - At least one contact (`contact1/2/3`) required.
- On success:
  - `addDoc(collection(db, 'customers'), payloadWithServerTimestamp)`.
  - Pushes new record into `customers` with `createdAt` as a human‑readable string.
  - Resets `formValues` and shows `saveMessage`.

**Create (Vendor):** `handleVendorSubmit` is analogous.

**Edit (Customer):**

- `openDialog('edit')` sets `dialogMode = 'edit'`, clears search and selection.
- In the edit dialog:
  - Step 1: `CustomerTable` listing; clicking a row calls `beginEditCustomer`:

    ```ts
    const beginEditCustomer = (customer: CustomerProfile) => {
      setSelectedDialogCustomer(customer);
      const { id, createdAt, ...rest } = customer;
      setEditValues({ ...rest });     // full CustomerFormValues
      setDialogStep('detail');
    };
    ```

  - Step 2: full edit form bound to `editValues` and submitted to `handleEditSubmit`:

    ```ts
    const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!selectedDialogCustomer || !editValues) return;
      try {
        setIsEditingCustomer(true);
        const db = getFirebaseDb();
        const ref = doc(db, 'customers', selectedDialogCustomer.id);
        await updateDoc(ref, { ...editValues, consignees: editValues.consignees });
        setCustomers(prev =>
          prev.map(c => (c.id === selectedDialogCustomer.id ? { ...c, ...editValues } : c)),
        );
        // Dialog remains open so user can review more edits
      } catch (error) {
        console.error('Failed to update customer', error);
      } finally {
        setIsEditingCustomer(false);
      }
    };
    ```

  - The dialog **does not close automatically** after save; user closes it via “Cancel” or the `×` button.

**Edit (Vendor):** `handleVendorEditSubmit` is structurally identical, updating the `vendors` array instead.

**Open dialogs (Customer & Vendor):**

- Use a shared `DialogShell` and either `CustomerTable` or a vendor listing table.
- Two‑step flow:
  - List view → click a row → detail view with structured read‑only sections.
  - Detail view includes a “Back to search” button using the `BackButton` helper.

**Delete dialogs:**

- **Customer Delete dialog:** `dialogMode === 'delete'`
  - Step 1 (list): `CustomerTable` with `onDeleteClick` and row click to view details.
  - Step 2 (detail): shows the same `renderCustomerDetails` plus a "Delete this customer" button.
  - Actual deletion is done through a custom confirmation popup driven by `pendingDelete`:

    ```tsx
    {pendingDelete && (
      <div className='fixed inset-0 ...'>
        <button onClick={() => setPendingDelete(null)}>Cancel</button>
        <button
          type='button'
          onClick={async () => {
            await performDeleteCustomer(pendingDelete);
            setPendingDelete(null);
          }}
        >
          Delete
        </button>
      </div>
    )}
    ```

  - `performDeleteCustomer`:

    ```ts
    const performDeleteCustomer = async (customer: CustomerProfile) => {
      try {
        const db = getFirebaseDb();
        await deleteDoc(doc(db, 'customers', customer.id));
        setCustomers(prev => prev.filter(c => c.id !== customer.id));
        if (selectedDialogCustomer?.id === customer.id) {
          setSelectedDialogCustomer(null);
          setDialogStep('list');   // detail → back to search
        }
      } catch (error) {
        console.error('Failed to delete customer', error);
      }
    };
    ```

- **Vendor Delete dialog:** mirror of the above using `performDeleteVendor`, `vendorDialogStep`, etc.

**Important behavioral expectations for backend replacement**

- The UI expects CRUD operations to be **optimistic** with local state:
  - After create, new item immediately appears in list.
  - After edit, list reflects changes immediately.
  - After delete, list no longer contains the record.
- Any backend client you introduce should either:
  - Preserve that pattern, or
  - Add appropriate loading and error states (and possibly refetch lists).

---

## 5. Auth Flow (Temporary Firebase Implementation)

> These details matter mainly so you know what to replace. The current approach is NOT production‑grade security and should be considered scaffolding.

### 5.1 Firebase client

File: `src/lib/firebase.ts`

- Initializes Firebase app with `NEXT_PUBLIC_FIREBASE_*` env vars.
- Provides `getFirebaseAuth()` and `getFirebaseDb()` as singletons.
- Throws if used on the server (client‑only design).

### 5.2 Login & signup pages

Files:

- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/signup/page.tsx`

Both are typical forms that call Firebase Auth client functions:

- Login:

  ```ts
  await login(email, password);   // calls authClient + /api/auth/set-cookie
  router.replace('/');
  ```

- Signup:

  ```ts
  await signup(name, email, password);   // calls authClient + /api/auth/set-cookie
  router.replace('/');
  ```

Both pages also watch Firebase’s `onAuthStateChanged` and redirect authenticated users away from `/login` or `/signup` to `/`.

### 5.3 Cookie endpoint & proxy

File: `src/app/api/auth/set-cookie/route.ts`

- Accepts a `{ token }` JSON payload and sets a `firebaseAuthToken` cookie (not `httpOnly`, `sameSite: 'lax'`).

File: `src/proxy.ts`

- Naively gates `/`, `/login`, `/signup` based on presence of that cookie:
  - No token + non‑public path → redirect to `/login`.
  - Token + public path → redirect to `/`.
  - Does **not** verify the token; purely presence‑based.

This is the first area a backend engineer should refactor or replace (e.g., with verified sessions / `next-auth`).

---

## 6. Detaching Firebase & Plugging in a Real Backend

This section is for whoever is going to replace the temporary Firebase backend.

### 6.1 Where Firebase is referenced

1. `src/lib/firebase.ts` – client initialization.
2. **Customer/Vendor CRUD now goes through services:**
   - `src/services/customers.ts` – Firestore implementation for customer APIs.
   - `src/services/vendors.ts` – Firestore implementation for vendor APIs.
   - `src/app/page.tsx` imports those services and no longer calls Firestore directly.
3. `src/app/(auth)/login/page.tsx` and `signup/page.tsx` – Firebase Auth (still direct).
4. `src/app/api/auth/set-cookie/route.ts` – sets cookie from Firebase ID token.
5. `src/proxy.ts` – relies on that cookie for basic route gating.

### 6.2 Existing service layer (customers & vendors)

Customers and vendors already have a concrete service layer wrapping Firestore. The UI talks only to these modules:

- `src/services/customers.ts`

  ```ts
  export async function listCustomers(): Promise<CustomerProfile[]> { ... }
  export async function createCustomer(values: CustomerFormValues): Promise<CustomerProfile> { ... }
  export async function updateCustomer(id: string, values: CustomerFormValues): Promise<void> { ... }
  export async function deleteCustomer(id: string): Promise<void> { ... }
  ```

- `src/services/vendors.ts`

  ```ts
  export async function listVendors(): Promise<VendorProfile[]> { ... }
  export async function createVendor(values: VendorFormValues): Promise<VendorProfile> { ... }
  export async function updateVendor(id: string, values: VendorFormValues): Promise<void> { ... }
  export async function deleteVendor(id: string): Promise<void> { ... }
  ```

Their responsibility is to:

- Call Firestore via `getFirebaseDb()`.
- Map backend documents into `CustomerProfile` / `VendorProfile` UI models.
- Handle server timestamps (`serverTimestamp()`) on create.

When you switch to a different backend, you only need to change these service files, as long as they keep the same function signatures and return the same UI shapes.

### 6.3 Auth service layer

Auth is now abstracted behind `src/services/authClient.ts`, so the login/signup pages no longer import Firebase directly.

- `src/services/authClient.ts`

  ```ts
  export async function login(email: string, password: string): Promise<void>;
  export async function signup(name: string, email: string, password: string): Promise<void>;
  export async function logout(): Promise<void>;
  export function subscribeToAuth(callback: (user: User | null) => void): () => void;
  export async function getCurrentUser(): Promise<User | null>;
  ```

  - Internally uses `getFirebaseAuth()` and Firebase Auth SDK (`signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, `updateProfile`, `signOut`, `onAuthStateChanged`).
  - Calls `/api/auth/set-cookie` via the private `setSessionToken(idToken)` helper after login/signup, and with `null` on logout.

- Auth pages (`login` / `signup`) now:
  - Call `login(...)` / `signup(...)` from `authClient` in their submit handlers.
  - Use `subscribeToAuth(user => { ... })` in `useEffect` to redirect authenticated users away from `/login` and `/signup`.
  - Do not reference Firebase types or methods directly anymore.

### 6.4 Mapping between backend models and UI models

Keep `CustomerFormValues`, `CustomerProfile`, `VendorFormValues`, `VendorProfile` as the **UI contract**. In your services:

- Accept/return these types at the boundary used by components.
- Map to/from whatever DB/DTOs your backend uses (IDs, timestamps, nested relations).

This way, the UI doesn’t care how many tables/collections you have, which DB you use, or how the auth token is structured.

### 6.5 Security & multi‑tenant concerns

Firebase is currently used without per‑user scoping. If you move to a multi‑user backend, you likely want:

- An `ownerId` or `tenantId` on each customer/vendor record.
- Backend APIs that only return data for the current user/tenant.
- Frontend services that include auth tokens/headers when calling those APIs.

The UI is already structured to handle creating, editing, and deleting arbitrary customer/vendor objects; it doesn’t assume global visibility beyond what the services provide.

---

## 7. Summary for the Next Engineer

- This repo is a **fully functional frontend** with:
  - Sidebar navigation.
  - Customer/Vendor profile forms.
  - Create / Open / Edit / Delete dialogs with search, table, detail views, and confirmation popups.
  - Responsive layout (desktop + mobile sidebar + auth pages).
  - Inline validation and loading states.

- Firebase (Auth + Firestore) is used only as a lightweight, dev‑time backend. It is not secure and is expected to be replaced.

- To integrate a real backend:
  1) Introduce customer/vendor/auth service modules.  
  2) Replace direct Firebase calls with those services.  
  3) Replace `/api/auth/set-cookie` + `src/proxy.ts` with your auth/session solution.  
  4) Optionally introduce per‑user scoping and stronger Firestore or DB rules.

Once that’s done, the UI should continue to behave the same from the user’s perspective, regardless of which backend stack you choose. 
