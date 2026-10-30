# Research: Tempo relativo do salvamento

**Date**: 2026-10-29

## 1. Formatação exata e unidades completas

**Decision**: Função pura específica `formatarTempoSalvamento(saved, now)` com strings PT-BR explícitas, divisão e Math.floor. Preservar timestamp em milissegundos até decidir a faixa.

**Rationale**: A spec exige texto exato e truncamento: 59,999s não pode virar um minuto. O código atual usa Math.round e só imprime segundos. Uma função isolada resolve os limites e permite testar 17 exemplos com entrada explícita.

**Alternatives considered**: Manter regras inline no viewModel (menos testabilidade dos limites); Intl.RelativeTimeFormat (não garante o contrato literal “Salvo há ...”); biblioteca de datas (dependência desnecessária).

Evidência: `src/workspace/viewModel.js`, cálculo de secs/savedText; tabela da spec.

## 2. Relógio e cadência

**Decision**: Calcular com Date.now no momento de buildView; manter tick e o intervalo existente de 5.000ms apenas para provocar rerender.

**Rationale**: O tick pode ser anterior a saved porque o salvamento ocorre entre ticks. Usá-lo como relógio gera diferenças negativas temporárias e texto desatualizado. A contagem precisa refletir tempo real, inclusive após ausência da aba; não é contagem de callbacks. Diferença negativa ocasional continua limitada a zero.

**Alternatives considered**: Novo timer de 1s (fora do requisito e mais renders); incrementar contador (deriva em abas suspensas); recalcular estado saved/tick juntos (altera fluxo desnecessariamente).

Evidência: `useWorkspace.js`, effect de intervalo e atribuições de saved em flushSaves/onDraft.

## 3. Estado e confirmação do salvamento

**Decision**: Preservar saved como referência transitória compartilhada do workspace e manter useWorkspace inalterado.

**Rationale**: No fluxo conectado, flushSaves só atribui saved após sucesso; falhas geram “Texto não gravado”. No demo, onDraft atribui saved imediatamente. A melhoria é apenas exibição; não deve criar referência por item nem persistir no reload.

**Alternatives considered**: Salvar timestamp por item, mudar backend ou redefinir sucesso de auto-save (outras features).

Evidência: `useWorkspace.js`, initialState, flushSaves e onDraft; `Review.jsx`, Answer consumindo v.savedText.

## 4. Testes sem nova infraestrutura

**Decision**: Usar o Playwright existente em `e2e/tempoSalvamento.spec.js`: testes parametrizados puros sem page fixture para o helper e testes do browser com page.clock para transições, novo salvamento e erro. Rodar também a jornada existente.

**Rationale**: O runner já tem CI configurado e suporta testes síncronos da função. Um runner Node nativo seria possível, mas exigiria outro comando/ligação ao CI sem ganho para esta pequena feature. Instalar o relógio antes de navegar evita inconsistência entre timers nativos e simulados. Avanços longos devem usar fastForward ou controle equivalente, aguardando operações assíncronas de salvamento antes das asserções.

**Alternatives considered**: Esperar minutos/horas reais (lento e instável); simular via estado exposto em produção (acoplamento indevido); introduzir Vitest/Jest ou outro runner (desnecessário).

Fontes: [Playwright Clock](https://playwright.dev/docs/clock), [Node test runner](https://nodejs.org/docs/latest-v24.x/api/test.html). O runner nativo foi considerado e descartado para reutilizar o pipeline atual.

## 5. Aparência e escopo

**Decision**: Manter markup/CSS/tokens do card Answer. Validar texto e quebra de linha em 360/768/1440px, sem escolher nova direção visual ou aplicar redesenho.

**Rationale**: O indicador já usa tipografia mono e layout com flex-wrap. O pedido altera unidades, não hierarquia visual nem funcionamento da revisão.

**Alternatives considered**: Cronômetro destacado, unidades abreviadas, texto composto (“1h 2min”), tooltip ou novo componente DS (não solicitado).

## Resultado

Sem esclarecimentos técnicos pendentes. Constituição sem ratificação registrada em plan.md; nenhuma implementação executada nesta fase.

## Ajuste de requisito após teste manual

Por solicitação do usuário, todo o primeiro minuto exibe “Salvo agora”. A partir de 60 segundos são exibidos minutos completos e, a partir de uma hora, horas completas. Não há contagem visível de segundos.
