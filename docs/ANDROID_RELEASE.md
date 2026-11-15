# KYRON OS — release Android

O app na Play Store usa o id `uno.kyron.app`. O nome visível é KYRON OS. `versionName` `1.0.0` e `versionCode` `1` são o primeiro envio. Ainda não existe ficha no Play Console.

O keystore de upload fica só na máquina de quem publica e nos secrets do GitHub. Não commitar `.jks`, `.keystore` nem senha.

## 1. Criar o keystore

No computador do dono, com Java instalado:

```bash
keytool -genkeypair -v \
  -keystore kyron-upload.jks \
  -alias kyron-upload \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

O comando pede a senha do arquivo e a senha da chave. Podem ser a mesma. Guarde as duas e o alias `kyron-upload`. Perder este arquivo impede atualizar o mesmo app na Play Store.

Não coloque o arquivo no repositório.

## 2. Quatro secrets no GitHub

No repositório, em Settings → Secrets and variables → Actions:

| Secret | Valor |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | O arquivo `kyron-upload.jks` em base64, numa linha só |
| `ANDROID_KEYSTORE_PASSWORD` | Senha do arquivo |
| `ANDROID_KEY_ALIAS` | `kyron-upload`, ou o alias escolhido no `keytool` |
| `ANDROID_KEY_PASSWORD` | Senha da chave |

Base64, sem quebra de linha:

```bash
# Linux
base64 -w 0 kyron-upload.jks

# macOS
base64 -i kyron-upload.jks | tr -d '\n'
```

Cole só o texto gerado. Não cole a senha nesse secret.

## 3. Rodar o workflow

Actions → Android release → Run workflow. Ele dispara só manualmente, na branch escolhida.

O job usa Node 24, `npm ci`, `npm run build`, `npx cap sync android`, JDK 21 e Android SDK 36. Depois decodifica o keystore e roda `assembleRelease` e `bundleRelease`. O APK e o AAB assinados ficam nos artefatos da execução, por 14 dias.

Se algum dos quatro secrets estiver vazio, o job para na hora com a lista do que falta. Não publica na Play Store e não altera a Vercel nem a Hostinger.

Build local de debug não precisa desses secrets. Release local sem as variáveis sai sem assinatura e não serve para a Play Store.

## O que o pacote contém

O ícone e a splash vêm de `public/icons/kyron-icon.svg`. O Gradle tira `server.mjs`, `server.cjs` e source maps dos assets web antes de empacotar.

O workflow define `VITE_API_BASE_URL=https://kyron.uno` no build. O app empacotado continua com os arquivos locais. Ele não usa `server.url`. As chamadas `/api` saem para `https://kyron.uno`. No site, sem essa variável, as chamadas continuam no mesmo endereço.

## 4. Republicar o servidor em kyron.uno

O Express só aceita o WebView depois que este código estiver no ar na Hostinger. O dono republica o app Node de `main` no hPanel, depois do merge. Não fazer isso a partir deste PR.

Até lá, o APK chama `https://kyron.uno` e o navegador do WebView bloqueia a resposta: a origem do app é `https://localhost` (e, no iOS futuro, `capacitor://localhost`). O servidor novo libera só essas duas origens, com os métodos `GET` e `POST` e os cabeçalhos `Authorization` e `Content-Type`. O token continua sendo o JWT da Supabase. O site no próprio `kyron.uno` não muda.

Ordem prática: merge, republicar a Hostinger, só então instalar o APK e testar a IA.

## 5. Supabase, no painel

Authentication → URL Configuration → Redirect URLs. Acrescentar exatamente:

`https://kyron.uno/redefinir-senha`

Não colocar `https://localhost`. O e-mail de senha enviado pelo app precisa abrir essa página no site. A Site URL pode continuar `https://kyron.uno`.

Salvar no painel. Nada disso está aplicado por este PR.

## 6. Voltar ao app pelo link da senha

O manifesto declara um App Link só para `https://kyron.uno/redefinir-senha`, com `autoVerify`. O restante do site continua abrindo no navegador.

Isso só passa a abrir o app depois que o arquivo abaixo existir em `https://kyron.uno/.well-known/assetlinks.json`, com `Content-Type: application/json`. Não publicar o arquivo enquanto os SHA-256 forem os placeholders.

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "uno.kyron.app",
      "sha256_cert_fingerprints": [
        "COLOCAR_SHA256_DA_CHAVE_DE_UPLOAD",
        "COLOCAR_SHA256_DA_CHAVE_DE_ASSINATURA_DA_PLAY"
      ]
    }
  }
]
```

A primeira impressão sai do keystore de upload:

```bash
keytool -list -v -keystore kyron-upload.jks -alias kyron-upload
```

Use a linha `SHA256`. A segunda impressão aparece no Play Console, em Integridade do app → Assinatura do app, depois do primeiro envio do AAB. Sem as duas, o Android deixa o link no navegador. A página de nova senha no site ainda funciona.
