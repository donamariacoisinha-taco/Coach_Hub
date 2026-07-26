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

- agregador local de eventos operacionais sem transmissão automática;
- retenção máxima de 14 dias;
- no máximo 20 eventos recentes, além de contadores agregados;
- categoria da rota em vez de URL completa;
- classe técnica do erro em vez de mensagem integral;
- faixas de quantidade em vez de valores exatos de alta cardinalidade;
- cobertura de falhas de inicialização e renderização;
- cobertura de mudanças online/offline;
- cobertura da criação da fila, dead-letter e reprocessamento;
- cobertura de ciclos automáticos e manuais de sincronização;
- relatório operacional seguro sem usuário, credencial ou conteúdo do treino;
- diagnóstico de sessão restrito a incidente, build, categoria da rota e classe do erro;
- runbook versionado em `docs/P1_INCIDENT_RUNBOOK.md`;
- testes de sanitização, expiração, agregação e relatório seguro.

### Critérios de aceite

- nenhum evento aceita chaves de dimensão fora da allowlist;
- valores semelhantes a e-mail, senha, token ou Bearer são descartados;
- query string, hash e identificadores de rota não são persistidos;
- o erro completo permanece apenas no console da sessão atual;
- telemetria corrompida ou expirada não impede o aplicativo de abrir;
- falha ao gravar telemetria nunca interrompe o Workout Player ou a sincronização;
- o runbook proíbe limpeza de IndexedDB antes da verificação da fila offline.

## Próximas entregas da P1

1. verificação periódica do endereço oficial após deploy;
2. revisão de retenção e exportação segura da dead-letter queue para suporte técnico;
3. validação visual do painel de sincronização em preview;
4. merge e smoke pós-publicação quando a Vercel liberar novos deployments gratuitos.
