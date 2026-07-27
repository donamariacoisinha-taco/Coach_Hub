# P1.3 — Aplicação em produção e homologação

## Ambiente

- Projeto Supabase: `eqnkuqkadtywgfsoilpe`
- Data: 2026-07-27
- Migration: `kyron_p1_3_operational_telemetry`
- Resultado da aplicação: sucesso
- Rollback executado: não

## Objetos criados

- `public.operational_telemetry_daily`
- `public.operational_telemetry_summary`
- `public.record_operational_telemetry(jsonb)`

## Segurança validada

- RLS habilitado na tabela;
- uma policy de leitura administrativa;
- `anon` sem permissão de execução da RPC;
- `authenticated` com execução da RPC;
- escrita direta revogada de `authenticated`;
- leitura persistente restrita a administradores;
- função com `SECURITY DEFINER` e `search_path` fixo;
- conta suspensa bloqueada pela RPC;
- conta ativa autorizada a registrar somente eventos agregados.

## Homologação funcional

### Conta ativa

O lote de homologação continha:

1. evento válido com contagem 2;
2. evento fora da allowlist;
3. evento válido com rota, build e contagem inválidos.

Resultado:

- 2 eventos aceitos;
- evento fora da allowlist ignorado;
- rota inválida convertida para `unknown`;
- build sanitizado;
- contagem não numérica convertida para 1.

### Conta suspensa

A chamada foi bloqueada com `Active account required`.

### Leitura por RLS

- usuário ativo não administrador: 0 linhas visíveis;
- administrador ativo: linhas de homologação visíveis.

### Limpeza

Todos os registros de homologação foram removidos.

## Integridade final

- perfis: 10;
- registros em `user_access`: 10;
- perfis sem `user_access`: 0;
- administradores ativos: 1;
- contas ativas: 8;
- contas suspensas: 2;
- registros de homologação restantes: 0.

## Security Advisor

A P1.3 adiciona o alerta esperado `authenticated_security_definer_function_executable` para `record_operational_telemetry(jsonb)`. A exposição a usuários autenticados é intencional e compensada por:

- verificação de `auth.uid()`;
- exigência de conta ativa em `user_access`;
- allowlist de eventos e rotas;
- lote máximo de 25 combinações;
- limite de 100 por item;
- teto de 10.000 por combinação/dia;
- teto de 500 novas combinações/dia;
- ausência de identificadores pessoais e payloads.

Alertas anteriores do projeto permanecem fora do escopo desta migration.

## Rollback

Disponível em `db_p1_3_operational_telemetry_rollback.sql`.

O rollback não foi necessário porque aplicação, RLS, RPC, homologação e integridade final foram aprovados.
