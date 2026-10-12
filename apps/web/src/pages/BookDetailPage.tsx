import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { money } from '../lib/query';
import { Book } from '../types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const book = useQuery({
    queryKey: ['book', id],
    queryFn: () => api<Book>(`/api/books/${id}`),
  });
  const remove = useMutation({
    mutationFn: () => api(`/api/books/${id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['books'] });
      navigate('/libros');
    },
  });

  if (book.isLoading) return <p className="text-sm text-muted-foreground">Cargando libro…</p>;
  if (book.isError || !book.data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>No se encontró el libro.</AlertDescription>
      </Alert>
    );
  }

  const item = book.data.data;
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{item.title}</h1>
          <p className="text-sm text-muted-foreground">Ficha</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/libros">Volver</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to={`/libros/${item.id}/editar`}>Editar</Link>
          </Button>
          <Button variant="destructive" size="sm" type="button" onClick={() => { if (confirm('¿Eliminar este libro?')) remove.mutate(); }}>
            Eliminar
          </Button>
        </div>
      </div>
      <Card>
        <CardContent>
          <article className="grid items-start gap-6 md:grid-cols-[220px_1fr]">
            {item.imageUrl
              ? <img className="h-[300px] w-full rounded-xl object-cover bg-muted md:w-[220px]" src={item.imageUrl} alt={item.title} />
              : <div className="h-[300px] w-full rounded-xl bg-muted md:w-[220px]" />}
            <dl className="grid gap-3 sm:grid-cols-2">
              <Meta label="Autor" value={item.author.name} />
              <Meta label="Editorial" value={item.publisher.name} />
              <Meta label="Género" value={item.genre.name} />
              <Meta label="Precio" value={money(item.price)} />
              <Meta label="Stock" value={String(item.stock)} />
              <div className="rounded-xl border p-4">
                <dt className="text-xs text-muted-foreground">Disponibilidad</dt>
                <dd className="mt-2">
                  <Badge variant={item.available ? 'default' : 'destructive'}>
                    {item.available ? 'Disponible' : 'No disponible'}
                  </Badge>
                </dd>
              </div>
            </dl>
          </article>
        </CardContent>
      </Card>
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-4">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}
