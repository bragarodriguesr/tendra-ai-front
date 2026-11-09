---
feature: gestao-de-usuarios
status: draft
spec: docs/mvp-resposta-rfp/spec/SPEC_FASE_Q.md (revisado na etapa Q0 em 08/11/2026; status draft, aguardando aprovação)
constitution: 1.0.0
---

# Plano: Painel de Usuários conectado ao banco (fase Q, segunda parte)

*Plano de 08/11/2026. Parte do front já entregue no PR #100: o "Painel de Usuários", no menu "Gestão de acessos", com dados de exemplo no navegador. Este plano liga a tela ao banco, ainda **sem o histórico** das mudanças, e lista o que precisa ser confirmado no Supabase e no Render antes de publicar.*

## Objetivo

No ambiente publicado (modo compartilhado), a tela passa a ler e gravar os perfis reais da organização na tabela `perfis` do Supabase:
- listar as pessoas da organização;
- adicionar uma pessoa cuja conta já existe no Supabase Auth, como Revisor, área Geral;
- mudar o papel e as áreas;
- desativar e reativar o acesso.

O que o front já faz e não muda: o layout, a ordenação, a lista de áreas com o lápis, as confirmações, as proteções da própria linha e o celular.

No modo local (sem login), a tela continua com os dados de exemplo: não há Supabase Auth nem perfis para gerir.

## Fora deste plano

- **Registro das mudanças no Histórico** (antigo Q12): continua como alteração futura do spec. Nenhuma tabela de eventos nova.
- Criar a conta, definir ou trocar a senha, convite por e-mail: continuam no painel do Supabase.
- Excluir a pessoa, novo papel de Administrador, área para o Revisor (PN3) e troca de organização (PK5).

## Pendências de confirmação (Supabase e Render)

Nenhuma bloqueia o código nem os testes locais, que simulam o Supabase Auth. Todas bloqueiam a **publicação** (etapa Q7).

| # | Pendência | Onde | Como confirmar |
|---|---|---|---|
| PQ1 | A chave de serviço configurada no Render (`SUPABASE_SERVICE_ROLE_KEY`) consulta a API de administração do Supabase Auth (`auth/v1/admin/users`). Hoje só o código foi conferido: a mesma consulta é feita pelo comando `cadastrar-perfil` | Render e Supabase | Rodar o `cadastrar-perfil` com as variáveis do Render apontando para um e-mail de teste, ou chamar a rota de adicionar depois do deploy com uma conta de teste |
| PQ2 | As colunas usadas existem no banco publicado: `perfis.nome`, `email`, `papel`, `areas` (migração 011), `ativo` e `organizacao_id` (migração 008). Esperado, porque as migrações 011 a 013 já foram conferidas no Supabase | Supabase | Conferir no editor de tabelas do Supabase ou com uma consulta somente leitura |
| PQ3 | A busca da conta pelo e-mail percorre até 20 páginas de 200 contas do Supabase Auth (4.000 contas). Confirmar que basta para o MVP ou trocar pela busca com filtro da API, se o projeto a suportar | Supabase | Ver a quantidade de contas em Authentication → Users |
| PQ4 | No plano gratuito do Render, a primeira chamada depois de um tempo parado demora. A tela precisa mostrar o carregamento e não pode repetir a ação por um segundo clique | Render | Testar a tela com o serviço "dormindo" |
| PQ5 | O deploy do front na Vercel é bloqueado quando o merge é feito por quem não tem acesso ao projeto (ver `product/ARQUITETURA.md`, seção 1.3) | Vercel | Combinar quem faz o merge ou o redeploy |

## Dados fixos do front a revisar

O front foi feito antes do backend e simula o comportamento com dados e regras fixos. Varredura de 08/11/2026 em `src/`, `test/`, `e2e/` e no protótipo. Cada item tem um destino na etapa Q3.

