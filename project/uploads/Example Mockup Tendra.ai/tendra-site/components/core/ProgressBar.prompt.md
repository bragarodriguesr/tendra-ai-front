Barra de progresso de 6px — cobertura de RFP, importação, score.

```jsx
<ProgressBar label="Preenchimento automático" value={92} />
<ProgressBar tone="ink" label="Cobertura" value={68} />
```

Em fundo claro a barra é sálvia (limão não tem contraste como informação isolada); em fundo tinta ela é limão. A animação de entrada dura 1.6s com `--ease-out` — desligue com `animate={false}` em listas longas.
