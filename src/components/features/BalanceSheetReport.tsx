// Balance Sheet Component
'use client';

import { useState, useEffect, useCallback } from 'react';
import { BalanceSheetData } from '@/models/financials';
import { generateBalanceSheet } from '@/services/financials';
import FeatureHeader from '@/components/ui/FeatureHeader';

export default function BalanceSheetReport() {
    const [statement, setStatement] = useState<BalanceSheetData | null>(null);
    const [loading, setLoading] = useState(false);
    const [asOfDate, setAsOfDate] = useState('');

    useEffect(() => {
        // Set default date (today)
        const today = new Date().toISOString().split('T')[0];
        setAsOfDate(today);
    }, []);

    const loadStatement = useCallback(async (targetDate: string) => {
        if (!targetDate) return;

        try {
            setLoading(true);
            const data = await generateBalanceSheet(targetDate);
            setStatement(data);
        } catch (error) {
            console.error('Failed to load balance sheet', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (asOfDate) {
            void loadStatement(asOfDate);
        }
    }, [asOfDate, loadStatement]);

    const formatCurrency = (amount: number) => {
        return `$${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const isBalanced = statement
        ? Math.abs(statement.assets.totalAssets - statement.totalLiabilitiesAndEquity) < 0.01
        : false;

    return (
        <div className="h-full min-h-[60vh] md:min-h-full rounded-xl border border-slate-200 bg-white flex flex-col">
            <FeatureHeader
                title="Balance Sheet"
                icon={
                    <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' />
                    </svg>
                }
            />

            <div className="border-b border-slate-100 px-4 py-3 bg-slate-50">
                <div className="flex flex-col md:flex-row gap-3 items-center md:items-end justify-center max-w-lg mx-auto text-center">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-slate-700 mb-2">As of Date</label>
                        <input
                            type="date"
                            value={asOfDate}
                            onChange={(e) => setAsOfDate(e.target.value)}
                            className="w-full rounded-lg border-2 border-input bg-white px-4 py-2 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                        />
                    </div>
                    <button
                        onClick={() => loadStatement(asOfDate)}
                        className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary-hover active:scale-95 transition-all duration-200 cursor-pointer"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="flex items-center gap-3 text-slate-500">
                            <div className="h-5 w-5 border-2 border-slate-300 border-t-primary rounded-full animate-spin" />
                            <span className="text-sm">Generating statement...</span>
                        </div>
                    </div>
                ) : !statement ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <svg className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm">Select a date to generate the balance sheet</p>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto space-y-4">
                        {/* Header */}
                        <div className="text-center pb-4 border-b border-slate-200">
                            <h2 className="text-xl font-bold text-slate-900 mb-1">Balance Sheet</h2>
                            <p className="text-sm text-slate-600">
                                As of {new Date(asOfDate).toLocaleDateString()}
                            </p>
                            {isBalanced && (
                                <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Balanced
                                </div>
                            )}
                        </div>

                        {/* Assets */}
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <h3 className="text-sm font-semibold text-blue-900 mb-2">Assets</h3>

                            {/* Current Assets */}
                            <div className="mb-3">
                                <p className="text-xs font-medium text-blue-800 mb-1.5">Current Assets</p>
                                <div className="space-y-1 text-sm pl-3">
                                    {statement.assets.currentAssets.cash > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-blue-700">Cash and Cash Equivalents</span>
                                            <span className="font-medium text-blue-900">{formatCurrency(statement.assets.currentAssets.cash)}</span>
                                        </div>
                                    )}
                                    {statement.assets.currentAssets.accountsReceivable > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-blue-700">Accounts Receivable</span>
                                            <span className="font-medium text-blue-900">{formatCurrency(statement.assets.currentAssets.accountsReceivable)}</span>
                                        </div>
                                    )}
                                    {statement.assets.currentAssets.inventory > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-blue-700">Inventory</span>
                                            <span className="font-medium text-blue-900">{formatCurrency(statement.assets.currentAssets.inventory)}</span>
                                        </div>
                                    )}
                                    {statement.assets.currentAssets.prepaidExpenses > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-blue-700">Prepaid Expenses</span>
                                            <span className="font-medium text-blue-900">{formatCurrency(statement.assets.currentAssets.prepaidExpenses)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between pt-1 border-t border-blue-300 font-semibold">
                                        <span className="text-blue-900">Total Current Assets</span>
                                        <span className="text-blue-900">{formatCurrency(statement.assets.currentAssets.total)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Fixed Assets */}
                            {statement.assets.fixedAssets.net > 0 && (
                                <div className="mb-3">
                                    <p className="text-xs font-medium text-blue-800 mb-1.5">Fixed Assets</p>
                                    <div className="space-y-1 text-sm pl-3">
                                        <div className="flex justify-between">
                                            <span className="text-blue-700">Property, Plant & Equipment</span>
                                            <span className="font-medium text-blue-900">{formatCurrency(statement.assets.fixedAssets.propertyPlantEquipment)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-blue-700">Less: Accumulated Depreciation</span>
                                            <span className="font-medium text-blue-900">{formatCurrency(statement.assets.fixedAssets.accumulatedDepreciation)}</span>
                                        </div>
                                        <div className="flex justify-between pt-1 border-t border-blue-300 font-semibold">
                                            <span className="text-blue-900">Net Fixed Assets</span>
                                            <span className="text-blue-900">{formatCurrency(statement.assets.fixedAssets.net)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Total Assets */}
                            <div className="flex justify-between pt-2 border-t-2 border-blue-400 font-bold">
                                <span className="text-blue-900">Total Assets</span>
                                <span className="text-blue-900">{formatCurrency(statement.assets.totalAssets)}</span>
                            </div>
                        </div>

                        {/* Liabilities */}
                        <div className="bg-rose-50 rounded-lg p-4 border border-rose-200">
                            <h3 className="text-sm font-semibold text-rose-900 mb-2">Liabilities</h3>

                            {/* Current Liabilities */}
                            <div className="mb-3">
                                <p className="text-xs font-medium text-rose-800 mb-1.5">Current Liabilities</p>
                                <div className="space-y-1 text-sm pl-3">
                                    {statement.liabilities.currentLiabilities.accountsPayable > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-rose-700">Accounts Payable</span>
                                            <span className="font-medium text-rose-900">{formatCurrency(statement.liabilities.currentLiabilities.accountsPayable)}</span>
                                        </div>
                                    )}
                                    {statement.liabilities.currentLiabilities.accruedExpenses > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-rose-700">Accrued Expenses</span>
                                            <span className="font-medium text-rose-900">{formatCurrency(statement.liabilities.currentLiabilities.accruedExpenses)}</span>
                                        </div>
                                    )}
                                    {statement.liabilities.currentLiabilities.shortTermDebt > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-rose-700">Short-term Debt</span>
                                            <span className="font-medium text-rose-900">{formatCurrency(statement.liabilities.currentLiabilities.shortTermDebt)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between pt-1 border-t border-rose-300 font-semibold">
                                        <span className="text-rose-900">Total Current Liabilities</span>
                                        <span className="text-rose-900">{formatCurrency(statement.liabilities.currentLiabilities.total)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Long-term Liabilities */}
                            {statement.liabilities.longTermLiabilities.total > 0 && (
                                <div className="mb-3">
                                    <p className="text-xs font-medium text-rose-800 mb-1.5">Long-term Liabilities</p>
                                    <div className="space-y-1 text-sm pl-3">
                                        {statement.liabilities.longTermLiabilities.longTermDebt > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-rose-700">Long-term Debt</span>
                                                <span className="font-medium text-rose-900">{formatCurrency(statement.liabilities.longTermLiabilities.longTermDebt)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between pt-1 border-t border-rose-300 font-semibold">
                                            <span className="text-rose-900">Total Long-term Liabilities</span>
                                            <span className="text-rose-900">{formatCurrency(statement.liabilities.longTermLiabilities.total)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Total Liabilities */}
                            <div className="flex justify-between pt-2 border-t-2 border-rose-400 font-bold">
                                <span className="text-rose-900">Total Liabilities</span>
                                <span className="text-rose-900">{formatCurrency(statement.liabilities.totalLiabilities)}</span>
                            </div>
                        </div>

                        {/* Equity */}
                        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                            <h3 className="text-sm font-semibold text-emerald-900 mb-2">Equity</h3>
                            <div className="space-y-1.5 text-sm">
                                {statement.equity.ownersEquity > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-emerald-700">Owner&apos;s Equity</span>
                                        <span className="font-medium text-emerald-900">{formatCurrency(statement.equity.ownersEquity)}</span>
                                    </div>
                                )}
                                {statement.equity.retainedEarnings > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-emerald-700">Retained Earnings</span>
                                        <span className="font-medium text-emerald-900">{formatCurrency(statement.equity.retainedEarnings)}</span>
                                    </div>
                                )}
                                {statement.equity.currentYearEarnings !== 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-emerald-700">Current Year Earnings</span>
                                        <span className="font-medium text-emerald-900">{formatCurrency(statement.equity.currentYearEarnings)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between pt-2 border-t-2 border-emerald-400 font-bold">
                                    <span className="text-emerald-900">Total Equity</span>
                                    <span className="text-emerald-900">{formatCurrency(statement.equity.totalEquity)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Total Liabilities + Equity */}
                        <div className="bg-gradient-to-br from-slate-100 to-slate-50 rounded-lg p-6 border-2 border-slate-300">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                <div>
                                    <h3 className="text-base font-semibold text-slate-900 mb-1">Total Liabilities + Equity</h3>
                                    <p className="text-xs text-slate-600">
                                        {isBalanced ? 'Assets = Liabilities + Equity (balanced)' : 'Balance check required'}
                                    </p>
                                </div>
                                <div className="text-3xl font-bold text-slate-900">
                                    {formatCurrency(statement.totalLiabilitiesAndEquity)}
                                </div>
                            </div>
                        </div>

                        {/* Financial Ratios */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white rounded-lg border border-slate-200 p-4">
                                <div className="text-xs text-slate-500 mb-1">Debt-to-Equity</div>
                                <div className="text-xl font-bold text-slate-900">
                                    {statement.equity.totalEquity > 0
                                        ? (statement.liabilities.totalLiabilities / statement.equity.totalEquity).toFixed(2)
                                        : 'N/A'}
                                </div>
                            </div>
                            <div className="bg-white rounded-lg border border-slate-200 p-4">
                                <div className="text-xs text-slate-500 mb-1">Total Assets</div>
                                <div className="text-xl font-bold text-primary">{formatCurrency(statement.assets.totalAssets)}</div>
                            </div>
                            <div className="bg-white rounded-lg border border-slate-200 p-4">
                                <div className="text-xs text-slate-500 mb-1">Net Worth</div>
                                <div className="text-xl font-bold text-emerald-600">{formatCurrency(statement.equity.totalEquity)}</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
