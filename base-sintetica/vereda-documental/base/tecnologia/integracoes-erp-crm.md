---
titulo: Integrações com ERP, CRM e assinatura
tipo: documento
atualizado_em: 2026-08-21
versao: "1.1"
---

# Integrações com ERP, CRM e assinatura

CENÁRIO SINTÉTICO PARA TESTES DO TENDRA.AI. Vereda Documental é uma empresa inteiramente fictícia. Este documento não representa empresa real. Todas as capacidades, condições, taxas, controles e evidências abaixo são inventados e não descrevem a empresa real. Não usar como proposta comercial, orientação financeira ou comprovação de conformidade.

Escopo: plataforma fictícia de emissão, gestão e inteligência documental; valores e condições apenas para avaliação do Tendra.ai.

## 1. Integrações disponíveis

| Sistema | Tipo de integração | Situação no cenário |
|---|---|---|
| ERP (genérico) | Exportação de gastos por centro de custo em CSV ou pela API | Disponível |
| CRM (genérico) | Abertura de dossiê a partir de uma oportunidade, pela API | Disponível, exige desenvolvimento do cliente |
| Armazenamento em nuvem do cliente | Cópia dos documentos entregues para uma pasta do cliente | Em avaliação |
| Assinatura eletrônica | Envio de documentos do dossiê para assinatura | No roteiro de 2027 |

## 2. O que a Vereda entrega

A Vereda entrega a API, os webhooks, a documentação e um ambiente de homologação. Conectores prontos para sistemas de mercado não fazem parte do contrato padrão. Projetos de integração sob medida podem ser orçados à parte, como serviço profissional.

## 3. Exportação para o ERP

O relatório de gastos por centro de custo pode ser exportado automaticamente todo dia útil, às 6h, para um endereço SFTP do cliente. O arquivo segue o layout descrito no anexo técnico, com uma linha por solicitação concluída e os emolumentos externos separados das taxas da Vereda.

## 4. Responsabilidades

O cliente é responsável pela guarda do segredo da integração, pela conferência das assinaturas dos webhooks e pelo tratamento dos dados que copiar para os próprios sistemas. A Vereda é responsável pela disponibilidade da API conforme o anexo de níveis de serviço.

## 5. Limitações

A integração não permite aprovar orçamentos nem aceitar pendências: essas ações exigem uma pessoa no portal ou no aplicativo. Também não é possível criar usuários pela API; o cadastro de usuários segue pelo portal ou pelo SSO SAML do plano Corporativo.
