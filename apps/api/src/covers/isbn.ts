export function normalizeIsbn(value: string): string | null {
  const compact = value.replace(/[^0-9Xx]/g, '').toUpperCase();
  if (compact.length === 13 && isIsbn13(compact)) return compact;
  if (compact.length === 10 && isIsbn10(compact)) return compact;
  return null;
}

export function pickIsbn(values: string[] | undefined): string | null {
  const normalized = (values ?? []).map((value) => normalizeIsbn(value)).filter((value): value is string => Boolean(value));
  return normalized.find((value) => value.length === 13) ?? normalized[0] ?? null;
}

function isIsbn13(value: string): boolean {
  let sum = 0;
  for (let index = 0; index < 13; index += 1) {
    const digit = value.charCodeAt(index) - 48;
    if (digit < 0 || digit > 9) return false;
    sum += digit * (index % 2 === 0 ? 1 : 3);
  }
  return sum % 10 === 0;
}

function isIsbn10(value: string): boolean {
  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    const digit = value.charCodeAt(index) - 48;
    if (digit < 0 || digit > 9) return false;
    sum += (10 - index) * digit;
  }
  const check = value[9] === 'X' ? 10 : value.charCodeAt(9) - 48;
  return (sum + check) % 11 === 0;
}
