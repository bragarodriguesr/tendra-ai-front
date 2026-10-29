# Tasks: Atualização do menu sidebar

**Input**: Documentos em `specs/001-atualizar-sidebar/`.
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contrato UI](contracts/sidebar-ui.md) e [quickstart.md](quickstart.md).
**Organization**: Histórias em ordem de prioridade: US1 (P1), US3 (P1), US2 (P2), US4 (P2). IDs de história seguem a spec, não a posição da fase.
**Tests**: Cenários de aceitação da spec orientam a validação; o plano e quickstart prevêem Playwright dedicado e jornada existente. Escrever primeiro os testes comportamentais e confirmar falhas relevantes antes de implementar; não criar testes que apenas espelham DOM interno.

## Format: `[ID] [P?] [Story] Description`

Todos os caminhos são relativos à raiz. `[P]` indica trabalho possível em arquivos distintos após os pré-requisitos indicados. Sem marcador, executar na ordem. Não executar em paralelo mudanças no mesmo arquivo. As tarefas não autorizam publicação ou mudanças no backend.

## Phase 1: Setup

**Purpose**: Preparar dependência e origem sem migrar a infraestrutura do projeto.

- [X] T001 Adicionar versão exata compatível de `@base-ui/react` em `package.json` e `package-lock.json`, conferir peers React 18.3.1 e usar imports específicos; não adicionar Tailwind, cva, cn ou biblioteca de ícones.
- [X] T002 Registrar URLs, commit/revisão copiada, licença MIT e adaptações do Sidebar/Sheet Base UI oficiais em `THIRD_PARTY_NOTICES.md`, usando as fontes de `specs/001-atualizar-sidebar/research.md`.

## Phase 2: Foundational — pré-requisitos compartilhados

**Purpose**: Extrair a infraestrutura usada pelas quatro histórias. Concluir antes de integrar as histórias.

- [X] T003 Extrair/adaptar contexto Provider/useSidebar e primitivas Sidebar/Trigger/Content/Footer/Group/GroupLabel/GroupContent/Menu/MenuItem/MenuButton/MenuBadge para JSX em `src/ds/components/navigation/Sidebar.jsx`; manter composição e atributos upstream, remover cookie e recursos sem uso; expor controle desktop/mobile sem estado duplicado e encaminhar refs ao DOM.
- [X] T004 Definir interfaces das primitivas em `src/ds/components/navigation/Sidebar.d.ts` e exports em `src/ds/index.js`, conforme `specs/001-atualizar-sidebar/contracts/sidebar-ui.md`; suportar callbacks controlados e composição de elementos sem aninhar botão e link.
- [X] T005 Criar estilos isolados básicos em `src/ds/components/navigation/Sidebar.css` e importar por `src/ds/styles.css`, com largura aberta/mobile de 288px derivada de space-18, recolhida space-16, box-sizing border-box, tokens de superfície/borda e estrutura flex com região rolável separada do rodapé.
- [X] T006 Preparar fixtures e helpers privados em `e2e/sidebar.spec.js` para entrar no workspace, interceptar API sem mudar produção e representar demo, servidor, compartilhado, base vazia e contadores; usar o harness de `playwright.config.js` sem chave real de IA.

**Checkpoint**: Primitivas importáveis, tipos e estilos coerentes; fixtures prontas. Não alterar grupos nem modelos de negócio.

## Phase 3: User Story 1 — Navegar com identidade Tendra.ai (P1, MVP)

**Goal**: Menu expandido atualizado com sete destinos e regras atuais preservadas.
**Independent Test**: Abrir os sete destinos no desktop, verificar seleção, três contadores e tokens; detalhes de tarefa continuam marcando Tarefas.

### Tests

- [X] T007 [P] [US1] Escrever cenários de navegação expandida em `e2e/sidebar.spec.js`: grupos/ordem/ícones, sete destinos, seleção em detalhes e criação de tarefa, callbacks com efeito único e contadores zero/vários dígitos, usando valores derivados das fixtures; confirmar a falha dos critérios novos antes da implementação.

### Implementation

