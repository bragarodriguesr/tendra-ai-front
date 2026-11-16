---
titulo: Manual do administrador do portal
tipo: documento
atualizado_em: 2026-09-22
versao: "2.0"
---

# Manual do administrador do portal

CENÁRIO SINTÉTICO PARA TESTES DO TENDRA.AI. Vereda Documental é uma empresa inteiramente fictícia. Este documento não representa empresa real. Todas as capacidades, condições, taxas, controles e evidências abaixo são inventados e não descrevem a empresa real. Não usar como proposta comercial, orientação financeira ou comprovação de conformidade.

Escopo: plataforma fictícia de emissão, gestão e inteligência documental; valores e condições apenas para avaliação do Tendra.ai.

## 1. Responsabilidades

O administrador da empresa cliente cria e desativa usuários, define unidades e centros de custo, configura limites de aprovação e modelos de checklist e acompanha o relatório mensal de acessos. O termo do administrador prevê a revogação imediata do acesso de quem sai da empresa e a revisão trimestral das permissões.

## 2. Usuários

1. Em "Administração", abra "Usuários" e use "Convidar usuário".
2. Informe nome, e-mail corporativo, perfil e unidades.
3. O convite vale por 7 dias. Convites vencidos podem ser reenviados.
4. Para desativar, abra o usuário e use "Desativar". O histórico de ações do usuário é preservado.

Com SSO, a criação de usuários pode ser automática no primeiro login, com o perfil padrão definido pelo administrador.

## 3. Limites de aprovação

O limite padrão de despesa sem aprovação adicional é de R$ 500 por pedido. O administrador pode alterar o limite por unidade e por centro de custo. A regra de que quem abre o pedido não aprova o próprio orçamento não pode ser desligada.

## 4. Unidades e centros de custo

Unidades organizam o acesso dos usuários; centros de custo organizam os gastos. Um centro de custo pode ser usado por mais de uma unidade. Centros de custo inativos não aparecem para novos pedidos, mas continuam nos relatórios.

## 5. Integrações

O administrador cria as credenciais da API, cadastra os endereços de webhook e rotaciona os segredos. Cada credencial tem escopos próprios e pode ser revogada a qualquer momento.

## 6. Auditoria

O log de auditoria da empresa mostra logins, alterações de perfil, exportações, downloads e aprovações. Ele pode ser filtrado por usuário, ação e período e exportado em CSV. O acesso ao log é restrito a administradores e auditores de consulta.
