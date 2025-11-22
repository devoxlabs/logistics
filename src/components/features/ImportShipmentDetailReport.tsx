// Import Shipment Detail Report Component
'use client';

import { useState, useEffect } from 'react';
import { ImportShipment } from '@/models/shipments';
import { listImportShipments } from '@/services/shipments';
import FeatureHeader from '@/components/ui/FeatureHeader';
import { convertCurrency, formatCurrencyValue, getCurrencyOptions } from '@/lib/currency';
import DetailDialog from '@/components/ui/DetailDialog';

export default function ImportShipmentDetailReport() {
    const [shipments, setShipments] = useState<ImportShipment[]>([]);
    const [filteredShipments, setFilteredShipments] = useState<ImportShipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [displayCurrency, setDisplayCurrency] = useState('USD');
    const [detailShipment, setDetailShipment] = useState<ImportShipment | null>(null);

    useEffect(() => {
        loadShipments();
    }, []);

    useEffect(() => {
        let filtered = [...shipments];

        if (statusFilter !== 'all') {
            filtered = filtered.filter((s) => s.status === statusFilter);
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (s) =>
                    s.jobNumber.toLowerCase().includes(term) ||
                    s.billOfLading.toLowerCase().includes(term) ||
                    s.containerNumber.toLowerCase().includes(term) ||
                    s.customerName.toLowerCase().includes(term)
            );
        }

        setFilteredShipments(filtered);
    }, [searchTerm, statusFilter, shipments]);

    const loadShipments = async () => {
        try {
            setLoading(true);
            const data = await listImportShipments();
            setShipments(data);
        } catch (error) {
            console.error('Failed to load shipments', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            Booked: 'bg-blue-100 text-blue-700 border-blue-200',
            'In Transit': 'bg-purple-100 text-purple-700 border-purple-200',
            Arrived: 'bg-green-100 text-green-700 border-green-200',
            'Customs Clearance': 'bg-yellow-100 text-yellow-700 border-yellow-200',
            Released: 'bg-teal-100 text-teal-700 border-teal-200',
            Delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        };
        return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
    };

    const parseCharge = (value: string) => parseFloat(value || '0') || 0;
    const convertCharge = (value: string, currency: string) =>
        convertCurrency(parseCharge(value), currency || 'USD', displayCurrency);

    // Calculate statistics
    const stats = {
        total: shipments.length,
        inTransit: shipments.filter((s) => s.status === 'In Transit').length,
        delivered: shipments.filter((s) => s.status === 'Delivered').length,
        totalCharges: filteredShipments.reduce(
            (sum, s) => sum + convertCharge(s.totalCharges || '0', s.currency || 'USD'),
            0
        ),
    };

    return (
        <div className="h-full min-h-[60vh] md:min-h-full rounded-xl border border-slate-200 bg-white flex flex-col">
            <FeatureHeader
                title="Import Shipment Detail Report"
                icon={
                    <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' />
                    </svg>
                }
            />

            {/* Filters */}
            <div className="border-b border-slate-100 px-4 py-3 bg-slate-50">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search by Job #, B/L, Container, or Customer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-lg border-2 border-input bg-white px-4 py-2 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full rounded-lg border-2 border-input bg-white px-4 py-2 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                        >
                            <option value="all">All Status</option>
                            <option value="Booked">Booked</option>
                            <option value="In Transit">In Transit</option>
                            <option value="Arrived">Arrived</option>
                            <option value="Customs Clearance">Customs Clearance</option>
                            <option value="Released">Released</option>
                            <option value="Delivered">Delivered</option>
                        </select>
                    </div>
                    <div className="w-full md:w-48">
                        <select
                            value={displayCurrency}
                            onChange={(e) => setDisplayCurrency(e.target.value)}
                            className="w-full rounded-lg border-2 border-input bg-white px-4 py-2 text-sm hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                        >
                            {getCurrencyOptions().map((option) => (
                                <option key={option.value} value={option.value}>
                                    Display in {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="border-b border-slate-100 px-4 py-4 bg-gradient-to-br from-slate-50 to-white">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white rounded-lg border border-slate-200 p-3 md:p-4">
                        <div className="text-xs text-slate-500 mb-1">Total Jobs</div>
                        <div className="text-xl md:text-2xl font-bold text-slate-900">{stats.total}</div>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 p-3 md:p-4">
                        <div className="text-xs text-slate-500 mb-1">In Transit</div>
                        <div className="text-xl md:text-2xl font-bold text-purple-600">{stats.inTransit}</div>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 p-3 md:p-4">
                        <div className="text-xs text-slate-500 mb-1">Delivered</div>
                        <div className="text-xl md:text-2xl font-bold text-emerald-600">{stats.delivered}</div>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 p-3 md:p-4">
                        <div className="text-xs text-slate-500 mb-1">Total Charges</div>
                        <div className="text-xl md:text-2xl font-bold text-primary">
                            {formatCurrencyValue(stats.totalCharges, displayCurrency)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Table/List */}
            <div className="flex-1 overflow-auto p-4">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="flex items-center gap-3 text-slate-500">
                            <div className="h-5 w-5 border-2 border-slate-300 border-t-primary rounded-full animate-spin" />
                            <span className="text-sm">Loading shipments...</span>
                        </div>
                    </div>
                ) : filteredShipments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <svg className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        <p className="text-sm">No shipments found</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50">
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">
                                            Job #
                                        </th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">
                                            B/L
                                        </th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">
                                            Customer
                                        </th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">
                                            Vessel
                                        </th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">
                                            ETA
                                        </th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">
                                            Status
                                        </th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-700">
                                            Charges
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredShipments.map((shipment) => (
                                        <tr
                                            key={shipment.id}
                                            className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150 cursor-pointer"
                                            onClick={() => setDetailShipment(shipment)}
                                        >
                                            <td className="px-4 py-3 text-sm font-medium text-primary">
                                                {shipment.jobNumber}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-700">
                                                {shipment.billOfLading}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-700">
                                                {shipment.customerName}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-700">
                                                {shipment.vesselName || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-700">
                                                {shipment.eta || '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(shipment.status)}`}>
                                                    {shipment.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right font-medium text-slate-900">
                                                {formatCurrencyValue(
                                                    convertCharge(shipment.totalCharges || '0', shipment.currency || 'USD'),
                                                    displayCurrency
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-3">
                            {filteredShipments.map((shipment) => (
                                <div
                                    key={shipment.id}
                                    className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer"
                                    onClick={() => setDetailShipment(shipment)}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <div className="text-sm font-semibold text-primary mb-1">{shipment.jobNumber}</div>
                                            <div className="text-xs text-slate-600">{shipment.customerName}</div>
                                        </div>
                                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(shipment.status)}`}>
                                            {shipment.status}
                                        </span>
                                    </div>
                                    <div className="space-y-1.5 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">B/L:</span>
                                            <span className="text-slate-700 font-medium">{shipment.billOfLading}</span>
                                        </div>
                                        {shipment.vesselName && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Vessel:</span>
                                                <span className="text-slate-700">{shipment.vesselName}</span>
                                            </div>
                                        )}
                                        {shipment.eta && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">ETA:</span>
                                                <span className="text-slate-700">{shipment.eta}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between pt-2 border-t border-slate-100">
                                            <span className="text-slate-500">Charges:</span>
                                            <span className="text-slate-900 font-semibold">
                                                {formatCurrencyValue(
                                                    convertCharge(shipment.totalCharges || '0', shipment.currency || 'USD'),
                                                    displayCurrency
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
            {detailShipment && (
                <DetailDialog
                    title={`Import Shipment • ${detailShipment.jobNumber || detailShipment.billOfLading || 'Details'}`}
                    onClose={() => setDetailShipment(null)}
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <DetailRow label="Customer" value={detailShipment.customerName} />
                            <DetailRow label="Job Number" value={detailShipment.jobNumber} />
                            <DetailRow label="Bill of Lading" value={detailShipment.billOfLading} />
                            <DetailRow label="Container" value={detailShipment.containerNumber || 'N/A'} />
                            <DetailRow label="Status" value={detailShipment.status} />
                            <DetailRow label="Mode" value={detailShipment.mode} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <DetailRow label="Port of Loading" value={detailShipment.portOfLoading} />
                            <DetailRow label="Port of Discharge" value={detailShipment.portOfDischarge} />
                            <DetailRow label="Delivery Date" value={detailShipment.deliveryDate || 'Pending'} />
                        </div>
                        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                            <h4 className="text-sm font-semibold text-slate-900 mb-3">Charges</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                <DetailRow
                                    label="Freight"
                                    value={formatCurrencyValue(parseFloat(detailShipment.freightCharges || '0') || 0, detailShipment.currency || 'USD')}
                                />
                                <DetailRow
                                    label="Insurance"
                                    value={formatCurrencyValue(parseFloat(detailShipment.insuranceCharges || '0') || 0, detailShipment.currency || 'USD')}
                                />
                                <DetailRow
                                    label="Customs Duty"
                                    value={formatCurrencyValue(parseFloat(detailShipment.customsDuty || '0') || 0, detailShipment.currency || 'USD')}
                                />
                                <DetailRow
                                    label="Logistic Charges"
                                    value={formatCurrencyValue(parseFloat(detailShipment.logisticCharges || '0') || 0, detailShipment.currency || 'USD')}
                                />
                                <DetailRow
                                    label="Other Charges"
                                    value={formatCurrencyValue(parseFloat(detailShipment.otherCharges || '0') || 0, detailShipment.currency || 'USD')}
                                />
                                <DetailRow
                                    label="Total"
                                    value={formatCurrencyValue(parseFloat(detailShipment.totalCharges || '0') || 0, detailShipment.currency || 'USD')}
                                />
                            </div>
                        </div>
                        {(detailShipment.specialInstructions || detailShipment.remarks) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {detailShipment.specialInstructions && (
                                    <div className="bg-white border border-slate-200 rounded-lg p-3">
                                        <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Instructions</p>
                                        <p className="text-sm text-slate-700">{detailShipment.specialInstructions}</p>
                                    </div>
                                )}
                                {detailShipment.remarks && (
                                    <div className="bg-white border border-slate-200 rounded-lg p-3">
                                        <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Remarks</p>
                                        <p className="text-sm text-slate-700">{detailShipment.remarks}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </DetailDialog>
            )}
        </div>
    );
}

type DetailRowProps = {
    label: string;
    value?: string;
};

function DetailRow({ label, value }: DetailRowProps) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 mb-0.5">{label}</p>
            <p className="text-sm font-medium text-slate-900 break-words">{value || '—'}</p>
        </div>
    );
}