- [X] T008 [P] [US1] Adaptar `src/ds/components/navigation/SidebarNav.jsx` para gerar grupos e itens das primitivas preservando props públicas e uso isolado sem provider externo; respeitar literalmente `data-model.md`: "ordem existente obrigatória", "zero é válido; não recalcular no componente", "Não armazenar separadamente" o ativo e "item sem contagem não inventa zero"; manter href/onClick e o viewModel como fonte dos sete identificadores existentes.
- [X] T009 [US1] Atualizar `src/ds/components/navigation/SidebarNav.d.ts` para compatibilidade das props existentes, incluindo width number|string, e refletir a composição em `src/ds/components/navigation/SidebarNav.prompt.md`.
- [X] T010 [US1] Integrar provider e sidebar em `src/workspace/WorkspaceApp.jsx`, envolvendo BrandBar/layout; controlar open por !state.sideCollapsed e openMobile por state.navOpen via ws.setState, isMobile por state.vw<900; preservar rodapé atual e ações da BrandBar, usando uma única reserva de largura abaixo dela.
- [X] T011 [US1] Aplicar tipografia, pesos, espaçamentos e estados Tendra em `src/ds/components/navigation/Sidebar.css` e remover overrides de 36px em `src/index.css`: links >=44px, ícones 20px/2px, ativo com filete 2px/fundo afundado, grupos mono, foco visível; manter tone paper/ink e rótulos legíveis com contagens longas.

**Checkpoint**: US1 aprovada por T007 e inspeção visual expandida; conteúdo e ações legados continuam acessíveis durante os incrementos seguintes.

## Phase 4: User Story 3 — Mobile e teclado (P1)

**Goal**: Painel modal acessível com foco previsível e estados responsivos independentes.
**Independent Test**: Nos dois viewports mobile, acessar os sete destinos e fechar por todos os meios; verificar Tab/Shift+Tab, foco e mudança 899/900px.

### Tests

- [X] T012 [P] [US3] Escrever cenários mobile em `e2e/sidebar.spec.js` para sete destinos, entrada de foco, confinamento Tab/Shift+Tab, Escape, clique externo, Fechar menu, seleção com foco no main, resize nos dois sentidos e desmontagem/logout sem scroll lock; confirmar falhas relevantes.

### Implementation

- [X] T013 [P] [US3] Implementar Sheet modal extraído do shadcn usando Dialog Base UI em `src/ds/components/navigation/Sidebar.jsx`: portal, título Navegação do workspace, controle Fechar menu de 44px, fechamento externo/Escape e refs para initialFocus/finalFocus, sem reaproveitar overlay manual.
- [X] T014 [US3] Integrar em `src/workspace/WorkspaceApp.jsx` o trigger com aria-expanded/aria-controls corretos e refs DOM, main com tabIndex=-1, motivo transitório de fechamento e restauração de foco: cancelar volta ao trigger; navegar foca main após render; remover painel/backdrop mobile manuais e fechar navOpen no resize sem perder sideCollapsed.
- [X] T015 [US3] Estilizar portal, backdrop --scrim, painel e fechamento em `src/ds/components/navigation/Sidebar.css`, acima da BrandBar e sem blur; limitar largura ao viewport, permitir scroll dos links, rodapé acessível, transição por tokens e ausência de animação com reduced motion.

**Checkpoint**: US3 validada independentemente em 360×640 e 768×1024; nenhum elemento oculto recebe foco nem bloqueia o conteúdo após resize.

## Phase 5: User Story 2 — Recolhimento desktop (P2)

**Goal**: Navegação por ícones com dicas e atalho, sem perder seleção ou dados.
**Independent Test**: Alternar por controle/atalho e acessar os sete destinos recolhidos, usando mouse e teclado.

### Tests

- [X] T016 [P] [US2] Escrever cenários desktop em `e2e/sidebar.spec.js` para toggle sem troca de tela, espaço liberado, sete destinos recolhidos, nome acessível com contagem, dicas em hover/foco fora do overflow, Escape/blur, retorno dos rótulos e atalho ignorado em campos editáveis; confirmar falhas relevantes.

### Implementation

- [X] T017 [P] [US2] Completar toggle/atalho upstream em `src/ds/components/navigation/Sidebar.jsx` com ⌘B/Ctrl+B, cleanup de listener e prevenção do padrão somente quando tratado; ignorar input/textarea/select/contenteditable, manter callbacks desktop/mobile independentes e evitar conflitos com atalhos da Revisão.
- [X] T018 [US2] Integrar Tooltip Base UI em portal aos itens recolhidos em `src/ds/components/navigation/Sidebar.jsx` e `src/ds/components/navigation/SidebarNav.jsx`; dicas à direita por hover/foco, sem title duplicado, nome acessível independente incluindo count presente, estado ativo e execução única do onClick.
- [X] T019 [US2] Completar estilos recolhidos em `src/ds/components/navigation/Sidebar.css` e controle na BrandBar em `src/workspace/WorkspaceApp.jsx`: coluna 64px, itens 48px, rótulos/grupos/contadores ocultos visualmente, foco sem corte, dicas com tokens e expansão sem deslocamento inesperado do conteúdo.

