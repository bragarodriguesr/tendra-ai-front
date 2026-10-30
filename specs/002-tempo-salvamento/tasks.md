# Tasks: Tempo relativo do último salvamento

**Input**: `specs/002-tempo-salvamento/` — spec.md, plan.md, research.md, data-model.md, contracts/tempo-salvamento.md e quickstart.md.
**Branch**: `002-tempo-salvamento`.
**Tests**: Previstos explicitamente pelos critérios SC-001 a SC-005 e pelo plano; reutilizar Playwright existente, sem novas dependências ou configuração de CI.
**Formato**: `- [ ] Txxx [P?] [USx?] ação com caminho`. [P] indica arquivos distintos e ausência de dependência entre as tarefas paralelas. Todas as 14 tarefas foram concluídas; evidências em validation.md.

## Phase 1: Setup

- [X] T001 Conferir branch, alterações locais e base remota aprovada antes de implementar; preservar os documentos locais e registrar a base em `specs/002-tempo-salvamento/validation.md`, sem incorporar commits não aprovados do sidebar nem fazer merge/deploy de produção.
- [X] T002 Conferir Node >=24 e preparar dependências existentes conforme `specs/002-tempo-salvamento/quickstart.md` (`npm ci`, `npm --prefix backend ci`, Chromium Playwright); manter `package.json` e `package-lock.json` sem novas dependências e usar API simulada, sem TENDRA_E2E_API_REAL.

## Phase 2: Foundational

- [X] T003 Confirmar os pontos de integração em `src/workspace/useWorkspace.js`, `src/workspace/viewModel.js`, `src/workspace/screens/Review.jsx`, `e2e/jornada.spec.js` e `playwright.config.js`; registrar em `specs/002-tempo-salvamento/validation.md` o fluxo utilizável de revisão demo/conectado e os endpoints a interceptar. Preservar as restrições do modelo: “Escopo: workspace atual, compartilhado, sem mapa por tarefa ou item.” e “Falha/pendência: não gerar nova referência; preservar comportamento existente.” Nenhum novo harness ou hook de produto.

**Checkpoint**: Ambiente e fluxo real identificados; nenhuma infraestrutura nova necessária. A constituição em `.specify/memory/constitution.md` contém placeholders, sem princípios ratificados verificáveis.

## Phase 3: US1 — Compreender há quanto tempo a resposta foi salva (P1, MVP)

**Goal**: Exibir a maior unidade completa em português, sem antecipar minutos/horas por arredondamento.
**Independent Test**: Os 17 exemplos da spec retornam texto exato e a revisão muda de unidade no próximo ciclo periódico, sem recarga.

### Testes antes da implementação

- [X] T004 [US1] Criar casos puros parametrizados em `e2e/tempoSalvamento.spec.js` para os 17 exemplos de `specs/002-tempo-salvamento/spec.md`, incluindo limites fracionários, singular/plural, duração futura e 24 horas; incluir ausência com 0/null/undefined e now explícito igual a zero. Usar timestamp saved positivo nos demais exemplos, saídas literais e repetição determinística; registrar a falha esperada antes de criar o helper.
- [X] T005 [US1] Acrescentar em `e2e/tempoSalvamento.spec.js` cenários de revisão com page.clock instalado antes de navegar, salvamento por ações existentes e transições de Salvo agora para minutos e horas no próximo tick; cobrir retomada simulada após salto de relógio sem somar callbacks. Aguardar sucesso assíncrono antes dos avanços longos e registrar a falha do comportamento atual, sem esperas reais de minutos/horas.

### Implementação

- [X] T006 [US1] Criar `src/workspace/tempoSalvamento.js` exportando `formatarTempoSalvamento(saved, now = Date.now())`. Aplicar as restrições: “No estado atual, 0 significa ausência; o helper aceita também null/undefined como ausência.”, “elapsedMs = max(0, now - saved)” e “N é o número de unidades completas; singular somente para N=1. Horas não mudam para dias. O label não é armazenado como novo estado.” Usar faixas <60.000ms, <3.600.000ms e horas restantes, com textos exatos da spec, sem efeitos ou dependências.
- [X] T007 [US1] Importar o helper em `src/workspace/viewModel.js` e substituir somente o cálculo de secs/savedText por formatação de s.saved com horário atual; respeitar “tick: campo existente atualizado periodicamente; só dispara rerender, não é a fonte de duração no helper.” Preservar `src/workspace/useWorkspace.js`, o intervalo de 5.000ms e o consumidor `src/workspace/screens/Review.jsx`.
- [X] T008 [US1] Executar os casos US1 de `e2e/tempoSalvamento.spec.js`, corrigir eventuais falhas do formatador/integração e registrar comandos/resultados em `specs/002-tempo-salvamento/validation.md`; comprovar SC-001/SC-002 e duração por timestamp após retomada.

**Checkpoint**: MVP local funcional e validado; publicação continua dependendo de revisão própria pelo time.

## Phase 4: US2 — Manter confiança no estado de salvamento (P1)

**Goal**: Preservar referência de sucesso, tratamento de falhas e legibilidade dos controles.
**Independent Test**: Sem referência mantém mensagem inicial; sucesso reinicia duração; pendência/falha não reiniciam; controles permanecem utilizáveis nas três larguras.

