import { LogOut, Plus } from 'lucide-react';
import { Link, NavLink, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export function Layout() {
  const { token, logout } = useAuth();
  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-svh bg-muted/40">
      <header className="sticky top-0 z-20 border-b bg-background">
        <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center gap-3 px-4 py-2">
          <Link to="/libros" className="flex items-center gap-3">
            <img className="h-8 w-auto" src="/cmpc-logo.svg" alt="CMPC" />
            <span className="leading-tight">
              <span className="block text-sm font-medium">Libros</span>
              <span className="hidden text-xs text-muted-foreground sm:block">Inventario de la tienda</span>
            </span>
          </Link>
          <Separator orientation="vertical" className="mx-1 hidden h-4! sm:block" />
          <nav className="flex flex-1 items-center">
            <NavLink
              to="/libros"
              className={({ isActive }) => cn(buttonVariants({ variant: isActive ? 'secondary' : 'ghost', size: 'sm' }))}
            >
              Inventario
            </NavLink>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild size="sm">
              <Link to="/libros/nuevo">
                <Plus />
                Nuevo libro
              </Link>
            </Button>
            <Button variant="outline" size="sm" type="button" onClick={logout}>
              <LogOut />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
