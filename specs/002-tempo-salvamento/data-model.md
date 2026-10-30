# Data Model: Tempo relativo do salvamento

Não existem novas entidades persistidas; o modelo descreve valores de apresentação existentes e derivados.

## SaveReference

- `saved`: timestamp numérico em milissegundos, positivo quando o fluxo existente reconheceu um salvamento. No estado atual, 0 significa ausência; o helper aceita também null/undefined como ausência.
- Escopo: workspace atual, compartilhado, sem mapa por tarefa ou item.
- Inicialização/reinício de sessão: segue o estado atual; não persistir entre reloads.
- Origem: confirmação de sucesso em flushSaves (servidor) ou edição local em onDraft (demo).
- Falha/pendência: não gerar nova referência; preservar comportamento existente.

## CurrentInstant

- `now`: timestamp numérico em milissegundos obtido em cada formatação; parâmetro explícito nos testes.
- `tick`: campo existente atualizado periodicamente; só dispara rerender, não é a fonte de duração no helper.

## ElapsedDuration

- `elapsedMs = max(0, now - saved)` quando há referência.
- Não arredondar para cima nem somar ticks.
- Não processar strings de datas ou valores externos: entradas são timestamps internos, sem nova superfície de confiança.

## SaveLabel (derivado)

| Estado | Condição | Texto |
| --- | --- | --- |
| Sem referência | saved ausente/0 | Salvamento automático |
| Recente | elapsedMs < 60.000 | Salvo agora |
| Minutos | 60.000 <= elapsedMs < 3.600.000 | Salvo há N minuto(s) |
| Horas | elapsedMs >= 3.600.000 | Salvo há N hora(s) |

N é o número de unidades completas; singular somente para N=1. Horas não mudam para dias. O label não é armazenado como novo estado.

## State transitions

1. Sem salvamento: manter mensagem inicial.
2. Sucesso reconhecido: saved recebe o timestamp pelo fluxo atual; próximo render mostra duração a partir dessa referência.
3. Tempo avança: rerender existente recalcula duração e unidade, sem mutar saved.
4. Novo sucesso: substituir referência anterior conforme fluxo atual e reiniciar texto.
5. Erro/pendência: referência anterior permanece; toast/estado atual de erro é preservado.
6. Navegação/reload: comportamento atual de escopo e reinicialização continua; nenhuma nova persistência ou associação por item.
