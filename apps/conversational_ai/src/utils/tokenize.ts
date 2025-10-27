const tokenRegex = /[\w']+|[^\s\w]/g

export function tokenizeText(text: string): string[] {
  return text.match(tokenRegex) ?? []
}
