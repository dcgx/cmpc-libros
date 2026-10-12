import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, download } from '../api/client';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { money, toSearchParams } from '../lib/query';
import { Book, BookQuery, NamedRef, PageMeta, emptyQuery } from '../types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const primarySorts = [
  ['createdAt:desc', 'Más recientes'],
  ['title:asc', 'Título A-Z'],
  ['title:desc', 'Título Z-A'],
  ['price:asc', 'Precio menor'],
  ['price:desc', 'Precio mayor'],
  ['author:asc', 'Autor'],
  ['stock:desc', 'Stock'],
] as const;

const secondarySorts = [
  ['none', 'Ninguno'],
  ['title:asc', 'Título A-Z'],
  ['price:asc', 'Precio menor'],
  ['author:asc', 'Autor'],
] as const;

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
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Inventario</h1>
          <p className="text-sm text-muted-foreground">{meta ? `${meta.total} libros` : 'Cargando catálogo'}</p>
        </div>
        <Button variant="outline" size="sm" type="button" onClick={() => download(`/api/books/export?${params}`, 'libros.csv')}>
          <Download />
          Exportar CSV
        </Button>
      </div>

      <Card>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(event: FormEvent) => event.preventDefault()}>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="search">Buscar</Label>
              <Input id="search" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Título, autor, editorial o género" />
            </div>
            <CatalogSelect label="Autor" value={query.authorId} options={authors.data?.data ?? []} onChange={(authorId) => update({ authorId })} />
            <CatalogSelect label="Editorial" value={query.publisherId} options={publishers.data?.data ?? []} onChange={(publisherId) => update({ publisherId })} />
            <CatalogSelect label="Género" value={query.genreId} options={genres.data?.data ?? []} onChange={(genreId) => update({ genreId })} />
            <div className="grid gap-2">
              <Label>Disponibilidad</Label>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                spacing={0}
                className="w-full"
                aria-label="Disponibilidad"
                value={query.available || 'all'}
                onValueChange={(available) => {
                  if (!available) return;
                  update({ available: available === 'all' ? '' : available as BookQuery['available'] });
                }}
              >
                <ToggleGroupItem value="all" className="flex-1">Todas</ToggleGroupItem>
                <ToggleGroupItem value="true" className="flex-1">Disponible</ToggleGroupItem>
                <ToggleGroupItem value="false" className="flex-1">No disponible</ToggleGroupItem>
              </ToggleGroup>
            </div>
            <SortSelect
              label="Orden principal"
              value={`${query.primarySort}:${query.primaryDir}`}
              options={primarySorts}
              onChange={(value) => {
                const [primarySort, primaryDir] = value.split(':') as [BookQuery['primarySort'], BookQuery['primaryDir']];
                update({ primarySort, primaryDir });
              }}
            />
            <SortSelect
              label="Segundo orden"
              value={query.secondarySort ? `${query.secondarySort}:${query.secondaryDir}` : 'none'}
              options={secondarySorts}
              onChange={(value) => {
                if (value === 'none') {
                  update({ secondarySort: '' });
                  return;
                }
                const [secondarySort, secondaryDir] = value.split(':') as [Exclude<BookQuery['secondarySort'], ''>, BookQuery['secondaryDir']];
                update({ secondarySort, secondaryDir });
              }}
            />
          </form>
        </CardContent>
        {books.isError && (
          <div className="px-4 pb-4">
            <Alert variant="destructive">
              <AlertDescription>No se pudo cargar el inventario.</AlertDescription>
            </Alert>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14"></TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Autor</TableHead>
              <TableHead>Editorial</TableHead>
              <TableHead>Género</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((book) => (
              <TableRow key={book.id}>
                <TableCell>
                  {book.imageUrl
                    ? <img className="h-14 w-10 rounded-md object-cover bg-muted" src={book.imageUrl} alt="" />
                    : <div className="h-14 w-10 rounded-md bg-muted" />}
                </TableCell>
                <TableCell className="whitespace-normal">
                  <Link className="font-medium hover:underline" to={`/libros/${book.id}`}>{book.title}</Link>
                </TableCell>
                <TableCell>{book.author.name}</TableCell>
                <TableCell>{book.publisher.name}</TableCell>
                <TableCell>{book.genre.name}</TableCell>
                <TableCell>{money(book.price)}</TableCell>
                <TableCell>{book.stock}</TableCell>
                <TableCell>
                  <Badge variant={book.available ? 'default' : 'destructive'}>
                    {book.available ? 'Disponible' : 'No disponible'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {!books.isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-16 text-center text-muted-foreground">No hay libros con esos filtros.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <CardFooter className="justify-between">
          <Button variant="outline" size="sm" type="button" disabled={!meta || meta.page <= 1} onClick={() => update({ page: query.page - 1 })}>Anterior</Button>
          <span className="text-sm text-muted-foreground">{meta ? `Página ${meta.page} de ${meta.totalPages}` : ''}</span>
          <Button variant="outline" size="sm" type="button" disabled={!meta || meta.page >= meta.totalPages} onClick={() => update({ page: (search === query.search ? query.page : 1) + 1 })}>Siguiente</Button>
        </CardFooter>
      </Card>
    </section>
  );
}

function CatalogSelect({ label, value, options, onChange }: { label: string; value: string; options: NamedRef[]; onChange: (value: string) => void }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Select value={value || 'all'} onValueChange={(next) => onChange(next === 'all' ? '' : next)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Todos" />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value="all">Todos</SelectItem>
          {options.map((option) => <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function SortSelect({ label, value, options, onChange }: { label: string; value: string; options: readonly (readonly [string, string])[]; onChange: (value: string) => void }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          {options.map(([optionValue, optionLabel]) => <SelectItem key={optionValue} value={optionValue}>{optionLabel}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
