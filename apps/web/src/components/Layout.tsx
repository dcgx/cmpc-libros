import { Link, NavLink, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function Layout() {
  const { token, logout } = useAuth();
  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="app">
      <div className="window">
        <header className="topbar">
          <div className="brand">
            <img src="/cmpc-logo.png" alt="CMPC" />
            <div>
              <strong>Libros</strong>
              <span>Inventario de la tienda</span>
            </div>
          </div>
          <nav className="nav">
            <NavLink to="/libros">Inventario</NavLink>
          </nav>
          <div className="top-actions">
            <Link className="btn" to="/libros/nuevo">Nuevo libro</Link>
            <button className="btn-ghost" type="button" onClick={logout}>Cerrar sesión</button>
          </div>
        </header>
        <main className="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
