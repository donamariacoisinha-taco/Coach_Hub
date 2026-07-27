# P1 — Estabilidade operacional e observabilidade

## Objetivo

Reduzir falhas silenciosas em produção e tornar incidentes de inicialização, renderização, publicação e sincronização detectáveis antes de causar perda de confiança ou de dados.

## Entrega 1 — Resiliência do frontend e smoke test

### Implementado

- Error Boundary global após a montagem do React;
- tela de recuperação com código de incidente;
- armazenamento temporário dos cinco diagnósticos mais recentes em `sessionStorage`;
- nenhuma persistência de token, senha ou conteúdo de treino no diagnóstico;
- endpoint público `/api/health` sem dados sensíveis;
- identificação do build no endpoint de saúde;
- smoke test do bundle compilado;
- validação da existência dos assets referenciados pelo HTML;
- inicialização real do servidor de produção no CI;
- teste do endpoint de saúde e do shell da aplicação;
- etapas de CI com falha direta e artefatos de diagnóstico.

### Critérios de aceite

- erros de renderização não resultam em tela branca;
- o usuário recebe opções de tentar novamente ou recarregar;
- o CI falha se o bundle não produzir `index.html`, `server.mjs` ou `server.cjs`;
- o CI falha se o HTML apontar para assets ausentes;
- o CI falha se o servidor compilado não iniciar;
- `/api/health` responde HTTP 200 com `status: ok` e `service: kyron-os`.

## Entrega 2 — Saúde da sincronização offline

### Implementado

- painel global mobile-first acessível em qualquer tela;
- indicador persistente de estado: em dia, pendente, revisão necessária, offline ou indisponível;
- contadores separados para fila pendente e dead-letter queue;
- atualização por evento da fila, mudança de conectividade e verificação periódica;
- listagem limitada a metadados operacionais, sem conteúdo da série ou payload do usuário;
- tentativa manual de sincronização;
- reprocessamento individual de item em dead-letter;
- reprocessamento em bloco de todas as falhas;
- movimentação transacional entre dead-letter e fila principal;
- nenhuma ação de descarte no painel;
- feedback explícito confirmando que os registros permanecem preservados quando uma tentativa falha;
- testes unitários dos estados de saúde e da apresentação de tempo/operação.

### Critérios de aceite

- uma operação pendente aparece no painel sem recarregar a aplicação;
- uma falha definitiva fica visível e não é apagada automaticamente;
- o usuário consegue reprocessar uma falha individual ou todas as falhas;
- reprocessamento só é habilitado quando existe conexão;
- o painel nunca exibe payloads, tokens, e-mails ou conteúdo detalhado do treino;
- a indisponibilidade do IndexedDB gera estado visível em vez de erro silencioso;
- banco de dados, RLS e lógica de avanço do Workout Player permanecem inalterados.

## Entrega 3 — Telemetria segura e resposta a incidentes

### Implementado

- agregador local de eventos operacionais com retenção de 14 dias;
- outbox agregada por evento, categoria de rota e build;
- transporte em lotes de até 25 combinações;
- envio somente com sessão ativa e conexão disponível;
- falha silenciosa e segura enquanto a migration não estiver aplicada;
- migration `db_p1_3_operational_telemetry.sql` com allowlists no banco;
- tabela diária sem identificador de usuário;
- RPC autenticada, limitada e com `search_path` fixo;
- leitura persistente restrita a administradores por RLS;
- painel administrativo dos últimos sete dias;
- diagnóstico de sessão restrito a incidente, build, categoria da rota e classe do erro;
- runbook versionado em `docs/P1_INCIDENT_RUNBOOK.md`;
- testes de sanitização, expiração, agregação, outbox e relatório seguro.

### Endurecimento pré-aplicação

- lote máximo de 25 combinações;
- itens JSON que não sejam objetos são ignorados;
- contagem inválida é normalizada para 1;
- incremento por item limitado a 100;
- contador agregado limitado a 10.000 por combinação/dia;
- no máximo 500 novas combinações por dia;
- build sanitizado e limitado a 40 caracteres;
- rollback versionado em `db_p1_3_operational_telemetry_rollback.sql`;
- snapshot pré-aplicação em `docs/P1_3_PREAPPLICATION_SNAPSHOT_2026-07-27.md`.

### Critérios de aceite

- nenhum evento aceita chaves de dimensão fora da allowlist;
- valores semelhantes a e-mail, senha, token ou Bearer são descartados;
- query string, hash e identificadores de rota não são persistidos;
- o erro completo permanece apenas no console da sessão atual;
- telemetria corrompida ou expirada não impede o aplicativo de abrir;
- falha ao gravar telemetria nunca interrompe o Workout Player ou a sincronização;
- o runbook proíbe limpeza de IndexedDB antes da verificação da fila offline.

## Validação consolidada

- 6 arquivos de teste aprovados;
- 35 testes aprovados;
- TypeScript/lint aprovado;
- build aprovado;
- smoke do bundle e servidor aprovado;
- pré-check do Supabase aprovado;
- nenhuma alteração no Supabase, RLS ou dados de usuários durante a preparação.

## Estado atual

- PR #5 permanece draft;
- migration P1.3 revisada e pronta para aplicação;
- snapshot e rollback disponíveis;
- aplicação no Supabase ainda não autorizada nem executada;
- produção permanece inalterada.

## Próximas entregas da P1

1. aplicar e homologar a migration P1.3 após autorização explícita;
2. validar visualmente o painel de sincronização em preview;
3. verificar o endereço oficial após deploy;
4. revisar exportação segura da dead-letter queue para suporte técnico.
