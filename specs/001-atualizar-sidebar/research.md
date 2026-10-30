# Research: Sidebar Tendra.ai

**Date**: 2026-10-29

## 1. Origem e escopo da extração

**Decision**: Extrair o subconjunto necessário do Sidebar da base Base UI oficial, preservando contexto, toggle, composição, atributos de estado e renderização mobile por Sheet. Registrar URL, revisão/commit e licença MIT ao incorporar.

**Rationale**: Satisfaz a exigência de código e função shadcn; o repositório atual usa JSX/CSS sem Tailwind. Traduzir tipos e classes não exige trocar a stack.

**Alternatives considered**: Sidebar Radix (variante diferente da solicitada); só imitar o visual (não atende extração); instalar todo o registry (importa recursos sem uso).

Fontes: [documentação Sidebar](https://ui.shadcn.com/docs/components/base/sidebar), [fonte Sidebar](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/bases/base/ui/sidebar.tsx), [fonte Sheet](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/bases/base/ui/sheet.tsx), [licença](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md).

## 2. Dependências e React

**Decision**: Uma nova dependência direta, `@base-ui/react`; reutilizar Icon, Button e tokens existentes. Substituir cva/cn/Tailwind por CSS local; usar imports específicos de Dialog, Tooltip, mergeProps e useRender conforme necessário. Fixar versão compatível no package/lock durante implementação.

**Rationale**: O pacote oficial declara suporte a React 18; Base UI é sem estilo e aceita CSS comum. A versão exata instalada deve ser verificada com React 18.3.1 e build. Não instalar shadcn como biblioteca runtime.

**Alternatives considered**: Migrar React/Tailwind (escopo desnecessário); foco modal e tooltip escritos manualmente (mais código e risco); importar Input/Skeleton/submenus sem uso (desnecessário).

Fontes: [Base UI quick start](https://base-ui.com/react/overview/quick-start), [peer dependencies oficiais](https://github.com/mui/base-ui/blob/master/packages/react/package.json).

## 3. Modal e tooltip

**Decision**: Sheet derivado do Dialog Base UI; Tooltip Base UI em portal com aparência DS. Foco explícito conforme motivo de fechamento e título acessível no painel.

**Rationale**: Um painel lateral sem gestos pode usar Dialog posicionado. O Tooltip atual é absoluto e pode ser cortado pelo overflow do sidebar. A composição exige refs corretas; IconButton atual não usa forwardRef.

**Alternatives considered**: Manter overlay manual atual (não gerencia foco modal); atualizar todos os dialogs/tooltips do produto (escopo excessivo).

Fontes: [Dialog](https://base-ui.com/react/components/dialog), [Tooltip](https://base-ui.com/react/components/tooltip), [composição](https://base-ui.com/react/handbook/composition).

## 4. Estado e integração

**Decision**: Preservar `sideCollapsed`, `navOpen`, `vw` em useWorkspace como fonte de verdade; provider controlado, com adaptação para controle mobile. Manter breakpoint <900px e callbacks do viewModel. Remover a escrita de cookie upstream.

**Rationale**: `ws.go` já fecha navOpen; logout também o altera e reinicializações preservam sideCollapsed. Duplicar estado local deixaria trigger e navegação fora de sincronia. A spec não exige persistência entre sessões.

**Alternatives considered**: Estado totalmente interno ao provider (quebra integração existente); novo localStorage/cookie (requisito inexistente).

Evidência local: `src/workspace/useWorkspace.js`, `src/workspace/viewModel.js`, `src/App.jsx`.

## 5. Tokens e medidas

**Decision**: Largura expandida/mobile 288px = 4 × space-18; recolhida 64px = space-16. Padding lateral 8px e vertical 16px; itens mínimo 44px, padding 8px 12px, gap 12px; grupos separados por 24px. Item recolhido 48px para acomodar ícone e foco. CSS box-sizing border-box, sem borda extra afetando largura.

**Rationale**: Segue escala existente; 288px deixa espaço para Base de conhecimento em UI 15px e contador. Confirmar visualmente com fontes carregadas, especialmente contagens longas; permitir quebra de rótulo e aumento de altura quando necessário, sem truncar destinos.

**Alternatives considered**: Copiar medidas padrão shadcn (não garante DS/alvo 44px); manter override atual de 36px (viola spec); preservar gradiente de Primeiros passos (DS proíbe gradiente não solicitado).

Evidência local: `src/ds/tokens/`, `src/ds/README.md`, `src/index.css`.

## 6. Validação

**Decision**: Testes Playwright focados em comportamento e regressão da jornada existente; revisão visual dos três modos com fontes carregadas. Fixtures de UI podem interceptar respostas API para dados/ambientes, sem modificar produção.

**Rationale**: As mudanças envolvem foco, responsividade e integração; build isolado não as comprova. Evitar testes que apenas espelham a estrutura interna.

**Alternatives considered**: Só screenshots (não valida ações/foco); nova ferramenta de testes unitários (não necessária).

## Resultado

Questões técnicas resolvidas para planejamento. Constituição sem princípios ratificados registrada em plan.md. Não foram instaladas dependências nem realizados testes da futura implementação.
