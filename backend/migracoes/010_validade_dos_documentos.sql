-- Validade do documento da base (campo `validade` do cabeçalho do .md, opcional). A partir dessa data o
-- documento fica vencido: sai da geração e não pode ser reativado. Sem validade, nunca vence
-- ("Indefinido" na tela). Os documentos já carregados ficam sem validade.
ALTER TABLE documentos ADD COLUMN validade date;
