// Simplified Invoice/Billing Management Component
// This component handles both invoice creation and billing dashboard
'use client';

import { useState, useEffect } from 'react';
import { Invoice, InvoiceFormValues, emptyInvoiceForm } from '@/models/invoices';
import { listInvoices, createInvoice, generateInvoiceNumber, updateInvoice } from '@/services/invoices';
import { listCustomers } from '@/services/customers';
import { listVendors } from '@/services/vendors';
import { CustomerProfile, VendorProfile } from '@/models/profiles';
import FeatureHeader from '@/components/ui/FeatureHeader';
import DetailDialog from '@/components/ui/DetailDialog';
import { formatCurrencyValue, getCurrencyOptions } from '@/lib/currency';

type InvoiceBillingProps = {
    initialTab?: 'invoice' | 'billing';
};

export default function InvoiceBilling({ initialTab = 'invoice' }: InvoiceBillingProps) {
    const [activeTab, setActiveTab] = useState<'invoice' | 'billing'>(initialTab);
    const [view, setView] = useState<'list' | 'create'>('list');
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [customers, setCustomers] = useState<CustomerProfile[]>([]);
    const [vendors, setVendors] = useState<VendorProfile[]>([]);
    const [formValues, setFormValues] = useState<InvoiceFormValues>(emptyInvoiceForm());
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);
    const [detailStatus, setDetailStatus] = useState<Invoice['status']>('draft');
    const [detailSaving, setDetailSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    useEffect(() => {
        setFormValues(emptyInvoiceForm(activeTab === 'invoice' ? 'customer' : 'vendor'));
        setView('list');
        setSaveMessage(null);
    }, [activeTab]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [invoicesData, customersData, vendorsData] = await Promise.all([
                listInvoices(),
                listCustomers(),
                listVendors(),
            ]);
            setInvoices(invoicesData);
            setCustomers(customersData);
            setVendors(vendorsData);
        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFieldChange = <K extends keyof InvoiceFormValues>(field: K, value: InvoiceFormValues[K]) => {
        setFormValues((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaveMessage(null);

        try {
            setIsSaving(true);

            if (!formValues.invoiceNumber) {
                const prefix = activeTab === 'invoice' ? 'INV' : 'BILL';
                formValues.invoiceNumber = generateInvoiceNumber(prefix);
            }

            const payload: InvoiceFormValues = {
                ...formValues,
                partyType: activeTab === 'invoice' ? 'customer' : 'vendor',
            };

            const newInvoice = await createInvoice(payload);
            setInvoices((prev) => [newInvoice, ...prev]);
            setFormValues(emptyInvoiceForm(activeTab === 'invoice' ? 'customer' : 'vendor'));
            setSaveMessage(activeTab === 'invoice' ? 'Invoice created successfully' : 'Bill created successfully');
            setView('list');
        } catch (error) {
            console.error('Failed to save invoice', error);
        } finally {
            setIsSaving(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            draft: 'bg-slate-100 text-slate-700 border-slate-200',
            sent: 'bg-blue-100 text-blue-700 border-blue-200',
            paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            partially_paid: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            overdue: 'bg-rose-100 text-rose-700 border-rose-200',
            cancelled: 'bg-gray-100 text-gray-700 border-gray-200',
        };
        return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
    };

    const currentPartyType = activeTab === 'invoice' ? 'customer' : 'vendor';
    const filteredInvoices = invoices.filter(
        (inv) => (inv.partyType ?? 'customer') === currentPartyType
    );

    const stats = {
        totalBilled: filteredInvoices.reduce((sum, inv) => sum + inv.total, 0),
        paid: filteredInvoices.filter((inv) => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0),
        outstanding: filteredInvoices.filter((inv) => inv.status !== 'paid' && inv.status !== 'cancelled').reduce((sum, inv) => sum + inv.total, 0),
        overdue: filteredInvoices.filter((inv) => inv.status === 'overdue').reduce((sum, inv) => sum + inv.total, 0),
    };

    const partyLabel = activeTab === 'invoice' ? 'Customer' : 'Vendor';

    const handlePartySelection = (id: string) => {
        if (activeTab === 'invoice') {
            const customer = customers.find((c) => c.id === id);
            setFormValues((prev) => ({
                ...prev,
                partyType: 'customer',
                partyId: id,
                partyName: customer?.customerName ?? '',
                partyAddress: customer?.address ?? '',
                partyTaxId: customer?.ntnNumber ?? '',
                customerId: id,
                customerName: customer?.customerName ?? '',
                customerAddress: customer?.address ?? '',
                customerTaxId: customer?.ntnNumber ?? '',
            }));
        } else {
            const vendor = vendors.find((v) => v.id === id);
            setFormValues((prev) => ({
                ...prev,
                partyType: 'vendor',
                partyId: id,
                partyName: vendor?.vendorName ?? '',
                partyAddress: vendor?.address ?? '',
                partyTaxId: vendor?.ntnNumber ?? '',
                vendorId: id,
                vendorName: vendor?.vendorName ?? '',
                vendorAddress: vendor?.address ?? '',
                vendorTaxId: vendor?.ntnNumber ?? '',
            }));
        }
    };

    const openInvoiceDetail = (invoice: Invoice) => {
        setDetailInvoice(invoice);
        setDetailStatus(invoice.status);
    };

    const closeInvoiceDetail = () => {
        setDetailInvoice(null);
    };

    const handleDetailStatusSave = async () => {
        if (!detailInvoice) return;
        try {
            setDetailSaving(true);
            const updated: Invoice = { ...detailInvoice, status: detailStatus };
            if (detailStatus === 'paid') {
                updated.paidAmount = detailInvoice.total;
                updated.paidDate = new Date().toISOString().split('T')[0];
            } else if (detailStatus === 'draft' || detailStatus === 'sent') {
                updated.paidAmount = 0;
                updated.paidDate = '';
            }
            const { id, ...payload } = updated;
            await updateInvoice(id, payload);
            setInvoices((prev) => prev.map((inv) => (inv.id === id ? updated : inv)));
            setDetailInvoice(updated);
            setSaveMessage((updated.partyType ?? 'customer') === 'customer' ? 'Invoice updated successfully' : 'Bill updated successfully');
        } catch (error) {
            console.error(error);
        } finally {
            setDetailSaving(false);
        }
    };

    return (
        <>
        <div className="h-full min-h-[60vh] md:min-h-full rounded-xl border border-slate-200 bg-white flex flex-col">
            <div className="px-4 pt-4 flex gap-2">
                <button
                    type="button"
                    onClick={() => setActiveTab('invoice')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer ${
                        activeTab === 'invoice'
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-slate-600 border-slate-200'
                    }`}
                >
                    Customer Invoices
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('billing')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer ${
                        activeTab === 'billing'
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-slate-600 border-slate-200'
                    }`}
                >
                    Vendor Bills
                </button>
            </div>
            <FeatureHeader
                title={
                    view === 'list'
                        ? activeTab === 'invoice'
                            ? 'Customer Invoices'
                            : 'Vendor Bills'
                        : activeTab === 'invoice'
                            ? 'Create Invoice'
                            : 'Create Bill'
                }
                icon={
                    <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                    </svg>
                }
                actions={
                    view === 'list' ? (
                        <button
                            onClick={() => setView('create')}
                            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 md:px-4 md:py-2 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary-hover active:scale-95 transition-all duration-200 cursor-pointer"
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            {activeTab === 'invoice' ? 'New Invoice' : 'New Bill'}
                        </button>
                    ) : (
                        <button
                            onClick={() => setView('list')}
                            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 md:px-4 md:py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 transition-all duration-200 cursor-pointer"
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to List
                        </button>
                    )
                }
            />

            {view === 'list' ? (
                <>
                    <div className="border-b border-slate-100 px-4 py-4 bg-gradient-to-br from-slate-50 to-white">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-white rounded-lg border border-slate-200 p-3 md:p-4">
                                <div className="text-xs text-slate-500 mb-1">Total Billed</div>
                                <div className="text-xl md:text-2xl font-bold text-slate-900">{formatCurrencyValue(stats.totalBilled, 'USD')}</div>
                            </div>
                            <div className="bg-white rounded-lg border border-slate-200 p-3 md:p-4">
                                <div className="text-xs text-slate-500 mb-1">Paid</div>
                                <div className="text-xl md:text-2xl font-bold text-emerald-600">{formatCurrencyValue(stats.paid, 'USD')}</div>
                            </div>
                            <div className="bg-white rounded-lg border border-slate-200 p-3 md:p-4">
                                <div className="text-xs text-slate-500 mb-1">Outstanding</div>
                                <div className="text-xl md:text-2xl font-bold text-primary">{formatCurrencyValue(stats.outstanding, 'USD')}</div>
                            </div>
                            <div className="bg-white rounded-lg border border-slate-200 p-3 md:p-4">
                                <div className="text-xs text-slate-500 mb-1">Overdue</div>
                                <div className="text-xl md:text-2xl font-bold text-rose-600">{formatCurrencyValue(stats.overdue, 'USD')}</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto p-4">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="flex items-center gap-3 text-slate-500">
                                    <div className="h-5 w-5 border-2 border-slate-300 border-t-primary rounded-full animate-spin" />
                                    <span className="text-sm">Loading invoices...</span>
                                </div>
                            </div>
                        ) : filteredInvoices.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                <svg className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-sm">No records found</p>
                            </div>
                        ) : (
                            <>
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50">
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Invoice #</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Date</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">{partyLabel}</th>
                                            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-700">Amount</th>
                                            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-700">Paid</th>
                                            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-700">Balance</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Status</th>
                                            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-700">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredInvoices.map((invoice) => (
                                            <tr
                                                key={invoice.id}
                                                className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150 cursor-pointer"
                                                onClick={() => openInvoiceDetail(invoice)}
                                            >
                                                <td className="px-4 py-3 text-sm font-medium text-primary">{invoice.invoiceNumber}</td>
                                                <td className="px-4 py-3 text-sm text-slate-700">{invoice.invoiceDate}</td>
                                                <td className="px-4 py-3 text-sm text-slate-700">{invoice.partyName || invoice.customerName || invoice.vendorName}</td>
                                                <td className="px-4 py-3 text-sm text-right font-medium text-slate-900">
                                                    {formatCurrencyValue(invoice.total, invoice.currency || 'USD')}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right text-emerald-600">
                                                    {formatCurrencyValue(invoice.paidAmount, invoice.currency || 'USD')}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right font-semibold text-slate-900">
                                                    {formatCurrencyValue(invoice.total - invoice.paidAmount, invoice.currency || 'USD')}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                                                        {invoice.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            openInvoiceDetail(invoice);
                                                        }}
                                                        className="inline-flex items-center rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                                                    >
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                </div>
                                <div className="md:hidden space-y-3">
                                    {filteredInvoices.map((invoice) => (
                                        <div
                                            key={invoice.id}
                                            className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm cursor-pointer"
                                            onClick={() => openInvoiceDetail(invoice)}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-primary mb-0.5">{invoice.invoiceNumber}</p>
                                                    <p className="text-xs text-slate-500">{invoice.invoiceDate}</p>
                                                    <p className="text-xs text-slate-600 mt-1">{invoice.partyName || invoice.customerName || invoice.vendorName}</p>
                                                </div>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusColor(invoice.status)}`}>
                                                    {invoice.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                                                <div className="rounded-lg border border-slate-200 px-2 py-1">
                                                    <p className="text-[10px] uppercase text-slate-500">Amount</p>
                                                    <p className="text-sm font-semibold text-slate-900">
                                                        {formatCurrencyValue(invoice.total, invoice.currency || 'USD')}
                                                    </p>
                                                </div>
                                                <div className="rounded-lg border border-slate-200 px-2 py-1">
                                                    <p className="text-[10px] uppercase text-slate-500">Paid</p>
                                                    <p className="text-sm font-semibold text-emerald-600">
                                                        {formatCurrencyValue(invoice.paidAmount, invoice.currency || 'USD')}
                                                    </p>
                                                </div>
                                                <div className="rounded-lg border border-slate-200 px-2 py-1">
                                                    <p className="text-[10px] uppercase text-slate-500">Balance</p>
                                                    <p className="text-sm font-semibold text-rose-600">
                                                        {formatCurrencyValue(invoice.total - invoice.paidAmount, invoice.currency || 'USD')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </>
            ) : (
                <div className="flex-1 overflow-auto p-3 md:p-4">
                    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <h3 className="text-sm font-semibold text-slate-800 mb-3">Invoice Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground/80 mb-1.5">Invoice Date</label>
                                    <input
                                        type="date"
                                        value={formValues.invoiceDate}
                                        onChange={(e) => handleFieldChange('invoiceDate', e.target.value)}
                                        className="w-full rounded-lg border-2 border-input bg-white px-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground/80 mb-1.5">Due Date</label>
                                    <input
                                        type="date"
                                        value={formValues.dueDate}
                                        onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                                        className="w-full rounded-lg border-2 border-input bg-white px-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground/80 mb-1.5">{partyLabel} *</label>
                                    <select
                                        value={activeTab === 'invoice' ? formValues.customerId : formValues.vendorId}
                                        onChange={(e) => handlePartySelection(e.target.value)}
                                        className="w-full rounded-lg border-2 border-input bg-white px-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                    >
                                        <option value="">Select {partyLabel}</option>
                                        {(activeTab === 'invoice' ? customers : vendors).map((party) => (
                                            <option key={party.id} value={party.id}>{partyLabel === 'Customer' ? (party as CustomerProfile).customerName : (party as VendorProfile).vendorName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <h3 className="text-sm font-semibold text-slate-800 mb-2">Line Items</h3>
                            <p className="text-xs text-slate-600">
                                Line items are automatically populated from linked import/export shipments. Once a shipment
                                referencing this invoice or bill is created, the totals will update here.
                            </p>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <div className="max-w-md ml-auto space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Subtotal:</span>
                                    <span className="font-semibold text-slate-900">{formatCurrencyValue(formValues.subtotal, formValues.currency)}</span>
                                </div>
                                <div className="flex justify-between text-sm items-center gap-4">
                                    <span className="text-slate-600">Tax:</span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={formValues.taxRate}
                                            onChange={(e) => {
                                                const rate = parseFloat(e.target.value) || 0;
                                                const taxAmount = formValues.subtotal * (rate / 100);
                                                const total = formValues.subtotal + taxAmount - formValues.discount;
                                                setFormValues((prev) => ({ ...prev, taxRate: rate, taxAmount, total }));
                                            }}
                                            className="w-20 rounded-lg border-2 border-input bg-white px-2 py-1 text-sm"
                                        />
                                        <span className="text-xs">%</span>
                                        <span className="font-semibold text-slate-900 w-24 text-right">{formatCurrencyValue(formValues.taxAmount, formValues.currency)}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between text-sm items-center">
                                    <span className="text-slate-600">Currency</span>
                                    <select
                                        value={formValues.currency}
                                        onChange={(e) => handleFieldChange('currency', e.target.value)}
                                        className="rounded-md border border-input px-2 py-1 text-xs"
                                    >
                                        {getCurrencyOptions().map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-200">
                                    <span className="text-slate-900">Total:</span>
                                    <span className="text-primary">{formatCurrencyValue(formValues.total, formValues.currency)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary-hover hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer transition-all duration-200"
                            >
                                {isSaving ? (
                                    <>
                                        <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Creating...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>{activeTab === 'invoice' ? 'Create Invoice' : 'Create Bill'}</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {saveMessage && (
                            <p className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2">
                                {saveMessage}
                            </p>
                        )}
                    </form>
                </div>
            )}
        </div>
        {detailInvoice && (
            <DetailDialog title={detailInvoice.invoiceNumber} onClose={closeInvoiceDetail}>
                <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <DetailInfo label="Party" value={detailInvoice.partyName || detailInvoice.customerName || detailInvoice.vendorName} />
                        <DetailInfo label="Invoice Date" value={detailInvoice.invoiceDate || '—'} />
                        <DetailInfo label="Due Date" value={detailInvoice.dueDate || '—'} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                        <div>
                            <p className="text-xs text-slate-500">Status</p>
                            <select
                                value={detailStatus}
                                onChange={(e) => setDetailStatus(e.target.value as Invoice['status'])}
                                className="mt-1 w-full rounded-lg border border-input px-3 py-2 text-sm cursor-pointer"
                            >
                                {['draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled'].map((status) => (
                                    <option key={status} value={status}>
                                        {status.replace('_', ' ')}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <DetailInfo label="Currency" value={detailInvoice.currency || 'USD'} />
                        <DetailInfo label="Total" value={formatCurrencyValue(detailInvoice.total, detailInvoice.currency || 'USD')} />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-slate-800 mb-2">Line Items</h3>
                        {detailInvoice.lineItems && detailInvoice.lineItems.length > 0 ? (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-xs text-slate-500 border-b">
                                        <th className="px-2 py-1">Description</th>
                                        <th className="px-2 py-1 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detailInvoice.lineItems.map((item) => (
                                        <tr key={item.id} className="border-b last:border-0">
                                            <td className="px-2 py-2">{item.description}</td>
                                            <td className="px-2 py-2 text-right">
                                                {formatCurrencyValue(item.amount, detailInvoice.currency || 'USD')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-xs text-slate-500">Line items will appear when shipments are linked.</p>
                        )}
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={handleDetailStatusSave}
                            disabled={detailSaving}
                            className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {detailSaving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </DetailDialog>
        )}
        </>
    );
}

type DetailInfoProps = {
    label: string;
    value?: string;
};

function DetailInfo({ label, value }: DetailInfoProps) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 mb-0.5">{label}</p>
            <p className="text-sm font-medium text-slate-900 break-words">{value || '—'}</p>
        </div>
    );
}