| # | Onde | O que está fixo hoje | Destino |
|---|---|---|---|
| DF1 | `src/workspace/usuarios.js` (`USUARIOS_DE_EXEMPLO`) e estado inicial `painelUsuarios` em `useWorkspace.js` | Quatro pessoas fictícias (Carla Diretora, Kadu Mendes, Marcelo Vieira, Paula Rocha), com e-mails `@pulse.com.br` | **Só no modo local.** No compartilhado, a lista começa vazia, com carregamento, e vem de `GET /api/gestao/usuarios`; os nomes de exemplo nunca aparecem no publicado |
| DF2 | `screens/Users.jsx` | Aviso "Dados de exemplo: as mudanças desta tela ainda não são gravadas e voltam ao recarregar a página." | **Só no modo local** |
| DF3 | `viewModel.js` (`propria: u.nome === ws.name()`) | A própria linha é reconhecida pelo **nome**. `/api/auth/me` não devolve id nem e-mail | **Trocar.** A rota de listar devolve `propria: true` na linha da pessoa da sessão, comparando o id do perfil no backend. Evita bloquear duas pessoas com o mesmo nome, sem expor o id em `/api/auth/me` |
| DF4 | `useWorkspace.js` e `viewModel.js` | Linhas, lista de áreas aberta e confirmação identificadas pelo **e-mail** | **Trocar pelo `id` do perfil**, que é o parâmetro da rota `PATCH` |
| DF5 | `useWorkspace.js` (ações do painel) | Mudanças aplicadas na hora, só no navegador (sem esperar resposta) | **Trocar:** no compartilhado, a lista só muda com a resposta da rota; em erro, nada muda e aparece o aviso (Q13) |
| DF6 | `usuarios.js` (`recusaDoNovoUsuario`, `aprovadoresAtivos`) | Recusas e a regra de "ao menos um Aprovador ativo" calculadas sobre a lista local | **Manter como antecipação**, com as mesmas mensagens do backend; quem decide é a rota. Pessoa de outra organização e conta inexistente só o backend sabe |
| DF7 | `usuarios.js` (`AREAS_DO_APROVADOR`) | Lista das seis áreas repetida no front | **Trocar no compartilhado:** a rota de listar devolve também as áreas válidas (`areasDoAprovador`, de `regras/areas.ts`), e a lista suspensa usa essa resposta. A lista fixa fica só no modo local, registrada como regra repetida em `product/ARQUITETURA.md`, seção 11 |
| DF8 | `useWorkspace.js` (`initialState`) | O painel volta aos dados de exemplo a cada login | **Trocar:** no compartilhado, recarregar da rota ao abrir a tela e depois de cada login |
| DF9 | `test/usuarios.test.js`, `e2e/painelDeUsuarios.spec.js` e `e2e/sidebar.spec.js` | Testes apoiados nos dados de exemplo e na pessoa padrão do modo local (Aprovador) | **Manter** para o modo local e **acrescentar** o bloco com a API simulada (etapa Q4), que confere que os nomes de exemplo não aparecem no compartilhado |
| DF10 | `product/prototipo-gestao-de-usuarios.html` | Dados fictícios e a simulação de conta inexistente com e-mails `@semconta.com.br` | **Manter** como documentação. A simulação existe só no protótipo, não no código da tela |

Não foi encontrado dado fixo no backend para esta tela: as rotas ainda não existem.

## Rotas novas

Prefixo `/api/gestao/usuarios`, para não misturar com `GET /api/usuarios`, que só devolve nome e papel para o campo "Responsável" (cenários 62 e 74) e continua como está.

| Rota | Faz | Respostas |
|---|---|---|
| `GET /api/gestao/usuarios` | `{ usuarios, areasDoAprovador }`: as pessoas da organização da sessão (`id`, `nome`, `email`, `papel`, `areas`, `ativo` e `propria`, a pessoa da sessão, DF3), ordenadas pelo nome, e as áreas válidas para o Aprovador (DF7) | 200; 403 para o Revisor |
| `POST /api/gestao/usuarios` `{ nome, email }` | Procura a conta no Supabase Auth pelo e-mail e grava o perfil como Revisor, sem área, ativo | 201 com a pessoa; 400 (nome vazio, e-mail inválido); 404 (sem conta no Supabase Auth); 409 (já na lista ou de outra organização); 503 (Supabase Auth fora do ar) |
| `PATCH /api/gestao/usuarios/:id` `{ papel?, areas?, ativo? }` | Muda papel, áreas ou acesso de uma pessoa da organização | 200 com a pessoa; 400 (área inválida, área no Revisor, C-Level combinado); 403 (Revisor ou a própria pessoa mudando papel ou acesso); 404 (pessoa de outra organização ou inexistente); 409 (deixaria a organização sem Aprovador ativo) |

