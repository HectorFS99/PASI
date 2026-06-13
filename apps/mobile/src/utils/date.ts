// Máscara progressiva dd/mm/aaaa a partir de qualquer texto digitado.
export function maskDataBr(text: string): string {
  const d = text.replace(/\D/g, '').slice(0, 8);
  if (d.length > 4) return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
  if (d.length > 2) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return d;
}

// "dd/mm/aaaa" -> "aaaa-mm-dd" (ISO). Retorna undefined se incompleta/inválida.
export function brParaIso(br: string): string | undefined {
  if (br.length !== 10) return undefined;
  const [d, m, y] = br.split('/');
  const dia = Number(d);
  const mes = Number(m);
  const ano = Number(y);
  if (!dia || !mes || !ano || mes > 12 || dia > 31) return undefined;
  return `${y}-${m}-${d}`;
}

// Date -> "dd/mm/aaaa"
export function dateParaBr(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}/${m}/${date.getFullYear()}`;
}

// "dd/mm/aaaa" -> Date local (ou null se inválida)
export function brParaDate(br: string): Date | null {
  if (br.length !== 10) return null;
  const [d, m, y] = br.split('/').map(Number);
  if (!d || !m || !y) return null;
  const date = new Date(y, m - 1, d);
  return isNaN(date.getTime()) ? null : date;
}

// Instante (ISO UTC) do INÍCIO do dia no fuso local. Para filtros de data:
// "12/06/2026" -> 2026-06-12T00:00:00 local convertido para UTC.
export function brParaIsoInicioDia(br: string): string | undefined {
  const d = brParaDate(br);
  if (!d) return undefined;
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

// Instante (ISO UTC) do FIM do dia no fuso local (23:59:59.999).
export function brParaIsoFimDia(br: string): string | undefined {
  const d = brParaDate(br);
  if (!d) return undefined;
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}
