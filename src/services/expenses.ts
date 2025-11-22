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
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { Expense, ExpenseFormValues } from '@/models/expenses';
import { formatTimestamp } from '@/lib/firestoreUtils';

const EXPENSES_COLLECTION = 'expenses';

const mapExpenseDoc = (data: Record<string, unknown>, id: string): Expense => {
    return {
        id,
        category: (data.category as Expense['category']) ?? 'fuel',
        amount: typeof data.amount === 'number' ? data.amount : 0,
        currency: (data.currency as string) || 'USD',
        date: (data.date as string) || '',
        reference: (data.reference as string) || '',
        vendorName: (data.vendorName as string) || '',
        jobNumber: (data.jobNumber as string) || '',
        description: (data.description as string) || '',
        status: (data.status as Expense['status']) ?? 'pending',
        paidDate: (data.paidDate as string) || '',
        createdAt: formatTimestamp(data.createdAt),
        updatedAt: formatTimestamp(data.updatedAt),
    };
};

export async function listExpenses(): Promise<Expense[]> {
    const db = getFirebaseDb();
    const snap = await getDocs(query(collection(db, EXPENSES_COLLECTION), orderBy('date', 'desc')));
    return snap.docs.map((docSnap) => mapExpenseDoc(docSnap.data() as Record<string, unknown>, docSnap.id));
}

export async function createExpense(values: ExpenseFormValues): Promise<Expense> {
    const db = getFirebaseDb();
    const payload = {
        ...values,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    const ref = await addDoc(collection(db, EXPENSES_COLLECTION), payload);
    return {
        id: ref.id,
        ...values,
        createdAt: new Date().toLocaleString(),
        updatedAt: new Date().toLocaleString(),
    };
}

export async function updateExpense(id: string, values: Partial<ExpenseFormValues>): Promise<void> {
    const db = getFirebaseDb();
    const ref = doc(db, EXPENSES_COLLECTION, id);
    await updateDoc(ref, {
        ...values,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteExpense(id: string): Promise<void> {
    const db = getFirebaseDb();
    await deleteDoc(doc(db, EXPENSES_COLLECTION, id));
}
