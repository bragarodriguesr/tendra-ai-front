---
fase: 1-estrutura-e-login
status: draft
spec: docs/referencia/mvp-proposta-1/SPEC.md (mapa geral); o spec curto da fase 1 ainda não foi escrito
---

# Plano da fase 1: estrutura e login

*Rascunho de 13/10/2026. Pela regra do SDD, o plano deriva de um spec aprovado. Este plano usa os cenários da fase 1 listados em `docs/referencia/mvp-proposta-1/SPEC.md` (seção "Faseamento da entrega") e deve ser conferido contra o spec curto da fase 1 quando ele for escrito e aprovado.*

## Objetivo

Publicar o backend no ambiente compartilhado com login e logout reais, contas guardadas no Supabase e o front usando esse login no lugar do login ilustrativo. As telas do Workspace continuam com os dados fictícios de hoje; dados reais começam na fase 2.

**Cenários cobertos (de `docs/referencia/mvp-proposta-1/SPEC.md`):** 1, 2, 3, 4, 48, 49, 50, 51, 52.

## Pendências que precisam ser resolvidas

| # | Pendência | Bloqueia | Opções |
|---|---|---|---|
| **P1** | **Método de cadastro das contas.** O front não tem botão nem tela de cadastro, e o SPEC deixa cadastro pela interface fora de escopo. | Etapa 3 | (a) Criar cada conta no painel do Supabase (Authentication → Add user) e preencher o perfil (nome e papel). (b) Um script no repositório cria as contas a partir de uma lista de e-mails, nomes e papéis, sem senhas no repositório; as senhas temporárias são entregues fora do repositório. (c) Convite por e-mail do Supabase; exige uma tela no front para definir a senha, que não existe. (d) Tela de cadastro no front; fora do escopo da versão 1. **Sugestão:** (a) para começar, por não exigir código; (b) se o número de contas crescer ou o ambiente precisar ser recriado com frequência. |
| P2 | **E-mails das contas.** Usar e-mails reais dos membros do grupo ou e-mails sintéticos (por exemplo `aprovador@tendra.test`). | Etapa 3 | E-mails sintéticos evitam dado pessoal no banco e combinam com as pessoas sintéticas. Exigem criar a conta já confirmada, porque não recebem e-mail. |
| P3 | **Como o login é feito** (ver "Decisão técnica proposta" abaixo). | Etapa 4 | Supabase Auth para conferir a senha, com sessão própria do backend (proposta) · login inteiramente próprio, com senhas numa tabela do backend. |
| P4 | **Hospedagem do front.** O cookie de sessão exige front e backend no mesmo endereço (cenário 51). Vercel em avaliação. | Etapa 8 | Ver `docs/referencia/mvp-proposta-1/ARQUITETURA_MAPPING.md`, "Front na Vercel". |
| P5 | **Fluxo de revisão do código (S12).** | Primeiro commit | Branch + PR revisado por outra pessoa · commit direto. |
| P6 | **Cenário 48 na fase 1.** Ele exige que o backend não inicie sem a chave da Anthropic, mas a fase 1 não usa a IA. | Etapa 1 | Exigir na fase 1 só as variáveis que ela usa e acrescentar a chave na fase 4a (sugestão) · exigir a chave desde já. |
| P7 | **Duração da sessão.** O SPEC não define quando a sessão expira. | Etapa 4 | Sugestão: expira após 8 horas sem uso, e o usuário volta para a tela de login. |
| P8 | **Números do limite de login (cenário 50).** 5 tentativas em 15 minutos foi uma sugestão, não uma decisão. | Etapa 5 | Confirmar ou ajustar. |
| P9 | **Contas do Supabase e do Render** (bloqueios do SPEC). | Etapas 2 e 8 | Criar as contas e fazer uma conexão de teste em cada uma. |

## Decisão técnica proposta (P3)

**Recomendação:** usar o **Supabase Auth só para guardar e conferir senhas**, e deixar a **sessão sob controle do backend**.

- **Por que o Supabase Auth:** guardar senhas com segurança (hash, comparação, proteção contra vazamento) é a parte mais delicada de um login. Num grupo sem especialistas em engenharia, é mais seguro usar um serviço pronto do que escrever esse código. O painel do Supabase também permite criar contas sem código, o que atende a opção (a) de P1.
- **Por que sessão própria do backend:** o cenário 52 exige que, ao sair, a sessão pare de funcionar imediatamente. O token do Supabase continua válido até expirar, mesmo depois do logout. Com uma tabela de sessões no backend, sair apaga a sessão e o cenário 52 é atendido.
- **Por que o front não fala com o Supabase:** o front só conversa com o backend. As credenciais do Supabase ficam no Render e nunca chegam ao navegador.

