---
fase: D-publicacao-compartilhada
status: draft
spec: docs/mvp-resposta-rfp/SPEC_FASE_D.md
---

# Plano da fase D: publicação compartilhada com login

*Escrito em 23/10/2026, quando a fase D começou por decisão do grupo (ver "Início com exceção" no spec). Deriva de `SPEC_FASE_D.md` e das adaptações listadas na fase D de `PLAN.md`. Material de referência consultado por pedido expresso: `docs/referencia/mvp-proposta-1/PLAN.md` (etapas 0 a 8), `SPEC.md` e `ARQUITETURA_MAPPING.md`.*

## Objetivo

Publicar o backend e o front num ambiente único para o grupo, com login, sessão, papéis e dados compartilhados, sem perder o modo local que sustenta os testes das fases A a C. Com isso, a taxa de aceitação passa a ser medida num só banco (cenário D13), o que destrava a medição pendente da fase A.

**Arquitetura do modo compartilhado:**

```
Navegador ──HTTPS──► Vercel (front estático)
                        │  rewrite /api/* (mesmo endereço: cookie de primeira parte, sem CORS)
                        ▼
                     Render (backend Node, TENDRA_MODO=compartilhado)
                        ├─ Supabase Postgres  (dados, migrações de backend/migracoes/)
                        ├─ Supabase Storage   (planilhas das RFPs, bucket privado)
                        ├─ Supabase Auth      (só confere a senha)
                        └─ API do Claude
```

O front só conversa com o backend. As credenciais do Supabase e da Anthropic ficam no cofre do Render.

## Decisões tomadas

| Tema | Decisão |
|---|---|
| Início da fase D | Começa em 23/10/2026 com a fidelidade da fase A em revisão e a taxa de aceitação não medida, por decisão do grupo. |
| Hospedagem (P11) | Front na Vercel, backend no Render, banco, arquivos e contas no Supabase (decidido em 23/10/2026). |
| Login | Supabase Auth só para conferir a senha; sessão própria do backend numa tabela, apagada no logout (D5). Motivo: guardar senha é a parte mais delicada e fica num serviço pronto; o token do Supabase continuaria válido depois do logout. |
| Modos | `TENDRA_MODO=local` (padrão, fases A a C, sem login) e `compartilhado` (fase D). As rotas e o processamento são os mesmos; mudam o banco, o armazenamento e de onde vem a pessoa que age. |
| Banco | Uma interface `Banco` com duas implementações: PGlite (modo local e testes rápidos) e Postgres (`pg`, modo compartilhado e testes de integração no CI). As migrações são as mesmas. |
| Gasto da API | Sem cota por pessoa (decisão de 11/10/2026 na referência): a conta usa créditos pré-pagos sem recarga automática. |

## Pendências

| # | Pendência | Bloqueia | Sugestão |
|---|---|---|---|
| PD1 | Contas do Supabase, do Render e da Vercel criadas, com uma conexão de teste em cada uma | D0 e D10 | O grupo cria as contas; as chaves vão direto para o cofre de cada serviço e para o `.env` local, nunca para o chat nem para o repositório. |
| PD2 | Método de cadastro das contas de pessoas | D4 | Criar cada conta no painel do Supabase (Authentication → Add user, já confirmada) e preencher o perfil com um comando `npm run cadastrar-perfil -- <e-mail> <nome> <papel>`. Sem tela de cadastro. |
| PD3 | E-mails das contas | D4 | Sintéticos (por exemplo `marcelo.aprovador@tendra.test`), para não haver dado pessoal no banco; uma conta Aprovador e uma Revisor de teste, mais uma por membro do grupo. |
| PD4 | Duração da sessão sem uso | D4 | 8 horas (`TENDRA_SESSAO_HORAS`). |
| PD5 | Números do limite de login | D5 | **Decidido em 23/10/2026:** 3 falhas seguidas em 15 minutos, por e-mail ou por IP. |
| PD6 | Envio de planilha até 10 MB pelo rewrite da Vercel | D0 | Conferir no spike. O envio hoje é JSON com o arquivo em base64 (cerca de 13,4 MB para 10 MB). Se o rewrite não aceitar, o envio vai direto ao Supabase Storage por URL assinada gerada pelo backend. |
| PD7 | Plano gratuito da Vercel (Hobby) é para uso não comercial | D10 | Confirmar que o MVP com dados sintéticos se enquadra; se não, front como site estático no Render. |
| PD8 | Região dos serviços | D0 | Com dados sintéticos, qualquer região; registrar que o produto vai exigir região Brasil. |

