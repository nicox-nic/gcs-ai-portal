export function parseCommaList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function parseMultilineList(value: string): string[] {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function joinCommaList(items: string[]): string {
  return items.join(', ')
}

export function joinMultilineList(items: string[]): string {
  return items.join('\n')
}
