import { BadRequestException } from '@nestjs/common';
import { imageFileFilter } from './upload';

describe('imageFileFilter', () => {
  it('acepta png', () => {
    const callback = jest.fn();
    imageFileFilter({}, { mimetype: 'image/png' }, callback);
    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it('rechaza svg', () => {
    const callback = jest.fn();
    imageFileFilter({}, { mimetype: 'image/svg+xml' }, callback);
    expect(callback.mock.calls[0][0]).toBeInstanceOf(BadRequestException);
  });
});
