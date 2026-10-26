Campo de luz da direção Aurora — o gradiente esfumado que dá o clima "produto de IA" sem sair das quatro cores.

```jsx
<Aurora variant="lime" move padding="lg"><h1>Responda a um RFP em horas.</h1></Aurora>
<Aurora variant="ink" radius={0} as="section">…</Aurora>
```

`lime` para capa, hero e post (limão em baixo à esquerda, papel no alto à direita); `mist` quando o fundo precisa respirar (hero de site, seção); `ink` para card de produto, capa de proposta e seção escura. Texto em tinta sobre `lime`/`mist`, em papel sobre `ink`. **Dados nunca ficam diretamente sobre o campo**: tabela, formulário e resposta gerada vão num painel chapado (`ink-panel`) ou em `Card` branco. `move` só em superfícies de marca; desligado por padrão em telas de trabalho.
