---
titulo: Procedimento de Recuperação de Dados
tipo: documento
atualizado_em: 2026-07-20
versao: "1.4"
---

# Procedimento de Recuperação de Dados

Documento operacional da Órbita Sistemas S.A., empresa fictícia usada para testes. Descreve os passos da equipe de infraestrutura para restaurar dados de clientes.

## 1. Objetivos de recuperação

Para a restauração de dados de clientes a partir de cópias de segurança, o RPO é de 1 hora e o RTO é de 8 horas.

## 2. Passos de restauração

1. Abrir um chamado de restauração com o identificador do cliente e o horário-alvo.
2. Selecionar a cópia de segurança mais recente anterior ao horário-alvo.
3. Restaurar em um ambiente isolado e validar a integridade dos dados.
4. Promover o ambiente restaurado e comunicar o cliente.

## 3. Responsabilidades

A equipe de infraestrutura executa a restauração. A gerência de segurança aprova restaurações que envolvam dados de mais de um cliente.
