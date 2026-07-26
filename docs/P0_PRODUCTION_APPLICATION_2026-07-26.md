# P0/P0.2 — Aplicação em produção

Data: 2026-07-26
Projeto Supabase: `eqnkuqkadtywgfsoilpe`

## Migrations aplicadas

1. `kyron_p0_user_access_hardening`
2. `kyron_p0_2_security_advisor_hardening`
3. `cleanup_p0_2_disposable_homologation_accounts`

## Snapshot e rollback

O estado anterior foi capturado antes da primeira migration. O rollback lógico está versionado em:

- `db_p0_rollback_snapshot_20260726.sql`

## Validações concluídas

- 10 perfis e 10 registros `user_access`;
- nenhum perfil sem registro de acesso;
- um administrador real ativo preservado;
- view `exercise_progress` configurada como `security_invoker`;
- policy irrestrita de `admin_preferences` removida;
- funções de trigger sem execução direta por `anon` ou `authenticated`;
- RPCs legítimas do atleta disponíveis apenas para autenticados;
- proprietário pode criar, editar e excluir o próprio exercício;
- usuário comum não pode criar exercício para terceiro nem alterar exercício global;
- usuário pode gerenciar apenas as próprias preferências;
- usuário anônimo não recebe linhas de `exercise_progress`;
- usuário comum não consegue executar a RPC administrativa;
- Free → Premium, suspensão, reativação e retorno a Free aprovados;
- trilha de auditoria confirmada;
- CI, testes, lint e build aprovados.

## Limpeza da homologação

As duas contas descartáveis foram restauradas para:

- papel `user`;
- plano `free`;
- status `suspended`.

Não permaneceram exercícios ou preferências temporárias da homologação.

## Alertas do Advisor fora do escopo

Permanecem para uma fase posterior:

- `protocol_audit_log` com RLS sem policy;
- listagem pública dos buckets `assets` e `exercise-images`;
- `update_room_state_atomic` exposta no projeto compartilhado;
- aviso esperado para RPCs `SECURITY DEFINER` autenticadas e validadas internamente;
- proteção contra senhas vazadas desativada no Supabase Auth.

## Estado de entrega

- migrations aplicadas em produção;
- PR ainda em draft;
- merge não realizado;
- deploy não realizado;
- validação visual final do Workout Player ainda pendente.
