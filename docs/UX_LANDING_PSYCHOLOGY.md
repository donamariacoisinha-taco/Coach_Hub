# KYRON OS — Landing Page UX Psychology

## Objetivo

Melhorar a landing page usando psicologia de UX para aumentar clareza, reduzir fricção e orientar o usuário até a primeira ação sem alterar autenticação, banco, treino ou sincronização.

## Princípios aplicados

### 1. Redução de carga cognitiva

A página prioriza uma promessa central em linguagem direta antes de termos técnicos. O usuário entende primeiro o valor e só depois vê detalhes.

### 2. Lei de Hick

A navegação e as chamadas para ação foram simplificadas para reduzir excesso de opções. Cada seção conduz a uma decisão principal.

### 3. Reconhecimento antes de lembrança

A landing mostra uma sessão simulada com carga, série, descanso e sincronização para que o usuário reconheça o funcionamento do produto sem precisar imaginar.

### 4. Redução de ansiedade

A frase `Sem cartão. Sem planilha. Sem configurar tudo sozinho.` remove objeções iniciais comuns antes do cadastro.

### 5. Compromisso progressivo

A jornada é apresentada em três passos: criar perfil, abrir treino guiado e evoluir com memória. Isso reduz a sensação de setup complexo.

### 6. Prova funcional

Em vez de depender apenas de promessa aspiracional, a página mostra microevidências de uso: sessão guiada, próxima ação clara, streak e sincronização.

## Escopo

Alterado:

- `src/components/LandingPage.tsx`

Não alterado:

- Supabase;
- RLS;
- autenticação;
- Workout Player;
- sync offline;
- API Gemini;
- rotas internas;
- domínio oficial.

## Critérios de aceite

- build deve passar;
- TypeScript/lint deve passar;
- smoke deve passar;
- landing deve abrir em `https://kyron.uno/`;
- botões `Começar grátis`, `Criar conta gratuita` e `Entrar` devem manter os fluxos existentes;
- alternância PT/EN deve funcionar sem quebrar layout mobile.
