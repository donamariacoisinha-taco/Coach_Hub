# KYRON OS — Fluxo de cadastro, onboarding e modo convidado

## Objetivo

Reduzir o atrito entre a landing, a criação da conta, a personalização inicial e o primeiro treino, preservando a identidade visual clara e premium do KYRON OS.

## Fluxo principal

1. O CTA da landing abre a autenticação com `Criar conta` selecionado.
2. O usuário cria a conta com e-mail e senha.
3. Quando existe sessão imediata, o sistema abre `/onboarding`.
4. Quando a confirmação de e-mail é obrigatória, o usuário recebe orientação para confirmar e entrar.
5. Usuários existentes usam a aba `Entrar` e seguem para o dashboard.
6. O onboarding gera e ativa o plano antes de liberar o primeiro treino.

## Modo convidado

O modo convidado é uma demonstração local isolada do Supabase:

- cria uma sessão local com validade de 24 horas;
- cria um perfil local enriquecido, com papel `user`, plano `free` e conta ativa;
- não tenta inserir o identificador fictício `guest-user-id` nas tabelas protegidas por RLS;
- permite que o dashboard use os dados demonstrativos e os fallbacks locais existentes;
- mantém alterações simples do perfil e preferências somente no navegador;
- remove sessão, perfil e caches de demonstração ao sair;
- nunca concede privilégios administrativos ou premium.

Essa estratégia foi adotada porque o projeto não utiliza Anonymous Sign-Ins do Supabase. Caso esse recurso seja habilitado futuramente, o modo convidado poderá migrar para `supabase.auth.signInAnonymously()` com uma revisão específica das políticas RLS.

## Melhorias de interface

- seletor evidente entre `Criar conta` e `Entrar`;
- trilha em três etapas: criar conta, personalizar e treinar;
- validação mínima de senha com seis caracteres;
- controle para mostrar ou ocultar a senha;
- mensagens de erro e recuperação simplificadas;
- modo convidado apresentado como ação secundária;
- fundo claro, cartões brancos e azul oficial do KYRON.

## Critérios de validação

- cadastro novo abre o onboarding;
- login existente abre o dashboard;
- recuperação de senha permanece funcional;
- modo convidado abre o dashboard sem criar ou consultar perfil remoto;
- atualização e saída do perfil convidado não afetam dados reais;
- testes, typecheck, build e smoke test passam no pipeline;
- revisão visual em 360 px, 390 px e desktop.
