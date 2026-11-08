---
feature: gestao-de-usuarios
status: draft
constitution: 1.0.0
---

# Gestão de usuários pelo Aprovador

## Contexto

- **Fluxo/local afetado:** nova tela "Usuários" no Workspace, no modo compartilhado (ambiente publicado), e novas rotas no backend sobre a tabela `perfis`.
- **Comportamento atual:**
  - A conta da pessoa é criada no painel do Supabase (Authentication → Add user).
  - O perfil (nome, papel, áreas e organização) é ligado à conta pelo comando `npm run cadastrar-perfil`, rodado por quem tem acesso ao banco.
  - Não há tela para ver quem tem acesso, mudar papel ou área, nem desativar alguém. Desativar exige mexer direto no banco.
- **Comportamento esperado:**
  - O Aprovador abre a tela "Usuários" e vê as pessoas da sua organização, com papel, área e situação.
  - Ele adiciona uma pessoa cuja conta já existe no Supabase Auth, e o acesso nasce como **Revisor** com área **Geral**.
  - Ele muda o papel e, para o Aprovador, as áreas; desativa e reativa o acesso.
  - A criação da conta e da senha continua no painel do Supabase (decisão de 08/11/2026).
- **Regras que esta fase mantém** (fase N, `SPEC_FASE_N.md`):
  - **PN3:** só o Aprovador tem área. Na tela, a pessoa sem área aparece como **"Geral"**: o Revisor sempre, e o Aprovador sem área, que só aprova as perguntas "Geral".
  - **PN1 e PN2:** áreas do Aprovador: Produto, Tecnologia, Segurança e privacidade, Comercial, Jurídico e C-Level. C-Level vale por todas e não se combina com outras.
  - **PK5:** uma conta pertence a uma organização para sempre.
- **Protótipo navegável:** `docs/mvp-resposta-rfp/product/prototipo-gestao-de-usuarios.html`, com dados fictícios e sem chamar a API. Abre direto no navegador.
- **Pendências deste spec (08/11/2026):** a decisão do cenário Q12 (registro das mudanças) e o bloqueio da seção "Dependências de infraestrutura" (acesso da chave de serviço do Render à API de administração do Supabase Auth) ficam em aberto. O spec só vai para `approved` depois dos dois.
- **Padrão do design system:** tabela no padrão de Tarefas e da Base; `Badge` para área e situação (áreas ativas e "Ativo" no tom `approved`, de limão; "Geral" e "Inativo" no tom neutro); lista suspensa de áreas com caixas de seleção, no padrão do menu do `FilterMenu`; `Switch` com `Tooltip` na coluna Ações, como na Base de conhecimento; `Select`, `Checkbox`, `Button`, `Input` e `EmptyState` do DS; confirmação no padrão dos diálogos já usados (excluir tarefa, arquivar). Sem cores, fontes nem componentes novos.
- **Como reproduzir:** não se aplica (funcionalidade nova).

## Dependências de infraestrutura

Verificação feita em 08/11/2026, no código.

- **Supabase Postgres, tabela `perfis`** (projeto do ambiente publicado):
  - **Acesso verificado:** pelo código; o backend já lê e grava `perfis` (sessões, `cadastrar-perfil`). As colunas necessárias já existem: `nome`, `email`, `papel`, `areas` (migração 011), `ativo` e `organizacao_id`.
  - **Fluxo de mudança:** nenhuma migração prevista. Se a decisão pendente sobre o registro das mudanças (Q12) pedir uma tabela, ela entra por migração em `backend/migracoes/`, aplicada pelo backend ao iniciar.
- **Supabase Auth, API de administração** (consulta da conta pelo e-mail):
  - **Acesso verificado:** pelo código; a função `idDaContaNoSupabase` já usa a chave de serviço no comando `cadastrar-perfil`. **[BLOQUEIO: confirmar, antes de aprovar, que a chave de serviço configurada no Render consulta `auth/v1/admin/users` no ambiente publicado; nesta sessão só o código foi conferido.]**
  - **Fluxo de mudança:** nenhum; só leitura.

