# KYRON OS — guia para agentes

Sistema adaptativo de treino. A pessoa monta o plano, executa séries com carga,
repetições e RPE, retoma sessões interrompidas e acompanha histórico e evolução.

**Princípio central:** cada sessão registrada melhora a próxima decisão do
sistema. **Nunca apresente dado fictício como se fosse do usuário.** Se não há
base real, mostre `—` ou "Dados insuficientes".

**Público:** iniciantes e pessoas 50+. Interface clara, linguagem simples, boa
legibilidade, poucas ações por tela.

## Armadilhas que já custaram tempo

Leia esta seção antes de mexer em qualquer coisa. Cada item aqui já quebrou algo.

### `npm run build` reescreve o código-fonte

O `prebuild` roda oito scripts `scripts/fixWorkout*.mjs` e
`scripts/fixAdminExerciseMuscleFilters.mjs` que **editam arquivos em `src/`** —
principalmente `WorkoutPlayer.tsx`, `WorkoutEditor.tsx` e `workoutApi.ts`.

Consequências práticas:

- Depois de um build, `git status` mostra alterações que você não fez.
- Essas reescritas **não estão commitadas na `main`** e reaparecem a cada build.
- Elas introduzem 2 erros de TypeScript: rodar `npm run lint` logo após
  `npm run build` falha, e isso não é culpa da sua alteração.

O fluxo seguro: **commite antes de buildar**, e depois do build descarte a
sujeira com `git checkout -- src/`, conferindo antes que suas próprias edições
sobreviveram (elas sobrevivem — os scripts fazem substituição pontual).

### Migration de banco é manual

Não existe `supabase/migrations/` neste repositório. Nenhuma alteração de schema
é aplicada por deploy. Se sua mudança precisa de coluna nova, **entregue o SQL
pronto e avise que o passo é manual** — e prefira código que tolere a coluna
ausente a código que quebra sem ela.

Não altere RLS, políticas ou schema sem necessidade comprovada.

### `main` não publica no domínio

Push na `main` dispara a Vercel, não a Hostinger. O domínio `kyron.uno` exige
sincronização manual. Nunca assuma que mergear publicou para o usuário final.
Ao publicar uma página específica (ex.: `/academia-sem-medo/`), não sobrescreva
o resto do site.

### CI não roda em PR empilhado

`.github/workflows/ci.yml` dispara em `pull_request` **apenas com base `main`**.
Um PR que aponta para outra branch não roda CI sozinho — dispare o workflow
manualmente (`workflow_dispatch`) na branch.

### Logo

O logo oficial é o "K" em degradê azul/roxo fornecido pelo usuário. Não recrie,
não redesenhe, não substitua. **Não inclua arquivos de logo em commit sem
autorização explícita** — há alterações locais históricas de logo que não devem
entrar por acidente.

## Comandos

```
npm ci            # Node 24
npm run lint      # tsc --noEmit
npm test          # vitest run
npm run build     # ATENÇÃO: reescreve src/ (ver acima)
npm run smoke     # sobe o build e checa health + shell da aplicação
npm run dev       # tsx server.ts, porta 3000
```

O `predev` roda os mesmos scripts de reescrita do `prebuild`.

## Duas pessoas, dois lugares de dados

Este é o erro mais repetido do projeto. Já quebrou a tela de Evolução e a de
Histórico, de forma independente, pelo mesmo motivo.

| | Autenticado | Convidado |
| --- | --- | --- |
| Identidade | `user.id` do Supabase | `GUEST_USER_ID` (`'guest-user-id'`) |
| Histórico | tabela `workout_history` | `kyron_guest_dashboard_v1` → `history[]` |
| Séries | tabela `workout_sets_log` | `history[].workout_sets_logs` |
| Plano | tabelas remotas | mesmo dashboard local |

**Toda função que lê dado do usuário precisa de um caminho para o convidado.**
Uma consulta ao Supabase filtrando por `GUEST_USER_ID` não dá erro — devolve
lista vazia, e a tela aparece em branco sem nenhum sinal de que algo falhou.
Foi exatamente assim que Evolução e Histórico ficaram vazios para convidado.

O fluxo convidado também **não deve depender de consulta administrativa**. Existe
um aviso conhecido em produção (`permission denied for function is_admin`) que
não bloqueia a jornada — o app usa fallback estático de exercícios. Só corrija se
causar falha visível.

### Armazenamento local do convidado

`src/lib/guest/guestPersistence.ts` é a fonte da verdade. Tem versionamento de
schema (`GUEST_STORAGE_SCHEMA_VERSION`) com migração que repara planos antigos e
limpa estado transitório. Ao mudar o formato do que é persistido, **suba a versão
e trate os dados antigos** — há usuários com plano gravado no aparelho.

## Execução do treino é a área mais frágil

`src/features/workout/WorkoutPlayer.tsx` coordena quatro fontes de verdade que
precisam concordar:

1. posição (`currentIndex`, `currentSet`)
2. séries concluídas (`completedSetIndices`, `completedSetsByExercise`)
3. dados executados (`workoutPerformance`)
4. timer de descanso

Quando duas divergem, o app trava de formas difíceis de diagnosticar — já houve
tela abrindo numa série já concluída e recusando concluí-la, sem saída.

As regras puras vivem em `src/domain/workout/workoutReliability.ts`
(`normalizeWorkoutPosition`, `decideWorkoutAdvance`, `resolveResumeSetNumber`,
`reconcileWorkoutProgress`). **Coloque lógica nova ali, com teste** — não
espalhada no componente de 5000 linhas. Foi o que permitiu cobrir esses casos.

Contexto histórico em `docs/P2_WORKOUT_RELIABILITY.md`.

## Sessão parcial

Treino encerrado antes de todas as séries prescritas. Marcado por
`WorkoutHistory.partial`.

- Sessão parcial **não conta como treino completo** — não vira "Missão
  Cumprida!", não recebe check no calendário, não alimenta streak como se a meta
  tivesse sido cumprida.
- Se o mesmo dia tem sessão completa e parcial, **a completa prevalece**.
- Só as séries efetivamente concluídas são salvas.

## Fluxo de trabalho

1. Simule um usuário real. Registre só defeito reproduzível, com passos e
   evidência.
2. Corrija o defeito relatado — não amplie o escopo por conta própria.
3. Valide: `npm run lint`, `npm test`, `npm run build`, `npm run smoke`.
4. Preserve alterações locais não relacionadas. Nunca `git reset --hard`.
5. Commit claro; PR com o que mudou, o que foi testado e **as limitações**.
6. Não publique sem validação em runtime.

Cada PR gera um preview na Vercel — é onde o teste manual acontece. O ambiente
do Claude Code na web costuma ter a saída para `vercel.app` bloqueada por
política de rede, então **a confirmação visual é do usuário**, não sua. Diga isso
explicitamente em vez de sugerir que validou o que não validou.

Ao terminar uma etapa, informe: arquivos alterados, testes executados,
limitações, e status de commit/push/deploy.

## Não faça

- Reconstruir arquitetura ou substituir funcionalidade estável sem pedido.
- Tratar dado de demonstração como histórico do usuário.
- Alterar Supabase/RLS/migrations sem prova de necessidade.
- Publicar na `main` sem teste, revisão e confirmação de escopo.
- Pular, desabilitar ou isolar teste para ficar verde.
