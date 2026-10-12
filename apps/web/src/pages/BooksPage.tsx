import { useQuery } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, download } from '../api/client';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { money, toSearchParams } from '../lib/query';
import { Book, BookQuery, NamedRef, PageMeta, emptyQuery } from '../types';

export function BooksPage() {
  const [draft, setDraft] = useState(emptyQuery.search);
  const [query, setQuery] = useState<BookQuery>(emptyQuery);
  const search = useDebouncedValue(draft);

  const effective = { ...query, search, page: search === query.search ? query.page : 1 };
  const params = toSearchParams(effective).toString();

  const books = useQuery({
    queryKey: ['books', params],
    queryFn: () => api<Book[]>(`/api/books?${params}`),
  });
  const authors = useQuery({ queryKey: ['authors'], queryFn: () => api<NamedRef[]>('/api/catalog/authors') });
  const publishers = useQuery({ queryKey: ['publishers'], queryFn: () => api<NamedRef[]>('/api/catalog/publishers') });
  const genres = useQuery({ queryKey: ['genres'], queryFn: () => api<NamedRef[]>('/api/catalog/genres') });

  function update(partial: Partial<BookQuery>) {
    setQuery((current) => ({ ...current, ...partial, page: partial.page ?? 1 }));
  }

  const meta: PageMeta | undefined = books.data?.meta;
  const rows = books.data?.data ?? [];

  return (
    <section>
      <div className="top">
        <div>
          <h1>Inventario</h1>
          <p className="muted">{meta ? `${meta.total} libros` : 'Cargando catálogo'}</p>
        </div>
        <div className="row">
          <button className="btn-ghost" type="button" onClick={() => download(`/api/books/export?${params}`, 'libros.csv')}>
            Exportar CSV
          </button>
          <Link className="btn" to="/libros/nuevo">Nuevo libro</Link>
        </div>
      </div>

      <form className="filters" onSubmit={(event: FormEvent) => event.preventDefault()}>
        <label className="span-2">
          Buscar
          <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Título, autor, editorial o género" />
        </label>
        <Select label="Autor" value={query.authorId} options={authors.data?.data ?? []} onChange={(authorId) => update({ authorId })} />
        <Select label="Editorial" value={query.publisherId} options={publishers.data?.data ?? []} onChange={(publisherId) => update({ publisherId })} />
        <Select label="Género" value={query.genreId} options={genres.data?.data ?? []} onChange={(genreId) => update({ genreId })} />
        <label>
          Disponibilidad
          <select value={query.available} onChange={(event) => update({ available: event.target.value as BookQuery['available'] })}>
            <option value="">Todas</option>
            <option value="true">Disponible</option>
            <option value="false">No disponible</option>
          </select>
        </label>
        <label>
          Orden principal
          <select value={`${query.primarySort}:${query.primaryDir}`} onChange={(event) => {
            const [primarySort, primaryDir] = event.target.value.split(':') as [BookQuery['primarySort'], BookQuery['primaryDir']];
            update({ primarySort, primaryDir });
          }}>
            <option value="createdAt:desc">Más recientes</option>
            <option value="title:asc">Título A-Z</option>
            <option value="title:desc">Título Z-A</option>
            <option value="price:asc">Precio menor</option>
            <option value="price:desc">Precio mayor</option>
            <option value="author:asc">Autor</option>
            <option value="stock:desc">Stock</option>
          </select>
        </label>
        <label>
          Segundo orden
          <select value={query.secondarySort ? `${query.secondarySort}:${query.secondaryDir}` : ''} onChange={(event) => {
            if (!event.target.value) {
              update({ secondarySort: '' });
              return;
            }
            const [secondarySort, secondaryDir] = event.target.value.split(':') as [Exclude<BookQuery['secondarySort'], ''>, BookQuery['secondaryDir']];
            update({ secondarySort, secondaryDir });
          }}>
            <option value="">Ninguno</option>
            <option value="title:asc">Título A-Z</option>
            <option value="price:asc">Precio menor</option>
            <option value="author:asc">Autor</option>
          </select>
        </label>
      </form>

      {books.isError && <div className="error">No se pudo cargar el inventario.</div>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Título</th>
              <th>Autor</th>
              <th>Editorial</th>
              <th>Género</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((book) => (
              <tr key={book.id}>
                <td>{book.imageUrl ? <img className="cover" src={book.imageUrl} alt="" /> : <div className="cover" />}</td>
                <td><Link to={`/libros/${book.id}`}>{book.title}</Link></td>
                <td>{book.author.name}</td>
                <td>{book.publisher.name}</td>
                <td>{book.genre.name}</td>
                <td>{money(book.price)}</td>
                <td>{book.stock}</td>
                <td><span className={book.available ? 'badge' : 'badge off'}>{book.available ? 'Disponible' : 'No disponible'}</span></td>
              </tr>
            ))}
            {!books.isLoading && rows.length === 0 && (
              <tr><td colSpan={8}>No hay libros con esos filtros.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="pager">
        <button className="btn-ghost" type="button" disabled={!meta || meta.page <= 1} onClick={() => update({ page: query.page - 1 })}>Anterior</button>
        <span>{meta ? `Página ${meta.page} de ${meta.totalPages}` : ''}</span>
        <button className="btn-ghost" type="button" disabled={!meta || meta.page >= meta.totalPages} onClick={() => update({ page: (search === query.search ? query.page : 1) + 1 })}>Siguiente</button>
      </div>
    </section>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: NamedRef[]; onChange: (value: string) => void }) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Todos</option>
        {options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
      </select>
    </label>
  );
}
