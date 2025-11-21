// Shared domain models for the UI layer.
// These types define what the dashboard needs to render Customer/Vendor profiles,
// independent of the underlying backend or database. A backend engineer can
// adapt whatever persistence schema they like to these shapes.

// Basic consignee row used by Customer profiles.
export type Consignee = {
  name: string;
  tradeLicense: string;
};

// Shape of the customer form as used by the UI (form state / create & edit).
export type CustomerFormValues = {
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
  consignees: Consignee[];
};

// Customer record as returned from the service layer.
// It extends the form values with an `id` and a human‑readable `createdAt`.
export type CustomerProfile = CustomerFormValues & {
  id: string;
  createdAt: string;
};

// Helper factory for an empty customer form (used for initial state and resets).
export const emptyCustomerForm = (): CustomerFormValues => ({
  customerName: '',
  address: '',
  city: '',
  country: '',
  email1: '',
  email2: '',
  email3: '',
  contact1: '',
  contact2: '',
  contact3: '',
  mainCommodity: '',
  otherCommodity: '',
  ntnNumber: '',
  gstNumber: '',
  srbNumber: '',
  consignees: Array.from({ length: 12 }, () => ({ name: '', tradeLicense: '' })),
});

// Shape of the vendor form as used by the UI (form state / create & edit).
export type VendorFormValues = {
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
  type: string;
  services: string;
  ntnNumber: string;
  gstNumber: string;
  srbNumber: string;
};

// Vendor record as returned from the service layer.
// It extends the form values with an `id` and a human‑readable `createdAt`.
export type VendorProfile = VendorFormValues & {
  id: string;
  createdAt: string;
};

// Helper factory for an empty vendor form (used for initial state and resets).
export const emptyVendorForm = (): VendorFormValues => ({
  vendorName: '',
  address: '',
  city: '',
  country: '',
  email1: '',
  email2: '',
  email3: '',
  contact1: '',
  contact2: '',
  contact3: '',
  type: '',
  services: '',
  ntnNumber: '',
  gstNumber: '',
  srbNumber: '',
});
