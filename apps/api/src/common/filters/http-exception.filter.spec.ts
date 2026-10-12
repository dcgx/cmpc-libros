import { BadRequestException } from '@nestjs/common';
import { AllExceptionsFilter } from './http-exception.filter';

function host() {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  return {
    json,
    status,
    host: {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ method: 'GET', url: '/api/books' }),
      }),
    } as never,
  };
}

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  it('agrupa errores de validación', () => {
    const http = host();
    filter.catch(new BadRequestException(['título corto']), http.host);
    expect(http.status).toHaveBeenCalledWith(400);
    expect(http.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: 'Datos inválidos' }));
  });

  it('traduce un archivo demasiado grande', () => {
    const http = host();
    filter.catch({ code: 'LIMIT_FILE_SIZE' }, http.host);
    expect(http.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'La imagen no puede superar 2 MB' }));
  });

  it('oculta errores internos', () => {
    const http = host();
    filter.catch(new Error('boom'), http.host);
    expect(http.status).toHaveBeenCalledWith(500);
  });
});
