-- Fase D (etapa D2): contas, sessões e tentativas de login do modo compartilhado.
-- A senha nunca fica aqui: ela é conferida pelo Supabase Auth; `perfis.id` é o id do usuário lá.

-- Pessoa que pode entrar, com o papel que limita o que ela faz (cenários D1, D8 e D9).
CREATE TABLE perfis (
  id         uuid PRIMARY KEY,
  email      text NOT NULL UNIQUE CHECK (email = lower(email)),
  nome       text NOT NULL CHECK (length(trim(nome)) > 0),
  papel      text NOT NULL CHECK (papel IN ('Revisor', 'Aprovador')),
  -- Conta desativada não entra e perde as sessões abertas (cenário D2).
  ativo      boolean NOT NULL DEFAULT true,
  criado_em  timestamptz NOT NULL DEFAULT now()
);

-- Sessão do backend: sair apaga a linha e o cookie deixa de valer na hora (cenário D5).
-- Só o hash do identificador é guardado; o valor fica apenas no cookie da pessoa.
CREATE TABLE sessoes (
  id_hash    text PRIMARY KEY,
  perfil_id  uuid NOT NULL REFERENCES perfis (id) ON DELETE CASCADE,
  criada_em  timestamptz NOT NULL DEFAULT now(),
  -- Expira depois de um tempo sem uso (cenário D6).
  ultimo_uso timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessoes_perfil ON sessoes (perfil_id);

-- Base do limite de tentativas por e-mail e por IP (cenário D7).
CREATE TABLE tentativas_login (
  id      serial PRIMARY KEY,
  email   text NOT NULL,
  ip      text NOT NULL,
  sucesso boolean NOT NULL,
  em      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX tentativas_login_email ON tentativas_login (email, em);
CREATE INDEX tentativas_login_ip ON tentativas_login (ip, em);

-- No Supabase, a API pública (PostgREST) enxerga as tabelas do esquema public. Com Row Level
-- Security ligado e nenhuma regra de acesso, ela não lê nem grava nada; o backend usa a conexão
-- direta do dono das tabelas, que não é afetada (cenário D11).
ALTER TABLE migracoes_aplicadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE requisicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tentativas_login ENABLE ROW LEVEL SECURITY;

-- A função do gatilho de eventos não depende de nenhum esquema.
ALTER FUNCTION eventos_so_inclusao() SET search_path = '';
