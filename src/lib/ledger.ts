import { Invoice, InvoiceStatus, InvoicePartyType } from '@/models/invoices';
import { convertCurrency } from '@/lib/currency';
import { Expense, ExpenseCategory, EXPENSE_CATEGORIES } from '@/models/expenses';
import { VendorBill } from '@/models/vendorBills';

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
    source: 'invoice' | 'expense' | 'vendor_bill';
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
            partyId: expense.category,
            partyName: EXPENSE_CATEGORIES.find((cat) => cat.value === expense.category)?.label || 'Expense',
            invoiceNumber: `EXP-${expense.date}`,
            jobNumber: '',
            description: expense.description || 'General Expense',
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

export function deriveVendorBillEntries(bills: VendorBill[], displayCurrency: string): DerivedLedgerEntry[] {
    return bills.map((bill) => {
        const amount = convertCurrency(bill.amount || 0, bill.currency || 'USD', displayCurrency);
        const paid = bill.status === 'paid' ? amount : 0;
        const outstanding = bill.status === 'paid' ? 0 : amount;

        return {
            id: bill.id,
            partyType: 'vendor',
            partyId: bill.vendorId,
            partyName: bill.vendorName || 'Vendor',
            invoiceNumber: bill.billNumber || bill.jobNumber,
            jobNumber: bill.jobNumber || '',
            description: bill.description || `Vendor Bill ${bill.billNumber}`,
            date: bill.date,
            status: bill.status === 'paid' ? 'paid' : 'sent',
            total: amount,
            paid,
            outstanding,
            source: 'vendor_bill',
        };
    });
}
