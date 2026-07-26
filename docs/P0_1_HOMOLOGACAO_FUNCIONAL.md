# KYRON OS — Fase P0.1: Homologação funcional e regressão

## Resultado atual

### Evidência automática

- 4 arquivos de teste aprovados.
- 21 testes aprovados.
- Typecheck/lint aprovado.
- Build aprovado.
- Saída completa dos testes preservada como artefato do GitHub Actions por 7 dias.

### Evidência estrutural do Supabase — somente leitura

- Perfis: 8.
- Registros em `user_access`: 8.
- Perfis órfãos: 0.
- Administradores ativos: 1.
- Usuários ativos: 8.
- Usuários suspensos: 0.
- Usuários Premium: 0.
- Usuários Free: 8.

Nenhum dado foi alterado para produzir esses números.

## Regras de segurança

- Não executar `db_p0_security_integrity.sql` durante esta fase.
- Não usar contas reais para testes destrutivos.
- Não excluir perfis, treinos, históricos ou sessões.
- Não mesclar a PR enquanto algum cenário crítico estiver pendente ou falhando.
- Usar uma conta administrativa de homologação e uma conta atleta de homologação para os testes manuais de mutação.

## Evidência automática obrigatória

A GitHub Action executa, nesta ordem:

1. `npm ci`
2. `npm test`
3. `npm run lint`
4. `npm run build`

A fase automática só é aprovada quando todas as etapas terminarem com `success`.

## H1 — Autorização dos endpoints de IA

### Cobertura automática aprovada

- Extração de Bearer token válida e case-insensitive.
- Rejeição de headers ausentes ou malformados.
- Limites de prompt e system instruction.
- Allowlist do modelo Gemini.
- Bypass de desenvolvimento desativado por padrão.
- Bypass impossível em `production`, mesmo com flag incorreta.

### Teste de integração pendente

#### Sem token

- Fazer uma chamada a `/api/intelligence/proxy` sem `Authorization`.
- Resultado esperado em preview/staging/produção: HTTP `401`.
- Não deve chamar Gemini.

#### Token inválido

- Enviar `Authorization: Bearer token-invalido`.
- Resultado esperado: HTTP `401`.

#### Token válido

- Enviar o access token de uma conta de homologação.
- Resultado esperado: autenticação aceita e requisição processada conforme a disponibilidade da API Gemini.

## H2 — Integridade de `user_access`

### Aprovado

- `profiles` e `user_access` são combinados sem confiar em campos legados.
- `role`, `plan` e `account_status` vêm de `user_access`.
- Perfil sem `user_access` falha de forma fechada.
- Consulta estrutural confirmou zero perfis órfãos.
- Existe exatamente um administrador ativo.

## H3 — Painel administrativo

Os testes abaixo permanecem pendentes porque o banco atual não possui conta suspensa nem Premium e esta fase não deve alterar contas reais apenas para criar evidência.

### Suspender atleta

1. Selecionar uma conta atleta de homologação.
2. Executar “Suspender conta”.
3. Confirmar que a RPC chamada é `admin_update_user_access`.
4. Confirmar `user_access.status = 'suspended'`.
5. Confirmar registro correspondente em `user_access_audit`.
6. Atualizar a página e confirmar que o estado continua suspenso.

### Bloqueio da conta suspensa

1. Entrar com a conta suspensa.
2. Confirmar tela “Acesso bloqueado”.
3. Confirmar que treinos e histórico não foram apagados.
4. Confirmar que as policies restritivas impedem acesso aos dados protegidos.

### Reativar atleta

1. Executar “Reativar conta”.
2. Confirmar `user_access.status = 'active'`.
3. Confirmar auditoria.
4. Entrar novamente e validar Dashboard.

### Alterar plano

- Free → Premium: persistir em `user_access.plan` e sobreviver ao reload.
- Premium → Free: persistir em `user_access.plan` e sobreviver ao reload.
- Não criar chaves de Premium em `localStorage`.

### Proteções administrativas

- Impedir autossuspensão.
- Impedir alteração insegura do último administrador ativo.
- Não disponibilizar exclusão física de usuário pelo navegador.

## H4 — Regressão do Workout Player

### Série adicional

1. Abrir exercício A com três séries e exercício B com três séries.
2. Adicionar uma quarta série ao exercício A.
3. Concluir a série 3/4.
4. Resultado esperado: permanecer no exercício A e abrir a série 4/4.
5. Concluir a série 4/4.
6. Resultado esperado: avançar para exercício B, série 1/3.

### Persistência granular

- Configurar cargas diferentes por série.
- Configurar repetições, RPE, descanso e tipo de série diferentes.
- Recarregar ou retomar a sessão.
- Confirmar que cada série mantém seus próprios valores.

### Proteções

- Clique duplo em “Concluir série” não pode duplicar registro.
- Setas apenas navegam; não concluem séries nem iniciam descanso.
- Último exercício com série extra só encerra depois da última série real.

## H5 — Critério de conclusão

A Fase P0.1 será considerada totalmente aprovada somente quando:

- testes automatizados estiverem verdes — aprovado;
- lint e build estiverem verdes — aprovado;
- integridade estrutural de `user_access` estiver comprovada — aprovado;
- H1 de integração estiver aprovado — pendente;
- H3 estiver aprovado com contas de homologação — pendente;
- H4 tiver evidência real no Player — pendente;
- não houver alteração destrutiva no banco — aprovado até o momento.
