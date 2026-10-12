import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { loginSchema } from '../lib/validation';
import { z } from 'zod';

type Values = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { token, login } = useAuth();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const form = useForm<Values>({ resolver: zodResolver(loginSchema) });

  if (token) return <Navigate to="/libros" replace />;

  return (
    <div className="login">
      <form
        className="login-card"
        onSubmit={form.handleSubmit(async (values) => {
          setError('');
          try {
            await login(values.email, values.password);
          } catch (caught) {
            setError(caught instanceof ApiError ? caught.message : 'No se pudo iniciar sesión');
          }
        })}
      >
        <img className="logo-login" src="/cmpc-logo.png" alt="CMPC" />
        <p className="kicker">CMPC</p>
        <h1>Libros</h1>
        <p className="muted">Entra para administrar el inventario de la tienda.</p>
        {error && <div className="error">{error}</div>}
        {notice && <p className="notice" role="status">{notice}</p>}
        <div className="stack">
          <label>
            Correo
            <input type="email" autoComplete="username" placeholder="admin@cmpc.cl" {...form.register('email')} />
            {form.formState.errors.email && <span className="field-error">{form.formState.errors.email.message}</span>}
          </label>
          <label>
            Contraseña
            <input type="password" autoComplete="current-password" {...form.register('password')} />
            {form.formState.errors.password && <span className="field-error">{form.formState.errors.password.message}</span>}
          </label>
          <button className="btn" type="submit">Entrar</button>
          <button
            className="btn-ghost"
            type="button"
            onClick={() => {
              form.setValue('email', 'admin@cmpc.cl', { shouldValidate: true });
              form.setValue('password', 'Admin123!', { shouldValidate: true });
              setNotice('Pulsa Entrar para continuar');
            }}
          >
            Usar cuenta demo
          </button>
        </div>
      </form>
    </div>
  );
}
