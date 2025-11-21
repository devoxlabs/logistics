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

// Collection name used in Firestore (can be changed centrally).
const VENDORS_COLLECTION = 'vendors';

// Fetch all vendors from Firestore and map them into the
// VendorProfile shape expected by the UI.
export async function listVendors(): Promise<VendorProfile[]> {
  const db = getFirebaseDb();
  const snap = await getDocs(collection(db, VENDORS_COLLECTION));

  const items: VendorProfile[] = snap.docs.map((docSnap) => {
    const data = docSnap.data() as any;
    return {
      id: docSnap.id,
      createdAt: data.createdAt?.toDate
        ? data.createdAt.toDate().toLocaleString()
        : data.createdAt ?? '',
      vendorName: data.vendorName ?? '',
      address: data.address ?? '',
      city: data.city ?? '',
      country: data.country ?? '',
      email1: data.email1 ?? '',
      email2: data.email2 ?? '',
      email3: data.email3 ?? '',
      contact1: data.contact1 ?? '',
      contact2: data.contact2 ?? '',
      contact3: data.contact3 ?? '',
      type: data.type ?? '',
      services: data.services ?? '',
      ntnNumber: data.ntnNumber ?? '',
      gstNumber: data.gstNumber ?? '',
      srbNumber: data.srbNumber ?? '',
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
