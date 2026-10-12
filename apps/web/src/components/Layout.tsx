import { Link, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function Layout() {
  const { token, logout } = useAuth();
  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">CMPC<span>Libros</span></div>
        <Link to="/libros">Inventario</Link>
        <button type="button" onClick={logout}>Cerrar sesión</button>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
