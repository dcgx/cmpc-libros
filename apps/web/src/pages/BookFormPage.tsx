import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { bookSchema, BookFormValues } from '../lib/validation';
import { Book } from '../types';

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
    <section>
      <div className="top">
        <h1>{id ? 'Editar libro' : 'Nuevo libro'}</h1>
        <Link className="btn-ghost" to="/libros">Volver</Link>
      </div>
      <form
        className="card form"
        style={{ padding: 20 }}
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
        {error && <div className="error">{error}</div>}
        <Field label="Título" error={form.formState.errors.title?.message}><input {...form.register('title')} /></Field>
        <Field label="Autor" error={form.formState.errors.authorName?.message}><input {...form.register('authorName')} /></Field>
        <Field label="Editorial" error={form.formState.errors.publisherName?.message}><input {...form.register('publisherName')} /></Field>
        <Field label="Género" error={form.formState.errors.genreName?.message}><input {...form.register('genreName')} /></Field>
        <Field label="Precio CLP" error={form.formState.errors.price?.message}><input type="number" step="1" {...form.register('price')} /></Field>
        <Field label="Stock" error={form.formState.errors.stock?.message}><input type="number" step="1" {...form.register('stock')} /></Field>
        <Field label="Disponibilidad" error={form.formState.errors.available?.message}>
          <select {...form.register('available')}>
            <option value="true">Disponible</option>
            <option value="false">No disponible</option>
          </select>
        </Field>
        <Field label="Imagen">
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        </Field>
        <button className="btn" type="submit">{id ? 'Guardar cambios' : 'Crear libro'}</button>
      </form>
    </section>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label>
      {label}
      {children}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}
