# P4.1 — Integridade da jornada do atleta

## Escopo desta entrega

Esta entrega corresponde à **P4.1.1** e protege a transição entre treino em andamento, persistência das séries, conclusão e retomada da sessão.

A migração de produção foi aplicada em 30 de julho de 2026 com o nome:

`kyron_p4_1_workout_completion_integrity`

## Diagnóstico agregado

A auditoria da base encontrou sinais de inconsistências históricas anteriores à proteção:

- 47 históricos concluídos sem séries persistidas;
- 51 históricos concluídos com contagem de exercícios igual a zero;
- 2 sessões parciais ligadas a históricos já concluídos;
- 5 perfis com onboarding concluído e sem categoria de treino;
- nenhuma duração ou contagem de exercícios negativa.

Os registros históricos não foram apagados nem reescritos. Apenas as duas sessões parciais obsoletas, que poderiam oferecer retomada de um treino já finalizado, foram removidas.

## Garantias adicionadas

### Conclusão válida

Um histórico só pode passar para concluído quando:

- possui ao menos um exercício registrado;
- possui ao menos uma série persistida em `workout_sets_log`;
- não contém duração negativa.

### Idempotência

Depois que `completed_at` é definido, novas chamadas não podem deslocar o horário canônico de conclusão. Isso reduz o impacto de duplo clique, retry de rede e repetição do fluxo pelo cliente.

### Limpeza da retomada

Ao concluir o treino, a sessão correspondente é removida de `partial_workout_sessions`, impedindo que o dashboard ofereça a retomada de um treino já encerrado.

### Conquistas processadas uma vez

O gatilho de conquistas passa a executar somente na primeira transição de `completed_at` nulo para preenchido.

### Integridade e performance

Foram adicionados:

- restrição para duração não negativa;
- restrição para quantidade de exercícios não negativa;
- índice parcial por `partial_workout_sessions.workout_id`;
- índice parcial por `partial_workout_sessions.history_id`.

As funções internas usam `SECURITY INVOKER`, `search_path` fixo e não ficam expostas como RPC para `anon` ou `authenticated`.

## Verificação transacional

A validação foi executada dentro de uma transação posteriormente revertida, sem deixar registros de teste.

| Cenário | Resultado esperado | Resultado |
|---|---|---|
| concluir sem série persistida | bloquear | aprovado |
| concluir depois de persistir uma série | permitir | aprovado |
| manter sessão parcial após conclusão | remover automaticamente | aprovado |
| repetir conclusão com outro horário | preservar horário original | aprovado |
| gatilhos instalados | presentes | aprovado |
| sessões parciais ligadas a treino concluído | zero | aprovado |

## Rollback

O arquivo `db_p4_1_workout_completion_integrity_rollback.sql` remove os gatilhos, funções, índices e restrições desta entrega e restaura o comportamento anterior do gatilho de conquistas.

O rollback não recria as sessões parciais obsoletas removidas, pois elas representavam retomadas inválidas de treinos já concluídos.

## Próximas etapas da P4.1

### P4.1.2 — Proteção no cliente

- bloquear chamadas concorrentes de finalização no `WorkoutPlayer`;
- tornar `finishWorkout` explicitamente idempotente no cliente;
- melhorar a mensagem exibida quando as séries ainda não foram sincronizadas.

### P4.1.3 — Integridade do onboarding

- validar que o plano gerado possui exercícios antes de marcar o onboarding como concluído;
- impedir plano emergencial vazio;
- oferecer recuperação clara quando a geração automática falhar.

### P4.1.4 — Dashboard confiável

- remover dados demonstrativos usados como fallback silencioso;
- diferenciar estado vazio real, indisponibilidade temporária e cache válido;
- validar a retomada contra o estado remoto mais recente.

## Débitos fora deste escopo

Os advisors do Supabase ainda registram avisos anteriores relacionados a políticas RLS duplicadas, índices duplicados, buckets públicos e funções `SECURITY DEFINER`. Esses pontos devem ser tratados em uma frente própria para evitar misturar alterações amplas de segurança com a jornada do atleta.
