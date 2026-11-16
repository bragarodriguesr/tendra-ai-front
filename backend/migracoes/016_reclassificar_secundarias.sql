-- Fase U, correção de 12/11/2026: na classificação v2, toda área secundária era descartada, porque a
-- seção vinha com o caminho da lista de entrada ("Título > 2. Seção") e o código comparava só o título.
-- Os documentos classificados assim ficam com a versão marcada como incompleta e são reclassificados
-- ao iniciar o backend, mantendo a área principal até lá.
UPDATE documentos SET areas_versao = 'classificacao-documento-v2-sem-secundarias' WHERE areas_versao = 'classificacao-documento-v2';
