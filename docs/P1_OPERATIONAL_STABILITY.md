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
- reprocessamento individual e em bloco;
- movimentação transacional entre dead-letter e fila principal;
- nenhuma ação de descarte no painel;
- feedback explícito confirmando que os registros permanecem preservados;
- testes unitários dos estados de saúde e apresentação operacional.

### Critérios de aceite

- uma operação pendente aparece sem recarregar a aplicação;
- uma falha definitiva fica visível e não é apagada automaticamente;
- reprocessamento só é habilitado com conexão;
- o painel nunca exibe payloads, tokens, e-mails ou conteúdo detalhado do treino;
- indisponibilidade do IndexedDB gera estado visível;
- lógica de avanço do Workout Player permanece inalterada.

## Entrega 3 — Telemetria agregada e resposta a incidentes

### Implementado no código

- agregador local com retenção máxima de 14 dias;
- até 20 eventos recentes e contadores locais;
- outbox separada com agregação por evento, categoria de rota e build;
- transporte em lote de até 25 combinações por chamada;
- envio somente para sessão ativa e conexão disponível;
- desativação silenciosa do transporte enquanto a migration não existir;
- reconhecimento parcial dos contadores enviados, preservando eventos novos durante o transporte;
- categoria da rota em vez de URL completa;
- classe técnica do erro em vez de mensagem integral;
- faixas de quantidade em vez de valores de alta cardinalidade;
- cobertura de inicialização, renderização, conectividade, fila, dead-letter e ciclos de sincronização;
- migration `db_p1_3_operational_telemetry.sql` com allowlist server-side;
- tabela agregada sem identificador de usuário;
- RPC autenticada, limitada e `SECURITY DEFINER` com `search_path` fixo;
- RLS permitindo leitura persistente apenas a administradores;
- painel administrativo com resumo dos últimos sete dias;
- estado visual explícito quando a migration ainda aguarda ativação;
- runbook versionado em `docs/P1_INCIDENT_RUNBOOK.md`.

### Dados persistidos após futura ativação

Somente:

- `day`;
- `event_name`;
- `route_group`;
- `build`;
- `event_count`;
- horários do primeiro e último evento agregado.

Não são persistidos:

- ID de usuário;
- e-mail;
- token ou credencial;
- mensagem ou stack trace;
- URL completa;
- exercício, carga, repetição ou conteúdo de treino;
- payload da fila offline;
- impressão digital do dispositivo.

### Critérios de aceite

- eventos e rotas possuem allowlist no cliente e no banco;
- valores semelhantes a e-mail, senha, token ou Bearer são descartados;
- query string, hash e identificadores de rota não são persistidos;
- falha local ou remota da telemetria nunca interrompe o aplicativo;
- usuário comum não consegue consultar o resumo persistente;
- migration permanece não aplicada até autorização explícita;
- painel administrativo explica corretamente o estado pendente da migration.

## Validação consolidada

- 6 arquivos de teste aprovados;
- 35 testes aprovados;
- TypeScript/lint aprovado;
- build aprovado;
- smoke do bundle e servidor aprovado;
- migration criada e revisada no repositório, sem execução no Supabase;
- nenhuma alteração em RLS ou dados de produção nesta entrega.

## Próximos passos

1. revisar a migration P1.3 contra o schema atual do Supabase;
2. autorizar e aplicar a migration em produção com snapshot e rollback;
3. homologar envio com contas descartáveis;
4. validar o painel administrativo e o indicador offline em preview;
5. marcar a PR como pronta, fazer merge e executar smoke pós-publicação;
6. configurar verificação periódica do endereço oficial após deploy.
