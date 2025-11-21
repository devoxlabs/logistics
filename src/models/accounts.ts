// Chart of Accounts and General Ledger models

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export type Account = {
    id: string;
    code: string; // e.g., 1000, 2000
    name: string;
    type: AccountType;
    balance: number;
    parentCode?: string; // For sub-accounts
    isActive: boolean;
};

export type GeneralLedgerEntry = {
    id: string;
    date: string;
    accountCode: string;
    accountName: string;
    description: string;
    reference: string; // Invoice #, Job #, etc.
    debit: number;
    credit: number;
    balance: number;
    createdAt: string;
};

// Standard Chart of Accounts
export const STANDARD_ACCOUNTS: Account[] = [
    // Assets
    { id: '1000', code: '1000', name: 'Cash and Cash Equivalents', type: 'asset', balance: 0, isActive: true },
    { id: '1100', code: '1100', name: 'Accounts Receivable', type: 'asset', balance: 0, isActive: true },
    { id: '1200', code: '1200', name: 'Inventory', type: 'asset', balance: 0, isActive: true },
    { id: '1300', code: '1300', name: 'Prepaid Expenses', type: 'asset', balance: 0, isActive: true },
    { id: '1500', code: '1500', name: 'Property, Plant & Equipment', type: 'asset', balance: 0, isActive: true },
    { id: '1510', code: '1510', name: 'Accumulated Depreciation', type: 'asset', balance: 0, isActive: true },

    // Liabilities
    { id: '2000', code: '2000', name: 'Accounts Payable', type: 'liability', balance: 0, isActive: true },
    { id: '2100', code: '2100', name: 'Accrued Expenses', type: 'liability', balance: 0, isActive: true },
    { id: '2200', code: '2200', name: 'Short-term Debt', type: 'liability', balance: 0, isActive: true },
    { id: '2500', code: '2500', name: 'Long-term Debt', type: 'liability', balance: 0, isActive: true },

    // Equity
    { id: '3000', code: '3000', name: "Owner's Equity", type: 'equity', balance: 0, isActive: true },
    { id: '3100', code: '3100', name: 'Retained Earnings', type: 'equity', balance: 0, isActive: true },
    { id: '3200', code: '3200', name: 'Current Year Earnings', type: 'equity', balance: 0, isActive: true },

    // Revenue
    { id: '4000', code: '4000', name: 'Service Revenue', type: 'revenue', balance: 0, isActive: true },
    { id: '4100', code: '4100', name: 'Freight Revenue', type: 'revenue', balance: 0, isActive: true },
    { id: '4900', code: '4900', name: 'Other Income', type: 'revenue', balance: 0, isActive: true },

    // Expenses
    { id: '5000', code: '5000', name: 'Freight Costs', type: 'expense', balance: 0, isActive: true },
    { id: '5100', code: '5100', name: 'Handling Costs', type: 'expense', balance: 0, isActive: true },
    { id: '5200', code: '5200', name: 'Salaries and Wages', type: 'expense', balance: 0, isActive: true },
    { id: '5300', code: '5300', name: 'Rent', type: 'expense', balance: 0, isActive: true },
    { id: '5400', code: '5400', name: 'Utilities', type: 'expense', balance: 0, isActive: true },
    { id: '5500', code: '5500', name: 'Insurance', type: 'expense', balance: 0, isActive: true },
    { id: '5600', code: '5600', name: 'Depreciation', type: 'expense', balance: 0, isActive: true },
    { id: '5700', code: '5700', name: 'Marketing', type: 'expense', balance: 0, isActive: true },
    { id: '5800', code: '5800', name: 'Administrative Expenses', type: 'expense', balance: 0, isActive: true },
    { id: '5900', code: '5900', name: 'Interest Expense', type: 'expense', balance: 0, isActive: true },
    { id: '5950', code: '5950', name: 'Income Tax', type: 'expense', balance: 0, isActive: true },
    { id: '5999', code: '5999', name: 'Other Expenses', type: 'expense', balance: 0, isActive: true },
];