**Checkpoint**: US2 validada em 1280×720 e 1440×900, com seleção/dados preservados ao alternar e sem cookie novo.

## Phase 6: User Story 4 — Ações e avisos contextuais (P2)

**Goal**: Preservar demo, servidor, compartilhado e orientação de base vazia com aparência DS.
**Independent Test**: Comparar condições do rodapé e executar demoAll expandido/recolhido; conferir orientação inicial e aviso sintético.

### Tests

- [X] T020 [P] [US4] Escrever cenários contextuais em `e2e/sidebar.spec.js` com fixtures representativas: efeito atual de demoAll expandido/recolhido, ausência do painel quando tarefasOrigem=servidor, aviso expandido quando modo=compartilhado e indicação de base vazia; confirmar falhas visuais/de acessibilidade pertinentes.

### Implementation

- [X] T021 [P] [US4] Compor SidebarFooter em `src/workspace/WorkspaceApp.jsx`, fora da região rolável, preservando literalmente as condições de `data-model.md` "tarefasOrigem === servidor" e "modo === compartilhado" e ws.demoAll; garantir botão/ícone com alvo >=44px, dica/nome acessível recolhido e tokens para borda, padding, raio e tipografia.
- [X] T022 [US4] Substituir gradiente/cores fixas de `.tdr-nav-destaque` em `src/index.css` pelos estilos de tokens em `src/ds/components/navigation/Sidebar.css`, preservando a classe oriunda de `src/workspace/viewModel.js` e a regra ws.baseVazia; usar lime-wash/tinta/borda do contrato, com ativo prioritário.

**Checkpoint**: US4 validada em cada ambiente com seus próprios dados; não tratar demo como evidência do modo servidor/compartilhado.

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T023 Adicionar verificações cruzadas a `e2e/sidebar.spec.js` para viewports 360×640, 768×1024, 1280×720, 1440×900, altura reduzida, contagens longas/zero, reduced motion e legibilidade integral de Base de conhecimento; conferir ações da BrandBar e ausência de scroll horizontal do menu, corrigindo defeitos nos arquivos afetados antes de prosseguir.
- [X] T024 [P] Atualizar `src/ds/README.md` com consumo das primitivas, compatibilidade SidebarNav, tokens, comportamento responsivo e referência à origem em `THIRD_PARTY_NOTICES.md`, sem alterar os exports em project/_ds ou uploads.
- [X] T025 Rodar `npm run build`, `npm run e2e -- e2e/sidebar.spec.js` e `npm run e2e -- e2e/jornada.spec.js` conforme `specs/001-atualizar-sidebar/quickstart.md`; registrar comandos/resultados em `specs/001-atualizar-sidebar/validation.md` e corrigir regressões sem enfraquecer a jornada em `e2e/jornada.spec.js`.
- [X] T026 Executar a revisão visual e de teclado de `specs/001-atualizar-sidebar/quickstart.md` com fontes carregadas, capturar evidências em `specs/001-atualizar-sidebar/evidence/` e registrar em `specs/001-atualizar-sidebar/validation.md` a cobertura de FR-001 a FR-013 e SC-001 a SC-006, incluindo limitações reais; confirmar extração upstream, DS, foco, contadores, rodapé e barra superior.

## Dependencies & Execution Order

### Phase dependencies

```text
Setup T001 → T002
       ↓
Foundation T003 → T004 → T005 → T006
       ↓
US1 T007 + T008 → T009 → T010 → T011
       ↓
US3 T012 + T013 → T014 → T015
       ↓
US2 T016 + T017 → T018 → T019
       ↓
US4 T020 + T021 → T022
       ↓
Polish T023 + T024 → T025 → T026
```

`+` indica arquivos distintos que podem ser preparados em paralelo; execução dos testes aguarda integração da história. Confirmar falha relevante antes de concluir a implementação correspondente. Depois, repetir os testes da história até aprovação.

### Story dependencies and integration

- US1 depende da fundação e entrega a adaptação de grupos/itens e integração base.
- US3, US2 e US4 usam essa integração de US1. São verificáveis por seus próprios cenários; não precisam da lógica nova umas das outras para seu comportamento principal.
- Executar as histórias na ordem US1 → US3 → US2 → US4: além de respeitar P1 antes de P2, evita concorrência nos mesmos `Sidebar.jsx`, `Sidebar.css` e `WorkspaceApp.jsx`. Essa ordem de integração não deve ser confundida com dependência de negócio entre US3 e US2.
- Polish requer todas as histórias; T025 aguarda T023 e T024, T026 aguarda T025 aprovado.
- Os testes por história compartilham `e2e/sidebar.spec.js`: não editar duas seções desse arquivo simultaneamente.

