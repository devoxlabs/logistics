// Import Shipment Form Component
'use client';

import { useState, useEffect } from 'react';
import {
    ImportShipmentFormValues,
    ImportShipment,
    emptyImportShipmentForm,
    ShipmentStatus,
} from '@/models/shipments';
import {
    listImportShipments,
    createImportShipment,
    updateShipment,
    generateImportJobNumber,
} from '@/services/shipments';
import { listCustomers } from '@/services/customers';
import { CustomerProfile } from '@/models/profiles';
import FeatureHeader from '@/components/ui/FeatureHeader';
import { listInvoicesByCustomer } from '@/services/invoices';
import { Invoice } from '@/models/invoices';
import { convertCurrency, formatCurrencyValue, getCurrencyOptions } from '@/lib/currency';
import { updateInvoice } from '@/services/invoices';

export default function ImportShipmentForm() {
    const [shipments, setShipments] = useState<ImportShipment[]>([]);
    const [customers, setCustomers] = useState<CustomerProfile[]>([]);
    const [formValues, setFormValues] = useState<ImportShipmentFormValues>(
        emptyImportShipmentForm()
    );
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [selectedShipmentId, setSelectedShipmentId] = useState('');
    const [customerInvoices, setCustomerInvoices] = useState<Invoice[]>([]);
    const [linkedInvoiceId, setLinkedInvoiceId] = useState('');
    const [invoiceLoading, setInvoiceLoading] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    const syncInvoiceFromShipment = async (values: ImportShipmentFormValues) => {
        if (!values.invoiceId) return;
        const invoice =
            (selectedInvoice && selectedInvoice.id === values.invoiceId
                ? selectedInvoice
                : customerInvoices.find((inv) => inv.id === values.invoiceId)) || null;
        if (!invoice) return;

        const shipmentCurrency = values.currency || 'USD';
        const invoiceCurrency = invoice.currency || 'USD';
        const chargesValue = parseFloat(values.totalCharges || '0') || 0;
        const totalForShipment = chargesValue;
        const convertedAmount = convertCurrency(totalForShipment, shipmentCurrency, invoiceCurrency);

        const lineItemId = values.jobNumber || values.billOfLading || Math.random().toString(36).slice(2);
        const descriptor = `${values.jobNumber || values.billOfLading} • Import (${values.mode})`;
        const newLineItem = {
            id: lineItemId,
            description: descriptor.trim(),
            quantity: 1,
            unitPrice: convertedAmount,
            amount: convertedAmount,
        };

        const existingItems = invoice.lineItems ?? [];
        const filteredItems = existingItems.filter((item) => item.id !== newLineItem.id);
        const lineItems = [...filteredItems, newLineItem];
        const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
        const taxAmount = subtotal * (invoice.taxRate / 100);
        const total = subtotal + taxAmount - invoice.discount;

        const updatedInvoice: Invoice = {
            ...invoice,
            lineItems,
            subtotal,
            taxAmount,
            total,
        };

        const { id, ...payload } = updatedInvoice;
        await updateInvoice(id, payload);

        setCustomerInvoices((prev) =>
            prev.map((item) => (item.id === id ? updatedInvoice : item))
        );
        if (selectedInvoice?.id === id) {
            setSelectedInvoice(updatedInvoice);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [shipmentsData, customersData] = await Promise.all([
                listImportShipments(),
                listCustomers(),
            ]);
            setShipments(shipmentsData);
            setCustomers(customersData);
        } catch (error) {
            console.error('Failed to load data', error);
        }
    };

    const handleFieldChange = (field: keyof ImportShipmentFormValues, value: string) => {
        setFormValues((prev) => ({ ...prev, [field]: value }));

        // Auto-populate customer name when customer is selected
        if (field === 'customerId') {
            setSelectedInvoice(null);
            setLinkedInvoiceId('');
            const customer = customers.find((c) => c.id === value);
            if (customer) {
                setFormValues((prev) => ({
                    ...prev,
                    customerId: value,
                    customerName: customer.customerName,
                invoiceId: '',
                invoiceNumber: '',
                }));
            }
        }

        // Auto-calculate total charges
        if (
            field === 'freightCharges' ||
            field === 'insuranceCharges' ||
            field === 'customsDuty' ||
            field === 'otherCharges' ||
            field === 'logisticCharges'
        ) {
            const getValue = (key: keyof ImportShipmentFormValues) =>
                parseFloat((field === key ? value : (formValues[key] as string)) || '0') || 0;

            const freight = getValue('freightCharges');
            const insurance = getValue('insuranceCharges');
            const duty = getValue('customsDuty');
            const logistics = getValue('logisticCharges');
            const other = getValue('otherCharges');

            const total = freight + insurance + duty + logistics + other;

            setFormValues((prev) => ({ ...prev, totalCharges: total.toFixed(2) }));
        }
    };

    useEffect(() => {
        if (!formValues.customerId) {
            setCustomerInvoices([]);
            setLinkedInvoiceId('');
            return;
        }
        setInvoiceLoading(true);
        listInvoicesByCustomer(formValues.customerId)
            .then((data) => {
                setCustomerInvoices(data);
                const existing = data.find((invoice) => invoice.id === formValues.invoiceId);
                setSelectedInvoice(existing ?? null);
                setLinkedInvoiceId(existing ? existing.id : '');
            })
            .catch((error) => console.error('Failed to load invoices', error))
            .finally(() => setInvoiceLoading(false));
    }, [formValues.customerId, formValues.invoiceId]);

    const handleLoadShipment = () => {
        if (!selectedShipmentId) return;

        const shipment = shipments.find(s => s.id === selectedShipmentId);
        if (shipment) {
            setFormValues({
                ...shipment,
                freightCharges: shipment.freightCharges?.toString() || '0',
                insuranceCharges: shipment.insuranceCharges?.toString() || '0',
                customsDuty: shipment.customsDuty?.toString() || '0',
                logisticCharges: shipment.logisticCharges?.toString() || '0',
                otherCharges: shipment.otherCharges?.toString() || '0',
                totalCharges: shipment.totalCharges?.toString() || '0',
            });
            setEditMode(true);
            setSaveMessage(null);
            setSaveError(null);
            setLinkedInvoiceId(shipment.invoiceId || '');
        }
    };

    const handleInvoiceSelect = (invoiceId: string) => {
        setLinkedInvoiceId(invoiceId);
        if (!invoiceId) {
            setSelectedInvoice(null);
            setFormValues((prev) => ({
                ...prev,
                invoiceId: '',
            }));
            return;
        }
        const invoice = customerInvoices.find((inv) => inv.id === invoiceId);
        if (invoice) {
            setSelectedInvoice(invoice);
            setFormValues((prev) => ({
                ...prev,
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                currency: invoice.currency || prev.currency,
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaveError(null);
        setSaveMessage(null);

        // Validation
        if (!formValues.billOfLading.trim()) {
            setSaveError('Bill of Lading is required');
            return;
        }
        if (!formValues.customerId) {
            setSaveError('Customer is required');
            return;
        }

        try {
            setIsSaving(true);

            const payloadValues: ImportShipmentFormValues = { ...formValues };

            if (editMode && selectedShipmentId) {
                await updateShipment(selectedShipmentId, payloadValues);
                setShipments((prev) =>
                    prev.map((s) => (s.id === selectedShipmentId ? { ...s, ...payloadValues } : s))
                );
                setSaveMessage('Import shipment updated successfully');
            } else {
                if (!payloadValues.jobNumber) {
                    payloadValues.jobNumber = generateImportJobNumber();
                }
                const newShipment = await createImportShipment(payloadValues);
                setShipments((prev) => [newShipment, ...prev]);
                setSaveMessage('Import shipment created successfully');
            }

            await syncInvoiceFromShipment(payloadValues);

            setFormValues(emptyImportShipmentForm());
            setEditMode(false);
            setSelectedShipmentId('');
            setCustomerInvoices([]);
            setLinkedInvoiceId('');
            setSelectedInvoice(null);
        } catch (error) {
            console.error('Failed to save shipment', error);
            setSaveError('Failed to save shipment. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        setFormValues(emptyImportShipmentForm());
        setSaveError(null);
        setSaveMessage(null);
        setEditMode(false);
        setSelectedShipmentId('');
        setCustomerInvoices([]);
        setLinkedInvoiceId('');
        setSelectedInvoice(null);
    };

    return (
        <div className="h-full min-h-[60vh] md:min-h-full rounded-xl border border-slate-200 bg-white flex flex-col">
            <FeatureHeader
                title={`${editMode ? 'Edit' : 'Create'} Import Shipment`}
                icon={
                    <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z' />
                    </svg>
                }
                actions={
                    <>
                        {formValues.jobNumber && (
                            <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-md border border-primary/20">
                                {formValues.jobNumber}
                            </span>
                        )}
                        {editMode && (
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-md border border-blue-200">
                                Edit Mode
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={handleReset}
                            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 md:px-4 md:py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 transition-all duration-200 cursor-pointer"
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {editMode ? 'New Shipment' : 'Reset'}
                        </button>
                    </>
                }
            />

            {/* Load Existing Shipment */}
            {!editMode && shipments.length > 0 && (
                <div className="border-b border-slate-100 px-4 py-3 bg-blue-50">
                    <div className="flex flex-col md:flex-row gap-3 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Load Existing Shipment
                            </label>
                            <select
                                value={selectedShipmentId}
                                onChange={(e) => setSelectedShipmentId(e.target.value)}
                                className="w-full rounded-lg border-2 border-input bg-white px-4 py-2 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                            >
                                <option value="">Select a shipment to edit...</option>
                                {shipments.map((shipment) => (
                                    <option key={shipment.id} value={shipment.id}>
                                        {shipment.jobNumber} - {shipment.billOfLading} ({shipment.status})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            type="button"
                            onClick={handleLoadShipment}
                            disabled={!selectedShipmentId}
                            className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Load Shipment
                        </button>
                    </div>
                </div>
            )}

            {/* Form */}
            <div className="flex-1 overflow-auto p-3 md:p-4">
                <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6">
                    {/* Section 1: Reference Information */}
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs">
                                1
                            </span>
                            Reference Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                                    Bill of Lading *
                                </label>
                                <input
                                    type="text"
                                    value={formValues.billOfLading}
                                    onChange={(e) => handleFieldChange('billOfLading', e.target.value)}
                                    className="w-full rounded-lg border-2 border-input bg-white px-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                    placeholder="Enter B/L number"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                                    Container Number
                                </label>
                                <input
                                    type="text"
                                    value={formValues.containerNumber}
                                    onChange={(e) => handleFieldChange('containerNumber', e.target.value)}
                                    className="w-full rounded-lg border-2 border-input bg-white px-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 disabled:bg-slate-100 disabled:text-slate-400"
                                    placeholder="e.g., ABCD1234567"
                                    disabled={formValues.mode === 'flight'}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                                    Mode
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleFieldChange('mode', 'shipping')}
                                        className={`flex-1 rounded-lg border px-3 py-2 text-sm cursor-pointer ${
                                            formValues.mode === 'shipping'
                                                ? 'border-primary bg-primary/10 text-primary font-semibold'
                                                : 'border-slate-200 text-slate-600'
                                        }`}
                                    >
                                        Shipping
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleFieldChange('mode', 'flight')}
                                        className={`flex-1 rounded-lg border px-3 py-2 text-sm cursor-pointer ${
                                            formValues.mode === 'flight'
                                                ? 'border-primary bg-primary/10 text-primary font-semibold'
                                                : 'border-slate-200 text-slate-600'
                                        }`}
                                    >
                                        Flight
                                    </button>
                                </div>
                                {formValues.mode === 'flight' && (
                                    <p className="text-[11px] text-slate-500 mt-1">
                                        Container number disabled for flight shipments.
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                                    Status
                                </label>
                                <select
                                    value={formValues.status}
                                    onChange={(e) => handleFieldChange('status', e.target.value as ShipmentStatus)}
                                    className="w-full rounded-lg border-2 border-input bg-white px-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                >
                                    <option value="Booked">Booked</option>
                                    <option value="In Transit">In Transit</option>
                                    <option value="Arrived">Arrived</option>
                                    <option value="Customs Clearance">Customs Clearance</option>
                                    <option value="Released">Released</option>
                                    <option value="Delivered">Delivered</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Party Details */}
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs">
                                2
                            </span>
                            Party Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                                    Customer *
                                </label>
                                <select
                                    value={formValues.customerId}
                                    onChange={(e) => handleFieldChange('customerId', e.target.value)}
                                    className="w-full rounded-lg border-2 border-input bg-white px-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                >
                                    <option value="">Select Customer</option>
                                    {customers.map((customer) => (
                                        <option key={customer.id} value={customer.id}>
                                            {customer.customerName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                                    Consignee Name
                                </label>
                                <input
                                    type="text"
                                    value={formValues.consigneeName}
                                    onChange={(e) => handleFieldChange('consigneeName', e.target.value)}
                                    className="w-full rounded-lg border-2 border-input bg-white px-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                                    Consignee Address
                                </label>
                                <textarea
                                    value={formValues.consigneeAddress}
                                    onChange={(e) => handleFieldChange('consigneeAddress', e.target.value)}
                                    rows={2}
                                    className="w-full rounded-lg border-2 border-input bg-white px-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Vessel & Route */}
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <h3 className="text-sm font-medium text-slate-800 mb-3 flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs">
                                3
                            </span>
                            Vessel & Route
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                                    Vessel Name
                                </label>
                                <input
                                    type="text"
                                    value={formValues.vesselName}
                                    onChange={(e) => handleFieldChange('vesselName', e.target.value)}
                                    className="w-full rounded-lg border-2 border-input bg-white px-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                                    Voyage Number
                                </label>
                                <input
                                    type="text"
                                    value={formValues.voyageNumber}
                                    onChange={(e) => handleFieldChange('voyageNumber', e.target.value)}
                                    className="w-full rounded-lg border-2 border-input bg-white px-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                                    Port of Loading
                                </label>
                                <input
                                    type="text"
                                    value={formValues.portOfLoading}
                                    onChange={(e) => handleFieldChange('portOfLoading', e.target.value)}
                                    className="w-full rounded-lg border-2 border-input bg-white px-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                                    Port of Discharge
                                </label>
                                <input
                                    type="text"
                                    value={formValues.portOfDischarge}
                                    onChange={(e) => handleFieldChange('portOfDischarge', e.target.value)}
                                    className="w-full rounded-lg border-2 border-input bg-white px-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Schedule */}
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs">
                                4
                            </span>
                            Schedule
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                                    ETD
                                </label>
                                <input
                                    type="date"
                                    value={formValues.etd}
                                    onChange={(e) => handleFieldChange('etd', e.target.value)}
                                    className="w-full rounded-lg border-2 border-input bg-white px-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                                    ETA
                                </label>
                                <input
                                    type="date"
                                    value={formValues.eta}
                                    onChange={(e) => handleFieldChange('eta', e.target.value)}
                                    className="w-full rounded-lg border-2 border-input bg-white px-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                                    ATA
                                </label>
                                <input
                                    type="date"
                                    value={formValues.ata}
                                    onChange={(e) => handleFieldChange('ata', e.target.value)}
                                    className="w-full rounded-lg border-2 border-input bg-white px-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                                    Customs Clearance Date
                                </label>
                                <input
                                    type="date"
                                    value={formValues.customsClearanceDate}
                                    onChange={(e) => handleFieldChange('customsClearanceDate', e.target.value)}
                                    className="w-full rounded-lg border-2 border-input bg-white px-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                                    Delivery Date
                                </label>
                                <input
                                    type="date"
                                    value={formValues.deliveryDate}
                                    onChange={(e) => handleFieldChange('deliveryDate', e.target.value)}
                                    className="w-full rounded-lg border-2 border-input bg-white px-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 5: Cargo Details */}
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs">
                                5
                            </span>
                            Cargo Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                                    Commodity Description
                                </label>
                                <textarea
                                    value={formValues.commodityDescription}
                                    onChange={(e) => handleFieldChange('commodityDescription', e.target.value)}
                                    rows={2}
                                    className="w-full rounded-lg border-2 border-input bg-white px-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                                    HS Code
                                </label>
                                <input
                                    type="text"
                                    value={formValues.hsCode}
                                    onChange={(e) => handleFieldChange('hsCode', e.target.value)}
                                    className="w-full rounded-lg border-2 border-input bg-white px-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                                    Gross Weight (kg)
                                </label>
                                <input
                                    type="text"
                                    value={formValues.grossWeight}
                                    onChange={(e) => handleFieldChange('grossWeight', e.target.value)}
                                    className="w-full rounded-lg border-2 border-input bg-white px-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                                    Net Weight (kg)
                                </label>
                                <input
                                    type="text"
                                    value={formValues.netWeight}
                                    onChange={(e) => handleFieldChange('netWeight', e.target.value)}
                                    className="w-full rounded-lg border-2 border-input bg-white px-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                                    CBM
                                </label>
                                <input
                                    type="text"
                                    value={formValues.cbm}
                                    onChange={(e) => handleFieldChange('cbm', e.target.value)}
                                    className="w-full rounded-lg border-2 border-input bg-white px-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                                    Number of Packages
                                </label>
                                <input
                                    type="text"
                                    value={formValues.numberOfPackages}
                                    onChange={(e) => handleFieldChange('numberOfPackages', e.target.value)}
                                    className="w-full rounded-lg border-2 border-input bg-white px-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                                    Package Type
                                </label>
                                <select
                                    value={formValues.packageType}
                                    onChange={(e) => handleFieldChange('packageType', e.target.value)}
                                    className="w-full rounded-lg border-2 border-input bg-white px-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                >
                                    <option value="">Select Type</option>
                                    <option value="Cartons">Cartons</option>
                                    <option value="Pallets">Pallets</option>
                                    <option value="Crates">Crates</option>
                                    <option value="Drums">Drums</option>
                                    <option value="Bags">Bags</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Section 6: Financial */}
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs">
                                6
                            </span>
                            Financial Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                                    Invoice Number
                                </label>
                                <div className="mb-2">
                                    {invoiceLoading ? (
                                        <p className="text-[11px] text-slate-500">Loading invoices...</p>
                                    ) : customerInvoices.length > 0 ? (
                                        <select
                                            value={linkedInvoiceId}
                                            onChange={(e) => handleInvoiceSelect(e.target.value)}
                                            className="w-full rounded-lg border border-input bg-white px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 mb-2 cursor-pointer"
                                        >
                                            <option value="">Link existing invoice</option>
                                            {customerInvoices.map((invoice) => (
                                                <option key={invoice.id} value={invoice.id}>
                                                    {invoice.invoiceNumber} • {formatCurrencyValue(invoice.total, invoice.currency || 'USD')}
                                                </option>
                                            ))}
                                        </select>
                                    ) : formValues.customerId ? (
                                        <p className="text-[11px] text-slate-500">No invoices found for this customer.</p>
                                    ) : null}
                                </div>
                                <input
                                    type="text"
                                    value={formValues.invoiceNumber}
                                    onChange={(e) => handleFieldChange('invoiceNumber', e.target.value)}
                                    className="w-full rounded-lg border-2 border-input bg-white px-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                                    Currency
                                </label>
                                <select
                                    value={formValues.currency}
                                    onChange={(e) => handleFieldChange('currency', e.target.value)}
                                    className="w-full rounded-lg border-2 border-input bg-white px-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                >
                                    {getCurrencyOptions().map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                                    Freight Charges
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formValues.freightCharges}
                                    onChange={(e) => handleFieldChange('freightCharges', e.target.value)}
                                    className="w-full rounded-lg border-2 border-input bg-white px-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                                    Insurance Charges
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formValues.insuranceCharges}
                                    onChange={(e) => handleFieldChange('insuranceCharges', e.target.value)}
                                    className="w-full rounded-lg border-2 border-input bg-white px-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                                    Customs Duty
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formValues.customsDuty}
                                    onChange={(e) => handleFieldChange('customsDuty', e.target.value)}
                                    className="w-full rounded-lg border-2 border-input bg-white px-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                                    Other Charges
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formValues.otherCharges}
                                    onChange={(e) => handleFieldChange('otherCharges', e.target.value)}
                                    className="w-full rounded-lg border-2 border-input bg-white px-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                                    Logistic Charges (Company)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formValues.logisticCharges}
                                    onChange={(e) => handleFieldChange('logisticCharges', e.target.value)}
                                    className="w-full rounded-lg border-2 border-input bg-white px-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                                    Total Charges
                                </label>
                                <input
                                    type="text"
                                    value={formatCurrencyValue(parseFloat(formValues.totalCharges) || 0, formValues.currency)}
                                    readOnly
                                    className="w-full rounded-lg border-2 border-input bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 7: Notes */}
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs">
                                7
                            </span>
                            Additional Information
                        </h3>
                        <div className="grid grid-cols-1 gap-3 md:gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                                    Special Instructions
                                </label>
                                <textarea
                                    value={formValues.specialInstructions}
                                    onChange={(e) => handleFieldChange('specialInstructions', e.target.value)}
                                    rows={2}
                                    className="w-full rounded-lg border-2 border-input bg-white px-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                                    Remarks
                                </label>
                                <textarea
                                    value={formValues.remarks}
                                    onChange={(e) => handleFieldChange('remarks', e.target.value)}
                                    rows={2}
                                    className="w-full rounded-lg border-2 border-input bg-white px-4 py-2.5 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-center gap-3">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary-hover hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer transition-all duration-200"
                        >
                            {isSaving ? (
                                <>
                                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>{editMode ? 'Update' : 'Create'} Import Shipment</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Messages */}
                    {saveError && (
                        <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-4 py-2">
                            {saveError}
                        </p>
                    )}
                    {saveMessage && !saveError && (
                        <p className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2">
                            {saveMessage}
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}
