# Validação: tempo de salvamento

## Preparação

- Branch `002-tempo-salvamento`; HEAD e origin/main após fetch: `ad85711`. Nenhum commit do sidebar incorporado.
- Node v24.21.0; npm ci frontend/backend; runner Playwright existente e Chromium.
- Checklist de requisitos: 16/16 PASS, preservado sem edição. Constituição contém placeholders. Sem extensions.yml/hooks.
- Integração: viewModel.savedText → span Answer em Review.jsx. saved global/transitório; tick de 5s; debounce de 800ms.
- Testes de navegador usam fixture por contexto via interceptação `/api/**`, tarefa pronta e itens sintéticos no formato já consumido pela tela. Demo mantém seedItems com backend indisponível; conectado recebe tarefas/itens e PUT `/api/tarefas/tempo/itens/1/texto`. Jornada existente valida backend real temporário com IA simulada.
- .gitignore verificado; adicionados padrões de logs/build/env locais. Sem Docker/ESLint/Prettier/Terraform/Helm nem publicação npm aplicáveis.

## Resultados

Concluída em 2026-10-29.

- Fase vermelha: 18 casos puros falharam por módulo ainda inexistente; cenário browser chegou à edição e mostrou segundos em vez de “Salvo agora”. Comando da suíte antes de implementação: 19 falhas esperadas.
- T006/T007: helper criado e cálculo em viewModel substituído; useWorkspace e Review.jsx preservados. Relógio pausado na fixture para asserções determinísticas após entrar na tela.

- US1: 18/18 contratos passaram; cenário de transições/retomada passou em execução direcionada (7,3s). O teste foi alinhado à fase do tick: a unidade muda no próximo callback, não necessariamente no instante final de runFor.

- US2: novo salvamento demo/conectado e pendência/falha passaram (3 cenários). Testes visuais corrigidos para aceitar singular e abrir o item em 768px, pois o breakpoint atual é 900px. Nenhuma correção visual de produto necessária nesta etapa.
- Build: npm run build PASS (91 módulos).

## Validação final

- `npm run build`: PASS, 91 módulos, 4,11s.
- `npm run e2e -- e2e/tempoSalvamento.spec.js e2e/jornada.spec.js --workers 2`: **26/26 PASS**, 49,0s. Inclui 18 contratos, transições/retomada, novo sucesso demo/conectado, pendência/falha, três viewports e jornada completa existente (43,9s).
- `git diff --check`: PASS.
- Nove capturas em `evidence/`: Salvo agora/minutos/horas nas larguras 360/768/1440. Inspeção das três capturas de horas: texto legível, mesma posição/tokens, controles sem sobreposição; a quebra de linhas mobile preserva o layout existente. Asserções geométricas cobrem as nove combinações.
- SC-001: todos os exemplos e ausências/relógio zero; SC-002: transições no ciclo existente; SC-003: confirmação, reinício, pendência/falha; SC-004: três larguras; SC-005: jornada de edição/revisão/aprovação/exportação/persistência preservada.
- Testes conectados específicos usam respostas sintéticas interceptadas por contexto; a jornada usa backend temporário PGlite e IA simulada. Nenhum dado real ou API de IA paga.
- Alterações de produto: novo `src/workspace/tempoSalvamento.js` e chamada em `src/workspace/viewModel.js`. `useWorkspace.js`, `Review.jsx`, backend, salvamento/debounce, package.json e lockfiles sem alterações. `.gitignore` ganhou somente padrões locais necessários pela verificação da skill.
- Checklists de qualidade mantidos intactos; 14 tarefas marcadas concluídas. Sem arquivo de extensões antes/depois: nenhum hook a executar.

## Limites e entrega

Validação em Chromium; Firefox/Safari/dispositivos físicos não testados. O timer continua em cinco segundos, sujeito a throttling de abas inativas; o texto acompanha o timestamp no próximo render. saved permanece compartilhado/transitório, conforme escopo.

Implementação local na branch `002-tempo-salvamento`, base aprovada `ad85711`. Nenhum commit, push, PR, merge ou deploy realizado nesta execução. `.agents/` e `.specify/` continuam locais e fora do escopo da entrega.

## Ajuste após teste manual

O usuário solicitou remover a contagem visível de segundos. Até 59.999ms o texto permanece “Salvo agora”; aos 60.000ms passa a “Salvo há 1 minuto”. Spec, plano, contrato, modelo e suíte atualizados. Capturas regeneradas, sem mudanças de layout ou salvamento. Checklist original de qualidade preservado como registro da revisão anterior.

Revalidação do ajuste final: build PASS (4,00s), 26/26 testes PASS (48,9s), incluindo jornada existente (43,7s); git diff --check PASS.
