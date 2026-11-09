---
feature: evolucao-alteracao-papeis
status: approved
constitution: 1.0.0
---

# Evolução da alteração de papéis e do cadastro de usuários

## Contexto

- **Fluxo/local afetado:** "Painel de Usuários" (`src/workspace/screens/Users.jsx`, fase Q): o seletor de Papel, a lista de áreas do lápis e o formulário "Adicionar usuário". No backend, as rotas `PATCH /api/gestao/usuarios/:id` e `POST /api/gestao/usuarios`.
- **A fase tem duas etapas:**
  - **Etapa T1:** confirmação com áreas ao mudar o papel de Revisor para Aprovador, e o mínimo de uma área para o Aprovador.
  - **Etapa T2:** o formulário "Adicionar usuário" passa a ter Papel, Áreas e Situação.
- **Comportamento atual:**
  - Mudar de **Aprovador para Revisor** pede confirmação, porque as áreas são removidas (Q5).
  - Mudar de **Revisor para Aprovador** grava direto, sem confirmação. A pessoa vira Aprovador sem nenhuma área e aparece com a etiqueta "Geral". O aviso orienta a escolher as áreas depois, no lápis.
  - Na lista do lápis, o Aprovador pode ficar sem área: desmarcar todas é aceito (Q6), e ele passa a aprovar só as perguntas "Geral".
  - O formulário "Adicionar usuário" tem só Nome e E-mail. A pessoa sempre entra como Revisor, área Geral, ativa (Q3). Para ser Aprovador, com áreas, ou ficar inativa, é preciso mudar a linha depois.
- **Comportamento esperado:**
  - **T1:** mudar de Revisor para Aprovador abre uma confirmação com as áreas. Sem pelo menos uma área marcada, a mudança não é concluída e a tela mostra o erro. O papel e as áreas são gravados juntos. Na lista do lápis, desmarcar a única área do Aprovador não é aceito: a tela avisa e nada é gravado.
  - **T2:** o formulário de adicionar ganha Papel (Revisor por padrão), Áreas (lista suspensa, só para o Aprovador) e Situação (Ativo por padrão). A pessoa já entra com o papel, as áreas e a situação escolhidos.
- **Regras que esta fase muda** (fase Q, `SPEC_FASE_Q.md`):
  - **Q3:** "o acesso nasce como Revisor, área Geral" deixa de ser fixo e passa a ser o valor padrão do formulário.
  - **Q5:** a promoção deixa de ser direta e passa a pedir confirmação com áreas.
  - **Q6:** "desmarcar todas deixa a etiqueta Geral" deixa de valer para o Aprovador com área; a nota da lista muda.
- **Regras que esta fase mantém:**
  - **PN1 e PN2 (fase N):** áreas do Aprovador: Produto, Tecnologia, Segurança e privacidade, Comercial, Jurídico e C-Level. C-Level vale por todas e não se combina com outras.
  - **PN3 (fase N):** só o Aprovador tem área; o Revisor aparece com "Geral".
  - **Q3 e Q4:** a conta precisa existir no Supabase Auth; as recusas do formulário (nome vazio, e-mail inválido, pessoa já na lista, de outra organização, conta inexistente) continuam.
  - **Q5:** a confirmação de Aprovador para Revisor continua como está.
  - **Q8:** o Aprovador não muda o próprio papel; a organização mantém ao menos um Aprovador ativo.
  - **Aprovadores que já estão sem área:** continuam valendo e aprovam só as perguntas "Geral" (fase N), até alguém marcar uma área para eles.
- **Padrão do design system:** diálogo de confirmação já usado na tela (`ConfirmUserChangeDialog`); `Field`, `Input`, `Select`, `Switch`, `Checkbox`, `Badge` e `Button`; os avisos (`toast`) já usados. O campo de Áreas do formulário é montado com essas peças, com a aparência do `Select` e a lista no estilo da lista do lápis (menu do `FilterMenu`). Sem cores, fontes nem componentes novos no design system.
- **Proposta visual:** validada na conversa de 09/11/2026 (formulário com Papel, Áreas em lista suspensa e Situação).
- **Como reproduzir o comportamento atual:**
  1. Entre como Aprovador e abra o "Painel de Usuários".
  2. No seletor de Papel de um Revisor ativo, escolha "Aprovador". O papel muda na hora, sem confirmação e sem área.
  3. Abra o lápis de um Aprovador com uma área e desmarque-a. A mudança é aceita e a etiqueta volta para "Geral".
  4. Clique em "Adicionar usuário". O formulário só pede Nome e E-mail.