Em 23/10/2026, o grupo decidiu seguir com o backend sem esperar as demais pendências (PD4 e PD6 a PD8 ficam com as sugestões acima até nova decisão). Conta de teste criada no Supabase Auth pelo grupo e ligada ao perfil pelo conector: User Teste 1 (Revisor).

## Etapas

Cada etapa é um pull request separado, com testes próprios e uma verificação que pode ser conferida sem ler código. D1 a D3 não dependem das contas (PD1) e podem começar já.

### D0. Pré-requisitos e spike
- Resolver PD1 a PD8.
- Criar o projeto no Supabase com cadastro público desligado (Authentication → "Allow new users to sign up" desativado), o bucket privado `rfps` e o serviço no Render.
- Spike: um backend mínimo no Render atrás do rewrite da Vercel, conferindo cookie de primeira parte, `X-Forwarded-For`, `X-Forwarded-Proto` e o envio de 10 MB (PD6).
- **Verificação:** painel do Supabase aberto; conexão de teste ao banco bem-sucedida; resultado do spike registrado aqui.

### D1. Banco atrás de uma interface
- `persistencia/banco.ts` passa a exportar a interface `Banco` (`query`, `exec`, `transacao`) com duas implementações: PGlite (como hoje, com a trava de um processo por vez) e Postgres (`pg`, com pool e SSL), escolhida por `DATABASE_URL`.
- As migrações de `backend/migracoes/` são aplicadas nos dois, com a tabela de controle já existente.
- CI: os testes de integração das rotas e da revisão rodam também contra um Postgres de serviço do GitHub Actions.
- **Verificação:** `npm test` passa com PGlite e com Postgres; o modo local continua igual (e2e da fase C passando).
- **Situação (23/10/2026): implementada.** `persistencia/banco.ts` define `Banco` (`query`, `exec`, `transaction`, `close`), com `abrirBanco` (PGlite) e `abrirBancoPostgres` (`pg` 8.23.1, pool de 5 conexões; `int8` devolvido como número, como no PGlite). `abrirBancoConfigurado` escolhe pelo `DATABASE_URL` e é usado por todos os comandos e pelo servidor. Nos testes, `TENDRA_TESTE_DATABASE_URL` abre cada arquivo de integração num esquema próprio do Postgres, apagado ao fechar; o teste `banco.test.ts` confere o contrato (migrações uma vez só, contagem como número, linhas afetadas, transação desfeita na falha) nos dois bancos. O CI ganhou o job "Testes do backend no Postgres" (Postgres 16). Conferido também com o Postgres 16 local: a carga da base sintética e o servidor leem e gravam no Postgres. A conexão com SSL do Supabase fica para a D2, com o projeto real.

