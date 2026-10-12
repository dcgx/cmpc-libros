import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { BookFormPage } from './BookFormPage';

vi.mock('../api/client', () => {
  class ApiError extends Error {
    constructor(
      message: string,
      readonly status: number,
      readonly errors?: string[],
    ) {
      super(message);
    }
  }
  return { api: vi.fn(), ApiError };
});

const mockedApi = vi.mocked(api);

function renderForm() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <BookFormPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('BookFormPage', () => {
  beforeEach(() => {
    mockedApi.mockReset();
    URL.createObjectURL = vi.fn(() => 'blob:cover');
  });

  it('pide ISBN o título antes de buscar', () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: 'Buscar carátula' }));
    expect(screen.getByText('Indica un ISBN o un título para buscar la carátula')).toBeInTheDocument();
  });

  it('al escribir el título trae la carátula si no hay imagen', async () => {
    mockedApi.mockResolvedValue({
      data: {
        source: 'openlibrary',
        isbn: '9780140328721',
        title: 'Rayuela',
        contentType: 'image/jpeg',
        imageBase64: btoa('jpeg'),
      },
    });
    renderForm();
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Rayuela' } });

    expect(await screen.findByRole('img', { name: 'Carátula' })).toHaveAttribute('src', 'blob:cover');
    expect(screen.getByText('Carátula de Open Library')).toBeInTheDocument();
    expect(mockedApi).toHaveBeenCalledWith('/api/covers?title=Rayuela');
  });

  it('completa la carátula de un libro que no tiene imagen', async () => {
    mockedApi.mockImplementation(async (path: string) => {
      if (path.startsWith('/api/covers')) {
        return {
          data: {
            source: 'openlibrary' as const,
            isbn: null,
            title: 'Rayuela',
            contentType: 'image/jpeg',
            imageBase64: btoa('jpeg'),
          },
        };
      }
      return {
        data: {
          id: 'd1000000-0000-4000-8000-000000000012',
          title: 'Rayuela',
          price: 16990,
          stock: 4,
          available: true,
          imageUrl: null,
          author: { id: 'a', name: 'Julio Cortázar' },
          publisher: { id: 'p', name: 'Sudamericana' },
          genre: { id: 'g', name: 'Novela' },
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      };
    });

    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/libros/d1000000-0000-4000-8000-000000000012/editar']}>
          <Routes>
            <Route path="/libros/:id/editar" element={<BookFormPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('img', { name: 'Carátula' })).toHaveAttribute('src', 'blob:cover');
    expect(mockedApi).toHaveBeenCalledWith('/api/covers?title=Rayuela');
  });

  it('muestra el error de la búsqueda', async () => {
    mockedApi.mockRejectedValue(new ApiError('No se encontró una carátula', 404));
    renderForm();
    fireEvent.change(screen.getByLabelText('ISBN'), { target: { value: '9780140328721' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar carátula' }));
    expect(await screen.findByText('No se encontró una carátula')).toBeInTheDocument();
  });

  it('envía la carátula encontrada como imagen del libro', async () => {
    mockedApi.mockImplementation(async (path: string) => {
      if (path.startsWith('/api/covers')) {
        return {
          data: {
            source: 'openlibrary',
            isbn: null,
            title: 'Rayuela',
            contentType: 'image/jpeg',
            imageBase64: btoa('jpeg'),
          },
        };
      }
      return { data: { id: 'book-1' } };
    });
    renderForm();
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Rayuela' } });
    expect(await screen.findByText('Carátula de Open Library')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Autor'), { target: { value: 'Cortázar' } });
    fireEvent.change(screen.getByLabelText('Editorial'), { target: { value: 'Sudamericana' } });
    fireEvent.change(screen.getByLabelText('Género'), { target: { value: 'Novela' } });
    fireEvent.change(screen.getByLabelText('Precio CLP'), { target: { value: '16990' } });
    fireEvent.change(screen.getByLabelText('Stock'), { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear libro' }));

    await waitFor(() => {
      expect(mockedApi.mock.calls.some((call) => call[0] === '/api/books')).toBe(true);
    });
    const saveCall = mockedApi.mock.calls.find((call) => call[0] === '/api/books');
    expect(saveCall?.[1]).toMatchObject({ method: 'POST' });
    expect((saveCall?.[1]?.body as FormData).get('image')).toBeInstanceOf(File);
  });
});