## Dependências de infraestrutura

Verificação feita em 09/11/2026, no código.

- **Nenhuma nova.**
  - A rota `PATCH /api/gestao/usuarios/:id` já aceita `papel` e `areas` no mesmo pedido; a etapa T1 acrescenta validações a ela.
  - A rota `POST /api/gestao/usuarios` hoje aceita só `nome` e `email`; a etapa T2 acrescenta `papel`, `areas` e `ativo`, todos opcionais.
- Sem migração: a tabela `perfis` já tem `papel`, `areas` e `ativo`, e a restrição `perfis_areas_so_do_aprovador` fica como está.

## Acceptance Criteria

## Etapa T1: confirmação ao mudar para Aprovador e mínimo de uma área

### Cenário T1.1: confirmação ao mudar para Aprovador
- **Given** uma pessoa ativa com papel Revisor no "Painel de Usuários"
- **When** o Aprovador escolhe "Aprovador" no seletor de Papel dela
- **Then** nada é gravado ainda, e a tela abre a confirmação "Mudar {nome} para Aprovador?"
- **And** a confirmação mostra o texto "Escolha as áreas que {nome} vai aprovar." e as seis áreas do Aprovador em caixas de seleção, todas desmarcadas
- **And** os botões são "Cancelar" e "Mudar para Aprovador"
- **And** no ambiente publicado, a lista de áreas é a que vem do backend, como na lista do lápis

### Cenário T1.2: pelo menos uma área para concluir
- **Given** a confirmação "Mudar {nome} para Aprovador?" aberta, sem área marcada
- **When** o Aprovador clica em "Mudar para Aprovador"
- **Then** a confirmação continua aberta e mostra o erro "Selecione pelo menos uma área."
- **And** nada é gravado e o papel continua Revisor
- **And** o erro some quando uma área é marcada

### Cenário T1.3: áreas na confirmação
- **Given** a confirmação aberta
- **When** o Aprovador marca e desmarca áreas
- **Then** vale a mesma regra da lista do lápis: marcar C-Level desmarca as demais, e marcar outra área desmarca C-Level
- **And** a confirmação mostra a nota "C-Level vale por todas e não se combina com outras."

### Cenário T1.4: concluir a mudança
- **Given** a confirmação aberta, com pelo menos uma área marcada
- **When** o Aprovador clica em "Mudar para Aprovador"
- **Then** o papel e as áreas são gravados juntos, num só pedido
- **And** a confirmação fecha, a linha mostra o papel Aprovador e as etiquetas das áreas escolhidas, com o lápis ao lado
- **And** aparece o aviso "Papel alterado": "{nome} agora é Aprovador de {áreas}."
- **And** a linha só muda com a resposta do backend; em erro, a pessoa continua Revisor e o aviso mostra o motivo (Q13)

### Cenário T1.5: cancelar
- **Given** a confirmação aberta, com ou sem áreas marcadas
- **When** o Aprovador clica em "Cancelar" ou aperta Esc
- **Then** a confirmação fecha, nada é gravado e o seletor de Papel volta a mostrar "Revisor"
- **And** abrir a confirmação de novo começa com todas as áreas desmarcadas

### Cenário T1.6: não desmarcar a única área
- **Given** um Aprovador ativo com uma só área, com a lista do lápis aberta
- **When** alguém desmarca essa área
- **Then** a caixa continua marcada, nada é gravado e aparece o aviso "Área não removida": "O Aprovador precisa de pelo menos uma área."
- **And** com duas ou mais áreas, desmarcar uma continua funcionando como hoje (Q6)
- **And** trocar C-Level por outra área, ou outra área por C-Level, continua funcionando, porque a pessoa nunca fica sem área
- **And** a regra vale também para a própria linha do Aprovador logado
- **And** a nota da lista passa a ser "C-Level vale por todas e não se combina com outras. O Aprovador precisa de pelo menos uma área."

