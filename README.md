### PASI — Monorepo

Plataforma de apoio ao pré-diagnóstico de crianças com indícios de ansiedade.
Arquitetura em 3 camadas:

- **Apresentação** — React Native (`apps/mobile`) — _em desenvolvimento_
- **Negócio** — API RESTful NestJS (`apps/api`)
- **Dados** — PostgreSQL no Neon, acessado via Prisma ORM

## Estrutura

```
pasi/
├── apps/
│   ├── api/      # NestJS + Prisma (camada de negócio)
│   └── mobile/   # React Native (camada de apresentação) — futuro
├── package.json  # npm workspaces
└── README.md
```

## Pré-requisitos

- Node.js 20+ (testado no 25)
- Conta no Neon com o banco `pasi` já criado a partir do DDL

## Rodando a API

```bash
# na raiz do monorepo
npm install

# configurar o banco
cp apps/api/.env.example apps/api/.env
# edite apps/api/.env e preencha DATABASE_URL com a string do Neon

# gerar o Prisma Client a partir do banco existente
npm run prisma:pull --workspace apps/api
npm run prisma:generate --workspace apps/api

# subir a API em modo dev
npm run api:dev
```

A documentação Swagger fica em `http://localhost:3000/docs`.
