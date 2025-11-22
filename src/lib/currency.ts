const CURRENCY_RATES: Record<string, number> = {
    USD: 1,
    EUR: 1.08,
    GBP: 1.27,
    PKR: 0.0036,
};

const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    PKR: '₨',
};

export function convertCurrency(amount: number, from: string, to: string): number {
    const fromRate = CURRENCY_RATES[from] ?? 1;
    const toRate = CURRENCY_RATES[to] ?? 1;
    if (fromRate === toRate) return amount;
    const amountInUsd = amount * fromRate;
    return amountInUsd / toRate;
}

export function formatCurrencyValue(amount: number, currency: string): string {
    const symbol = CURRENCY_SYMBOLS[currency] ?? '$';
    return `${symbol}${amount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

export function getCurrencyOptions(): Array<{ value: string; label: string }> {
    return Object.keys(CURRENCY_RATES).map((code) => ({
        value: code,
        label: code,
    }));
}
