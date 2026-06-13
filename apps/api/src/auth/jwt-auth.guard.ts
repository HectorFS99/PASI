import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Protege rotas exigindo um Bearer token JWT válido. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
