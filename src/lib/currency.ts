// Central currency utility: dashboard opera em BRL (R$).
// Todos os valores são armazenados em BRL no banco (webhooks Zedy chegam em BRL,
// e o webhook Shopify normaliza qualquer moeda estrangeira para BRL usando fx rate).
// Aqui apenas formatamos para exibição em Real.

// Mantidos por compatibilidade com código legado (agora 1:1, sem conversão).
export const BRL_TO_USD = 1;
export const USD_TO_BRL = 1;

export function brlToUsd(brl: number | null | undefined): number {
  const n = Number(brl || 0);
  return Number.isFinite(n) ? n : 0;
}

export function usdToBrl(usd: number | null | undefined): number {
  const n = Number(usd || 0);
  return Number.isFinite(n) ? n : 0;
}

// Formata um valor em BRL como Real (R$) — o padrão no dashboard.
export function formatBRL(brlValue: number | null | undefined, opts?: { decimals?: number; withSymbol?: boolean }): string {
  const decimals = opts?.decimals ?? 2;
  const withSymbol = opts?.withSymbol ?? true;
  const n = Number(brlValue || 0);
  const formatted = (Number.isFinite(n) ? n : 0).toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return withSymbol ? `R$ ${formatted}` : formatted;
}

// Alias legado: nomes antigos continuam funcionando, agora exibindo BRL.
export const formatUSD = formatBRL;
export const formatUSDRaw = formatBRL;

export const CURRENCY_SYMBOL = 'R$';
export const CURRENCY_CODE = 'BRL';
