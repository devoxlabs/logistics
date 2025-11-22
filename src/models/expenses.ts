export type ExpenseCategory =
    | 'bills'
    | 'salaries'
    | 'office_supplies'
    | 'travel'
    | 'marketing'
    | 'miscellaneous';

export const EXPENSE_CATEGORIES: Array<{
    value: ExpenseCategory;
    label: string;
    description: string;
}> = [
    { value: 'bills', label: 'Bills & Utilities', description: 'Electricity, water, telecom, rent-related bills' },
    { value: 'salaries', label: 'Salaries & Wages', description: 'Payroll, stipends, and allowances for staff' },
    { value: 'office_supplies', label: 'Office Supplies', description: 'Stationery, software subscriptions, consumables' },
    { value: 'travel', label: 'Travel & Meals', description: 'Business travel, lodging, meals, and transport' },
    { value: 'marketing', label: 'Marketing & Advertising', description: 'Campaigns, sponsorships, promotions, and PR' },
    { value: 'miscellaneous', label: 'Miscellaneous', description: 'Other administrative or company-owned expenses' },
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
    category: 'bills',
    amount: 0,
    currency: 'USD',
    date: new Date().toISOString().split('T')[0],
    description: '',
    status: 'pending',
    paidDate: '',
});
