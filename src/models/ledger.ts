// Ledger models for financial tracking

export type TransactionType = 'invoice' | 'payment' | 'adjustment' | 'credit_note';

export type LedgerEntry = {
    id: string;
    date: string;
    customerId?: string;
    vendorId?: string;
    customerName?: string;
    vendorName?: string;
    jobNumber: string;
    description: string;
    invoiceNumber: string;
    debit: number;
    credit: number;
    balance: number;
    type: TransactionType;
    createdAt: string;
};

// Helper factory for empty ledger entry
export const emptyLedgerEntry = (): Omit<LedgerEntry, 'id' | 'createdAt'> => ({
    date: new Date().toISOString().split('T')[0],
    customerId: '',
    vendorId: '',
    customerName: '',
    vendorName: '',
    jobNumber: '',
    description: '',
    invoiceNumber: '',
    debit: 0,
    credit: 0,
    balance: 0,
    type: 'invoice',
});
