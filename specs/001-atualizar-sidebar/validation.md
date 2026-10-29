# Validação: Sidebar Tendra.ai

Data: 2026-10-29. Branch local: `001-atualizar-sidebar`. Alterações locais, sem push, merge ou deploy. Pronto para validação do time.

## Resultado

- `npm run build`: PASS; 293 módulos, bundle JS 482.92 kB (150.50 kB gzip).
- `npm run e2e -- e2e/sidebar.spec.js --workers 3`: PASS, 12/12 testes, 23.8s na última execução.
- `npm run e2e -- e2e/jornada.spec.js`: PASS, 1/1 jornada, 48.8s; base → tarefa → revisão → exportação e persistência. Executada antes do último acabamento puramente visual do filete; suite completa do sidebar repetida após esse acabamento.
- `git diff --check`: PASS.
- Lint design-taste-frontend: 0 FAIL, 4 WARN justificados (mono do DS; sombras apenas em camadas flutuantes).
- Inspector design-taste-frontend no build local: 0 FAIL, 3 WARN justificados, com exceções explícitas `mono,micro-label,no-title`. Explicações e crítica em [taste-review.md](taste-review.md); relatório bruto em [report.json](evidence/taste-review/report.json).

## Antes/depois

Os cenários iniciais confirmaram itens de 36px, ausência do modal mobile e ausência de dicas em portal no menu anterior. O ambiente exigiu instalar dependências locais do backend e Chromium e autorizar portas locais; essas falhas de preparação não foram consideradas defeitos do produto.

A implementação mantém o código/composição derivados do shadcn Base UI com JSX/CSS Tendra, controlados pelo estado atual. Acertos de validação: retorno de foco em main com tabIndex=-1 (Base UI selecionava seu primeiro filho tabulável), semântica explícita de tooltip, expectativas de teste alinhadas aos nomes atuais e polling do foco modal devido à atualização assíncrona do Dialog. Não se enfraqueceu a jornada existente.

## Cobertura

| Requisito | Evidência |
| --- | --- |
| FR-001 | US1 e US2: sete destinos, mesma seleção e nomes; US3: sete destinos mobile |
| FR-002 | US1: detalhes mantêm Tarefas ativo e criação mantém mapeamento atual; jornada real simulada preservada; viewModel/API sem alteração |
| FR-003 | Capturas/revisão visual; CSS por tokens; inspector e lint finais |
| FR-004 | Alvos >=44px nos quatro viewports, ícones 20px/2px, tipografia Sans/Mono do DS |
| FR-005 | US2: controle, Control+B e Meta+B, preservação de tela e área liberada |
| FR-006 | US2: sete destinos recolhidos, nome com contagem, dicas por teclado e hover, Escape e portal fora da região rolável |
| FR-007 | US3: controle, Escape, clique externo e seleção de destino fecham modal |
| FR-008 | US3: foco inicial, Tab/Shift+Tab, retorno ao trigger e main; aria-current e aria-expanded |
| FR-009 | US3: transição 899/900px nos dois sentidos preserva preferência desktop e fecha mobile |
| FR-010 | Quatro viewports, contagem 1000 e altura 360px; rolagem dos links e ação de rodapé visível |
| FR-011 | US4: demoAll, ação recolhida, servidor sem demo, compartilhado com aviso e base vazia com destaque sem gradiente |
| FR-012 | CSS de movimento com tokens e preferência reduzida; suíte em reduced motion |
| FR-013 | Teste de alertas, usuário, logo, saída e atalho inativo fora do workspace; barra superior preservada |
| SC-001 | Sete destinos nos três modos, suíte aprovada |
| SC-002 | Revisão visual de sidebar expandido/recolhido/mobile e uso de tokens, registros de taste-review |
| SC-003 | Testes de teclado/foco e atalho ignorado em campo editável |
| SC-004 | 360×640, 768×1024, 1280×720 e 1440×900; sem overflow horizontal do menu |
| SC-005 | Toggle em uma ação e seleção mobile com fechamento e foco correto |
| SC-006 | Contadores derivados, zero após demoAll, base zero/1000 e fixtures de ambiente isoladas |

## Evidências visuais revisadas

- [Mobile 360×640](evidence/sidebar-360x640.png)
- [Mobile/tablet 768×1024](evidence/sidebar-768x1024.png)
- [Desktop 1280×720](evidence/sidebar-1280x720.png)
- [Desktop 1440×900](evidence/sidebar-1440x900.png)
- [Recolhido](evidence/sidebar-collapsed.png)
- Inspector no build: desktop, tablet e mobile em `evidence/taste-review/`; todas as imagens finais listadas pelo inspector foram abertas e revisadas.

## Limites e revisão do time

Testes funcionais em Chromium; Firefox, Safari, leitor de tela real e testes com usuários não executados. Não foi alterado backend, produção, dados reais nem regras de negócio. Constituição continua sem princípios ratificados. A inspeção de tipografia respeita as exceções normativas do DS e não representa aprovação de uma futura revisão do Dashboard.

Sem hooks before_implement/after_implement configurados. Os checklists de requisitos foram tratados como somente leitura. A skill design-taste-frontend foi instalada e aplicada durante esta implementação a pedido do usuário; não foi sorteada outra direção porque a referência visual já estava definida.

## Revisão de estrutura — marca no componente

Após retorno do usuário, o sidebar passou a conter SidebarHeader com Logo Tendra.ai e ocupar a altura integral. A coluna de conteúdo contém seu próprio header com o trigger adjacente à borda da navegação, alertas, usuário e saída. O modo recolhido mantém o símbolo. O mobile mantém logo e fechamento no painel, com título acessível oculto.

Validação desta revisão: `npm run build` PASS; `npm run e2e -- e2e/sidebar.spec.js --workers 3` PASS, 13/13 testes em 25.0s. O novo teste verifica logo dentro do sidebar, trigger fora dele e junto à borda do conteúdo, altura integral e símbolo recolhido. Capturas de desktop expandido, recolhido e mobile foram atualizadas e revisadas. Lint da skill novamente executado. A jornada de negócio anterior não foi repetida nesta revisão de layout; os 13 cenários de integração de navegação/foco foram repetidos. Branch permanece `001-atualizar-sidebar`, sem push/merge/deploy.

Inspector no build desta revisão: 0 FAIL e 3 WARN, mantendo as exceções já justificadas. Todas as seis imagens finais do inspector foram abertas e revisadas; nenhuma colisão ou corte no sidebar identificado.

## Acabamento final para pull request

Removida a borda vertical externa do sidebar, eliminando a linha clara na junção dos cabeçalhos. A ausência de border-right foi incluída no teste estrutural. A captura `evidence/sidebar-1440x900.png` foi atualizada e revisada com a faixa superior contínua.

Validação final: `npm run build` PASS; `npm run e2e -- --workers 3` PASS, 14/14 testes em 50.5s (13 cenários de sidebar e 1 jornada completa). `git diff --check` PASS. O relatório do inspector taste-review registra a revisão visual anterior a esta remoção de borda; as capturas PNG do sidebar refletem o acabamento final.

A branch será enviada para revisão por pull request; merge e deploy permanecem dependentes da aprovação do time. Skills e configurações locais em .agents/ e .specify/ não fazem parte da alteração proposta.
