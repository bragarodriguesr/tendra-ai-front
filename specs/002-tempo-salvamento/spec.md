# Feature Specification: Tempo relativo do último salvamento na revisão

**Feature Branch**: `002-tempo-salvamento`

**Created**: 2026-10-29

**Status**: Implementada; ajuste solicitado: sem contagem de segundos

**Input**: Ajustar o contador de segundos nos cards de resposta da revisão de itens de uma tarefa para exibir minutos e horas conforme o tempo avança, preservando o design system Tendra.ai e o funcionamento do salvamento existente.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Compreender há quanto tempo a resposta foi salva (Priority: P1)

Como revisor ou aprovador, quero ler o tempo desde o último salvamento em uma unidade adequada à duração, para reconhecer rapidamente se a resposta foi salva recentemente sem converter números grandes de segundos.

**Why this priority**: O indicador atual permanece em segundos, dificultando a leitura após minutos ou horas de trabalho.

**Independent Test**: Exibir o card de resposta com tempos conhecidos desde o último salvamento e comparar o texto com a tabela de aceitação.

**Acceptance Scenarios**:

1. **Given** um salvamento reconhecido pela tela há menos de um minuto, **When** o indicador é atualizado, **Then** aparece “Salvo agora”.
2. **Given** entre um segundo e menos de um minuto decorridos, **When** o indicador é atualizado, **Then** permanece “Salvo agora”, sem contagem de segundos.
3. **Given** entre um minuto e menos de uma hora decorridos, **When** o indicador é atualizado, **Then** aparece “Salvo há 1 minuto” ou “Salvo há N minutos”, com o número de minutos completos.
4. **Given** uma hora ou mais decorridas, **When** o indicador é atualizado, **Then** aparece “Salvo há 1 hora” ou “Salvo há N horas”, com o número de horas completas.
5. **Given** o tempo avança durante a revisão, **When** a atualização periódica existente alcança um novo limite de unidade, **Then** o texto muda de Salvo agora para minutos ou de minutos para horas sem recarregar a página.

### User Story 2 - Manter confiança no estado de salvamento (Priority: P1)

Como revisor ou aprovador, quero que o indicador continue refletindo a referência de salvamento que a tela já utiliza, sem alterar quando ou como minhas respostas são salvas.

**Why this priority**: Melhorar a leitura do tempo não pode indicar um salvamento que não ocorreu nem alterar o fluxo de trabalho.

**Independent Test**: Conferir o card antes do primeiro salvamento, após um salvamento e depois de salvar novamente, tanto no comportamento local quanto no conectado ao servidor.

**Acceptance Scenarios**:

1. **Given** nenhuma referência de último salvamento disponível na tela, **When** o card é exibido, **Then** o texto permanece “Salvamento automático”.
2. **Given** o indicador mostra minutos ou horas, **When** um novo salvamento é reconhecido pelo fluxo existente, **Then** a contagem passa a usar essa nova referência e não mantém a duração anterior.
3. **Given** um novo salvamento ainda não foi confirmado ou falhou, **When** o texto é atualizado, **Then** a alteração de formatação não cria uma nova referência de sucesso nem antecipa o reinício da contagem; mensagens de erro existentes permanecem sob o fluxo atual.
4. **Given** a revisão no desktop ou mobile, **When** o texto usa qualquer uma das unidades, **Then** mantém posição, tipografia, cores e espaçamento atuais, sem cobrir ou deslocar indevidamente os controles do card.

### Edge Cases

