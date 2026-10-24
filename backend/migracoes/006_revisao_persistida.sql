-- Revisão persistida (cenários 57 a 59) e exclusão de tarefa (cenário 60).
-- O reconhecimento de alerta e a fonte escolhida ficam no JSON do item (`alerts[].ack` e
-- `srcs[].chosen`), no formato de src/workspace/data.js; "marcar como revisado", em colunas.
ALTER TABLE itens ADD COLUMN revisado_por text;
ALTER TABLE itens ADD COLUMN revisado_em timestamptz;

ALTER TABLE eventos DROP CONSTRAINT eventos_acao_check;
ALTER TABLE eventos ADD CONSTRAINT eventos_acao_check CHECK (acao IN (
  'edicao', 'restauracao', 'aprovacao', 'aprovacao_removida', 'avaliacao', 'alerta_reconhecido', 'fonte_escolhida', 'revisao'
));
-- Tipo do alerta reconhecido ou número da fonte escolhida.
ALTER TABLE eventos ADD COLUMN detalhe text;

-- Eventos continuam só de inclusão (cenário 49). A única exceção é a exclusão da tarefa, que
-- apaga os eventos dela em cascata (cenário 60): o apagamento só passa quando a tarefa já não existe.
-- O esquema vem da própria tabela, porque a função roda com search_path vazio.
CREATE OR REPLACE FUNCTION eventos_so_inclusao() RETURNS trigger
SET search_path = ''
AS $$
DECLARE
  tarefa_existe boolean;
BEGIN
  IF TG_OP = 'DELETE' THEN
    EXECUTE format('SELECT EXISTS (SELECT 1 FROM %I.tarefas WHERE id = $1)', TG_TABLE_SCHEMA) INTO tarefa_existe USING OLD.tarefa_id;
    IF NOT tarefa_existe THEN
      RETURN OLD;
    END IF;
  END IF;
  RAISE EXCEPTION 'eventos só aceitam inclusão';
END;
$$ LANGUAGE plpgsql;
