import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  id_usuario: number;
  tipo: number;
  email: string;
}

/** Injeta o usuário autenticado (vindo do JwtStrategy.validate) no handler. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as AuthUser;
  },
);
