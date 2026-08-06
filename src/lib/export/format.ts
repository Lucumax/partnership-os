// Inserts thousands separators into the integer part of a fixed-decimal numeric
// string (e.g. "1513.0" -> "1,513.0"). Display-only: never touches the underlying value.
function groupThousands(fixed: string): string {
  const [integerPart, fractionPart] = fixed.split(".");
  const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return fractionPart === undefined ? grouped : `${grouped}.${fractionPart}`;
}

export function formatUsdM(value: number): string {
  const sign = value < 0 ? "-" : "";
  return `${sign}$${groupThousands(Math.abs(value).toFixed(1))}M`;
}

export function formatUsdMDelta(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "+";
  return `${sign}$${groupThousands(Math.abs(value).toFixed(1))}M`;
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toISOString().slice(0, 10);
}
