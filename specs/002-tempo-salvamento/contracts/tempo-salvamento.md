# Contract: Indicador de último salvamento

## Interface de apresentação

Módulo: `src/workspace/tempoSalvamento.js`.
Export: `formatarTempoSalvamento(saved, now = Date.now())`.
Retorno: string em português do Brasil.

- saved: timestamp positivo de salvamento interno; 0, null e undefined significam ausência.
- now: timestamp atual interno; explicitável para testes determinísticos.
- Nenhum acesso a estado React, timers, rede, armazenamento ou mutação de argumentos dentro do formatador.
- Sem referência: retornar Salvamento automático.
- Com referência: limitar duração negativa a zero e usar a maior unidade completa nos limiares 60s/3.600s.
- Sem decimais, abreviações, unidades compostas ou dias; singular para valor 1, plural para valores superiores.

Tabela normativa: [17 exemplos na spec](../spec.md#acceptance-table). Modelo e transições: [data-model.md](../data-model.md).

## Integração

`buildView` em `src/workspace/viewModel.js` continua expondo `savedText`. Trocar somente seu cálculo por chamada do formatador com s.saved e horário atual. Não usar s.tick como now; tick mantém sua função de rerender a cada cinco segundos.

`Answer` em `src/workspace/screens/Review.jsx` continua exibindo v.savedText no mesmo span e com os mesmos tokens/posicionamento. Não anunciar o contador continuamente via aria-live nem mudar permissões e controles.

`flushSaves` e `onDraft` em `useWorkspace.js` preservam seus gatilhos e confirmação de sucesso. Nenhuma mudança de endpoint, payload, debounce, persistência ou contrato backend.

## Observable behavior

- No browser, mudança de unidade ocorre na próxima atualização já existente da tela, sem reload.
- Ao confirmar novo salvamento, texto volta à duração recente correspondente, inclusive quando o tick anterior é mais antigo que saved.
- Falha ou pendência não produz nova mensagem de sucesso.
- Desktop/mobile mantêm o indicador legível e controles acessíveis, respeitando DS e flex-wrap atual.

## Verification

Casos puros: todos os 17 exemplos, ausência com 0/null/undefined, zero no relógio explícito, imutabilidade de entradas escalares e repetição determinística com os mesmos argumentos. Evitar testes que apenas reproduzam Math.floor sem conferir texto final.

Casos browser: minuto/hora, novo salvamento entre ticks, referência anterior durante pendência/falha, modo local/demo e servidor, aba retomada simulada e larguras 360/768/1440px. Usar eventos/respostas de salvamento como sincronização, sem sleeps de minutos ou horas reais e sem alterar o produto para injetar estado.
