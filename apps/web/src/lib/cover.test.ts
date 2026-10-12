import { coverToFile } from './cover';

describe('coverToFile', () => {
  it('arma un archivo con la extensión del tipo', () => {
    const file = coverToFile({
      source: 'openlibrary',
      isbn: null,
      title: 'Rayuela',
      contentType: 'image/png',
      imageBase64: btoa('png'),
    });
    expect(file.name).toBe('caratula.png');
    expect(file.type).toBe('image/png');
    expect(file.size).toBe(3);
  });

  it('usa jpg si el tipo no está mapeado', () => {
    const file = coverToFile({
      source: 'openlibrary',
      isbn: null,
      title: null,
      contentType: 'image/gif',
      imageBase64: btoa('x'),
    });
    expect(file.name).toBe('caratula.jpg');
  });
});
