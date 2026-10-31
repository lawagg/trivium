# Подпись сборок и предупреждения систем

Коротко: подпись нужна не для работы программы, а чтобы Windows и macOS
не показывали «неизвестный издатель». Для открытого проекта есть бесплатный путь.

---

## Windows: почему появляется предупреждение

SmartScreen показывает «Система Windows защитила ваш компьютер» любому `.exe`,
у которого нет цифровой подписи и нет истории загрузок. Это не детект вируса
и не претензия к коду.

**Что может сделать пользователь (одноразово):**

1. «Подробнее» → «Выполнить в любом случае».
2. Либо снять метку заранее: правый клик по файлу → Свойства → «Разблокировать»,
   или в PowerShell: `Get-ChildItem -Recurse | Unblock-File`.
3. Метка «из интернета» не появляется, если файл перенесён на флешке или
   по локальной сети.

---

## Бесплатная подпись: SignPath Foundation

SignPath Foundation подписывает релизы открытых проектов своим сертификатом —
бесплатно. Их сертификат имеет общую репутацию, поэтому предупреждение
SmartScreen, как правило, не появляется.

### Что требуется

* публичный репозиторий (GitHub, GitLab и т. п.);
* лицензия, признанная OSI (у нас MIT — подходит; BUSL и прочие
  «source-available» не подходят);
* сборка артефактов в CI — SignPath подписывает то, что собрано автоматически,
  а не загруженный вручную файл;
* отсутствие коммерческого использования.

### Как подать заявку

1. Открыть **https://signpath.org/** и нажать «Apply for free signing»
   (форма Foundation — заявка бесплатная).
2. Заполнить поля. Ниже — готовые формулировки под этот проект:

   **Project name:** Trivium

   **Repository:** https://github.com/lawagg/trivium

   **License:** MIT

   **Short description:**
   > Desktop app for comparative judging of two songs. Judges move comparison
   > sliders for nine criteria, the app computes the result and shows a nine-axis
   > radar plus a breakdown of which criteria each song won. Python + PySide6
   > (Qt Quick), fully offline.

   **Why do you need code signing?**
   > The app is distributed as a portable Windows build to a small community of
   > music judges. Unsigned binaries trigger SmartScreen, and users have no
   > reliable way to verify the publisher. Signing removes that friction and
   > gives a verifiable identity.

   **Is the project commercial?**
   > No. Free, no monetization, no paid tiers, no telemetry.

   **How are releases built?**
   > GitHub Actions workflow `.github/workflows/build.yml`. Windows build via
   > PyInstaller is packed into `Trivium-Windows.zip`; artifacts are published
   > on tag push through GitHub Releases.

   **Release cadence:** по факту — по мере правок, обычно не чаще раза в месяц.

3. Отправить и ждать ответа (обычно от нескольких дней до двух недель).
   Заявку могут отклонить, если проект выглядит заброшенным или не имеет
   истории — поэтому к моменту подачи лучше иметь пару релизов, README
   со скриншотами и осмысленную историю коммитов.

### После одобрения

1. Установить GitHub App «SignPath» на репозиторий.
2. Взять в личном кабинете **Organization ID** и выпустить **API token**.
3. Добавить их в Settings → Secrets and variables → Actions:
   `SIGNPATH_ORGANIZATION_ID`, `SIGNPATH_API_TOKEN`.
4. В кабинете SignPath создать проект `trivium`, политику подписи
   `release-signing` и конфигурацию артефакта `exe` (какие файлы подписывать:
   сам `.exe` и ключевые `.dll`/`.pyd`).
5. В [.github/workflows/build.yml](../.github/workflows/build.yml) раскомментировать
   блок «Подпись через SignPath» и убедиться, что артефакт сначала загружается
   как artifact, а подписанный — скачивается и попадает в релиз.
6. Проверить подпись: правый клик по `.exe` → Свойства → «Цифровые подписи».

### Альтернатива

**Certum Open Source Code Signing** — ~30 € разово (не подписка), тоже требует
публичный репозиторий. Подходит, если SignPath отказал.

### Чего не бывает

* бесплатного сертификата для закрытого кода;
* «подписи без верификации личности» — удостоверяющий центр всегда проверяет
  заявителя;
* самоподписанный сертификат не помогает чужим людям: он не входит в их
  хранилище доверенных корней.

---

## macOS

`Trivium.app` без подписи Apple не запускается двойным кликом у постороннего
человека. Бесплатного способа это убрать нет: нужна учётная запись
Apple Developer (99 $/год) и нотаризация.

**Что может сделать пользователь:**

1. Правый клик по `Trivium.app` → «Открыть» → «Открыть».
2. Либо: Системные настройки → Конфиденциальность и безопасность →
   внизу «Всё равно открыть».
3. Либо в терминале: `xattr -dr com.apple.quarantine Trivium.app`.

На новых версиях macOS пункт 1 иногда убран — тогда работает пункт 2.

---

## Что делать, если антивирус ругается

Подпись не отменяет ложных срабатываний эвристик, но уменьшает их. Практика:

* **сборка «папкой», а не одним файлом** — антивирусы заметно спокойнее,
  потому что нет самораспаковывающегося архива;
* **без UPX** — упакованные файлы подозрительны (в наших сборках UPX отключён);
* **максимально урезать состав** — меньше лишних модулей Qt, меньше поводов;
* **раздача через GitHub Releases** — исходники видны, есть история, скриншоты
  и контрольные суммы.
