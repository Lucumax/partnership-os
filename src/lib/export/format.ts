export function formatUsdM(value: number): string {
  const sign = value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toFixed(1)}M`;
}

export function formatUsdMDelta(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "+";
  return `${sign}$${Math.abs(value).toFixed(1)}M`;
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toISOString().slice(0, 10);
}
