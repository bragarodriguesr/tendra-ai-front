-- Parágrafos da sugestão original, com as fontes de cada um, para "restaurar sugestão" voltar ao
-- texto e às fontes da geração (cenário 43). Nunca mudam depois da geração.
ALTER TABLE itens ADD COLUMN paras_originais jsonb;
UPDATE itens SET paras_originais = paras WHERE paras_originais IS NULL;
ALTER TABLE itens ALTER COLUMN paras_originais SET NOT NULL;
