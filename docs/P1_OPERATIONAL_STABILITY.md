# P1 — Estabilidade operacional e observabilidade

## Objetivo

Reduzir falhas silenciosas em produção e tornar incidentes de inicialização, renderização e publicação detectáveis antes de chegar ao usuário.

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
- gate do CI bloqueando merge quando o smoke test falhar.

## Critérios de aceite

- erros de renderização não resultam em tela branca;
- o usuário recebe opções de tentar novamente ou recarregar;
- o CI falha se o bundle não produzir `index.html`, `server.mjs` ou `server.cjs`;
- o CI falha se o HTML apontar para assets ausentes;
- o CI falha se o servidor compilado não iniciar;
- `/api/health` responde HTTP 200 com `status: ok` e `service: kyron-os`;
- banco de dados, RLS e lógica do Workout Player permanecem inalterados.

## Próximas entregas da P1

1. painel de diagnóstico de sincronização offline e dead-letter queue;
2. alerta visual de operações pendentes ou permanentemente rejeitadas;
3. telemetria de erros agregada sem conteúdo pessoal;
4. verificação periódica do endereço oficial após deploy;
5. runbook de incidente, rollback e recuperação de cache/PWA.
