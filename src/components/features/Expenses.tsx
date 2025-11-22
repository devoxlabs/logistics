// Expenses feature - track logistics operating costs
'use client';

import { useEffect, useMemo, useState } from 'react';
import FeatureHeader from '@/components/ui/FeatureHeader';
import {
    Expense,
    ExpenseCategory,
    ExpenseFormValues,
    EXPENSE_CATEGORIES,
    emptyExpenseForm,
} from '@/models/expenses';
import { createExpense, deleteExpense, listExpenses, updateExpense } from '@/services/expenses';
import { formatCurrencyValue, getCurrencyOptions } from '@/lib/currency';

export default function Expenses() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [formValues, setFormValues] = useState<ExpenseFormValues>(emptyExpenseForm());
    const [formSaving, setFormSaving] = useState(false);
    const [filterCategory, setFilterCategory] = useState<'all' | ExpenseCategory>('all');
    const [currencyFilter, setCurrencyFilter] = useState('USD');

    useEffect(() => {
        void loadExpenses();
    }, []);

    const filteredExpenses = useMemo(
        () =>
            expenses.filter(
                (expense) =>
                    (filterCategory === 'all' || expense.category === filterCategory) &&
                    (currencyFilter === 'ALL' || expense.currency === currencyFilter),
            ),
        [expenses, filterCategory, currencyFilter],
    );

    const stats = useMemo(() => {
        return filteredExpenses.reduce(
            (acc, expense) => {
                acc.total += expense.amount;
                if (expense.status === 'paid') {
                    acc.paid += expense.amount;
                } else {
                    acc.pending += expense.amount;
                }
                acc.byCategory[expense.category] = (acc.byCategory[expense.category] ?? 0) + expense.amount;
                return acc;
            },
            {
                total: 0,
                paid: 0,
                pending: 0,
                byCategory: {} as Record<ExpenseCategory, number>,
            },
        );
    }, [filteredExpenses]);

    async function loadExpenses() {
        try {
            setLoading(true);
            const data = await listExpenses();
            setExpenses(data);
        } catch (error) {
            console.error('Failed to load expenses', error);
        } finally {
            setLoading(false);
        }
    }

    const handleFormChange = <K extends keyof ExpenseFormValues>(field: K, value: ExpenseFormValues[K]) => {
        setFormValues((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!formValues.amount || formValues.amount <= 0) return;

        try {
            setFormSaving(true);
            const payload: ExpenseFormValues = {
                ...formValues,
            };
            if (payload.status === 'paid' && !payload.paidDate) {
                payload.paidDate = new Date().toISOString().split('T')[0];
            }
            const created = await createExpense(payload);
            setExpenses((prev) => [created, ...prev]);
            setFormValues(emptyExpenseForm());
        } catch (error) {
            console.error('Failed to save expense', error);
        } finally {
            setFormSaving(false);
        }
    };

    const markAsPaid = async (expense: Expense) => {
        if (expense.status === 'paid') return;
        try {
            await updateExpense(expense.id, {
                status: 'paid',
                paidDate: new Date().toISOString().split('T')[0],
            });
            setExpenses((prev) =>
                prev.map((item) =>
                    item.id === expense.id
                        ? { ...item, status: 'paid', paidDate: new Date().toISOString().split('T')[0] }
                        : item,
                ),
            );
        } catch (error) {
            console.error('Failed to mark expense as paid', error);
        }
    };

    const removeExpense = async (expense: Expense) => {
        if (!confirm('Delete this expense entry?')) return;
        try {
            await deleteExpense(expense.id);
            setExpenses((prev) => prev.filter((item) => item.id !== expense.id));
        } catch (error) {
            console.error('Failed to delete expense', error);
        }
    };

    return (
        <div className="h-full min-h-[60vh] md:min-h-full rounded-xl border border-slate-200 bg-white flex flex-col">
            <FeatureHeader
                title="Logistics Expenses"
                icon={
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                }
                actions={
                    <button
                        type="button"
                        onClick={() => void loadExpenses()}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 transition-all duration-200 cursor-pointer"
                    >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                }
            />

            <div className="border-b border-slate-100 px-4 py-3 bg-slate-50 flex flex-col md:flex-row gap-3">
                <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Filter by category</label>
                    <select
                        value={filterCategory}
                        onChange={(event) => setFilterCategory(event.target.value as typeof filterCategory)}
                        className="w-full rounded-lg border-2 border-input bg-white px-3 py-2 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 cursor-pointer"
                    >
                        <option value="all">All Categories</option>
                        {EXPENSE_CATEGORIES.map((category) => (
                            <option key={category.value} value={category.value}>
                                {category.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="w-full md:w-48">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Display currency</label>
                    <select
                        value={currencyFilter}
                        onChange={(event) => setCurrencyFilter(event.target.value)}
                        className="w-full rounded-lg border-2 border-input bg-white px-3 py-2 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 cursor-pointer"
                    >
                        <option value="ALL">All</option>
                        {getCurrencyOptions().map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="border-b border-slate-100 px-4 py-4 bg-gradient-to-br from-slate-50 to-white">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <SummaryCard label="Total" value={stats.total} tone="slate" currency={currencyFilter} />
                    <SummaryCard label="Pending" value={stats.pending} tone="rose" currency={currencyFilter} />
                    <SummaryCard label="Paid" value={stats.paid} tone="emerald" currency={currencyFilter} />
                    <div className="bg-white rounded-lg border border-slate-200 p-3">
                        <div className="text-xs text-slate-500 mb-1">Entries</div>
                        <div className="text-xl font-bold text-slate-900">{filteredExpenses.length}</div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-6">
                <form onSubmit={handleSubmit} className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1.5">Category</label>
                            <select
                                value={formValues.category}
                                onChange={(e) => handleFormChange('category', e.target.value as ExpenseCategory)}
                                className="w-full rounded-lg border-2 border-input bg-white px-3 py-2 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 cursor-pointer"
                            >
                                {EXPENSE_CATEGORIES.map((category) => (
                                    <option key={category.value} value={category.value}>
                                        {category.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1.5">Amount</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formValues.amount}
                                onChange={(e) => handleFormChange('amount', parseFloat(e.target.value) || 0)}
                                className="w-full rounded-lg border-2 border-input bg-white px-3 py-2 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1.5">Currency</label>
                            <select
                                value={formValues.currency}
                                onChange={(e) => handleFormChange('currency', e.target.value)}
                                className="w-full rounded-lg border-2 border-input bg-white px-3 py-2 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 cursor-pointer"
                            >
                                {getCurrencyOptions().map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1.5">Expense Date</label>
                            <input
                                type="date"
                                value={formValues.date}
                                onChange={(e) => handleFormChange('date', e.target.value)}
                                className="w-full rounded-lg border-2 border-input bg-white px-3 py-2 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1.5">Vendor / Payee</label>
                            <input
                                type="text"
                                value={formValues.vendorName}
                                onChange={(e) => handleFormChange('vendorName', e.target.value)}
                                className="w-full rounded-lg border-2 border-input bg-white px-3 py-2 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                placeholder="Port Authority, Trucking Co..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1.5">Reference / Bill #</label>
                            <input
                                type="text"
                                value={formValues.reference}
                                onChange={(e) => handleFormChange('reference', e.target.value)}
                                className="w-full rounded-lg border-2 border-input bg-white px-3 py-2 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                placeholder="INV-2025-001"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1.5">Job # (optional)</label>
                            <input
                                type="text"
                                value={formValues.jobNumber}
                                onChange={(e) => handleFormChange('jobNumber', e.target.value)}
                                className="w-full rounded-lg border-2 border-input bg-white px-3 py-2 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                placeholder="IMP-2025-001"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1.5">Status</label>
                            <select
                                value={formValues.status}
                                onChange={(e) => handleFormChange('status', e.target.value as ExpenseFormValues['status'])}
                                className="w-full rounded-lg border-2 border-input bg-white px-3 py-2 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 cursor-pointer"
                            >
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                            </select>
                        </div>
                        {formValues.status === 'paid' && (
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1.5">Paid Date</label>
                                <input
                                    type="date"
                                    value={formValues.paidDate}
                                    onChange={(e) => handleFormChange('paidDate', e.target.value)}
                                    className="w-full rounded-lg border-2 border-input bg-white px-3 py-2 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                />
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">Notes</label>
                        <textarea
                            value={formValues.description}
                            onChange={(e) => handleFormChange('description', e.target.value)}
                            rows={2}
                            className="w-full rounded-lg border-2 border-input bg-white px-3 py-2 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                        />
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={formSaving}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary-hover active:scale-[0.98] disabled:opacity-60 cursor-pointer transition-all duration-200"
                        >
                            {formSaving ? 'Saving...' : 'Add Expense'}
                        </button>
                    </div>
                </form>

                <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
                    {loading ? (
                        <div className="py-10 flex items-center justify-center text-slate-400 text-sm">Loading expenses...</div>
                    ) : filteredExpenses.length === 0 ? (
                        <div className="py-10 flex items-center justify-center text-slate-400 text-sm">No expenses recorded</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Category</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Vendor</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Reference</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">Amount</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Status</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredExpenses.map((expense) => {
                                        const category = EXPENSE_CATEGORIES.find((item) => item.value === expense.category);
                                        return (
                                            <tr key={expense.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150">
                                                <td className="px-4 py-3 text-sm text-slate-700">{expense.date}</td>
                                                <td className="px-4 py-3 text-sm text-slate-700">{category?.label ?? expense.category}</td>
                                                <td className="px-4 py-3 text-sm text-slate-700">{expense.vendorName || '-'}</td>
                                                <td className="px-4 py-3 text-sm text-slate-700">{expense.reference || '-'}</td>
                                                <td className="px-4 py-3 text-sm text-right font-semibold text-slate-900">
                                                    {formatCurrencyValue(expense.amount, expense.currency)}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${expense.status === 'paid'
                                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                                : 'border-amber-200 bg-amber-50 text-amber-700'
                                                            }`}
                                                    >
                                                        {expense.status === 'paid' ? 'Paid' : 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right space-x-2">
                                                    {expense.status !== 'paid' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => void markAsPaid(expense)}
                                                            className="inline-flex items-center rounded-md border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                                                        >
                                                            Mark Paid
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => void removeExpense(expense)}
                                                        className="inline-flex items-center rounded-md border border-rose-200 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 cursor-pointer"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
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
            <div className={`text-xl font-bold ${toneClasses}`}>{formatCurrencyValue(value, currency === 'ALL' ? 'USD' : currency)}</div>
        </div>
    );
}
