// Ledger service functions for financial tracking
// CRUD operations for ledger entries collection in Firestore

import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    doc,
    query,
    where,
    orderBy,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { LedgerEntry } from '@/models/ledger';
import { formatTimestamp } from '@/lib/firestoreUtils';

const LEDGER_COLLECTION = 'ledger';

// List all ledger entries
export async function listLedgerEntries(): Promise<LedgerEntry[]> {
    const db = getFirebaseDb();
    const snap = await getDocs(
        query(collection(db, LEDGER_COLLECTION), orderBy('date', 'desc'))
    );

    const items: LedgerEntry[] = snap.docs.map((docSnap) => {
        const data = docSnap.data() as Record<string, unknown>;
        const entry = {
            ...data,
            createdAt: formatTimestamp(data.createdAt),
        } as Omit<LedgerEntry, 'id'>;
        return {
            id: docSnap.id,
            ...entry,
        };
    });

    return items;
}

// List ledger entries by customer
export async function listCustomerLedgerEntries(customerId: string): Promise<LedgerEntry[]> {
    const db = getFirebaseDb();
    const snap = await getDocs(
        query(
            collection(db, LEDGER_COLLECTION),
            where('customerId', '==', customerId),
            orderBy('date', 'desc')
        )
    );

    const items: LedgerEntry[] = snap.docs.map((docSnap) => {
        const data = docSnap.data() as Record<string, unknown>;
        const entry = {
            ...data,
            createdAt: formatTimestamp(data.createdAt),
        } as Omit<LedgerEntry, 'id'>;
        return {
            id: docSnap.id,
            ...entry,
        };
    });

    return items;
}

// List ledger entries by vendor
export async function listVendorLedgerEntries(vendorId: string): Promise<LedgerEntry[]> {
    const db = getFirebaseDb();
    const snap = await getDocs(
        query(
            collection(db, LEDGER_COLLECTION),
            where('vendorId', '==', vendorId),
            orderBy('date', 'desc')
        )
    );

    const items: LedgerEntry[] = snap.docs.map((docSnap) => {
        const data = docSnap.data() as Record<string, unknown>;
        const entry = {
            ...data,
            createdAt: formatTimestamp(data.createdAt),
        } as Omit<LedgerEntry, 'id'>;
        return {
            id: docSnap.id,
            ...entry,
        };
    });

    return items;
}

// Create ledger entry
export async function createLedgerEntry(
    entry: Omit<LedgerEntry, 'id' | 'createdAt'>
): Promise<LedgerEntry> {
    const db = getFirebaseDb();
    const payload = {
        ...entry,
        createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, LEDGER_COLLECTION), payload);
    const now = new Date();
    return {
        id: docRef.id,
        createdAt: now.toLocaleString(),
        ...entry,
    };
}

// Update ledger entry
export async function updateLedgerEntry(
    id: string,
    entry: Partial<LedgerEntry>
): Promise<void> {
    const db = getFirebaseDb();
    const ref = doc(db, LEDGER_COLLECTION, id);
    await updateDoc(ref, entry);
}

// Delete ledger entry
export async function deleteLedgerEntry(id: string): Promise<void> {
    const db = getFirebaseDb();
    await deleteDoc(doc(db, LEDGER_COLLECTION, id));
}