### Cenário T1.7: Aprovador que já está sem área
- **Given** um Aprovador que já está sem área (promovido antes desta fase ou cadastrado pelo comando `cadastrar-perfil`)
- **When** a linha é exibida
- **Then** ele aparece com a etiqueta "Geral" e o lápis, como hoje
- **And** marcar a primeira área funciona; a partir daí vale o cenário T1.6
- **And** mudar o acesso dele (desativar, reativar) ou o papel para Revisor continua funcionando, sem exigir área

### Cenário T1.8: a rota de alterar recusa o mesmo pedido feito direto
- **Given** um pedido direto à rota `PATCH /api/gestao/usuarios/:id`
- **When** o pedido muda o papel de Revisor para Aprovador sem áreas, ou com a lista de áreas vazia
- **Then** a rota responde 400 com "Selecione pelo menos uma área." e nada é gravado
- **When** o pedido envia a lista de áreas vazia para quem é Aprovador
- **Then** a rota responde 400 com "O Aprovador precisa de pelo menos uma área." e nada é gravado
- **And** um pedido que não muda o papel para Aprovador nem envia áreas (por exemplo, só `ativo`) continua aceito para o Aprovador que já está sem área (T1.7)
- **And** as demais recusas da rota continuam como estão (Q8, Q10)

### Cenário T1.9: modo local, teclado e celular
- **Given** o "Painel de Usuários" no modo local (dados de exemplo) ou numa tela de celular
- **When** o Aprovador muda um Revisor para Aprovador ou tenta desmarcar a única área
- **Then** o comportamento é o mesmo dos cenários T1.1 a T1.6, com as mudanças só no navegador no modo local
- **And** a confirmação pode ser usada só com o teclado: o foco começa nela, Tab percorre as áreas e os botões, Espaço marca, e o erro do T1.2 é anunciado aos leitores de tela
- **And** no celular, a confirmação cabe na tela, sem rolagem lateral

## Etapa T2: Papel, Áreas e Situação no cadastro

### Cenário T2.1: campos do formulário
- **Given** o "Painel de Usuários" aberto por um Aprovador
- **When** ele clica em "Adicionar usuário"
- **Then** o formulário mostra Nome, E-mail da conta, Papel, Áreas e Situação, com os botões "Cancelar" e "Adicionar"
- **And** o Papel é uma lista suspensa com Revisor e Aprovador, e começa em **Revisor**
- **And** com Revisor, o campo Áreas fica desabilitado e mostra "Geral"
- **And** a Situação é um toggle, como o da coluna Ações, e começa em **Ativo**
- **And** o aviso do formulário passa a ser só "A conta precisa existir no painel do Supabase."

### Cenário T2.2: áreas em lista suspensa
- **Given** o formulário aberto
- **When** o Aprovador escolhe "Aprovador" no Papel
- **Then** o campo Áreas fica habilitado, com a aparência da lista suspensa do Papel e o texto "Selecione as áreas"
- **When** ele clica no campo Áreas
- **Then** a lista abre abaixo do campo, com as seis áreas do Aprovador em caixas de seleção
- **And** marcar e desmarcar não fecha a lista; ela fecha com um clique fora ou com Esc
- **And** o campo mostra as áreas escolhidas, separadas por vírgula (por exemplo, "Jurídico, Comercial")
- **And** marcar C-Level desmarca as demais, e marcar outra área desmarca C-Level; a lista mostra a nota "C-Level vale por todas e não se combina com outras."
- **And** voltar o Papel para Revisor limpa as áreas escolhidas, e o campo volta a mostrar "Geral", desabilitado
- **And** no ambiente publicado, a lista de áreas é a que vem do backend

