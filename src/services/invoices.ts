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
    getDoc,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { InvoiceFormValues, Invoice } from '@/models/invoices';
import { formatTimestamp } from '@/lib/firestoreUtils';

const INVOICES_COLLECTION = 'invoices';

// Generate invoice number
export function generateInvoiceNumber(prefix = 'INV'): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${year}-${random}`;
}

const ensurePartyFields = (values: InvoiceFormValues): InvoiceFormValues => {
    const partyType = values.partyType ?? 'customer';
    const normalized = {
        ...values,
        partyType,
        currency: values.currency ?? 'USD',
    };

    if (partyType === 'customer') {
        normalized.partyId = values.partyId || values.customerId;
        normalized.partyName = values.partyName || values.customerName;
        normalized.partyAddress = values.partyAddress || values.customerAddress;
        normalized.partyTaxId = values.partyTaxId || values.customerTaxId;
    } else {
        normalized.partyId = values.partyId || values.vendorId;
        normalized.partyName = values.partyName || values.vendorName;
        normalized.partyAddress = values.partyAddress || values.vendorAddress;
        normalized.partyTaxId = values.partyTaxId || values.vendorTaxId;
    }

    return normalized;
};

const mapInvoiceDoc = (data: Record<string, unknown>, id: string): Invoice => {
    const invoiceData: Omit<Invoice, 'id'> = {
        ...data,
        createdAt: formatTimestamp(data.createdAt),
        updatedAt: formatTimestamp(data.updatedAt),
    } as Omit<Invoice, 'id'>;

    if (!invoiceData.partyType) {
        invoiceData.partyType = 'customer';
    }
    if (!invoiceData.partyId) {
        invoiceData.partyId = invoiceData.partyType === 'customer' ? invoiceData.customerId : invoiceData.vendorId;
    }
    if (!invoiceData.partyName) {
        invoiceData.partyName = invoiceData.partyType === 'customer' ? invoiceData.customerName : invoiceData.vendorName;
    }
    if (!invoiceData.currency) {
        invoiceData.currency = 'USD';
    }

    return {
        id,
        ...invoiceData,
    };
};

// List all invoices
export async function listInvoices(): Promise<Invoice[]> {
    const db = getFirebaseDb();
    const snap = await getDocs(
        query(collection(db, INVOICES_COLLECTION), orderBy('invoiceDate', 'desc'))
    );

    const items: Invoice[] = snap.docs.map((docSnap) => {
        const data = docSnap.data() as Record<string, unknown>;
        return mapInvoiceDoc(data, docSnap.id);
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
        return mapInvoiceDoc(data, docSnap.id);
    });

    return items;
}

// List invoices by vendor
export async function listInvoicesByVendor(vendorId: string): Promise<Invoice[]> {
    const db = getFirebaseDb();
    const snap = await getDocs(
        query(
            collection(db, INVOICES_COLLECTION),
            where('vendorId', '==', vendorId),
            orderBy('invoiceDate', 'desc')
        )
    );

    const items: Invoice[] = snap.docs.map((docSnap) => {
        const data = docSnap.data() as Record<string, unknown>;
        return mapInvoiceDoc(data, docSnap.id);
    });

    return items;
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
    const db = getFirebaseDb();
    const ref = doc(db, INVOICES_COLLECTION, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return mapInvoiceDoc(snap.data() as Record<string, unknown>, snap.id);
}

// Create invoice
export async function createInvoice(values: InvoiceFormValues): Promise<Invoice> {
    const db = getFirebaseDb();
    const normalized = ensurePartyFields(values);
    const payload = {
        ...normalized,
        customerId: normalized.partyType === 'customer' ? normalized.partyId : '',
        customerName: normalized.partyType === 'customer' ? normalized.partyName : '',
        customerAddress: normalized.partyType === 'customer' ? normalized.partyAddress : '',
        customerTaxId: normalized.partyType === 'customer' ? normalized.partyTaxId : '',
        vendorId: normalized.partyType === 'vendor' ? normalized.partyId : normalized.vendorId,
        vendorName: normalized.partyType === 'vendor' ? normalized.partyName : normalized.vendorName,
        vendorAddress: normalized.partyType === 'vendor' ? normalized.partyAddress : normalized.vendorAddress,
        vendorTaxId: normalized.partyType === 'vendor' ? normalized.partyTaxId : normalized.vendorTaxId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, INVOICES_COLLECTION), payload);
    const now = new Date();
    return {
        id: docRef.id,
        createdAt: now.toLocaleString(),
        updatedAt: now.toLocaleString(),
        ...normalized,
    };
}

// Update invoice
export async function updateInvoice(
    id: string,
    values: InvoiceFormValues
): Promise<void> {
    const db = getFirebaseDb();
    const ref = doc(db, INVOICES_COLLECTION, id);
    const normalized = ensurePartyFields(values);
    await updateDoc(ref, {
        ...normalized,
        customerId: normalized.partyType === 'customer' ? normalized.partyId : '',
        customerName: normalized.partyType === 'customer' ? normalized.partyName : '',
        customerAddress: normalized.partyType === 'customer' ? normalized.partyAddress : '',
        customerTaxId: normalized.partyType === 'customer' ? normalized.partyTaxId : '',
        vendorId: normalized.partyType === 'vendor' ? normalized.partyId : normalized.vendorId,
        vendorName: normalized.partyType === 'vendor' ? normalized.partyName : normalized.vendorName,
        vendorAddress: normalized.partyType === 'vendor' ? normalized.partyAddress : normalized.vendorAddress,
        vendorTaxId: normalized.partyType === 'vendor' ? normalized.partyTaxId : normalized.vendorTaxId,
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