Todas só existem com login (modo compartilhado) e passam por `exigirAprovador`, com a mensagem "Só o Aprovador gerencia usuários."

## Decisões técnicas

| Tema | Decisão | Motivo |
|---|---|---|
| Onde ficam as regras | Num módulo novo, `backend/src/autenticacao/gestaoDeUsuarios.ts`, sobre o `perfis.ts` que já existe. As rotas, em `backend/src/http/rotasDeGestaoDeUsuarios.ts` | Regra no backend, não no front (constitution II); o front só antecipa as recusas |
| Organização | Sempre a da sessão (`organizacaoDo(pedido)`), nunca do pedido. Toda consulta filtra por `organizacao_id`; a pessoa de outra organização responde 404, como a inexistente | Fase K, cenários 69 e 72 |
| Adicionar | `idDaContaNoSupabase` (já usada no `cadastrar-perfil`) e depois `gravarPerfil` com papel Revisor e `areas: []`. Pessoa já na organização: 409 "Esta pessoa já está na lista." sem regravar (para não reativar nem rebaixar quem já está lá); de outra organização: 409 "Este e-mail não pode ser usado nesta organização." | Reaproveita o que já está testado; PK5 sem revelar a outra organização |
| Áreas | `validarAreasDoPerfil` da fase N: só o Aprovador tem área, C-Level não se combina | A mesma regra do cadastro e da aprovação |
| Papel para Revisor | Grava `areas = '{}'` junto, numa única atualização | A restrição `perfis_areas_so_do_aprovador` do banco exige isso |
| Ao menos um Aprovador | A mudança e a contagem de Aprovadores ativos na mesma transação, com `SELECT ... FOR UPDATE` nos perfis da organização | Dois Aprovadores rebaixando um ao outro ao mesmo tempo não podem deixar a organização sem nenhum |
| Própria pessoa | O backend recusa mudar o próprio papel ou o próprio acesso (403 "Peça a outro Aprovador para mudar o seu acesso."); as próprias áreas podem mudar | Q8; o front já desabilita, mas a regra vale também para chamadas diretas |
| Desativar | `ativo = false` e apaga as sessões da pessoa (`DELETE FROM sessoes WHERE perfil_id = $1`) | `sessaoValida` já recusa perfil inativo; apagar as linhas deixa isso explícito e libera a tabela |
| Efeito no próximo pedido | Nada a fazer: `sessaoValida` lê papel e áreas do perfil a cada pedido | Q9 do spec |
| E-mail | Só nas rotas da gestão, para o Aprovador | Cenários 62 e 74: o e-mail continua fora das outras rotas |
| Supabase Auth simulado | Os testes passam um `fetch` falso para `idDaContaNoSupabase`, como os testes atuais de `perfis` | Testes sem rede e sem chave real |
| Front | Em `src/api.js`, três funções novas (`listarUsuariosDaGestao`, `adicionarUsuarioNaGestao`, `alterarUsuarioNaGestao`). No `useWorkspace`, com `modo === "compartilhado"` as ações chamam a API e atualizam `painelUsuarios` com a resposta; no modo local, seguem com os dados de exemplo. Botões em carregamento enquanto a rota responde; erro da rota num aviso, sem mudar a lista | Uma só tela para os dois modos |
| Aviso de dados de exemplo | Só no modo local | No publicado, a tela mostra dados reais |

## Etapas

Cada etapa termina com uma verificação que pode ser feita sem ler código.

### Q0. Revisão do spec
- Trazer de volta para os cenários do `SPEC_FASE_Q.md` o que estava em "Alterações futuras", menos o registro no Histórico: adicionar com o Supabase Auth (Q3 e Q4), efeito nas sessões (Q9), isolamento (Q10) e falhas (Q13). O status volta para `draft` até a nova aprovação.
- **Verificação:** o grupo aprova o spec revisado.
- **Situação (08/11/2026): spec revisado e aprovado.** Voltaram os cenários Q3, Q4, Q9, Q10 e Q13, com os ajustes do inventário DF1 a DF10 (dados de exemplo só no modo local, própria linha pelo perfil da sessão, áreas vindas do backend, mudanças só com a resposta). O registro no Histórico (antigo Q12) segue como alteração futura.