**Fluxo:**

```
Front (tela de login)
   │  POST /api/auth/login  { e-mail, senha }
   ▼
Backend (Render)
   ├─ confere tentativas recentes (cenário 50)
   ├─ pede ao Supabase Auth para conferir e-mail e senha
   ├─ lê o perfil (nome, papel) na tabela de perfis
   ├─ cria uma sessão na tabela de sessões
   └─ responde com nome e papel, e grava o cookie de sessão (HttpOnly, Secure, SameSite)
```

**Mudança em relação ao mapa:** `docs/referencia/mvp-proposta-1/ARQUITETURA_MAPPING.md` (SEG-1) recomendava login inteiramente próprio. Esta proposta troca a conferência de senha pelo Supabase Auth. Se for aceita, o mapa precisa ser atualizado.

## Estrutura de dados no Supabase

| Tabela | Conteúdo | Observação |
|---|---|---|
| `auth.users` | E-mail e senha (em hash) | Gerenciada pelo Supabase Auth. Nenhum código nosso lê senhas. |
| `perfis` | Id do usuário, nome da pessoa sintética, papel (`Revisor` ou `Aprovador`), ativo ou não | O papel só aceita esses dois valores. |
| `sessoes` | Id da sessão, usuário, criada em, último uso, expira em | Apagar a linha encerra a sessão (cenário 52). |
| `tentativas_login` | E-mail, IP, data e hora, sucesso ou falha | Base do limite de tentativas (cenário 50). |

**Configurações de segurança do projeto Supabase:**

- **Cadastro público desligado** (Authentication → "Allow new users to sign up" desativado). Sem isso, qualquer pessoa com o endereço do projeto poderia criar uma conta.
- **Row Level Security ligado em todas as tabelas**, sem regras de acesso público. Só o backend acessa os dados, com a chave de serviço.
- **A chave de serviço (`service_role`) fica só no cofre do Render** e no ambiente local de quem desenvolve. Ela ignora todas as regras de acesso e nunca pode ir para o front nem para o repositório.

## Etapas

Cada etapa termina com uma verificação que pode ser feita sem ler código.

### Etapa 0: pré-requisitos
- Resolver P1, P2, P3, P5 e P6.
- Criar o projeto no Supabase e a conta no Render (P9).
- **Verificação:** painel do Supabase aberto; conexão de teste ao banco bem-sucedida.

### Etapa 1: esqueleto do backend
- Pasta `backend/` com `package.json` próprio, TypeScript, Fastify e Vitest (STK-1 a STK-3 do mapa).
- Rota `GET /api/health`, que responde se o backend está no ar.
- Leitura das variáveis de ambiente no início: se faltar alguma obrigatória, o backend não inicia e diz qual falta (cenário 48).
- `.gitignore` do backend cobrindo `.env`, logs e arquivos locais (cenários 48 e 49).
- CI no GitHub Actions: testes e varredura de segredos (gitleaks) em cada PR.
- **Verificação:** `npm test` passa; iniciar sem uma variável mostra a mensagem com o nome dela; o CI aparece no PR.

### Etapa 2: tabelas no Supabase
- Migração versionada no repositório criando `perfis`, `sessoes` e `tentativas_login`, com Row Level Security ligado.
- Cadastro público desligado no painel do Supabase.
- **Verificação:** as tabelas aparecem no painel; uma consulta sem a chave de serviço não retorna dados.

### Etapa 3: cadastro das contas
- Criar as contas pelo método escolhido em P1, com os e-mails escolhidos em P2.
- Mínimo: uma conta Aprovador e uma Revisor para testes, mais uma conta por membro do grupo.
- **Verificação:** cada conta aparece no Supabase Auth com o perfil correspondente.

### Etapa 4: login, sessão e logout
- `POST /api/auth/login`: confere a senha no Supabase Auth, cria a sessão e devolve nome e papel (cenário 1). Erro genérico 401, sem dizer se o problema foi no e-mail ou na senha (cenário 2).
- `GET /api/auth/me`: devolve nome e papel da sessão atual. O front usa essa rota para continuar logado ao recarregar a página.
- `POST /api/auth/logout`: apaga a sessão (cenário 52).
- Proteção de todas as rotas do Workspace: sem sessão válida, resposta 401 (cenário 3).
- Autor e papel sempre lidos da sessão, nunca do corpo da requisição (cenário 4). Esse padrão é a base de todas as fases seguintes.
- Expiração da sessão conforme P7.
- **Verificação:** testes dos cenários 1, 2, 3, 4 e 52 passando.

