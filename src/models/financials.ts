// Financial statement models

// Profit & Loss Statement
export type ProfitLossData = {
    period: string;
    startDate: string;
    endDate: string;

    revenue: {
        serviceRevenue: number;
        freightRevenue: number;
        otherIncome: number;
        total: number;
    };

    costOfServices: {
        freightCosts: number;
        handlingCosts: number;
        total: number;
    };

    grossProfit: number;
    grossMargin: number; // Percentage

    operatingExpenses: {
        salaries: number;
        rent: number;
        utilities: number;
        insurance: number;
        depreciation: number;
        marketing: number;
        administrative: number;
        other: number;
        total: number;
    };

    operatingIncome: number;

    otherExpenses: {
        interestExpense: number;
        taxes: number;
        total: number;
    };

    netIncome: number;
    netMargin: number; // Percentage
};

// Balance Sheet
export type BalanceSheetData = {
    asOfDate: string;

    assets: {
        currentAssets: {
            cash: number;
            accountsReceivable: number;
            inventory: number;
            prepaidExpenses: number;
            total: number;
        };
        fixedAssets: {
            propertyPlantEquipment: number;
            accumulatedDepreciation: number;
            net: number;
        };
        otherAssets: number;
        totalAssets: number;
    };

    liabilities: {
        currentLiabilities: {
            accountsPayable: number;
            accruedExpenses: number;
            shortTermDebt: number;
            total: number;
        };
        longTermLiabilities: {
            longTermDebt: number;
            otherLongTerm: number;
            total: number;
        };
        totalLiabilities: number;
    };

    equity: {
        ownersEquity: number;
        retainedEarnings: number;
        currentYearEarnings: number;
        totalEquity: number;
    };

    totalLiabilitiesAndEquity: number;
};

// Helper to create empty P&L
export const emptyProfitLoss = (): ProfitLossData => ({
    period: '',
    startDate: '',
    endDate: '',
    revenue: {
        serviceRevenue: 0,
        freightRevenue: 0,
        otherIncome: 0,
        total: 0,
    },
    costOfServices: {
        freightCosts: 0,
        handlingCosts: 0,
        total: 0,
    },
    grossProfit: 0,
    grossMargin: 0,
    operatingExpenses: {
        salaries: 0,
        rent: 0,
        utilities: 0,
        insurance: 0,
        depreciation: 0,
        marketing: 0,
        administrative: 0,
        other: 0,
        total: 0,
    },
    operatingIncome: 0,
    otherExpenses: {
        interestExpense: 0,
        taxes: 0,
        total: 0,
    },
    netIncome: 0,
    netMargin: 0,
});

// Helper to create empty balance sheet
export const emptyBalanceSheet = (): BalanceSheetData => ({
    asOfDate: '',
    assets: {
        currentAssets: {
            cash: 0,
            accountsReceivable: 0,
            inventory: 0,
            prepaidExpenses: 0,
            total: 0,
        },
        fixedAssets: {
            propertyPlantEquipment: 0,
            accumulatedDepreciation: 0,
            net: 0,
        },
        otherAssets: 0,
        totalAssets: 0,
    },
    liabilities: {
        currentLiabilities: {
            accountsPayable: 0,
            accruedExpenses: 0,
            shortTermDebt: 0,
            total: 0,
        },
        longTermLiabilities: {
            longTermDebt: 0,
            otherLongTerm: 0,
            total: 0,
        },
        totalLiabilities: 0,
    },
    equity: {
        ownersEquity: 0,
        retainedEarnings: 0,
        currentYearEarnings: 0,
        totalEquity: 0,
    },
    totalLiabilitiesAndEquity: 0,
});
