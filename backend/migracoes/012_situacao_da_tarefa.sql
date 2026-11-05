-- Fase O: ciclo de vida da tarefa (SPEC_FASE_O.md, PO1).
-- A situação é a decisão da empresa sobre a tarefa, separada do `estado` técnico do processamento
-- (processando, pronta, falha), que a retomada e a reclassificação continuam lendo.
--   em_andamento: padrão, inclusive para todas as tarefas de antes da fase (cenário O16);
--   finalizada:   entregue, 100% aprovada e baixada (PO3);
--   arquivada:    abandonada, com itens, alertas e estágio preservados (PO6).
-- Quem mudou e quando valem para a situação atual; ao reativar, voltam a vazio.
ALTER TABLE tarefas ADD COLUMN situacao text NOT NULL DEFAULT 'em_andamento'
  CHECK (situacao IN ('em_andamento', 'finalizada', 'arquivada'));
ALTER TABLE tarefas ADD COLUMN situacao_por text;
ALTER TABLE tarefas ADD COLUMN situacao_em timestamptz;
ALTER TABLE tarefas ADD CONSTRAINT tarefas_situacao_com_autoria
  CHECK (situacao = 'em_andamento' OR (situacao_por IS NOT NULL AND situacao_em IS NOT NULL));
