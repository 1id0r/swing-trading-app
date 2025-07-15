// lib/format.ts
export const toFixed = (value: unknown, decimals = 2): string =>
    Number.isFinite(Number(value)) ? Number(value).toFixed(decimals) : '0.00'