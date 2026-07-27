# P1.3 — Snapshot pré-aplicação

Data: 2026-07-27
Projeto Supabase: `eqnkuqkadtywgfsoilpe`
Ambiente: produção

## Estado dos objetos P1.3

- `public.operational_telemetry_daily`: não existe;
- `public.operational_telemetry_summary`: não existe;
- `public.record_operational_telemetry(jsonb)`: não existe.

## Integridade de acesso

- perfis: 10;
- registros em `user_access`: 10;
- perfis órfãos: 0;
- contas ativas: 8;
- administradores ativos: 1.

## Dependências confirmadas

- PostgreSQL 17.6;
- `public.user_access` disponível;
- `public.is_admin()` disponível;
- `public.is_admin()` delega para `private.current_user_is_admin()` com `search_path` vazio;
- `user_access.status` aceita `active` e `suspended`.

## Controles adicionados antes da aplicação

- lote máximo de 25 combinações;
- somente contas autenticadas e ativas;
- eventos e rotas limitados por allowlist;
- itens JSON que não sejam objetos são ignorados;
- contagem inválida é normalizada para 1;
- incremento por item limitado a 100;
- contador agregado limitado a 10.000 por combinação/dia;
- no máximo 500 novas combinações por dia;
- build sanitizado e limitado a 40 caracteres;
- leitura persistente somente para administradores;
- rollback versionado em `db_p1_3_operational_telemetry_rollback.sql`.

## Estado de execução

A migration P1.3 ainda não foi aplicada ao Supabase neste snapshot.
