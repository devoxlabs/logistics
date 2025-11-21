'use client';

import React, { useState, useEffect } from 'react';
import {
    VendorProfile,
    VendorFormValues,
    emptyVendorForm,
} from '@/models/profiles';
import {
    listVendors,
    createVendor,
    updateVendor,
    deleteVendor,
} from '@/services/vendors';
import { DialogShell, BackButton } from '@/components/ui/SharedDialog';
import FeatureHeader from '@/components/ui/FeatureHeader';

type DialogMode = 'open' | 'edit' | 'delete' | null;
type DialogStep = 'list' | 'detail';

export default function VendorProfileFeature() {
    const [vendors, setVendors] = useState<VendorProfile[]>([]);
    const [formValues, setFormValues] = useState<VendorFormValues>(emptyVendorForm());
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Dialog state
    const [dialogMode, setDialogMode] = useState<DialogMode>(null);
    const [dialogStep, setDialogStep] = useState<DialogStep>('list');
    const [dialogSearch, setDialogSearch] = useState('');
    const [selectedDialogVendor, setSelectedDialogVendor] = useState<VendorProfile | null>(null);
    const [editValues, setEditValues] = useState<VendorProfile | null>(null);
    const [isEditingVendor, setIsEditingVendor] = useState(false);
    const [pendingDelete, setPendingDelete] = useState<VendorProfile | null>(null);

    useEffect(() => {
        loadVendors();
    }, []);

    const loadVendors = async () => {
        try {
            const data = await listVendors();
            setVendors(data);
        } catch (error) {
            console.error('Failed to load vendors', error);
        }
    };

    const handleFieldChange = (field: keyof VendorFormValues, value: string) => {
        setFormValues((prev) => ({ ...prev, [field]: value }));
        if (fieldErrors[field]) {
            setFieldErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};
        if (!formValues.vendorName.trim()) errors.vendorName = 'Vendor Name is required';
        if (!formValues.email1.trim()) errors.email = 'At least one email is required';
        if (!formValues.contact1.trim()) errors.contact = 'At least one contact number is required';

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSaving(true);
        setSaveError(null);
        setSaveMessage(null);

        try {
            await createVendor(formValues);
            setSaveMessage('Vendor created successfully!');
            setFormValues(emptyVendorForm());
            loadVendors();
        } catch (error) {
            console.error('Error creating vendor:', error);
            setSaveError('Failed to create vendor. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const openDialog = (mode: DialogMode) => {
        setDialogMode(mode);
        setDialogSearch('');
        setDialogStep('list');
        setSelectedDialogVendor(null);
        setEditValues(null);
    };

    const beginEditVendor = (v: VendorProfile) => {
        setSelectedDialogVendor(v);
        setEditValues({ ...v });
        setDialogStep('detail');
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editValues || !selectedDialogVendor) return;

        setIsEditingVendor(true);
        try {
            await updateVendor(selectedDialogVendor.id, editValues);
            setVendors((prev) =>
                prev.map((v) => (v.id === selectedDialogVendor.id ? editValues : v))
            );
            setDialogMode(null);
            setSelectedDialogVendor(null);
            setEditValues(null);
            setDialogStep('list');
        } catch (error) {
            console.error('Failed to update vendor', error);
            alert('Failed to update vendor');
        } finally {
            setIsEditingVendor(false);
        }
    };

    const performDeleteVendor = async (vendor: VendorProfile) => {
        try {
            await deleteVendor(vendor.id);
            setVendors((prev) => prev.filter((v) => v.id !== vendor.id));
            if (selectedDialogVendor?.id === vendor.id) {
                setSelectedDialogVendor(null);
                setDialogStep('list');
            }
        } catch (error) {
            console.error('Failed to delete vendor', error);
            alert('Failed to delete vendor');
        }
    };

    const filteredDialogVendors = vendors.filter((v) => {
        if (!dialogSearch) return true;
        const s = dialogSearch.toLowerCase();
        return (
            v.vendorName.toLowerCase().includes(s) ||
            v.city.toLowerCase().includes(s) ||
            v.type.toLowerCase().includes(s)
        );
    });

    const renderVendorDetails = (v: VendorProfile) => (
        <div className='space-y-3 text-xs md:text-sm'>
            <div>
                <h3 className='font-semibold text-slate-800 mb-1'>Basic Information</h3>
                <p><span className='font-medium'>Name: </span>{v.vendorName}</p>
                <p><span className='font-medium'>City: </span>{v.city}</p>
                <p><span className='font-medium'>Country: </span>{v.country}</p>
                <p><span className='font-medium'>Address: </span>{v.address}</p>
            </div>
            <div>
                <h3 className='font-semibold text-slate-800 mb-1'>Contact</h3>
                <p><span className='font-medium'>Email 1: </span>{v.email1}</p>
                <p><span className='font-medium'>Email 2: </span>{v.email2}</p>
                <p><span className='font-medium'>Email 3: </span>{v.email3}</p>
                <p><span className='font-medium'>Contact #1: </span>{v.contact1}</p>
                <p><span className='font-medium'>Contact #2: </span>{v.contact2}</p>
                <p><span className='font-medium'>Contact #3: </span>{v.contact3}</p>
            </div>
            <div>
                <h3 className='font-semibold text-slate-800 mb-1'>Type & Services</h3>
                <p><span className='font-medium'>Type: </span>{v.type}</p>
                <p><span className='font-medium'>Services: </span>{v.services}</p>
            </div>
            <div>
                <h3 className='font-semibold text-slate-800 mb-1'>Tax IDs</h3>
                <p><span className='font-medium'>NTN: </span>{v.ntnNumber}</p>
                <p><span className='font-medium'>GST: </span>{v.gstNumber}</p>
                <p><span className='font-medium'>SRB: </span>{v.srbNumber}</p>
            </div>
        </div>
    );

    return (
        <div className='h-full min-h-[60vh] md:min-h-full rounded-xl border border-slate-200 bg-white flex flex-col'>
            <FeatureHeader
                title="Vendor Profile"
                icon={
                    <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z' />
                    </svg>
                }
                actions={
                    <>
                        <button
                            type='button'
                            onClick={() => openDialog('open')}
                            className='flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 rounded-md bg-white border border-slate-200 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:text-primary hover:border-primary/30 hover:shadow-md active:scale-95 transition-all duration-200 cursor-pointer'
                        >
                            <svg className='h-3.5 w-3.5 md:h-4 md:w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                            </svg>
                            <span className='hidden md:inline'>Open Vendor</span>
                            <span className='md:hidden'>Open</span>
                        </button>
                        <button
                            type='button'
                            onClick={() => openDialog('edit')}
                            className='flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 rounded-md bg-white border border-slate-200 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 hover:shadow-md active:scale-95 transition-all duration-200 cursor-pointer'
                        >
                            <svg className='h-3.5 w-3.5 md:h-4 md:w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                            </svg>
                            <span className='hidden md:inline'>Edit Vendor</span>
                            <span className='md:hidden'>Edit</span>
                        </button>
                        <button
                            type='button'
                            onClick={() => openDialog('delete')}
                            className='flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 rounded-md bg-white border border-slate-200 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium text-slate-700 shadow-sm hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 hover:shadow-md active:scale-95 transition-all duration-200 cursor-pointer'
                        >
                            <svg className='h-3.5 w-3.5 md:h-4 md:w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                            </svg>
                            <span className='hidden md:inline'>Delete Vendor</span>
                            <span className='md:hidden'>Delete</span>
                        </button>
                    </>
                }
            />

            <div className='flex-1 overflow-y-auto p-3 md:p-4'>
                <div className='max-w-3xl mx-auto'>
                    <form onSubmit={handleSubmit} className='space-y-4 text-xs md:text-sm'>
                        <h3 className='font-semibold text-slate-800 mb-3'>Vendor Details</h3>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4'>
                            {/* Vendor Name */}
                            <div>
                                <label className='block text-sm font-medium text-foreground/80 mb-1.5'>Vendor Name</label>
                                <input
                                    type='text'
                                    value={formValues.vendorName}
                                    onChange={(e) => handleFieldChange('vendorName', e.target.value)}
                                    className='w-full rounded-lg border-2 border-input bg-muted/30 px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 hover:border-primary/40 hover:bg-muted/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200'
                                />
                                {fieldErrors.vendorName && <p className='mt-1 text-[11px] text-rose-600'>{fieldErrors.vendorName}</p>}
                            </div>

                            {/* City */}
                            <div>
                                <label className='block text-sm font-medium text-foreground/80 mb-1.5'>City</label>
                                <input
                                    type='text'
                                    value={formValues.city}
                                    onChange={(e) => handleFieldChange('city', e.target.value)}
                                    className='w-full rounded-lg border-2 border-input bg-muted/30 px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 hover:border-primary/40 hover:bg-muted/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200'
                                />
                            </div>

                            {/* Address */}
                            <div className='md:col-span-2'>
                                <label className='block text-sm font-medium text-foreground/80 mb-1.5'>Address</label>
                                <textarea
                                    value={formValues.address}
                                    onChange={(e) => handleFieldChange('address', e.target.value)}
                                    rows={2}
                                    className='w-full rounded-lg border-2 border-input bg-muted/30 px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 hover:border-primary/40 hover:bg-muted/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200'
                                />
                            </div>

                            {/* Country */}
                            <div>
                                <label className='block text-sm font-medium text-foreground/80 mb-1.5'>Country</label>
                                <input
                                    type='text'
                                    value={formValues.country}
                                    onChange={(e) => handleFieldChange('country', e.target.value)}
                                    className='w-full rounded-lg border-2 border-input bg-muted/30 px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 hover:border-primary/40 hover:bg-muted/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200'
                                />
                            </div>

                            {/* Emails */}
                            <div>
                                <label className='block text-sm font-medium text-foreground/80 mb-1.5'>Email 1</label>
                                <input
                                    type='email'
                                    value={formValues.email1}
                                    onChange={(e) => handleFieldChange('email1', e.target.value)}
                                    className='w-full rounded-lg border-2 border-input bg-muted/30 px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 hover:border-primary/40 hover:bg-muted/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200'
                                />
                                {fieldErrors.email && <p className='mt-1 text-[11px] text-rose-600'>{fieldErrors.email}</p>}
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-foreground/80 mb-1.5'>Email 2</label>
                                <input
                                    type='email'
                                    value={formValues.email2}
                                    onChange={(e) => handleFieldChange('email2', e.target.value)}
                                    className='w-full rounded-lg border-2 border-input bg-muted/30 px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 hover:border-primary/40 hover:bg-muted/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200'
                                />
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-foreground/80 mb-1.5'>Email 3</label>
                                <input
                                    type='email'
                                    value={formValues.email3}
                                    onChange={(e) => handleFieldChange('email3', e.target.value)}
                                    className='w-full rounded-lg border-2 border-input bg-muted/30 px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 hover:border-primary/40 hover:bg-muted/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200'
                                />
                            </div>

                            {/* Contacts */}
                            <div>
                                <label className='block text-sm font-medium text-foreground/80 mb-1.5'>Contact #1</label>
                                <input
                                    type='tel'
                                    value={formValues.contact1}
                                    onChange={(e) => handleFieldChange('contact1', e.target.value)}
                                    className='w-full rounded-lg border-2 border-input bg-muted/30 px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 hover:border-primary/40 hover:bg-muted/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200'
                                />
                                {fieldErrors.contact && <p className='mt-1 text-[11px] text-rose-600'>{fieldErrors.contact}</p>}
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-foreground/80 mb-1.5'>Contact #2</label>
                                <input
                                    type='tel'
                                    value={formValues.contact2}
                                    onChange={(e) => handleFieldChange('contact2', e.target.value)}
                                    className='w-full rounded-lg border-2 border-input bg-muted/30 px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 hover:border-primary/40 hover:bg-muted/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200'
                                />
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-foreground/80 mb-1.5'>Contact #3</label>
                                <input
                                    type='tel'
                                    value={formValues.contact3}
                                    onChange={(e) => handleFieldChange('contact3', e.target.value)}
                                    className='w-full rounded-lg border-2 border-input bg-muted/30 px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 hover:border-primary/40 hover:bg-muted/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200'
                                />
                            </div>

                            {/* Type & Services */}
                            <div>
                                <label className='block text-sm font-medium text-foreground/80 mb-1.5'>Type</label>
                                <select
                                    value={formValues.type}
                                    onChange={(e) => handleFieldChange('type', e.target.value)}
                                    className='w-full rounded-lg border-2 border-input bg-muted/30 px-4 py-2.5 text-sm hover:border-primary/40 hover:bg-muted/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200'
                                >
                                    <option value=''>Select type</option>
                                    <option value='Shipping Line'>Shipping Line</option>
                                    <option value='Transporter'>Transporter</option>
                                    <option value='Clearing Agent'>Clearing Agent</option>
                                </select>
                            </div>
                            <div className='md:col-span-2'>
                                <label className='block text-sm font-medium text-foreground/80 mb-1.5'>Services</label>
                                <textarea
                                    value={formValues.services}
                                    onChange={(e) => handleFieldChange('services', e.target.value)}
                                    rows={2}
                                    className='w-full rounded-lg border-2 border-input bg-muted/30 px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 hover:border-primary/40 hover:bg-muted/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200'
                                />
                            </div>

                            {/* IDs */}
                            <div>
                                <label className='block text-sm font-medium text-foreground/80 mb-1.5'>NTN Number</label>
                                <input
                                    type='text'
                                    value={formValues.ntnNumber}
                                    onChange={(e) => handleFieldChange('ntnNumber', e.target.value)}
                                    className='w-full rounded-lg border-2 border-input bg-muted/30 px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 hover:border-primary/40 hover:bg-muted/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200'
                                />
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-foreground/80 mb-1.5'>GST Number</label>
                                <input
                                    type='text'
                                    value={formValues.gstNumber}
                                    onChange={(e) => handleFieldChange('gstNumber', e.target.value)}
                                    className='w-full rounded-lg border-2 border-input bg-muted/30 px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 hover:border-primary/40 hover:bg-muted/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200'
                                />
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-foreground/80 mb-1.5'>SRB Number</label>
                                <input
                                    type='text'
                                    value={formValues.srbNumber}
                                    onChange={(e) => handleFieldChange('srbNumber', e.target.value)}
                                    className='w-full rounded-lg border-2 border-input bg-muted/30 px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 hover:border-primary/40 hover:bg-muted/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200'
                                />
                            </div>
                        </div>

                        <div className='mt-4'>
                            <button
                                type='submit'
                                disabled={isSaving}
                                className='inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary-hover hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer transition-all duration-200'
                            >
                                {isSaving ? (
                                    <>
                                        <span className='h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                                        </svg>
                                        <span>Save Vendor</span>
                                    </>
                                )}
                            </button>
                            {saveError && <p className='mt-2 text-[11px] text-rose-600'>{saveError}</p>}
                            {saveMessage && !saveError && <p className='mt-2 text-[11px] text-emerald-600'>{saveMessage}</p>}
                        </div>
                    </form>
                </div>
            </div>

            {/* Dialogs */}
            {dialogMode && (
                <DialogShell
                    title={`${dialogMode === 'open' ? 'Open' : dialogMode === 'edit' ? 'Edit' : 'Delete'} Vendor Profile`}
                    search={dialogSearch}
                    setSearch={setDialogSearch}
                    showSearch={dialogStep === 'list'}
                    onClose={() => {
                        setDialogMode(null);
                        setSelectedDialogVendor(null);
                        setEditValues(null);
                        setDialogStep('list');
                    }}
                >
                    {dialogStep === 'list' ? (
                        <VendorTable
                            vendors={filteredDialogVendors}
                            onSelect={(v) => {
                                if (dialogMode === 'open' || dialogMode === 'delete') {
                                    setSelectedDialogVendor(v);
                                    setDialogStep('detail');
                                } else if (dialogMode === 'edit') {
                                    beginEditVendor(v);
                                }
                            }}
                            onDeleteClick={dialogMode === 'delete' ? (v) => setPendingDelete(v) : undefined}
                        />
                    ) : (
                        selectedDialogVendor && (
                            <div className='max-w-3xl mx-auto'>
                                <BackButton onClick={() => {
                                    setDialogStep('list');
                                    setSelectedDialogVendor(null);
                                    setEditValues(null);
                                }} />
                                {dialogMode === 'edit' && editValues ? (
                                    <form onSubmit={handleEditSubmit} className='space-y-4 text-xs md:text-sm'>
                                        {/* Edit Vendor Form */}
                                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                            {/* Vendor Name */}
                                            <div>
                                                <label className='block text-sm font-medium text-foreground/80 mb-1.5'>Vendor Name</label>
                                                <input type='text' value={editValues.vendorName} onChange={(e) => setEditValues({ ...editValues, vendorName: e.target.value })} className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary' />
                                            </div>
                                            {/* City */}
                                            <div>
                                                <label className='block text-sm font-medium text-foreground/80 mb-1.5'>City</label>
                                                <input type='text' value={editValues.city} onChange={(e) => setEditValues({ ...editValues, city: e.target.value })} className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary' />
                                            </div>
                                            {/* Address */}
                                            <div className='md:col-span-2'>
                                                <label className='block text-sm font-medium text-foreground/80 mb-1.5'>Address</label>
                                                <textarea value={editValues.address} onChange={(e) => setEditValues({ ...editValues, address: e.target.value })} rows={2} className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary' />
                                            </div>
                                            {/* Country */}
                                            <div>
                                                <label className='block text-sm font-medium text-foreground/80 mb-1.5'>Country</label>
                                                <input type='text' value={editValues.country} onChange={(e) => setEditValues({ ...editValues, country: e.target.value })} className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary' />
                                            </div>
                                            {/* Emails */}
                                            <div>
                                                <label className='block text-sm font-medium text-foreground/80 mb-1.5'>Email 1</label>
                                                <input type='email' value={editValues.email1} onChange={(e) => setEditValues({ ...editValues, email1: e.target.value })} className='w-full rounded-lg border-2 border-input bg-muted/30 px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 hover:border-primary/40 hover:bg-muted/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200' />
                                            </div>
                                            <div>
                                                <label className='block text-sm font-medium text-foreground/80 mb-1.5'>Email 2</label>
                                                <input type='email' value={editValues.email2} onChange={(e) => setEditValues({ ...editValues, email2: e.target.value })} className='w-full rounded-lg border-2 border-input bg-muted/30 px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 hover:border-primary/40 hover:bg-muted/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200' />
                                            </div>
                                            <div>
                                                <label className='block text-sm font-medium text-foreground/80 mb-1.5'>Email 3</label>
                                                <input type='email' value={editValues.email3} onChange={(e) => setEditValues({ ...editValues, email3: e.target.value })} className='w-full rounded-lg border-2 border-input bg-muted/30 px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 hover:border-primary/40 hover:bg-muted/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200' />
                                            </div>
                                            {/* Contacts */}
                                            <div>
                                                <label className='block text-sm font-medium text-foreground/80 mb-1.5'>Contact #1</label>
                                                <input type='tel' value={editValues.contact1} onChange={(e) => setEditValues({ ...editValues, contact1: e.target.value })} className='w-full rounded-lg border-2 border-input bg-muted/30 px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 hover:border-primary/40 hover:bg-muted/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200' />
                                            </div>
                                            <div>
                                                <label className='block text-sm font-medium text-foreground/80 mb-1.5'>Contact #2</label>
                                                <input type='tel' value={editValues.contact2} onChange={(e) => setEditValues({ ...editValues, contact2: e.target.value })} className='w-full rounded-lg border-2 border-input bg-muted/30 px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 hover:border-primary/40 hover:bg-muted/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200' />
                                            </div>
                                            <div>
                                                <label className='block text-sm font-medium text-foreground/80 mb-1.5'>Contact #3</label>
                                                <input type='tel' value={editValues.contact3} onChange={(e) => setEditValues({ ...editValues, contact3: e.target.value })} className='w-full rounded-lg border-2 border-input bg-muted/30 px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 hover:border-primary/40 hover:bg-muted/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200' />
                                            </div>
                                            {/* Type & Services */}
                                            <div>
                                                <label className='block text-sm font-medium text-foreground/80 mb-1.5'>Type</label>
                                                <select value={editValues.type} onChange={(e) => setEditValues({ ...editValues, type: e.target.value })} className='w-full rounded-lg border-2 border-input bg-muted/30 px-4 py-2.5 text-sm hover:border-primary/40 hover:bg-muted/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200'>
                                                    <option value=''>Select type</option>
                                                    <option value='Shipping Line'>Shipping Line</option>
                                                    <option value='Transporter'>Transporter</option>
                                                    <option value='Clearing Agent'>Clearing Agent</option>
                                                </select>
                                            </div>
                                            <div className='md:col-span-2'>
                                                <label className='block text-sm font-medium text-foreground/80 mb-1.5'>Services</label>
                                                <textarea value={editValues.services} onChange={(e) => setEditValues({ ...editValues, services: e.target.value })} rows={2} className='w-full rounded-lg border-2 border-input bg-muted/30 px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 hover:border-primary/40 hover:bg-muted/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200' />
                                            </div>
                                            {/* IDs */}
                                            <div>
                                                <label className='block text-sm font-medium text-foreground/80 mb-1.5'>NTN Number</label>
                                                <input type='text' value={editValues.ntnNumber} onChange={(e) => setEditValues({ ...editValues, ntnNumber: e.target.value })} className='w-full rounded-lg border-2 border-input bg-muted/30 px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 hover:border-primary/40 hover:bg-muted/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200' />
                                            </div>
                                            <div>
                                                <label className='block text-sm font-medium text-foreground/80 mb-1.5'>GST Number</label>
                                                <input type='text' value={editValues.gstNumber} onChange={(e) => setEditValues({ ...editValues, gstNumber: e.target.value })} className='w-full rounded-lg border-2 border-input bg-muted/30 px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 hover:border-primary/40 hover:bg-muted/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200' />
                                            </div>
                                            <div>
                                                <label className='block text-sm font-medium text-foreground/80 mb-1.5'>SRB Number</label>
                                                <input type='text' value={editValues.srbNumber} onChange={(e) => setEditValues({ ...editValues, srbNumber: e.target.value })} className='w-full rounded-lg border-2 border-input bg-muted/30 px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 hover:border-primary/40 hover:bg-muted/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200' />
                                            </div>
                                        </div>

                                        <div className='mt-4 flex justify-end gap-2'>
                                            <button type='button' onClick={() => { setDialogMode(null); setSelectedDialogVendor(null); setEditValues(null); setDialogStep('list'); }} className='inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer'>Cancel</button>
                                            <button
                                                type='submit'
                                                disabled={isEditingVendor}
                                                className='inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary-hover hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer transition-all duration-200'
                                            >
                                                {isEditingVendor ? (
                                                    <>
                                                        <span className='h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                                                        <span>Saving...</span>
                                                    </>
                                                ) : (
                                                    'Save Changes'
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <>
                                        {renderVendorDetails(selectedDialogVendor)}
                                        {dialogMode === 'delete' && (
                                            <div className='mt-6 flex justify-end border-t border-slate-100 pt-4'>
                                                <button
                                                    type='button'
                                                    onClick={() => setPendingDelete(selectedDialogVendor)}
                                                    className='group inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer'
                                                >
                                                    <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                                                    </svg>
                                                    Delete this Vendor
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )
                    )}
                </DialogShell>
            )}

            {/* Delete Confirmation */}
            {pendingDelete && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 px-4'>
                    <div className='w-full max-w-sm rounded-xl bg-white shadow-2xl border border-slate-200 p-6 space-y-4 text-xs md:text-sm animate-in zoom-in-95 duration-200'>
                        <div className="flex flex-col items-center text-center gap-2">
                            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
                                <svg className="h-6 w-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className='font-semibold text-lg text-slate-900'>Confirm Deletion</h3>
                            <p className='text-slate-600'>Are you sure you want to delete vendor <span className='font-medium text-foreground'>{pendingDelete.vendorName}</span>? This action cannot be undone.</p>
                        </div>
                        <div className='flex justify-end gap-3 pt-2'>
                            <button type='button' onClick={() => setPendingDelete(null)} className='flex-1 inline-flex justify-center items-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all duration-200 cursor-pointer'>Cancel</button>
                            <button type='button' onClick={() => { performDeleteVendor(pendingDelete); setPendingDelete(null); }} className='group flex-1 inline-flex justify-center items-center gap-2 rounded-lg bg-destructive px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-destructive/90 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-destructive/20 transition-all duration-200 cursor-pointer'>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function VendorTable(props: {
    vendors: VendorProfile[];
    onSelect: (v: VendorProfile) => void;
    onDeleteClick?: (v: VendorProfile) => void;
}) {
    const { vendors, onSelect, onDeleteClick } = props;
    return (
        <table className='min-w-full text-xs md:text-sm'>
            <thead>
                <tr className='border-b border-slate-100 bg-slate-50 text-[11px] md:text-xs text-slate-500'>
                    <th className='px-3 py-2 text-left font-medium'>Vendor Name</th>
                    <th className='px-3 py-2 text-left font-medium'>City</th>
                    <th className='px-3 py-2 text-left font-medium'>Country</th>
                    {onDeleteClick && <th className='px-3 py-2 text-right font-medium'>Actions</th>}
                </tr>
            </thead>
            <tbody>
                {vendors.map((v) => (
                    <tr key={v.id} className='border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer'>
                        <td className='px-3 py-2' onClick={() => onSelect(v)}>{v.vendorName || '-'}</td>
                        <td className='px-3 py-2' onClick={() => onSelect(v)}>{v.city || '-'}</td>
                        <td className='px-3 py-2' onClick={() => onSelect(v)}>{v.country || '-'}</td>
                        {onDeleteClick && (
                            <td className='px-3 py-2 text-right'>
                                <button type='button' onClick={(e) => { e.stopPropagation(); onDeleteClick(v); }} className='group inline-flex items-center gap-1.5 rounded-md border border-destructive/20 bg-destructive/5 px-2.5 py-1.5 text-[11px] font-medium text-destructive transition-all duration-200 hover:bg-destructive/10 hover:shadow-md hover:-translate-y-0.5 cursor-pointer'>
                                    Delete
                                </button>
                            </td>
                        )}
                    </tr>
                ))}
                {vendors.length === 0 && (
                    <tr>
                        <td colSpan={onDeleteClick ? 4 : 3} className='px-3 py-4 text-center text-[11px] text-slate-400'>No vendors found.</td>
                    </tr>
                )}
            </tbody>
        </table>
    );
}
