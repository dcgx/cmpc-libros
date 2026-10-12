import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { LoginPage } from './LoginPage';

function renderLogin() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  it('rellena el correo y la contraseña de la cuenta demo', () => {
    renderLogin();

    fireEvent.click(screen.getByRole('button', { name: /cuenta demo/i }));

    expect(screen.getByLabelText('Correo')).toHaveValue('admin@cmpc.cl');
    expect(screen.getByLabelText('Contraseña')).toHaveValue('Admin123!');
    expect(screen.getByRole('status')).toHaveTextContent('Pulsa Entrar para continuar');
  });
});
