/**
 * Extrai a mensagem de erro devolvida pela API (NestJS). O ValidationPipe
 * devolve `message` como array; nesse caso usa a primeira mensagem.
 */
export function mensagemErroApi(err: unknown, fallback: string): string {
  const message = (err as { response?: { data?: { message?: unknown } } })?.response?.data
    ?.message;
  if (Array.isArray(message)) return typeof message[0] === 'string' ? message[0] : fallback;
  return typeof message === 'string' && message ? message : fallback;
}