### Q1. Regras da gestão no backend
- `gestaoDeUsuarios.ts`: listar, adicionar, mudar papel, mudar áreas, desativar e reativar, com as recusas da tabela de rotas.
- Testes de integração em `backend/test/integracao/gestaoDeUsuarios.test.ts`, no PGlite e no Postgres do CI:
  - nasce Revisor, área Geral;
  - conta inexistente, já na lista e de outra organização;
  - áreas inválidas, área no Revisor e C-Level combinado;
  - Aprovador para Revisor zera as áreas;
  - a própria pessoa não muda papel nem acesso;
  - nunca fica sem Aprovador ativo, inclusive com duas mudanças ao mesmo tempo;
  - desativar apaga as sessões.
- **Verificação:** `npm test` do backend passa.
- **Situação (08/11/2026): feita.** `backend/src/autenticacao/gestaoDeUsuarios.ts`, com 14 testes de integração. A busca da conta ganhou `procurarContaNoSupabase` em `perfis.ts`, que separa conta inexistente (null) de Supabase Auth fora do ar (`ErroDoProvedorDeContas`, 503); `idDaContaNoSupabase` (comando `cadastrar-perfil`) passa a usá-la, com as mesmas mensagens.

### Q2. Rotas
- `rotasDeGestaoDeUsuarios.ts`, registradas só com login, com validação de corpo (`additionalProperties: false`).
- `organizacoes.test.ts`: as três rotas entram na lista de rotas comparada com a do servidor, com o teste de que a pessoa de outra organização responde 404.
- Testes de rota: 403 para o Revisor, 401 sem sessão, mudança de papel valendo no pedido seguinte da outra pessoa e sessão encerrada ao desativar.
- **Verificação:** `npm test` e `npm run typecheck` do backend passam; a lista de rotas do teste de organizações bate com a do servidor.
- **Situação (08/11/2026): feita.** `backend/src/http/rotasDeGestaoDeUsuarios.ts`, registradas no `servidor.ts` só com login; `procurarConta` nas opções da autenticação, ligada ao Supabase no `cli/servidor.ts`. Tipos sem erro; 399 testes do backend passando. Três testes falham no Windows também na `main`, sem estas mudanças (caminhos com barra invertida em `organizacoes`, `carga` e `tarefasPersistidas`); o CI roda em Linux.

### Q3. Front ligado à API
- `src/api.js` com as três funções; `useWorkspace` usando a API no modo compartilhado e os dados de exemplo no local.
- Aplicar o destino de cada item de "Dados fixos do front a revisar" (DF1 a DF10):
  - dados e aviso de exemplo só no modo local;
  - própria linha pelo `propria` da rota;
  - linhas pelo `id`;
  - áreas da lista suspensa vindas da rota;
  - mudanças só com a resposta da rota;
  - recarga ao abrir a tela e depois do login.
- Carregamento nos botões e no toggle; erro da rota num aviso.
- Registrar a lista de áreas repetida (DF7) na seção 11 de `product/ARQUITETURA.md`.
- **Verificação:**
  - no modo local, a tela continua igual;
  - com a API simulada pelo teste, a lista vem da rota, nenhum nome de exemplo aparece e o aviso de dados de exemplo some;
  - uma busca por `USUARIOS_DE_EXEMPLO` no código mostra que ele só é usado no caminho do modo local.
- **Situação (08/11/2026): feita.**
  - `src/api.js` com `listarUsuariosDaGestao`, `adicionarUsuarioNaGestao` e `alterarUsuarioNaGestao`.
  - `useWorkspace`: lista do backend em `painelDoServidor` (carregada ao abrir a tela) e os dados de exemplo em `painelUsuarios`, escolhidos pelo modo; mudanças só com a resposta da rota, com a linha bloqueada enquanto grava.
  - `Users.jsx`: carregamento, erro com "Tentar de novo", aviso de exemplo só no modo local e "Adicionar" esperando a resposta.
  - `USUARIOS_DE_EXEMPLO` só entra no estado `painelUsuarios`, que o modo compartilhado não lê.
  - Lista de áreas repetida registrada em `product/ARQUITETURA.md`, seção 11.

