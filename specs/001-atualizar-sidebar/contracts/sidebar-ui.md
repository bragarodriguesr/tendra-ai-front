# UI Contract: Sidebar Tendra.ai

## Composição e compatibilidade

`SidebarNav` preserva groups, value, tone, header, footer, width, collapsed, style e atributos HTML públicos, incluindo aria-label. Seu .d.ts deve refletir width number|string, como já usado por WorkspaceApp. A composição Workspace usa Provider controlado em torno da BrandBar e painel; o adaptador deve continuar utilizável isoladamente para consumidores existentes, sem provider obrigatório externo.

Provider expõe open/onOpenChange, openMobile/onOpenMobileChange, isMobile e contexto state/toggleSidebar. Mobile e desktop não devem manter cópias divergentes desses valores. O controle abre/fecha e anuncia aria-expanded e aria-controls para o painel real presente no modo atual.

Primitivas incluem Sidebar/Content/Footer/Group/GroupLabel/GroupContent/Menu/MenuItem/MenuButton/MenuBadge/Trigger. Somente a variante sidebar/icon é necessária para esta feature; não ampliar API por antecipação. Manter data-state, data-collapsible, data-slot e data-active coerentes com a referência extraída.

Navegação: `nav` com nome Workspace e lista semântica de links. Cada callback fornecido é executado uma vez. Detalhes de tarefa continuam marcando Tarefas; nenhuma rota nova. Não converter href/onClick existentes em URLs inventadas.

## Aparência

| Elemento | Token/medida |
| --- | --- |
| Superfície | --surface-card |
| Texto / meta / ativo | --text-body / --text-meta / --text-strong |
| Fundo ativo / hover | --surface-sunken / --n-075 |
| Filete ativo | 2px, --brand-ink (regra explícita do README DS) |
| Borda | --border-width, --border-default |
| Foco | --focus-ring, regra global focus-visible |
| Link | --font-sans, --text-ui-size/lh, --weight-regular; ativo --weight-semibold |
| Grupos / contadores | --font-mono, --text-label-size/lh/ls |
| Ícone | Icon existente, 20px, traço 2px |
| Raio dos itens | --radius-sm |
| Dimensão aberta/mobile | calc(4 * var(--space-18)) = 288px; mobile limitado à largura disponível |
| Dimensão recolhida | --space-16 = 64px |
| Itens | min-height --hit-min; padding --space-2 --space-3; gap --space-3 |
| Conteúdo | padding vertical --space-4, horizontal --space-2; grupos gap --space-6 |
| Item recolhido | --space-12 = 48px, ícone centralizado |
| Destaque inicial | --lime-wash, texto --brand-ink e borda --border-strong; ativo prevalece |
| Dica | --surface-inverse, --text-on-inverse, --border-inverse, --shadow-popover, --radius-sm |
| Backdrop | --scrim; sem blur |
| Painel mobile | --shadow-overlay; acima da BrandBar e do conteúdo |
| Movimento | --duration-base/--ease-out; hover --duration-fast; reduced-motion sem transição |

Rodapé usa tokens de espaço/raio/tipografia e mantém ações com mínimo 44px. Contadores longos não podem comprimir o ícone; rótulos podem quebrar e aumentar a altura se necessário. Conferir cálculo de largura com fontes reais, não presumir aprovação visual nesta fase.

## Foco e eventos

- Sheet: Dialog modal Base UI com título acessível Navegação do workspace, portal e controle Fechar menu de 44px.
- Entrada: foco no primeiro link disponível. Tab/Shift+Tab permanecem no modal.
- Cancelamento: foco no controle original; seleção: foco no main após navegação. Resize: foco transferido para controle/main visível, modal e scroll lock removidos.
- Tooltips usam portal/posicionamento Base UI, abrem em hover e foco e fecham por Escape/blur; nomes acessíveis não dependem de dica visual.
- Triggers compostos devem encaminhar ref ao DOM. Não usar IconButton atual como alvo de render sem resolver ref forwarding; preferir adapter com botão DOM e Icon quando necessário.
- Atalho ⌘B/Ctrl+B alterna menu do viewport e previne ação padrão quando tratado; ignorar inputs, textareas, selects e contenteditable.
- Preservar listeners de revisão existentes; não fazer atalhos duplicados nem capturar Escape de outra camada com sidebar fechado.

## Cobertura

FR-001/002/011/013: integração Workspace/viewModel e regressão. FR-003/004/010/012: CSS, revisão visual, viewport e reduced motion. FR-005/006: desktop e dicas. FR-007/008/009: mobile, foco e resize.

## Revisão: marca pertencente ao sidebar

SidebarHeader é uma primitiva pública de altura space-16 (64px), com Logo horizontal em estado expandido e símbolo no recolhido. O sidebar começa em y=0 e tem altura integral. SidebarTrigger fica na coluna de conteúdo, fora do SidebarHeader, acompanhando o limite horizontal do sidebar; alertas/usuário/saída permanecem à direita. No mobile, Dialog.Title continua acessível, logo ocupa o header do painel e Fechar menu fica no canto direito desse header. Preservar comportamento do link da marca (retornar ao site) e fechar o modal ao acioná-lo.

Acabamento aprovado para proposta: o Sidebar não tem borda vertical externa, evitando uma linha clara atravessando a junção dos cabeçalhos escuros. As superfícies diferenciam sidebar e conteúdo; bordas de controles e rodapé permanecem conforme o DS.
