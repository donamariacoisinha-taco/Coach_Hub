# KYRON OS — Fluxo de conversão para o primeiro treino

## Objetivo

Reduzir o atrito entre a landing page, a criação da conta, o onboarding e o início do primeiro treino, mantendo a identidade visual clara e premium do KYRON OS.

## Problemas observados

1. O visitante que clicava em “Começar grátis” encontrava uma tela inicialmente orientada para login.
2. A opção de criação de conta ficava escondida em um link secundário.
3. Após o cadastro, o fluxo tentava navegar para o dashboard antes de concluir o onboarding.
4. A tela não explicava claramente o caminho até o primeiro treino.
5. A validação de senha e as mensagens de erro eram pouco objetivas.

## Melhorias implementadas

- criação de conta como modo inicial da autenticação;
- seletor evidente entre “Criar conta” e “Entrar”;
- trilha visual em três etapas: criar conta, personalizar e treinar;
- redirecionamento explícito do cadastro para `/onboarding`;
- login de usuários existentes preservado;
- validação mínima de senha com seis caracteres;
- botão para mostrar ou ocultar a senha;
- mensagens de erro e recuperação mais claras;
- modo convidado mantido como opção secundária;
- identidade visual clara, cartões brancos, azul oficial e fundos suaves preservados;
- suporte antecipado a intenção de autenticação por `history.state.params.mode`.

## Fluxo esperado

1. Visitante abre a landing.
2. Acessa a autenticação.
3. Cria a conta gratuitamente.
4. É direcionado ao onboarding.
5. Informa objetivo, experiência, frequência, ambiente e dados essenciais.
6. O sistema gera e ativa um plano.
7. O usuário seleciona “Iniciar Primeiro Treino”.

## Critérios de validação

- cadastro com sessão imediata abre o onboarding;
- cadastro com auto-login abre o onboarding;
- cadastro que exige confirmação de e-mail apresenta orientação correta;
- login de conta existente continua funcionando;
- recuperação de senha continua disponível;
- modo convidado continua funcionando;
- layout permanece legível em 360 px, 390 px e desktop;
- lint, typecheck, testes, build e smoke passam no CI.
