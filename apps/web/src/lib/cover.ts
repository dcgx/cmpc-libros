export type CoverLookup = {
  source: 'openlibrary';
  isbn: string | null;
  title: string | null;
  contentType: string;
  imageBase64: string;
};

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export function coverToFile(cover: CoverLookup): File {
  const binary = atob(cover.imageBase64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  const extension = EXTENSIONS[cover.contentType] ?? 'jpg';
  return new File([bytes], `caratula.${extension}`, { type: cover.contentType });
}
