export type VendorBillStatus = 'pending' | 'paid';

export type VendorBillCategory =
    | 'fuel'
    | 'port_fees'
    | 'customs'
    | 'warehousing'
    | 'airline_charges'
    | 'logistics_overheads';

export const VENDOR_BILL_CATEGORIES: Array<{
    value: VendorBillCategory;
    label: string;
}> = [
    { value: 'fuel', label: 'Fuel & Trucking' },
    { value: 'port_fees', label: 'Port & Terminal Fees' },
    { value: 'customs', label: 'Customs & Duties' },
    { value: 'warehousing', label: 'Warehousing & Storage' },
    { value: 'airline_charges', label: 'Airline / Carrier Charges' },
    { value: 'logistics_overheads', label: 'Logistics Overheads' },
];

export type VendorBillFormValues = {
    billNumber: string;
    jobNumber: string;
    vendorId: string;
    vendorName: string;
    invoiceId: string;
    amount: number;
    currency: string;
    date: string;
    dueDate: string;
    description: string;
    status: VendorBillStatus;
    category: VendorBillCategory;
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
    invoiceId: '',
    amount: 0,
    currency: 'USD',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    description: '',
    status: 'pending',
    category: 'fuel',
    paidDate: '',
});
