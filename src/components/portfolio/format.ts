export interface FormatMoneyOptions {
  sign?: boolean;
  dp?: number;
}

export function formatM(value: number, options?: FormatMoneyOptions): string {
  const dp = options?.dp ?? 1;
  const magnitude = Math.abs(value).toFixed(dp);
  const prefix = value < 0 ? "-" : options?.sign && value > 0 ? "+" : "";
  return `${prefix}$${magnitude}M`;
}

export function formatPercent(value: number, dp = 0): string {
  return `${(value * 100).toFixed(dp)}%`;
}

export function formatProbability(value: number, dp = 0): string {
  return `${(value * 100).toFixed(dp)}%`;
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatAssumptionValue(value: number | string | boolean): string {
  if (typeof value === "number") {
    return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }
  return String(value);
}
