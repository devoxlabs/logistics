import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { VendorBill, VendorBillFormValues, VENDOR_BILL_CATEGORIES } from '@/models/vendorBills';
import { formatTimestamp } from '@/lib/firestoreUtils';

const COLLECTION = 'vendorBills';
const DEFAULT_VENDOR_CATEGORY = VENDOR_BILL_CATEGORIES[0].value;

export function generateVendorJobNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0');
    return `VJB-${year}-${random}`;
}

const mapDoc = (data: Record<string, unknown>, id: string): VendorBill => {
    return {
        id,
        billNumber: (data.billNumber as string) || '',
        jobNumber: (data.jobNumber as string) || '',
        vendorId: (data.vendorId as string) || '',
        vendorName: (data.vendorName as string) || '',
        invoiceId: (data.invoiceId as string) || '',
        amount: typeof data.amount === 'number' ? data.amount : 0,
        currency: (data.currency as string) || 'USD',
        date: (data.date as string) || '',
        dueDate: (data.dueDate as string) || '',
        description: (data.description as string) || '',
        status: (data.status as VendorBill['status']) || 'pending',
        category: (VENDOR_BILL_CATEGORIES.find((cat) => cat.value === data.category)?.value as VendorBillFormValues['category']) || DEFAULT_VENDOR_CATEGORY,
        paidDate: (data.paidDate as string) || '',
        createdAt: formatTimestamp(data.createdAt),
        updatedAt: formatTimestamp(data.updatedAt),
    };
};

export async function listVendorBills(vendorId?: string): Promise<VendorBill[]> {
    const db = getFirebaseDb();
    const baseQuery = vendorId
        ? query(collection(db, COLLECTION), where('vendorId', '==', vendorId), orderBy('date', 'desc'))
        : query(collection(db, COLLECTION), orderBy('date', 'desc'));
    const snap = await getDocs(baseQuery);
    return snap.docs.map((docSnap) => mapDoc(docSnap.data() as Record<string, unknown>, docSnap.id));
}

export async function createVendorBill(values: VendorBillFormValues): Promise<VendorBill> {
    const db = getFirebaseDb();
    const payload = {
        ...values,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    const ref = await addDoc(collection(db, COLLECTION), payload);
    const now = new Date().toLocaleString();
    return {
        id: ref.id,
        ...values,
        createdAt: now,
        updatedAt: now,
    };
}

export async function updateVendorBill(id: string, values: Partial<VendorBillFormValues>): Promise<void> {
    const db = getFirebaseDb();
    const ref = doc(db, COLLECTION, id);
    await updateDoc(ref, {
        ...values,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteVendorBill(id: string): Promise<void> {
    const db = getFirebaseDb();
    await deleteDoc(doc(db, COLLECTION, id));
}
