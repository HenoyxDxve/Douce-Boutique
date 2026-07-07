const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 400'%3E%3Crect width='300' height='400' fill='%23f3ede7'/%3E%3Ctext x='150' y='205' font-family='sans-serif' font-size='16' fill='%23b8a99a' text-anchor='middle'%3EPas d'image%3C/text%3E%3C/svg%3E";

export function resolveImageUrl(path: string | null | undefined): string {
  if (!path) return PLACEHOLDER;
  return path;
}
