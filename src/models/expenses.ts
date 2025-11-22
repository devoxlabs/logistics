export type ExpenseCategory =
    | 'fuel'
    | 'port_fees'
    | 'customs'
    | 'warehousing'
    | 'airline_charges'
    | 'logistics_overheads';

export const EXPENSE_CATEGORIES: Array<{
    value: ExpenseCategory;
    label: string;
    description: string;
}> = [
    { value: 'fuel', label: 'Fuel & Trucking', description: 'Fuel, trucking, and ground handling costs' },
    { value: 'port_fees', label: 'Port & Terminal Fees', description: 'Port handling, loading/unloading, terminal storage' },
    { value: 'customs', label: 'Customs & Duties', description: 'Customs brokerage, inspection, and duty payments' },
    { value: 'warehousing', label: 'Warehousing', description: 'Warehouse rent, storage, and distribution centers' },
    { value: 'airline_charges', label: 'Airline / Carrier Charges', description: 'Airline surcharges and carrier-specific fees' },
    { value: 'logistics_overheads', label: 'Logistics Overheads', description: 'Administration, travel, and miscellaneous logistics overheads' },
];

export type ExpenseStatus = 'pending' | 'paid';

export type ExpenseFormValues = {
    category: ExpenseCategory;
    amount: number;
    currency: string;
    date: string;
    description: string;
    status: ExpenseStatus;
    paidDate: string;
};

export type Expense = ExpenseFormValues & {
    id: string;
    createdAt: string;
    updatedAt: string;
};

export const emptyExpenseForm = (): ExpenseFormValues => ({
    category: 'fuel',
    amount: 0,
    currency: 'USD',
    date: new Date().toISOString().split('T')[0],
    description: '',
    status: 'pending',
    paidDate: '',
});
