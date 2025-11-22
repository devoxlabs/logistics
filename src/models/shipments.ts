// Shipment models for import and export operations

export type ShipmentStatus =
    | 'Booked'
    | 'In Transit'
    | 'Arrived'
    | 'Customs Clearance'
    | 'Released'
    | 'Delivered';

export type ExportShipmentStatus =
    | 'Booked'
    | 'Documentation'
    | 'Loaded'
    | 'In Transit'
    | 'Arrived'
    | 'Delivered';

// Import Shipment Form Values
export type ImportShipmentFormValues = {
    // Reference Numbers
    jobNumber: string; // Auto-generated IMP-YYYY-XXXX
    billOfLading: string;
    containerNumber: string;
    mode: 'shipping' | 'flight';

    // Customer & Consignee
    customerId: string;
    customerName: string; // Populated from customer
    consigneeName: string;
    consigneeAddress: string;

    // Vessel & Route
    vesselName: string;
    voyageNumber: string;
    portOfLoading: string;
    portOfDischarge: string;

    // Dates
    etd: string; // Estimated Time of Departure
    eta: string; // Estimated Time of Arrival
    ata: string; // Actual Time of Arrival
    customsClearanceDate: string;
    deliveryDate: string;

    // Cargo Details
    commodityDescription: string;
    hsCode: string;
    grossWeight: string;
    netWeight: string;
    cbm: string; // Cubic Meters
    numberOfPackages: string;
    packageType: string; // Cartons, Pallets, etc.

    // Financial
    invoiceNumber: string;
    invoiceValue: string;
    currency: string;
    freightCharges: string;
    insuranceCharges: string;
    customsDuty: string;
    otherCharges: string;
    totalCharges: string; // Auto-calculated

    // Status & Tracking
    status: ShipmentStatus;

    // Additional
    specialInstructions: string;
    remarks: string;
};

// Import Shipment with metadata
export type ImportShipment = ImportShipmentFormValues & {
    id: string;
    createdAt: string;
    updatedAt: string;
};

// Export Shipment Form Values
export type ExportShipmentFormValues = {
    // Reference Numbers
    jobNumber: string; // Auto-generated EXP-YYYY-XXXX
    bookingNumber: string;
    billOfLading: string;
    containerNumber: string;
    mode: 'shipping' | 'flight';

    // Shipper & Consignee
    shipperId: string; // Reference to customer
    shipperName: string;
    shipperAddress: string;
    consigneeName: string;
    consigneeAddress: string;
    consigneeCountry: string;

    // Vessel & Route
    vesselName: string;
    voyageNumber: string;
    portOfLoading: string;
    portOfDestination: string;
    finalDestination: string;

    // Dates
    bookingDate: string;
    etd: string;
    eta: string;
    atd: string; // Actual Time of Departure

    // Cargo Details
    commodityDescription: string;
    hsCode: string;
    grossWeight: string;
    netWeight: string;
    cbm: string;
    numberOfPackages: string;
    packageType: string;

    // Documentation
    exportLicenseNumber: string;
    letterOfCreditNumber: string;
    invoiceNumber: string;
    invoiceValue: string;
    currency: string;

    // Financial
    freightCharges: string;
    insuranceCharges: string;
    handlingCharges: string;
    documentationFees: string;
    otherCharges: string;
    totalCharges: string;

    // Status
    status: ExportShipmentStatus;

    // Additional
    specialInstructions: string;
    remarks: string;
};

// Export Shipment with metadata
export type ExportShipment = ExportShipmentFormValues & {
    id: string;
    createdAt: string;
    updatedAt: string;
};

// Helper factory for empty import shipment form
export const emptyImportShipmentForm = (): ImportShipmentFormValues => ({
    jobNumber: '',
    billOfLading: '',
    containerNumber: '',
    mode: 'shipping',
    customerId: '',
    customerName: '',
    consigneeName: '',
    consigneeAddress: '',
    vesselName: '',
    voyageNumber: '',
    portOfLoading: '',
    portOfDischarge: '',
    etd: '',
    eta: '',
    ata: '',
    customsClearanceDate: '',
    deliveryDate: '',
    commodityDescription: '',
    hsCode: '',
    grossWeight: '',
    netWeight: '',
    cbm: '',
    numberOfPackages: '',
    packageType: '',
    invoiceNumber: '',
    invoiceValue: '',
    currency: 'USD',
    freightCharges: '',
    insuranceCharges: '',
    customsDuty: '',
    otherCharges: '',
    totalCharges: '',
    status: 'Booked',
    specialInstructions: '',
    remarks: '',
});

// Helper factory for empty export shipment form
export const emptyExportShipmentForm = (): ExportShipmentFormValues => ({
    jobNumber: '',
    bookingNumber: '',
    billOfLading: '',
    containerNumber: '',
    mode: 'shipping',
    shipperId: '',
    shipperName: '',
    shipperAddress: '',
    consigneeName: '',
    consigneeAddress: '',
    consigneeCountry: '',
    vesselName: '',
    voyageNumber: '',
    portOfLoading: '',
    portOfDestination: '',
    finalDestination: '',
    bookingDate: '',
    etd: '',
    eta: '',
    atd: '',
    commodityDescription: '',
    hsCode: '',
    grossWeight: '',
    netWeight: '',
    cbm: '',
    numberOfPackages: '',
    packageType: '',
    exportLicenseNumber: '',
    letterOfCreditNumber: '',
    invoiceNumber: '',
    invoiceValue: '',
    currency: 'USD',
    freightCharges: '',
    insuranceCharges: '',
    handlingCharges: '',
    documentationFees: '',
    otherCharges: '',
    totalCharges: '',
    status: 'Booked',
    specialInstructions: '',
    remarks: '',
});
