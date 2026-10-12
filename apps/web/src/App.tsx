import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { BookDetailPage } from './pages/BookDetailPage';
import { BookFormPage } from './pages/BookFormPage';
import { BooksPage } from './pages/BooksPage';
import { LoginPage } from './pages/LoginPage';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/libros" replace />} />
        <Route path="/libros" element={<BooksPage />} />
        <Route path="/libros/nuevo" element={<BookFormPage />} />
        <Route path="/libros/:id" element={<BookDetailPage />} />
        <Route path="/libros/:id/editar" element={<BookFormPage />} />
      </Route>
    </Routes>
  );
}
