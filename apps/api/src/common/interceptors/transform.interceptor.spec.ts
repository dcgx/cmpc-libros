import { of } from 'rxjs';
import { TransformInterceptor } from './transform.interceptor';

describe('TransformInterceptor', () => {
  const reflector = { getAllAndOverride: jest.fn() };
  const interceptor = new TransformInterceptor(reflector as never);
  const context = { getHandler: () => undefined, getClass: () => undefined } as never;

  it('envuelve data y separa la paginación', (done) => {
    reflector.getAllAndOverride.mockReturnValue(false);
    interceptor.intercept(context, { handle: () => of({ items: [1], meta: { total: 1 } }) }).subscribe((value) => {
      expect(value).toEqual({ success: true, data: [1], meta: { total: 1 } });
      done();
    });
  });

  it('no transforma CSV', (done) => {
    reflector.getAllAndOverride.mockReturnValue(true);
    interceptor.intercept(context, { handle: () => of('csv') }).subscribe((value) => {
      expect(value).toBe('csv');
      done();
    });
  });
});
