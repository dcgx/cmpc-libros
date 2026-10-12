import { emptyQuery } from '../types';
import { money, toSearchParams } from './query';

describe('toSearchParams', () => {
  it('arma filtros y orden múltiple', () => {
    const params = toSearchParams({
      ...emptyQuery,
      search: '  bolaño ',
      available: 'true',
      primarySort: 'price',
      primaryDir: 'desc',
      secondarySort: 'title',
      secondaryDir: 'asc',
    });
    expect(params.get('search')).toBe('bolaño');
    expect(params.get('available')).toBe('true');
    expect(params.get('sort')).toBe('price:desc,title:asc');
  });
});

describe('money', () => {
  it('formatea pesos chilenos', () => {
    expect(money(14990)).toMatch(/14\.990/);
  });
});
