import { BookQuery } from '../types';

export function toSearchParams(query: BookQuery) {
  const params = new URLSearchParams();
  params.set('page', String(query.page));
  params.set('limit', String(query.limit));
  if (query.search.trim()) params.set('search', query.search.trim());
  if (query.genreId) params.set('genreId', query.genreId);
  if (query.publisherId) params.set('publisherId', query.publisherId);
  if (query.authorId) params.set('authorId', query.authorId);
  if (query.available) params.set('available', query.available);
  const sort = [`${query.primarySort}:${query.primaryDir}`];
  if (query.secondarySort) sort.push(`${query.secondarySort}:${query.secondaryDir}`);
  params.set('sort', sort.join(','));
  return params;
}

export function money(value: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);
}
