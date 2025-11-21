// Customer service functions.
// This is the only place where the UI talks to Firestore for customers.
// A future backend engineer can swap the implementation here without
// touching the React components.

import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  doc,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import {
  CustomerFormValues,
  CustomerProfile,
  emptyCustomerForm,
} from '@/models/profiles';

// Collection name used in Firestore (can be changed centrally).
const CUSTOMERS_COLLECTION = 'customers';

// Fetch all customers from Firestore and map them into the
// CustomerProfile shape expected by the UI.
export async function listCustomers(): Promise<CustomerProfile[]> {
  const db = getFirebaseDb();
  const snap = await getDocs(collection(db, CUSTOMERS_COLLECTION));

  const items: CustomerProfile[] = snap.docs.map((docSnap) => {
    const data = docSnap.data() as any;
    return {
      id: docSnap.id,
      // createdAt is stored as a Firestore Timestamp; convert it to a
      // human‑readable string for display. Fallback to raw value or empty.
      createdAt: data.createdAt?.toDate
        ? data.createdAt.toDate().toLocaleString()
        : data.createdAt ?? '',
      customerName: data.customerName ?? '',
      address: data.address ?? '',
      city: data.city ?? '',
      country: data.country ?? '',
      email1: data.email1 ?? '',
      email2: data.email2 ?? '',
      email3: data.email3 ?? '',
      contact1: data.contact1 ?? '',
      contact2: data.contact2 ?? '',
      contact3: data.contact3 ?? '',
      mainCommodity: data.mainCommodity ?? '',
      otherCommodity: data.otherCommodity ?? '',
      ntnNumber: data.ntnNumber ?? '',
      gstNumber: data.gstNumber ?? '',
      srbNumber: data.srbNumber ?? '',
      // Normalise consignees and ensure the UI always has 12 rows.
      consignees: Array.isArray(data.consignees)
        ? (data.consignees as any[]).map((c) => ({
            name: c.name ?? '',
            tradeLicense: c.tradeLicense ?? '',
          }))
        : emptyCustomerForm().consignees,
    };
  });

  return items;
}

// Create a new customer document from form values and return
// the full CustomerProfile back to the UI.
export async function createCustomer(
  values: CustomerFormValues,
): Promise<CustomerProfile> {
  const db = getFirebaseDb();
  const payload = {
    ...values,
    consignees: values.consignees,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, CUSTOMERS_COLLECTION), payload);
  const now = new Date();
  return {
    id: docRef.id,
    createdAt: now.toLocaleString(),
    ...values,
  };
}

// Update an existing customer document by id.
export async function updateCustomer(
  id: string,
  values: CustomerFormValues,
): Promise<void> {
  const db = getFirebaseDb();
  const ref = doc(db, CUSTOMERS_COLLECTION, id);
  await updateDoc(ref, {
    ...values,
    consignees: values.consignees,
  });
}

// Delete a customer document by id.
export async function deleteCustomer(id: string): Promise<void> {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, CUSTOMERS_COLLECTION, id));
}
