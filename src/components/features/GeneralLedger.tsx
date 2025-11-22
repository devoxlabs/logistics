// General Ledger - Receivables, Payables, and Expenses overview
'use client';

import { useEffect, useMemo, useState } from 'react';
import FeatureHeader from '@/components/ui/FeatureHeader';
import { listInvoices } from '@/services/invoices';
import { Invoice } from '@/models/invoices';
import { formatCurrencyValue, getCurrencyOptions } from '@/lib/currency';
import { deriveExpenseEntries, deriveLedgerEntries, deriveVendorBillEntries, DerivedLedgerEntry } from '@/lib/ledger';
import { listExpenses } from '@/services/expenses';
import { Expense, EXPENSE_CATEGORIES } from '@/models/expenses';
import { listVendorBills } from '@/services/vendorBills';
import { VendorBill } from '@/models/vendorBills';

type LedgerView = 'receivable' | 'payable' | 'expenses';

export default function GeneralLedger() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [vendorBills, setVendorBills] = useState<VendorBill[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [displayCurrency, setDisplayCurrency] = useState('USD');
    const [view, setView] = useState<LedgerView>('receivable');

    const loadData = async () => {
        try {
            setLoading(true);
            const [invoiceData, expenseData, vendorBillData] = await Promise.all([listInvoices(), listExpenses(), listVendorBills()]);
            setInvoices(invoiceData);
            setExpenses(expenseData);
            setVendorBills(vendorBillData);
        } catch (error) {
            console.error('Failed to load ledger data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, []);

    const filteredInvoices = useMemo(
        () => invoices.filter((inv) => (inv.partyType ?? 'customer') === 'customer'),
        [invoices],
    );

    const invoiceEntries = useMemo(
        () => deriveLedgerEntries(filteredInvoices, displayCurrency, { includeSettled: true }),
        [filteredInvoices, displayCurrency],
    );

    const vendorEntries = useMemo(
        () => deriveVendorBillEntries(vendorBills, displayCurrency),
        [vendorBills, displayCurrency],
    );

    const expenseEntries = useMemo(
        () => deriveExpenseEntries(expenses, displayCurrency),
        [expenses, displayCurrency],
    );

    const activeEntries =
        view === 'receivable' ? invoiceEntries : view === 'payable' ? vendorEntries : expenseEntries;

    let runningBalance = 0;
    const entriesWithBalance = activeEntries.map((entry) => {
        runningBalance += entry.total - entry.paid;
        return { ...entry, balance: runningBalance };
    });

    const stats = activeEntries.reduce(
        (acc, entry) => {
            acc.debit += entry.total;
            acc.credit += entry.paid;
            return acc;
        },
        { debit: 0, credit: 0 },
    );
    const netBalance = entriesWithBalance.length ? entriesWithBalance[entriesWithBalance.length - 1].balance : 0;

    return (
        <div className="h-full min-h-[60vh] md:min-h-full rounded-xl border border-slate-200 bg-white flex flex-col">
            <FeatureHeader
                title="General Ledger"
                icon={
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                    </svg>
                }
                actions={
                    <div className="flex flex-wrap gap-2">
                        <select
                            value={displayCurrency}
                            onChange={(e) => setDisplayCurrency(e.target.value)}
                            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200 cursor-pointer"
                        >
                            {getCurrencyOptions().map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={() => void loadData()}
                            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 transition-all duration-200 cursor-pointer"
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh
                        </button>
                    </div>
                }
            />

            <div className="border-b border-slate-100 px-4 py-3 bg-slate-50">
                <div className="flex flex-wrap gap-2">
                    {(['receivable', 'payable', 'expenses'] as LedgerView[]).map((mode) => (
                        <button
                            key={mode}
                            type="button"
                            onClick={() => setView(mode)}
                            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer ${
                                view === mode ? 'border-primary bg-primary text-white shadow' : 'border-slate-200 bg-white text-slate-600'
                            }`}
                        >
                            {mode === 'receivable'
                                ? 'Accounts Receivable'
                                : mode === 'payable'
                                    ? 'Accounts Payable'
                                    : 'Expenses'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="border-b border-slate-100 px-4 py-4 bg-gradient-to-br from-slate-50 to-white">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <SummaryCard
                        label={
                            view === 'expenses'
                                ? 'Total Expense'
                                : view === 'payable'
                                    ? 'Total Bills'
                                    : 'Total Invoiced'
                        }
                        value={stats.debit}
                        tone="rose"
                        currency={displayCurrency}
                    />
                    <SummaryCard
                        label={
                            view === 'expenses'
                                ? 'Settled Expense'
                                : view === 'payable'
                                    ? 'Settled Bills'
                                    : 'Total Collected'
                        }
                        value={stats.credit}
                        tone="emerald"
                        currency={displayCurrency}
                    />
                    <SummaryCard
                        label={
                            view === 'expenses'
                                ? 'Unsettled Expense'
                                : view === 'payable'
                                    ? 'Outstanding Payable'
                                    : 'Outstanding Balance'
                        }
                        value={Math.abs(netBalance)}
                        tone={netBalance >= 0 ? 'slate' : 'rose'}
                        currency={displayCurrency}
                    />
                    <div className="bg-white rounded-lg border border-slate-200 p-3">
                        <div className="text-xs text-slate-500 mb-1">Entries</div>
                        <div className="text-xl font-bold text-slate-900">{entriesWithBalance.length}</div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="flex items-center gap-3 text-slate-500">
                            <div className="h-5 w-5 border-2 border-slate-300 border-t-primary rounded-full animate-spin" />
                            <span className="text-sm">Loading ledger data...</span>
                        </div>
                    </div>
                ) : entriesWithBalance.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <svg className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <p className="text-sm">No ledger entries found for this view</p>
                    </div>
                ) : (
                    <>
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50">
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Date</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Party</th>
                                        {view === 'expenses' && (
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Category</th>
                                        )}
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Invoice #</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Job #</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-700">Debit</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-700">Credit</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-700">Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entriesWithBalance.map((entry) => (
                                        <LedgerRow
                                            key={entry.id}
                                            entry={entry}
                                            currency={displayCurrency}
                                            showCategory={view === 'expenses'}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="md:hidden space-y-3">
                            {entriesWithBalance.map((entry) => (
                                <div key={entry.id} className="bg-white border border-slate-200 rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <div className="text-sm font-semibold text-slate-900">{entry.partyName}</div>
                                            <div className="text-xs text-slate-500">{entry.date}</div>
                                        </div>
                                        <div className="text-sm font-bold text-slate-900">
                                            {formatCurrencyValue(entry.balance, displayCurrency)}
                                        </div>
                                    </div>
                                    {view === 'expenses' && entry.category && (
                                        <div className="text-xs text-blue-600 mb-1">
                                            Category: {EXPENSE_CATEGORIES.find((cat) => cat.value === entry.category)?.label || entry.category}
                                        </div>
                                    )}
                                    <div className="text-xs text-slate-500 mb-2">Reference: {entry.invoiceNumber}</div>
                                    <div className="flex justify-between text-xs border-t border-slate-100 pt-2">
                                        <span className="text-rose-600 font-medium">
                                            Debit: {formatCurrencyValue(entry.total, displayCurrency)}
                                        </span>
                                        <span className="text-emerald-600 font-medium">
                                            Credit: {formatCurrencyValue(entry.paid, displayCurrency)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

type SummaryCardProps = {
    label: string;
    value: number;
    tone: 'rose' | 'emerald' | 'slate';
    currency: string;
};

function SummaryCard({ label, value, tone, currency }: SummaryCardProps) {
    const toneClasses =
        tone === 'rose'
            ? 'text-rose-600'
            : tone === 'emerald'
                ? 'text-emerald-600'
                : 'text-slate-900';

    return (
        <div className="bg-white rounded-lg border border-slate-200 p-3">
            <div className="text-xs text-slate-500 mb-1">{label}</div>
            <div className={`text-xl font-bold ${toneClasses}`}>{formatCurrencyValue(value, currency)}</div>
        </div>
    );
}

type LedgerRowProps = {
    entry: DerivedLedgerEntry & { balance: number };
    currency: string;
    showCategory?: boolean;
};

function LedgerRow({ entry, currency, showCategory }: LedgerRowProps) {
    const categoryLabel = entry.category
        ? EXPENSE_CATEGORIES.find((cat) => cat.value === entry.category)?.label || entry.category
        : '';

    return (
        <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150">
            <td className="px-4 py-3 text-sm text-slate-700">{entry.date}</td>
            <td className="px-4 py-3 text-sm text-slate-700">{entry.partyName}</td>
            {showCategory && <td className="px-4 py-3 text-xs text-blue-600">{categoryLabel}</td>}
            <td className="px-4 py-3 text-sm text-slate-700">{entry.invoiceNumber}</td>
            <td className="px-4 py-3 text-sm font-medium text-primary">{entry.jobNumber || '-'}</td>
            <td className="px-4 py-3 text-sm text-right font-medium text-rose-600">
                {formatCurrencyValue(entry.total, currency)}
            </td>
            <td className="px-4 py-3 text-sm text-right font-medium text-emerald-600">
                {formatCurrencyValue(entry.paid, currency)}
            </td>
            <td className="px-4 py-3 text-sm text-right font-semibold text-slate-900">
                {formatCurrencyValue(entry.balance, currency)}
            </td>
        </tr>
    );
}
