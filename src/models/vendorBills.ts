export type VendorBillStatus = 'pending' | 'paid';

export type VendorBillFormValues = {
    billNumber: string;
    jobNumber: string;
    vendorId: string;
    vendorName: string;
    amount: number;
    currency: string;
    date: string;
    dueDate: string;
    description: string;
    status: VendorBillStatus;
    category: string;
    paidDate: string;
};

export type VendorBill = VendorBillFormValues & {
    id: string;
    createdAt: string;
    updatedAt: string;
};

export const emptyVendorBillForm = (): VendorBillFormValues => ({
    billNumber: '',
    jobNumber: '',
    vendorId: '',
    vendorName: '',
    amount: 0,
    currency: 'USD',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    description: '',
    status: 'pending',
    category: 'fuel',
    paidDate: '',
});
