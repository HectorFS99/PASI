// Normaliza para comparacoes de busca: minusculas e sem acentos.
export function normalizarTexto(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

// Busca local sem sensibilidade a maiusculas/acentos.
export function contemTexto(texto: string | undefined | null, busca: string): boolean {
  if (!busca) return true;
  return normalizarTexto(texto ?? '').includes(normalizarTexto(busca));
}
