// C1: 예산 기록 — 가계부가 아니라 "하루 얼마 썼나" 메모 수준.
// 통화는 EUR/KRW만, 합계는 통화별로 따로 낸다(환율 추정 금지 — 객관성 원칙 P1).

export type BudgetCurrency = "EUR" | "KRW";

export type BudgetEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  label: string;
  amount: number;
  currency: BudgetCurrency;
  category: BudgetCategory;
};

export type BudgetCategory = "식비" | "교통" | "입장권" | "쇼핑" | "숙소" | "기타";

export const budgetCategories: BudgetCategory[] = ["식비", "교통", "입장권", "쇼핑", "숙소", "기타"];

export const currencySymbol: Record<BudgetCurrency, string> = {
  EUR: "€",
  KRW: "₩",
};

export function normalizeBudget(value: unknown): BudgetEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is BudgetEntry =>
      Boolean(entry) &&
      typeof entry.id === "string" &&
      typeof entry.date === "string" &&
      typeof entry.label === "string" &&
      typeof entry.amount === "number" &&
      (entry.currency === "EUR" || entry.currency === "KRW")
  );
}

export function formatAmount(amount: number, currency: BudgetCurrency) {
  const rounded = currency === "KRW" ? Math.round(amount) : Math.round(amount * 100) / 100;
  return `${currencySymbol[currency]}${rounded.toLocaleString("ko-KR")}`;
}

// 통화별 합계 — 환율로 합치지 않는다
export function sumByCurrency(entries: BudgetEntry[]): Partial<Record<BudgetCurrency, number>> {
  const totals: Partial<Record<BudgetCurrency, number>> = {};
  for (const entry of entries) {
    totals[entry.currency] = (totals[entry.currency] ?? 0) + entry.amount;
  }
  return totals;
}

export function formatTotals(totals: Partial<Record<BudgetCurrency, number>>): string {
  const parts = (Object.keys(totals) as BudgetCurrency[]).map((cur) => formatAmount(totals[cur] ?? 0, cur));
  return parts.length ? parts.join(" + ") : "—";
}
