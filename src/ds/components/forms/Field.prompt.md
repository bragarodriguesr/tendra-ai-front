Rótulo, dica e erro em volta de um controle. Use sempre — rótulo solto acima de um `Input` perde o `htmlFor`.

```jsx
<Field label="Nome do edital" hint="Como aparece no portal do cliente" htmlFor="rfp">
  <Input id="rfp" placeholder="RFP — Banco Aurora 2026" />
</Field>
```

`error` substitui a dica e troca o texto por vermelho com ícone. O asterisco de `required` é sálvia, nunca vermelho.
