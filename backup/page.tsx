'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Menu } from 'lucide-react';
import {
  Consignee,
  CustomerFormValues,
  CustomerProfile,
  VendorFormValues,
  VendorProfile,
  emptyCustomerForm,
  emptyVendorForm,
} from '@/models/profiles';
import {
  listCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '@/services/customers';
import {
  listVendors,
  createVendor,
  updateVendor,
  deleteVendor,
} from '@/services/vendors';

type DialogMode = 'open' | 'edit' | 'delete' | null;
type DialogStep = 'list' | 'detail';

const TAB_TITLES: Record<string, string> = {
  'customer-profile': 'Customer Profile',
  'vendor-profile': 'Vendor Profile',
  'client-profile': 'Client Profile',
  'import-shipment-form': 'Import Shipment Form',
  'export-shipment-form': 'Export Shipment Form',
  'import-shipment-detail-report': 'Import Shipment Detail Report',
  'export-shipment-detail-report': 'Export Shipment Detail Report',
  'customer-group-ledger': 'Customer Group Ledger',
  invoice: 'Invoice',
  billing: 'Billing',
  'customer-ledger': 'Customer Ledger',
  'vendor-ledger': 'Vendor Ledger',
  'general-ledger': 'General Ledger',
  'profit-and-loss': 'Profit & Loss',
  'balance-sheet': 'Balance Sheet',
};

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('customer-profile');

  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [formValues, setFormValues] = useState<CustomerFormValues>(emptyCustomerForm);
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [vendorFormValues, setVendorFormValues] =
    useState<VendorFormValues>(emptyVendorForm);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    customerName?: string;
    email?: string;
    contact?: string;
  }>({});
  const [vendorIsSaving, setVendorIsSaving] = useState(false);
  const [vendorSaveError, setVendorSaveError] = useState<string | null>(null);
  const [vendorSaveMessage, setVendorSaveMessage] = useState<string | null>(null);
  const [vendorFieldErrors, setVendorFieldErrors] = useState<{
    vendorName?: string;
    email?: string;
    contact?: string;
  }>({});

  // Customer dialogs
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [dialogSearch, setDialogSearch] = useState('');
  const [dialogStep, setDialogStep] = useState<DialogStep>('list');
  const [selectedDialogCustomer, setSelectedDialogCustomer] =
    useState<CustomerProfile | null>(null);
  const [editValues, setEditValues] = useState<CustomerFormValues | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CustomerProfile | null>(null);
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);

  // Vendor dialogs
  const [vendorDialogMode, setVendorDialogMode] = useState<DialogMode>(null);
  const [vendorDialogSearch, setVendorDialogSearch] = useState('');
  const [vendorDialogStep, setVendorDialogStep] = useState<DialogStep>('list');
  const [selectedDialogVendor, setSelectedDialogVendor] =
    useState<VendorProfile | null>(null);
  const [editVendorValues, setEditVendorValues] =
    useState<VendorFormValues | null>(null);
  const [pendingVendorDelete, setPendingVendorDelete] =
    useState<VendorProfile | null>(null);
  const [isEditingVendor, setIsEditingVendor] = useState(false);

  const handleCustomerFieldChange = (
    field: keyof CustomerFormValues,
    value: string,
  ) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleConsigneeChange = (
    index: number,
    field: keyof Consignee,
    value: string,
  ) => {
    setFormValues((prev) => ({
      ...prev,
      consignees: prev.consignees.map((c, i) =>
        i === index ? { ...c, [field]: value } : c,
      ),
    }));
  };

  const handleVendorFieldChange = (
    field: keyof VendorFormValues,
    value: string,
  ) => {
    setVendorFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleCustomerSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaveError(null);
    setSaveMessage(null);
    setFieldErrors({});

    const emails = [formValues.email1, formValues.email2, formValues.email3];
    const contacts = [formValues.contact1, formValues.contact2, formValues.contact3];
    const hasEmail = emails.some((v) => v.trim().length > 0);
    const hasContact = contacts.some((v) => v.trim().length > 0);

    const errors: typeof fieldErrors = {};
    if (!formValues.customerName.trim()) errors.customerName = 'Customer name is required.';
    if (!hasEmail) errors.email = 'At least one email is required.';
    if (!hasContact) errors.contact = 'At least one contact number is required.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setIsSaving(true);
      const newCustomer = await createCustomer(formValues);
      setCustomers((prev) => [...prev, newCustomer]);
      setFormValues(emptyCustomerForm());
      setSaveMessage('Customer saved successfully.');
    } catch (error) {
      console.error('Failed to save customer', error);
      setSaveError('Failed to save customer. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleVendorSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setVendorSaveError(null);
    setVendorSaveMessage(null);
    setVendorFieldErrors({});

    const emails = [
      vendorFormValues.email1,
      vendorFormValues.email2,
      vendorFormValues.email3,
    ];
    const contacts = [
      vendorFormValues.contact1,
      vendorFormValues.contact2,
      vendorFormValues.contact3,
    ];
    const hasEmail = emails.some((v) => v.trim().length > 0);
    const hasContact = contacts.some((v) => v.trim().length > 0);

    const errors: typeof vendorFieldErrors = {};
    if (!vendorFormValues.vendorName.trim()) {
      errors.vendorName = 'Vendor name is required.';
    }
    if (!hasEmail) errors.email = 'At least one email is required.';
    if (!hasContact) errors.contact = 'At least one contact number is required.';

    if (Object.keys(errors).length > 0) {
      setVendorFieldErrors(errors);
      return;
    }

    try {
      setVendorIsSaving(true);
      const newVendor = await createVendor(vendorFormValues);
      setVendors((prev) => [...prev, newVendor]);
      setVendorFormValues(emptyVendorForm());
      setVendorSaveMessage('Vendor saved successfully.');
    } catch (error) {
      console.error('Failed to save vendor', error);
      setVendorSaveError('Failed to save vendor. Please try again.');
    } finally {
      setVendorIsSaving(false);
    }
  };

  const performDeleteVendor = async (vendor: VendorProfile) => {
    try {
      await deleteVendor(vendor.id);
      setVendors((prev) => prev.filter((v) => v.id !== vendor.id));
      if (selectedDialogVendor?.id === vendor.id) {
        setSelectedDialogVendor(null);
        setVendorDialogStep('list');
      }
    } catch (error) {
      console.error('Failed to delete vendor', error);
    }
  };

  // Lock body scroll when any dialog/overlay is open
  const anyOverlayOpen =
    dialogMode !== null ||
    vendorDialogMode !== null ||
    pendingDelete !== null ||
    pendingVendorDelete !== null;

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (anyOverlayOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
    document.body.style.overflow = '';
  }, [anyOverlayOpen]);

  useEffect(() => {
    const load = async () => {
      try {
        const items = await listCustomers();
        setCustomers(items);

        const vendorItems = await listVendors();
        setVendors(vendorItems);
      } catch (error) {
        console.error('Failed to load customers', error);
      }
    };
    load();
  }, []);

  const filteredDialogCustomers = customers.filter((c) => {
    const q = dialogSearch.trim().toLowerCase();
    if (!q) return true;
    const haystack = [
      c.customerName,
      c.address,
      c.city,
      c.country,
      c.email1,
      c.email2,
      c.email3,
      c.contact1,
      c.contact2,
      c.contact3,
      c.mainCommodity,
      c.otherCommodity,
      c.ntnNumber,
      c.gstNumber,
      c.srbNumber,
      ...c.consignees.flatMap((cg) => [cg.name, cg.tradeLicense]),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });

  const filteredDialogVendors = vendors.filter((v) => {
    const q = vendorDialogSearch.trim().toLowerCase();
    if (!q) return true;
    const haystack = [
      v.vendorName,
      v.address,
      v.city,
      v.country,
      v.email1,
      v.email2,
      v.email3,
      v.contact1,
      v.contact2,
      v.contact3,
      v.type,
      v.services,
      v.ntnNumber,
      v.gstNumber,
      v.srbNumber,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });

  const openDialog = (mode: DialogMode) => {
    setDialogMode(mode);
    setDialogSearch('');
    setDialogStep('list');
    setSelectedDialogCustomer(null);
    setEditValues(null);
  };

  const beginEditCustomer = (customer: CustomerProfile) => {
    setSelectedDialogCustomer(customer);
    const { id: _id, createdAt: _createdAt, ...rest } = customer;
    void _id;
    void _createdAt;
    setEditValues({ ...rest });
    setDialogStep('detail');
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedDialogCustomer || !editValues) return;
    try {
      setIsEditingCustomer(true);
      await updateCustomer(selectedDialogCustomer.id, editValues);
      setCustomers((prev) =>
        prev.map((c) => (c.id === selectedDialogCustomer.id ? { ...c, ...editValues } : c)),
      );
    } catch (error) {
      console.error('Failed to update customer', error);
    } finally {
      setIsEditingCustomer(false);
    }
  };

  const openVendorDialog = (mode: DialogMode) => {
    setVendorDialogMode(mode);
    setVendorDialogSearch('');
    setVendorDialogStep('list');
    setSelectedDialogVendor(null);
    setEditVendorValues(null);
  };

  const beginEditVendor = (vendor: VendorProfile) => {
    setSelectedDialogVendor(vendor);
    const { id: _id, createdAt: _createdAt, ...rest } = vendor;
    void _id;
    void _createdAt;
    setEditVendorValues({ ...rest });
    setVendorDialogStep('detail');
  };

  const handleVendorEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedDialogVendor || !editVendorValues) return;
    try {
      setIsEditingVendor(true);
      await updateVendor(selectedDialogVendor.id, editVendorValues);
      setVendors((prev) =>
        prev.map((v) =>
          v.id === selectedDialogVendor.id ? { ...v, ...editVendorValues } : v,
        ),
      );
    } catch (error) {
      console.error('Failed to update vendor', error);
    } finally {
      setIsEditingVendor(false);
    }
  };

  const performDeleteCustomer = async (customer: CustomerProfile) => {
    try {
      await deleteCustomer(customer.id);
      setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
      if (selectedDialogCustomer?.id === customer.id) {
        setSelectedDialogCustomer(null);
        setDialogStep('list');
      }
    } catch (error) {
      console.error('Failed to delete customer', error);
    }
  };

  const renderCustomerDetails = (c: CustomerProfile) => (
    <div className='space-y-3 text-xs md:text-sm'>
      <div>
        <h3 className='font-semibold text-slate-800 mb-1'>Basic Information</h3>
        <p><span className='font-medium'>Name: </span>{c.customerName || '-'}</p>
        <p><span className='font-medium'>City: </span>{c.city || '-'}</p>
        <p><span className='font-medium'>Country: </span>{c.country || '-'}</p>
        <p><span className='font-medium'>Address: </span>{c.address || '-'}</p>
      </div>
      <div>
        <h3 className='font-semibold text-slate-800 mb-1'>Contact</h3>
        <p><span className='font-medium'>Email 1: </span>{c.email1 || '-'}</p>
        <p><span className='font-medium'>Email 2: </span>{c.email2 || '-'}</p>
        <p><span className='font-medium'>Email 3: </span>{c.email3 || '-'}</p>
        <p><span className='font-medium'>Contact #1: </span>{c.contact1 || '-'}</p>
        <p><span className='font-medium'>Contact #2: </span>{c.contact2 || '-'}</p>
        <p><span className='font-medium'>Contact #3: </span>{c.contact3 || '-'}</p>
      </div>
      <div>
        <h3 className='font-semibold text-slate-800 mb-1'>Commodities</h3>
        <p><span className='font-medium'>Main: </span>{c.mainCommodity || '-'}</p>
        <p><span className='font-medium'>Other: </span>{c.otherCommodity || '-'}</p>
      </div>
      <div>
        <h3 className='font-semibold text-slate-800 mb-1'>Tax IDs</h3>
        <p><span className='font-medium'>NTN: </span>{c.ntnNumber || '-'}</p>
        <p><span className='font-medium'>GST: </span>{c.gstNumber || '-'}</p>
        <p><span className='font-medium'>SRB: </span>{c.srbNumber || '-'}</p>
      </div>
      <div>
        <h3 className='font-semibold text-slate-800 mb-1'>Consignees</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
          {c.consignees.map((cg, i) => (
            <div key={i} className='rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5'>
              <p className='text-[11px] font-medium text-slate-700'>Consignee {i + 1}</p>
              <p className='text-[11px]'><span className='font-medium'>Name: </span>{cg.name || '-'}</p>
              <p className='text-[11px]'><span className='font-medium'>Trade License: </span>{cg.tradeLicense || '-'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className='min-h-screen flex bg-[#f5f7fb]'>
      {/* Desktop sidebar */}
      <div className='hidden md:block'>
        <Sidebar variant='desktop' selectedId={selectedId} onSelect={setSelectedId} />
      </div>

      {/* Main content */}
      <main className='flex-1 flex flex-col'>
        {/* Mobile top bar */}
        <div className='md:hidden flex items-center px-4 py-3 border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-20'>
          <button
            type='button'
            onClick={() => setMobileOpen(true)}
            className='inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm cursor-pointer transition-transform duration-200 active:scale-95'
            aria-label='Open menu'
          >
            <Menu className='h-4 w-4 transition-all duration-200' />
          </button>
        </div>

        <div className='flex-1 p-4 md:p-8'>
          {selectedId === 'customer-profile' ? (
            <div className='h-full min-h-[60vh] md:min-h-full rounded-xl border border-slate-200 bg-white flex flex-col'>
              <div className='flex items-center justify-between border-b border-slate-100 px-4 py-3'>
                <h1 className='text-sm md:text-base font-semibold text-slate-900'>
                  Customer Profile
                </h1>
                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    onClick={() => openDialog('open')}
                    className='rounded-md border border-[#d4e3ff] bg-[#f5f8ff] px-3 py-1.5 text-[11px] font-medium text-[#214fbb] hover:bg-[#e7f0ff] cursor-pointer'
                  >
                    Open
                  </button>
                  <button
                    type='button'
                    onClick={() => openDialog('edit')}
                    className='rounded-md border border-[#d4e3ff] bg-[#f5f8ff] px-3 py-1.5 text-[11px] font-medium text-[#214fbb] hover:bg-[#e7f0ff] cursor-pointer'
                  >
                    Edit
                  </button>
                  <button
                    type='button'
                    onClick={() => openDialog('delete')}
                    className='rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-medium text-rose-700 hover:bg-rose-100 cursor-pointer'
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Main form only */}
              <div className='flex-1 overflow-auto px-4 py-3'>
                <div className='w-full max-w-3xl mx-auto'>
                  <form onSubmit={handleCustomerSubmit} className='space-y-4'>
                    <h2 className='text-xs font-semibold text-slate-800 mb-1'>
                      Customer Details
                    </h2>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      {/* Customer Name */}
                      <div>
                        <label className='block text-xs font-medium text-slate-700 mb-1'>
                          Customer Name
                        </label>
                        <input
                          type='text'
                          value={formValues.customerName}
                          onChange={(e) =>
                            handleCustomerFieldChange('customerName', e.target.value)
                          }
                          className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                        />
                        {fieldErrors.customerName && (
                          <p className='mt-1 text-[11px] text-rose-600'>
                            {fieldErrors.customerName}
                          </p>
                        )}
                      </div>

                      {/* City */}
                      <div>
                        <label className='block text-xs font-medium text-slate-700 mb-1'>
                          City
                        </label>
                        <input
                          type='text'
                          value={formValues.city}
                          onChange={(e) =>
                            handleCustomerFieldChange('city', e.target.value)
                          }
                          className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                        />
                      </div>

                      {/* Address */}
                      <div className='md:col-span-2'>
                        <label className='block text-xs font-medium text-slate-700 mb-1'>
                          Address
                        </label>
                        <textarea
                          value={formValues.address}
                          onChange={(e) =>
                            handleCustomerFieldChange('address', e.target.value)
                          }
                          rows={2}
                          className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                        />
                      </div>

                      {/* Country */}
                      <div>
                        <label className='block text-xs font-medium text-slate-700 mb-1'>
                          Country
                        </label>
                        <input
                          type='text'
                          value={formValues.country}
                          onChange={(e) =>
                            handleCustomerFieldChange('country', e.target.value)
                          }
                          className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                        />
                      </div>

                      {/* Main / Other Commodities */}
                      <div>
                        <label className='block text-xs font-medium text-slate-700 mb-1'>
                          Main Commodity
                        </label>
                        <input
                          type='text'
                          value={formValues.mainCommodity}
                          onChange={(e) =>
                            handleCustomerFieldChange('mainCommodity', e.target.value)
                          }
                          className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                        />
                      </div>

                      <div className='md:col-span-2'>
                        <label className='block text-xs font-medium text-slate-700 mb-1'>
                          Other Commodity
                        </label>
                        <input
                          type='text'
                          value={formValues.otherCommodity}
                          onChange={(e) =>
                            handleCustomerFieldChange('otherCommodity', e.target.value)
                          }
                          className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                        />
                      </div>

                      {/* Emails */}
                      <div>
                        <label className='block text-xs font-medium text-slate-700 mb-1'>
                          Email 1
                        </label>
                        <input
                          type='email'
                          value={formValues.email1}
                          onChange={(e) =>
                            handleCustomerFieldChange('email1', e.target.value)
                          }
                          className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                        />
                        {fieldErrors.email && (
                          <p className='mt-1 text-[11px] text-rose-600'>
                            {fieldErrors.email}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className='block text-xs font-medium text-slate-700 mb-1'>
                          Email 2
                        </label>
                        <input
                          type='email'
                          value={formValues.email2}
                          onChange={(e) =>
                            handleCustomerFieldChange('email2', e.target.value)
                          }
                          className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                        />
                      </div>

                      <div>
                        <label className='block text-xs font-medium text-slate-700 mb-1'>
                          Email 3
                        </label>
                        <input
                          type='email'
                          value={formValues.email3}
                          onChange={(e) =>
                            handleCustomerFieldChange('email3', e.target.value)
                          }
                          className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                        />
                      </div>

                      {/* Contacts */}
                      <div>
                        <label className='block text-xs font-medium text-slate-700 mb-1'>
                          Contact #1
                        </label>
                        <input
                          type='tel'
                          value={formValues.contact1}
                          onChange={(e) =>
                            handleCustomerFieldChange('contact1', e.target.value)
                          }
                          className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                        />
                        {fieldErrors.contact && (
                          <p className='mt-1 text-[11px] text-rose-600'>
                            {fieldErrors.contact}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className='block text-xs font-medium text-slate-700 mb-1'>
                          Contact #2
                        </label>
                        <input
                          type='tel'
                          value={formValues.contact2}
                          onChange={(e) =>
                            handleCustomerFieldChange('contact2', e.target.value)
                          }
                          className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                        />
                      </div>

                      <div>
                        <label className='block text-xs font-medium text-slate-700 mb-1'>
                          Contact #3
                        </label>
                        <input
                          type='tel'
                          value={formValues.contact3}
                          onChange={(e) =>
                            handleCustomerFieldChange('contact3', e.target.value)
                          }
                          className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                        />
                      </div>

                      {/* IDs */}
                      <div>
                        <label className='block text-xs font-medium text-slate-700 mb-1'>
                          NTN Number
                        </label>
                        <input
                          type='text'
                          value={formValues.ntnNumber}
                          onChange={(e) =>
                            handleCustomerFieldChange('ntnNumber', e.target.value)
                          }
                          className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                        />
                      </div>

                      <div>
                        <label className='block text-xs font-medium text-slate-700 mb-1'>
                          GST Number
                        </label>
                        <input
                          type='text'
                          value={formValues.gstNumber}
                          onChange={(e) =>
                            handleCustomerFieldChange('gstNumber', e.target.value)
                          }
                          className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                        />
                      </div>

                      <div>
                        <label className='block text-xs font-medium text-slate-700 mb-1'>
                          SRB Number
                        </label>
                        <input
                          type='text'
                          value={formValues.srbNumber}
                          onChange={(e) =>
                            handleCustomerFieldChange('srbNumber', e.target.value)
                          }
                          className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                        />
                      </div>
                    </div>

                    <div className='mt-4'>
                      <h3 className='text-xs font-semibold text-slate-800 mb-2'>
                        Consignees &amp; Trade Licenses
                      </h3>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                        {formValues.consignees.map((c, index) => (
                          <div
                            key={index}
                            className='rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 space-y-2'
                          >
                            <p className='text-[11px] font-medium text-slate-600'>
                              Consignee {index + 1}
                            </p>
                            <div>
                              <label className='block text-[11px] text-slate-600 mb-1'>
                                Name
                              </label>
                              <input
                                type='text'
                                value={c.name}
                                onChange={(e) =>
                                  handleConsigneeChange(index, 'name', e.target.value)
                                }
                                className='w-full rounded-md border border-slate-200 px-2 py-1.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-[#6495ed] focus:border-[#6495ed]'
                              />
                            </div>
                            <div>
                              <label className='block text-[11px] text-slate-600 mb-1'>
                                Trade License #
                              </label>
                              <input
                                type='text'
                                value={c.tradeLicense}
                                onChange={(e) =>
                                  handleConsigneeChange(
                                    index,
                                    'tradeLicense',
                                    e.target.value,
                                  )
                                }
                                className='w-full rounded-md border border-slate-200 px-2 py-1.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-[#6495ed] focus:border-[#6495ed]'
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className='mt-4'>
                      <button
                        type='submit'
                        disabled={isSaving}
                        className='inline-flex w-full items-center justify-center rounded-md bg-[#34a85a] px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-[#2c8a4e] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer'
                      >
                      {isSaving ? (
                        <span className='inline-flex items-center gap-2'>
                          <span className='h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin' />
                          <span>Saving...</span>
                        </span>
                      ) : (
                        'Save Customer'
                      )}
                      </button>
                      {saveError && (
                        <p className='mt-2 text-[11px] text-rose-600'>{saveError}</p>
                      )}
                      {saveMessage && !saveError && (
                        <p className='mt-2 text-[11px] text-emerald-600'>
                          {saveMessage}
                        </p>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            </div>
          ) : selectedId === 'vendor-profile' ? (
            <div className='h-full min-h-[60vh] md:min-h-full rounded-xl border border-slate-200 bg-white flex flex-col'>
              <div className='flex items-center justify-between border-b border-slate-100 px-4 py-3'>
                <h1 className='text-sm md:text-base font-semibold text-slate-900'>
                  Vendor Profile
                </h1>
                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    onClick={() => openVendorDialog('open')}
                    className='rounded-md border border-[#d4e3ff] bg-[#f5f8ff] px-3 py-1.5 text-[11px] font-medium text-[#214fbb] hover:bg-[#e7f0ff] cursor-pointer'
                  >
                    Open
                  </button>
                  <button
                    type='button'
                    onClick={() => openVendorDialog('edit')}
                    className='rounded-md border border-[#d4e3ff] bg-[#f5f8ff] px-3 py-1.5 text-[11px] font-medium text-[#214fbb] hover:bg-[#e7f0ff] cursor-pointer'
                  >
                    Edit
                  </button>
                  <button
                    type='button'
                    onClick={() => openVendorDialog('delete')}
                    className='rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-medium text-rose-700 hover:bg-rose-100 cursor-pointer'
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className='flex-1 overflow-auto px-4 py-3'>
                <div className='w-full max-w-3xl mx-auto'>
                  <form onSubmit={handleVendorSubmit} className='space-y-4'>
                    <h2 className='text-xs font-semibold text-slate-800 mb-1'>
                      Vendor Details
                    </h2>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      {/* Vendor Name */}
                      <div>
                        <label className='block text-xs font-medium text-slate-700 mb-1'>
                          Vendor Name
                        </label>
                        <input
                          type='text'
                          value={vendorFormValues.vendorName}
                          onChange={(e) =>
                            handleVendorFieldChange('vendorName', e.target.value)
                          }
                          className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                        />
                        {vendorFieldErrors.vendorName && (
                          <p className='mt-1 text-[11px] text-rose-600'>
                            {vendorFieldErrors.vendorName}
                          </p>
                        )}
                      </div>

                      {/* City */}
                      <div>
                        <label className='block text-xs font-medium text-slate-700 mb-1'>
                          City
                        </label>
                        <input
                          type='text'
                          value={vendorFormValues.city}
                          onChange={(e) =>
                            handleVendorFieldChange('city', e.target.value)
                          }
                          className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                        />
                      </div>

                      {/* Address */}
                      <div className='md:col-span-2'>
                        <label className='block text-xs font-medium text-slate-700 mb-1'>
                          Address
                        </label>
                        <textarea
                          value={vendorFormValues.address}
                          onChange={(e) =>
                            handleVendorFieldChange('address', e.target.value)
                          }
                          rows={2}
                          className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                        />
                      </div>

                      {/* Country */}
                      <div>
                        <label className='block text-xs font-medium text-slate-700 mb-1'>
                          Country
                        </label>
                        <input
                          type='text'
                          value={vendorFormValues.country}
                          onChange={(e) =>
                            handleVendorFieldChange('country', e.target.value)
                          }
                          className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                        />
                      </div>

                      {/* Emails */}
                      <div>
                        <label className='block text-xs font-medium text-slate-700 mb-1'>
                          Email 1
                        </label>
                        <input
                          type='email'
                          value={vendorFormValues.email1}
                          onChange={(e) =>
                            handleVendorFieldChange('email1', e.target.value)
                          }
                          className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                        />
                        {vendorFieldErrors.email && (
                          <p className='mt-1 text-[11px] text-rose-600'>
                            {vendorFieldErrors.email}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className='block text-xs font-medium text-slate-700 mb-1'>
                          Email 2
                        </label>
                        <input
                          type='email'
                          value={vendorFormValues.email2}
                          onChange={(e) =>
                            handleVendorFieldChange('email2', e.target.value)
                          }
                          className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                        />
                      </div>
                      <div>
                        <label className='block text-xs font-medium text-slate-700 mb-1'>
                          Email 3
                        </label>
                        <input
                          type='email'
                          value={vendorFormValues.email3}
                          onChange={(e) =>
                            handleVendorFieldChange('email3', e.target.value)
                          }
                          className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                        />
                      </div>

                      {/* Contacts */}
                      <div>
                        <label className='block text-xs font-medium text-slate-700 mb-1'>
                          Contact #1
                        </label>
                        <input
                          type='tel'
                          value={vendorFormValues.contact1}
                          onChange={(e) =>
                            handleVendorFieldChange('contact1', e.target.value)
                          }
                          className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                        />
                        {vendorFieldErrors.contact && (
                          <p className='mt-1 text-[11px] text-rose-600'>
                            {vendorFieldErrors.contact}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className='block text-xs font-medium text-slate-700 mb-1'>
                          Contact #2
                        </label>
                        <input
                          type='tel'
                          value={vendorFormValues.contact2}
                          onChange={(e) =>
                            handleVendorFieldChange('contact2', e.target.value)
                          }
                          className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                        />
                      </div>
                      <div>
                        <label className='block text-xs font-medium text-slate-700 mb-1'>
                          Contact #3
                        </label>
                        <input
                          type='tel'
                          value={vendorFormValues.contact3}
                          onChange={(e) =>
                            handleVendorFieldChange('contact3', e.target.value)
                          }
                          className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                        />
                      </div>

                      {/* Type & Services */}
                      <div>
                      <label className='block text-xs font-medium text-slate-700 mb-1'>
                        Type
                      </label>
                      <select
                        value={vendorFormValues.type}
                        onChange={(e) =>
                          handleVendorFieldChange('type', e.target.value)
                        }
                        className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                      >
                        <option value=''>Select type</option>
                        <option value='Shipping Line'>Shipping Line</option>
                        <option value='Transporter'>Transporter</option>
                        <option value='Clearing Agent'>Clearing Agent</option>
                      </select>
                      </div>
                      <div className='md:col-span-2'>
                        <label className='block text-xs font-medium text-slate-700 mb-1'>
                          Services
                        </label>
                        <textarea
                          value={vendorFormValues.services}
                          onChange={(e) =>
                            handleVendorFieldChange('services', e.target.value)
                          }
                          rows={2}
                          className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                        />
                      </div>

                      {/* IDs */}
                      <div>
                        <label className='block text-xs font-medium text-slate-700 mb-1'>
                          NTN Number
                        </label>
                        <input
                          type='text'
                          value={vendorFormValues.ntnNumber}
                          onChange={(e) =>
                            handleVendorFieldChange('ntnNumber', e.target.value)
                          }
                          className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                        />
                      </div>
                      <div>
                        <label className='block text-xs font-medium text-slate-700 mb-1'>
                          GST Number
                        </label>
                        <input
                          type='text'
                          value={vendorFormValues.gstNumber}
                          onChange={(e) =>
                            handleVendorFieldChange('gstNumber', e.target.value)
                          }
                          className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                        />
                      </div>
                      <div>
                        <label className='block text-xs font-medium text-slate-700 mb-1'>
                          SRB Number
                        </label>
                        <input
                          type='text'
                          value={vendorFormValues.srbNumber}
                          onChange={(e) =>
                            handleVendorFieldChange('srbNumber', e.target.value)
                          }
                          className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                        />
                      </div>
                    </div>

                    <div className='mt-4'>
                      <button
                        type='submit'
                        disabled={vendorIsSaving}
                        className='inline-flex w-full items-center justify-center rounded-md bg-[#34a85a] px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-[#2c8a4e] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer'
                      >
                        {vendorIsSaving ? (
                          <span className='inline-flex items-center gap-2'>
                            <span className='h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin' />
                            <span>Saving...</span>
                          </span>
                        ) : (
                          'Save Vendor'
                        )}
                      </button>
                      {vendorSaveError && (
                        <p className='mt-2 text-[11px] text-rose-600'>{vendorSaveError}</p>
                      )}
                      {vendorSaveMessage && !vendorSaveError && (
                        <p className='mt-2 text-[11px] text-emerald-600'>
                          {vendorSaveMessage}
                        </p>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            <div className='h-full min-h-[60vh] md:min-h-full rounded-xl border border-slate-200 bg-white flex flex-col'>
              <div className='flex items-center justify-between border-b border-slate-100 px-4 py-3'>
                <h1 className='text-sm md:text-base font-semibold text-slate-900'>
                  {TAB_TITLES[selectedId] ?? 'Dashboard'}
                </h1>
              </div>
              <div className='flex-1 flex items-center justify-center px-4 py-3'>
                <p className='text-xs md:text-sm text-slate-400'>
                  Content for {TAB_TITLES[selectedId] ?? 'this section'} will appear here.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Mobile sidebar overlay */}
      <div
        className={[
          'fixed inset-0 z-30 md:hidden transition-opacity duration-200',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      >
        <button
          type='button'
          className='absolute inset-0 bg-black/30'
          onClick={() => setMobileOpen(false)}
          aria-label='Close menu backdrop'
        />
        <div
          className={[
            'relative h-full w-[80%] max-w-xs bg-slate-50 shadow-xl transform transition-transform duration-200',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          ].join(' ')}
        >
          <Sidebar
            variant='mobile'
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id);
              setMobileOpen(false);
            }}
            onClose={() => setMobileOpen(false)}
          />
      </div>
      </div>

      {/* Open dialog */}
      {dialogMode === 'open' && (
        <DialogShell
          title='Open Customer Profile'
          search={dialogSearch}
          setSearch={setDialogSearch}
          onClose={() => {
            setDialogMode(null);
            setSelectedDialogCustomer(null);
            setDialogStep('list');
          }}
        >
          {dialogStep === 'list' ? (
            <CustomerTable
              customers={filteredDialogCustomers}
              onSelect={(c) => {
                setSelectedDialogCustomer(c);
                setDialogStep('detail');
              }}
            />
          ) : (
            selectedDialogCustomer && (
              <div className='max-w-3xl mx-auto'>
                <BackButton onClick={() => {
                  setDialogStep('list');
                  setSelectedDialogCustomer(null);
                }} />
                {renderCustomerDetails(selectedDialogCustomer)}
              </div>
            )
          )}
        </DialogShell>
      )}

      {/* Edit dialog */}
      {dialogMode === 'edit' && (
        <DialogShell
          title='Edit Customer Profile'
          search={dialogSearch}
          setSearch={setDialogSearch}
          onClose={() => {
            setDialogMode(null);
            setSelectedDialogCustomer(null);
            setEditValues(null);
            setDialogStep('list');
          }}
        >
          {dialogStep === 'list' ? (
            <CustomerTable
              customers={filteredDialogCustomers}
              onSelect={(c) => beginEditCustomer(c)}
            />
          ) : (
            editValues &&
            selectedDialogCustomer && (
              <div className='max-w-3xl mx-auto'>
                <BackButton
                  onClick={() => {
                    setDialogStep('list');
                    setSelectedDialogCustomer(null);
                    setEditValues(null);
                  }}
                />
                <form
                  onSubmit={handleEditSubmit}
                  className='space-y-4 text-xs md:text-sm'
                >
                  <h3 className='font-semibold text-slate-800 mb-1'>
                    Edit Customer Details
                  </h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {/* Customer Name */}
                    <div>
                      <label className='block text-xs font-medium text-slate-700 mb-1'>
                        Customer Name
                      </label>
                      <input
                        type='text'
                        value={editValues.customerName}
                        onChange={(e) =>
                          setEditValues((prev) =>
                            prev ? { ...prev, customerName: e.target.value } : prev,
                          )
                        }
                        className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                      />
                    </div>

                    {/* City */}
                    <div>
                      <label className='block text-xs font-medium text-slate-700 mb-1'>
                        City
                      </label>
                      <input
                        type='text'
                        value={editValues.city}
                        onChange={(e) =>
                          setEditValues((prev) =>
                            prev ? { ...prev, city: e.target.value } : prev,
                          )
                        }
                        className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                      />
                    </div>

                    {/* Address */}
                    <div className='md:col-span-2'>
                      <label className='block text-xs font-medium text-slate-700 mb-1'>
                        Address
                      </label>
                      <textarea
                        value={editValues.address}
                        onChange={(e) =>
                          setEditValues((prev) =>
                            prev ? { ...prev, address: e.target.value } : prev,
                          )
                        }
                        rows={2}
                        className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                      />
                    </div>

                    {/* Country */}
                    <div>
                      <label className='block text-xs font-medium text-slate-700 mb-1'>
                        Country
                      </label>
                      <input
                        type='text'
                        value={editValues.country}
                        onChange={(e) =>
                          setEditValues((prev) =>
                            prev ? { ...prev, country: e.target.value } : prev,
                          )
                        }
                        className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                      />
                    </div>

                    {/* Main / Other Commodities */}
                    <div>
                      <label className='block text-xs font-medium text-slate-700 mb-1'>
                        Main Commodity
                      </label>
                      <input
                        type='text'
                        value={editValues.mainCommodity}
                        onChange={(e) =>
                          setEditValues((prev) =>
                            prev ? { ...prev, mainCommodity: e.target.value } : prev,
                          )
                        }
                        className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                      />
                    </div>

                    <div className='md:col-span-2'>
                      <label className='block text-xs font-medium text-slate-700 mb-1'>
                        Other Commodity
                      </label>
                      <textarea
                        value={editValues.otherCommodity}
                        onChange={(e) =>
                          setEditValues((prev) =>
                            prev
                              ? { ...prev, otherCommodity: e.target.value }
                              : prev,
                          )
                        }
                        rows={2}
                        className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                      />
                    </div>

                    {/* Emails */}
                    <div>
                      <label className='block text-xs font-medium text-slate-700 mb-1'>
                        Email 1
                      </label>
                      <input
                        type='email'
                        value={editValues.email1}
                        onChange={(e) =>
                          setEditValues((prev) =>
                            prev ? { ...prev, email1: e.target.value } : prev,
                          )
                        }
                        className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                      />
                    </div>
                    <div>
                      <label className='block text-xs font-medium text-slate-700 mb-1'>
                        Email 2
                      </label>
                      <input
                        type='email'
                        value={editValues.email2}
                        onChange={(e) =>
                          setEditValues((prev) =>
                            prev ? { ...prev, email2: e.target.value } : prev,
                          )
                        }
                        className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                      />
                    </div>
                    <div>
                      <label className='block text-xs font-medium text-slate-700 mb-1'>
                        Email 3
                      </label>
                      <input
                        type='email'
                        value={editValues.email3}
                        onChange={(e) =>
                          setEditValues((prev) =>
                            prev ? { ...prev, email3: e.target.value } : prev,
                          )
                        }
                        className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                      />
                    </div>

                    {/* Contacts */}
                    <div>
                      <label className='block text-xs font-medium text-slate-700 mb-1'>
                        Contact #1
                      </label>
                      <input
                        type='tel'
                        value={editValues.contact1}
                        onChange={(e) =>
                          setEditValues((prev) =>
                            prev ? { ...prev, contact1: e.target.value } : prev,
                          )
                        }
                        className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                      />
                    </div>
                    <div>
                      <label className='block text-xs font-medium text-slate-700 mb-1'>
                        Contact #2
                      </label>
                      <input
                        type='tel'
                        value={editValues.contact2}
                        onChange={(e) =>
                          setEditValues((prev) =>
                            prev ? { ...prev, contact2: e.target.value } : prev,
                          )
                        }
                        className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                      />
                    </div>
                    <div>
                      <label className='block text-xs font-medium text-slate-700 mb-1'>
                        Contact #3
                      </label>
                      <input
                        type='tel'
                        value={editValues.contact3}
                        onChange={(e) =>
                          setEditValues((prev) =>
                            prev ? { ...prev, contact3: e.target.value } : prev,
                          )
                        }
                        className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                      />
                    </div>

                    {/* IDs */}
                    <div>
                      <label className='block text-xs font-medium text-slate-700 mb-1'>
                        NTN Number
                      </label>
                      <input
                        type='text'
                        value={editValues.ntnNumber}
                        onChange={(e) =>
                          setEditValues((prev) =>
                            prev ? { ...prev, ntnNumber: e.target.value } : prev,
                          )
                        }
                        className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                      />
                    </div>

                    <div>
                      <label className='block text-xs font-medium text-slate-700 mb-1'>
                        GST Number
                      </label>
                      <input
                        type='text'
                        value={editValues.gstNumber}
                        onChange={(e) =>
                          setEditValues((prev) =>
                            prev ? { ...prev, gstNumber: e.target.value } : prev,
                          )
                        }
                        className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                      />
                    </div>

                    <div>
                      <label className='block text-xs font-medium text-slate-700 mb-1'>
                        SRB Number
                      </label>
                      <input
                        type='text'
                        value={editValues.srbNumber}
                        onChange={(e) =>
                          setEditValues((prev) =>
                            prev ? { ...prev, srbNumber: e.target.value } : prev,
                          )
                        }
                        className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                      />
                    </div>
                  </div>

                  {/* Consignees */}
                  <div className='mt-4'>
                    <h3 className='text-xs font-semibold text-slate-800 mb-2'>
                      Consignees &amp; Trade Licenses
                    </h3>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                      {editValues.consignees.map((c, index) => (
                        <div
                          key={index}
                          className='rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 space-y-2'
                        >
                          <p className='text-[11px] font-medium text-slate-600'>
                            Consignee {index + 1}
                          </p>
                          <div>
                            <label className='block text-[11px] text-slate-600 mb-1'>
                              Name
                            </label>
                            <input
                              type='text'
                              value={c.name}
                              onChange={(e) =>
                                setEditValues((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        consignees: prev.consignees.map((cg, i) =>
                                          i === index
                                            ? { ...cg, name: e.target.value }
                                            : cg,
                                        ),
                                      }
                                    : prev,
                                )
                              }
                              className='w-full rounded-md border border-slate-200 px-2 py-1.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-[#6495ed] focus:border-[#6495ed]'
                            />
                          </div>
                          <div>
                            <label className='block text-[11px] text-slate-600 mb-1'>
                              Trade License #
                            </label>
                            <input
                              type='text'
                              value={c.tradeLicense}
                              onChange={(e) =>
                                setEditValues((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        consignees: prev.consignees.map((cg, i) =>
                                          i === index
                                            ? { ...cg, tradeLicense: e.target.value }
                                            : cg,
                                        ),
                                      }
                                    : prev,
                                )
                              }
                              className='w-full rounded-md border border-slate-200 px-2 py-1.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-[#6495ed] focus:border-[#6495ed]'
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className='mt-4 flex justify-end gap-2'>
                    <button
                      type='button'
                      onClick={() => {
                        setDialogMode(null);
                        setSelectedDialogCustomer(null);
                        setEditValues(null);
                        setDialogStep('list');
                      }}
                      className='inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer'
                    >
                      Cancel
                    </button>
                    <button
                      type='submit'
                      disabled={isEditingCustomer}
                      className='inline-flex items-center rounded-md bg-[#34a85a] px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-[#2c8a4e] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer'
                    >
                      {isEditingCustomer ? (
                        <span className='inline-flex items-center gap-2'>
                          <span className='h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin' />
                          <span>Saving...</span>
                        </span>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )
          )}
        </DialogShell>
      )}

      {/* Delete dialog */}
      {dialogMode === 'delete' && (
        <DialogShell
          title='Delete Customer Profile'
          search={dialogSearch}
          setSearch={setDialogSearch}
          onClose={() => {
            setDialogMode(null);
            setSelectedDialogCustomer(null);
            setDialogStep('list');
          }}
        >
          {dialogStep === 'list' ? (
            <CustomerTable
              customers={filteredDialogCustomers}
              onSelect={(c) => {
                setSelectedDialogCustomer(c);
                setDialogStep('detail');
              }}
              onDeleteClick={(c) => setPendingDelete(c)}
            />
          ) : (
            selectedDialogCustomer && (
              <div className='max-w-3xl mx-auto'>
                <BackButton
                  onClick={() => {
                    setDialogStep('list');
                    setSelectedDialogCustomer(null);
                  }}
                />
                {renderCustomerDetails(selectedDialogCustomer)}
                <div className='mt-4 flex justify-end'>
                  <button
                    type='button'
                    onClick={() => setPendingDelete(selectedDialogCustomer)}
                    className='inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-medium text-rose-700 hover:bg-rose-100 cursor-pointer'
                  >
                    Delete this customer
                  </button>
                </div>
              </div>
            )
          )}
        </DialogShell>
      )}

      {/* Delete confirmation popup */}
      {pendingDelete && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4'>
          <div className='w-full max-w-sm rounded-xl bg-white shadow-lg border border-slate-200 p-4 space-y-3 text-xs md:text-sm'>
            <h3 className='font-semibold text-slate-900'>Confirm deletion</h3>
            <p className='text-slate-600'>
              Are you sure you want to delete customer{' '}
              <span className='font-medium'>
                {pendingDelete.customerName || pendingDelete.id}
              </span>
              ? This action cannot be undone.
            </p>
            <div className='flex justify-end gap-2 pt-2'>
              <button
                type='button'
                onClick={() => setPendingDelete(null)}
                className='inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer'
              >
                Cancel
              </button>
              <button
                type='button'
                onClick={async () => {
                  await performDeleteCustomer(pendingDelete);
                  setPendingDelete(null);
                }}
                className='inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-medium text-rose-700 hover:bg-rose-100 cursor-pointer'
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vendor Open dialog */}
      {vendorDialogMode === 'open' && (
        <DialogShell
          title='Open Vendor Profile'
          search={vendorDialogSearch}
          setSearch={setVendorDialogSearch}
          onClose={() => {
            setVendorDialogMode(null);
            setSelectedDialogVendor(null);
            setVendorDialogStep('list');
          }}
        >
          {vendorDialogStep === 'list' ? (
            <table className='min-w-full text-xs md:text-sm'>
              <thead>
                <tr className='border-b border-slate-100 bg-slate-50 text-[11px] md:text-xs text-slate-500'>
                  <th className='px-3 py-2 text-left font-medium'>Vendor Name</th>
                  <th className='px-3 py-2 text-left font-medium'>City</th>
                  <th className='px-3 py-2 text-left font-medium'>Country</th>
                </tr>
              </thead>
              <tbody>
                {filteredDialogVendors.map((v) => (
                  <tr
                    key={v.id}
                    className='border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer'
                    onClick={() => {
                      setSelectedDialogVendor(v);
                      setVendorDialogStep('detail');
                    }}
                  >
                    <td className='px-3 py-2'>{v.vendorName || '-'}</td>
                    <td className='px-3 py-2'>{v.city || '-'}</td>
                    <td className='px-3 py-2'>{v.country || '-'}</td>
                  </tr>
                ))}
                {filteredDialogVendors.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className='px-3 py-4 text-center text-[11px] text-slate-400'
                    >
                      No vendors found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            selectedDialogVendor && (
              <div className='max-w-3xl mx-auto'>
                <BackButton
                  onClick={() => {
                    setVendorDialogStep('list');
                    setSelectedDialogVendor(null);
                  }}
                />
                <div className='space-y-3 text-xs md:text-sm'>
                  <div>
                    <h3 className='font-semibold text-slate-800 mb-1'>
                      Basic Information
                    </h3>
                    <p>
                      <span className='font-medium'>Name: </span>
                      {selectedDialogVendor.vendorName || '-'}
                    </p>
                    <p>
                      <span className='font-medium'>City: </span>
                      {selectedDialogVendor.city || '-'}
                    </p>
                    <p>
                      <span className='font-medium'>Country: </span>
                      {selectedDialogVendor.country || '-'}
                    </p>
                    <p>
                      <span className='font-medium'>Address: </span>
                      {selectedDialogVendor.address || '-'}
                    </p>
                  </div>
                  <div>
                    <h3 className='font-semibold text-slate-800 mb-1'>Contact</h3>
                    <p>
                      <span className='font-medium'>Email 1: </span>
                      {selectedDialogVendor.email1 || '-'}
                    </p>
                    <p>
                      <span className='font-medium'>Email 2: </span>
                      {selectedDialogVendor.email2 || '-'}
                    </p>
                    <p>
                      <span className='font-medium'>Email 3: </span>
                      {selectedDialogVendor.email3 || '-'}
                    </p>
                    <p>
                      <span className='font-medium'>Contact #1: </span>
                      {selectedDialogVendor.contact1 || '-'}
                    </p>
                    <p>
                      <span className='font-medium'>Contact #2: </span>
                      {selectedDialogVendor.contact2 || '-'}
                    </p>
                    <p>
                      <span className='font-medium'>Contact #3: </span>
                      {selectedDialogVendor.contact3 || '-'}
                    </p>
                  </div>
                  <div>
                    <h3 className='font-semibold text-slate-800 mb-1'>
                      Type & Services
                    </h3>
                    <p>
                      <span className='font-medium'>Type: </span>
                      {selectedDialogVendor.type || '-'}
                    </p>
                    <p>
                      <span className='font-medium'>Services: </span>
                      {selectedDialogVendor.services || '-'}
                    </p>
                  </div>
                  <div>
                    <h3 className='font-semibold text-slate-800 mb-1'>Tax IDs</h3>
                    <p>
                      <span className='font-medium'>NTN: </span>
                      {selectedDialogVendor.ntnNumber || '-'}
                    </p>
                    <p>
                      <span className='font-medium'>GST: </span>
                      {selectedDialogVendor.gstNumber || '-'}
                    </p>
                    <p>
                      <span className='font-medium'>SRB: </span>
                      {selectedDialogVendor.srbNumber || '-'}
                    </p>
                  </div>
                </div>
              </div>
            )
          )}
        </DialogShell>
      )}

      {/* Vendor Edit dialog */}
      {vendorDialogMode === 'edit' && (
        <DialogShell
          title='Edit Vendor Profile'
          search={vendorDialogSearch}
          setSearch={setVendorDialogSearch}
          onClose={() => {
            setVendorDialogMode(null);
            setSelectedDialogVendor(null);
            setEditVendorValues(null);
            setVendorDialogStep('list');
          }}
        >
          {vendorDialogStep === 'list' ? (
            <table className='min-w-full text-xs md:text-sm'>
              <thead>
                <tr className='border-b border-slate-100 bg-slate-50 text-[11px] md:text-xs text-slate-500'>
                  <th className='px-3 py-2 text-left font-medium'>Vendor Name</th>
                  <th className='px-3 py-2 text-left font-medium'>City</th>
                  <th className='px-3 py-2 text-left font-medium'>Country</th>
                </tr>
              </thead>
              <tbody>
                {filteredDialogVendors.map((v) => (
                  <tr
                    key={v.id}
                    className='border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer'
                    onClick={() => beginEditVendor(v)}
                  >
                    <td className='px-3 py-2'>{v.vendorName || '-'}</td>
                    <td className='px-3 py-2'>{v.city || '-'}</td>
                    <td className='px-3 py-2'>{v.country || '-'}</td>
                  </tr>
                ))}
                {filteredDialogVendors.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className='px-3 py-4 text-center text-[11px] text-slate-400'
                    >
                      No vendors found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            editVendorValues &&
            selectedDialogVendor && (
              <div className='max-w-3xl mx-auto'>
                <BackButton
                  onClick={() => {
                    setVendorDialogStep('list');
                    setSelectedDialogVendor(null);
                    setEditVendorValues(null);
                  }}
                />
                <form
                  onSubmit={handleVendorEditSubmit}
                  className='space-y-4 text-xs md:text-sm'
                >
                  <h3 className='font-semibold text-slate-800 mb-1'>
                    Edit Vendor Details
                  </h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {/* Vendor Name */}
                    <div>
                      <label className='block text-xs font-medium text-slate-700 mb-1'>
                        Vendor Name
                      </label>
                      <input
                        type='text'
                        value={editVendorValues.vendorName}
                        onChange={(e) =>
                          setEditVendorValues((prev) =>
                            prev ? { ...prev, vendorName: e.target.value } : prev,
                          )
                        }
                        className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                      />
                    </div>

                    {/* City */}
                    <div>
                      <label className='block text-xs font-medium text-slate-700 mb-1'>
                        City
                      </label>
                      <input
                        type='text'
                        value={editVendorValues.city}
                        onChange={(e) =>
                          setEditVendorValues((prev) =>
                            prev ? { ...prev, city: e.target.value } : prev,
                          )
                        }
                        className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                      />
                    </div>

                    {/* Address */}
                    <div className='md:col-span-2'>
                      <label className='block text-xs font-medium text-slate-700 mb-1'>
                        Address
                      </label>
                      <textarea
                        value={editVendorValues.address}
                        onChange={(e) =>
                          setEditVendorValues((prev) =>
                            prev ? { ...prev, address: e.target.value } : prev,
                          )
                        }
                        rows={2}
                        className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                      />
                    </div>

                    {/* Country */}
                    <div>
                      <label className='block text-xs font-medium text-slate-700 mb-1'>
                        Country
                      </label>
                      <input
                        type='text'
                        value={editVendorValues.country}
                        onChange={(e) =>
                          setEditVendorValues((prev) =>
                            prev ? { ...prev, country: e.target.value } : prev,
                          )
                        }
                        className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                      />
                    </div>

                    {/* Emails */}
                    <div>
                      <label className='block text-xs font-medium text-slate-700 mb-1'>
                        Email 1
                      </label>
                      <input
                        type='email'
                        value={editVendorValues.email1}
                        onChange={(e) =>
                          setEditVendorValues((prev) =>
                            prev ? { ...prev, email1: e.target.value } : prev,
                          )
                        }
                        className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                      />
                    </div>
                    <div>
                      <label className='block text-xs font-medium text-slate-700 mb-1'>
                        Email 2
                      </label>
                      <input
                        type='email'
                        value={editVendorValues.email2}
                        onChange={(e) =>
                          setEditVendorValues((prev) =>
                            prev ? { ...prev, email2: e.target.value } : prev,
                          )
                        }
                        className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                      />
                    </div>
                    <div>
                      <label className='block text-xs font-medium text-slate-700 mb-1'>
                        Email 3
                      </label>
                      <input
                        type='email'
                        value={editVendorValues.email3}
                        onChange={(e) =>
                          setEditVendorValues((prev) =>
                            prev ? { ...prev, email3: e.target.value } : prev,
                          )
                        }
                        className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                      />
                    </div>

                    {/* Contacts */}
                    <div>
                      <label className='block text-xs font-medium text-slate-700 mb-1'>
                        Contact #1
                      </label>
                      <input
                        type='tel'
                        value={editVendorValues.contact1}
                        onChange={(e) =>
                          setEditVendorValues((prev) =>
                            prev ? { ...prev, contact1: e.target.value } : prev,
                          )
                        }
                        className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                      />
                    </div>
                    <div>
                      <label className='block text-xs font-medium text-slate-700 mb-1'>
                        Contact #2
                      </label>
                      <input
                        type='tel'
                        value={editVendorValues.contact2}
                        onChange={(e) =>
                          setEditVendorValues((prev) =>
                            prev ? { ...prev, contact2: e.target.value } : prev,
                          )
                        }
                        className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                      />
                    </div>
                    <div>
                      <label className='block text-xs font-medium text-slate-700 mb-1'>
                        Contact #3
                      </label>
                      <input
                        type='tel'
                        value={editVendorValues.contact3}
                        onChange={(e) =>
                          setEditVendorValues((prev) =>
                            prev ? { ...prev, contact3: e.target.value } : prev,
                          )
                        }
                        className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                      />
                    </div>

                    {/* Type & Services */}
                    <div>
                      <label className='block text-xs font-medium text-slate-700 mb-1'>
                        Type
                      </label>
                      <select
                        value={editVendorValues.type}
                        onChange={(e) =>
                          setEditVendorValues((prev) =>
                            prev ? { ...prev, type: e.target.value } : prev,
                          )
                        }
                        className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                      >
                        <option value=''>Select type</option>
                        <option value='Shipping Line'>Shipping Line</option>
                        <option value='Transporter'>Transporter</option>
                        <option value='Clearing Agent'>Clearing Agent</option>
                      </select>
                    </div>
                    <div className='md:col-span-2'>
                      <label className='block text-xs font-medium text-slate-700 mb-1'>
                        Services
                      </label>
                      <textarea
                        value={editVendorValues.services}
                        onChange={(e) =>
                          setEditVendorValues((prev) =>
                            prev ? { ...prev, services: e.target.value } : prev,
                          )
                        }
                        rows={2}
                        className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                      />
                    </div>

                    {/* IDs */}
                    <div>
                      <label className='block text-xs font-medium text-slate-700 mb-1'>
                        NTN Number
                      </label>
                      <input
                        type='text'
                        value={editVendorValues.ntnNumber}
                        onChange={(e) =>
                          setEditVendorValues((prev) =>
                            prev ? { ...prev, ntnNumber: e.target.value } : prev,
                          )
                        }
                        className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                      />
                    </div>
                    <div>
                      <label className='block text-xs font-medium text-slate-700 mb-1'>
                        GST Number
                      </label>
                      <input
                        type='text'
                        value={editVendorValues.gstNumber}
                        onChange={(e) =>
                          setEditVendorValues((prev) =>
                            prev ? { ...prev, gstNumber: e.target.value } : prev,
                          )
                        }
                        className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                      />
                    </div>
                    <div>
                      <label className='block text-xs font-medium text-slate-700 mb-1'>
                        SRB Number
                      </label>
                      <input
                        type='text'
                        value={editVendorValues.srbNumber}
                        onChange={(e) =>
                          setEditVendorValues((prev) =>
                            prev ? { ...prev, srbNumber: e.target.value } : prev,
                          )
                        }
                        className='w-full rounded-md border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
                      />
                    </div>
                  </div>
                  <div className='mt-4 flex justify-end gap-2'>
                    <button
                      type='button'
                      onClick={() => {
                        setVendorDialogMode(null);
                        setSelectedDialogVendor(null);
                        setEditVendorValues(null);
                        setVendorDialogStep('list');
                      }}
                      className='inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer'
                    >
                      Cancel
                    </button>
                    <button
                      type='submit'
                      disabled={isEditingVendor}
                      className='inline-flex items-center rounded-md bg-[#34a85a] px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-[#2c8a4e] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer'
                    >
                      {isEditingVendor ? (
                        <span className='inline-flex items-center gap-2'>
                          <span className='h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin' />
                          <span>Saving...</span>
                        </span>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )
          )}
        </DialogShell>
      )}

      {/* Vendor Delete dialog */}
      {vendorDialogMode === 'delete' && (
        <DialogShell
          title='Delete Vendor Profile'
          search={vendorDialogSearch}
          setSearch={setVendorDialogSearch}
          onClose={() => {
            setVendorDialogMode(null);
            setSelectedDialogVendor(null);
            setVendorDialogStep('list');
          }}
        >
          {vendorDialogStep === 'list' ? (
            <table className='min-w-full text-xs md:text-sm'>
              <thead>
                <tr className='border-b border-slate-100 bg-slate-50 text-[11px] md:text-xs text-slate-500'>
                  <th className='px-3 py-2 text-left font-medium'>Vendor Name</th>
                  <th className='px-3 py-2 text-left font-medium'>City</th>
                  <th className='px-3 py-2 text-left font-medium'>Country</th>
                  <th className='px-3 py-2 text-right font-medium'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDialogVendors.map((v) => (
                  <tr
                    key={v.id}
                    className='border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer'
                  >
                    <td
                      className='px-3 py-2'
                      onClick={() => {
                        setSelectedDialogVendor(v);
                        setVendorDialogStep('detail');
                      }}
                    >
                      {v.vendorName || '-'}
                    </td>
                    <td
                      className='px-3 py-2'
                      onClick={() => {
                        setSelectedDialogVendor(v);
                        setVendorDialogStep('detail');
                      }}
                    >
                      {v.city || '-'}
                    </td>
                    <td
                      className='px-3 py-2'
                      onClick={() => {
                        setSelectedDialogVendor(v);
                        setVendorDialogStep('detail');
                      }}
                    >
                      {v.country || '-'}
                    </td>
                    <td className='px-3 py-2 text-right'>
                      <button
                        type='button'
                        onClick={() => setPendingVendorDelete(v)}
                        className='inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-100 cursor-pointer'
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredDialogVendors.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className='px-3 py-4 text-center text-[11px] text-slate-400'
                    >
                      No vendors found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            selectedDialogVendor && (
              <div className='max-w-3xl mx-auto'>
                <BackButton
                  onClick={() => {
                    setVendorDialogStep('list');
                    setSelectedDialogVendor(null);
                  }}
                />
                <div className='space-y-3 text-xs md:text-sm'>
                  <div>
                    <h3 className='font-semibold text-slate-800 mb-1'>
                      Basic Information
                    </h3>
                    <p>
                      <span className='font-medium'>Name: </span>
                      {selectedDialogVendor.vendorName || '-'}
                    </p>
                    <p>
                      <span className='font-medium'>City: </span>
                      {selectedDialogVendor.city || '-'}
                    </p>
                    <p>
                      <span className='font-medium'>Country: </span>
                      {selectedDialogVendor.country || '-'}
                    </p>
                    <p>
                      <span className='font-medium'>Address: </span>
                      {selectedDialogVendor.address || '-'}
                    </p>
                  </div>
                  <div>
                    <h3 className='font-semibold text-slate-800 mb-1'>Contact</h3>
                    <p>
                      <span className='font-medium'>Email 1: </span>
                      {selectedDialogVendor.email1 || '-'}
                    </p>
                    <p>
                      <span className='font-medium'>Email 2: </span>
                      {selectedDialogVendor.email2 || '-'}
                    </p>
                    <p>
                      <span className='font-medium'>Email 3: </span>
                      {selectedDialogVendor.email3 || '-'}
                    </p>
                    <p>
                      <span className='font-medium'>Contact #1: </span>
                      {selectedDialogVendor.contact1 || '-'}
                    </p>
                    <p>
                      <span className='font-medium'>Contact #2: </span>
                      {selectedDialogVendor.contact2 || '-'}
                    </p>
                    <p>
                      <span className='font-medium'>Contact #3: </span>
                      {selectedDialogVendor.contact3 || '-'}
                    </p>
                  </div>
                  <div>
                    <h3 className='font-semibold text-slate-800 mb-1'>
                      Type & Services
                    </h3>
                    <p>
                      <span className='font-medium'>Type: </span>
                      {selectedDialogVendor.type || '-'}
                    </p>
                    <p>
                      <span className='font-medium'>Services: </span>
                      {selectedDialogVendor.services || '-'}
                    </p>
                  </div>
                  <div>
                    <h3 className='font-semibold text-slate-800 mb-1'>Tax IDs</h3>
                    <p>
                      <span className='font-medium'>NTN: </span>
                      {selectedDialogVendor.ntnNumber || '-'}
                    </p>
                    <p>
                      <span className='font-medium'>GST: </span>
                      {selectedDialogVendor.gstNumber || '-'}
                    </p>
                    <p>
                      <span className='font-medium'>SRB: </span>
                      {selectedDialogVendor.srbNumber || '-'}
                    </p>
                  </div>
                </div>
                <div className='mt-4 flex justify-end'>
                  <button
                    type='button'
                    onClick={() => setPendingVendorDelete(selectedDialogVendor)}
                    className='inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-medium text-rose-700 hover:bg-rose-100 cursor-pointer'
                  >
                    Delete this vendor
                  </button>
                </div>
              </div>
            )
          )}
        </DialogShell>
      )}

      {/* Vendor Delete confirmation popup */}
      {pendingVendorDelete && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4'>
          <div className='w-full max-w-sm rounded-xl bg-white shadow-lg border border-slate-200 p-4 space-y-3 text-xs md:text-sm'>
            <h3 className='font-semibold text-slate-900'>Confirm vendor deletion</h3>
            <p className='text-slate-600'>
              Are you sure you want to delete vendor{' '}
              <span className='font-medium'>
                {pendingVendorDelete.vendorName || pendingVendorDelete.id}
              </span>
              ? This action cannot be undone.
            </p>
            <div className='flex justify-end gap-2 pt-2'>
              <button
                type='button'
                onClick={() => setPendingVendorDelete(null)}
                className='inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer'
              >
                Cancel
              </button>
              <button
                type='button'
                onClick={async () => {
                  await performDeleteVendor(pendingVendorDelete);
                  setPendingVendorDelete(null);
                }}
                className='inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-medium text-rose-700 hover:bg-rose-100 cursor-pointer'
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Small helper components reused by dialogs */

function DialogShell(props: {
  title: string;
  search: string;
  setSearch: (v: string) => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { title, search, setSearch, onClose, children } = props;
  return (
    <div className='fixed inset-0 z-40 flex items-start justify-center bg-black/40 px-4 py-10'>
      <div className='w-full max-w-4xl rounded-xl bg-white shadow-lg border border-slate-200 max-h-full overflow-hidden flex flex-col'>
        <div className='flex items-center justify-between border-b border-slate-100 px-4 py-3'>
          <h2 className='text-sm md:text-base font-semibold text-slate-900'>{title}</h2>
          <button
            type='button'
            onClick={onClose}
            className='inline-flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer'
            aria-label='Close'
          >
            x
          </button>
        </div>
        <div className='px-4 py-3 border-b border-slate-100'>
          <input
            type='text'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search by any field (name, city, commodity, consignee, etc.)'
            className='w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs md:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6495ed] focus:border-[#6495ed]'
          />
        </div>
        <div className='flex-1 overflow-auto px-4 py-3'>{children}</div>
      </div>
    </div>
  );
}

function CustomerTable(props: {
  customers: CustomerProfile[];
  onSelect: (c: CustomerProfile) => void;
  onDeleteClick?: (c: CustomerProfile) => void;
}) {
  const { customers, onSelect, onDeleteClick } = props;
  return (
    <table className='min-w-full text-xs md:text-sm'>
      <thead>
        <tr className='border-b border-slate-100 bg-slate-50 text-[11px] md:text-xs text-slate-500'>
          <th className='px-3 py-2 text-left font-medium'>Customer Name</th>
          <th className='px-3 py-2 text-left font-medium'>City</th>
          <th className='px-3 py-2 text-left font-medium'>Country</th>
          {onDeleteClick && (
            <th className='px-3 py-2 text-right font-medium'>Actions</th>
          )}
        </tr>
      </thead>
      <tbody>
        {customers.map((c) => (
          <tr
            key={c.id}
            className='border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer'
          >
            <td className='px-3 py-2' onClick={() => onSelect(c)}>
              {c.customerName || '-'}
            </td>
            <td className='px-3 py-2' onClick={() => onSelect(c)}>
              {c.city || '-'}
            </td>
            <td className='px-3 py-2' onClick={() => onSelect(c)}>
              {c.country || '-'}
            </td>
            {onDeleteClick && (
              <td className='px-3 py-2 text-right'>
                <button
                  type='button'
                  onClick={() => onDeleteClick(c)}
                  className='inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-100 cursor-pointer'
                >
                  Delete
                </button>
              </td>
            )}
          </tr>
        ))}
        {customers.length === 0 && (
          <tr>
            <td
              colSpan={onDeleteClick ? 4 : 3}
              className='px-3 py-4 text-center text-[11px] text-slate-400'
            >
              No customers found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function BackButton(props: { onClick: () => void }) {
  return (
    <button
      type='button'
      onClick={props.onClick}
      className='mb-2 inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer'
    >
      Back to search
    </button>
  );
}








