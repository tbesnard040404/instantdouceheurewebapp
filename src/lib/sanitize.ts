export function sanitizeText(input: unknown): string {
  if (typeof input !== 'string') return ''
  return input.trim().replace(/[<>'"]/g, '')
}
