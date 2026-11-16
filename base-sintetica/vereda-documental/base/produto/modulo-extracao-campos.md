---
titulo: Campos extraídos por tipo documental
tipo: documento
atualizado_em: 2026-10-02
versao: "1.2"
---

# Campos extraídos por tipo documental

CENÁRIO SINTÉTICO PARA TESTES DO TENDRA.AI. Vereda Documental é uma empresa inteiramente fictícia. Este documento não representa empresa real. Todas as capacidades, condições, taxas, controles e evidências abaixo são inventados e não descrevem a empresa real. Não usar como proposta comercial, orientação financeira ou comprovação de conformidade.

Escopo: plataforma fictícia de emissão, gestão e inteligência documental; valores e condições apenas para avaliação do Tendra.ai.

## 1. Como ler esta tabela

A extração assistida lê os documentos recebidos e preenche campos. Cada campo traz a página e o trecho de origem. Quando o documento não traz o dado, o campo fica vazio. A extração não completa informação por dedução.

## 2. Campos por tipo documental

| Tipo documental | Campos extraídos |
|---|---|
| Certidão de débitos fiscais | Emissor, titular, data de emissão, validade, resultado (com ou sem apontamento) |
| Certidão trabalhista | Emissor, titular, data de emissão, validade, processos mencionados |
| Certidão de distribuição judicial | Comarca, titular, período pesquisado, ações listadas |
| Matrícula de imóvel | Número da matrícula, cartório, descrição do imóvel, proprietários, ônus e averbações |
| Contrato social e alterações | Razão social, capital, sócios, administradores, poderes de representação |
| Cédula de produto rural | Emitente, credor, produto, safra, quantidade, garantias mencionadas |

## 3. Classificação do resultado

As certidões recebem uma de quatro classes: sem apontamento, com apontamento, inconclusivo e ilegível. Um documento ilegível nunca é tratado como sem apontamento.

## 4. Confiança e revisão

Cada campo tem um indicador de confiança (alta, média ou baixa). Campos com confiança baixa aparecem primeiro na fila de conferência do analista. O analista confirma ou corrige o campo e registra o motivo da correção.

## 5. Idiomas e formatos

A extração funciona com documentos em português. Documentos em inglês e espanhol são aceitos para leitura e busca, mas sem extração de campos estruturados. Formatos aceitos: PDF pesquisável, PDF digitalizado e imagens PNG ou JPEG, até 50 MB e 200 páginas por arquivo.
