-- Fase K (etapa K1): organizações. Cada empresa usuária, cliente da Tendra.ai, só vê os próprios dados
-- (SPEC, cenários 66 a 79). As tabelas raiz guardam a organização dona; as filhas pertencem a ela
-- pela chave estrangeira que já têm (blocos pelo documento; itens, eventos e demais pela tarefa;
-- contatos pela empresa).

CREATE TABLE organizacoes (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome      text NOT NULL CHECK (length(trim(nome)) > 0),
  -- Organização desativada não entra e perde as sessões abertas (cenário 68).
  ativa     boolean NOT NULL DEFAULT true,
  criada_em timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX organizacoes_nome ON organizacoes (lower(trim(nome)));
ALTER TABLE organizacoes ENABLE ROW LEVEL SECURITY;

-- Organização inicial (PK3): recebe todos os dados de antes da fase K e é a do modo local.
-- O id fixo é o de `ORGANIZACAO_INICIAL` em src/persistencia/organizacoes.ts.
INSERT INTO organizacoes (id, nome) VALUES ('6f1c2a9e-4d3b-4f8a-9c7e-2b5d8e1a0f34', 'Pulse Benefícios');

ALTER TABLE perfis ADD COLUMN organizacao_id uuid REFERENCES organizacoes (id);
ALTER TABLE documentos ADD COLUMN organizacao_id uuid REFERENCES organizacoes (id);
ALTER TABLE tarefas ADD COLUMN organizacao_id uuid REFERENCES organizacoes (id);
ALTER TABLE empresas ADD COLUMN organizacao_id uuid REFERENCES organizacoes (id);

UPDATE perfis SET organizacao_id = '6f1c2a9e-4d3b-4f8a-9c7e-2b5d8e1a0f34';
UPDATE documentos SET organizacao_id = '6f1c2a9e-4d3b-4f8a-9c7e-2b5d8e1a0f34';
UPDATE tarefas SET organizacao_id = '6f1c2a9e-4d3b-4f8a-9c7e-2b5d8e1a0f34';
UPDATE empresas SET organizacao_id = '6f1c2a9e-4d3b-4f8a-9c7e-2b5d8e1a0f34';

-- Sem valor padrão: um registro gravado sem organização é recusado pelo banco.
ALTER TABLE perfis ALTER COLUMN organizacao_id SET NOT NULL;
ALTER TABLE documentos ALTER COLUMN organizacao_id SET NOT NULL;
ALTER TABLE tarefas ALTER COLUMN organizacao_id SET NOT NULL;
ALTER TABLE empresas ALTER COLUMN organizacao_id SET NOT NULL;

CREATE INDEX perfis_organizacao ON perfis (organizacao_id);
CREATE INDEX tarefas_organizacao ON tarefas (organizacao_id, criada_em DESC);

-- O nome do documento é a identidade dele dentro da organização (cenário 70).
ALTER TABLE documentos DROP CONSTRAINT documentos_nome_key;
ALTER TABLE documentos ADD CONSTRAINT documentos_organizacao_nome UNIQUE (organizacao_id, nome);

-- A empresa emitente é a mesma pelo CNPJ ou pelo nome só dentro da organização (cenário 73).
ALTER TABLE empresas DROP CONSTRAINT empresas_cnpj_key;
ALTER TABLE empresas ADD CONSTRAINT empresas_organizacao_cnpj UNIQUE (organizacao_id, cnpj);
DROP INDEX empresas_nome_sem_cnpj;
CREATE UNIQUE INDEX empresas_nome_sem_cnpj ON empresas (organizacao_id, lower(trim(nome))) WHERE cnpj IS NULL;

-- Uma tarefa só aponta para uma empresa da mesma organização, garantido pelo banco (cenário 77).
ALTER TABLE empresas ADD CONSTRAINT empresas_id_organizacao UNIQUE (id, organizacao_id);
ALTER TABLE tarefas DROP CONSTRAINT tarefas_empresa_id_fkey;
ALTER TABLE tarefas ADD CONSTRAINT tarefas_empresa_da_organizacao FOREIGN KEY (empresa_id, organizacao_id)
  REFERENCES empresas (id, organizacao_id) ON DELETE SET NULL (empresa_id);
