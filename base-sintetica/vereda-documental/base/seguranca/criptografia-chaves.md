---
titulo: Norma de criptografia e gestão de chaves
tipo: documento
atualizado_em: 2026-08-05
versao: "1.1"
---

# Norma de criptografia e gestão de chaves

CENÁRIO SINTÉTICO PARA TESTES DO TENDRA.AI. Vereda Documental é uma empresa inteiramente fictícia. Este documento não representa empresa real. Todas as capacidades, condições, taxas, controles e evidências abaixo são inventados e não descrevem a empresa real. Não usar como proposta comercial, orientação financeira ou comprovação de conformidade.

Escopo: plataforma fictícia de emissão, gestão e inteligência documental; valores e condições apenas para avaliação do Tendra.ai.

## 1. Em repouso

Bancos de dados, armazenamento de objetos e cópias de backup são criptografados com AES-256. As chaves ficam no serviço de gestão de chaves do provedor de nuvem, separadas por ambiente.

## 2. Em trânsito

Todo tráfego externo usa TLS 1.2 ou superior. Conexões com TLS 1.0 e 1.1 são recusadas. O tráfego interno entre serviços também é criptografado.

## 3. Rotação

| Chave | Rotação |
|---|---|
| Chaves de criptografia de dados | Anual, automática |
| Segredos de integração da API | A critério do cliente, a qualquer momento |
| Certificados TLS | Antes do vencimento, automática |

## 4. Acesso às chaves

Nenhuma pessoa tem acesso direto às chaves de criptografia de dados. Operações administrativas sobre chaves exigem aprovação de duas pessoas e ficam registradas.

## 5. Chave gerenciada pelo cliente

A opção de chave gerenciada pelo próprio cliente não está disponível. Ela foi avaliada e não entrou no roteiro de 2027.
