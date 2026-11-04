# Pipeline de IA do MVP · Tendra.ai

*Proposta de 21/10/2026; quadro 1 revisto em 22/10/2026 (carga pela tela). Status: `draft`. Complementa a seção 20 do `PRD_Front-end_Tendra.ai_MVP_v3.md`, `docs/mvp-resposta-rfp/` e `docs/referencia/mvp-proposta-1/`.*

Versão editável do diagrama, no board do projeto: [Miro](https://miro.com/app/board/uXjVHg0R4nQ=/?moveToWidget=3458764688008238401).

O pipeline cobre a jornada completa: da base de conhecimento e da planilha de RFP até a planilha de respostas aprovadas por pessoas.

## Decisões que definem o desenho

- **Fluxo fixo em código, sem agente.** O backend executa as etapas em ordem e chama o Claude só onde há linguagem natural a tratar.
- **Entrada da RFP: somente `.xlsx`.**
- **Base de conhecimento: arquivos `.md` enviados pela tela Base de conhecimento** ("Subir documentos", com o seletor de arquivos do computador), direto no banco. O comando `carregar-base` faz a mesma carga a partir de uma pasta. Outros formatos ficam fora do MVP.
- **Sem busca vetorial.** A base inteira vai ao Claude, que encontra e cita os trechos. A recuperação fica atrás de um módulo próprio (`buscarFontes`), trocável depois.
- **A IA sugere, a pessoa decide.** Nada é aprovado nem exportado pela IA.
- **Limites de qualidade:** relevância 80% e fidelidade 90%.

## Legenda

| Cor | Significado |
|---|---|
| Verde | Pessoa decide ou age |
| Azul | Sistema: regras em código, sem IA |
| Roxo | IA (Claude via API) |
| Cinza | Dados guardados |
| Linha tracejada | Exceção ou falha |

## 1. Preparar a base de conhecimento

Acontece antes das RFPs e a cada novo documento. Nenhuma chamada de IA. O formato do cabeçalho está em [`FORMATO_BASE_MD.md`](FORMATO_BASE_MD.md).

```mermaid
flowchart LR
    A1["1 · Escrever os documentos em .md<br/>Pessoa · equipe<br/>Cabeçalho: titulo, tipo, atualizado_em, versao"]:::pessoa
    A2["2 · Subir os .md pela tela da Base<br/>Pessoa · seletor de arquivos do computador<br/>Ou o comando carregar-base, com uma pasta"]:::pessoa
    A3["3 · Validar e dividir em blocos<br/>Sistema · sem IA<br/>Confere o cabeçalho; mesmo nome substitui<br/>Localização: arquivo, seção, linha"]:::sistema
    A4[("4 · Gravar no banco<br/>Blocos, data, versão, tipo, tokens")]:::dados
    A5["5 · Conferir na tela da Base<br/>Pessoa · resultado do envio e lista<br/>Idade em dias, selo de 120 dias, ativar/desativar"]:::pessoa
    X1["Arquivo inválido ou outro formato<br/>Recusado ou ignorado, com o motivo na tela<br/>Conversão de outros formatos: fora do MVP"]:::excecao
    X2["Índice de busca: fora do MVP<br/>Sem embeddings; a base inteira vai ao Claude<br/>Módulo de busca trocável depois"]:::excecao

    A1 --> A2 --> A3 --> A4 --> A5
    A3 -.-> X1
    A4 -.-> X2

    classDef pessoa fill:#adf0c7,stroke:#2dc75c,color:#1a1a1a
    classDef sistema fill:#c6dcff,stroke:#659df2,color:#1a1a1a
    classDef ia fill:#dedaff,stroke:#8f7fee,color:#1a1a1a
    classDef dados fill:#f7f7f7,stroke:#b0b0b0,color:#1a1a1a
    classDef excecao fill:#ffffff,stroke:#b0b0b0,color:#1a1a1a
```

## 2. Entender a RFP

Do arquivo enviado à lista de perguntas confirmada. A IA só entra se a regra falhar.

```mermaid
flowchart LR
    R1["1 · Nova RFP<br/>Pessoa · tela Nova RFP<br/>Planilha .xlsx, nome, empresa, tipo, prazo, responsável"]:::pessoa
    R2["2 · Validar e criar tarefa<br/>Sistema<br/>Formato real, tamanho, obrigatórios, prazo"]:::sistema
    R3["3 · Ler a planilha<br/>Sistema · sem IA<br/>Células exatas e número da linha"]:::sistema
    R4["4 · Achar as perguntas por regra<br/>Sistema · sem IA<br/>Coluna com cabeçalho Pergunta"]:::sistema
    R4B["4b · Plano B com IA pequena<br/>IA · saída estruturada<br/>Só se a coluna não for achada"]:::ia
    R5["5 · Confirmar a lista<br/>Pessoa<br/>Identificamos N perguntas"]:::pessoa
    X1["Proteção de dados<br/>CNPJ e contatos nunca vão para a IA<br/>Só o texto das perguntas sai"]:::excecao

    R1 --> R2 --> R3 --> R4 --> R5
    R4 -->|regra falhou| R4B --> R5
    R2 -.-> X1

    classDef pessoa fill:#adf0c7,stroke:#2dc75c,color:#1a1a1a
    classDef sistema fill:#c6dcff,stroke:#659df2,color:#1a1a1a
    classDef ia fill:#dedaff,stroke:#8f7fee,color:#1a1a1a
    classDef dados fill:#f7f7f7,stroke:#b0b0b0,color:#1a1a1a
    classDef excecao fill:#ffffff,stroke:#b0b0b0,color:#1a1a1a
```

## 3. Gerar respostas com fonte

O núcleo do produto. No máximo duas chamadas de IA por lote, mais uma chamada leve por tarefa para a área das perguntas (fase N, 04/11/2026).

```mermaid
flowchart LR
    G1["1 · Montar o contexto<br/>Sistema<br/>Só documentos ativos e prontos<br/>Base vazia: tudo Sem rascunho, sem IA"]:::sistema
    G1B["1b · Classificar por área<br/>IA leve · Haiku 5.5, saída estruturada<br/>Só o texto das perguntas<br/>Falha ou área fora da lista: Geral"]:::ia
    G2["2 · Redigir por lote<br/>IA 1 · Claude com citações<br/>Cerca de 10 perguntas, base em cache<br/>Documento é dado, nunca instrução"]:::ia
    G3["3 · Conferir as citações<br/>Sistema · sem IA<br/>Trecho existe no documento? Senão, descarta"]:::sistema
    G4["4 · Calcular os alertas<br/>Sistema · regras<br/>Sem contexto, baixa confiança,<br/>fonte antiga, termo crítico"]:::sistema
    G4B["4b · Detectar conflito<br/>IA 2 · leve, saída estruturada<br/>Só os trechos citados no item"]:::ia
    G5[("5 · Gravar os itens<br/>Sugerida ou Sem rascunho,<br/>parágrafos, fontes, alertas")]:::dados
    F["Falha do provedor de IA<br/>Nova tentativa; depois tarefa em Falha<br/>Tentar de novo só nos lotes pendentes"]:::excecao

    G1 --> G1B --> G2 --> G3 --> G4 --> G5
    G4 --> G4B --> G5
    G2 -.-> F

    classDef pessoa fill:#adf0c7,stroke:#2dc75c,color:#1a1a1a
    classDef sistema fill:#c6dcff,stroke:#659df2,color:#1a1a1a
    classDef ia fill:#dedaff,stroke:#8f7fee,color:#1a1a1a
    classDef dados fill:#f7f7f7,stroke:#b0b0b0,color:#1a1a1a
    classDef excecao fill:#ffffff,stroke:#b0b0b0,color:#1a1a1a
```

## 4. Revisar, aprovar e exportar

A pessoa decide. Nenhum item é aprovado ou exportado pela IA.

```mermaid
flowchart LR
    H1["1 · Revisar item a item<br/>Pessoa · tela de Revisão<br/>Abre a fonte no trecho exato, edita, avalia"]:::pessoa
    H2["2 · Tratar os alertas<br/>Pessoa<br/>Reconhece um a um; não existe reconhecer todos<br/>Resposta manual não vira alerta"]:::pessoa
    H3["3 · Revisar e aprovar<br/>Pessoa · dois papéis<br/>Só o Aprovador aprova; o Revisor nem vê o botão"]:::pessoa
    H4["4 · Baixar a planilha<br/>Sistema · sem IA<br/>Aprovador a qualquer momento, com aviso;<br/>Revisor só com 100% aprovado e sem alerta pendente"]:::sistema
    H7["Revisar com IA (resposta manual)<br/>IA 3 · Claude Haiku 5.5<br/>A partir de 30 palavras; só redação,<br/>nada acrescentado; a pessoa confere e pode desfazer"]:::ia
    RES(["Resultado final<br/>Planilha com respostas aprovadas<br/>e fonte rastreável"]):::final
    H5[("Registro de eventos<br/>Quem editou, reconheceu, revisou,<br/>aprovou e exportou, e quando")]:::dados
    H6["Editar depois de aprovar<br/>Pede confirmação, remove a aprovação<br/>e bloqueia a exportação de novo"]:::excecao

    H1 --> H2 --> H3 --> H4 --> RES
    H1 --> H5
    H2 --> H5
    H3 --> H5
    H4 -.-> H6
    H1 -.-> H7

    classDef pessoa fill:#adf0c7,stroke:#2dc75c,color:#1a1a1a
    classDef sistema fill:#c6dcff,stroke:#659df2,color:#1a1a1a
    classDef ia fill:#dedaff,stroke:#8f7fee,color:#1a1a1a
    classDef dados fill:#f7f7f7,stroke:#b0b0b0,color:#1a1a1a
    classDef excecao fill:#ffffff,stroke:#b0b0b0,color:#1a1a1a
    classDef final fill:#2dc75c,stroke:#067429,color:#1a1a1a
```

## 5. Medir e proteger a qualidade

Roda fora do caminho do usuário. Decide se uma mudança de prompt, modelo ou parâmetro pode entrar.

```mermaid
flowchart LR
    E1[("1 · Gabarito sintético<br/>Cerca de 30 perguntas com resposta<br/>e fonte esperadas, mais casos de borda")]:::dados
    E2["2 · Rodar o pipeline<br/>Sistema<br/>Quadros 2 e 3, por linha de comando"]:::sistema
    E3["3 · Calcular os critérios<br/>Sistema"]:::sistema
    E4["4 · Liberar ou bloquear<br/>Sistema<br/>Mudança abaixo dos limites não entra"]:::sistema
    E5[("Métricas do piloto<br/>Texto mantido, fontes aceitas,<br/>polegar positivo, tempo de ciclo")]:::dados

    E1 --> E2 --> E3 --> E4

    classDef sistema fill:#c6dcff,stroke:#659df2,color:#1a1a1a
    classDef dados fill:#f7f7f7,stroke:#b0b0b0,color:#1a1a1a
```

As métricas do piloto vêm do registro de eventos do quadro 4 e não dependem do comando de avaliação.

### Critérios e limites

| Critério | Limite |
|---|---|
| Validade das fontes (citação confere literalmente com o documento) | 100% |
| Texto apresentado sempre com ao menos uma fonte válida | 100% |
| Relevância da recuperação | **80%** |
| Pergunta sem resposta no gabarito fica sem rascunho | 100% |
| Conflito embutido na base marcado com o alerta de conflito | 100% |
| Citações de documentos fora da base autorizada | Nenhuma |
| Instrução maliciosa e pedido de compromisso não sustentado tratados corretamente | 3 de 3 execuções |
| Fidelidade do conteúdo | **90%** |

## Decisões em aberto

- Método de medir a fidelidade: revisão humana de uma amostra ou avaliador automático com modelo. Proposta: começar pela revisão humana da amostra do gabarito.
- Modelo da redação (Sonnet 5.5 ou Opus 5.5) e tamanho do lote: decididos pela avaliação contra o gabarito.
- ~~Interface da carga~~: decidida na etapa A4 e revista em 22/10/2026. A carga é pela tela Base de conhecimento ("Subir documentos"), e o comando `npm run carregar-base -- <pasta> [--enviado-por <nome>]` continua como alternativa. O formato dos arquivos `.md` está em `docs/mvp-resposta-rfp/product/FORMATO_BASE_MD.md`.
- A segunda chamada de IA (conflito) existe porque a API não combina citações com saída estruturada na mesma chamada; o teste prático da primeira etapa pode eliminá-la.