## Parallel Examples per Story

- **US1**: após T006, preparar T007 em `e2e/sidebar.spec.js` e T008 em `src/ds/components/navigation/SidebarNav.jsx`. Testes não dependem de implementação interna; executar a verificação de falha antes de integrar.
- **US3**: após US1, preparar T012 em `e2e/sidebar.spec.js` e T013 em `src/ds/components/navigation/Sidebar.jsx`; integrar foco no Workspace somente depois.
- **US2**: após US3, preparar T016 em `e2e/sidebar.spec.js` e T017 em `src/ds/components/navigation/Sidebar.jsx`; T018 depende de T017.
- **US4**: após US2, preparar T020 em `e2e/sidebar.spec.js` e T021 em `src/workspace/WorkspaceApp.jsx`; T022 pode seguir após a integração do rodapé.
- **Polish**: T023 (testes) e T024 (README) usam arquivos distintos e podem ocorrer juntos após US4.

Essas são oportunidades de execução, não uma exigência de delegação a agentes.

## Implementation Strategy

### MVP first

Concluir Setup, Foundation e US1; validar os sete destinos e aparência expandida. É o primeiro incremento demonstrável. Os comportamentos legados mobile/recolhido/rodapé devem continuar disponíveis até serem substituídos pelos incrementos correspondentes; o MVP não representa a feature completa.

### Incremental delivery

Adicionar US3 (mobile acessível), US2 (recolhimento/dicas/atalho) e US4 (acabamento contextual), validando cada história e repetindo as verificações anteriores afetadas. Finalizar com build, jornada e evidência visual/teclado. Não adicionar banco, roteador, persistência entre sessões ou componentes sem uso.

## Coverage and Notes

| Requisitos | Tarefas principais |
| --- | --- |
| FR-001/002 | T007–T010, T023, T025 |
| FR-003/004 | T005, T011, T015, T019, T021–T023, T026 |
| FR-005/006 | T016–T019 |
| FR-007/008/009 | T012–T015, T017, T023 |
| FR-010 | T005, T015, T021, T023 |
| FR-011 | T020–T022 |
| FR-012 | T015, T019, T023, T026 |
| FR-013 | T010, T014, T019, T023, T025–T026 |
| SC-001–006 | T007, T012, T016, T020, T023, T025–T026 |

- Total: 26 tarefas; US1=5, US3=4, US2=4, US4=3; Setup=2, Foundation=4, Polish=4.
- A constituição permanece sem princípios ratificados, conforme plan.md. Nenhuma tarefa trata comentários de exemplo como governança vigente.
- Sem hooks before_tasks/after_tasks configurados na geração. Não criar nem trocar branch por inferência do nome da pasta.
- As 26 tarefas foram executadas; resultados e limitações em validation.md. Validação do time permanece necessária antes de integração e publicação.

## Revisão do usuário — estrutura de marca e controle

- [X] T027 Integrar SidebarHeader com Logo horizontal/símbolo em `src/workspace/WorkspaceApp.jsx` e `src/ds/components/navigation/Sidebar.jsx`, separar sidebar integral e coluna de conteúdo em `src/ds/components/navigation/Sidebar.css`, mantendo o trigger adjacente à borda e fora do cabeçalho da marca.
- [X] T028 Atualizar contrato de SidebarHeader em `src/ds/components/navigation/Sidebar.d.ts`, export em `src/ds/index.js` e cenário estrutural em `e2e/sidebar.spec.js`; atualizar `spec.md`, `plan.md` e `contracts/sidebar-ui.md` conforme a revisão solicitada.
- [X] T029 Validar build, interação/estrutura/foco e capturas revisadas, registrando o resultado em `specs/001-atualizar-sidebar/validation.md`.

## Acabamento e revisão do time

- [X] T030 Remover a borda vertical externa em `src/ds/components/navigation/Sidebar.css` para unificar a faixa superior e testar ausência da borda em `e2e/sidebar.spec.js`.
- [ ] T031 Validar o acabamento e abrir pull request da branch `001-atualizar-sidebar` para revisão do time, sem merge ou deploy; registrar em `specs/001-atualizar-sidebar/validation.md`.
