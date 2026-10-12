import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { bookSchema, BookFormValues } from '../lib/validation';
import { Book } from '../types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function BookFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const existing = useQuery({
    queryKey: ['book', id],
    enabled: Boolean(id),
    queryFn: () => api<Book>(`/api/books/${id}`),
  });

  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: '',
      authorName: '',
      publisherName: '',
      genreName: '',
      price: 0,
      stock: 0,
      available: 'true',
    },
    values: existing.data
      ? {
          title: existing.data.data.title,
          authorName: existing.data.data.author.name,
          publisherName: existing.data.data.publisher.name,
          genreName: existing.data.data.genre.name,
          price: existing.data.data.price,
          stock: existing.data.data.stock,
          available: existing.data.data.available ? 'true' : 'false',
        }
      : undefined,
  });

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{id ? 'Editar libro' : 'Nuevo libro'}</h1>
          <p className="text-sm text-muted-foreground">{id ? 'Actualizar ficha' : 'Alta'}</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/libros">Volver</Link>
        </Button>
      </div>
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Datos del libro</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={form.handleSubmit(async (values) => {
              if (!id && !file) {
                setError('La imagen del libro es obligatoria');
                return;
              }
              setError('');
              const body = new FormData();
              Object.entries(values).forEach(([key, value]) => body.append(key, String(value)));
              if (file) body.append('image', file);
              try {
                const { data } = await api<Book>(id ? `/api/books/${id}` : '/api/books', {
                  method: id ? 'PATCH' : 'POST',
                  body,
                });
                navigate(`/libros/${data.id}`);
              } catch (caught) {
                const apiError = caught instanceof ApiError ? caught : null;
                setError(apiError?.errors?.join(' ') || apiError?.message || 'No se pudo guardar');
              }
            })}
          >
            {error && (
              <Alert className="sm:col-span-2" variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Field className="sm:col-span-2" id="title" label="Título" error={form.formState.errors.title?.message}>
              <Input id="title" {...form.register('title')} />
            </Field>
            <Field id="authorName" label="Autor" error={form.formState.errors.authorName?.message}>
              <Input id="authorName" {...form.register('authorName')} />
            </Field>
            <Field id="publisherName" label="Editorial" error={form.formState.errors.publisherName?.message}>
              <Input id="publisherName" {...form.register('publisherName')} />
            </Field>
            <Field id="genreName" label="Género" error={form.formState.errors.genreName?.message}>
              <Input id="genreName" {...form.register('genreName')} />
            </Field>
            <Field id="price" label="Precio CLP" error={form.formState.errors.price?.message}>
              <Input id="price" type="number" step="1" {...form.register('price')} />
            </Field>
            <Field id="stock" label="Stock" error={form.formState.errors.stock?.message}>
              <Input id="stock" type="number" step="1" {...form.register('stock')} />
            </Field>
            <Field id="available" label="Disponibilidad" error={form.formState.errors.available?.message}>
              <Controller
                control={form.control}
                name="available"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="available" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="true">Disponible</SelectItem>
                      <SelectItem value="false">No disponible</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field className="sm:col-span-2" id="image" label="Imagen">
              <Input id="image" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            </Field>
            <div>
              <Button type="submit">{id ? 'Guardar cambios' : 'Crear libro'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

function Field({ id, label, error, className, children }: { id: string; label: string; error?: string; className?: string; children: ReactNode }) {
  return (
    <div className={className ? `grid gap-2 ${className}` : 'grid gap-2'}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
