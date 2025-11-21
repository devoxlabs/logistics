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
  Consignee,
  emptyCustomerForm,
} from '@/models/profiles';
import { formatTimestamp, readString } from '@/lib/firestoreUtils';

// Collection name used in Firestore (can be changed centrally).
const CUSTOMERS_COLLECTION = 'customers';

// Fetch all customers from Firestore and map them into the
// CustomerProfile shape expected by the UI.
export async function listCustomers(): Promise<CustomerProfile[]> {
  const db = getFirebaseDb();
  const snap = await getDocs(collection(db, CUSTOMERS_COLLECTION));

  const items: CustomerProfile[] = snap.docs.map((docSnap) => {
    const data = docSnap.data() as Record<string, unknown>;
    const consignees = Array.isArray(data.consignees)
      ? (data.consignees as Array<Record<string, unknown>>).map<Consignee>((c) => ({
          name: readString(c?.name),
          tradeLicense: readString(c?.tradeLicense),
        }))
      : emptyCustomerForm().consignees;

    return {
      id: docSnap.id,
      createdAt: formatTimestamp(data.createdAt),
      customerName: readString(data.customerName),
      address: readString(data.address),
      city: readString(data.city),
      country: readString(data.country),
      email1: readString(data.email1),
      email2: readString(data.email2),
      email3: readString(data.email3),
      contact1: readString(data.contact1),
      contact2: readString(data.contact2),
      contact3: readString(data.contact3),
      mainCommodity: readString(data.mainCommodity),
      otherCommodity: readString(data.otherCommodity),
      ntnNumber: readString(data.ntnNumber),
      gstNumber: readString(data.gstNumber),
      srbNumber: readString(data.srbNumber),
      consignees,
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
