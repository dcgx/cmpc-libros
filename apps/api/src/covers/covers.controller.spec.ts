import { CoversController } from './covers.controller';
import { CoversService } from './covers.service';

describe('CoversController', () => {
  it('delega la búsqueda', async () => {
    const covers = { find: jest.fn().mockResolvedValue({ source: 'openlibrary' }) };
    const controller = new CoversController(covers as unknown as CoversService);
    await expect(controller.find({ title: 'Rayuela' })).resolves.toEqual({ source: 'openlibrary' });
    expect(covers.find).toHaveBeenCalledWith({ title: 'Rayuela' });
  });
});
