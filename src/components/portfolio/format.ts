export interface FormatMoneyOptions {
  sign?: boolean;
  dp?: number;
}

// Inserts thousands separators into the integer part of a fixed-decimal numeric
// string (e.g. "1513.0" -> "1,513.0"). Display-only: never touches the underlying value.
function groupThousands(fixed: string): string {
  const [integerPart, fractionPart] = fixed.split(".");
  const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return fractionPart === undefined ? grouped : `${grouped}.${fractionPart}`;
}

export function formatM(value: number, options?: FormatMoneyOptions): string {
  const dp = options?.dp ?? 1;
  const magnitude = groupThousands(Math.abs(value).toFixed(dp));
  const prefix = value < 0 ? "−" : options?.sign && value > 0 ? "+" : "";
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