### D2. Tabelas da fase D
- Migração `004_contas_e_sessoes.sql`: `perfis` (id do usuário do Supabase Auth, nome, papel `Revisor` ou `Aprovador`, ativo), `sessoes` (id aleatório guardado só como hash, perfil, criada em, último uso) e `tentativas_login` (e-mail normalizado, IP, quando, sucesso).
- No Supabase, Row Level Security ligado em todas as tabelas, sem regras de acesso público: só o backend acessa, com a conexão direta.
- `TENDRA_MODO=compartilhado` exige `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `TENDRA_ORIGEM_DO_FRONT` e `ANTHROPIC_API_KEY`; falta de qualquer uma impede o início e mostra os nomes (D11).
- **Verificação:** as tabelas aparecem no painel; uma consulta pela API pública do Supabase não devolve linhas; iniciar sem uma variável mostra o nome dela.
- **Situação (23/10/2026): implementada e aplicada no Supabase.**
  - Migração `004_contas_e_sessoes.sql`: `perfis` (id do Supabase Auth, e-mail em minúsculas e único, nome, papel `Revisor` ou `Aprovador`, ativo), `sessoes` (hash do identificador, perfil com exclusão em cascata, criada em, último uso) e `tentativas_login` (e-mail, IP, resultado, quando, com índices por e-mail e por IP). Liga Row Level Security em todas as 11 tabelas, sem regras de acesso, e fixa o `search_path` da função do gatilho de eventos.
  - `TENDRA_MODO=local|compartilhado` (padrão `local`). No modo compartilhado, o servidor exige `ANTHROPIC_API_KEY`, `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e `TENDRA_ORIGEM_DO_FRONT`, lista o nome de cada uma que falta sem mostrar valores, exige `https://` sem caminho nos endereços e recusa a API simulada. Até as etapas D4 a D6 existirem, o servidor se recusa a subir no modo compartilhado.
  - Testes: `contasESessoes.test.ts` (papéis, e-mail, cascata, tentativas e RLS ligado nas 11 tabelas) e `modoCompartilhado.test.ts` (cenário D11), no PGlite e no Postgres.
  - Supabase (projeto `Tendra.ai`, us-east-1, Postgres 17; cadastro público desligado pelo grupo em 23/10/2026): as migrações 001 a 004 foram aplicadas pelo conector, autorizado pelo grupo, do mesmo jeito que o backend aplica (cada arquivo numa transação, registrado em `migracoes_aplicadas`), porque este container não alcança o Postgres do Supabase pela porta 5432. Ao subir no Render, o backend não reaplica nada.
  - Conferido: a impressão do esquema (colunas, restrições, índices, RLS e migrações registradas, 144 linhas) é igual no Supabase e num Postgres local migrado pelo backend; pela API pública, com a chave publicável, as tabelas devolvem lista vazia e a inclusão em `perfis` é recusada pelo RLS (`42501`).
  - Advisor de segurança: só o aviso esperado de RLS sem regras (as 11 tabelas, de propósito) e um aviso sobre a função `public.rls_auto_enable()`, que não é deste repositório (já existia no projeto) e pode ser chamada pela API pública como `SECURITY DEFINER`; a decisão sobre ela fica com o grupo.

### D3. Arquivos no Supabase Storage
- Segunda implementação de `Armazenamento` (`salvar` e `ler`) sobre o bucket privado, com a chave de serviço; nome gerado pelo backend, como hoje (cenário 31).
- **Verificação:** teste contra um servidor falso do Storage; no spike, enviar uma planilha e baixar a preenchida.
- **Situação (23/10/2026): implementada; o envio real fica para a publicação (D10).** `armazenamento/armazenamentoSupabase.ts` grava em `<subpasta>/<uuid>.<extensão>` no bucket `rfps` com `x-upsert: false` e lê só caminhos gerados pelo backend; a chave nova (`sb_secret_...`) vai em `apikey` e a antiga (JWT) também no `Authorization`. Recusa e falha de rede viram erro de armazenamento sem a chave na mensagem. O servidor usa esse armazenamento no modo compartilhado. Bucket `rfps` criado no Supabase pelo conector (privado, só `.xlsx`, até 20 MB por arquivo); conferido que, com a chave publicável, a gravação é recusada pelo RLS, a URL pública não abre e a listagem vem vazia. Este container não tem a chave de serviço, então o envio e a leitura reais com ela são conferidos na D10.

