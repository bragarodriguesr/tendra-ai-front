-- Fase U, revisão da classificação (12/11/2026): versão da instrução que deu as áreas do documento.
-- Ao iniciar, o backend reclassifica os documentos classificados com outra versão (a v1, até aqui),
-- mantendo as áreas atuais até a nova classificação terminar. RFPs passadas não vão à IA: ficam sem versão.
ALTER TABLE documentos ADD COLUMN areas_versao text;
UPDATE documentos SET areas_versao = 'classificacao-documento-v1' WHERE areas_classificadas_em IS NOT NULL AND tipo = 'documento';
