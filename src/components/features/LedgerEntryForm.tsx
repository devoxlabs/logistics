// Ledger Entry Form Component
'use client';

import { useState, useEffect } from 'react';
import { createLedgerEntry } from '@/services/ledger';
import { listCustomers } from '@/services/customers';
import { listVendors } from '@/services/vendors';
import { CustomerProfile } from '@/models/profiles';
import { VendorProfile } from '@/models/profiles';
import { TransactionType } from '@/models/ledger';
import FeatureHeader from '@/components/ui/FeatureHeader';

type EntryType = 'customer' | 'vendor';

export default function LedgerEntryForm() {
    const [entryType, setEntryType] = useState<EntryType>('customer');
    const [customers, setCustomers] = useState<CustomerProfile[]>([]);
    const [vendors, setVendors] = useState<VendorProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);

    const [formValues, setFormValues] = useState({
        date: new Date().toISOString().split('T')[0],
        customerId: '',
        vendorId: '',
        description: '',
        debit: '',
        credit: '',
        jobNumber: '',
        invoiceNumber: '',
        type: 'invoice' as TransactionType,
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [customerData, vendorData] = await Promise.all([
                listCustomers(),
                listVendors(),
            ]);
            setCustomers(customerData);
            setVendors(vendorData);
        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFieldChange = (field: string, value: string) => {
        setFormValues((prev) => ({ ...prev, [field]: value }));
        setSaveMessage(null);
        setSaveError(null);
    };

    const handleReset = () => {
        setFormValues({
            date: new Date().toISOString().split('T')[0],
            customerId: '',
            vendorId: '',
            description: '',
            debit: '',
            credit: '',
            jobNumber: '',
            invoiceNumber: '',
            type: 'invoice',
        });
        setSaveMessage(null);
        setSaveError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaveMessage(null);
        setSaveError(null);

        // Validation
        if (entryType === 'customer' && !formValues.customerId) {
            setSaveError('Please select a customer');
            return;
        }
        if (entryType === 'vendor' && !formValues.vendorId) {
            setSaveError('Please select a vendor');
            return;
        }
        if (!formValues.description.trim()) {
            setSaveError('Please enter a description');
            return;
        }

        const debitAmount = parseFloat(formValues.debit) || 0;
        const creditAmount = parseFloat(formValues.credit) || 0;

        if (debitAmount === 0 && creditAmount === 0) {
            setSaveError('Please enter either a debit or credit amount');
            return;
        }
        if (debitAmount > 0 && creditAmount > 0) {
            setSaveError('Please enter only debit OR credit, not both');
            return;
        }

        try {
            setIsSaving(true);

            // Get customer or vendor name
            let customerName = '';
            let vendorName = '';
            if (entryType === 'customer') {
                const customer = customers.find((c) => c.id === formValues.customerId);
                customerName = customer?.customerName || '';
            } else {
                const vendor = vendors.find((v) => v.id === formValues.vendorId);
                vendorName = vendor?.vendorName || '';
            }

            const entry = {
                date: formValues.date,
                customerId: entryType === 'customer' ? formValues.customerId : undefined,
                vendorId: entryType === 'vendor' ? formValues.vendorId : undefined,
                customerName: entryType === 'customer' ? customerName : undefined,
                vendorName: entryType === 'vendor' ? vendorName : undefined,
                description: formValues.description,
                debit: debitAmount,
                credit: creditAmount,
                balance: 0, // Will be calculated by the ledger report
                jobNumber: formValues.jobNumber,
                invoiceNumber: formValues.invoiceNumber,
                type: formValues.type,
            };

            await createLedgerEntry(entry);
            setSaveMessage('Ledger entry created successfully!');
            handleReset();
        } catch (error) {
            console.error('Failed to create ledger entry', error);
            setSaveError('Failed to create ledger entry. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const selectedCustomer = customers.find((c) => c.id === formValues.customerId);
    const selectedVendor = vendors.find((v) => v.id === formValues.vendorId);

    const pickPrimaryValue = (values: Array<string | undefined | null>) =>
        values.find((value) => value && value.trim().length > 0) ?? '-';

    const customerContact = selectedCustomer
        ? pickPrimaryValue([selectedCustomer.contact1, selectedCustomer.contact2, selectedCustomer.contact3])
        : '-';
    const customerEmail = selectedCustomer
        ? pickPrimaryValue([selectedCustomer.email1, selectedCustomer.email2, selectedCustomer.email3])
        : '-';
    const vendorContact = selectedVendor
        ? pickPrimaryValue([selectedVendor.contact1, selectedVendor.contact2, selectedVendor.contact3])
        : '-';
    const vendorEmail = selectedVendor
        ? pickPrimaryValue([selectedVendor.email1, selectedVendor.email2, selectedVendor.email3])
        : '-';

    return (
        <div className="h-full min-h-[60vh] md:min-h-full rounded-xl border border-slate-200 bg-white flex flex-col">
            <FeatureHeader
                title="Ledger Entry"
                icon={
                    <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                    </svg>
                }
            />

            {/* Form */}
            <div className="flex-1 overflow-auto p-4 md:p-6">
                <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
                    {/* Entry Type Selection */}
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                            Entry Type
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="entryType"
                                    value="customer"
                                    checked={entryType === 'customer'}
                                    onChange={(e) => {
                                        setEntryType(e.target.value as EntryType);
                                        setFormValues((prev) => ({
                                            ...prev,
                                            customerId: '',
                                            vendorId: '',
                                        }));
                                    }}
                                    className="w-4 h-4 text-primary focus:ring-primary"
                                />
                                <span className="text-sm font-medium text-slate-700">Customer</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="entryType"
                                    value="vendor"
                                    checked={entryType === 'vendor'}
                                    onChange={(e) => {
                                        setEntryType(e.target.value as EntryType);
                                        setFormValues((prev) => ({
                                            ...prev,
                                            customerId: '',
                                            vendorId: '',
                                        }));
                                    }}
                                    className="w-4 h-4 text-primary focus:ring-primary"
                                />
                                <span className="text-sm font-medium text-slate-700">Vendor</span>
                            </label>
                        </div>
                    </div>

                    {/* Customer/Vendor Selection */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                            {entryType === 'customer' ? 'Customer' : 'Vendor'} *
                        </label>
                        <select
                            value={entryType === 'customer' ? formValues.customerId : formValues.vendorId}
                            onChange={(e) =>
                                handleFieldChange(
                                    entryType === 'customer' ? 'customerId' : 'vendorId',
                                    e.target.value
                                )
                            }
                            className="w-full rounded-lg border-2 border-input bg-white px-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                            disabled={loading}
                        >
                            <option value="">
                                Select {entryType === 'customer' ? 'Customer' : 'Vendor'}
                            </option>
                            {entryType === 'customer'
                                ? customers.map((customer) => (
                                    <option key={customer.id} value={customer.id}>
                                        {customer.customerName}
                                    </option>
                                ))
                                : vendors.map((vendor) => (
                                    <option key={vendor.id} value={vendor.id}>
                                        {vendor.vendorName}
                                    </option>
                                ))}
                        </select>
                        {entryType === 'customer' && selectedCustomer && (
                            <p className="text-xs text-slate-500">
                                Contact: {customerContact} | Email: {customerEmail}
                            </p>
                        )}
                        {entryType === 'vendor' && selectedVendor && (
                            <p className="text-xs text-slate-500">
                                Contact: {vendorContact} | Email: {vendorEmail}
                            </p>
                        )}
                    </div>

                    {/* Date */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                            Date *
                        </label>
                        <input
                            type="date"
                            value={formValues.date}
                            onChange={(e) => handleFieldChange('date', e.target.value)}
                            className="w-full rounded-lg border-2 border-input bg-white px-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                        />
                    </div>

                    {/* Transaction Type */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                            Transaction Type
                        </label>
                        <select
                            value={formValues.type}
                            onChange={(e) => handleFieldChange('type', e.target.value)}
                            className="w-full rounded-lg border-2 border-input bg-white px-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                        >
                            <option value="invoice">Invoice</option>
                            <option value="payment">Payment</option>
                            <option value="adjustment">Adjustment</option>
                            <option value="credit_note">Credit Note</option>
                        </select>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                            Description *
                        </label>
                        <textarea
                            value={formValues.description}
                            onChange={(e) => handleFieldChange('description', e.target.value)}
                            rows={3}
                            placeholder="Enter transaction description..."
                            className="w-full rounded-lg border-2 border-input bg-white px-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 resize-none"
                        />
                    </div>

                    {/* Debit and Credit */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">
                                Debit Amount
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                                    $
                                </span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formValues.debit}
                                    onChange={(e) => handleFieldChange('debit', e.target.value)}
                                    placeholder="0.00"
                                    className="w-full rounded-lg border-2 border-input bg-white pl-8 pr-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                />
                            </div>
                            <p className="text-xs text-slate-500">
                                Amount {entryType === 'customer' ? 'customer owes' : 'you owe vendor'}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">
                                Credit Amount
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                                    $
                                </span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formValues.credit}
                                    onChange={(e) => handleFieldChange('credit', e.target.value)}
                                    placeholder="0.00"
                                    className="w-full rounded-lg border-2 border-input bg-white pl-8 pr-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                />
                            </div>
                            <p className="text-xs text-slate-500">
                                Amount {entryType === 'customer' ? 'received from customer' : 'paid to vendor'}
                            </p>
                        </div>
                    </div>

                    {/* Reference Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">
                                Job Number
                            </label>
                            <input
                                type="text"
                                value={formValues.jobNumber}
                                onChange={(e) => handleFieldChange('jobNumber', e.target.value)}
                                placeholder="e.g., IMP-2025-0001"
                                className="w-full rounded-lg border-2 border-input bg-white px-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">
                                Invoice Number
                            </label>
                            <input
                                type="text"
                                value={formValues.invoiceNumber}
                                onChange={(e) => handleFieldChange('invoiceNumber', e.target.value)}
                                placeholder="e.g., INV-001"
                                className="w-full rounded-lg border-2 border-input bg-white px-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                            />
                        </div>
                    </div>

                    {/* Messages */}
                    {saveMessage && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                            {saveMessage}
                        </div>
                    )}
                    {saveError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {saveError}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium py-2.5 px-6 rounded-lg transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? 'Saving...' : 'Create Entry'}
                        </button>
                        <button
                            type="button"
                            onClick={handleReset}
                            disabled={isSaving}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Reset
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