### D4. Login, sessão, logout e pessoa da sessão
- `POST /api/auth/login`: confere a senha no Supabase Auth, confere o perfil ativo, cria a sessão e grava o cookie; erro 401 genérico (D1, D2).
- `GET /api/auth/me` e `POST /api/auth/logout` (D4, D5); expiração por falta de uso (D6, PD4).
- Gancho de autenticação em todas as rotas do Workspace no modo compartilhado (D3); `GET /api/saude` sem sessão.
- A pessoa que age vem da sessão: o campo `pessoa` do corpo das ações de revisão e o `enviadoPor` do envio de documentos são ignorados no modo compartilhado (D4). No modo local, continuam como no cenário 41.
- Comando `cadastrar-perfil` (PD2).
- **Verificação:** testes de D1 a D6 passando, com o Supabase Auth simulado por um servidor falso local.
- **Situação (23/10/2026): implementada.**
  - `autenticacao/verificadorSupabase.ts` confere e-mail e senha em `POST /auth/v1/token?grant_type=password`; 400 é "não confere" (conferido contra o Supabase Auth real: `invalid_credentials`), outra falha vira 503 "Serviço de login indisponível".
  - `autenticacao/sessoes.ts`: identificador aleatório de 32 bytes só no cookie, hash SHA-256 no banco; a sessão expira após `TENDRA_SESSAO_HORAS` (padrão 8) sem uso e é apagada; perfil desativado perde as sessões.
  - `http/rotasDeAutenticacao.ts`: `POST /api/auth/login` (e-mail normalizado, 401 com a mesma mensagem para e-mail inexistente, senha errada, conta sem perfil ou desativada), `GET /api/auth/me`, `POST /api/auth/logout`; cookie `tendra_sessao` com `HttpOnly`, `SameSite=Lax` e `Secure`, sem domínio. Com a autenticação ligada, toda rota `/api/` exige sessão, menos o login e `GET /api/saude`.
  - A pessoa que age vem da sessão: o campo `pessoa` das ações de revisão e o `enviadoPor` do envio de documentos são ignorados; `/api/pessoas` devolve só a pessoa da sessão. No modo local, nada muda.
  - `npm run cadastrar-perfil -- <e-mail> <nome> <papel>` (PD2) acha a conta pelo e-mail na API de administração do Supabase Auth e grava ou reativa o perfil.
  - Testes: `autenticacao.test.ts` (D1 a D6, 19 casos) e `perfis.test.ts`, no PGlite e no Postgres.
  - O servidor continua recusando o modo compartilhado até a D5 e a D6.

### D5. Limite de tentativas
- Antes de conferir a senha, contar as falhas recentes do e-mail e do IP; acima do limite (PD5), 429 com mensagem para aguardar, mesmo com a senha certa (D7).
- IP lido do `X-Forwarded-For` (Fastify com `trustProxy` só no modo compartilhado).
- **Verificação:** teste de D7 passando.
- **Situação (23/10/2026): implementada.** `autenticacao/tentativas.ts`: antes de conferir a senha, conta as falhas do e-mail e do IP nos últimos 15 minutos, depois do último login certo de cada um; com 3 ou mais, responde 429 "Muitas tentativas de login. Aguarde 15 minutos e tente novamente.", sem consultar o Supabase Auth, sem criar sessão e sem registrar a tentativa bloqueada. Cada tentativa conferida é registrada com e-mail, IP e resultado. Testes em `autenticacao.test.ts` (por e-mail, por IP, zerar com login certo, janela de 15 minutos) e em `transporte.test.ts` (IP lido do `X-Forwarded-For`). Conferido com o servidor real no modo compartilhado contra o Supabase Auth: a 4ª tentativa errada seguida recebe 429.

### D6. Transporte seguro e origem
- No modo compartilhado: ouvir em `0.0.0.0` na porta `PORT` do Render; recusar requisição com `X-Forwarded-Proto` diferente de `https`; cookie `HttpOnly`, `Secure`, `SameSite=Lax`; recusar com 403 métodos que alteram dados com `Origin` diferente de `TENDRA_ORIGEM_DO_FRONT` (D10).
- No modo local, o cenário 30 continua: só `127.0.0.1`.
- **Verificação:** teste de D10 passando; no navegador, o cookie aparece com os três atributos.
- **Situação (23/10/2026): implementada; a conferência no navegador fica para a D10.** Com `transporte`, o servidor confia no proxy (`trustProxy`) e, antes de olhar sessão ou dados, recusa com 403 pedido sem `X-Forwarded-Proto: https` (menos `GET /api/saude`, para a verificação de saúde do Render) e pedido `POST`, `PUT`, `PATCH` ou `DELETE` com `Origin` diferente de `TENDRA_ORIGEM_DO_FRONT`. No modo compartilhado, `npm run servidor` ouve em `0.0.0.0` na porta `PORT` do Render (ou `TENDRA_PORTA`); no modo local, continua só em `127.0.0.1`. A trava que recusava o modo compartilhado saiu. Testes em `transporte.test.ts`; teste de fumaça do servidor real no modo compartilhado com o Postgres local e o Supabase Auth real.

