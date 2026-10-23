-- Fase D (etapa D8): respostas de cada lote gravadas assim que o lote termina, para retomar a tarefa
-- depois de um reinício sem gerar de novo o que já foi gerado (cenário D15). Apagadas quando a
-- tarefa termina, pronta ou em falha. O texto da pergunta confere que a resposta é da mesma pergunta.
CREATE TABLE respostas_geradas (
  tarefa_id text NOT NULL REFERENCES tarefas (id) ON DELETE CASCADE,
  numero    integer NOT NULL,
  texto     text NOT NULL,
  resposta  jsonb NOT NULL,
  PRIMARY KEY (tarefa_id, numero)
);
ALTER TABLE respostas_geradas ENABLE ROW LEVEL SECURITY;