### Q4. Testes de ponta a ponta
- `e2e/painelDeUsuarios.spec.js` ganha um bloco com a API respondida pelo teste (como `e2e/areas.spec.js`): lista da rota, adicionar com as recusas 404 e 409, mudar papel e áreas, desativar e reativar, e erro 503 sem mudar a lista.
- **Verificação:** `npm run e2e` passa, inclusive os testes que já existiam.
- **Situação (08/11/2026): feita.** 4 testes novos do modo publicado (lista sem dados de exemplo e própria linha com nomes iguais; adicionar com as recusas; papel, áreas da rota e acesso; erros ao listar e ao gravar). Suíte completa verde: 107 testes. Testes unitários do front: 34.

### Q5. Conferência local com o backend
- `npm run servidor` com `TENDRA_MODO=compartilhado` apontando para um banco de teste e o Supabase Auth simulado, ou com um projeto Supabase de teste, se houver.
- **Verificação:** a tela lista, adiciona, muda e desativa pessoas, e a pessoa desativada perde a sessão.
- **Situação (09/11/2026): feita.**
  - **Como:** o backend real (`criarServidor` com login, PGlite) com o Supabase Auth simulado no lugar de `procurarConta`, e o front em `vite` apontando para ele, conduzido no navegador. Pessoas da Pulse Benefícios (C-Level, Aprovador de Tecnologia, Revisora), uma conta só no Auth (`novo@`) e uma Aprovadora de outra organização.
  - **Resultado:** cada item conferido no navegador e pela rota:
    - **Q1:** o Revisor não vê o menu, e a rota responde 403;
    - **Q2:** a lista vem do banco, sem nomes de exemplo, sem o aviso e sem a pessoa da outra organização;
    - **Q4:** as recusas "sem conta" (404), "outra organização" e "já na lista" (409) aparecem com as mensagens do spec;
    - **Q13:** com o Auth fora do ar, a resposta é 503 com a mensagem do spec;
    - **Q3:** `novo@` entra como Revisor, área Geral;
    - **Q5 e Q6:** promover, marcar Jurídico e Comercial, C-Level substituindo as outras e rebaixar (áreas zeradas);
    - **Q9:** a pessoa promovida vê o menu sem novo login, e depois de rebaixada recebe 403 no pedido seguinte;
    - **Q7:** desativar com ela logada: `/api/auth/me` passa a 401 e, ao recarregar, volta ao login;
    - **Q8:** a própria linha fica sem o toggle, e a rota recusa com 403 "Peça a outro Aprovador…";
    - **Q10:** a Aprovadora da outra organização recebe 404 e só vê a si mesma;
    - **Q11:** no celular, sem rolagem lateral.
- **Correção no teste de concorrência (09/11/2026):** o teste "dois Aprovadores rebaixando um ao outro ao mesmo tempo" falhava no Postgres do CI. A causa é a corrida dos dois pedidos, e não um defeito da regra.
  - Com o Postgres real, o pedido que chega depois da primeira gravação pode já encontrar a pessoa como Revisora e receber 403 ("Só o Aprovador…"). Também pode esbarrar no bloqueio dos perfis e receber 409. No PGlite, com uma conexão só, é sempre 409.
  - O teste passou a conferir a regra: um pedido passa, o outro é recusado (403 ou 409) e a organização fica com exatamente um Aprovador ativo. O 409 determinístico continua coberto pelo teste do Aprovador único.
  - 402 testes do backend no PGlite e no Postgres (três rodadas); 36 unitários e 114 de ponta a ponta no front.

