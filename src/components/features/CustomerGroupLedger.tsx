// Customer Group Ledger Component
'use client';

import { useState, useEffect } from 'react';
import { LedgerEntry } from '@/models/ledger';
import { listLedgerEntries } from '@/services/ledger';
import { listCustomers } from '@/services/customers';
import { CustomerProfile } from '@/models/profiles';
import FeatureHeader from '@/components/ui/FeatureHeader';

export default function CustomerGroupLedger() {
    const [customers, setCustomers] = useState<CustomerProfile[]>([]);
    const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
    const [filteredEntries, setFilteredEntries] = useState<LedgerEntry[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [customersData, ledgerData] = await Promise.all([
                listCustomers(),
                listLedgerEntries(),
            ]);
            setCustomers(customersData);
            setLedgerEntries(ledgerData.filter((entry) => entry.customerId)); // Only customer entries
        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedCustomerId === 'all') {
            setFilteredEntries(ledgerEntries);
        } else {
            setFilteredEntries(ledgerEntries.filter((e) => e.customerId === selectedCustomerId));
        }
    }, [selectedCustomerId, ledgerEntries]);

    // Calculate statistics
    const stats = {
        totalDebit: filteredEntries.reduce((sum, e) => sum + e.debit, 0),
        totalCredit: filteredEntries.reduce((sum, e) => sum + e.credit, 0),
        netBalance: 0,
        outstanding: 0,
    };
    stats.netBalance = stats.totalDebit - stats.totalCredit;
    stats.outstanding = stats.netBalance > 0 ? stats.netBalance : 0;

    // Calculate running balance
    const entriesWithBalance = [...filteredEntries]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((entry, index, arr) => {
            const previousBalance = index > 0 ? arr[index - 1].balance : 0;
            const balance = previousBalance + entry.debit - entry.credit;
            return { ...entry, balance };
        });

    return (
        <div className="h-full min-h-[60vh] md:min-h-full rounded-xl border border-slate-200 bg-white flex flex-col">
            <FeatureHeader
                title="Customer Group Ledger"
                icon={
                    <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' />
                    </svg>
                }
            />

            <div className="border-b border-slate-100 px-4 py-3 bg-slate-50">
                <div className="max-w-md">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Select Customer
                    </label>
                    <select
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                        className="w-full rounded-lg border-2 border-input bg-white px-4 py-2 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                    >
                        <option value="all">All Customers</option>
                        {customers.map((customer) => (
                            <option key={customer.id} value={customer.id}>
                                {customer.customerName}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="border-b border-slate-100 px-4 py-4 bg-gradient-to-br from-slate-50 to-white">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white rounded-lg border border-slate-200 p-3 md:p-4">
                        <div className="text-xs text-slate-500 mb-1">Total Debit</div>
                        <div className="text-xl md:text-2xl font-bold text-rose-600">
                            ${stats.totalDebit.toLocaleString()}
                        </div>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 p-3 md:p-4">
                        <div className="text-xs text-slate-500 mb-1">Total Credit</div>
                        <div className="text-xl md:text-2xl font-bold text-emerald-600">
                            ${stats.totalCredit.toLocaleString()}
                        </div>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 p-3 md:p-4">
                        <div className="text-xs text-slate-500 mb-1">Net Balance</div>
                        <div className={`text-xl md:text-2xl font-bold ${stats.netBalance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                            ${Math.abs(stats.netBalance).toLocaleString()}
                        </div>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 p-3 md:p-4">
                        <div className="text-xs text-slate-500 mb-1">Outstanding</div>
                        <div className="text-xl md:text-2xl font-bold text-primary">
                            ${stats.outstanding.toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="flex items-center gap-3 text-slate-500">
                            <div className="h-5 w-5 border-2 border-slate-300 border-t-primary rounded-full animate-spin" />
                            <span className="text-sm">Loading ledger...</span>
                        </div>
                    </div>
                ) : entriesWithBalance.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <svg className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p className="text-sm">No ledger entries found</p>
                    </div>
                ) : (
                    <>
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50">
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Date</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Customer</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Job #</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Description</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Invoice #</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-700">Debit</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-700">Credit</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-700">Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entriesWithBalance.map((entry) => (
                                        <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150">
                                            <td className="px-4 py-3 text-sm text-slate-700">{entry.date}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{entry.customerName}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-primary">{entry.jobNumber || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{entry.description}</td>
                                            <td className="px-4 py-3 text-sm text-slate-700">{entry.invoiceNumber || '-'}</td>
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
                                            <div className="text-sm font-semibold text-slate-900 mb-1">{entry.customerName}</div>
                                            <div className="text-xs text-slate-500">{entry.date}</div>
                                        </div>
                                        <div className="text-sm font-bold text-slate-900">
                                            ${entry.balance.toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 text-xs">
                                        <div className="text-slate-700">{entry.description}</div>
                                        {entry.jobNumber && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Job #:</span>
                                                <span className="text-primary font-medium">{entry.jobNumber}</span>
                                            </div>
                                        )}
                                        {entry.invoiceNumber && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Invoice #:</span>
                                                <span className="text-slate-700">{entry.invoiceNumber}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between pt-2 border-t border-slate-100">
                                            <span className="text-rose-600 font-medium">
                                                Debit: {entry.debit > 0 ? `$${entry.debit.toLocaleString()}` : '-'}
                                            </span>
                                            <span className="text-emerald-600 font-medium">
                                                Credit: {entry.credit > 0 ? `$${entry.credit.toLocaleString()}` : '-'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