### Etapa 5: limite de tentativas
- Antes de conferir a senha, contar as falhas recentes do e-mail e do IP. Acima do limite (P8), responder 429 com mensagem para aguardar, mesmo se a senha estiver certa (cenário 50).
- Ler o IP real do usuário a partir do cabeçalho enviado pelo Render, e não o IP do próprio Render.
- **Verificação:** teste do cenário 50 passando.

### Etapa 6: transporte seguro
- Redirecionar ou recusar requisições sem HTTPS no ambiente compartilhado.
- Cookie com `HttpOnly`, `Secure` e `SameSite`.
- Recusar requisições de origens diferentes da origem do front configurada.
- **Verificação:** teste do cenário 51 passando; no navegador, o cookie aparece com os três atributos.

### Etapa 7: front
- `src/api.js`: uma camada única para chamar o backend, enviando o cookie de sessão.
- Proxy do Vite encaminhando `/api` para o backend local durante o desenvolvimento.
- `src/LoginPage.jsx`:
  - envia e-mail e senha de verdade;
  - remove o e-mail e a senha preenchidos automaticamente (hoje vêm preenchidos com "demonstracao");
  - mostra as mensagens de erro de 401 e 429.
- Ao abrir o app, chamar `/api/auth/me` para recuperar uma sessão existente.
- Nome e papel na barra superior vêm do backend, e não do `useWorkspace.js`.
- "Sair" chama `/api/auth/logout`.
- **Remover "Trocar usuário"** do menu do usuário (`src/workspace/UserMenu.jsx`), porque o papel passa a vir do backend (cenário 4).
- As telas do Workspace continuam com os dados fictícios.
- **Verificação:** entrar, recarregar a página e continuar logado; sair e não conseguir voltar sem login; senha errada mostra a mensagem genérica.

### Etapa 8: publicação e aceite
- Deploy do backend no Render, com as variáveis no cofre.
- Publicação do front conforme P4, com `/api` encaminhado para o backend.
- **Verificação (critério de pronto da fase):** todos os testes da fase passando; demonstração do login no ambiente compartilhado; checklist abaixo conferido; PR revisado por outra pessoa.

## Variáveis de ambiente da fase 1

| Variável | Para que serve | Onde fica |
|---|---|---|
| `SUPABASE_URL` | Endereço do projeto Supabase | Cofre do Render e `.env` local |
| `SUPABASE_SERVICE_ROLE_KEY` | Acesso do backend ao banco e ao Auth. **Segredo crítico.** | Só no cofre do Render e no `.env` local, nunca no front nem no repositório |
| `DATABASE_URL` | Conexão direta ao Postgres, para as migrações | Cofre do Render e `.env` local |
| `FRONT_ORIGIN` | Origem do front aceita (cenário 51) | Cofre do Render e `.env` local |
| `ANTHROPIC_API_KEY` | Não usada na fase 1; depende de P6 | Nenhum lugar até a fase 4a, se P6 seguir a sugestão |

## Checklist de aceite

| Cenário | Como conferir |
|---|---|
| 1 | Entrar com uma conta válida leva ao Workspace com o nome e o papel certos. |
| 2 | E-mail inexistente e senha errada mostram a mesma mensagem. |
| 3 | Abrir uma rota do Workspace sem estar logado retorna 401. |
| 4 | O teste automático do cenário 4 passa (o papel enviado pelo navegador é ignorado). |
| 48 | O CI mostra a varredura de segredos sem alertas; iniciar o backend sem uma variável mostra o nome dela. |
| 49 | Depois de usar o sistema localmente, `git status` não mostra arquivos de dados. |
| 50 | Errar a senha 5 vezes bloqueia novas tentativas com a mensagem de aguardar. |
| 51 | O endereço abre só com HTTPS; o cookie tem `HttpOnly`, `Secure` e `SameSite`. |
| 52 | Depois de sair, voltar pelo botão do navegador não reabre o Workspace. |

## Fora deste plano

- Tela de cadastro, recuperação de senha, convite por e-mail, SSO e MFA.
- Restrições por papel (o bloqueio do Revisor é o cenário 37, após a versão 1).
- Qualquer dado real do Workspace (documentos, tarefas, itens): começa na fase 2.
