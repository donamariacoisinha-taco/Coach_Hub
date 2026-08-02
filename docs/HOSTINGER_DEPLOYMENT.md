# Deploy do KYRON OS na Hostinger

## Modelo recomendado

Usar **Node.js Web App** da Hostinger conectado ao repositório GitHub:

- Repositório: `donamariacoisinha-taco/Coach_Hub`
- Branch de produção: `main`
- Node.js: `24.x`
- Install command: `npm ci`
- Build command: `npm run build`
- Start command: `npm start`
- Porta: fornecida pela variável `PORT` da Hostinger

O servidor já lê `process.env.PORT`, serve o build do Vite e mantém as rotas de API do KYRON OS.

## Variáveis de ambiente

Copiar para a Hostinger as mesmas variáveis usadas na produção atual, especialmente:

- `NODE_ENV=production`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- demais chaves de IA e integrações utilizadas pelo aplicativo

Nunca incluir chaves secretas no repositório.

## Landing Academia sem Medo

Rota pública:

- `/academia-sem-medo/`

Checkout:

- `https://pay.kiwify.com.br/2G5bJVi`

Durante o build, `scripts/buildAcademiaSemMedoAssets.mjs` gera o atlas WebP do casal adulto maduro em:

- `public/academia-sem-medo/assets/couple-atlas.webp`

A landing é servida como arquivo estático público e não depende de autenticação.

## Configuração no hPanel

1. Abrir **Sites → Adicionar site → Aplicativo Web Node.js**.
2. Conectar o GitHub e selecionar `Coach_Hub`.
3. Selecionar a branch `main`.
4. Confirmar Node.js 24.
5. Usar os comandos de instalação, build e inicialização indicados acima.
6. Cadastrar as variáveis de ambiente.
7. Conectar o domínio `kyron.uno`.
8. Fazer o deploy.
9. Testar:
   - `/`
   - `/academia-sem-medo/`
   - `/api/health`
   - autenticação
   - dashboard
   - checkout da Kiwify

## DNS e troca de provedor

Não alterar os registros DNS de `kyron.uno` antes de o deployment da Hostinger estar saudável. Primeiro validar usando o endereço temporário fornecido pela Hostinger. Depois apontar o domínio e manter a implantação anterior disponível até confirmar propagação e estabilidade.

## Critérios de aceite

- build concluído sem erros;
- `/api/health` responde `200`;
- landing pública sem login;
- imagens do casal visíveis em celular e desktop;
- checkout correto;
- autenticação e Supabase funcionando;
- HTTPS ativo;
- nenhuma chave secreta exposta no frontend.
