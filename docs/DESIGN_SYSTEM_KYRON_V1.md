# Design System Kyron — v1.0

## Logotipo oficial aprovado em 26/11/2026

Fonte original: `Logo Kyron com Fita Gradiente.png`, PNG RGB, 1254 × 1254 pixels, 1.254.765 bytes.

SHA-256: `9c09f2b7ddeee7f85aaf5072162f58fb94f2205a0011dee7ddfb4ea0a8ad1144`.

Identidade: fita abstrata em degradê ciano, azul, laranja e roxo, onda branca central, esfera inferior direita em degradê quente, palavra Kyron em azul-marinho, fundo branco arredondado e margem interna generosa. Não usar figura de corredor, versões anteriores ou recriações. Preservar o arquivo original; variantes técnicas de dimensão e recorte devem derivar dele, sem redesenho ou distorção.

## Aplicação — pendente de inclusão do arquivo original

- Centralizar o PNG original em `public/icons/kyron-official.png` e verificar seu SHA-256.
- Atualizar as referências de marca em `src/App.tsx` (atualmente `/icons/kyron-brand-wordmark.svg`) e demais componentes, inclusive autenticação, landing page e dashboard. Conferir os modos clássico e moderno.
- Atualizar `index.html` (favicon, apple-touch-icon, og:image) e `public/manifest.json` (ícone de instalação, tamanhos e cache); gerar derivados técnicos somente do PNG aprovado. Verificar demais referências aos arquivos SVG legados.
- Preservar layout e funcionalidades não relacionadas à marca.
- Executar `npm run lint`, `npm test`, `npm run build` e `npm run smoke`; validar desktop e mobile, inclusive instalação PWA. Publicar somente após validação e conferir kyron.uno e a produção Vercel.

**Estado:** especificação registrada; o PNG ainda não foi adicionado ao repositório, o aplicativo não foi alterado e a publicação não foi realizada.
