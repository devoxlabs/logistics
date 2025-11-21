// Invoice service functions for billing and financial management
// CRUD operations for invoices collection in Firestore

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
import { InvoiceFormValues, Invoice } from '@/models/invoices';
import { formatTimestamp } from '@/lib/firestoreUtils';

const INVOICES_COLLECTION = 'invoices';

// Generate invoice number
export function generateInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${year}-${random}`;
}

// List all invoices
export async function listInvoices(): Promise<Invoice[]> {
    const db = getFirebaseDb();
    const snap = await getDocs(
        query(collection(db, INVOICES_COLLECTION), orderBy('invoiceDate', 'desc'))
    );

    const items: Invoice[] = snap.docs.map((docSnap) => {
        const data = docSnap.data() as Record<string, unknown>;
        const invoiceData = {
            ...data,
            createdAt: formatTimestamp(data.createdAt),
            updatedAt: formatTimestamp(data.updatedAt),
        } as Omit<Invoice, 'id'>;
        return {
            id: docSnap.id,
            ...invoiceData,
        };
    });

    return items;
}

// List invoices by customer
export async function listInvoicesByCustomer(customerId: string): Promise<Invoice[]> {
    const db = getFirebaseDb();
    const snap = await getDocs(
        query(
            collection(db, INVOICES_COLLECTION),
            where('customerId', '==', customerId),
            orderBy('invoiceDate', 'desc')
        )
    );

    const items: Invoice[] = snap.docs.map((docSnap) => {
        const data = docSnap.data() as Record<string, unknown>;
        const invoiceData = {
            ...data,
            createdAt: formatTimestamp(data.createdAt),
            updatedAt: formatTimestamp(data.updatedAt),
        } as Omit<Invoice, 'id'>;
        return {
            id: docSnap.id,
            ...invoiceData,
        };
    });

    return items;
}

// Create invoice
export async function createInvoice(values: InvoiceFormValues): Promise<Invoice> {
    const db = getFirebaseDb();
    const payload = {
        ...values,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, INVOICES_COLLECTION), payload);
    const now = new Date();
    return {
        id: docRef.id,
        createdAt: now.toLocaleString(),
        updatedAt: now.toLocaleString(),
        ...values,
    };
}

// Update invoice
export async function updateInvoice(
    id: string,
    values: InvoiceFormValues
): Promise<void> {
    const db = getFirebaseDb();
    const ref = doc(db, INVOICES_COLLECTION, id);
    await updateDoc(ref, {
        ...values,
        updatedAt: serverTimestamp(),
    });
}

// Delete invoice
export async function deleteInvoice(id: string): Promise<void> {
    const db = getFirebaseDb();
    await deleteDoc(doc(db, INVOICES_COLLECTION, id));
}

// Mark invoice as paid
export async function markInvoiceAsPaid(
    id: string,
    paidAmount: number,
    paidDate: string
): Promise<void> {
    const db = getFirebaseDb();
    const ref = doc(db, INVOICES_COLLECTION, id);
    await updateDoc(ref, {
        status: 'paid',
        paidAmount,
        paidDate,
        updatedAt: serverTimestamp(),
    });
}
