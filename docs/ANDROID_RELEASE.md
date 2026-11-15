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

O ícone e a splash vêm de `public/icons/kyron-icon.svg`. O Gradle tira `server.mjs`, `server.cjs` e source maps dos assets web antes de empacotar. A API do Express continua em `https://kyron.uno`. Este fluxo só gera o binário.
