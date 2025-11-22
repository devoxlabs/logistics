// Vendor Ledger - Individual Vendor Account Statement
'use client';

import { useState, useEffect } from 'react';
import { listVendors } from '@/services/vendors';
import { VendorProfile } from '@/models/profiles';
import FeatureHeader from '@/components/ui/FeatureHeader';
import { listInvoices } from '@/services/invoices';
import { Invoice } from '@/models/invoices';
import { formatCurrencyValue, getCurrencyOptions } from '@/lib/currency';
import { deriveLedgerEntries } from '@/lib/ledger';
import DetailDialog from '@/components/ui/DetailDialog';

type LedgerEntryWithBalance = ReturnType<typeof deriveLedgerEntries>[number] & { balance: number };

export default function VendorLedger() {
    const [vendors, setVendors] = useState<VendorProfile[]>([]);
    const [selectedVendorId, setSelectedVendorId] = useState('');
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [displayCurrency, setDisplayCurrency] = useState('USD');
    const [detailEntry, setDetailEntry] = useState<LedgerEntryWithBalance | null>(null);

    const loadData = async () => {
        try {
            setLoading(true);
            const [vendorData, invoiceData] = await Promise.all([listVendors(), listInvoices()]);
            setVendors(vendorData);
            setInvoices(invoiceData.filter((inv) => (inv.partyType ?? 'customer') === 'vendor'));
        } catch (error) {
            console.error('Failed to load vendor ledger data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, []);

    useEffect(() => {
        setDetailEntry(null);
    }, [selectedVendorId]);

    const selectedVendor = vendors.find((v) => v.id === selectedVendorId);

    const filteredInvoices = invoices.filter((inv) => inv.partyId === selectedVendorId);
    const ledgerEntries = deriveLedgerEntries(filteredInvoices, displayCurrency);

    let runningBalance = 0;
    const entriesWithBalance: LedgerEntryWithBalance[] = ledgerEntries.map((entry) => {
        runningBalance += entry.outstanding;
        return {
            ...entry,
            balance: runningBalance,
        };
    });

    const stats = ledgerEntries.reduce(
        (acc, entry) => {
            acc.totalPayable += entry.outstanding;
            acc.totalPaid += entry.paid;
            return acc;
        },
        { totalPayable: 0, totalPaid: 0 },
    );
    const finalBalance = entriesWithBalance.length > 0 ? entriesWithBalance[entriesWithBalance.length - 1].balance : 0;

    return (
        <div className="h-full min-h-[60vh] md:min-h-full rounded-xl border border-slate-200 bg-white flex flex-col">
            <FeatureHeader
                title="Vendor Ledger"
                icon={
                    <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' />
                    </svg>
                }
                actions={
                    <div className="flex gap-2">
                        <select
                            value={displayCurrency}
                            onChange={(e) => setDisplayCurrency(e.target.value)}
                            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200"
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
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Select Vendor *</label>
                        <select
                            value={selectedVendorId}
                            onChange={(e) => setSelectedVendorId(e.target.value)}
                            className="w-full rounded-lg border-2 border-input bg-white px-4 py-2 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                        >
                            <option value="">Choose a vendor...</option>
                            {vendors.map((vendor) => (
                                <option key={vendor.id} value={vendor.id}>
                                    {vendor.vendorName}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {selectedVendor && (
                <>
                    <div className="border-b border-slate-100 px-4 py-4 bg-gradient-to-br from-slate-50 to-white">
                        <div className="mb-4">
                            <h2 className="text-base font-semibold text-slate-900 mb-1">{selectedVendor.vendorName}</h2>
                            <p className="text-sm text-slate-600">{selectedVendor.address}</p>
                            {selectedVendor.ntnNumber && (
                                <p className="text-xs text-slate-500 mt-1">NTN: {selectedVendor.ntnNumber}</p>
                            )}
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-white rounded-lg border border-slate-200 p-3">
                                <div className="text-xs text-slate-500 mb-1">Total Payable</div>
                                <div className="text-lg font-bold text-rose-600">
                                    {formatCurrencyValue(stats.totalPayable, displayCurrency)}
                                </div>
                            </div>
                            <div className="bg-white rounded-lg border border-slate-200 p-3">
                                <div className="text-xs text-slate-500 mb-1">Total Paid</div>
                                <div className="text-lg font-bold text-emerald-600">
                                    {formatCurrencyValue(stats.totalPaid, displayCurrency)}
                                </div>
                            </div>
                            <div className="bg-white rounded-lg border border-slate-200 p-3">
                                <div className="text-xs text-slate-500 mb-1">Balance Due</div>
                                <div className={`text-lg font-bold ${finalBalance >= 0 ? 'text-slate-900' : 'text-emerald-600'}`}>
                                    {formatCurrencyValue(Math.abs(finalBalance), displayCurrency)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto p-4">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="flex items-center gap-3 text-slate-500">
                                    <div className="h-5 w-5 border-2 border-slate-300 border-t-primary rounded-full animate-spin" />
                                    <span className="text-sm">Loading transactions...</span>
                                </div>
                            </div>
                        ) : entriesWithBalance.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                <svg className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <p className="text-sm">No transactions found</p>
                            </div>
                        ) : (
                            <>
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-200 bg-slate-50">
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Date</th>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Description</th>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Job #</th>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Bill #</th>
                                                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-700">Payable</th>
                                                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-700">Paid</th>
                                                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-700">Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {entriesWithBalance.map((entry) => (
                                                <tr
                                                    key={entry.id}
                                                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150 cursor-pointer"
                                                    onClick={() => setDetailEntry(entry)}
                                                >
                                                    <td className="px-4 py-3 text-sm text-slate-700">{entry.date}</td>
                                                    <td className="px-4 py-3 text-sm text-slate-700">{entry.description}</td>
                                                    <td className="px-4 py-3 text-sm font-medium text-primary">{entry.jobNumber || '-'}</td>
                                                    <td className="px-4 py-3 text-sm text-slate-700">{entry.invoiceNumber}</td>
                                                    <td className="px-4 py-3 text-sm text-right font-medium text-rose-600">
                                                        {entry.outstanding > 0 ? formatCurrencyValue(entry.outstanding, displayCurrency) : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right font-medium text-emerald-600">
                                                        {entry.paid > 0 ? formatCurrencyValue(entry.paid, displayCurrency) : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right font-semibold text-slate-900">
                                                        {formatCurrencyValue(entry.balance, displayCurrency)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="md:hidden space-y-3">
                            {entriesWithBalance.map((entry) => (
                                <div
                                    key={entry.id}
                                    className="bg-white border border-slate-200 rounded-lg p-4 cursor-pointer"
                                    onClick={() => setDetailEntry(entry)}
                                >
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <div className="text-sm font-semibold text-slate-900 mb-1">{entry.description}</div>
                                                    <div className="text-xs text-slate-500">{entry.date}</div>
                                                </div>
                                                <div className="text-sm font-bold text-slate-900">
                                                    {formatCurrencyValue(entry.balance, displayCurrency)}
                                                </div>
                                            </div>
                                            <div className="space-y-1.5 text-xs">
                                                {(entry.invoiceNumber || entry.jobNumber) && (
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-500">Reference:</span>
                                                        <span className="text-primary font-medium">{entry.invoiceNumber || entry.jobNumber}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between pt-2 border-t border-slate-100">
                                                    <span className="text-rose-600 font-medium">
                                                        Payable:{' '}
                                                        {entry.outstanding > 0 ? formatCurrencyValue(entry.outstanding, displayCurrency) : '-'}
                                                    </span>
                                                    <span className="text-emerald-600 font-medium">
                                                        Paid:{' '}
                                                        {entry.paid > 0 ? formatCurrencyValue(entry.paid, displayCurrency) : '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}

            {!selectedVendorId && (
                <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-slate-400">
                    <svg className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <p className="text-sm">Please select a vendor to view their ledger</p>
                </div>
            )}
            {detailEntry && (
                <DetailDialog
                    title={`Vendor Entry • ${detailEntry.invoiceNumber || detailEntry.description}`}
                    onClose={() => setDetailEntry(null)}
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <LedgerDetailInfo label="Date" value={detailEntry.date} />
                            <LedgerDetailInfo label="Vendor" value={detailEntry.partyName} />
                            <LedgerDetailInfo label="Status" value={detailEntry.status} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <LedgerDetailInfo label="Invoice #" value={detailEntry.invoiceNumber || '—'} />
                            <LedgerDetailInfo label="Job #" value={detailEntry.jobNumber || '—'} />
                            <LedgerDetailInfo label="Description" value={detailEntry.description || '—'} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <LedgerDetailInfo
                                label="Payable"
                                value={detailEntry.outstanding > 0 ? formatCurrencyValue(detailEntry.outstanding, displayCurrency) : '—'}
                            />
                            <LedgerDetailInfo
                                label="Paid"
                                value={detailEntry.paid > 0 ? formatCurrencyValue(detailEntry.paid, displayCurrency) : '—'}
                            />
                            <LedgerDetailInfo
                                label="Balance"
                                value={formatCurrencyValue(detailEntry.balance, displayCurrency)}
                            />
                        </div>
                    </div>
                </DetailDialog>
            )}
        </div>
    );
}

type LedgerDetailInfoProps = {
    label: string;
    value?: string;
};

function LedgerDetailInfo({ label, value }: LedgerDetailInfoProps) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 mb-0.5">{label}</p>
            <p className="text-sm font-medium text-slate-900 break-words">{value || '—'}</p>
        </div>
    );
}
