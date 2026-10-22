-- Base de conhecimento carregada pelo comando carregar-base (etapa A4).
-- Formato dos arquivos de origem: docs/mvp-resposta-rfp/FORMATO_BASE_MD.md.

CREATE TABLE documentos (
  id               serial PRIMARY KEY,
  -- Identidade do documento: caminho relativo à pasta carregada, com "/" como separador.
  caminho          text NOT NULL UNIQUE,
  titulo           text NOT NULL,
  tipo             text NOT NULL CHECK (tipo IN ('documento', 'rfp-passada')),
  atualizado_em    date NOT NULL,
  versao           text,
  -- SHA-256 do arquivo, para ignorar recargas sem mudança.
  hash             text NOT NULL,
  tamanho_bytes    integer NOT NULL,
  -- Estimativa (caracteres / 4). A contagem exata pela API entra na etapa A5.
  tokens_estimados integer NOT NULL,
  -- Estado só do banco: recarregar o arquivo não muda (cenário 40).
  ativo            boolean NOT NULL DEFAULT true,
  enviado_por      text,
  carregado_em     timestamptz NOT NULL DEFAULT now(),
  substituido_em   timestamptz
);

CREATE TABLE blocos (
  id                serial PRIMARY KEY,
  documento_id      integer NOT NULL REFERENCES documentos (id) ON DELETE CASCADE,
  ordem             integer NOT NULL,
  -- Título mais próximo acima do bloco, ou "(início)" para texto antes do primeiro título.
  secao             text NOT NULL,
  -- Caminho completo dos títulos, do mais externo ao mais interno.
  caminho_de_secoes text[] NOT NULL,
  -- Linhas contadas desde a primeira linha do arquivo, cabeçalho incluído.
  linha_inicial     integer NOT NULL,
  linha_final       integer NOT NULL,
  texto             text NOT NULL,
  UNIQUE (documento_id, ordem)
);