### D7. Papéis
- Revisor recebe 403 ao aprovar (D8) e ao pedir a planilha preenchida (D9), só no modo compartilhado.
- **Verificação:** testes de D8 e D9 passando.
- **Situação (23/10/2026): implementada.** `exigirAprovador` (em `http/rotasDeAutenticacao.ts`) recusa com 403 "Só o Aprovador pode aprovar respostas." em `POST /api/tarefas/:id/itens/:numero/aprovar` e "Só o Aprovador pode baixar a planilha preenchida." em `GET /api/tarefas/:id/planilha`, antes de tocar no item ou no arquivo. Só vale com sessão (modo compartilhado); no modo local, o papel continua sem restringir (cenário 41). Testes em `autenticacao.test.ts`: o Revisor recebe 403, o item não muda e nenhum evento é registrado; o Revisor edita, restaura e avalia; o Aprovador aprova e baixa a planilha.

### D8. Retomada após reinício
- Gravar cada lote gerado assim que termina (respostas da IA já checadas, por pergunta) e cada requisição no registro assim que acontece, e não só no fim.
- Ao iniciar no modo compartilhado, `marcarInterrompidas` passa a retomar as tarefas em `processando`: gera só os lotes que faltam e depois roda conflito, alertas e planilha preenchida sobre todos os itens (D15). No modo local, continua marcando como `falha` (cenário 32).
- **Verificação:** teste de D15 passando, com o processo do backend encerrado no meio de uma tarefa e reiniciado.
- **Situação (23/10/2026): implementada.**
  - Migração `005_respostas_geradas.sql`: as respostas de cada lote (já separadas pelos marcadores) ficam gravadas com o número e o texto da pergunta assim que o lote termina, e são apagadas quando a tarefa fica pronta ou falha. Aplicada no Supabase pelo conector; a impressão do esquema (153 linhas) é igual à de um Postgres migrado pelo backend.
  - `executarTarefa` grava cada requisição no registro na hora, numa fila em ordem, e lê o registro anterior ao começar; `gerarRespostas` pula o lote cujas perguntas já têm resposta gravada com o mesmo texto. Conflito, alertas e planilha preenchida rodam sobre todos os itens no fim.
  - No modo compartilhado, `npm run servidor` liga `retomarInterrompidas`: ao ficar pronto, o servidor põe na fila (uma tarefa por vez) as tarefas em `processando`. No modo local, `marcarInterrompidas` continua marcando `falha` (cenário 32) e descarta as respostas gravadas.
  - Teste `retomada.test.ts`: a API para de responder no 3º lote (como um processo que caiu), outro servidor sobre o mesmo banco retoma; a geração recomeça na pergunta 21, a tarefa termina com os 46 itens, uma vez cada, iguais aos de uma execução sem interrupção, e o registro e as métricas somam as requisições de antes e depois.

### D9. Front com login
- `src/LoginPage.jsx`: e-mail e senha de verdade, sem valores preenchidos, mensagens de 401 e 429.
- Ao abrir o app, `GET /api/auth/me` recupera a sessão; nome e papel da barra superior vêm do backend; "Sair" chama o logout.
- Remover "Trocar usuário" do menu (`src/workspace/UserMenu.jsx`) no modo compartilhado; as ações deixam de enviar `pessoa`.
- Revisor: botões de aprovar e exportar desabilitados com explicação; a recusa do backend (403) mostra mensagem clara.
- Aviso fixo de ambiente de testes com dados sintéticos (D12).
- 401 em qualquer chamada leva de volta ao login.
- **Verificação:** entrar, recarregar e continuar logado; sair e não voltar sem login; senha errada mostra a mensagem genérica; Revisor não aprova nem exporta.
- **Situação (23/10/2026): implementada.** O front descobre o modo por `GET /api/auth/me` (`obterSessao` em `src/api.js`): 200 traz a sessão aberta; 401, modo compartilhado sem sessão; sem a rota ou sem servidor, modo local, sem mudança. No compartilhado: login com campos vazios e as mensagens do backend (401, 429, 503); "Entrar" no site vai direto ao Workspace com a sessão aberta; nome e papel vêm da sessão; "Sair" chama o logout; sem "Trocar usuário"; qualquer 401 depois de entrar volta ao login com aviso; o Revisor vê "Aprovar resposta" e "Baixar planilha preenchida" desabilitados, com o motivo; aviso fixo de dados sintéticos no login e no menu lateral (D12). Conferido no navegador (Playwright) contra o backend com login e o Supabase Auth simulado: campos vazios, aviso, senha errada, entrada do Revisor, nome e papel, sem troca de usuário, recarga com sessão, saída com 401 no backend, bloqueio na 4ª tentativa, Revisor sem aprovar nem baixar e Aprovador com o botão de baixar. A jornada de ponta a ponta no modo local continua passando.

