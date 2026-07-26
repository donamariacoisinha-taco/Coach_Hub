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

## Próximas entregas da P1

1. telemetria agregada de erros sem conteúdo pessoal;
2. verificação periódica do endereço oficial após deploy;
3. runbook de incidente, rollback e recuperação de cache/PWA;
4. revisão de retenção e exportação segura da dead-letter queue para suporte técnico.
