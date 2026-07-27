# KYRON OS — Produção

## Ambiente oficial

- Domínio oficial: https://kyron.uno/
- Health check: https://kyron.uno/api/health
- Repositório: `donamariacoisinha-taco/Coach_Hub`
- Branch de produção: `main`
- Hospedagem oficial: Hostinger Web App Node.js
- Build ID validado: `HOSTINGER-E1`

## Regra de publicação

- Commits e merges em `main` são destinados ao ambiente de produção da Hostinger.
- A aplicação está conectada ao GitHub e reimplanta a partir da branch `main`.
- URLs antigas da Vercel e URLs contendo `git-` ou nomes de branches devem ser tratadas apenas como previews ou ambientes legados.
- O domínio `https://kyron.uno/` é a referência oficial para validações funcionais.

## Configuração Hostinger

- Framework: Express
- Node.js: 22.x
- Diretório raiz: `./`
- Gerenciador de pacotes: `npm`
- Arquivo de entrada: `dist/server.cjs`
- Build command: `npm run build`
- Start command: `npm start`

## Variáveis de ambiente obrigatórias

- `NODE_ENV=production`
- `NPM_CONFIG_PRODUCTION=false`
- `KYRON_BUILD_ID=HOSTINGER-E1`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`

## Validação concluída

Migração para Hostinger validada em 2026-07-27:

- build concluído;
- servidor Node.js ativo;
- `/api/health` retornando `status: ok`;
- ambiente retornando `production`;
- versão retornando `HOSTINGER-E1`;
- tela real de treino carregando;
- sincronização exibindo `Sincronização em dia`.

## Contingência

Manter a Vercel ativa temporariamente como ambiente legado até a estabilização completa da operação na Hostinger.
