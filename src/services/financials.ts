// Financial statements service functions
// Operations for generating P&L and Balance Sheet

import { ProfitLossData, BalanceSheetData, emptyProfitLoss, emptyBalanceSheet } from '@/models/financials';
import { listInvoices } from '@/services/invoices';
import { listExpenses } from '@/services/expenses';
import { convertCurrency } from '@/lib/currency';

// Generate Profit & Loss statement for a date range
export async function generateProfitLoss(
    startDate: string,
    endDate: string
): Promise<ProfitLossData> {
    const data = emptyProfitLoss();
    data.period = `${startDate} to ${endDate}`;
    data.startDate = startDate;
    data.endDate = endDate;

    const [invoices, expenses] = await Promise.all([listInvoices(), listExpenses()]);
    const start = new Date(startDate);
    const end = new Date(endDate);

    invoices
        .filter((invoice) => {
            const date = new Date(invoice.invoiceDate);
            return date >= start && date <= end;
        })
        .forEach((invoice) => {
            const amount = convertCurrency(invoice.total || 0, invoice.currency || 'USD', 'USD');
            if ((invoice.partyType ?? 'customer') === 'customer') {
                data.revenue.serviceRevenue += amount;
            } else {
                data.costOfServices.freightCosts += amount;
            }
        });

    expenses
        .filter((expense) => {
            const date = new Date(expense.date);
            return date >= start && date <= end;
        })
        .forEach((expense) => {
            const amount = convertCurrency(expense.amount || 0, expense.currency || 'USD', 'USD');
            switch (expense.category) {
                case 'fuel':
                case 'airline_charges':
                    data.costOfServices.freightCosts += amount;
                    break;
                case 'port_fees':
                case 'customs':
                    data.costOfServices.handlingCosts += amount;
                    break;
                case 'warehousing':
                    data.operatingExpenses.administrative += amount;
                    break;
                case 'logistics_overheads':
                default:
                    data.operatingExpenses.other += amount;
                    break;
            }
        });

    // Calculate totals
    data.revenue.total =
        data.revenue.serviceRevenue +
        data.revenue.freightRevenue +
        data.revenue.otherIncome;

    data.costOfServices.total =
        data.costOfServices.freightCosts + data.costOfServices.handlingCosts;

    data.grossProfit = data.revenue.total - data.costOfServices.total;
    data.grossMargin = data.revenue.total > 0
        ? (data.grossProfit / data.revenue.total) * 100
        : 0;

    data.operatingExpenses.total =
        data.operatingExpenses.salaries +
        data.operatingExpenses.rent +
        data.operatingExpenses.utilities +
        data.operatingExpenses.insurance +
        data.operatingExpenses.depreciation +
        data.operatingExpenses.marketing +
        data.operatingExpenses.administrative +
        data.operatingExpenses.other;

    data.operatingIncome = data.grossProfit - data.operatingExpenses.total;

    data.otherExpenses.total =
        data.otherExpenses.interestExpense + data.otherExpenses.taxes;

    data.netIncome = data.operatingIncome - data.otherExpenses.total;
    data.netMargin = data.revenue.total > 0
        ? (data.netIncome / data.revenue.total) * 100
        : 0;

    return data;
}

// Generate Balance Sheet as of a specific date
export async function generateBalanceSheet(asOfDate: string): Promise<BalanceSheetData> {
    const [invoices, expenses] = await Promise.all([listInvoices(), listExpenses()]);

    const data = emptyBalanceSheet();
    data.asOfDate = asOfDate;

    const receivables = invoices
        .filter((invoice) => (invoice.partyType ?? 'customer') === 'customer')
        .reduce((sum, invoice) => {
            const total = convertCurrency(invoice.total || 0, invoice.currency || 'USD', 'USD');
            const paid = convertCurrency(invoice.paidAmount || 0, invoice.currency || 'USD', 'USD');
            return sum + Math.max(total - paid, 0);
        }, 0);

    const vendorPayables = invoices
        .filter((invoice) => (invoice.partyType ?? 'customer') === 'vendor')
        .reduce((sum, invoice) => {
            const total = convertCurrency(invoice.total || 0, invoice.currency || 'USD', 'USD');
            const paid = convertCurrency(invoice.paidAmount || 0, invoice.currency || 'USD', 'USD');
            return sum + Math.max(total - paid, 0);
        }, 0);

    const outstandingExpenses = expenses.reduce((sum, expense) => {
        if (expense.status === 'paid') return sum;
        const total = convertCurrency(expense.amount || 0, expense.currency || 'USD', 'USD');
        return sum + total;
    }, 0);

    const payables = vendorPayables + outstandingExpenses;

    data.assets.currentAssets.accountsReceivable = receivables;
    data.assets.currentAssets.total = receivables;
    data.assets.totalAssets = receivables;
    data.liabilities.currentLiabilities.accountsPayable = payables;
    data.liabilities.currentLiabilities.total = payables;
    data.liabilities.totalLiabilities = payables;

    const equityValue = receivables - payables;
    data.equity.currentYearEarnings = equityValue;
    data.equity.totalEquity = equityValue;

    // Calculate totals
    data.assets.currentAssets.total =
        data.assets.currentAssets.cash +
        data.assets.currentAssets.accountsReceivable +
        data.assets.currentAssets.inventory +
        data.assets.currentAssets.prepaidExpenses;

    data.assets.fixedAssets.net =
        data.assets.fixedAssets.propertyPlantEquipment +
        data.assets.fixedAssets.accumulatedDepreciation;

    data.assets.totalAssets =
        data.assets.currentAssets.total +
        data.assets.fixedAssets.net +
        data.assets.otherAssets;

    data.liabilities.currentLiabilities.total =
        data.liabilities.currentLiabilities.accountsPayable +
        data.liabilities.currentLiabilities.accruedExpenses +
        data.liabilities.currentLiabilities.shortTermDebt;

    data.liabilities.longTermLiabilities.total =
        data.liabilities.longTermLiabilities.longTermDebt +
        data.liabilities.longTermLiabilities.otherLongTerm;

    data.liabilities.totalLiabilities =
        data.liabilities.currentLiabilities.total +
        data.liabilities.longTermLiabilities.total;

    data.equity.totalEquity =
        data.equity.ownersEquity +
        data.equity.retainedEarnings +
        data.equity.currentYearEarnings;

    data.totalLiabilitiesAndEquity =
        data.liabilities.totalLiabilities + data.equity.totalEquity;

    return data;
}
