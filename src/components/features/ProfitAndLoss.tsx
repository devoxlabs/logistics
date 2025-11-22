// Profit & Loss Statement Component
'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProfitLossData } from '@/models/financials';
import { generateProfitLoss } from '@/services/financials';
import FeatureHeader from '@/components/ui/FeatureHeader';

export default function ProfitAndLoss() {
    const [statement, setStatement] = useState<ProfitLossData | null>(null);
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        // Set default dates (current month)
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        setStartDate(firstDay.toISOString().split('T')[0]);
        setEndDate(lastDay.toISOString().split('T')[0]);
    }, []);

    const loadStatement = useCallback(async () => {
        if (!startDate || !endDate) return;

        try {
            setLoading(true);
            const data = await generateProfitLoss(startDate, endDate);
            setStatement(data);
        } catch (error) {
            console.error('Failed to load P&L statement', error);
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        if (startDate && endDate) {
            void loadStatement();
        }
    }, [startDate, endDate, loadStatement]);

    const formatCurrency = (amount: number) => {
        return `$${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <div className="h-full min-h-[60vh] md:min-h-full rounded-xl border border-slate-200 bg-white flex flex-col">
            <FeatureHeader
                title="Profit & Loss Statement"
                icon={
                    <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                    </svg>
                }
            />

            <div className="border-b border-slate-100 px-4 py-3 bg-slate-50">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                    <div className="col-span-2 sm:col-span-1">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full rounded-lg border-2 border-input bg-white px-4 py-2 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                        />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                        <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full rounded-lg border-2 border-input bg-white px-4 py-2 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                        />
                    </div>
                    <button
                        onClick={loadStatement}
                        className="col-span-2 lg:col-span-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary-hover active:scale-95 transition-all duration-200 cursor-pointer"
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className="text-sm">Select a date range to generate the statement</p>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto space-y-4">
                        {/* Header */}
                        <div className="text-center pb-4 border-b border-slate-200">
                            <h2 className="text-xl font-bold text-slate-900 mb-1">Profit & Loss Statement</h2>
                            <p className="text-sm text-slate-600">
                                For the period: {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
                            </p>
                        </div>

                        {/* Revenue */}
                        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                            <h3 className="text-sm font-semibold text-emerald-900 mb-2">Revenue</h3>
                            <div className="space-y-1.5 text-sm">
                                {statement.revenue.serviceRevenue > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-emerald-700">Service Revenue</span>
                                        <span className="font-medium text-emerald-900">{formatCurrency(statement.revenue.serviceRevenue)}</span>
                                    </div>
                                )}
                                {statement.revenue.freightRevenue > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-emerald-700">Freight Revenue</span>
                                        <span className="font-medium text-emerald-900">{formatCurrency(statement.revenue.freightRevenue)}</span>
                                    </div>
                                )}
                                {statement.revenue.otherIncome > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-emerald-700">Other Income</span>
                                        <span className="font-medium text-emerald-900">{formatCurrency(statement.revenue.otherIncome)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between pt-2 border-t border-emerald-300 font-bold">
                                    <span className="text-emerald-900">Total Revenue</span>
                                    <span className="text-emerald-900">{formatCurrency(statement.revenue.total)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Cost of Services */}
                        {statement.costOfServices.total > 0 && (
                            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                <h3 className="text-sm font-semibold text-slate-800 mb-2">Cost of Services</h3>
                                <div className="space-y-1.5 text-sm">
                                    {statement.costOfServices.freightCosts > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-700">Freight Costs</span>
                                            <span className="font-medium text-slate-900">{formatCurrency(statement.costOfServices.freightCosts)}</span>
                                        </div>
                                    )}
                                    {statement.costOfServices.handlingCosts > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-700">Handling Costs</span>
                                            <span className="font-medium text-slate-900">{formatCurrency(statement.costOfServices.handlingCosts)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between pt-2 border-t border-slate-300 font-bold">
                                        <span className="text-slate-900">Total Cost of Services</span>
                                        <span className="text-slate-900">{formatCurrency(statement.costOfServices.total)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Gross Profit */}
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <div className="flex justify-between items-center">
                                <div>
                                    <span className="text-sm font-semibold text-blue-900">Gross Profit</span>
                                    <p className="text-xs text-blue-700 mt-0.5">Margin: {statement.grossMargin.toFixed(1)}%</p>
                                </div>
                                <span className="text-lg font-bold text-blue-900">{formatCurrency(statement.grossProfit)}</span>
                            </div>
                        </div>

                        {/* Operating Expenses */}
                        {statement.operatingExpenses.total > 0 && (
                            <div className="bg-rose-50 rounded-lg p-4 border border-rose-200">
                                <h3 className="text-sm font-semibold text-rose-900 mb-2">Operating Expenses</h3>
                                <div className="space-y-1.5 text-sm">
                                    {statement.operatingExpenses.salaries > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-rose-700">Salaries and Wages</span>
                                            <span className="font-medium text-rose-900">{formatCurrency(statement.operatingExpenses.salaries)}</span>
                                        </div>
                                    )}
                                    {statement.operatingExpenses.rent > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-rose-700">Rent</span>
                                            <span className="font-medium text-rose-900">{formatCurrency(statement.operatingExpenses.rent)}</span>
                                        </div>
                                    )}
                                    {statement.operatingExpenses.utilities > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-rose-700">Utilities</span>
                                            <span className="font-medium text-rose-900">{formatCurrency(statement.operatingExpenses.utilities)}</span>
                                        </div>
                                    )}
                                    {statement.operatingExpenses.insurance > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-rose-700">Insurance</span>
                                            <span className="font-medium text-rose-900">{formatCurrency(statement.operatingExpenses.insurance)}</span>
                                        </div>
                                    )}
                                    {statement.operatingExpenses.depreciation > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-rose-700">Depreciation</span>
                                            <span className="font-medium text-rose-900">{formatCurrency(statement.operatingExpenses.depreciation)}</span>
                                        </div>
                                    )}
                                    {statement.operatingExpenses.marketing > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-rose-700">Marketing</span>
                                            <span className="font-medium text-rose-900">{formatCurrency(statement.operatingExpenses.marketing)}</span>
                                        </div>
                                    )}
                                    {statement.operatingExpenses.administrative > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-rose-700">Administrative</span>
                                            <span className="font-medium text-rose-900">{formatCurrency(statement.operatingExpenses.administrative)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between pt-2 border-t border-rose-300 font-bold">
                                        <span className="text-rose-900">Total Operating Expenses</span>
                                        <span className="text-rose-900">{formatCurrency(statement.operatingExpenses.total)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Net Income */}
                        <div className="bg-gradient-to-br from-slate-100 to-slate-50 rounded-lg p-6 border-2 border-slate-300">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                <div>
                                    <h3 className="text-base font-semibold text-slate-900 mb-1">Net Income</h3>
                                    <p className="text-xs text-slate-600">
                                        {statement.netIncome >= 0 ? 'Profit' : 'Loss'} • {statement.netMargin.toFixed(1)}% of Revenue
                                    </p>
                                </div>
                                <div className={`text-3xl font-bold ${statement.netIncome >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {statement.netIncome >= 0 ? '+' : ''}{formatCurrency(statement.netIncome)}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
