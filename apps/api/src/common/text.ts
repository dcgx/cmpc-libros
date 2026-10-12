export function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function csvCell(value: string | number | boolean | null | undefined): string {
  const raw = value == null ? '' : String(value);
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}
