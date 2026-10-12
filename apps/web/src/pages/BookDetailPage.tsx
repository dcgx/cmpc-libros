import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { money } from '../lib/query';
import { Book } from '../types';

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

  if (book.isLoading) return <p>Cargando libro…</p>;
  if (book.isError || !book.data) return <div className="error">No se encontró el libro.</div>;

  const item = book.data.data;
  return (
    <section>
      <div className="top">
        <h1>{item.title}</h1>
        <div className="row">
          <Link className="btn-ghost" to="/libros">Volver</Link>
          <Link className="btn" to={`/libros/${item.id}/editar`}>Editar</Link>
          <button className="btn danger" type="button" onClick={() => { if (confirm('¿Eliminar este libro?')) remove.mutate(); }}>
            Eliminar
          </button>
        </div>
      </div>
      <article className="card detail" style={{ padding: 20 }}>
        {item.imageUrl ? <img src={item.imageUrl} alt={item.title} /> : <div className="placeholder" />}
        <div>
          <p><strong>Autor:</strong> {item.author.name}</p>
          <p><strong>Editorial:</strong> {item.publisher.name}</p>
          <p><strong>Género:</strong> {item.genre.name}</p>
          <p><strong>Precio:</strong> {money(item.price)}</p>
          <p><strong>Stock:</strong> {item.stock}</p>
          <p><strong>Disponibilidad:</strong> {item.available ? 'Disponible' : 'No disponible'}</p>
        </div>
      </article>
    </section>
  );
}
