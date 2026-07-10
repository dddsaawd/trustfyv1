// Central currency utility: dashboard opera em USD.
// Todos os valores são armazenados em BRL no banco (webhooks Zedy chegam em BRL,
// e o webhook Shopify normaliza qualquer moeda estrangeira para BRL usando fx rate).
// Aqui convertemos BRL → USD apenas na hora de exibir.

// Cotação BRL → USD. Pode ser sobrescrita via env (VITE_BRL_USD_RATE).
// Fallback aproximado (Jul 2026): 1 BRL ≈ 0.185 USD  (ou seja 1 USD ≈ 5.4 BRL).
const ENV_RATE = Number((import.meta as any).env?.VITE_BRL_USD_RATE);
export const BRL_TO_USD: number = ENV_RATE > 0 ? ENV_RATE : 0.185;
export const USD_TO_BRL: number = 1 / BRL_TO_USD;

export function brlToUsd(brl: number | null | undefined): number {
  const n = Number(brl || 0);
  if (!Number.isFinite(n)) return 0;
  return n * BRL_TO_USD;
}

export function usdToBrl(usd: number | null | undefined): number {
  const n = Number(usd || 0);
  if (!Number.isFinite(n)) return 0;
  return n * USD_TO_BRL;
}

// Formata um valor **já em BRL** como USD ($) — o padrão no dashboard.
export function formatUSD(brlValue: number | null | undefined, opts?: { decimals?: number; withSymbol?: boolean }): string {
  const decimals = opts?.decimals ?? 2;
  const withSymbol = opts?.withSymbol ?? true;
  const usd = brlToUsd(brlValue);
  const formatted = usd.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return withSymbol ? `$${formatted}` : formatted;
}

// Formata um valor **já em USD** (sem conversão).
export function formatUSDRaw(usdValue: number | null | undefined, opts?: { decimals?: number; withSymbol?: boolean }): string {
  const decimals = opts?.decimals ?? 2;
  const withSymbol = opts?.withSymbol ?? true;
  const n = Number(usdValue || 0);
  const formatted = (Number.isFinite(n) ? n : 0).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return withSymbol ? `$${formatted}` : formatted;
}

export const CURRENCY_SYMBOL = '$';
export const CURRENCY_CODE = 'USD';