### Q6. Pendências de confirmação
- Resolver PQ1 a PQ5 com o grupo.
- **Verificação:** cada pendência marcada como confirmada neste plano, com a data.
- **Situação (09/11/2026):**
  - **PQ2, confirmada:** consulta somente leitura no Supabase publicado. `perfis` tem `id`, `nome`, `email`, `papel`, `areas` (array), `ativo`, `organizacao_id` e `criado_em`.
  - **PQ3, confirmada:** há 7 contas no Supabase Auth, todas com perfil, bem abaixo das 4.000 que a busca percorre. Basta para o MVP.
  - **PQ4, confirmada no código e no teste local:** a lista mostra "Carregando as pessoas da organização…" e, durante a gravação, a linha fica desabilitada (papel, toggle e áreas), sem repetir a ação por um segundo clique. A conferência com o Render "dormindo" fica para a Q7.
  - **PQ5, combinada:** o merge e o deploy de produção da Vercel são feitos pela conta dona do time (bragarodriguesr). Os deploys dos merges de 07 e 08/11 (PRs #95 a #104) ficaram bloqueados e são refeitos pela mesma conta.
  - **PQ1, pendente da Q7:** a chave de serviço do Render já é usada pelo armazenamento. A consulta `auth/v1/admin/users` só se confirma com a rota de adicionar no publicado, com uma conta de teste. Se falhar, a rota responde 503 sem gravar nada.

### Q7. Publicação e conferência
- Merge, deploy do backend no Render e do front na Vercel.
- No ambiente publicado, com contas de teste:
  - adicionar uma conta de teste;
  - promover a Aprovador, marcar áreas e rebaixar;
  - desativar e conferir que a sessão dela termina;
  - conferir que um Revisor não vê o menu e recebe 403 nas rotas.
- **Verificação:** checklist abaixo conferido no publicado.
- **Situação (09/11/2026): publicada; falta a conferência.**
  - Merge do PR #102 às 19:19 UTC pela conta dona do time.
  - Render no ar às 19:20, no commit `f790825`. A Vercel também às 19:20, pelo redeploy de produção da mesma conta, porque o deploy automático dos merges anteriores tinha sido bloqueado (PQ5).
  - Nenhuma migração nova: a fase Q usa as colunas de `perfis` que já existiam (PQ2).
  - Para conferir no publicado:
    - adicionar uma conta de teste já criada no Supabase Auth; isso confirma a PQ1;
    - promover, marcar áreas e rebaixar;
    - desativar com a pessoa logada;
    - conferir o Revisor sem o menu.

## Checklist de aceite

| Cenário | Como conferir |
|---|---|
| Q1 | Revisor sem o menu "Gestão de acessos" e com 403 em `/api/gestao/usuarios` |
| Q2 | A lista do publicado mostra as pessoas da organização, com e-mail, papel, áreas e situação reais, sem os nomes de exemplo nem o aviso "Dados de exemplo" (DF1 e DF2) |
| Q8 (própria linha) | Duas contas de teste com o mesmo nome: só a da sessão fica com papel e acesso bloqueados (DF3) |
| Q3 | Adicionar uma conta de teste já criada no Supabase Auth: entra como Revisor, área Geral, e consegue entrar na Tendra.ai |
| Q4 | E-mail sem conta (404), já na lista e de outra organização (409), com as mensagens do spec |
| Q5, Q6 | Promover, marcar áreas, C-Level exclusivo e rebaixar, com as áreas zeradas no banco |
| Q7 | Desativar uma conta logada em outro navegador: o próximo clique dela volta ao login |
| Q8 | A própria linha sem mudar papel nem acesso, também pela rota; a organização nunca fica sem Aprovador ativo |
| Q9 | Mudar o papel de uma pessoa logada: o próximo clique dela já reflete o papel novo |
| Q10 | Aprovador de outra organização não vê nem altera as pessoas desta (404) |
| Q13 | Com o Supabase Auth fora (simulado no teste), adicionar mostra o erro e não muda a lista |

## Riscos

| Risco | Mitigação |
|---|---|
| Expor o e-mail fora da gestão | Rotas próprias, só para o Aprovador; `GET /api/usuarios` continua sem e-mail |
| Organização sem Aprovador por mudanças simultâneas | Transação com bloqueio dos perfis da organização (etapa Q1) |
| Chave de serviço sem acesso no Render | PQ1 antes da publicação; a recusa vira 503 com mensagem, sem gravar nada |
| Rota nova sem a conferência de organização | O teste de organizações falha se a lista de rotas do servidor tiver rota não testada |
| Diferença entre os dois modos confundir os testes | Testes do modo local continuam com os dados de exemplo; os do publicado usam a API simulada |
| Dado de exemplo vazar para o publicado | Inventário DF1 a DF10; teste de ponta a ponta do modo compartilhado conferindo que nenhum nome de exemplo aparece |
| Própria linha errada com nomes iguais | `propria` calculada no backend pelo id do perfil (DF3) |