### Testes e integração com o comportamento existente

- [X] T009 [US2] Adicionar em `e2e/tempoSalvamento.spec.js` testes demo e conectados para “Salvamento automático” inicial, primeiro sucesso e novo salvamento após minutos/horas entre dois ticks; provar reinício pela nova referência e preservar debounce de 800ms e confirmação do servidor. Não expor estado interno nem alterar `src/workspace/useWorkspace.js` para facilitar o teste.
- [X] T010 [US2] Adicionar em `e2e/tempoSalvamento.spec.js` interceptação isolada do salvamento conectado: reter resposta e depois simular falha, avançando relógio e verificando continuidade da duração anterior e toast “Texto não gravado”; liberar/limpar interceptações por teste. Confirmar que navegação/reload conserva o comportamento transitório atual, sem inventar persistência por item.
- [X] T011 [US2] Validar em `e2e/tempoSalvamento.spec.js` textos em Salvo agora/minutos/horas e controles do card em 360, 768 e 1440px; verificar visibilidade e ausência de sobreposição, salvar capturas em `specs/002-tempo-salvamento/evidence/`. Preservar markup e tokens de `src/workspace/screens/Review.jsx`, sem aria-live periódico; justificar qualquer atributo neutro indispensável antes de adicioná-lo.
- [X] T012 [US2] Executar os cenários US2 de `e2e/tempoSalvamento.spec.js` e registrar em `specs/002-tempo-salvamento/validation.md` resultados de sucesso/pendência/falha e inspeção visual; se houver falha causada pela feature, corrigir apenas `src/workspace/tempoSalvamento.js` ou `src/workspace/viewModel.js`, sem redesenhar a tela ou mudar salvamento/backend. Documentar limitações preexistentes separadamente.

**Checkpoint**: SC-003/SC-004 comprovados, preservando referência compartilhada e transitória de saved.

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T013 Executar `npm run build`, `npm run e2e -- e2e/tempoSalvamento.spec.js` e `npm run e2e -- e2e/jornada.spec.js` conforme `specs/002-tempo-salvamento/quickstart.md`; registrar resultados e eventuais limitações em `specs/002-tempo-salvamento/validation.md`, sem enfraquecer asserções de `e2e/jornada.spec.js` (SC-005).
- [X] T014 Revisar diff e `git diff --check`, confirmar escopo em `src/workspace/tempoSalvamento.js`, `src/workspace/viewModel.js`, `e2e/tempoSalvamento.spec.js` e documentos desta feature; atualizar `specs/002-tempo-salvamento/tasks.md` e `specs/002-tempo-salvamento/validation.md` com evidências reais. Não incluir `.agents/`, `.specify/`, backend, outros contadores ou alterações do sidebar; não fazer merge/deploy nesta execução.

## Dependencies & Execution Order

```text
T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008 (US1)
                                                     ↓
                              T009 → T010 → T011 → T012 (US2)
                                                     ↓
                                                T013 → T014
```

US2 depende da integração US1, pois valida o indicador final; seus critérios de sucesso/falha podem ser executados isoladamente depois dessa integração. Não criar alterações artificiais no salvamento para ter tarefas de implementação em US2: a preservação desse fluxo é o resultado pretendido. Se testes de preservação já passarem antes da mudança, registrar esse baseline; apenas os testes da nova formatação devem falhar inicialmente.

## Parallel Opportunities & Examples

Não há tarefas marcadas [P]: o produto tem uma cadeia curta e a suíte usa um único arquivo, portanto edições paralelas criariam conflitos.

- **US1**: após T007, casos puros independentes e cenários de navegador de T008 podem ser executados pelos workers do Playwright, com contextos isolados; a integração em viewModel aguarda o helper.
- **US2**: após concluir T009–T011, cenários isolados por contexto podem rodar em paralelo no runner durante T012, inclusive por viewport. Não compartilhar usuários/dados mutáveis entre cenários conectados.
- Exemplo de execução de ambas as histórias após a escrita da suíte: `npm run e2e -- e2e/tempoSalvamento.spec.js --workers 2`; usar somente se os dados e interceptações estiverem isolados, conforme a infraestrutura existente.

## Implementation Strategy

1. Concluir setup e confirmação do fluxo existente, preservando branch separada.
2. Entregar US1 como MVP local: testes de contrato/transição, helper, integração mínima e validação.
3. Completar US2 com testes dos fluxos preservados e revisão nas três larguras; nenhuma mudança adicional de estado é planejada.
4. Executar build, suíte completa e jornada existente; registrar evidências e escopo final.
5. Preparar revisão do time antes de qualquer integração/publicação. Gerar estas tarefas não autoriza merge nem deploy e não cria PR automaticamente.

## Coverage

| Requisitos | Tarefas |
| --- | --- |
| FR-001/002/003/004/005/006, SC-001 | T004, T006, T008 |
| FR-007/008, SC-002 | T005, T007, T008, T009 |
| FR-009, SC-003/005 | T003, T009, T010, T012, T013 |
| FR-010, SC-004 | T011, T012 |
| FR-011 e isolamento da entrega | T001, T007, T014 |

**Resumo**: 14 tarefas; 5 US1, 4 US2 e 5 compartilhadas. Nenhuma implementação ou teste executado durante a geração deste arquivo.
