---
titulo: Ambientes de produção e homologação
tipo: documento
atualizado_em: 2026-08-12
versao: "1.0"
---

# Ambientes de produção e homologação

CENÁRIO SINTÉTICO PARA TESTES DO TENDRA.AI. Vereda Documental é uma empresa inteiramente fictícia. Este documento não representa empresa real. Todas as capacidades, condições, taxas, controles e evidências abaixo são inventados e não descrevem a empresa real. Não usar como proposta comercial, orientação financeira ou comprovação de conformidade.

Escopo: plataforma fictícia de emissão, gestão e inteligência documental; valores e condições apenas para avaliação do Tendra.ai.

## 1. Ambientes

| Ambiente | Uso | Dados |
|---|---|---|
| Produção | Operação real do cliente | Dados reais do cliente |
| Homologação | Testes de integração e de novas versões | Apenas dados sintéticos |
| Demonstração | Apresentações comerciais e treinamento | Dados sintéticos fixos |

## 2. Homologação para clientes

Clientes do plano Corporativo recebem acesso ao ambiente de homologação, com as mesmas versões que irão para produção pelo menos 10 dias antes da publicação. No ambiente de homologação, nenhum pedido é enviado a emissores reais: os emissores são simulados e devolvem documentos de exemplo.

## 3. Dados nos ambientes de teste

Dados de produção nunca são copiados para homologação ou demonstração. Testes que precisem de volume usam massas sintéticas geradas por ferramenta interna, com identificadores artificiais no padrão TIT-SINT e IMOV-SINT.

## 4. Separação

Os ambientes ficam em contas de nuvem separadas, com credenciais, chaves de criptografia e redes próprias. Pessoas da equipe de desenvolvimento não têm acesso de escrita à produção; mudanças chegam lá só pelo pipeline de publicação.

## 5. Disponibilidade da homologação

O ambiente de homologação não tem compromisso de disponibilidade. Ele pode ficar indisponível durante a preparação de uma nova versão, com aviso no portal de desenvolvedores.
