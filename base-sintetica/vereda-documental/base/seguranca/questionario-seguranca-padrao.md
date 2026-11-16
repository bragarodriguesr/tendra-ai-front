---
titulo: Questionário de segurança padrão respondido
tipo: documento
atualizado_em: 2026-10-07
versao: "2026.4"
---

# Questionário de segurança padrão respondido

CENÁRIO SINTÉTICO PARA TESTES DO TENDRA.AI. Vereda Documental é uma empresa inteiramente fictícia. Este documento não representa empresa real. Todas as capacidades, condições, taxas, controles e evidências abaixo são inventados e não descrevem a empresa real. Não usar como proposta comercial, orientação financeira ou comprovação de conformidade.

Escopo: plataforma fictícia de emissão, gestão e inteligência documental; valores e condições apenas para avaliação do Tendra.ai.

## 1. Sobre este questionário

Respostas padrão da Vereda ao questionário de segurança da informação usado em processos de homologação de fornecedores. As respostas valem na data deste documento e são revistas a cada trimestre.

## 2. Governança

**Existe política de segurança da informação aprovada pela diretoria?** Sim. A política foi aprovada pela diretoria e é revista uma vez por ano.

**Há uma pessoa responsável pela segurança da informação?** Sim. O responsável de segurança responde ao diretor de tecnologia e participa do comitê de segurança mensal.

**A empresa possui certificação ISO/IEC 27001 ou SOC 2?** Não. O sistema de gestão está em implantação, com auditoria de certificação ISO/IEC 27001 prevista para o segundo semestre de 2027.

**Há análise de riscos periódica?** Sim, anual, com plano de tratamento acompanhado pelo comitê.

## 3. Controle de acesso

**O acesso aos sistemas exige MFA?** Sim, para administradores do portal, equipe técnica e produção. Para usuários dos clientes, a MFA é obrigatória no portal e no aplicativo.

**Como é feita a concessão de acesso?** Por chamado, com aprovação do gestor e do dono do sistema, no perfil mínimo necessário.

**Com que frequência os acessos são revistos?** Trimestralmente, com registro das decisões.

**Em quanto tempo o acesso de um desligado é revogado?** Em até 4 horas após a comunicação formal do RH interno.

**Contas compartilhadas são permitidas?** Não. Credenciais são individuais e intransferíveis.

**Como funciona o acesso privilegiado?** Acesso temporário de até 2 horas, com aprovação individual, MFA e registro da sessão.

## 4. Proteção de dados

**Os dados são criptografados em repouso e em trânsito?** Sim. AES-256 em repouso e TLS 1.2 ou superior em trânsito.

**Onde os dados ficam armazenados?** No Brasil, em provedor fictício Nuvem Aurora, com região principal em São Paulo e recuperação em região secundária no Brasil.

**Há transferência internacional de dados?** Sim, apenas para o provedor de IA da extração assistida, com cláusulas contratuais padrão e retenção técnica de 30 dias.

**Os dados dos clientes são separados entre si?** Sim. Há identificador de empresa obrigatório nas consultas, políticas de acesso por linha e testes automáticos de isolamento.

**Como são feitos os backups?** Backup completo diário, incrementais a cada 15 minutos, retenção de 35 dias e restauração amostral mensal.

**Os dados são usados para treinar modelos de IA?** Não. Nem pela Vereda nem pelo provedor de IA contratado.

## 5. Operação e monitoramento

**Há monitoramento de segurança contínuo?** Sim, operação de monitoramento 24 horas por dia, 7 dias por semana, com escala de plantão.

**Quais eventos são registrados?** Login, falha de login, alteração de perfil, exportação, aprovação de pedidos, emissão solicitada e ações administrativas.

**Por quanto tempo os logs são guardados?** A norma de registro e monitoramento determina 24 meses de retenção para os logs de segurança.

**Os logs são protegidos contra alteração?** Sim, em armazenamento imutável com verificação diária de integridade.

**Há gestão de vulnerabilidades?** Sim. Varreduras trimestrais de infraestrutura, análise de dependências em cada publicação e correção de críticas em até 15 dias corridos.

**É feito teste de intrusão?** Sim, anual, por empresa independente. O teste de 2026 não encontrou achados críticos.

## 6. Incidentes e continuidade

**Existe plano de resposta a incidentes?** Sim, com classificação por severidade, etapas de contenção e investigação e exercícios semestrais.

**Em quanto tempo o cliente é comunicado de um incidente?** Em até 72 horas após a confirmação.

**Existe plano de continuidade de negócios?** Sim, com exercício completo semestral e teste de mesa trimestral.

**Quais são o RPO e o RTO?** O plano de continuidade determina RPO de 15 minutos e RTO de 2 horas. O exercício de setembro de 2026 observou RPO de 12 minutos e RTO de 1 hora e 42 minutos.

## 7. Desenvolvimento

**Há revisão de código?** Sim, toda mudança é revisada por outra pessoa antes de entrar na linha principal.

**Há testes de segurança no pipeline?** Sim, análise estática, verificação de dependências e de segredos, que bloqueiam a publicação quando encontram problema.

**Dados de produção são usados em testes?** Não. Os ambientes de teste usam apenas dados sintéticos.

## 8. Fornecedores

**Quais são os subprocessadores?** Nuvem Aurora (infraestrutura), Mensageria Ipê (notificações) e o provedor de IA da extração assistida, todos fictícios.

**Os fornecedores são avaliados?** Sim, antes da contratação e uma vez por ano.

**O cliente é avisado sobre novos subprocessadores?** Sim, com 30 dias de antecedência, no plano Corporativo.
