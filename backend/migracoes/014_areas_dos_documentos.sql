-- Fase U: seleção da base por área (SPEC_FASE_U.md, PU1 a PU13).
-- Áreas do documento (PU1): uma ou mais da lista da fase N, ou "Geral" (vale para todas as
-- perguntas). A lista fica no código (src/regras/areas.ts), como a das perguntas.
--   areas '{}' e sem marca: pendente, a IA ainda não classificou ("Classificando…" na tela);
--   areas '{Geral}' e sem marca: a classificação falhou (PU4) e é tentada de novo ao iniciar;
--   com a marca: classificado. Até lá, o documento conta como "Geral" na seleção (PU5).
ALTER TABLE documentos ADD COLUMN areas text[] NOT NULL DEFAULT '{}';
ALTER TABLE documentos ADD COLUMN areas_classificadas_em timestamptz;

-- RFPs passadas não vão à IA: ficam "Geral" (PU2, cenário U5b).
UPDATE documentos SET areas = '{Geral}', areas_classificadas_em = now() WHERE tipo = 'rfp-passada';

-- De onde veio a resposta do item (PU10), só para as métricas: o contexto da área, a base inteira
-- ou a segunda tentativa com a base inteira (PU8). Os itens de antes da fase vieram da base inteira.
ALTER TABLE itens ADD COLUMN contexto text NOT NULL DEFAULT 'base' CHECK (contexto IN ('area', 'base', 'base_segunda_tentativa'));
