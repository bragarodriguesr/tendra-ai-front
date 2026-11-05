-- Fase O, ajuste de 05/11/2026 (SPEC_FASE_O.md, cenários O18 e O19): ações sobre a tarefa no Histórico.
-- Importar, finalizar, arquivar, reativar e excluir ficam numa tabela própria, só de inclusão e sem
-- chave estrangeira para `tarefas`: o registro da exclusão sobrevive à tarefa excluída. O nome da
-- tarefa e da empresa são guardados no momento da ação, pelo mesmo motivo.
CREATE TABLE eventos_de_tarefa (
  id              serial PRIMARY KEY,
  organizacao_id  uuid NOT NULL REFERENCES organizacoes (id),
  tarefa_id       text NOT NULL,
  tarefa          text NOT NULL,
  empresa         text,
  acao            text NOT NULL CHECK (acao IN ('importacao', 'finalizacao', 'arquivamento', 'reativacao', 'exclusao')),
  pessoa          text NOT NULL,
  papel           text,
  em              timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX eventos_de_tarefa_por_organizacao ON eventos_de_tarefa (organizacao_id, em DESC);
ALTER TABLE eventos_de_tarefa ENABLE ROW LEVEL SECURITY;

CREATE FUNCTION eventos_de_tarefa_so_inclusao() RETURNS trigger
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'eventos de tarefa só aceitam inclusão';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER eventos_de_tarefa_sem_alteracao BEFORE UPDATE OR DELETE ON eventos_de_tarefa
  FOR EACH ROW EXECUTE FUNCTION eventos_de_tarefa_so_inclusao();
