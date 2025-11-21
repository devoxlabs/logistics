// Shipment service functions for import and export operations
// CRUD operations for shipments collection in Firestore

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
import {
    ImportShipmentFormValues,
    ImportShipment,
    ExportShipmentFormValues,
    ExportShipment,
} from '@/models/shipments';
import { formatTimestamp } from '@/lib/firestoreUtils';

const SHIPMENTS_COLLECTION = 'shipments';

// Generate job number for import shipments
export function generateImportJobNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `IMP-${year}-${random}`;
}

// Generate job number for export shipments
export function generateExportJobNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `EXP-${year}-${random}`;
}

// List all shipments
export async function listShipments(): Promise<(ImportShipment | ExportShipment)[]> {
    const db = getFirebaseDb();
    const snap = await getDocs(
        query(collection(db, SHIPMENTS_COLLECTION), orderBy('createdAt', 'desc'))
    );

    const items = snap.docs.map((docSnap) => {
        const data = docSnap.data() as Record<string, unknown>;
        return {
            id: docSnap.id,
            createdAt: formatTimestamp(data.createdAt),
            updatedAt: formatTimestamp(data.updatedAt),
            ...data,
        } as ImportShipment | ExportShipment;
    });

    return items;
}

// List import shipments only
export async function listImportShipments(): Promise<ImportShipment[]> {
    const db = getFirebaseDb();
    const snap = await getDocs(
        query(
            collection(db, SHIPMENTS_COLLECTION),
            where('jobNumber', '>=', 'IMP'),
            where('jobNumber', '<', 'IMQ'),
            orderBy('jobNumber', 'desc')
        )
    );

    const items: ImportShipment[] = snap.docs.map((docSnap) => {
        const data = docSnap.data() as Record<string, unknown>;
        return {
            id: docSnap.id,
            createdAt: formatTimestamp(data.createdAt),
            updatedAt: formatTimestamp(data.updatedAt),
            ...data,
        } as ImportShipment;
    });

    return items;
}

// List export shipments only
export async function listExportShipments(): Promise<ExportShipment[]> {
    const db = getFirebaseDb();
    const snap = await getDocs(
        query(
            collection(db, SHIPMENTS_COLLECTION),
            where('jobNumber', '>=', 'EXP'),
            where('jobNumber', '<', 'EXQ'),
            orderBy('jobNumber', 'desc')
        )
    );

    const items: ExportShipment[] = snap.docs.map((docSnap) => {
        const data = docSnap.data() as Record<string, unknown>;
        return {
            id: docSnap.id,
            createdAt: formatTimestamp(data.createdAt),
            updatedAt: formatTimestamp(data.updatedAt),
            ...data,
        } as ExportShipment;
    });

    return items;
}

// Create import shipment
export async function createImportShipment(
    values: ImportShipmentFormValues
): Promise<ImportShipment> {
    const db = getFirebaseDb();
    const payload = {
        ...values,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, SHIPMENTS_COLLECTION), payload);
    const now = new Date();
    return {
        id: docRef.id,
        createdAt: now.toLocaleString(),
        updatedAt: now.toLocaleString(),
        ...values,
    };
}

// Create export shipment
export async function createExportShipment(
    values: ExportShipmentFormValues
): Promise<ExportShipment> {
    const db = getFirebaseDb();
    const payload = {
        ...values,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, SHIPMENTS_COLLECTION), payload);
    const now = new Date();
    return {
        id: docRef.id,
        createdAt: now.toLocaleString(),
        updatedAt: now.toLocaleString(),
        ...values,
    };
}

// Update shipment
export async function updateShipment(
    id: string,
    values: ImportShipmentFormValues | ExportShipmentFormValues
): Promise<void> {
    const db = getFirebaseDb();
    const ref = doc(db, SHIPMENTS_COLLECTION, id);
    await updateDoc(ref, {
        ...values,
        updatedAt: serverTimestamp(),
    });
}

// Delete shipment
export async function deleteShipment(id: string): Promise<void> {
    const db = getFirebaseDb();
    await deleteDoc(doc(db, SHIPMENTS_COLLECTION, id));
}