### D10. Publicação e aceite
- `render.yaml` com o serviço do backend (comando de início, `PORT`, verificação em `/api/saude`) e as variáveis declaradas sem valores.
- `vercel.json` com o build do Vite e o rewrite de `/api/*` para o endereço do Render.
- Rotina de uso documentada no README: acordar o Supabase (pausa após cerca de 7 dias sem uso) e o backend (dorme após cerca de 15 minutos).
- Carga da base sintética no ambiente publicado, pela tela.
- **Verificação (critério de pronto da fase):** checklist abaixo conferido no ambiente publicado; PR revisado por outra pessoa.
- **Situação (24/10/2026): publicado.**
  - `render.yaml` (Blueprint): serviço `tendra-backend`, Node 24, região Virginia (perto do Supabase us-east-1), plano gratuito, `rootDir: backend`, `npm ci`, `node src/cli/servidor.ts`, verificação de saúde em `/api/saude`, variáveis públicas preenchidas e os segredos (`ANTHROPIC_API_KEY`, `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) como `sync: false`.
  - `vercel.json`: build do Vite e rewrite de `/api/*` para `https://tendra-backend.onrender.com/api/*` (mesmo endereço para o navegador: cookie de primeira parte, sem CORS). Os previews da Vercel usam o mesmo backend, mas as alterações vindas deles são recusadas pela origem (D10); só o domínio de produção `tendra-ai-front.vercel.app` altera dados.
  - TLS do Postgres: conexão remota sempre cifrada; com `TENDRA_BANCO_CA` (certificado do painel do Supabase), o certificado é conferido; sem ele, o backend avisa no log.
  - O grupo deu ao Render acesso ao repositório; o serviço `tendra-backend` (`srv-dbdsgnks728c738ccop0`) foi criado pelo conector em 23/10/2026, a partir da `main`. O primeiro deploy parou, como esperado, mostrando no log o nome das três variáveis que faltavam (cenário D11). Com os segredos preenchidos pelo grupo no painel do Render, o deploy de 24/10/2026 ficou no ar.
  - Conferido em 24/10/2026, no ambiente publicado: `GET /api/saude` responde `{"ok":true}` direto no Render e pelo front (`https://tendra-ai-front.vercel.app/api/saude`, pelo rewrite da Vercel); rota do Workspace sem sessão recebe 401; login com conta inexistente recebe "E-mail ou senha incorretos." (Supabase Auth real); alteração com outra origem recebe 403 "Origem não autorizada.". O grupo entrou com a conta de teste User Teste 1 (Revisor) pelo front publicado.
  - Testes do grupo no publicado em 24/10/2026: perfis User Teste 2 (Revisor) e User Teste 3 (Aprovador) ligados pelo conector. A primeira tarefa (RFP-01) foi criada antes da carga da base e terminou com os 46 itens sem rascunho e nenhuma chamada à API, como esperado com a base vazia. Depois da carga dos 16 documentos da Pulse Benefícios, a segunda tarefa (RFP-01) terminou em cerca de 1 minuto com a API real: 39 respostas sugeridas, 7 sem rascunho e 7 chamadas registradas (contagem, 5 lotes de geração e conflito).
  - A verificação de saúde (`/api/saude`) está no `render.yaml`; no serviço criado pelo conector, ela é configurada no painel (Settings → Health Check Path).

## Variáveis de ambiente do modo compartilhado

| Variável | Para que serve | Onde fica |
|---|---|---|
| `TENDRA_MODO` | `compartilhado` liga login, Postgres e Storage | Cofre do Render |
| `ANTHROPIC_API_KEY` | API do Claude | Cofre do Render e `.env` local |
| `DATABASE_URL` | Conexão ao Postgres do Supabase (migrações e consultas) | Cofre do Render e `.env` local |
| `SUPABASE_URL` | Endereço do projeto (Auth e Storage) | Cofre do Render e `.env` local |
| `SUPABASE_SERVICE_ROLE_KEY` | Acesso do backend ao Auth e ao Storage. **Segredo crítico:** ignora as regras de acesso | Só no cofre do Render e no `.env` local; nunca no front nem no repositório |
| `TENDRA_ORIGEM_DO_FRONT` | Origem aceita nas requisições que alteram dados (D10) | Cofre do Render |
| `TENDRA_SESSAO_HORAS` | Duração da sessão sem uso (padrão 8) | Cofre do Render (opcional) |
| `PORT` | Porta definida pelo Render | Render |

## Checklist de aceite

Situação em 24/10/2026, no ambiente publicado (Render, Vercel e Supabase) ou, quando indicado, só nos testes automatizados.

| Cenário | Como conferir | Situação |
|---|---|---|
| D1, D4 | Entrar com uma conta válida leva ao Workspace com o nome e o papel certos; recarregar mantém a sessão. | Conferido no publicado (24/10/2026): login do User Teste 1 e do User Teste 2 (Revisores), com nome e papel certos e a sessão mantida ao recarregar. |
| D2 | E-mail inexistente, senha errada e conta desativada mostram a mesma mensagem. | Conferido no publicado para e-mail inexistente; senha errada e conta desativada nos testes automatizados. |
| D3, D5, D6 | Abrir uma rota do Workspace sem login, depois de sair e depois de expirar a sessão retorna 401. | Conferido no publicado: rota sem login e rota depois de sair (`GET /api/tarefas` → 401 logo após o logout); expirar nos testes automatizados. |
| D4 | Uma ação enviada com outro nome de pessoa fica registrada com a pessoa da sessão (teste automatizado). | Testes automatizados. |
| D7 | Errar a senha 3 vezes bloqueia novas tentativas com a mensagem de aguardar. | Testes automatizados e servidor real contra o Supabase Auth (a 4ª tentativa recebe 429). |
| D8, D9 | Como Revisor, aprovar e baixar a planilha preenchida são recusados; editar e avaliar funcionam. | Conferido no publicado (24/10/2026): o User Teste 3 (Aprovador) aprovou 9 respostas e baixou a planilha preenchida; os Revisores editaram, e o front mostrou aprovar e baixar desabilitados para eles (teste manual). A recusa 403 do backend ao Revisor está nos testes automatizados. |
| D10 | O endereço abre só com HTTPS; o cookie tem `HttpOnly`, `Secure` e `SameSite`. | Conferido no publicado: HTTPS e recusa de outra origem; atributos do cookie nos testes automatizados. |
| D11 | O CI mostra a varredura de segredos sem alertas; iniciar o backend sem uma variável mostra o nome dela. | Conferido: varredura de segredos no CI e log do primeiro deploy no Render com o nome das variáveis que faltavam. |
| D12 | O aviso de dados sintéticos aparece no login e no Workspace. | Conferido no publicado (24/10/2026), segundo o teste manual. |
| D13 | Duas pessoas em computadores diferentes veem as mesmas tarefas e as ações uma da outra; o relatório de aceitação soma as duas. | Conferido no publicado (24/10/2026): o User Teste 1 carregou a base (16 documentos) e criou as tarefas; o User Teste 3 aprovou respostas e o User Teste 2 editou uma delas, o que tirou a aprovação, com cada ação registrada no histórico com o nome e o papel de quem agiu. O relatório de aceitação somando avaliações de duas pessoas fica nos testes automatizados (nenhuma avaliação registrada no publicado). |
| D14 | O arquivo da RFP aparece no bucket privado e não abre por endereço público. | Conferido no publicado (24/10/2026): as RFPs enviadas e as planilhas preenchidas estão no bucket `rfps` (`rfps/…` e `resultados/…`), e o endereço público do arquivo responde "Bucket not found". |
| D15 | Reiniciar o serviço no Render no meio de uma tarefa e ver a tarefa terminar com todos os itens. | Pendente: as duas tarefas do publicado terminaram sem reinício do serviço (nenhum evento de reinício no Render entre a criação e o fim). |

## Fora deste plano

- Tela de cadastro, recuperação de senha, convite por e-mail, SSO e MFA.
- Cota de gasto da API por pessoa.
- Persistir reconhecimento de alerta, escolha de fonte em conflito e "Marcar como revisado": feito depois da fase D, em 24/10/2026 (`PLAN.md`, fase E; SPEC, cenários 57 a 59).
- Dados reais de clientes.
