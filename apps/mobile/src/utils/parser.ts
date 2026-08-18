export function formatList(items: string[]): string {
  return items.join(', ');
}

export function stringToList(value: string): string[] {
  return value
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}
