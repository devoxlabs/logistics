// Vendor service functions.
// This module isolates Firestore calls for vendors behind a small API,
// so the UI does not depend directly on Firebase.

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
import { VendorFormValues, VendorProfile } from '@/models/profiles';
import { formatTimestamp, readString } from '@/lib/firestoreUtils';

// Collection name used in Firestore (can be changed centrally).
const VENDORS_COLLECTION = 'vendors';

// Fetch all vendors from Firestore and map them into the
// VendorProfile shape expected by the UI.
export async function listVendors(): Promise<VendorProfile[]> {
  const db = getFirebaseDb();
  const snap = await getDocs(collection(db, VENDORS_COLLECTION));

  const items: VendorProfile[] = snap.docs.map((docSnap) => {
    const data = docSnap.data() as Record<string, unknown>;
    return {
      id: docSnap.id,
      createdAt: formatTimestamp(data.createdAt),
      vendorName: readString(data.vendorName),
      address: readString(data.address),
      city: readString(data.city),
      country: readString(data.country),
      email1: readString(data.email1),
      email2: readString(data.email2),
      email3: readString(data.email3),
      contact1: readString(data.contact1),
      contact2: readString(data.contact2),
      contact3: readString(data.contact3),
      type: readString(data.type),
      services: readString(data.services),
      ntnNumber: readString(data.ntnNumber),
      gstNumber: readString(data.gstNumber),
      srbNumber: readString(data.srbNumber),
    };
  });

  return items;
}

// Create a new vendor document from form values and return
// the VendorProfile back to the UI.
export async function createVendor(
  values: VendorFormValues,
): Promise<VendorProfile> {
  const db = getFirebaseDb();
  const payload = {
    ...values,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, VENDORS_COLLECTION), payload);
  const now = new Date();
  return {
    id: docRef.id,
    createdAt: now.toLocaleString(),
    ...values,
  };
}

// Update an existing vendor document by id.
export async function updateVendor(
  id: string,
  values: VendorFormValues,
): Promise<void> {
  const db = getFirebaseDb();
  const ref = doc(db, VENDORS_COLLECTION, id);
  await updateDoc(ref, {
    ...values,
  });
}

// Delete a vendor document by id.
export async function deleteVendor(id: string): Promise<void> {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, VENDORS_COLLECTION, id));
}
