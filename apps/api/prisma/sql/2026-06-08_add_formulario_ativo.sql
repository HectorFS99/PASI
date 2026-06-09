-- =============================================================
-- PASI - Alteração de schema: coluna "ativo" em formulario
-- Suporta o "Desativar formulário" (Fluxo de Usuário, tela 4.1).
-- Rodar UMA vez no banco do Neon (DBeaver/psql/console do Neon).
-- ADD COLUMN ... DEFAULT TRUE já preenche as linhas existentes com TRUE.
-- =============================================================

ALTER TABLE formulario
    ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;

-- Garante que registros antigos fiquem como ativos (idempotente).
UPDATE formulario SET ativo = TRUE WHERE ativo IS NULL;
