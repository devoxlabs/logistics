// Vendor Ledger - Individual Vendor Account Statement
'use client';

import { useState, useEffect } from 'react';
import { LedgerEntry } from '@/models/ledger';
import { listVendorLedgerEntries } from '@/services/ledger';
import { listVendors } from '@/services/vendors';
import { VendorProfile } from '@/models/profiles';
import FeatureHeader from '@/components/ui/FeatureHeader';

export default function VendorLedger() {
    const [vendors, setVendors] = useState<VendorProfile[]>([]);
    const [selectedVendorId, setSelectedVendorId] = useState('');
    const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadVendors();
    }, []);

    useEffect(() => {
        if (!selectedVendorId) return;

        const fetchLedger = async () => {
            try {
                setLoading(true);
                const data = await listVendorLedgerEntries(selectedVendorId);
                setLedgerEntries(data);
            } catch (error) {
                console.error('Failed to load ledger', error);
            } finally {
                setLoading(false);
            }
        };

        void fetchLedger();
    }, [selectedVendorId]);

    const loadVendors = async () => {
        try {
            const data = await listVendors();
            setVendors(data);
        } catch (error) {
            console.error('Failed to load vendors', error);
        }
    };

    const selectedVendor = vendors.find((v) => v.id === selectedVendorId);

    // Calculate running balance
    const entriesWithBalance = [...ledgerEntries]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((entry, index, arr) => {
            const previousBalance = index > 0 ? arr[index - 1].balance : 0;
            const balance = previousBalance + entry.debit - entry.credit;
            return { ...entry, balance };
        });

    const stats = {
        totalDebit: ledgerEntries.reduce((sum, e) => sum + e.debit, 0),
        totalCredit: ledgerEntries.reduce((sum, e) => sum + e.credit, 0),
        balance: 0,
    };
    stats.balance = stats.totalDebit - stats.totalCredit;

    return (
        <div className="h-full min-h-[60vh] md:min-h-full rounded-xl border border-slate-200 bg-white flex flex-col">
            <FeatureHeader
                title="Vendor Ledger"
                icon={
                    <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' />
                    </svg>
                }
            />

            <div className="border-b border-slate-100 px-4 py-3 bg-slate-50">
                <div className="max-w-md">
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
                                <div className="text-lg font-bold text-rose-600">${stats.totalDebit.toLocaleString()}</div>
                            </div>
                            <div className="bg-white rounded-lg border border-slate-200 p-3">
                                <div className="text-xs text-slate-500 mb-1">Total Paid</div>
                                <div className="text-lg font-bold text-emerald-600">${stats.totalCredit.toLocaleString()}</div>
                            </div>
                            <div className="bg-white rounded-lg border border-slate-200 p-3">
                                <div className="text-xs text-slate-500 mb-1">Balance Due</div>
                                <div className={`text-lg font-bold ${stats.balance >= 0 ? 'text-slate-900' : 'text-emerald-600'}`}>
                                    ${Math.abs(stats.balance).toLocaleString()}
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
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Reference</th>
                                                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-700">Payable</th>
                                                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-700">Paid</th>
                                                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-700">Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {entriesWithBalance.map((entry) => (
                                                <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150">
                                                    <td className="px-4 py-3 text-sm text-slate-700">{entry.date}</td>
                                                    <td className="px-4 py-3 text-sm text-slate-700">{entry.description}</td>
                                                    <td className="px-4 py-3 text-sm font-medium text-primary">{entry.invoiceNumber || entry.jobNumber || '-'}</td>
                                                    <td className="px-4 py-3 text-sm text-right font-medium text-rose-600">
                                                        {entry.debit > 0 ? `$${entry.debit.toLocaleString()}` : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right font-medium text-emerald-600">
                                                        {entry.credit > 0 ? `$${entry.credit.toLocaleString()}` : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right font-semibold text-slate-900">
                                                        ${entry.balance.toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="md:hidden space-y-3">
                                    {entriesWithBalance.map((entry) => (
                                        <div key={entry.id} className="bg-white border border-slate-200 rounded-lg p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <div className="text-sm font-semibold text-slate-900 mb-1">{entry.description}</div>
                                                    <div className="text-xs text-slate-500">{entry.date}</div>
                                                </div>
                                                <div className="text-sm font-bold text-slate-900">${entry.balance.toLocaleString()}</div>
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
                                                        Payable: {entry.debit > 0 ? `$${entry.debit.toLocaleString()}` : '-'}
                                                    </span>
                                                    <span className="text-emerald-600 font-medium">
                                                        Paid: {entry.credit > 0 ? `$${entry.credit.toLocaleString()}` : '-'}
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
        </div>
    );
}