## Acceptance Criteria

### Cenário Q1: acesso à tela
- **Given** uma pessoa com papel Aprovador, no ambiente publicado
- **When** ela abre o menu lateral
- **Then** há um grupo "Administração" com o item "Usuários", que abre a tela de gestão
- **And** para o Revisor o item não aparece, e as rotas da gestão respondem 403 com "Só o Aprovador gerencia usuários."
- **And** no modo local, sem login, o item não aparece

### Cenário Q2: lista de usuários
- **Given** a tela "Usuários" aberta
- **When** a lista é exibida
- **Then** aparecem só as pessoas da organização de quem está logado, em ordem alfabética do nome
- **And** a tabela tem as colunas Pessoa (nome e e-mail), Papel (Revisor ou Aprovador), Áreas, Situação (etiqueta Ativo ou Inativo) e Ações (toggle do acesso), no padrão da tabela da Base de conhecimento
- **And** só as áreas ativas da pessoa aparecem na linha, em verde (etiqueta no tom `approved`)
- **And** a pessoa sem área aparece com a área "Geral"
- **And** o título mostra o total de pessoas ativas

### Cenário Q3: adicionar pessoa
- **Given** uma conta já criada no Supabase Auth para o e-mail `nova@empresa.com.br`, sem perfil
- **When** o Aprovador clica em "Adicionar pessoa", informa nome e e-mail e confirma
- **Then** a pessoa entra na lista, ativa, com papel **Revisor** e área **Geral**
- **And** ela já consegue entrar na Tendra.ai com a senha da conta
- **And** a tela avisa que papel e área podem ser mudados na própria linha

### Cenário Q4: e-mail sem conta, repetido ou de outra organização
- **Given** o formulário "Adicionar pessoa"
- **When** o e-mail não tem conta no Supabase Auth
- **Then** a tela mostra "Não há conta com este e-mail. Crie a conta no painel do Supabase (Authentication → Add user) e tente de novo." e nada é gravado
- **When** o e-mail já tem perfil nesta organização
- **Then** a tela mostra "Esta pessoa já está na lista." e destaca a linha dela
- **When** o e-mail já tem perfil em outra organização
- **Then** a tela mostra "Este e-mail não pode ser usado nesta organização." sem dizer qual é a outra organização
- **And** nome vazio ou e-mail mal formado são recusados antes do envio, com a mensagem no campo

### Cenário Q5: mudar o papel
- **Given** uma pessoa ativa com papel Revisor
- **When** o Aprovador muda o papel para Aprovador
- **Then** o papel é gravado e as áreas aparecem na própria linha para marcar, todas desmarcadas ("Geral")
- **When** o Aprovador muda uma pessoa de Aprovador para Revisor
- **Then** a tela pede confirmação ("As áreas de {nome} serão removidas e ela passará a ver tudo como Revisor.") e, confirmado, o papel muda e as áreas voltam para "Geral"

### Cenário Q6: áreas do Aprovador
- **Given** uma pessoa com papel Aprovador
- **When** a linha é exibida
- **Then** a coluna Áreas mostra só as áreas ativas, em verde, e abaixo delas o botão "Áreas", que abre uma lista suspensa
- **When** o Aprovador abre a lista "Áreas"
- **Then** ela mostra as seis áreas com caixas de seleção: Produto, Tecnologia, Segurança e privacidade, Comercial, Jurídico e C-Level, com as ativas marcadas
- **And** marcar ou desmarcar uma área grava a mudança e atualiza as etiquetas da linha na hora; a lista continua aberta para outras escolhas e fecha pelo próprio botão ou com Esc
- **And** marcar C-Level desmarca as demais, e marcar outra área desmarca C-Level; a lista mostra a nota "C-Level vale por todas e não se combina com outras."
- **And** desmarcar todas deixa a pessoa com a etiqueta neutra "Geral" e a nota "Sem área: aprova só as perguntas Geral."
- **And** para o Revisor a coluna mostra só a etiqueta neutra "Geral", sem o botão "Áreas", com a nota "Revisor revisa todas as áreas"
- **And** para a pessoa inativa o botão "Áreas" fica desabilitado

