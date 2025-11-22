'use client';

import type React from 'react';
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Menu } from 'lucide-react';
import CustomerProfileFeature from '@/components/features/CustomerProfile';
import VendorProfileFeature from '@/components/features/VendorProfile';
import ImportShipmentForm from '@/components/features/ImportShipmentForm';
import ExportShipmentForm from '@/components/features/ExportShipmentForm';
import ImportShipmentDetailReport from '@/components/features/ImportShipmentDetailReport';
import ExportShipmentDetailReport from '@/components/features/ExportShipmentDetailReport';
import CustomerGroupLedger from '@/components/features/CustomerGroupLedger';
import InvoiceBilling from '@/components/features/InvoiceBilling';
import CustomerLedger from '@/components/features/CustomerLedger';
import VendorLedger from '@/components/features/VendorLedger';
import GeneralLedger from '@/components/features/GeneralLedger';
import ProfitAndLoss from '@/components/features/ProfitAndLoss';
import BalanceSheetReport from '@/components/features/BalanceSheetReport';
import Expenses from '@/components/features/Expenses';
import PageTransition from '@/components/ui/PageTransition';

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
  expenses: 'Expenses',
  'profit-and-loss': 'Profit & Loss',
  'balance-sheet': 'Balance Sheet',
};

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('customer-profile');

  return (
    <PageTransition>
      <div className='min-h-screen flex bg-background'>
        {/* Desktop sidebar */}
        <div className='hidden md:block'>
          <Sidebar variant='desktop' selectedId={selectedId} onSelect={setSelectedId} />
        </div>

        {/* Mobile sidebar overlay */}
        <div
          className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${mobileOpen ? 'visible' : 'invisible pointer-events-none'
            }`}
        >
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${mobileOpen ? 'opacity-100' : 'opacity-0'
              }`}
            onClick={() => setMobileOpen(false)}
          />

          {/* Sidebar */}
          <div
            className={`absolute left-0 top-0 h-full w-72 max-w-[85vw] transition-transform duration-300 ease-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
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

        {/* Main content */}
        <main className='flex-1 flex flex-col'>
          {/* Mobile top bar */}
          <div className='md:hidden flex items-center px-4 py-3 border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-20'>
            <button
              type='button'
              onClick={() => setMobileOpen(true)}
              className='inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm cursor-pointer transition-transform duration-200 active:scale-95 hover:bg-slate-50'
              aria-label='Open menu'
            >
              <Menu className='h-4 w-4 transition-all duration-200' />
            </button>
          </div>

          <div className='flex-1 p-3 md:p-8'>
            {selectedId === 'customer-profile' ? (
              <CustomerProfileFeature />
            ) : selectedId === 'vendor-profile' ? (
              <VendorProfileFeature />
            ) : selectedId === 'import-shipment-form' ? (
              <ImportShipmentForm />
            ) : selectedId === 'export-shipment-form' ? (
              <ExportShipmentForm />
            ) : selectedId === 'import-shipment-detail-report' ? (
              <ImportShipmentDetailReport />
            ) : selectedId === 'export-shipment-detail-report' ? (
              <ExportShipmentDetailReport />
            ) : selectedId === 'customer-group-ledger' ? (
              <CustomerGroupLedger />
            ) : selectedId === 'invoice' ? (
              <InvoiceBilling />
            ) : selectedId === 'billing' ? (
              <InvoiceBilling />
            ) : selectedId === 'customer-ledger' ? (
              <CustomerLedger />
            ) : selectedId === 'vendor-ledger' ? (
              <VendorLedger />
            ) : selectedId === 'general-ledger' ? (
              <GeneralLedger />
            ) : selectedId === 'expenses' ? (
              <Expenses />
            ) : selectedId === 'profit-and-loss' ? (
              <ProfitAndLoss />
            ) : selectedId === 'balance-sheet' ? (
              <BalanceSheetReport />
            ) : (
              <div className='flex-1 flex items-center justify-center px-4 py-3'>
                <p className='text-xs md:text-sm text-slate-400'>
                  Content for {TAB_TITLES[selectedId] ?? 'this section'} will appear here.
                </p>
              </div>
            )}
          </div>
        </main >
      </div >
    </PageTransition>
  );
}
