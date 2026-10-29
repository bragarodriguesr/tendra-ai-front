# Feature Specification: Atualização do menu sidebar

**Feature Branch**: `001-atualizar-sidebar` (criada antes da implementação; sem push, merge ou deploy)

**Created**: 2026-10-29

**Status**: Implementada e validada localmente; aguardando revisão do time

**Input**: Atualizar o sidebar seguindo o exemplo Base UI do shadcn, utilizando seu código, interação e funções, com os tokens de cor, tipografia e espaçamento Tendra.ai e aderência integral ao design system. Manter os links: atualização de interface.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navegar com identidade Tendra.ai (Priority: P1)

Como usuário do workspace, quero reconhecer os destinos existentes na interface atualizada, para continuar trabalhando sem reaprender a navegação.

**Why this priority**: Preservar acesso às funções e consistência visual é o objetivo central.

**Independent Test**: Abrir os sete destinos e conferir seleção, contadores e aparência contra o design system.

**Acceptance Scenarios**:

1. **Given** o menu expandido, **When** examino os grupos, **Then** encontro Início (Primeiros passos, Dashboard), Trabalho (Tarefas, Revisão, Exportação, Histórico) e Base (Base de conhecimento), nesta ordem, com nomes, ícones e destinos preservados.
2. **Given** um destino selecionado, **When** a tela abre, **Then** o item correspondente fica ativo; detalhes de tarefa mantêm Tarefas ativo, conforme o comportamento atual.
3. **Given** dados do workspace, **When** as quantidades mudam, **Then** os contadores de Tarefas, Revisão e Base de conhecimento refletem as mesmas regras atuais.
4. **Given** os estados normal, hover, foco e ativo, **When** comparados ao DS, **Then** cores, tipografia, espaçamentos, raios e ícones seguem a Tendra.ai, incluindo fundo afundado e filete lateral no item ativo.

### User Story 2 - Recolher e expandir no desktop (Priority: P2)

Como usuário desktop, quero liberar espaço recolhendo o menu a ícones sem perder acesso à navegação.

**Why this priority**: Aproveitar a área útil mantendo todos os destinos disponíveis.

**Independent Test**: Alternar pelo controle e pelo atalho e acessar todos os destinos no modo recolhido.

**Acceptance Scenarios**:

1. **Given** o menu expandido, **When** aciono o controle ou ⌘B/Ctrl+B, **Then** ele se recolhe a ícones, libera espaço e preserva a tela atual.
2. **Given** o menu recolhido, **When** um item recebe hover ou foco, **Then** uma dica mostra seu nome e seu nome acessível inclui a contagem quando existente.
3. **Given** o menu recolhido, **When** expando novamente, **Then** grupos, rótulos, contadores e ações reaparecem com os dados atuais e a seleção preservada.

### User Story 3 - Navegar no mobile e por teclado (Priority: P1)

Como usuário em tela pequena ou usando teclado, quero acessar o menu com foco previsível.

**Why this priority**: Garantir acesso à navegação em dispositivos móveis e sem mouse.

**Independent Test**: Abrir o painel em tela pequena, percorrê-lo por teclado e testar cada forma de fechamento.

**Acceptance Scenarios**:

1. **Given** o painel fechado, **When** aciono Abrir menu, **Then** ele abre sobre o conteúdo com os mesmos destinos e recebe o foco.
2. **Given** o painel aberto, **When** pressiono Escape, clico fora ou aciono o fechamento, **Then** ele fecha e o foco retorna ao controle de abertura.
3. **Given** o painel aberto, **When** escolho um destino, **Then** a tela correta abre, o painel fecha e o foco fica em elemento visível fora do painel fechado.
4. **Given** o painel aberto, **When** navego por teclado, **Then** o foco permanece no painel e o conteúdo encoberto não recebe interação.

### User Story 4 - Preservar ações e avisos contextuais (Priority: P2)

Como usuário, quero manter as ações de demo e os avisos aplicáveis ao meu ambiente.

**Why this priority**: A atualização visual deve preservar os recursos existentes.

**Independent Test**: Conferir demo, servidor e ambiente compartilhado, e executar a aprovação em demo.

**Acceptance Scenarios**:

1. **Given** o modo demo, **When** o menu está expandido ou recolhido, **Then** Aprovar todos os itens continua acessível e com o mesmo efeito; recolhido, tem nome acessível e dica.
2. **Given** tarefas provenientes do servidor, **When** vejo o menu, **Then** o painel de demo permanece ausente.
3. **Given** ambiente compartilhado, **When** expando o menu, **Then** o aviso de dados sintéticos permanece visível no rodapé.
4. **Given** base vazia, **When** vejo Primeiros passos, **Then** sua indicação de orientação inicial permanece, com aparência aderente ao DS.

### Edge Cases

