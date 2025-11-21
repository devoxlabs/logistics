// Invoice models for billing and financial management

export type InvoiceStatus =
    | 'draft'
    | 'sent'
    | 'paid'
    | 'partially_paid'
    | 'overdue'
    | 'cancelled';

export type InvoiceLineItem = {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
};

export type InvoiceFormValues = {
    invoiceNumber: string; // Auto-generated INV-YYYY-XXXX
    invoiceDate: string;
    dueDate: string;

    // Customer
    customerId: string;
    customerName: string;
    customerAddress: string;
    customerTaxId: string;

    // Reference
    jobNumber: string; // Optional link to shipment
    poNumber: string; // Purchase Order

    // Line Items
    lineItems: InvoiceLineItem[];

    // Calculations
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    discount: number;
    total: number;

    // Terms
    paymentTerms: string; // Net 30, Net 60, etc.
    bankDetails: string;
    notes: string;

    // Status
    status: InvoiceStatus;
    paidAmount: number;
    paidDate: string;
};

export type Invoice = InvoiceFormValues & {
    id: string;
    createdAt: string;
    updatedAt: string;
};

// Helper to create empty line item
export const emptyLineItem = (): InvoiceLineItem => ({
    id: Math.random().toString(36).substr(2, 9),
    description: '',
    quantity: 1,
    unitPrice: 0,
    amount: 0,
});

// Helper factory for empty invoice form
export const emptyInvoiceForm = (): InvoiceFormValues => ({
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    customerId: '',
    customerName: '',
    customerAddress: '',
    customerTaxId: '',
    jobNumber: '',
    poNumber: '',
    lineItems: [emptyLineItem()],
    subtotal: 0,
    taxRate: 0,
    taxAmount: 0,
    discount: 0,
    total: 0,
    paymentTerms: 'Net 30',
    bankDetails: '',
    notes: '',
    status: 'draft',
    paidAmount: 0,
    paidDate: '',
});
