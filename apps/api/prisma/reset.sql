-- =============================================================
-- PASI — Reset do banco de dados
-- Apaga todos os dados de transação e mantém:
--   • Tabelas de domínio (tipos, situações, unidades, etc.)
--   • Apenas os formulários 2 (Triagem Socioeconômica) e 6 (SCARED)
--   • Apenas os dois usuários abaixo
-- =============================================================

BEGIN;

-- 1. Logs e documentos (sem dependentes)
DELETE FROM log_respostas;
DELETE FROM documentos;

-- 2. Respostas
DELETE FROM resposta;

-- 3. Avaliações e vínculos formulário-paciente
DELETE FROM formulario_avaliacao;
DELETE FROM formulario_paciente;

-- 4. Vínculos atendimento-formulário e atendimentos
DELETE FROM atendimento_formulario;
DELETE FROM atendimento;

-- 5. Logs administrativos
DELETE FROM log_adm_geral;

-- 6. Remover formulários exceto 2 e 6 (e suas perguntas/opções)
DELETE FROM opcao_pergunta
WHERE id_pergunta IN (
    SELECT id_pergunta FROM pergunta WHERE id_formulario NOT IN (2, 6)
);
DELETE FROM pergunta WHERE id_formulario NOT IN (2, 6);
DELETE FROM formulario WHERE id_formulario NOT IN (2, 6);

-- 7. Nullificar FK opcional de usuário em perguntas
--    (evita violação de FK ao excluir usuários)
UPDATE pergunta SET id_usuario_cad = NULL;

-- 8. Excluir todos os usuários exceto os dois mantidos
DELETE FROM usuario
WHERE email NOT IN ('fhector7@gmail.com', 'maria@email.com');

COMMIT;

-- Verificação final
SELECT id_usuario, id_tipo_usuario, nome, email
FROM usuario
ORDER BY id_usuario;
