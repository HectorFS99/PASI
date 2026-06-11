/**
 * Valida CPF pelo cálculo dos dígitos verificadores.
 * Ver: https://www.campuscode.com.br/conteudos/o-calculo-do-digito-verificador-do-cpf-e-do-cnpj
 */
export function isCpfValido(cpf: string): boolean {
  const c = cpf.replace(/\D/g, '');
  if (c.length !== 11) return false;
  // Rejeita sequências de dígitos iguais (000..., 111..., etc.)
  if (/^(\d)\1{10}$/.test(c)) return false;

  const digito = (base: string, pesoInicial: number): number => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) {
      soma += parseInt(base[i], 10) * (pesoInicial - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  const d1 = digito(c.slice(0, 9), 10);
  if (d1 !== parseInt(c[9], 10)) return false;

  const d2 = digito(c.slice(0, 10), 11);
  return d2 === parseInt(c[10], 10);
}

/**
 * Valida e-mail exigindo um domínio com TLD (ex.: usuario@dominio.com),
 * não apenas a presença de "@".
 */
export function isEmailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}
