---
feature: mvp-resposta-rfp-fase-d
status: draft
constitution: 1.0.0
---

# Fase D: publicação compartilhada com login

## Contexto

- **Papel deste documento:** spec curto da fase D do plano (`docs/mvp-resposta-rfp/PLAN.md`). Complementa o `SPEC.md` (fases A a C), que continua valendo para tudo o que não muda aqui. O plano detalhado está em `docs/mvp-resposta-rfp/PLAN_FASE_D.md`.
- **Origem:** os cenários de login, sessão, papéis, segurança de exposição e retomada vêm de `docs/referencia/mvp-proposta-1/SPEC.md` (cenários 1 a 4, 37, 44 e 48 a 54), consultado por pedido expresso em 23/10/2026 e adaptado ao backend que já existe. Os cenários deste documento têm numeração própria (D1, D2…) para não colidir com o `SPEC.md`.
- **Início com exceção (23/10/2026):** pelo plano, a fase D só começaria com A, B e C aceitas e uma taxa de aceitação medida. Por decisão do grupo, ela começa com a lista de fidelidade da fase A em revisão e a taxa de aceitação ainda não medida. Essas duas pendências continuam valendo e não são resolvidas por esta fase.
- **Comportamento atual:** o backend roda só na máquina de quem o inicia (`127.0.0.1`, cenário 30), com banco PGlite e arquivos no disco local. Não há login: a pessoa que age é escolhida em "Trocar usuário" e enviada no corpo de cada ação, validada contra `config/pessoas.json` (cenário 41). Cada máquina tem seu banco, e a taxa de aceitação sai fragmentada.
- **Comportamento esperado:**
  - o grupo usa um único ambiente publicado: front na Vercel, backend no Render, banco, arquivos e contas no Supabase;
  - só entra quem tem conta pré-cadastrada; a sessão é do backend e acaba ao sair;
  - quem age na revisão é sempre a pessoa da sessão, nunca um valor enviado pelo navegador;
  - o Revisor edita, restaura e avalia, mas não aprova (o botão nem aparece para ele) e só baixa a planilha de tarefa pronta (revisto em 26/10/2026); o Aprovador faz tudo;
  - uma tarefa interrompida pelo reinício do backend (o plano gratuito do Render "dorme") continua de onde parou;
  - o modo local das fases A a C continua funcionando para desenvolvimento e para o teste de ponta a ponta, sem login.
- **Fora desta fase:** tela de cadastro, recuperação de senha, convite por e-mail, SSO, MFA, cota de gasto por pessoa (decisão de 11/10/2026: sem cota; o gasto máximo é o saldo pré-pago da conta da Anthropic) e dados reais de clientes.

## Modos de execução

| | Modo local (fases A a C) | Modo compartilhado (fase D) |
|---|---|---|
| Onde roda | Máquina de quem inicia, só em `127.0.0.1` | Render, atrás do HTTPS do Render |
| Banco | PGlite em `dados/banco` | Postgres do Supabase |
| Arquivos das RFPs | Disco local, em `dados/` | Supabase Storage, em bucket privado |
| Pessoa que age | `config/pessoas.json`, enviada no corpo (cenário 41) | Sessão de login (D4) |
| Papéis | Registrados, sem restrição | Revisor não aprova (D8) e só baixa a planilha de tarefa pronta (D9) |

O modo é escolhido por variável de ambiente (`TENDRA_MODO=local|compartilhado`, padrão `local`). As migrações do banco são as mesmas nos dois modos.

## Cenários

### Login e sessão

#### Cenário D1: login com credenciais válidas
- **Given** uma conta pré-cadastrada com e-mail, senha, nome e papel (Revisor ou Aprovador) de uma pessoa sintética
- **When** a pessoa envia e-mail e senha corretos para `POST /api/auth/login`
- **Then** o backend cria uma sessão, grava o cookie de sessão e devolve `nome` e `papel`
- **And** as rotas do Workspace passam a responder para essa sessão

#### Cenário D2: login com credenciais inválidas
- **Given** um e-mail inexistente, uma senha incorreta ou uma conta desativada
- **When** a pessoa tenta entrar
- **Then** a resposta é 401, nenhuma sessão é criada, e a mensagem é a mesma nos três casos, sem revelar o que estava errado

#### Cenário D3: acesso sem sessão
- **Given** nenhuma sessão válida (sem cookie, sessão encerrada ou expirada)
- **When** qualquer rota do Workspace é chamada (base, tarefas, itens, planilha, revisão, aceitação, eventos, registro e métricas)
- **Then** a resposta é 401 e nenhum dado é devolvido
- **And** só `POST /api/auth/login` e `GET /api/saude` respondem sem sessão

#### Cenário D4: autor definido pela sessão
- **Given** uma pessoa autenticada
- **When** ela envia uma ação de revisão ou um envio de documentos que informa outra pessoa, outro nome ou outro papel
- **Then** o backend ignora esses valores e registra a ação com o nome e o papel da sessão
- **And** `GET /api/auth/me` devolve o nome e o papel da sessão, para o front continuar logado ao recarregar a página

#### Cenário D5: encerrar sessão
- **Given** uma pessoa autenticada
- **When** ela pede para sair (`POST /api/auth/logout`)
- **Then** a sessão é apagada no backend, e o mesmo cookie passa a receber 401 em qualquer rota do Workspace
- **And** "Entrar" logo depois de "Sair" sempre pede e-mail e senha, mesmo antes de o backend responder ao logout; um novo login espera esse logout terminar, para que a resposta dele não apague o cookie da nova sessão
- **And** nenhuma resposta da API fica em cache (`Cache-Control: no-store`), no navegador nem no proxy (correção de 24/10/2026)

