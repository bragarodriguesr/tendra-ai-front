---
titulo: Modelo de dados e retenção técnica
tipo: documento
atualizado_em: 2026-09-11
versao: "1.0"
---

# Modelo de dados e retenção técnica

CENÁRIO SINTÉTICO PARA TESTES DO TENDRA.AI. Vereda Documental é uma empresa inteiramente fictícia. Este documento não representa empresa real. Todas as capacidades, condições, taxas, controles e evidências abaixo são inventados e não descrevem a empresa real. Não usar como proposta comercial, orientação financeira ou comprovação de conformidade.

Escopo: plataforma fictícia de emissão, gestão e inteligência documental; valores e condições apenas para avaliação do Tendra.ai.

## 1. Entidades principais

| Entidade | Conteúdo | Dono |
|---|---|---|
| Empresa | Dados cadastrais, plano, unidades | Cliente |
| Usuário | Nome, e-mail corporativo, perfil, unidades | Cliente |
| Pedido | Tipo documental, titular, localidade, estado, orçamento | Cliente |
| Documento | Arquivo recebido, campos extraídos, conferência | Cliente |
| Dossiê | Checklist, pendências, histórico | Cliente |
| Log de auditoria | Ações de usuários e integrações | Vereda, por obrigação de segurança |

Todas as entidades do cliente carregam o identificador da empresa, e as políticas de acesso por linha do banco impedem consultas sem esse identificador.

## 2. Onde os dados ficam

Os dados ficam no provedor fictício Nuvem Aurora, na região de São Paulo, com cópia para a região secundária no Brasil. Arquivos de documentos ficam em armazenamento de objetos criptografado; dados estruturados, no banco relacional com réplicas.

## 3. Retenção técnica

| Dado | Prazo |
|---|---|
| Arquivos temporários da extração | Apagados em até 30 dias |
| Cópias de backup | 35 dias |
| Dados operacionais após o fim do contrato | Eliminados em até 90 dias, salvo retenção documentada |

## 4. Devolução dos dados

No fim do contrato, o cliente pode pedir a exportação completa dos dossiês e documentos em até 30 dias. Depois disso, a eliminação segue o prazo de 90 dias, com certificado de eliminação enviado ao contato corporativo.
