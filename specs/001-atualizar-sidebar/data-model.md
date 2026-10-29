# Data Model: Sidebar

Modelo de apresentação; sem banco ou novos dados persistidos.

## NavigationGroup

- `label`: rótulo do grupo; grupos atuais Início, Trabalho e Base.
- `items`: lista ordenada de NavigationItem; ordem existente obrigatória.
- Relação: um grupo contém vários itens; grupos derivam de `v.navGroups`.

## NavigationItem

- `value`: identificador existente (onboarding, dashboard, tasks, review, export, history, base).
- `label`: texto exibido, preservado.
- `icon`: nome Lucide existente, renderizado por Icon.
- `count`: número opcional; zero é válido; não recalcular no componente.
- `href`, `onClick`: destino/ação existentes; preservar preventDefault e efeitos do viewModel.
- `className`: destaque contextual atual, adaptado visualmente.
- `active`: derivado de value === v.navValue. Não armazenar separadamente.
- Validação: contagem presente deve ser exibida expandida e incluída no nome acessível recolhido; item sem contagem não inventa zero.

## SidebarState

| Campo | Fonte | Regra |
| --- | --- | --- |
| desktopOpen | !state.sideCollapsed | toggle altera apenas sideCollapsed |
| mobileOpen | state.navOpen | abre/fecha painel mobile |
| isMobile | state.vw < 900 | mesma fonte responsiva do Workspace |
| state | desktopOpen | expanded ou collapsed; mobile sempre mostra rótulos |
| closeReason | transitório em ref | cancelamento, navegação ou mudança de viewport; orienta foco |

Transições:

1. Desktop trigger/atalho alterna desktopOpen sem trocar tela.
2. Mobile trigger/atalho abre painel e move foco para primeiro destino disponível.
3. Escape/clique externo/fechar: mobileOpen=false; foco volta ao trigger.
4. Seleção: callback existente navega e fecha navOpen; após renderizar o destino, focar main visível.
5. Mobile → desktop: fechar navOpen e desmontar modal, liberando scroll/foco; conservar sideCollapsed.
6. Desktop → mobile: painel inicia fechado; preferência desktop é conservada.
7. Logout/desmontagem: remover listeners, portais e bloqueio de scroll.

## EnvironmentContext

- `modo === compartilhado`: aviso de dados sintéticos aparece expandido; política atual preservada.
- `tarefasOrigem === servidor`: não mostrar painel demo.
- Demais origens: ação `ws.demoAll` disponível, como botão expandido ou ícone recolhido.
- Base vazia: indicação em Primeiros passos, sem alterar lógica de `ws.baseVazia`.

Nenhuma alteração nos modelos de tarefas, documentos, organização, autenticação ou permissões.
