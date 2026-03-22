export function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeForSearch(value: string): string {
  return normalizeWhitespace(value).toLowerCase();
}
