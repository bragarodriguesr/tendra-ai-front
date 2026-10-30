# Implementation Plan: Atualização do menu sidebar

**Branch**: `001-atualizar-sidebar` (Git real) | **Date**: 2026-10-29 | **Spec**: [spec.md](spec.md)

**Input**: `specs/001-atualizar-sidebar/spec.md`

## Summary

Incorporar o código do Sidebar shadcn Base UI, adaptado a JSX e CSS com tokens Tendra.ai. Preservar os sete destinos e regras de negócio de `viewModel.js`, mantendo `SidebarNav` como adaptador de dados. Usar provider/contexto, composição de grupos e itens, recolhimento por ícones, atalho e estados visuais provenientes da referência. Mobile usa Sheet baseado em Dialog Base UI; dicas usam Tooltip Base UI em portal. Uma nova dependência direta: `@base-ui/react`. Não instalar Tailwind nem substituir o DS inteiro.

## Technical Context

**Language/Version**: JavaScript ESM/JSX; React e React DOM ^18.3.1; Vite ^6.0.0 (instalação observada 6.4.3). Node >=24 para a jornada com backend.

**Primary Dependencies**: React, CSS custom properties Tendra.ai; adicionar `@base-ui/react` (linha 1.x, versão exata compatível registrada no lockfile na implementação; referência consultada 1.9.0). Playwright 1.56.1 existente. Sem nova biblioteca de ícones, CSS utilities ou gerenciador de estado.

**Storage**: Estado transitório existente em `useWorkspace`: `sideCollapsed`, `navOpen`, `vw`. Nenhuma mudança em banco, API ou persistência; remover escrita incidental de cookie do código extraído.

**Testing**: Build Vite, testes Playwright dedicados de sidebar e jornada existente. Verificação visual de tokens nos estados expandido/recolhido/mobile; teclado, foco, viewport e reduced motion.

**Target Platform**: Navegadores desktop e mobile; limite mobile <900px. Referências: 360×640, 768×1024, 1280×720, 1440×900.

**Project Type**: Aplicação web React existente com backend independente, sem alteração de backend nesta feature.

**Performance Goals**: Alternância local, sem requisição; transição de largura/painel em `--duration-base` (220ms), hover/foco em `--duration-fast` (140ms); sem animação com movimento reduzido.

**Constraints**: Links/regras atuais preservados; todos os alvos do sidebar >=44px; ícones 20px/2px; nenhuma cor ou tipografia externa ao DS. Barra superior mantida; portal mobile cobre a página enquanto modal, sem mudar sua posição no layout.

**Scale/Scope**: Uma navegação, três grupos, sete itens, três contadores e rodapé contextual. Sem novos destinos, submenus, resize ou busca.

## Constitution Check

*Verificação antes da pesquisa e após o design.*

A constituição em `.specify/memory/constitution.md` está integralmente em formato de template. Não existem princípios ratificados verificáveis; os comentários de exemplo não serão tratados como regras. Resultado: sem gate constitucional definido, sem violação identificável. Isso não constitui ratificação nem comprovação de conformidade com princípios futuros. A ausência foi registrada na spec e não impede esta fase.

Gates derivados dos requisitos efetivos: preservar destinos e negócio; usar código da variante Base UI; aplicar DS integralmente; não alterar backend; garantir teclado/foco/mobile. Antes da pesquisa: PASS por escopo. Após design: PASS por decisões e contratos abaixo. Compatibilidade e comportamento precisam ser demonstrados na implementação, não foram testados nesta fase documental.

## Project Structure

### Documentation (this feature)

```text
specs/001-atualizar-sidebar/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/requirements.md
└── contracts/sidebar-ui.md
```

`tasks.md` será gerado por speckit-tasks, fora desta fase. O setup retornou BRANCH=001-atualizar-sidebar como identificador derivado da pasta; `git branch --show-current` confirmou main. Na fase de planejamento nenhuma branch foi criada; antes da implementação, por orientação do usuário, foi criada `001-atualizar-sidebar`.

### Source Code (repository root)

```text
src/ds/components/navigation/
├── Sidebar.jsx                    # primitivas extraídas/adaptadas e hook
├── Sidebar.css                    # CSS por data-state/data-slot e tokens
├── Sidebar.d.ts                   # contratos das primitivas
├── SidebarNav.jsx                 # adaptador atual preservado
├── SidebarNav.d.ts
└── SidebarNav.prompt.md
src/ds/styles.css                  # import do CSS
src/ds/index.js                    # exports
src/ds/README.md                   # uso e origem do componente
src/workspace/WorkspaceApp.jsx     # provider, trigger, painel e rodapé
src/workspace/useWorkspace.js      # estado existente, só se integração exigir
src/workspace/viewModel.js         # fonte de grupos preservada
src/index.css                     # remover overrides antigos do sidebar
package.json / package-lock.json  # Base UI
THIRD_PARTY_NOTICES.md            # origem, revisão e licença upstream
 e2e/sidebar.spec.js              # testes de interação/regressão
 e2e/jornada.spec.js              # jornada existente preservada
```