### Cenário Q7: desativar e reativar
- **Given** a coluna Ações, com o toggle do acesso de cada pessoa no padrão da Base de conhecimento (`Switch` do DS com dica ao passar o mouse: ligado para Ativo, desligado para Inativo)
- **When** o Aprovador desliga o toggle de uma pessoa ativa e confirma em "Desativar acesso"
- **Then** a pessoa fica Inativa, a etiqueta da coluna Situação muda, as sessões dela terminam na hora e ela não entra mais
- **And** cancelar a confirmação deixa o toggle ligado
- **And** o histórico dela (aprovações, revisões, responsável por tarefas) continua como está
- **When** o Aprovador liga o toggle de uma pessoa inativa
- **Then** ela volta a Ativo na hora, sem confirmação, com o papel e as áreas que tinha

### Cenário Q8: proteções
- **Given** o Aprovador logado na tela
- **When** ele tenta mudar o próprio papel ou desativar o próprio acesso
- **Then** o papel e o toggle da própria linha ficam desabilitados, com a dica "Peça a outro Aprovador para mudar o seu acesso."
- **And** ele pode mudar as próprias áreas
- **When** uma mudança deixaria a organização sem nenhum Aprovador ativo
- **Then** ela é recusada com "A organização precisa de ao menos um Aprovador ativo."

### Cenário Q9: efeito das mudanças
- **Given** uma pessoa logada em outra sessão
- **When** o Aprovador muda o papel ou as áreas dela
- **Then** a mudança vale no próximo pedido que ela fizer, sem precisar sair e entrar de novo
- **And** a desativação encerra a sessão dela na hora (Q7)

### Cenário Q10: isolamento entre organizações
- **Given** duas organizações com usuários
- **When** o Aprovador de uma delas lista, adiciona ou altera usuários
- **Then** ele só vê e só altera pessoas da própria organização; um identificador de outra organização responde 404
- **And** o e-mail das pessoas continua fora das outras telas e rotas (campo "Responsável" da Nova RFP, cenários 62 e 74)

### Cenário Q11: celular
- **Given** a tela "Usuários" no celular
- **When** a lista é exibida
- **Then** cada pessoa vira um cartão com nome, e-mail, papel, áreas e situação, e as ações ficam no rodapé do cartão, sem rolagem lateral

### Cenário Q12: registro das mudanças
- **Given** qualquer mudança feita na tela (adicionar, mudar papel, mudar áreas, desativar, reativar)
- **When** ela é gravada
- **Then** [DECISÃO PENDENTE: (a) registrar quem mudou, o quê e quando numa tabela só de inclusão, mostrada no Histórico, como as ações sobre as tarefas da fase O; ou (b) não registrar nesta fase]

### Cenário Q13: falhas
- **Given** a tela "Usuários"
- **When** o backend não responde ou o Supabase Auth não responde ao adicionar
- **Then** a tela mostra a mensagem de erro, sem alterar a lista, e a ação pode ser repetida

## Fora de escopo

- Criar a conta, definir ou trocar a senha, convite por e-mail e recuperação de senha: continuam no painel do Supabase.
- Excluir a pessoa (só desativar).
- Novo papel de Administrador; área para o Revisor (PN3 continua valendo).
- Mudar a pessoa de organização (PK5).
- Gestão de usuários no modo local, sem login.
- Mudanças nas regras de aprovação por área, na Revisão ou no "Minha área primeiro".
- Novas cores, fontes, ícones ou componentes fora do design system.
