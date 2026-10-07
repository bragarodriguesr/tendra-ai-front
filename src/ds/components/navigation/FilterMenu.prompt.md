**Padrão de filtro para listas e tabelas.** "Todos" fica fixo como botão; as demais visões vão para o menu do botão "Filtrar" (ícone de funil), cada uma com a quantidade de itens à direita. Com um filtro ativo, o botão troca "Filtrar" pelo nome e pela contagem da visão e fica preenchido; "Todos" volta para contorno.

```jsx
<FilterMenu value={filter} onChange={setFilter} items={[
  { value: "todos", label: "Todos", count: 12 },
  { value: "sugerida", label: "Sugerida", count: 6 },
  { value: "aprovada", label: "Aprovada", count: 2 },
  { value: "alerta", label: "Alerta pendente", count: 6 }
]} />
```

Use sempre que uma lista ou tabela puder ser recortada por estado, tipo ou alerta — mesmo com só duas ou três visões. Não filtre com `Tabs` (abas são para visões irmãs do mesmo objeto) nem com `Select` (ordenação continua em `Select`). O menu fecha com Esc, clique fora ou ao escolher, e o foco volta ao botão.
