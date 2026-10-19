# Widget de registro rápido — semana.

Aplicativo Android auxiliar, com widget 2 × 1 redimensionável. Ao tocar em **+ Registro**, abre `/quick-capture` no PWA/navegador responsável pelo link. A digitação ocorre no formulário web, não dentro do widget. Não guarda senha, token ou registros no Android, e não requer mudanças no banco.

## Instalar

1. Publicar as mudanças web deste branch e testar `https://SUA-URL/quick-capture` no celular.
2. No GitHub, abrir Actions → APK do widget de registro rápido → Run workflow, selecionando o branch que contém esta implementação.
3. Baixar o artefato `semana-registro-rapido-apk`, extrair e instalar `app-debug.apk` no celular. É um APK de teste, não uma versão assinada para distribuição. Builds futuros de debug podem exigir reinstalação por usarem outra chave de assinatura.
4. Abrir **semana. Registro rápido** e informar a URL HTTPS de produção, sem caminho.
5. Manter pressionada a tela inicial do Samsung → Widgets → semana. Registro rápido → adicionar **+ Registro**. A configuração solicita a mesma URL.
6. Tocar no widget e salvar um registro. Confirmar que aparece na Home com horário. Se necessário, entrar com a mesma conta. O navegador que abre o link determina a sessão; use o mesmo da instalação do PWA.

Sem SDK Android neste ambiente de desenvolvimento, a compilação e o lint nativos devem ser executados pelo workflow ou pelo Android Studio antes de considerar o APK validado. Validar também no S25 Ultra: adicionar/redimensionar widget, login vencido, cancelamento, rede indisponível e toque repetido em Salvar. O foco é solicitado pelo formulário, mas a abertura automática do teclado depende do navegador.

## Compilação local

Android Studio com SDK 35, JDK 17 e Gradle 8.11.1. Abrir a pasta `android-widget`, sincronizar e gerar APK; ou executar `gradle -p android-widget :app:assembleDebug :app:lintDebug`.

A URL é compartilhada pelos widgets deste aplicativo. Alterá-la atualiza todos. Não há atualizações periódicas nem serviço em segundo plano.

O manifest web também inclui um atalho Registro rápido, que pode ser disponibilizado pelo navegador ao manter o ícone do PWA pressionado. Esse atalho é uma opção adicional e não substitui o widget Android.
