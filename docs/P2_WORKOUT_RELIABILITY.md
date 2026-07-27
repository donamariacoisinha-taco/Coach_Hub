# P2 — Confiabilidade do Workout Player

## Objetivo

Garantir que uma sessão de treino possa ser iniciada, executada, interrompida, retomada e concluída sem pular séries, duplicar progresso ou restaurar posições inválidas.

## Entrega P2.1 — Contratos de progressão e retomada

### Implementado

- motor puro de decisão de avanço;
- normalização de índice de exercício e número da série;
- navegação segura para próxima série, próximo exercício e finalização;
- navegação segura para a série anterior;
- reconciliação determinística entre continuidade local e logs remotos;
- precedência dos logs remotos para séries confirmadas;
- preservação dos dados locais ainda não sincronizados;
- descarte de logs remotos inválidos ou de exercícios ausentes;
- seleção do log remoto mais recente quando existe duplicidade;
- serialização segura de `Set` para continuidade em `localStorage`;
- store persistida usando o mesmo motor de navegação;
- endurecimento da inicialização de sessão contra coordenadas inválidas;
- teste de contrato simulando uma sessão completa com dois exercícios e cinco séries.

## Regras de integridade

1. Uma série só avança para a próxima série quando ainda existem séries no exercício atual.
2. O próximo exercício sempre começa na série 1.
3. A finalização só ocorre na última série do último exercício.
4. Uma posição persistida fora dos limites é corrigida antes de entrar na store.
5. Logs remotos confirmados substituem o valor local correspondente.
6. Séries locais ainda não confirmadas permanecem preservadas.
7. Logs para exercícios desconhecidos ou séries menores que 1 são ignorados.
8. Nenhuma função de reconciliação altera os objetos recebidos.

## Cobertura inicial

- contagem configurada versus contagem runtime;
- posições negativas, não numéricas e acima do limite;
- avanço de série;
- avanço de exercício;
- finalização;
- retorno de série;
- retorno ao exercício anterior;
- retomada apenas local;
- reconciliação local/remota;
- duplicidade remota;
- logs inválidos;
- serialização da continuidade;
- fluxo completo de ponta a ponta no domínio;
- inicialização por sessão parcial e por novo histórico.

## Não alterado nesta entrega

- banco Supabase;
- RLS;
- formato dos logs de treino;
- layout do Workout Player;
- cálculo de progressão de carga;
- fluxo de conclusão em produção.

## Próxima entrega

Integrar o reconciliador puro ao processo de hidratação do `WorkoutPlayer.tsx`, adicionar telemetria de divergência e validar o fluxo em preview mobile antes do merge.
