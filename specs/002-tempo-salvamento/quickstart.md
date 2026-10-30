# Quickstart: Validação do tempo relativo de salvamento

Guia para a implementação futura. Nesta fase não foram executados testes da feature nem alterado código de produto.

## Pré-requisitos

Node >=24, npm, dependências frontend/backend e Chromium Playwright. Na raiz do repositório:

```bash
npm ci
npm --prefix backend ci
npx playwright install chromium
```

Nenhuma dependência nova é prevista. Usar branch `002-tempo-salvamento`; manter o PR do sidebar separado.

## Comandos de validação

Após criar o módulo e a suíte previstos em plan.md:

```bash
npm run build
npm run e2e -- e2e/tempoSalvamento.spec.js
npm run e2e -- e2e/jornada.spec.js
```

O harness usa frontend 5174 e backend 3100, banco temporário e API simulada. Não habilitar TENDRA_E2E_API_REAL; não usar dados reais nem chaves de IA nesta validação.

## Cenários

1. Rodar a tabela de 17 exemplos da [spec](spec.md#acceptance-table) com saved/now explícitos. Conferir textos exatos e ausência com 0/null/undefined; 59,999s e 3.599,999s não podem antecipar unidade.
2. Instalar page.clock antes de navegar; entrar no workspace, abrir uma tarefa na revisão, editar por um controle existente e aguardar confirmação do salvamento. Avançar o relógio até minuto/hora e disparar o próximo ciclo existente, sem esperar o tempo real.
3. Depois de minutos/horas, editar e salvar novamente entre dois ticks. Conferir que o cálculo usa a nova referência e o horário real da renderização, sem carregar duração antiga.
4. Em fixture conectada, atrasar uma resposta de salvamento e depois simular falha. Conferir que o indicador não reinicia como se houvesse sucesso e que o aviso Texto não gravado continua aparecendo. Não alterar o fluxo de sucesso para facilitar o teste.
5. Em demo/local, repetir primeiro salvamento e novo salvamento; manter as diferenças existentes de confirmação entre demo e servidor.
6. Simular pausa longa/retomada da aba com avanço do relógio: próxima atualização reflete a diferença de timestamps, não a quantidade de callbacks.
7. Em 360, 768 e 1440px, conferir os textos em Salvo agora/minutos/horas, singular/plural e controles do card sem sobreposição. Manter fontes carregadas e os tokens atuais; registrar capturas quando necessário para evidência.
8. Rodar a jornada existente de edição, salvamento, revisão/aprovação e exportação. Não enfraquecer suas asserções.

## Evidências esperadas

Registrar comandos/resultados, textos verificados nas transições, estado durante falha/pendência e revisão visual nas três larguras. Não confundir uma formatação aprovada com alteração de persistência ou garantia de atualização no segundo exato. Contrato: [tempo-salvamento.md](contracts/tempo-salvamento.md).

A publicação e o merge dependem de PR próprio e aprovação do time; estes comandos só validam localmente.
