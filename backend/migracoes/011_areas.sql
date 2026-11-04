-- Fase N: tratamento de área (SPEC_FASE_N.md, PN1 a PN9).
-- A lista de áreas fica no código (src/regras/areas.ts), não numa restrição do banco, para permitir
-- depois uma lista por organização (requisito P2). O banco só garante a forma.

-- Áreas do Aprovador (PN3). O Revisor nunca tem área. C-Level vale por todas as áreas (PN2).
ALTER TABLE perfis ADD COLUMN areas text[] NOT NULL DEFAULT '{}';
ALTER TABLE perfis ADD CONSTRAINT perfis_areas_so_do_aprovador CHECK (papel = 'Aprovador' OR cardinality(areas) = 0);

-- Área principal da pergunta (PN4), atribuída pela classificação no processamento (PN5).
ALTER TABLE itens ADD COLUMN area text NOT NULL DEFAULT 'Geral' CHECK (length(trim(area)) > 0);

-- Quando a tarefa foi classificada. As tarefas em aberto (algum item não aprovado) ficam sem a
-- marca e são reclassificadas ao iniciar o backend (PN8, cenário N15); as já concluídas ficam com
-- os itens em "Geral" e marcadas, para nunca serem reclassificadas.
ALTER TABLE tarefas ADD COLUMN areas_classificadas_em timestamptz;
UPDATE tarefas t SET areas_classificadas_em = now()
 WHERE t.estado = 'pronta' AND NOT EXISTS (SELECT 1 FROM itens i WHERE i.tarefa_id = t.id AND i.st <> 'aprovada');

-- Os Aprovadores atuais passam a C-Level, para ninguém perder a aprovação (PN8).
UPDATE perfis SET areas = '{C-Level}' WHERE papel = 'Aprovador';

-- Troca da área de um item (PN7, cenário N10): detalhe "de → para".
ALTER TABLE eventos DROP CONSTRAINT eventos_acao_check;
ALTER TABLE eventos ADD CONSTRAINT eventos_acao_check CHECK (acao IN (
  'edicao', 'restauracao', 'aprovacao', 'aprovacao_removida', 'avaliacao', 'alerta_reconhecido', 'fonte_escolhida', 'revisao', 'area'
));
