# Página de vendas — Academia sem Medo

## Objetivo

Criar uma experiência comercial premium no domínio do KYRON OS para apresentar e vender o e-book **Academia sem Medo**, mantendo a identidade editorial aprovada para o produto.

## Endereço

- Produção planejada: `https://kyron.uno/academia-sem-medo/`
- Checkout: `https://pay.kiwify.com.br/2G5bJVi`

A página é estática, pública e independente das rotas autenticadas do aplicativo. Login, Supabase, dashboard, onboarding e Workout Player não são carregados nessa rota.

## Artes oficiais implantadas

A composição utiliza as oito artes validadas do produto:

1. capa oficial no hero;
2. página sobre os medos de começar na seção de objeções;
3. primeiro treino Full Body;
4. descanso e recuperação;
5. proteína no dia a dia;
6. suplementos;
7. apresentação do Kyron OS;
8. suporte por 30 dias.

As imagens foram otimizadas em WebP e empacotadas em arquivos públicos de texto Base64 para preservar as artes no repositório sem adicionar dependências ou alterar a aplicação React. O carregador estático reconstrói a capa e o atlas no navegador.

## Posicionamento

- público iniciante ou retornando à academia;
- segurança, confiança e autonomia;
- foco nos primeiros 30 dias;
- Método COMEÇAR;
- e-book, programa inicial no KYRON OS e suporte por 30 dias.

## Identidade visual

- fundo creme e bege;
- verde profundo e detalhes dourados;
- títulos editoriais serifados;
- cartões claros, bordas discretas e sombras suaves;
- logo oficial do KYRON preservado;
- artes reais do e-book usadas em todas as seções comerciais.

## Conversão e transparência

- todos os CTAs apontam para o checkout informado;
- links externos usam `noopener`, `noreferrer` e identificação `sponsored`;
- nenhum preço foi fixado na página;
- condições e formas de pagamento são apresentadas pela Kiwify;
- aviso de caráter educativo e limitações do suporte incluído;
- CTA fixo no celular;
- FAQ com público, conteúdo, suporte, segurança e pagamento.

## Checklist de revisão

- [ ] abrir `/academia-sem-medo/` no preview;
- [ ] confirmar que as oito artes oficiais carregam;
- [ ] testar em 360 px, 390 px, tablet e desktop;
- [ ] testar todos os botões de compra;
- [ ] confirmar abertura do checkout `2G5bJVi`;
- [ ] validar FAQ e CTA fixo no celular;
- [ ] confirmar que `/`, `/auth` e demais rotas do aplicativo continuam intactas;
- [ ] validar testes, lint, build e smoke no CI;
- [ ] revisar texto jurídico e comercial antes do merge.

## Observação sobre o preview

A rota não possui autenticação do aplicativo. Caso o endereço `*.vercel.app` solicite login, isso é a proteção de Preview Deployment configurada no projeto da Vercel. O domínio de produção `kyron.uno` permanece público após o merge, ou a proteção do preview pode ser desativada nas configurações da Vercel.
