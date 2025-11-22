import { Invoice, InvoiceStatus, InvoicePartyType } from '@/models/invoices';
import { convertCurrency } from '@/lib/currency';
import { Expense, ExpenseCategory } from '@/models/expenses';

export type DerivedLedgerEntry = {
    id: string;
    partyType: InvoicePartyType;
    partyId: string;
    partyName: string;
    invoiceNumber: string;
    jobNumber: string;
    description: string;
    date: string;
    status: InvoiceStatus;
    total: number;
    paid: number;
    outstanding: number;
    source: 'invoice' | 'expense';
    category?: ExpenseCategory;
};

export type DeriveLedgerOptions = {
    includeSettled?: boolean;
    epsilon?: number;
};

export function deriveLedgerEntries(
    invoices: Invoice[],
    displayCurrency: string,
    options: DeriveLedgerOptions = {}
): DerivedLedgerEntry[] {
    const includeSettled = options.includeSettled ?? false;
    const epsilon = options.epsilon ?? 0.01;

    return invoices
        .map((invoice) => {
            const partyType: InvoicePartyType = invoice.partyType ?? 'customer';
            const total = convertCurrency(invoice.total || 0, invoice.currency || 'USD', displayCurrency);
            const paid = convertCurrency(invoice.paidAmount || 0, invoice.currency || 'USD', displayCurrency);
            const outstanding = Math.max(total - paid, 0);
            const isSettled =
                outstanding <= epsilon ||
                invoice.status === 'paid' ||
                invoice.status === 'cancelled';

            if (!includeSettled && isSettled) {
                return null;
            }

            return {
                id: invoice.id,
                partyType,
                partyId:
                    invoice.partyId ||
                    (partyType === 'customer' ? invoice.customerId : invoice.vendorId) ||
                    '',
                partyName:
                    invoice.partyName ||
                    (partyType === 'customer' ? invoice.customerName : invoice.vendorName) ||
                    '',
                invoiceNumber: invoice.invoiceNumber,
                jobNumber: invoice.jobNumber || '',
                description: invoice.notes || `Invoice ${invoice.invoiceNumber}`,
                date: invoice.invoiceDate,
                status: invoice.status,
                total,
                paid,
                outstanding,
                source: 'invoice',
            };
        })
        .filter((entry): entry is DerivedLedgerEntry => Boolean(entry));
}

export function deriveExpenseEntries(expenses: Expense[], displayCurrency: string): DerivedLedgerEntry[] {
    return expenses.map((expense) => {
        const amount = convertCurrency(expense.amount || 0, expense.currency || 'USD', displayCurrency);
        const paid = expense.status === 'paid' ? amount : 0;
        const outstanding = expense.status === 'paid' ? 0 : amount;

        return {
            id: expense.id,
            partyType: 'vendor',
            partyId: expense.vendorName || '',
            partyName: expense.vendorName || 'Operational Expense',
            invoiceNumber: expense.reference || `EXP-${expense.category.toUpperCase()}`,
            jobNumber: expense.jobNumber || '',
            description: expense.description || expense.reference || 'Logistics Expense',
            date: expense.date,
            status: expense.status === 'paid' ? 'paid' : 'sent',
            total: amount,
            paid,
            outstanding,
            source: 'expense',
            category: expense.category,
        };
    });
}
