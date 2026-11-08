---
feature: gestao-de-usuarios
status: approved
constitution: 1.0.0
---

# Gestão de usuários pelo Aprovador

## Contexto

- **Fluxo/local afetado:** nova tela "Painel de Usuários" no Workspace, no menu "Gestão de acessos", em `src/workspace/screens/Users.jsx`.
- **Comportamento atual:**
  - A conta da pessoa é criada no painel do Supabase (Authentication → Add user).
  - O perfil (nome, papel, áreas e organização) é ligado à conta pelo comando `npm run cadastrar-perfil`, rodado por quem tem acesso ao banco.
  - Não há tela para ver quem tem acesso, mudar papel ou área, nem desativar alguém. Desativar exige mexer direto no banco.
- **Comportamento esperado:**
  - O Aprovador abre o "Painel de Usuários" e vê as pessoas da organização, com papel, áreas e situação.
  - Ele adiciona uma pessoa, que nasce como **Revisor** com área **Geral**.
  - Ele muda o papel e, para o Aprovador, as áreas; desativa e reativa o acesso.
  - A criação da conta e da senha continua no painel do Supabase (decisão de 08/11/2026).
- **Escopo desta fase (decisão de 08/11/2026):** a tela entra no Workspace com **dados de exemplo**, só no navegador. As mudanças não são gravadas e voltam ao recarregar a página, e a tela avisa isso. Gravar no backend, consultar o Supabase Auth e registrar as mudanças no Histórico ficam como **alterações futuras** (seção própria, no fim).
- **Regras que esta fase mantém** (fase N, `SPEC_FASE_N.md`):
  - **PN3:** só o Aprovador tem área. Na tela, a pessoa sem área aparece como **"Geral"**: o Revisor sempre, e o Aprovador sem área, que só aprova as perguntas "Geral".
  - **PN1 e PN2:** áreas do Aprovador: Produto, Tecnologia, Segurança e privacidade, Comercial, Jurídico e C-Level. C-Level vale por todas e não se combina com outras.
- **Protótipo navegável:** `docs/mvp-resposta-rfp/product/prototipo-gestao-de-usuarios.html`, que abre direto no navegador.
- **Padrão do design system:** cabeçalho de página com rótulo e título; tabela no padrão de Tarefas e da Base; `Badge` para área e situação (áreas ativas e "Ativo" no tom `approved`, de limão; "Geral" e "Inativo" no tom neutro); `Select` para o papel; lista de áreas com `Checkbox`, no padrão do menu do `FilterMenu`; `Switch` com `Tooltip` na coluna Ações, como na Base de conhecimento; `Button`, `Field`, `Input` e `EmptyState`; confirmação no padrão dos diálogos já usados (excluir tarefa, arquivar). Sem cores, fontes nem componentes novos.
- **Como reproduzir:** não se aplica (funcionalidade nova).

## Dependências de infraestrutura

Verificação feita em 08/11/2026, no código.

- **Nenhuma nesta fase.** A tela usa dados de exemplo no navegador e não faz requisições ao backend.
- As dependências das alterações futuras (tabela `perfis` no Supabase Postgres e API de administração do Supabase Auth) estão na seção "Alterações futuras".

## Acceptance Criteria

### Cenário Q1: acesso à tela
- **Given** uma pessoa com papel Aprovador (no modo local, a escolhida em "Trocar usuário"; no publicado, a da sessão)
- **When** ela abre o menu lateral
- **Then** há um grupo "Gestão de acessos", abaixo do grupo "Base" (Base de conhecimento), com o item "Usuários", que abre a tela
- **And** a tela tem o rótulo "GESTÃO DE ACESSOS" acima do título "Painel de Usuários" e mostra o total de pessoas ativas
- **And** a tela avisa: "Dados de exemplo: as mudanças desta tela ainda não são gravadas e voltam ao recarregar a página."
- **And** para o Revisor o grupo não aparece; se a pessoa passa a Revisor com a tela aberta, ela mostra "Só o Aprovador gerencia usuários."

