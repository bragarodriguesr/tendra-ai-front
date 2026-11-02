# Instruções para o Claude neste repositório

- A fonte principal da fase atual está em `docs/mvp-resposta-rfp/`, em três pastas: `spec/` (arquivos `SPEC*`), `plan/` (arquivos `PLAN*`) e `product/` (os demais):
  - `product/ARQUITETURA_MAPPING.md`, `spec/SPEC.md` e `plan/PLAN.md`: arquitetura, comportamento e plano do backend;
  - `spec/SPEC_FASE_D.md` e `plan/PLAN_FASE_D.md`: spec e plano da fase D (publicação compartilhada com login);
  - `product/PRD_Front-end_Tendra.ai_MVP_v3.md`: PRD vigente (a seção 20 define o pipeline de IA);
  - `product/PIPELINE_IA_MVP.md`: diagramas do pipeline de IA;
  - `product/FORMATO_BASE_MD.md`: formato dos arquivos `.md` da base de conhecimento.
- **Não use `docs/referencia/` a menos que seja pedido expressamente.** Isso inclui `docs/referencia/mvp-proposta-1/`: não consulte, cite, atualize nem baseie decisões nesses arquivos sem um pedido explícito. Se uma tarefa parecer depender deles, avise e pergunte antes.
- **Brand Aurora** (`src/ds/README.md`, seção "BRAND AURORA"): só aplicar (`Aurora`, `--grad-*`, `data-aurora`) quando o pedido o citar de forma explícita, e só no elemento indicado. Caso contrário, siga o DS sem gradientes.