**Structure Decision**: Manter primitivas e aparência no DS; composição específica e regras de ambiente no Workspace. Não tocar `project/_ds` e uploads, que são referências exportadas. Não reescrever Tooltip/Dialog de outras telas.

## Phase 0 — Research

Concluída em [research.md](research.md): origem oficial, dependências, compatibilidade, acessibilidade, estado, estilos, medidas e testes. Sem questões técnicas não resolvidas. A versão exata e revisão upstream devem ser registradas ao copiar o código, como rastreabilidade de implementação.

## Phase 1 — Design

- Criar um subconjunto do sidebar upstream: Provider/useSidebar, Sidebar, Trigger, Content, Footer, Group/Label/Content, Menu/Item/Button/Badge. Omitir componentes não utilizados (Input, Skeleton, submenus e variantes extras). Extrair a lógica upstream efetivamente; não apenas reproduzir aparência.
- Provider envolve BrandBar e layout. Controlar desktop com `open = !state.sideCollapsed`; mobile com `openMobile = state.navOpen`; callbacks atualizam `ws.setState`. Acrescentar controle mobile ao provider extraído, evitando estado duplicado. `isMobile` deriva de `state.vw < 900`, sem segundo breakpoint conflitante.
- Layout preserva altura da BrandBar e usa uma única reserva de largura desktop. Adaptar posicionamento fixo upstream ao container abaixo da barra; não somar o spacer upstream à coluna antiga.
- `SidebarNav` mantém assinatura pública e gera primitivas a partir de `v.navGroups` e `v.navValue`. Manter `aria-label="Workspace"`, href e onClick existentes. O item ativo é derivado do viewModel; não criar roteador. `render`/useRender devem manter semântica e composição de eventos, sem botão contendo link.
- Usar Dialog Base UI para Sheet mobile com título acessível Navegação do workspace, backdrop opaco via `--scrim`, portal, fechamento explícito, Escape e clique externo. Usar refs de elementos DOM ou forwardRef nos adaptadores que forem triggers; IconButton atual não encaminha ref, portanto não presumir compatibilidade de composição.
- Inicializar foco no primeiro link disponível. Para cancelamento, devolver ao trigger; para seleção, após a navegação focar o main com tabIndex=-1. Em resize para desktop fechar navOpen e liberar modal/foco. Remover backdrop e painel mobile manuais atuais.
- Tooltips Base UI exclusivos do sidebar, em portal, à direita; evitar clipping no scroll. Não reutilizar Tooltip atual com posição absoluta dentro de overflow hidden. Evitar title duplicado quando houver tooltip.
- Rodapé fora de SidebarContent; preservar condições e `ws.demoAll`, aviso compartilhado e ação recolhida. Usar controles de 44px também no rodapé/trigger, sem mudar tamanhos globais do DS.
- CSS isolado substitui overrides `.tdr-sidebar nav ... !important` de 36px. Remover gradiente e cores fixas de `.tdr-nav-destaque`; destacar orientação inicial com `--lime-wash`, texto tinta e borda de tokens, mantendo ativo prioritário.
- Medidas e mapeamento completos em [contracts/sidebar-ui.md](contracts/sidebar-ui.md); entidades e transições em [data-model.md](data-model.md). Validação em [quickstart.md](quickstart.md).

## Validation and Risks

Testar todos os FR via sidebar E2E e revisão visual; rodar build e jornada de regressão. Dar atenção a ref forwarding, portal acima da BrandBar (z-index atual 60), foco ao navegar, conflito do atalho com campos editáveis e remoção dos overrides antigos. Não declarar cenários servidor/compartilhado cobertos apenas por fixtures demo. O atalho deve ignorar campos editáveis para não interferir na edição; Escape pertence ao modal quando aberto.

## Complexity Tracking

Nenhuma violação constitucional identificável. Base UI é necessária para cumprir a referência exigida e evitar implementar manualmente foco modal e posicionamento de dicas. A adaptação CSS evita introduzir uma segunda infraestrutura de estilos.

## Revisão de estrutura solicitada pelo usuário

O shell passa a ter Sidebar de altura integral à esquerda, contendo SidebarHeader com Logo Tendra.ai, conteúdo rolável e rodapé. À direita, uma coluna com header próprio (trigger junto à borda do sidebar, alertas, usuário e saída) e conteúdo. O logo horizontal recolhe ao símbolo. O mobile mantém o logo no painel e o controle de abertura no conteúdo. Esta decisão substitui a manutenção da marca na BrandBar global do Workspace; site e splash mantêm BrandBar existente.