### Cenário Q2: lista de usuários
- **Given** o "Painel de Usuários" aberto
- **When** a lista é exibida
- **Then** as pessoas aparecem em ordem alfabética do nome (ordem padrão)
- **And** a tabela tem as colunas Pessoa (nome e e-mail), Papel (Revisor ou Aprovador), Áreas, Situação (etiqueta Ativo ou Inativo) e Ações (toggle do acesso)
- **And** só as áreas ativas da pessoa aparecem na linha, em verde; a pessoa sem área aparece com a etiqueta neutra "Geral"
- **And** a linha não marca a própria pessoa logada (sem "(você)"); a proteção da própria linha está no cenário Q8

### Cenário Q2b: ordenação pelas colunas
- **Given** a lista de usuários
- **When** o Aprovador clica no título de uma coluna (Pessoa, Papel, Áreas ou Situação)
- **Then** a lista é ordenada por ela em ordem crescente; o segundo clique inverte, e o terceiro volta para a ordem padrão (nome em ordem alfabética), no mesmo padrão da tabela dos detalhes da tarefa (fase P)
- **And** Pessoa ordena pelo nome; Papel, Áreas (pelas áreas ativas, ou "Geral") e Situação, em ordem alfabética; empates seguem o nome
- **And** o título ordenado mostra a seta da direção e informa a ordem aos leitores de tela
- **And** a coluna Ações não é ordenável

### Cenário Q3: adicionar usuário
- **Given** o "Painel de Usuários" aberto, sem o formulário de adicionar à vista
- **When** o Aprovador clica em "Adicionar usuário"
- **Then** o formulário aparece acima da lista, com os campos Nome e E-mail da conta e os botões "Cancelar" e "Adicionar", com o foco no Nome
- **And** "Cancelar" esconde o formulário
- **When** ele informa nome e e-mail e clica em "Adicionar"
- **Then** a pessoa entra na lista, ativa, com papel **Revisor** e área **Geral**, e o formulário volta a ficar escondido
- **And** um aviso confirma: "{nome} entrou como Revisor, área Geral."

### Cenário Q4: recusas do formulário
- **Given** o formulário "Adicionar usuário"
- **When** o nome está vazio
- **Then** a tela mostra "Informe o nome da pessoa." e nada muda
- **When** o e-mail está mal formado
- **Then** a tela mostra "Informe um e-mail válido."
- **When** o e-mail já está na lista (sem diferenciar maiúsculas)
- **Then** a tela mostra "Esta pessoa já está na lista."

### Cenário Q5: mudar o papel
- **Given** uma pessoa ativa com papel Revisor
- **When** o Aprovador muda o papel para Aprovador
- **Then** o papel muda e a etiqueta "Geral" passa a abrir a lista de áreas
- **When** o Aprovador muda uma pessoa de Aprovador para Revisor
- **Then** a tela pede confirmação ("Mudar {nome} para Revisor?", com "As áreas de {nome} serão removidas e ela passará a ver tudo como Revisor, área Geral.") e, confirmado, o papel muda e as áreas voltam para "Geral"
- **And** cancelar mantém o papel e as áreas

### Cenário Q6: áreas do Aprovador
- **Given** uma pessoa com papel Aprovador
- **When** a linha é exibida
- **Then** com a lista fechada, a coluna Áreas mostra só as etiquetas das áreas ativas, em verde, sem borda de campo nem seta, como a etiqueta "Geral" do Revisor
- **And** as etiquetas são clicáveis: ao passar o mouse ou com o foco, a borda delas escurece, e a dica é "Escolher as áreas"
- **When** o Aprovador clica nas etiquetas
- **Then** a lista abre por cima delas, como a lista do seletor de Papel, com as seis áreas em caixas de seleção e as ativas marcadas
- **And** marcar ou desmarcar uma área muda as áreas na hora; a lista continua aberta para outras escolhas e fecha com um clique fora dela ou com Esc, mostrando as etiquetas atualizadas
- **And** marcar C-Level desmarca as demais, e marcar outra área desmarca C-Level; a lista mostra a nota "C-Level vale por todas e não se combina com outras. Sem área, aprova só as perguntas Geral."
- **And** desmarcar todas deixa a etiqueta neutra "Geral", também clicável para abrir a lista
- **And** para o Revisor a coluna mostra só a etiqueta neutra "Geral", sem abrir lista
- **And** para a pessoa inativa as etiquetas não abrem a lista

