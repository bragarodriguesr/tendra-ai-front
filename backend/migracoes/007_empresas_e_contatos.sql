-- Empresas e contatos informados na Nova RFP, numa estrutura própria para consulta futura
-- (cenário 63). Nunca vão à IA (cenário 6). `tarefas.dados` continua com a cópia do formulário.

-- Empresa: a mesma quando o CNPJ é igual; sem CNPJ, quando o nome é igual (sem diferenciar maiúsculas).
CREATE TABLE empresas (
  id            serial PRIMARY KEY,
  nome          text NOT NULL CHECK (length(trim(nome)) > 0),
  cnpj          text UNIQUE CHECK (cnpj ~ '^[0-9]{14}$'),
  criada_em     timestamptz NOT NULL DEFAULT now(),
  atualizada_em timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX empresas_nome_sem_cnpj ON empresas (lower(trim(nome))) WHERE cnpj IS NULL;

-- Contato da empresa: com e-mail, é o mesmo contato em todas as tarefas da empresa.
CREATE TABLE contatos (
  id            serial PRIMARY KEY,
  empresa_id    integer NOT NULL REFERENCES empresas (id) ON DELETE CASCADE,
  nome          text NOT NULL DEFAULT '',
  cargo         text NOT NULL DEFAULT '',
  telefone      text NOT NULL DEFAULT '',
  email         text NOT NULL DEFAULT '',
  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX contatos_empresa ON contatos (empresa_id);
CREATE UNIQUE INDEX contatos_email_por_empresa ON contatos (empresa_id, lower(email)) WHERE email <> '';

-- Contatos informados em cada tarefa, na ordem do formulário. Sai com a tarefa excluída (cenário 60);
-- a empresa e os contatos ficam para consulta.
CREATE TABLE tarefa_contatos (
  tarefa_id  text NOT NULL REFERENCES tarefas (id) ON DELETE CASCADE,
  contato_id integer NOT NULL REFERENCES contatos (id) ON DELETE CASCADE,
  posicao    integer NOT NULL,
  PRIMARY KEY (tarefa_id, contato_id)
);

ALTER TABLE tarefas ADD COLUMN empresa_id integer REFERENCES empresas (id) ON DELETE SET NULL;
CREATE INDEX tarefas_empresa ON tarefas (empresa_id);

ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarefa_contatos ENABLE ROW LEVEL SECURITY;

-- Tarefas já gravadas: empresa e contatos a partir de `tarefas.dados`.
CREATE TEMPORARY TABLE empresas_das_tarefas AS
  SELECT id AS tarefa_id, criada_em, trim(dados->>'empresa') AS nome,
    CASE WHEN regexp_replace(coalesce(dados->>'cnpj', ''), '\D', '', 'g') ~ '^[0-9]{14}$'
      THEN regexp_replace(dados->>'cnpj', '\D', '', 'g') END AS cnpj
  FROM tarefas WHERE coalesce(trim(dados->>'empresa'), '') <> '';

INSERT INTO empresas (nome, cnpj)
  SELECT DISTINCT ON (coalesce(cnpj, lower(nome))) nome, cnpj FROM empresas_das_tarefas
  ORDER BY coalesce(cnpj, lower(nome)), criada_em DESC
  ON CONFLICT DO NOTHING;

UPDATE tarefas t SET empresa_id = e.id
  FROM empresas_das_tarefas x JOIN empresas e
    ON (x.cnpj IS NOT NULL AND e.cnpj = x.cnpj) OR (x.cnpj IS NULL AND e.cnpj IS NULL AND lower(trim(e.nome)) = lower(x.nome))
  WHERE t.id = x.tarefa_id;

CREATE TEMPORARY TABLE contatos_das_tarefas AS
  SELECT t.id AS tarefa_id, t.empresa_id, t.criada_em, c.posicao::integer AS posicao,
    trim(coalesce(c.valor->>'nome', '')) AS nome, trim(coalesce(c.valor->>'cargo', '')) AS cargo,
    trim(coalesce(c.valor->>'telefone', '')) AS telefone, trim(coalesce(c.valor->>'email', '')) AS email
  FROM tarefas t, jsonb_array_elements(coalesce(t.dados->'contatos', '[]'::jsonb)) WITH ORDINALITY AS c(valor, posicao)
  WHERE t.empresa_id IS NOT NULL;

INSERT INTO contatos (empresa_id, nome, cargo, telefone, email)
  SELECT DISTINCT ON (empresa_id, lower(email)) empresa_id, nome, cargo, telefone, email
  FROM contatos_das_tarefas WHERE email <> '' ORDER BY empresa_id, lower(email), criada_em DESC
  ON CONFLICT DO NOTHING;
INSERT INTO contatos (empresa_id, nome, cargo, telefone, email)
  SELECT empresa_id, nome, cargo, telefone, email FROM contatos_das_tarefas
  WHERE email = '' AND (nome <> '' OR cargo <> '' OR telefone <> '');

INSERT INTO tarefa_contatos (tarefa_id, contato_id, posicao)
  SELECT x.tarefa_id, c.id, x.posicao FROM contatos_das_tarefas x JOIN contatos c ON c.empresa_id = x.empresa_id
    AND ((x.email <> '' AND lower(c.email) = lower(x.email))
      OR (x.email = '' AND c.email = '' AND c.nome = x.nome AND c.cargo = x.cargo AND c.telefone = x.telefone))
  ON CONFLICT DO NOTHING;

DROP TABLE empresas_das_tarefas;
DROP TABLE contatos_das_tarefas;
