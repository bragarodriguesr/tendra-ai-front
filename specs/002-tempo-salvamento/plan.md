# Implementation Plan: Tempo relativo do último salvamento

**Branch**: `002-tempo-salvamento` | **Date**: 2026-10-29 | **Spec**: [spec.md](spec.md)

**Input**: `specs/002-tempo-salvamento/spec.md`

## Summary

Substituir a montagem de savedText em viewModel por uma função pura de formatação em `src/workspace/tempoSalvamento.js`. Receber saved e o instante atual, produzir uma única unidade completa (minuto/hora), respeitar singular/plural e mostrar Salvo agora abaixo de um minuto. Manter Salvamento automático sem referência. Preservar o salvamento e o componente visual; o intervalo atual de cinco segundos continua provocando renderizações, mas não será usado como relógio para calcular a duração.

## Technical Context

**Language/Version**: JavaScript ESM, React/ReactDOM ^18.3.1, Vite ^6.0.0. Node >=24 para o harness existente com backend.

**Primary Dependencies**: Nenhuma nova. Usar aritmética de timestamps e strings explícitas PT-BR; Playwright 1.56.1 existente para testes puros e integração.

**Storage**: Estado transitório existente `saved` (timestamp local de sucesso; 0 sem referência) e `tick` (gatilho periódico de renderização). Sem banco, persistência adicional ou cronômetro por item.

**Testing**: `e2e/tempoSalvamento.spec.js` com tabela de 17 exemplos da spec, testes puros da função e cenários de navegador com relógio controlado. Build e jornada existente como regressão. O workflow Front já executa npm run e2e, incluindo novos arquivos; não adicionar scripts ou dependências de teste.

**Target Platform**: Navegador desktop/mobile do workspace; verificar larguras 360, 768 e 1440px.

**Project Type**: Aplicação web existente; mudança de apresentação derivada do estado.

**Performance Goals**: Formatação O(1), sem rede, sem timer adicional; atualização no ciclo de renderização existente (intervalo nominal de 5.000ms, sujeito ao throttling do navegador).

**Constraints**: Preservar debounce de 800ms e confirmação de sucesso do salvamento conectado; preservar posição/tokens de Review.jsx, permissões e fluxos de revisão/aprovação. Não alterar outros contadores ou a branch/PR do sidebar.

**Scale/Scope**: Um texto no card de resposta, um formatador, uma integração em viewModel e uma suíte de testes no runner existente.

## Constitution Check

*Antes da pesquisa e após o design.*

`.specify/memory/constitution.md` contém somente placeholders. Não há princípio ratificado aplicável nem gate constitucional verificável; exemplos comentados não são regras. Limitação registrada, sem presumir aprovação constitucional.

Gates da spec: sem alteração no salvamento/backend; sem dependência nova; unidades completas PT-BR; DS/layout preservados; feature e branch separadas do sidebar. Pré-pesquisa: PASS por escopo. Pós-design: PASS pelo contrato e pelos pontos de integração definidos. A comprovação em execução ocorrerá na implementação.

## Project Structure

### Documentation (this feature)

```text
specs/002-tempo-salvamento/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── contracts/tempo-salvamento.md
├── quickstart.md
└── checklists/requirements.md
```

`tasks.md` será produzido por speckit-tasks; não pertence à fase de planejamento.

### Source Code (repository root)

```text
src/workspace/
├── tempoSalvamento.js       # novo formatador puro
├── viewModel.js             # substituir somente cálculo de savedText
├── useWorkspace.js          # referência: saved/tick/flushSaves/onDraft preservados
└── screens/Review.jsx      # consumidor visual existente, sem mudança planejada
 e2e/
├── tempoSalvamento.spec.js  # casos puros e navegador, no runner existente
└── jornada.spec.js          # regressão existente preservada
```

**Structure Decision**: Um helper específico do workspace evita espalhar pluralização e conversão no viewModel e permite testar todos os limites sem aguardar o tempo real. Não criar hook, serviço, contexto, API ou biblioteca genérica de datas.

## Phase 0 — Research

[research.md](research.md) resolve: escolha de formatação, tempo atual versus tick, referência compartilhada de saved, preservação do fluxo de sucesso e testes determinísticos. Nenhuma dúvida técnica pendente. Pesquisa do código local revisada por agente de pesquisa conforme a skill.

## Phase 1 — Design and Contracts

- Exportar `formatarTempoSalvamento(saved, now = Date.now())` do módulo novo. Zero/null/undefined significam ausência de referência; timestamps positivos são os instantes internos já fornecidos pelo estado. `now` explícito permite testar sem modificar relógio global.
- Calcular duração em milissegundos com limite inferior zero; escolher faixa a partir da duração real e usar Math.floor para unidades completas. Salvo agora <60s, minutos <3.600s, horas a partir desse limite. Sem Intl.RelativeTimeFormat, para garantir o texto exato da spec e evitar regras automáticas de arredondamento/unidades.
- Trocar somente as duas linhas de cálculo de secs/savedText por chamada do helper no viewModel. Ler Date.now a cada buildView, em vez de passar s.tick: tick permanece somente como causa de rerender. Isso mantém a precisão ao salvar entre ticks e evita duração inicial presa em zero pelo relógio antigo.
- Não mudar useWorkspace.js: saved continua sendo atualizado após confirmação no fluxo conectado e imediatamente no fluxo demo; falha continua usando o toast existente sem reiniciar saved. O valor é compartilhado no workspace, não por item; esta feature não promete alterar isso.
- Não mudar Review.jsx nem adicionar aria-live para um texto periódico. Caso os testes precisem de seletor, priorizar texto e região do card; qualquer atributo neutro estritamente necessário deve ser justificado em tasks.md.
- Testar primeiro os 17 exemplos, incluindo valores fracionários e referência futura. No navegador controlar tempo antes da inicialização da aplicação, entrar na revisão por ações existentes e avançar tempo sem esperar uma hora real. Confirmar debounce/sucesso antes de avançar para os casos de longa duração.
- Testar novo salvamento entre ticks, salvamento pendente e falho por interceptação isolada de API, mantendo saved anterior e toast atual. Comparar também o modo local/demo; sem hooks de teste expostos no produto.
- Verificar 360/768/1440px com os três tipos de texto e controles do card. Preservar tokens existentes e flex-wrap; não reformular o layout.

Entidades/transições: [data-model.md](data-model.md). Interface: [contracts/tempo-salvamento.md](contracts/tempo-salvamento.md). Validação: [quickstart.md](quickstart.md).

## Complexity Tracking

Sem violação constitucional identificável. A única extração é uma função com regra de negócio de apresentação e testes de limites; nenhuma biblioteca, configuração de CI ou novo estado será introduzido.

## Risks and Limits

- O timer de 5s não garante transição visível no segundo exato; exibir a nova unidade no próximo render é o contrato.
- Browsers podem atrasar timers em abas inativas; usar timestamp real no retorno corrige a duração no próximo render, sem prometer atualização imediata por evento de foco.
- saved continua compartilhado e transitório; mudar sua associação/persistência exigiria outra feature.
- A branch foi criada da main local anterior ao PR do sidebar. Antes de implementar, conferir o estado remoto e incorporar apenas a base aprovada, sem transportar commits não aprovados do sidebar nem publicar por inferência.
- Planejamento concluído; código, dependências e testes da feature ainda não foram alterados/executados.
