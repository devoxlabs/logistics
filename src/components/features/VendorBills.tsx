// Vendor Bills - track services purchased from vendors and manage payables
'use client';

import { useEffect, useMemo, useState } from 'react';
import FeatureHeader from '@/components/ui/FeatureHeader';
import { VendorBill, VendorBillFormValues, emptyVendorBillForm } from '@/models/vendorBills';
import {
    createVendorBill,
    deleteVendorBill,
    generateVendorJobNumber,
    listVendorBills,
    updateVendorBill,
} from '@/services/vendorBills';
import { listVendors } from '@/services/vendors';
import { VendorProfile } from '@/models/profiles';
import { EXPENSE_CATEGORIES } from '@/models/expenses';
import { formatCurrencyValue, getCurrencyOptions } from '@/lib/currency';

export default function VendorBills() {
    const [bills, setBills] = useState<VendorBill[]>([]);
    const [vendors, setVendors] = useState<VendorProfile[]>([]);
    const [formValues, setFormValues] = useState<VendorBillFormValues>(emptyVendorBillForm());
    const [selectedBillId, setSelectedBillId] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<{ vendorId: string; status: VendorBill['status'] | 'all' }>({
        vendorId: 'all',
        status: 'all',
    });

    useEffect(() => {
        void Promise.all([loadVendors(), loadBills()]);
    }, []);

    const loadBills = async () => {
        try {
            setLoading(true);
            const data = await listVendorBills();
            setBills(data);
        } catch (error) {
            console.error('Failed to load vendor bills', error);
        } finally {
            setLoading(false);
        }
    };

    const loadVendors = async () => {
        try {
            const data = await listVendors();
            setVendors(data);
        } catch (error) {
            console.error('Failed to load vendors', error);
        }
    };

    const filteredBills = useMemo(() => {
        return bills.filter((bill) => {
            const vendorMatch = filters.vendorId === 'all' || bill.vendorId === filters.vendorId;
            const statusMatch = filters.status === 'all' || bill.status === filters.status;
            return vendorMatch && statusMatch;
        });
    }, [bills, filters]);

    const handleFieldChange = <K extends keyof VendorBillFormValues>(field: K, value: VendorBillFormValues[K]) => {
        setFormValues((prev) => ({ ...prev, [field]: value }));
        if (field === 'vendorId') {
            const vendor = vendors.find((v) => v.id === value);
            if (vendor) {
                setFormValues((prev) => ({
                    ...prev,
                    vendorId: vendor.id,
                    vendorName: vendor.vendorName,
                }));
            }
            if (!editMode && !formValues.jobNumber) {
                setFormValues((prev) => ({
                    ...prev,
                    jobNumber: generateVendorJobNumber(),
                }));
            }
        }
        if (field === 'status' && value === 'paid' && !formValues.paidDate) {
            setFormValues((prev) => ({ ...prev, paidDate: new Date().toISOString().split('T')[0] }));
        }
    };

    const handleLoadBill = () => {
        if (!selectedBillId) return;
        const bill = bills.find((b) => b.id === selectedBillId);
        if (!bill) return;
        setFormValues({
            ...bill,
        });
        setEditMode(true);
    };

    const resetForm = () => {
        setFormValues(emptyVendorBillForm());
        setSelectedBillId('');
        setEditMode(false);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!formValues.vendorId) return;
        if (!formValues.jobNumber) {
            handleFieldChange('jobNumber', generateVendorJobNumber());
        }
        try {
            setIsSaving(true);
            if (editMode && selectedBillId) {
                await updateVendorBill(selectedBillId, formValues);
                setBills((prev) => prev.map((bill) => (bill.id === selectedBillId ? { ...bill, ...formValues } : bill)));
            } else {
                const payload = {
                    ...formValues,
                    jobNumber: formValues.jobNumber || generateVendorJobNumber(),
                };
                const created = await createVendorBill(payload);
                setBills((prev) => [created, ...prev]);
            }
            resetForm();
        } catch (error) {
            console.error('Failed to save vendor bill', error);
        } finally {
            setIsSaving(false);
        }
    };

    const markAsPaid = async (bill: VendorBill) => {
        if (bill.status === 'paid') return;
        const paidDate = new Date().toISOString().split('T')[0];
        try {
            await updateVendorBill(bill.id, { status: 'paid', paidDate });
            setBills((prev) =>
                prev.map((entry) => (entry.id === bill.id ? { ...entry, status: 'paid', paidDate } : entry)),
            );
        } catch (error) {
            console.error('Failed to mark bill as paid', error);
        }
    };

    const removeBill = async (bill: VendorBill) => {
        if (!confirm('Delete this vendor bill?')) return;
        try {
            await deleteVendorBill(bill.id);
            setBills((prev) => prev.filter((entry) => entry.id !== bill.id));
        } catch (error) {
            console.error('Failed to delete vendor bill', error);
        }
    };

    return (
        <div className="h-full min-h-[60vh] md:min-h-full rounded-xl border border-slate-200 bg-white flex flex-col">
            <FeatureHeader
                title={editMode ? 'Edit Vendor Bill' : 'Create Vendor Bill'}
                icon={
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v7a2 2 0 01-2 2z"
                        />
                    </svg>
                }
                actions={
                    <button
                        type="button"
                        onClick={resetForm}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 transition-all duration-200 cursor-pointer"
                    >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        New Bill
                    </button>
                }
            />

            {!editMode && bills.length > 0 && (
                <div className="border-b border-slate-100 px-4 py-3 bg-blue-50">
                    <div className="flex flex-col md:flex-row gap-3 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Load Existing Bill</label>
                            <select
                                value={selectedBillId}
                                onChange={(e) => setSelectedBillId(e.target.value)}
                                className="w-full rounded-lg border-2 border-input bg-white px-4 py-2 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 cursor-pointer"
                            >
                                <option value="">Select a bill...</option>
                                {bills.map((bill) => (
                                    <option key={bill.id} value={bill.id}>
                                        {bill.billNumber || bill.jobNumber} • {bill.vendorName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            type="button"
                            onClick={handleLoadBill}
                            disabled={!selectedBillId}
                            className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            Load Bill
                        </button>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-auto p-3 md:p-4">
                <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs">1</span>
                            Vendor & Reference
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                            <div>
                                <label className="block text-xs font-medium text-foreground/80 mb-1.5">Vendor *</label>
                                <select
                                    value={formValues.vendorId}
                                    onChange={(e) => handleFieldChange('vendorId', e.target.value)}
                                    className="w-full rounded-lg border-2 border-input bg-white px-3 py-2 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 cursor-pointer"
                                >
                                    <option value="">Select Vendor</option>
                                    {vendors.map((vendor) => (
                                        <option key={vendor.id} value={vendor.id}>
                                            {vendor.vendorName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-foreground/80 mb-1.5">Job ID</label>
                                <input
                                    type="text"
                                    value={formValues.jobNumber}
                                    readOnly
                                    placeholder="Auto-generated"
                                    className="w-full rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-foreground/80 mb-1.5">Bill / Reference # *</label>
                                <input
                                    type="text"
                                    value={formValues.billNumber}
                                    onChange={(e) => handleFieldChange('billNumber', e.target.value)}
                                    className="w-full rounded-lg border-2 border-input bg-white px-3 py-2 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-foreground/80 mb-1.5">Bill Date</label>
                                    <input
                                        type="date"
                                        value={formValues.date}
                                        onChange={(e) => handleFieldChange('date', e.target.value)}
                                        className="w-full rounded-lg border-2 border-input bg-white px-3 py-2 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-foreground/80 mb-1.5">Due Date</label>
                                    <input
                                        type="date"
                                        value={formValues.dueDate}
                                        onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                                        className="w-full rounded-lg border-2 border-input bg-white px-3 py-2 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs">2</span>
                            Financial Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                            <div>
                                <label className="block text-xs font-medium text-foreground/80 mb-1.5">Amount *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formValues.amount}
                                    onChange={(e) => handleFieldChange('amount', parseFloat(e.target.value) || 0)}
                                    className="w-full rounded-lg border-2 border-input bg-white px-3 py-2 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-foreground/80 mb-1.5">Currency</label>
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
                            <div>
                                <label className="block text-xs font-medium text-foreground/80 mb-1.5">Service Type</label>
                                <select
                                    value={formValues.category}
                                    onChange={(e) => handleFieldChange('category', e.target.value)}
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
                                <label className="block text-xs font-medium text-foreground/80 mb-1.5">Status</label>
                                <select
                                    value={formValues.status}
                                    onChange={(e) => handleFieldChange('status', e.target.value as VendorBill['status'])}
                                    className="w-full rounded-lg border-2 border-input bg-white px-3 py-2 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 cursor-pointer"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="paid">Paid</option>
                                </select>
                            </div>
                            {formValues.status === 'paid' && (
                                <div>
                                    <label className="block text-xs font-medium text-foreground/80 mb-1.5">Paid Date</label>
                                    <input
                                        type="date"
                                        value={formValues.paidDate}
                                        onChange={(e) => handleFieldChange('paidDate', e.target.value)}
                                        className="w-full rounded-lg border-2 border-input bg-white px-3 py-2 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <label className="block text-xs font-medium text-foreground/80 mb-1.5">Notes</label>
                        <textarea
                            value={formValues.description}
                            onChange={(e) => handleFieldChange('description', e.target.value)}
                            rows={2}
                            className="w-full rounded-lg border-2 border-input bg-white px-3 py-2 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary-hover hover:shadow-lg active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
                        >
                            {isSaving ? 'Saving...' : editMode ? 'Update Bill' : 'Create Bill'}
                        </button>
                    </div>
                </form>

                <div className="bg-white border border-slate-200 rounded-lg mt-6 shadow-sm">
                    <div className="px-4 py-3 border-b border-slate-100 flex flex-col md:flex-row gap-3">
                        <select
                            value={filters.vendorId}
                            onChange={(e) => setFilters((prev) => ({ ...prev, vendorId: e.target.value }))}
                            className="w-full md:w-48 rounded-lg border border-input bg-white px-3 py-2 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 cursor-pointer"
                        >
                            <option value="all">All Vendors</option>
                            {vendors.map((vendor) => (
                                <option key={vendor.id} value={vendor.id}>
                                    {vendor.vendorName}
                                </option>
                            ))}
                        </select>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value as VendorBill['status'] | 'all' }))}
                            className="w-full md:w-40 rounded-lg border border-input bg-white px-3 py-2 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 cursor-pointer"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                        </select>
                    </div>

                    {loading ? (
                        <div className="py-10 text-center text-slate-400 text-sm">Loading vendor bills...</div>
                    ) : filteredBills.length === 0 ? (
                        <div className="py-10 text-center text-slate-400 text-sm">No vendor bills found</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50">
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Vendor</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Reference</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Job #</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">Amount</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Status</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBills.map((bill) => (
                                        <tr key={bill.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150">
                                            <td className="px-4 py-3 text-sm text-slate-700">{bill.date}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{bill.vendorName || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{bill.billNumber || '-'}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-primary">{bill.jobNumber || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-right font-semibold text-slate-900">
                                                {formatCurrencyValue(bill.amount, bill.currency)}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${
                                                        bill.status === 'paid'
                                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                            : 'border-amber-200 bg-amber-50 text-amber-700'
                                                    }`}
                                                >
                                                    {bill.status === 'paid' ? 'Paid' : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right space-x-2">
                                                {bill.status !== 'paid' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => void markAsPaid(bill)}
                                                        className="inline-flex items-center rounded-md border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                                                    >
                                                        Mark Paid
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => void removeBill(bill)}
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
                    )}
                </div>
            </div>
        </div>
    );
}
