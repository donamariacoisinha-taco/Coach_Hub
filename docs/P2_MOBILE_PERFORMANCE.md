# P2.2 — Performance mobile

## Objetivo

Reduzir o peso do bundle inicial do KYRON OS em celulares sem alterar comportamento, banco de dados, autenticação, treino ou sincronização.

## Escopo desta entrega

- Separar vendors grandes em chunks estáveis.
- Separar features pesadas em chunks próprios.
- Reduzir o tamanho do chunk principal gerado pelo Vite.
- Manter navegação, login, Workout Player e sincronização com o mesmo comportamento.

## Estratégia aplicada

A divisão inicial foi feita em `vite.config.ts` via `rollupOptions.output.manualChunks`.

### Chunks de vendor

- `vendor-react`
- `vendor-motion`
- `vendor-supabase`
- `vendor-dnd`
- `vendor-charts`
- `vendor-icons`
- `vendor-media-tools`
- `vendor-ai`
- `vendor-misc`

### Chunks de aplicação

- `feature-workout`
- `feature-admin`
- `feature-dashboard`
- `feature-onboarding`
- `feature-user`
- `feature-workout-management`
- `feature-exercise-library`
- `runtime-sync`
- `runtime-api`

## Não alterado

- Supabase;
- RLS;
- autenticação;
- layout;
- rotas;
- lógica do Workout Player;
- sincronização offline;
- API Gemini;
- domínio oficial `https://kyron.uno/`.

## Critérios de aceite

- `npm run test` aprovado.
- `npm run lint` aprovado.
- `npm run build` aprovado.
- `npm run smoke` aprovado.
- `/api/health` continua retornando `status: ok` após publicação.
- Login continua funcionando.
- Workout Player abre, salva série e exibe sincronização em dia.

## Próximo corte possível

Depois desta entrega segura, o próximo corte de performance pode trocar imports estáticos do `App.tsx` por `React.lazy`/`Suspense`, carregando telas somente sob demanda por rota.