#### Cenário D6: sessão expira sem uso
- **Given** uma sessão sem nenhuma requisição há mais tempo que o limite configurado (padrão: 8 horas)
- **When** uma rota do Workspace é chamada com ela
- **Then** a resposta é 401, a sessão é apagada, e o front volta para a tela de login

#### Cenário D7: limite de tentativas de login
- **Given** 3 tentativas malsucedidas seguidas para o mesmo e-mail, ou a partir do mesmo IP, nos últimos 15 minutos (limite decidido pelo grupo em 23/10/2026; um login certo zera a contagem)
- **When** uma nova tentativa é feita nesse período, mesmo com a senha correta
- **Then** a resposta é 429, nenhuma sessão é criada, e a mensagem diz que é preciso aguardar
- **And** o IP considerado é o da pessoa, lido do cabeçalho enviado pelo Render, e não o do próprio Render

### Papéis

#### Cenário D8: Revisor tenta aprovar
- **Given** um Revisor autenticado
- **When** ele tenta aprovar um item
- **Then** a resposta é 403, o item não muda e nenhum evento é registrado
- **And** o Revisor continua podendo editar, restaurar e avaliar

#### Cenário D9: Revisor e a planilha preenchida (revisto em 26/10/2026)
- **Given** um Revisor autenticado
- **When** ele pede a planilha preenchida de uma tarefa que ainda não está pronta (algum item não aprovado ou algum alerta pendente; a resposta manual não conta como pendente)
- **Then** a resposta é 403 com "O Revisor só baixa a planilha de tarefas prontas: todos os itens aprovados e nenhum alerta pendente."
- **And** com a tarefa pronta, ele baixa a planilha como o Aprovador
- **And** na tela, "Baixar planilha preenchida" fica desabilitado para o Revisor nas tarefas que não estão prontas (detalhe da tarefa e Exportação), e o botão "Aprovar resposta" não aparece para ele na revisão (D8)

### Segurança de exposição

#### Cenário D10: conexão segura, cookie e origem
- **Given** o backend no modo compartilhado
- **When** uma requisição chega sem HTTPS (cabeçalho `X-Forwarded-Proto` diferente de `https`)
- **Then** ela é recusada com 403 sem processar dados; só `GET /api/saude`, usada pela verificação de saúde do Render, responde sem HTTPS
- **And** o cookie de sessão tem os atributos `HttpOnly`, `Secure` e `SameSite=Lax`, sem domínio explícito
- **And** requisições que alteram dados (`POST`, `PUT`, `PATCH`, `DELETE`) com cabeçalho `Origin` diferente da origem do front configurada (`TENDRA_ORIGEM_DO_FRONT`) são recusadas com 403

#### Cenário D11: configuração obrigatória e credenciais fora do repositório
- **Given** o modo compartilhado
- **When** o backend inicia sem alguma variável obrigatória (chave da API, conexão com o banco, endereço e chave do Supabase, origem do front)
- **Then** ele não inicia e informa o nome de cada variável que falta, sem mostrar valores
- **And** nenhuma chave, senha ou credencial de banco ou de storage está no repositório nem no histórico (varredura de segredos no CI, cenário 27)
- **And** a chave de serviço do Supabase existe só no cofre do Render e no `.env` local de quem desenvolve; nunca chega ao navegador

#### Cenário D12: aviso de dados sintéticos
- **Given** o ambiente compartilhado
- **When** qualquer pessoa abre a tela de login ou o Workspace
- **Then** um aviso fixo diz que o ambiente é de testes e que só documentos e RFPs sintéticos podem ser enviados

### Banco e arquivos compartilhados

#### Cenário D13: dados compartilhados entre pessoas
- **Given** duas pessoas autenticadas em computadores diferentes
- **When** uma envia documentos para a base, cria uma tarefa ou age na revisão
- **Then** a outra vê os mesmos documentos, tarefas, itens e ações, e o relatório de aceitação da tarefa soma as ações das duas

#### Cenário D14: arquivos no storage privado
- **Given** uma planilha de RFP enviada no modo compartilhado
- **When** ela é gravada e depois lida para gerar a planilha preenchida
- **Then** o arquivo fica num bucket privado do Supabase Storage, com nome gerado pelo backend (cenário 31), e só é lido pelo backend
- **And** a planilha preenchida chega ao navegador pela rota do backend, que exige sessão (D3) e papel de Aprovador (D9)

### Processamento

#### Cenário D15: retomada após reinício do backend
- **Given** uma tarefa em processamento, com parte dos lotes de perguntas já gerada
- **When** o backend é reiniciado (o serviço "dormiu", houve deploy ou falha)
- **Then** ao subir, o backend retoma a tarefa a partir dos lotes que faltavam, sem gerar de novo os lotes gravados e sem duplicar itens
- **And** ao terminar, o total de itens é igual ao número de perguntas da planilha, e o registro e as métricas somam as requisições antes e depois do reinício
- **And** uma tarefa retomada que falha de novo fica em `falha`, com o motivo, como no cenário 17
- **And** no modo local, o comportamento do cenário 32 (tarefa interrompida vira `falha`) continua valendo

## Critérios de pronto da fase D

- Todos os cenários D1 a D15 com teste automatizado passando no CI, com o banco Postgres de verdade nos testes de integração do modo compartilhado.
- O teste de ponta a ponta da fase C continua passando no modo local.
- Demonstração no ambiente publicado: duas pessoas, com papéis diferentes, entram em computadores diferentes, processam uma RFP sintética, revisam e veem as ações uma da outra; o Revisor recebe a recusa ao aprovar e ao exportar.
- Checklist de aceite do `PLAN_FASE_D.md` conferido.
