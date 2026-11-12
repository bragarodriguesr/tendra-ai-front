---
titulo: Ciclo de desenvolvimento seguro
tipo: documento
atualizado_em: 2026-09-03
versao: "1.4"
---

# Ciclo de desenvolvimento seguro

CENÁRIO SINTÉTICO PARA TESTES DO TENDRA.AI. Vereda Documental é uma empresa inteiramente fictícia. Este documento não representa empresa real. Todas as capacidades, condições, taxas, controles e evidências abaixo são inventados e não descrevem a empresa real. Não usar como proposta comercial, orientação financeira ou comprovação de conformidade.

Escopo: plataforma fictícia de emissão, gestão e inteligência documental; valores e condições apenas para avaliação do Tendra.ai.

## 1. Etapas

1. **Desenho:** mudanças relevantes passam por análise de ameaças antes do desenvolvimento.
2. **Código:** toda mudança é revisada por outra pessoa antes de entrar na linha principal.
3. **Testes automáticos:** testes unitários, de integração e de isolamento entre empresas rodam em cada mudança.
4. **Análise de segurança:** análise estática de código e verificação de dependências com vulnerabilidades conhecidas rodam no pipeline.
5. **Publicação:** só mudanças com todos os testes verdes e aprovação registrada chegam à produção, sempre com plano de reversão.

## 2. Testes de isolamento

Os testes de isolamento tentam acessar dados de uma empresa a partir do usuário de outra, por todos os recursos da API e do portal. Um único teste falho bloqueia a publicação.

## 3. Dependências

Dependências com vulnerabilidade crítica conhecida bloqueiam a publicação. Vulnerabilidades altas em dependências devem ser corrigidas em até 30 dias, seguindo o prazo da gestão de vulnerabilidades.

## 4. Segredos

Segredos nunca ficam no código. Uma verificação automática procura chaves e senhas em cada mudança e bloqueia a publicação se encontrar alguma.

## 5. Treinamento

Pessoas desenvolvedoras fazem um treinamento anual de desenvolvimento seguro, com foco nas falhas mais comuns em aplicações web e APIs.
