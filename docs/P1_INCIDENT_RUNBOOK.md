# KYRON OS — Runbook de incidentes

## Objetivo

Fornecer um procedimento único para diagnosticar, conter e recuperar falhas do KYRON OS sem apagar dados locais, expor credenciais ou ampliar o impacto do incidente.

## Regras obrigatórias

1. Não limpar cache, armazenamento do site ou IndexedDB antes de verificar a fila offline.
2. Não excluir itens da dead-letter queue para “resolver” um alerta.
3. Não compartilhar token, senha, chave Supabase, chave Gemini ou conteúdo integral do console.
4. Não executar migration, rollback ou alteração de usuário sem identificar projeto e ambiente.
5. Toda mudança corretiva deve passar por testes, TypeScript, build e smoke antes do merge.
6. Não usar contas reais para reproduzir suspensão, promoção administrativa ou falha destrutiva.

## Classificação de severidade

### SEV-0 — Integridade em risco

- dados de treino desaparecendo ou atribuídos ao usuário errado;
- acesso administrativo indevido;
- escrita em banco por conta suspensa;
- exclusão ou corrupção em massa.

**Ação:** interromper deploys, bloquear a funcionalidade afetada e preservar evidências. Não tentar corrigir pelo navegador.

### SEV-1 — Aplicação indisponível

- página oficial totalmente branca;
- aplicação não inicializa para vários usuários;
- login indisponível para todos;
- servidor ou endpoint de saúde fora do ar.

**Ação:** confirmar deploy, verificar `/api/health`, comparar com o último build estável e preparar rollback.

### SEV-2 — Função crítica degradada

- Workout Player abre, mas não conclui ou não avança;
- sincronização acumula itens pendentes;
- dead-letter queue cresce;
- IA autenticada falha para todos.

**Ação:** preservar operações locais, identificar o módulo e separar conexão, autenticação e regra de dados.

### SEV-3 — Falha isolada ou recuperável

- uma tela apresenta o Error Boundary;
- uma operação individual precisa de nova tentativa;
- problema restrito a um dispositivo ou sessão.

**Ação:** registrar código do incidente, build, horário e estado da sincronização; usar as opções de recuperação da interface.

## Primeiros cinco minutos

1. Confirmar endereço, horário, dispositivo e build exibido.
2. Verificar `/api/health` no deployment afetado.
3. Conferir o último commit na `main` e os checks do GitHub Actions.
4. Conferir o deployment principal `kyron-os` na Vercel.
5. Não executar nova migration, merge ou deploy até identificar o domínio da falha.
6. Preservar o código do incidente `KY-*` e o diagnóstico seguro.

## Evidências mínimas

Registrar apenas:

- data e horário aproximados;
- endereço oficial ou preview utilizado;
- código do incidente exibido;
- build exibido;
- estado online/offline;
- contagem de operações pendentes e falhas;
- captura da tela sem informações pessoais;
- ação imediatamente anterior ao erro;
- resultado de testes, build, smoke e `/api/health`.

Não registrar e-mail, senha, token, payload de treino, histórico completo ou conteúdo de APIs.

## Fluxo 1 — Página branca ou falha de inicialização

1. Confirmar que o endereço é oficial e não um preview expirado.
2. Abrir em aba anônima para separar cache de falha real.
3. Verificar se aparece a tela “Não foi possível iniciar o KYRON OS”.
4. Consultar o status do deployment atual.
5. Confirmar no CI: testes, TypeScript, build, smoke, servidor e `/api/health`.
6. Comparar o commit publicado com o último commit estável.
7. Se o erro começou após deploy e afeta vários usuários, restaurar o deployment estável antes de iniciar nova funcionalidade.

## Fluxo 2 — Error Boundary após o aplicativo abrir

1. Registrar o código `KY-...` e o build.
2. Usar **Tentar novamente** uma vez.
3. Se persistir, usar **Recarregar aplicativo**.
4. Confirmar a categoria de rota afetada.
5. Consultar no painel administrativo os agregados `app_runtime_error`, `app_recovery_retry` e `app_recovery_reload`.
6. Não copiar mensagem completa do console para sistemas externos sem revisão.

## Fluxo 3 — Sincronização pendente

