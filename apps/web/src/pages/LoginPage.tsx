import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate } from 'react-router-dom';
import { z } from 'zod';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { loginSchema } from '../lib/validation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Values = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { token, login } = useAuth();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const form = useForm<Values>({ resolver: zodResolver(loginSchema) });

  if (token) return <Navigate to="/libros" replace />;

  return (
    <div className="grid min-h-svh place-items-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <img className="mb-2 h-16 w-auto" src="/cmpc-logo.svg" alt="CMPC" />
          <CardTitle className="text-2xl">Libros</CardTitle>
          <CardDescription>Entra para administrar el inventario de la tienda.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4"
            onSubmit={form.handleSubmit(async (values) => {
              setError('');
              try {
                await login(values.email, values.password);
              } catch (caught) {
                setError(caught instanceof ApiError ? caught.message : 'No se pudo iniciar sesión');
              }
            })}
          >
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {notice && <p className="text-sm text-muted-foreground" role="status">{notice}</p>}
            <div className="grid gap-2">
              <Label htmlFor="email">Correo</Label>
              <Input id="email" type="email" autoComplete="username" placeholder="admin@cmpc.cl" {...form.register('email')} />
              {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" autoComplete="current-password" {...form.register('password')} />
              {form.formState.errors.password && <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>}
            </div>
            <Button type="submit">Entrar</Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                form.setValue('email', 'admin@cmpc.cl', { shouldValidate: true });
                form.setValue('password', 'Admin123!', { shouldValidate: true });
                setNotice('Pulsa Entrar para continuar');
              }}
            >
              Usar cuenta demo
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
