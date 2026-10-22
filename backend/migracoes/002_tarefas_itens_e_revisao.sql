-- Tarefas, itens, registro de requisições, eventos e avaliações (etapa B1).
-- Fontes e alertas ficam no item como JSON, no formato de src/workspace/data.js: são lidos e
-- gravados sempre junto com o item, e o contrato com o front não muda.

CREATE TABLE tarefas (
  id                  text PRIMARY KEY,
  estado              text NOT NULL CHECK (estado IN ('processando', 'pronta', 'falha')),
  -- Motivo legível da falha (cenário 17), sem a chave da API.
  motivo              text,
  -- Nome original do arquivo, só para exibição; o arquivo é gravado com nome gerado (cenário 31).
  arquivo             text NOT NULL,
  caminho_da_planilha text NOT NULL,
  -- Campos da tela Nova RFP (nome, empresa, CNPJ, contatos, prazo, responsável). Nunca vão à IA (cenário 6).
  dados               jsonb NOT NULL DEFAULT '{}',
  total               integer NOT NULL DEFAULT 0,
  processadas         integer NOT NULL DEFAULT 0,
  -- Modelo, versão das instruções e lote (cenário 38) e métricas (cenário 37).
  comportamento       jsonb,
  metricas            jsonb,
  caminho_da_planilha_preenchida text,
  criada_em           timestamptz NOT NULL DEFAULT now(),
  concluida_em        timestamptz
);

CREATE TABLE itens (
  tarefa_id  text NOT NULL REFERENCES tarefas (id) ON DELETE CASCADE,
  numero     integer NOT NULL,
  aba        text NOT NULL,
  linha      integer NOT NULL,
  q          text NOT NULL,
  paras      jsonb NOT NULL,
  srcs       jsonb NOT NULL,
  alerts     jsonb NOT NULL,
  st         text NOT NULL CHECK (st IN ('sugerida', 'em-revisao', 'revisada', 'aprovada', 'sem-rascunho')),
  -- Texto original da sugestão: nunca muda depois da geração.
  orig       text NOT NULL,
  -- Aprovação: só uma pessoa aprova (cenários 33 e 44).
  aprovado_por text,
  aprovado_em  timestamptz,
  PRIMARY KEY (tarefa_id, numero)
);

-- Registro das requisições à IA de cada tarefa (cenário 29): sem chave e sem conteúdo.
CREATE TABLE requisicoes (
  id        serial PRIMARY KEY,
  tarefa_id text NOT NULL REFERENCES tarefas (id) ON DELETE CASCADE,
  dados     jsonb NOT NULL
);

-- Eventos de revisão: só inclusão (cenário 49). Sem o texto das respostas.
CREATE TABLE eventos (
  id                   serial PRIMARY KEY,
  tarefa_id            text NOT NULL REFERENCES tarefas (id) ON DELETE CASCADE,
  item_numero          integer NOT NULL,
  acao                 text NOT NULL CHECK (acao IN ('edicao', 'restauracao', 'aprovacao', 'aprovacao_removida', 'avaliacao')),
  pessoa               text NOT NULL,
  papel                text NOT NULL,
  em                   timestamptz NOT NULL DEFAULT now(),
  porcentagem_alterada numeric,
  avaliacao            text,
  motivo               text
);

-- Avaliação de cada pessoa por item; uma nova avaliação da mesma pessoa substitui a anterior (cenário 46).
CREATE TABLE avaliacoes (
  tarefa_id   text NOT NULL REFERENCES tarefas (id) ON DELETE CASCADE,
  item_numero integer NOT NULL,
  pessoa      text NOT NULL,
  papel       text NOT NULL,
  valor       text NOT NULL CHECK (valor IN ('positiva', 'negativa')),
  motivo      text,
  em          timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tarefa_id, item_numero, pessoa)
);

-- Eventos não podem ser alterados nem apagados, só acrescentados (cenário 49).
CREATE FUNCTION eventos_so_inclusao() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'eventos só aceitam inclusão';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER eventos_sem_alteracao BEFORE UPDATE OR DELETE ON eventos
  FOR EACH ROW EXECUTE FUNCTION eventos_so_inclusao();
