import { normalizeIsbn, pickIsbn } from './isbn';

describe('normalizeIsbn', () => {
  it('acepta ISBN-13 con guiones', () => {
    expect(normalizeIsbn('978-0-14-032872-1')).toBe('9780140328721');
  });

  it('acepta ISBN-10', () => {
    expect(normalizeIsbn('0-306-40615-2')).toBe('0306406152');
  });

  it('acepta ISBN-10 terminado en X y rechaza una X mal puesta', () => {
    expect(normalizeIsbn('123456789X')).toBe('123456789X');
    expect(normalizeIsbn('X234567890')).toBeNull();
    expect(normalizeIsbn('978014032872X')).toBeNull();
  });

  it('rechaza un checksum inválido', () => {
    expect(normalizeIsbn('9780140328722')).toBeNull();
  });
});

describe('pickIsbn', () => {
  it('prefiere ISBN-13', () => {
    expect(pickIsbn(['0306406152', '978-0-14-032872-1'])).toBe('9780140328721');
  });

  it('ignora valores vacíos', () => {
    expect(pickIsbn(undefined)).toBeNull();
  });
});