### Cenário T2.3: Aprovador precisa de pelo menos uma área
- **Given** o formulário com Papel "Aprovador" e nenhuma área escolhida
- **When** o Aprovador clica em "Adicionar"
- **Then** a pessoa não é adicionada, o campo Áreas fica marcado como inválido e aparece o erro "Selecione pelo menos uma área."
- **And** o erro some quando uma área é marcada ou o Papel volta para Revisor

### Cenário T2.4: adicionar com o papel, as áreas e a situação escolhidos
- **Given** o formulário preenchido com nome, e-mail de uma conta existente, papel, áreas (se Aprovador) e situação
- **When** o Aprovador clica em "Adicionar"
- **Then** a pessoa é gravada num só pedido, já com o papel, as áreas e a situação escolhidos
- **And** o formulário fecha e a pessoa aparece na lista com esses dados
- **And** aparece o aviso "Usuário adicionado":
  - Revisor: "{nome} entrou como Revisor, área Geral."
  - Aprovador: "{nome} entrou como Aprovador de {áreas}."
  - Inativo: o mesmo texto, terminado em "O acesso está inativo."
- **And** com os valores padrão (Revisor, Ativo), o resultado é o mesmo de hoje (Q3)

### Cenário T2.5: adicionar com a situação Inativo
- **Given** o formulário com a Situação em "Inativo"
- **When** a pessoa é adicionada
- **Then** ela entra na lista como inativa, com o papel e as áreas escolhidos guardados
- **And** ela não consegue entrar na Tendra.ai até o acesso ser reativado pelo toggle da linha (Q7)
- **And** um Aprovador inativo não conta como Aprovador ativo da organização (Q8)

### Cenário T2.6: recusas que continuam
- **Given** o formulário preenchido
- **When** o nome está vazio, o e-mail é inválido, a pessoa já está na lista, é de outra organização ou não tem conta no Supabase Auth
- **Then** valem as mesmas recusas e mensagens de hoje (Q4), e nada é gravado
- **And** em qualquer recusa ou erro, o formulário continua aberto com o que foi preenchido, inclusive papel, áreas e situação

### Cenário T2.7: a rota de adicionar aceita e valida os novos campos
- **Given** um pedido à rota `POST /api/gestao/usuarios`
- **When** o pedido traz só `nome` e `email`
- **Then** a pessoa é gravada como Revisor, sem área, ativa, como hoje
- **When** o pedido traz `papel`, `areas` ou `ativo`
- **Then** a pessoa é gravada com esses valores
- **And** a rota responde 400, sem gravar, para:
  - Aprovador sem área: "Selecione pelo menos uma área.";
  - Revisor com área;
  - área inválida;
  - C-Level combinado com outra área;
  - papel inválido.
- **And** as demais respostas da rota continuam como estão (403 para o Revisor, 404, 409 e 503)

### Cenário T2.8: modo local, teclado e celular
- **Given** o formulário no modo local (dados de exemplo) ou numa tela de celular
- **When** o Aprovador adiciona uma pessoa
- **Then** o comportamento é o mesmo dos cenários T2.1 a T2.6, com a pessoa só no navegador no modo local
- **And** o formulário pode ser usado só com o teclado: Tab percorre os campos, Enter ou Espaço abre a lista de áreas, Espaço marca, Esc fecha a lista e devolve o foco ao campo
- **And** no celular, os campos ficam um abaixo do outro e a lista de áreas cabe na tela, sem rolagem lateral

## Fora de escopo

- A confirmação de Aprovador para Revisor e a de desativar o acesso (Q5 e Q7), que continuam como estão.
- Os Aprovadores que já estão sem área: nenhuma migração nem correção automática (T1.7).
- O comando `cadastrar-perfil`, que continua aceitando Aprovador sem área.
- A regra de aprovação por área (fase N): o Aprovador sem área continua aprovando só as perguntas "Geral".
- Reativar o acesso de um Aprovador inativo sem área: continua direto, sem pedir área.
- Criar a conta, definir a senha ou enviar convite: continuam no painel do Supabase (Q3).
- Editar o nome ou o e-mail de quem já está na lista.
- O registro das mudanças no Histórico, que segue como alteração futura da fase Q.
- Componentes, cores ou fontes novos no design system.
