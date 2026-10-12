import { csvCell, normalizeName } from './text';

describe('normalizeName', () => {
  it('recorta y colapsa espacios', () => {
    expect(normalizeName('  Ana   María  ')).toBe('Ana María');
  });
});

describe('csvCell', () => {
  it('escapa comillas y comas', () => {
    expect(csvCell('A, "B"')).toBe('"A, ""B"""');
    expect(csvCell(null)).toBe('');
    expect(csvCell(10)).toBe('10');
  });
});
