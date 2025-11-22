// General Expenses - capture side expenses not tied to vendor bills
'use client';

import { useEffect, useMemo, useState } from 'react';
import FeatureHeader from '@/components/ui/FeatureHeader';
import { Expense, ExpenseFormValues, EXPENSE_CATEGORIES, emptyExpenseForm } from '@/models/expenses';
import { createExpense, deleteExpense, listExpenses } from '@/services/expenses';
import { formatCurrencyValue, getCurrencyOptions } from '@/lib/currency';

export default function Expenses() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [formValues, setFormValues] = useState<ExpenseFormValues>(emptyExpenseForm());
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [filters, setFilters] = useState({ category: 'all', displayCurrency: 'USD' });

    useEffect(() => {
        void loadExpenses();
    }, []);

    const loadExpenses = async () => {
        try {
            setLoading(true);
            const data = await listExpenses();
            setExpenses(data);
        } catch (error) {
            console.error('Failed to load expenses', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredExpenses = useMemo(() => {
        return expenses.filter((expense) => filters.category === 'all' || expense.category === filters.category);
    }, [expenses, filters]);

    const stats = useMemo(() => {
        return filteredExpenses.reduce(
            (acc, expense) => {
                acc.total += expense.amount;
                if (expense.status === 'paid') acc.paid += expense.amount;
                else acc.pending += expense.amount;
                return acc;
            },
            { total: 0, paid: 0, pending: 0 },
        );
    }, [filteredExpenses]);

    const handleFieldChange = <K extends keyof ExpenseFormValues>(field: K, value: ExpenseFormValues[K]) => {
        setFormValues((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!formValues.amount || formValues.amount <= 0) return;
        try {
            setIsSaving(true);
            const created = await createExpense(formValues);
            setExpenses((prev) => [created, ...prev]);
            setFormValues(emptyExpenseForm());
        } catch (error) {
            console.error('Failed to save expense', error);
        } finally {
            setIsSaving(false);
        }
    };

    const removeExpense = async (expense: Expense) => {
        if (!confirm('Delete this expense?')) return;
        try {
            await deleteExpense(expense.id);
            setExpenses((prev) => prev.filter((entry) => entry.id !== expense.id));
        } catch (error) {
            console.error('Failed to delete expense', error);
        }
    };

    return (
        <div className="h-full min-h-[60vh] md:min-h-full rounded-xl border border-slate-200 bg-white flex flex-col">
            <FeatureHeader
                title="General Expenses"
                icon={
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                }
                actions={
                    <button
                        type="button"
                        onClick={() => setFormValues(emptyExpenseForm())}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 transition-all duration-200 cursor-pointer"
                    >
                        Reset
                    </button>
                }
            />

            <div className="border-b border-slate-100 px-4 py-3 bg-slate-50">
                <div className="flex flex-col md:flex-row gap-3">
                    <select
                        value={filters.category}
                        onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
                        className="w-full md:w-56 rounded-lg border-2 border-input bg-white px-4 py-2 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 cursor-pointer"
                    >
                        <option value="all">All Categories</option>
                        {EXPENSE_CATEGORIES.map((category) => (
                            <option key={category.value} value={category.value}>
                                {category.label}
                            </option>
                        ))}
                    </select>
                    <select
                        value={filters.displayCurrency}
                        onChange={(e) => setFilters((prev) => ({ ...prev, displayCurrency: e.target.value }))}
                        className="w-full md:w-48 rounded-lg border-2 border-input bg-white px-4 py-2 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 cursor-pointer"
                    >
                        {getCurrencyOptions().map((option) => (
                            <option key={option.value} value={option.value}>
                                Display in {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="border-b border-slate-100 px-4 py-4 bg-gradient-to-br from-slate-50 to-white">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <Summary label="Total" value={stats.total} tone="slate" currency={filters.displayCurrency} />
                    <Summary label="Pending" value={stats.pending} tone="rose" currency={filters.displayCurrency} />
                    <Summary label="Paid" value={stats.paid} tone="emerald" currency={filters.displayCurrency} />
                    <div className="bg-white rounded-lg border border-slate-200 p-3">
                        <div className="text-xs text-slate-500 mb-1">Entries</div>
                        <div className="text-xl font-bold text-slate-900">{filteredExpenses.length}</div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-3 md:p-4">
                <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-4">
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1.5">Category</label>
                                <select
                                    value={formValues.category}
                                    onChange={(e) => handleFieldChange('category', e.target.value as ExpenseFormValues['category'])}
                                    className="w-full rounded-lg border-2 border-input bg-white px-3 py-2 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 cursor-pointer"
                                >
                                    {EXPENSE_CATEGORIES.map((category) => (
                                        <option key={category.value} value={category.value}>
                                            {category.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Amount</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formValues.amount}
                                        onChange={(e) => handleFieldChange('amount', parseFloat(e.target.value) || 0)}
                                        className="w-full rounded-lg border-2 border-input bg-white px-3 py-2 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Currency</label>
                                    <select
                                        value={formValues.currency}
                                        onChange={(e) => handleFieldChange('currency', e.target.value)}
                                        className="w-full rounded-lg border-2 border-input bg-white px-3 py-2 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 cursor-pointer"
                                    >
                                        {getCurrencyOptions().map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1.5">Date</label>
                                <input
                                    type="date"
                                    value={formValues.date}
                                    onChange={(e) => handleFieldChange('date', e.target.value)}
                                    className="w-full rounded-lg border-2 border-input bg-white px-3 py-2 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1.5">Status</label>
                                <select
                                    value={formValues.status}
                                    onChange={(e) => handleFieldChange('status', e.target.value as ExpenseFormValues['status'])}
                                    className="w-full rounded-lg border-2 border-input bg-white px-3 py-2 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 cursor-pointer"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="paid">Paid</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-3">
                            <label className="block text-xs font-medium text-slate-700 mb-1.5">Notes</label>
                            <textarea
                                value={formValues.description}
                                onChange={(e) => handleFieldChange('description', e.target.value)}
                                rows={2}
                                className="w-full rounded-lg border-2 border-input bg-white px-3 py-2 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary-hover active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
                    >
                        {isSaving ? 'Saving...' : 'Add Expense'}
                    </button>
                </form>

                <div className="bg-white border border-slate-200 rounded-lg shadow-sm mt-6">
                    {loading ? (
                        <div className="py-10 text-center text-slate-400 text-sm">Loading expenses...</div>
                    ) : filteredExpenses.length === 0 ? (
                        <div className="py-10 text-center text-slate-400 text-sm">No expenses recorded</div>
                    ) : (
                        <>
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50">
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Date</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Category</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">Amount</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Status</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredExpenses.map((expense) => (
                                            <tr key={expense.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150">
                                                <td className="px-4 py-3 text-sm text-slate-700">{expense.date}</td>
                                                <td className="px-4 py-3 text-sm text-slate-700">
                                                    {EXPENSE_CATEGORIES.find((cat) => cat.value === expense.category)?.label || expense.category}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right font-semibold text-slate-900">
                                                    {formatCurrencyValue(expense.amount, expense.currency)}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${
                                                            expense.status === 'paid'
                                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                                : 'border-amber-200 bg-amber-50 text-amber-700'
                                                        }`}
                                                    >
                                                        {expense.status === 'paid' ? 'Paid' : 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => void removeExpense(expense)}
                                                        className="inline-flex items-center rounded-md border border-rose-200 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 cursor-pointer"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="md:hidden space-y-3 p-3">
                                {filteredExpenses.map((expense) => (
                                    <div key={expense.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-2">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">{EXPENSE_CATEGORIES.find((cat) => cat.value === expense.category)?.label || expense.category}</p>
                                                <p className="text-xs text-slate-500">{expense.date}</p>
                                            </div>
                                            <span
                                                className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full border ${
                                                    expense.status === 'paid'
                                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                        : 'border-amber-200 bg-amber-50 text-amber-700'
                                                }`}
                                            >
                                                {expense.status === 'paid' ? 'Paid' : 'Pending'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm font-semibold text-slate-900">
                                            <span>Amount</span>
                                            <span>{formatCurrencyValue(expense.amount, expense.currency)}</span>
                                        </div>
                                        <div className="flex justify-end pt-1">
                                            <button
                                                type="button"
                                                onClick={() => void removeExpense(expense)}
                                                className="inline-flex items-center rounded-md border border-rose-200 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 cursor-pointer"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

type SummaryProps = {
    label: string;
    value: number;
    tone: 'rose' | 'emerald' | 'slate';
    currency: string;
};

function Summary({ label, value, tone, currency }: SummaryProps) {
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
