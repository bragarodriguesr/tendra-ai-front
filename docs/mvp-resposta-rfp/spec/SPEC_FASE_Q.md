---
feature: gestao-de-usuarios
status: approved
constitution: 1.0.0
---

# Gestão de usuários pelo Aprovador

*Revisão de 08/11/2026 (etapa Q0 de `plan/PLAN_FASE_Q.md`). A versão anterior, aprovada em 08/11/2026, cobria a tela com dados de exemplo (PR #100). Esta liga a tela ao banco: voltam aos cenários o cadastro com o Supabase Auth, o efeito nas sessões, o isolamento e as falhas. O registro das mudanças no Histórico continua como alteração futura.*

## Contexto

- **Fluxo/local afetado:** tela "Painel de Usuários", no menu "Gestão de acessos" do Workspace (`src/workspace/screens/Users.jsx`), e novas rotas no backend sobre a tabela `perfis`.
- **Comportamento atual:**
  - A tela existe, só para o Aprovador, com **dados de exemplo no navegador**: as mudanças não são gravadas e voltam ao recarregar a página.
  - A conta da pessoa é criada no painel do Supabase (Authentication → Add user), e o perfil (nome, papel, áreas e organização) é ligado à conta pelo comando `npm run cadastrar-perfil`.
  - Desativar alguém exige mexer direto no banco.
- **Comportamento esperado:**
  - No ambiente publicado (modo compartilhado), a tela lê e grava os perfis reais da organização.
  - O Aprovador adiciona uma pessoa cuja conta já existe no Supabase Auth, e o acesso nasce como **Revisor** com área **Geral**.
  - Ele muda o papel e, para o Aprovador, as áreas; desativa e reativa o acesso. As mudanças valem para a pessoa sem novo login, e a desativação encerra as sessões dela.
  - No modo local (sem login), a tela continua com os dados de exemplo, porque não há Supabase Auth nem perfis para gerir.
  - A criação da conta e da senha continua no painel do Supabase (decisão de 08/11/2026).
- **Regras que esta fase mantém** (fases K e N):
  - **PN3:** só o Aprovador tem área. A pessoa sem área aparece como **"Geral"**: o Revisor sempre, e o Aprovador sem área, que só aprova as perguntas "Geral".
  - **PN1 e PN2:** áreas do Aprovador: Produto, Tecnologia, Segurança e privacidade, Comercial, Jurídico e C-Level. C-Level vale por todas e não se combina com outras.
  - **PK5:** uma conta pertence a uma organização para sempre.
  - **Cenários 62 e 74:** o e-mail das pessoas não aparece fora da gestão (por exemplo, no campo "Responsável" da Nova RFP).
- **Protótipo navegável:** `docs/mvp-resposta-rfp/product/prototipo-gestao-de-usuarios.html`.
- **Padrão do design system:** cabeçalho de página com rótulo e título; tabela no padrão de Tarefas e da Base; `Badge` para área e situação (áreas ativas e "Ativo" no tom `approved`, de limão; "Geral" e "Inativo" no tom neutro); `Select` para o papel; `IconButton` de lápis para editar as áreas; lista de áreas com `Checkbox`, no padrão do menu do `FilterMenu`; `Switch` com `Tooltip` na coluna Ações, como na Base de conhecimento; `Button`, `Field`, `Input` e `EmptyState`; confirmação no padrão dos diálogos já usados. Sem cores, fontes nem componentes novos.
- **Como reproduzir:** não se aplica (funcionalidade nova).

## Dependências de infraestrutura

Verificação feita em 08/11/2026, no código. As pendências PQ1 a PQ5 estão em `plan/PLAN_FASE_Q.md`.

- **Supabase Postgres, tabela `perfis`** (projeto do ambiente publicado):
  - **Acesso verificado:** pelo código; o backend já lê e grava `perfis` (sessões e `cadastrar-perfil`). As colunas usadas já existem: `nome`, `email`, `papel`, `areas` (migração 011), `ativo` e `organizacao_id` (migração 008). A restrição `perfis_areas_so_do_aprovador` recusa área no Revisor. **[BLOQUEIO PQ2: conferir as colunas no banco publicado; esperado, porque as migrações 011 a 013 já foram conferidas no Supabase.]**
  - **Fluxo de mudança:** nenhuma migração. As tabelas `perfis` e `sessoes` só recebem leituras, atualizações e inclusões pelas rotas novas.
- **Supabase Auth, API de administração** (`auth/v1/admin/users`, consulta da conta pelo e-mail):
  - **Acesso verificado:** pelo código; a função `idDaContaNoSupabase` já usa a chave de serviço no comando `cadastrar-perfil`. **[BLOQUEIO PQ1: confirmar que a chave de serviço configurada no Render (`SUPABASE_SERVICE_ROLE_KEY`) consulta essa API no ambiente publicado.]** **[BLOQUEIO PQ3: a busca percorre até 4.000 contas; confirmar que basta para o MVP.]**
  - **Fluxo de mudança:** nenhum; só leitura.
- **Render** (backend): sem variável nova; usa `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`, que já existem. **[BLOQUEIO PQ4: conferir a tela com o serviço "dormindo".]**
- **Vercel** (front): **[BLOQUEIO PQ5: o deploy é bloqueado quando o merge é feito por quem não tem acesso ao projeto.]**

Os bloqueios PQ1 a PQ5 impedem a **publicação**, não a implementação nem os testes, que simulam o Supabase Auth. O spec pode ser aprovado com eles abertos para a implementação começar; a etapa Q7 do plano só acontece depois de todos confirmados.

## Acceptance Criteria

### Cenário Q1: acesso à tela
- **Given** uma pessoa com papel Aprovador (no ambiente publicado, a da sessão; no modo local, a escolhida em "Trocar usuário")
- **When** ela abre o menu lateral
- **Then** há um grupo "Gestão de acessos", abaixo do grupo "Base" (Base de conhecimento), com o item "Usuários", que abre a tela
- **And** a tela tem o rótulo "GESTÃO DE ACESSOS" acima do título "Painel de Usuários" e mostra o total de pessoas ativas
- **And** para o Revisor o grupo não aparece; se a pessoa passa a Revisor com a tela aberta, ela mostra "Só o Aprovador gerencia usuários."
- **And** no ambiente publicado, as rotas da gestão respondem 403 com "Só o Aprovador gerencia usuários." ao Revisor, e 401 sem sessão

### Cenário Q2: lista de usuários
- **Given** o "Painel de Usuários" aberto
- **When** a lista é exibida
- **Then** no ambiente publicado aparecem as pessoas da organização da sessão, vindas do banco, com um indicador de carregamento enquanto a lista chega
- **And** no modo local aparecem os dados de exemplo, com o aviso "Dados de exemplo: as mudanças desta tela ainda não são gravadas e voltam ao recarregar a página."; no publicado, nem os dados de exemplo nem esse aviso aparecem
- **And** as pessoas aparecem em ordem alfabética do nome (ordem padrão)
- **And** a tabela tem as colunas Pessoa (nome e e-mail), Papel (Revisor ou Aprovador), Áreas, Situação (etiqueta Ativo ou Inativo) e Ações (toggle do acesso)
- **And** só as áreas ativas da pessoa aparecem na linha, em verde; a pessoa sem área aparece com a etiqueta neutra "Geral"
- **And** a linha não marca a própria pessoa logada (sem "(você)"); a proteção da própria linha está no cenário Q8
- **And** a lista é carregada de novo ao abrir a tela e depois de cada login

### Cenário Q2b: ordenação pelas colunas
- **Given** a lista de usuários
- **When** o Aprovador clica no título de uma coluna (Pessoa, Papel, Áreas ou Situação)
- **Then** a lista é ordenada por ela em ordem crescente; o segundo clique inverte, e o terceiro volta para a ordem padrão (nome em ordem alfabética), no mesmo padrão da tabela dos detalhes da tarefa (fase P)
- **And** Pessoa ordena pelo nome; Papel, Áreas (pelas áreas ativas, ou "Geral") e Situação, em ordem alfabética; empates seguem o nome
- **And** o título ordenado mostra a seta da direção e informa a ordem aos leitores de tela
- **And** a coluna Ações não é ordenável

### Cenário Q3: adicionar usuário
- **Given** uma conta já criada no Supabase Auth para o e-mail `nova@empresa.com.br`, sem perfil em nenhuma organização
- **And** o "Painel de Usuários" aberto, sem o formulário de adicionar à vista
- **When** o Aprovador clica em "Adicionar usuário"
- **Then** o formulário aparece acima da lista, com os campos Nome e E-mail da conta e os botões "Cancelar" e "Adicionar", com o foco no Nome
- **And** "Cancelar" esconde o formulário
- **When** ele informa nome e e-mail e clica em "Adicionar"
- **Then** o botão mostra o carregamento até a resposta, e a pessoa entra na lista, ativa, com papel **Revisor** e área **Geral**, na organização da sessão
- **And** o formulário volta a ficar escondido, e um aviso confirma: "{nome} entrou como Revisor, área Geral."
- **And** a pessoa já consegue entrar na Tendra.ai com a senha da conta

### Cenário Q4: recusas ao adicionar
- **Given** o formulário "Adicionar usuário"
- **When** o nome está vazio ou o e-mail está mal formado
- **Then** a tela mostra "Informe o nome da pessoa." ou "Informe um e-mail válido." antes de enviar, e o backend recusa o mesmo pedido com 400 e a mesma mensagem
- **When** o e-mail já tem perfil nesta organização (sem diferenciar maiúsculas)
- **Then** a tela mostra "Esta pessoa já está na lista.", e o perfil existente não muda (nem papel, nem áreas, nem situação)
- **When** o e-mail não tem conta no Supabase Auth
- **Then** a tela mostra "Não há conta com este e-mail. Crie a conta no painel do Supabase (Authentication → Add user) e tente de novo." e nada é gravado
- **When** o e-mail já tem perfil em outra organização
- **Then** a tela mostra "Este e-mail não pode ser usado nesta organização.", sem dizer qual é a outra organização, e nada é gravado

### Cenário Q5: mudar o papel
- **Given** uma pessoa ativa com papel Revisor
- **When** o Aprovador muda o papel para Aprovador
- **Then** o papel é gravado, e o lápis de editar áreas aparece ao lado da etiqueta "Geral"
- **When** o Aprovador muda uma pessoa de Aprovador para Revisor
- **Then** a tela pede confirmação ("Mudar {nome} para Revisor?", com "As áreas de {nome} serão removidas e ela passará a ver tudo como Revisor, área Geral.") e, confirmado, o papel e as áreas vazias são gravados juntos
- **And** cancelar mantém o papel e as áreas
- **And** a linha só muda com a resposta do backend; em erro, continua como estava (Q13)

### Cenário Q6: áreas do Aprovador
- **Given** uma pessoa ativa com papel Aprovador
- **When** a linha é exibida
- **Then** a coluna Áreas mostra as etiquetas das áreas ativas, em verde, e ao lado delas o ícone de lápis (`IconButton`, dica "Editar áreas", nome acessível "Editar áreas de {nome}")
- **When** o Aprovador clica no lápis
- **Then** a lista abre por cima das etiquetas, com as seis áreas em caixas de seleção e as ativas marcadas; no ambiente publicado, a lista de áreas vem do backend
- **And** marcar ou desmarcar uma área grava a mudança; a lista continua aberta para outras escolhas e fecha com um clique fora dela ou com Esc, mostrando as etiquetas atualizadas
- **And** marcar C-Level desmarca as demais, e marcar outra área desmarca C-Level; a lista mostra a nota "C-Level vale por todas e não se combina com outras. Sem área, aprova só as perguntas Geral."
- **And** desmarcar todas deixa a etiqueta neutra "Geral", com o lápis ao lado
- **And** o lápis só aparece para o Aprovador ativo, inclusive na própria linha (Q8); o Revisor e a pessoa inativa ficam só com as etiquetas
- **And** o backend recusa com 400 área fora da lista, área num Revisor e C-Level combinado com outra área

### Cenário Q7: desativar e reativar
- **Given** a coluna Ações, com o toggle do acesso de cada pessoa no padrão da Base de conhecimento (`Switch` do DS com dica: ligado para Ativo, desligado para Inativo)
- **When** o Aprovador desliga o toggle de uma pessoa ativa
- **Then** a tela pede confirmação ("Desativar o acesso de {nome}?") e, confirmado em "Desativar acesso", a pessoa fica Inativa, a etiqueta da coluna Situação muda, as sessões dela são apagadas e ela não entra mais
- **And** cancelar a confirmação deixa o toggle ligado
- **And** o histórico dela (aprovações, revisões, responsável por tarefas) continua como está
- **When** o Aprovador liga o toggle de uma pessoa inativa
- **Then** ela volta a Ativo, sem confirmação, com o papel e as áreas que tinha, e pode entrar de novo

### Cenário Q8: proteções
- **Given** o Aprovador logado na tela
- **When** ele tenta mudar o próprio papel ou desativar o próprio acesso
- **Then** o papel e o toggle da própria linha ficam desabilitados, com a dica "Peça a outro Aprovador para mudar o seu acesso."
- **And** o backend recusa o mesmo pedido feito direto à rota, com 403 e a mesma mensagem
- **And** ele pode mudar as próprias áreas
- **And** a própria linha é reconhecida pelo perfil da sessão, não pelo nome: duas pessoas com o mesmo nome não bloqueiam uma à outra
- **When** uma mudança deixaria a organização sem nenhum Aprovador ativo, inclusive com dois Aprovadores mudando ao mesmo tempo
- **Then** ela é recusada com 409 e "A organização precisa de ao menos um Aprovador ativo.", e nada é gravado

### Cenário Q9: efeito das mudanças nas sessões
- **Given** uma pessoa logada em outra sessão
- **When** o Aprovador muda o papel ou as áreas dela
- **Then** a mudança vale no próximo pedido que ela fizer, sem precisar sair e entrar de novo (por exemplo, o menu "Gestão de acessos" aparece ou some, e a aprovação por área segue as áreas novas)
- **When** o Aprovador desativa o acesso dela
- **Then** o próximo pedido dela recebe 401 e volta para a tela de login

### Cenário Q10: isolamento entre organizações
- **Given** duas organizações com usuários
- **When** o Aprovador de uma delas lista, adiciona ou altera usuários
- **Then** ele só vê e só altera pessoas da própria organização; o identificador de uma pessoa de outra organização responde 404, como o inexistente
- **And** o e-mail das pessoas continua fora das outras telas e rotas (`GET /api/usuarios` devolve só nome e papel, cenários 62 e 74)

### Cenário Q11: celular
- **Given** o "Painel de Usuários" no celular
- **When** a lista é exibida
- **Then** cada pessoa vira um cartão com nome, e-mail, situação e áreas, e o papel e o toggle ficam no rodapé do cartão, sem cabeçalho de tabela e sem rolagem lateral

### Cenário Q13: falhas
- **Given** o "Painel de Usuários" no ambiente publicado
- **When** o backend não responde ao listar
- **Then** a tela mostra a mensagem de erro no lugar da lista, com a opção de tentar de novo
- **When** o backend ou o Supabase Auth não respondem ao adicionar ou ao alterar
- **Then** a tela mostra a mensagem de erro num aviso, a lista não muda, e a ação pode ser repetida
- **And** a recusa por falha do Supabase Auth responde 503 e não grava nada

## Alterações futuras

- **Registro das mudanças (antigo Q12):** decidir entre registrar quem mudou, o quê e quando numa tabela só de inclusão, mostrada no Histórico como as ações sobre as tarefas da fase O, ou não registrar. Fora desta fase.

## Fora de escopo

- Criar a conta, definir ou trocar a senha, convite por e-mail e recuperação de senha: continuam no painel do Supabase.
- Excluir a pessoa (só desativar).
- Novo papel de Administrador; área para o Revisor (PN3 continua valendo).
- Mudar a pessoa de organização (PK5).
- Gestão de usuários no modo local além dos dados de exemplo.
- Mudanças nas regras de aprovação por área, na Revisão ou no "Minha área primeiro".
- Mudanças em `GET /api/usuarios` (campo "Responsável").
- Novas cores, fontes, ícones ou componentes fora do design system.