- 59,999 segundos continuam em “Salvo agora”; não antecipar um minuto por arredondamento.
- 3.599,999 segundos continuam em minutos; não antecipar uma hora.
- Exatamente 60 segundos mudam para um minuto; exatamente 3.600 segundos mudam para uma hora, na próxima atualização existente do indicador.
- Entre uma e duas unidades completas, usar singular: 119 segundos = 1 minuto; 7.199 segundos = 1 hora.
- Durações de 24 horas ou mais continuam em horas inteiras; não introduzir dias, datas ou abreviações.
- Se a referência de salvamento estiver ligeiramente à frente do instante usado pela atualização, mostrar “Salvo agora”, sem duração negativa.
- Ao retomar a aba após um intervalo, o próximo refresh existente do indicador reflete o tempo decorrido, sem depender da quantidade de ticks realizados durante a ausência.
- A formatação não muda o comportamento atual ao navegar entre itens/tarefas ou recarregar a página; persistência e associação da referência de salvamento não fazem parte desta melhoria.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O indicador DEVE mostrar “Salvamento automático” quando a tela não possuir referência de último salvamento.
- **FR-002**: Havendo referência de salvamento, o indicador DEVE mostrar “Salvo agora” para duração inferior a um minuto; diferenças negativas ocasionais DEVEM ser tratadas como zero para exibição.
- **FR-003**: De um segundo até menos de 60 segundos, o indicador DEVE manter “Salvo agora”, sem exibir contagem de segundos.
- **FR-004**: De 60 segundos até menos de 3.600 segundos, o indicador DEVE exibir minutos completos em “Salvo há N minuto(s)”.
- **FR-005**: A partir de 3.600 segundos, o indicador DEVE exibir horas completas em “Salvo há N hora(s)”, inclusive acima de 24 horas.
- **FR-006**: O texto DEVE usar português do Brasil, singular para valor 1 e plural para valores maiores, sem casas decimais, abreviações ou unidades combinadas.
- **FR-007**: A duração DEVE ser calculada a partir da referência de salvamento já disponível, sem arredondamento para a próxima unidade e sem contagem baseada apenas no número de atualizações.
- **FR-008**: O texto DEVE se atualizar na cadência periódica já existente, sem recarga, e passar a usar a nova referência quando o fluxo atual reconhecer um novo salvamento.
- **FR-009**: A alteração DEVE preservar o funcionamento do salvamento automático, seus estados de sucesso/erro, permissões, regras de revisão/aprovação e associação atual do indicador à tela; não criar novos registros ou estados de negócio.
- **FR-010**: O indicador DEVE preservar posição e tokens de tipografia, cor e espaçamento Tendra.ai, mantendo texto legível e controles utilizáveis no desktop e mobile.
- **FR-011**: A melhoria DEVE se limitar ao indicador de último salvamento nos cards de resposta da revisão; não alterar prazos, datas de aprovação, idade das fontes, tempos de processamento ou outros contadores.

### Key Entities

- **Referência de último salvamento**: instante reconhecido pelo fluxo atual como último salvamento e já disponível à tela. Não ganha novo armazenamento ou nova associação por item nesta feature.
- **Duração decorrida**: diferença entre o instante da atualização e a referência, limitada a zero quando negativa, apresentada em uma única unidade completa.
- **Texto de salvamento**: mensagem derivada da presença da referência e da faixa de duração; não representa um evento independente de sucesso.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos exemplos da tabela de aceitação e dos limites fracionários descritos nos casos extremos exibem exatamente o texto esperado.
- **SC-002**: As transições 59s → 60s e 3.599s → 3.600s aparecem corretamente na próxima atualização periódica existente, sem recarregar a revisão.
- **SC-003**: Em todos os cenários de primeiro salvamento, novo salvamento e falha de salvamento validados, o indicador respeita a mesma referência de sucesso do comportamento atual.
- **SC-004**: Nas larguras de 360px, 768px e 1440px, os textos em Salvo agora, minutos e horas ficam legíveis, sem sobrepor os controles do card.
- **SC-005**: Os fluxos existentes de editar, salvar, marcar como revisado e aprovar permanecem funcionais em todos os cenários de regressão executados para esta alteração.

### Acceptance Table

Valores relativos à referência do último salvamento, no instante da atualização:

| Condição / duração | Texto esperado |
| --- | --- |
| Sem referência | Salvamento automático |
| -1 segundo por diferença de relógio | Salvo agora |
| 0 segundos | Salvo agora |
| 0,999 segundo | Salvo agora |
| 1 segundo | Salvo agora |
| 2 segundos | Salvo agora |
| 59 segundos | Salvo agora |
| 59,999 segundos | Salvo agora |
| 60 segundos | Salvo há 1 minuto |
| 119 segundos | Salvo há 1 minuto |
| 120 segundos | Salvo há 2 minutos |
| 3.599 segundos | Salvo há 59 minutos |
| 3.599,999 segundos | Salvo há 59 minutos |
| 3.600 segundos | Salvo há 1 hora |
| 7.199 segundos | Salvo há 1 hora |
| 7.200 segundos | Salvo há 2 horas |
| 86.400 segundos | Salvo há 24 horas |

## Assumptions

- O contador mencionado é o texto “Salvo há X segundos” no card de resposta, junto à indicação de salvamento automático, identificado no contexto anterior. Não é o tempo gasto revisando o item.
- Adota-se a proposta discutida: uma única maior unidade completa, sem decimais, com “Salvo agora” no intervalo inicial inferior a um minuto.
- A cadência atual de atualização do indicador é mantida; esta feature não exige que a tela redesenhe a cada segundo.
- Mantêm-se as referências e condições de salvamento já existentes, tanto no modo local/demo quanto no conectado ao servidor. Não haverá nova persistência, cronômetro independente por item ou mudança no backend.
- O usuário exige branch e revisão próprias antes de integrar ou publicar. A branch `002-tempo-salvamento` parte da main local; nenhuma alteração deste contador será enviada ao PR do sidebar.
- A imagem fornecida orienta a localização do card; a identidade visual normativa continua sendo o design system Tendra.ai vigente.
- A constituição local ainda contém placeholders, sem princípios ratificados verificáveis. Essa limitação deve ser registrada no planejamento, sem transformar comentários de exemplo em regras.