1. Abrir **Sincronização offline**.
2. Confirmar conexão e quantidade de itens pendentes.
3. Usar **Sincronizar agora**.
4. Aguardar atualização do painel.
5. Se os itens continuarem pendentes, não limpar o navegador.
6. Consultar `sync_cycle_failed` e o build afetado no painel administrativo.

## Fluxo 4 — Revisão necessária / dead-letter queue

1. Confirmar que os dados continuam preservados no dispositivo.
2. Reprocessar um item individual primeiro.
3. Validar se o item retorna à fila principal e é enviado.
4. Usar reprocessamento em bloco somente após o teste individual.
5. Se a falha retornar, classificar como `foreign_key`, `retry_limit`, `critical` ou `sync_failure`.
6. Não apagar o item para reduzir o contador.
7. Escalar para SEV-2 quando `sync_dead_lettered` crescer em vários dispositivos ou builds.

## Fluxo 5 — Login ou autorização

1. Confirmar o projeto Supabase correto.
2. Verificar se o usuário possui `profiles` e `user_access`.
3. Confirmar `status`, `role` e `plan` sem alterar o registro.
4. Não usar `localStorage` como fonte de verdade para admin, Premium ou suspensão.
5. Para alteração administrativa, usar somente a RPC auditada.
6. Preservar o último administrador ativo.

## Fluxo 6 — IA indisponível

1. Confirmar `/api/health` antes de concluir que o servidor está fora do ar.
2. Verificar autenticação Bearer e validade da sessão.
3. Confirmar configuração da chave Gemini sem exibir o valor.
4. Diferenciar `401`, `429` e `5xx`.
5. Não liberar bypass de autenticação em produção.

## Procedimento de rollback de aplicação

1. Identificar o último deployment comprovadamente estável.
2. Registrar commit atual, commit estável e horário da decisão.
3. Restaurar o deployment estável na Vercel ou reverter o commit defeituoso em nova PR.
4. Não reescrever o histórico da `main`.
5. Após o rollback, validar página inicial, login, painel, Workout Player, sincronização e `/api/health`.
6. Manter a correção definitiva em PR separada.

## Procedimento de rollback de banco

Usar somente com autorização explícita e após identificar a migration responsável.

1. Capturar snapshot de policies, funções, grants e contagens de integridade.
2. Usar o rollback versionado correspondente.
3. Executar em transação sempre que possível.
4. Validar perfis órfãos, administrador ativo, policies e RPCs.
5. Executar homologação integrada após a reversão.
6. Nunca reverter o banco apenas porque uma tela apresenta erro de frontend.

## Critérios de rollback imediato

- tela branca ou erro de bootstrap após deploy;
- login bloqueado para contas ativas;
- aumento abrupto de `app_runtime_error` no build novo;
- aumento de `sync_dead_lettered` ou `sync_cycle_failed` sem causa externa conhecida;
- perda de acesso administrativo;
- policy RLS impedindo operação legítima confirmada;
- smoke de produção falhando.

## Telemetria e privacidade

A telemetria operacional:

- mantém no dispositivo somente contadores e até 20 eventos recentes;
- expira localmente após 14 dias;
- reduz a URL a uma categoria de rota;
- armazena classe do erro, nunca a mensagem integral;
- usa faixas de contagem em vez de valores de alta cardinalidade;
- envia ao Supabase apenas `event_name`, `route_group`, `build` e `count`;
- agrega os dados por dia e não persiste identificador de usuário;
- não inclui e-mail, token, credencial, nome de exercício, conteúdo de treino ou payload offline;
- permite leitura persistente somente a administradores via RLS;
- interrompe o envio silenciosamente quando a migration ainda não estiver aplicada.

## Critérios de recuperação

Um incidente é considerado recuperado quando:

- o endereço oficial abre sem tela branca;
- `/api/health` responde corretamente;
- login e perfil carregam;
- Workout Player completa o fluxo crítico;
- fila pendente não cresce continuamente;
- dead-letter queue não recebe novas falhas equivalentes;
- telemetria não indica recorrência no build corrigido;
- CI e smoke estão aprovados;
- nenhuma conta de homologação permanece privilegiada ou ativa sem necessidade.

## Encerramento do incidente

Documentar:

- causa raiz confirmada;
- impacto;
- correção ou rollback aplicado;
- validações executadas;
- evidência de não recorrência;
- ação preventiva necessária;
- decisão sobre novos alertas, testes ou atualização deste runbook.
