// Financial statements service functions
// Operations for generating P&L and Balance Sheet

import { getDocs, collection, query, where } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { ProfitLossData, BalanceSheetData, emptyProfitLoss, emptyBalanceSheet } from '@/models/financials';
import { Account, GeneralLedgerEntry } from '@/models/accounts';
import { readNumber, readString } from '@/lib/firestoreUtils';

const LEDGER_COLLECTION = 'ledger';
const ACCOUNTS_COLLECTION = 'accounts';

// Generate Profit & Loss statement for a date range
export async function generateProfitLoss(
    startDate: string,
    endDate: string
): Promise<ProfitLossData> {
    const db = getFirebaseDb();

    // Fetch all ledger entries in the date range
    const snap = await getDocs(
        query(
            collection(db, LEDGER_COLLECTION),
            where('date', '>=', startDate),
            where('date', '<=', endDate)
        )
    );

    const data = emptyProfitLoss();
    data.period = `${startDate} to ${endDate}`;
    data.startDate = startDate;
    data.endDate = endDate;

    // Process ledger entries to calculate revenue and expenses
    snap.docs.forEach((docSnap) => {
        const entry = docSnap.data() as Partial<GeneralLedgerEntry>;
        const accountCode = readString(entry.accountCode);

        // Revenue accounts (4000-4999)
        if (accountCode.startsWith('4')) {
            if (accountCode === '4000') {
                data.revenue.serviceRevenue += readNumber(entry.credit);
            } else if (accountCode === '4100') {
                data.revenue.freightRevenue += readNumber(entry.credit);
            } else if (accountCode === '4900') {
                data.revenue.otherIncome += readNumber(entry.credit);
            }
        }

        // Cost of Services (5000-5199)
        if (accountCode >= '5000' && accountCode < '5200') {
            if (accountCode === '5000') {
                data.costOfServices.freightCosts += readNumber(entry.debit);
            } else if (accountCode === '5100') {
                data.costOfServices.handlingCosts += readNumber(entry.debit);
            }
        }

        // Operating Expenses (5200-5899)
        if (accountCode >= '5200' && accountCode < '5900') {
            if (accountCode === '5200') {
                data.operatingExpenses.salaries += readNumber(entry.debit);
            } else if (accountCode === '5300') {
                data.operatingExpenses.rent += readNumber(entry.debit);
            } else if (accountCode === '5400') {
                data.operatingExpenses.utilities += readNumber(entry.debit);
            } else if (accountCode === '5500') {
                data.operatingExpenses.insurance += readNumber(entry.debit);
            } else if (accountCode === '5600') {
                data.operatingExpenses.depreciation += readNumber(entry.debit);
            } else if (accountCode === '5700') {
                data.operatingExpenses.marketing += readNumber(entry.debit);
            } else if (accountCode === '5800') {
                data.operatingExpenses.administrative += readNumber(entry.debit);
            }
        }

        // Other Expenses
        if (accountCode === '5900') {
            data.otherExpenses.interestExpense += readNumber(entry.debit);
        } else if (accountCode === '5950') {
            data.otherExpenses.taxes += readNumber(entry.debit);
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
    const db = getFirebaseDb();

    // Fetch all accounts with their balances
    const snap = await getDocs(collection(db, ACCOUNTS_COLLECTION));

    const data = emptyBalanceSheet();
    data.asOfDate = asOfDate;

    snap.docs.forEach((docSnap) => {
        const account = docSnap.data() as Partial<Account>;
        const code = readString(account.code);
        const balance = readNumber(account.balance);

        // Assets (1000-1999)
        if (code.startsWith('1')) {
            if (code === '1000') {
                data.assets.currentAssets.cash = balance;
            } else if (code === '1100') {
                data.assets.currentAssets.accountsReceivable = balance;
            } else if (code === '1200') {
                data.assets.currentAssets.inventory = balance;
            } else if (code === '1300') {
                data.assets.currentAssets.prepaidExpenses = balance;
            } else if (code === '1500') {
                data.assets.fixedAssets.propertyPlantEquipment = balance;
            } else if (code === '1510') {
                data.assets.fixedAssets.accumulatedDepreciation = balance;
            } else {
                data.assets.otherAssets += balance;
            }
        }

        // Liabilities (2000-2999)
        if (code.startsWith('2')) {
            if (code === '2000') {
                data.liabilities.currentLiabilities.accountsPayable = balance;
            } else if (code === '2100') {
                data.liabilities.currentLiabilities.accruedExpenses = balance;
            } else if (code === '2200') {
                data.liabilities.currentLiabilities.shortTermDebt = balance;
            } else if (code === '2500') {
                data.liabilities.longTermLiabilities.longTermDebt = balance;
            } else {
                data.liabilities.longTermLiabilities.otherLongTerm += balance;
            }
        }

        // Equity (3000-3999)
        if (code.startsWith('3')) {
            if (code === '3000') {
                data.equity.ownersEquity = balance;
            } else if (code === '3100') {
                data.equity.retainedEarnings = balance;
            } else if (code === '3200') {
                data.equity.currentYearEarnings = balance;
            }
        }
    });

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
