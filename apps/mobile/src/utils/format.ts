export function formatProtocolo(id: number, dtCadastro?: string | null) {
  const year = dtCadastro ? new Date(dtCadastro).getFullYear() : new Date().getFullYear();
  return `ATD-${year}-${String(id).padStart(4, '0')}`;
}

export function formatData(iso?: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function maskCpf(cpf: string) {
  const c = cpf.replace(/\D/g, '');
  if (c.length !== 11) return cpf;
  return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`;
}