- Contadores zero continuam visíveis no menu expandido; contadores com vários dígitos não colidem com o texto.
- Em altura reduzida, os links rolam e o rodapé continua acessível.
- Ao cruzar o limite desktop/mobile, nenhum painel invisível retém foco ou bloqueia o conteúdo; recolhimento desktop não abre o mobile.
- Base de conhecimento deve ficar integralmente legível no menu expandido nas larguras de referência.
- Movimento reduzido não impede identificar o estado do menu.
- Detalhes e criação de tarefa mantêm o mapeamento atual de seleção, sem novos destinos.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Preservar os sete destinos, grupos, ordem, rótulos, ícones e ações da história 1.
- **FR-002**: Preservar navegação, regras de contagem, seleção, permissões e dados atuais, incluindo Exportação e detalhes de tarefa.
- **FR-003**: Aplicar o DS Tendra.ai nos estados normal, hover, ativo e foco, nas dicas e no painel mobile. Ativo usa fundo afundado e filete lateral, sem pílula preenchida.
- **FR-004**: Usar IBM Plex Sans no tamanho UI nos links, IBM Plex Mono conforme DS em grupos e metadados, ícones de navegação de 20px com traço de 2px e alvos interativos de no mínimo 44px.
- **FR-005**: Permitir recolher a ícones e expandir no desktop pelo controle existente e por ⌘B/Ctrl+B, preservando o destino atual.
- **FR-006**: Manter os destinos acionáveis no modo recolhido, com seleção identificável, nomes acessíveis e dicas por hover e foco.
- **FR-007**: No mobile, abrir como painel sobreposto e fechar por controle, Escape, clique externo e seleção de destino.
- **FR-008**: Oferecer foco visível, navegação por teclado, anúncio de página atual e estado expandido/recolhido, além do gerenciamento de foco da história 3.
- **FR-009**: Manter estados independentes entre desktop e mobile, sem bloquear a tela ao mudar sua largura.
- **FR-010**: Permitir rolagem dos links em pouca altura, manter o rodapé acessível e evitar rolagem horizontal do menu nas referências de validação.
- **FR-011**: Preservar condições e efeitos do painel de demo, aviso de dados sintéticos e indicação de base vazia, conforme a história 4.
- **FR-012**: Seguir os tokens de movimento Tendra.ai e respeitar a preferência de movimento reduzido.
- **FR-013**: Preservar as ações de marca, controle do menu, alertas, usuário e saída. Conforme revisão do usuário, a marca integra SidebarHeader; o controle de recolhimento/expansão fica na área de conteúdo, adjacente à borda do sidebar, como na referência shadcn. No modo recolhido, manter o símbolo Tendra.ai; no mobile, a marca aparece no painel aberto.

### Key Entities

- **Grupo de navegação**: seção nomeada com destinos ordenados.
- **Item de navegação**: destino com rótulo, ícone, ação, estado ativo e contador opcional.
- **Estado do menu**: expandido/recolhido no desktop e aberto/fechado no mobile.
- **Contexto do ambiente**: condições existentes para demo, dados sintéticos e base vazia; sem novos dados de negócio.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Os 7 destinos são acessíveis nos 3 modos (desktop expandido, recolhido e mobile), com 100% dos cenários de navegação aprovados.
- **SC-002**: A revisão visual de todos os modos, estados de interação e rodapés não encontra divergência das regras de cor, tipografia, espaçamento e iconografia do DS.
- **SC-003**: Todas as ações do menu podem ser realizadas somente com teclado, sem foco em elementos ocultos ou perda de foco ao fechar o painel.
- **SC-004**: Em 360×640, 768×1024, 1280×720 e 1440×900, todos os destinos e ações aplicáveis ficam acessíveis, sem sobreposição de texto ou rolagem horizontal do menu.
- **SC-005**: Expandir/recolher exige uma ação; no mobile, selecionar qualquer destino fecha o painel e exibe a tela correta em todos os cenários de aceitação.
- **SC-006**: Contadores e condições do rodapé coincidem com o comportamento anterior em todos os cenários demo, servidor e compartilhado usados na validação.

## Assumptions

- Não haverá novos destinos, permissões, telas, regras de negócio ou mudanças no backend.
- Referência obrigatória: https://ui.shadcn.com/docs/components/base/sidebar. A extração do código, funções e interações da variante Base UI é exigência explícita do usuário; incorporação e dependências pertencem ao planejamento técnico.
- Fontes normativas de aparência: `src/ds/README.md` e `src/ds/tokens/`. A imagem fornecida registra conteúdos existentes; não substitui os tokens como referência de medidas.
- Mantém-se o limite responsivo atual de 900px: abaixo dele, o menu é mobile. Larguras serão definidas no planejamento conforme tokens, legibilidade e área útil.
- Não se exige persistência entre sessões; preserva-se o comportamento atual dentro da sessão.
- Submenus, busca, seletor de organização e redimensionamento manual estão fora do escopo.
- A indicação de base vazia permanece semanticamente; aparência atual incompatível com o DS será corrigida.
- A constituição em `.specify/memory/constitution.md` contém apenas placeholders; a ausência de princípios ratificados deverá ser considerada no planejamento.