### Cenário Q7: desativar e reativar
- **Given** a coluna Ações, com o toggle do acesso de cada pessoa no padrão da Base de conhecimento (`Switch` do DS com dica: ligado para Ativo, desligado para Inativo)
- **When** o Aprovador desliga o toggle de uma pessoa ativa
- **Then** a tela pede confirmação ("Desativar o acesso de {nome}?") e, confirmado em "Desativar acesso", a pessoa fica Inativa e a etiqueta da coluna Situação muda
- **And** cancelar a confirmação deixa o toggle ligado
- **When** o Aprovador liga o toggle de uma pessoa inativa
- **Then** ela volta a Ativo na hora, sem confirmação, com o papel e as áreas que tinha

### Cenário Q8: proteções
- **Given** o Aprovador logado na tela
- **When** ele tenta mudar o próprio papel ou desativar o próprio acesso
- **Then** o papel e o toggle da própria linha ficam desabilitados, com a dica "Peça a outro Aprovador para mudar o seu acesso."
- **And** ele pode mudar as próprias áreas
- **When** uma mudança deixaria a organização sem nenhum Aprovador ativo
- **Then** ela é recusada com "A organização precisa de ao menos um Aprovador ativo."

### Cenário Q11: celular
- **Given** o "Painel de Usuários" no celular
- **When** a lista é exibida
- **Then** cada pessoa vira um cartão com nome, e-mail, situação e áreas, e o papel e o toggle ficam no rodapé do cartão, sem cabeçalho de tabela e sem rolagem lateral

## Alterações futuras

Registradas em 08/11/2026, para uma próxima fase. Nenhuma faz parte desta entrega.

- **Gravar no backend:** rotas sobre a tabela `perfis` (que já tem `nome`, `email`, `papel`, `areas`, `ativo` e `organizacao_id`), com 403 para o Revisor ("Só o Aprovador gerencia usuários.") e a lista vinda do banco no lugar dos dados de exemplo.
- **Consultar o Supabase Auth ao adicionar:** pela API de administração (`auth/v1/admin/users`), com a chave de serviço do Render, como já faz o comando `cadastrar-perfil` (função `idDaContaNoSupabase`). Inclui as recusas "Não há conta com este e-mail. Crie a conta no painel do Supabase (Authentication → Add user) e tente de novo." e, para e-mail de outra organização (PK5), "Este e-mail não pode ser usado nesta organização.", sem dizer qual é ela. **Bloqueio a resolver antes:** confirmar que a chave de serviço configurada no Render consulta essa API no ambiente publicado; só o código foi conferido.
- **Efeito nas sessões (antigo Q9):** a mudança de papel ou de áreas vale no próximo pedido da pessoa, porque a sessão lê o perfil a cada pedido; a desativação encerra as sessões na hora e impede o login.
- **Isolamento entre organizações (antigo Q10):** o Aprovador só vê e só altera pessoas da própria organização; um identificador de outra responde 404. O e-mail continua fora das outras telas e rotas (cenários 62 e 74).
- **Registro das mudanças (antigo Q12):** decidir entre registrar quem mudou, o quê e quando numa tabela só de inclusão, mostrada no Histórico como as ações sobre as tarefas da fase O, ou não registrar.
- **Falhas (antigo Q13):** com o backend ou o Supabase Auth fora do ar, a tela mostra a mensagem de erro, sem alterar a lista, e a ação pode ser repetida.

## Fora de escopo

- Criar a conta, definir ou trocar a senha, convite por e-mail e recuperação de senha: continuam no painel do Supabase.
- Excluir a pessoa (só desativar).
- Novo papel de Administrador; área para o Revisor (PN3 continua valendo).
- Mudar a pessoa de organização (PK5).
- Mudanças nas regras de aprovação por área, na Revisão ou no "Minha área primeiro".
- Novas cores, fontes, ícones ou componentes fora do design system.
