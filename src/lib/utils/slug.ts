export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function eventIdFrom(fecha: string, ubicacion: string): string {
  const city = (ubicacion || 'colombia').split(',')[0].trim();
  const citySlug = slugify(city);
  return `${fecha}_${citySlug}`;
}
