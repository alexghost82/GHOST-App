# Техническое задание: расширение локального клиента GHOST для RTSP и Hikvision SDK

## 1. Назначение документа

Документ описывает доработку `local-camera-client` проекта `GHOST-App` для поддержки IP-камер и камер Hikvision при сохранении текущей логики работы проекта.

Главный принцип: локальный клиент остаётся snapshot-клиентом. Его основная задача — получить один JPEG-кадр с камеры и передать его дальше в существующий backend-пайплайн.

VLC, libVLC, live-preview, видеоплеер и постоянная трансляция видеопотока в рамках данного задания не реализуются и не затрагиваются.

---

## 2. Текущая логика проекта

На данный момент локальный клиент работает по следующей схеме:

```text
USB-камера Windows
  ↓
local-camera-client
  ↓
FFmpeg DirectShow
  ↓
один JPEG snapshot
  ↓
data:image/jpeg;base64,...
  ↓
backend GHOST
  ↓
operation-scan / chat-vision / AI-анализ
```

Текущую логику необходимо сохранить.

После доработки все источники камеры должны приводиться к единому результату:

```ts
Promise<string> // data:image/jpeg;base64,...
```

Backend, AI-логика, scheduler, operation-scan и chat-vision не должны знать, каким способом получен кадр: USB, RTSP или Hikvision SDK.

---

## 3. Цели доработки

### 3.1. Основные цели

1. Добавить поддержку RTSP-камер в локальный клиент.
2. Добавить поддержку камер Hikvision через Hikvision SDK.
3. Для Hikvision-камер использовать SDK-функции получения JPEG snapshot, а не VLC и не live-stream.
4. Добавить поиск камер в локальной сети.
5. Сохранить существующую snapshot-архитектуру проекта.
6. Подготовить локальный клиент к работе с большим количеством камер, включая сценарии 10+ камер.
7. Не затрагивать VLC/libVLC и не добавлять live-preview в рамках этого задания.

### 3.2. Не цели

В рамках задания не реализуются:

- VLC/libVLC;
- live video preview;
- WebRTC/HLS/MJPEG-трансляция;
- постоянное декодирование видеопотоков;
- локальный AI-анализ;
- замена текущего backend-пайплайна;
- передача непрерывного видео на сервер;
- NVR-функциональность;
- запись архива видео.

---

## 4. Ключевой архитектурный принцип

Все типы камер должны работать через единый слой адаптеров.

```text
CameraSource
  ↓
CameraAdapter
  ↓
captureJpeg()
  ↓
Buffer JPEG
  ↓
data:image/jpeg;base64,...
  ↓
существующий GHOST pipeline
```

Нужно избежать жёсткой привязки проекта к одному способу получения изображения.

---

## 5. Новая модель источников камеры

Необходимо добавить универсальный тип источника камеры.

```ts
export type CameraSource =
  | UsbDshowCameraSource
  | RtspCameraSource
  | HikvisionSdkCameraSource

export interface UsbDshowCameraSource {
  type: 'usb-dshow'
  name: string
}

export interface RtspCameraSource {
  type: 'rtsp'
  url: string
  transport?: 'tcp' | 'udp'
  username?: string
  password?: string
}

export interface HikvisionSdkCameraSource {
  type: 'hikvision-sdk'
  host: string
  port: number
  username: string
  password: string
  channel: number
  useHttps?: boolean
}
```

Для UI и backend-сущностей также нужен человекочитаемый label.

```ts
export interface LocalCameraDefinition {
  cameraId: string
  label: string
  source: CameraSource
  enabled: boolean
  createdAtIso: string
  updatedAtIso: string
}
```

---

## 6. Разделение deviceId и cameraId

Текущая архитектура фактически привязывает канал к одному `deviceId` и `cameraName`.

Для поддержки нескольких камер на одном локальном клиенте нужно разделить понятия:

```text
deviceId = локальный агент / компьютер
cameraId = конкретная камера внутри локального агента
channelId = канал GHOST, к которому привязана камера
```

Новая binding-модель:

```ts
export interface LocalAgentBinding {
  deviceId: string
  deviceName: string
  cameraId: string
  cameraLabel: string
  cameraSourceType: 'usb-dshow' | 'rtsp' | 'hikvision-sdk'
  channelId: string
  boundAtIso: string
}
```

Полные секреты камеры, включая RTSP URL с паролем и Hikvision credentials, должны храниться локально в local client storage, а не в открытом виде на backend.

---

## 7. CameraAdapter interface

Необходимо добавить единый интерфейс адаптера камеры.

```ts
export interface CaptureProfile {
  name: 'scan-low' | 'scan-standard' | 'chat-high' | 'preview-test'
  width: number
  height: number
  timeoutMs: number
}

export interface CameraAdapter {
  captureJpeg(camera: LocalCameraDefinition, profile: CaptureProfile): Promise<Buffer>
  testConnection?(camera: LocalCameraDefinition): Promise<CameraTestResult>
}

export interface CameraTestResult {
  ok: boolean
  latencyMs?: number
  frameDataUrl?: string
  error?: string
}
```

Необходимо реализовать адаптеры:

```text
UsbDshowFfmpegAdapter
RtspFfmpegAdapter
HikvisionSdkAdapter
```

---

## 8. USB DirectShow adapter

Существующая логика FFmpeg DirectShow должна быть перенесена в отдельный адаптер без изменения поведения.

Текущий путь:

```text
-f dshow
-video_size 640x360
-i video=<cameraName>
-frames:v 1
-f image2pipe
-vcodec mjpeg
pipe:1
```

Новый адаптер должен возвращать `Buffer` JPEG.

Конвертация в `data:image/jpeg;base64,...` должна выполняться выше, в общем capture-сервисе.

---

## 9. RTSP adapter

### 9.1. Назначение

RTSP adapter нужен для любых IP-камер, которые предоставляют RTSP-поток.

### 9.2. Основная команда FFmpeg

Пример команды:

```bash
ffmpeg \
  -hide_banner \
  -loglevel error \
  -rtsp_transport tcp \
  -timeout 5000000 \
  -i "rtsp://user:pass@192.168.1.50:554/stream1" \
  -frames:v 1 \
  -vf scale=640:360 \
  -f image2pipe \
  -vcodec mjpeg \
  pipe:1
```

### 9.3. Требования

1. По умолчанию использовать `tcp`.
2. Поддержать `udp` как настройку.
3. Добавить timeout подключения.
4. Ошибки FFmpeg должны быть превращены в понятные сообщения.
5. Не держать RTSP-поток постоянно открытым в рамках данного задания.
6. Один capture = один краткоживущий FFmpeg-процесс.
7. Поддержать capture profiles: low, standard, high.

---

## 10. Hikvision SDK adapter

### 10.1. Назначение

Hikvision SDK adapter используется для Hikvision-камер и Hikvision NVR/DVR.

Главная задача — получать JPEG snapshot через функции Hikvision SDK, а не через RTSP-поток.

### 10.2. Основной сценарий

```text
NET_DVR_Init
  ↓
NET_DVR_Login_V40 / login equivalent
  ↓
NET_DVR_CaptureJPEGPicture / JPEG snapshot equivalent
  ↓
JPEG file/buffer
  ↓
Buffer
  ↓
data:image/jpeg;base64,...
```

### 10.3. Требования

1. SDK должен быть изолирован в отдельном модуле.
2. Ошибки SDK должны конвертироваться в понятные ошибки локального клиента.
3. Нельзя логиниться в камеру заново на каждый snapshot, если используется частый capture.
4. Нужно реализовать session pool для Hikvision-устройств.
5. Сессии должны переиспользоваться.
6. При ошибках авторизации сессия должна инвалидироваться.
7. При сетевых ошибках должен быть retry/backoff.
8. Временные JPEG-файлы должны удаляться после чтения.
9. Полные credentials не должны уходить на backend в открытом виде.
10. Hikvision SDK adapter не должен влиять на RTSP и USB adapter.

### 10.4. Session pool

Рекомендуемый интерфейс:

```ts
export interface HikvisionSession {
  key: string
  userId: number
  host: string
  port: number
  username: string
  lastUsedAtMs: number
}

export class HikvisionSessionPool {
  getSession(source: HikvisionSdkCameraSource): Promise<HikvisionSession>
  invalidate(source: HikvisionSdkCameraSource): void
  closeIdleSessions(maxIdleMs: number): void
  closeAll(): void
}
```

### 10.5. Helper process

Так как Hikvision SDK является native SDK, рекомендуется не подключать его напрямую в основной Electron process.

Предпочтительная архитектура:

```text
Electron main / worker
  ↓ IPC / child_process
hikvision-helper.exe / node native helper
  ↓
Hikvision SDK DLL
```

Причины:

- падение native SDK не должно ронять весь локальный клиент;
- проще перезапускать helper;
- проще контролировать memory leaks;
- проще изолировать DLL-зависимости;
- проще логировать низкоуровневые ошибки.

---

## 11. Поиск камер в локальной сети

Необходимо добавить механизм обнаружения камер.

### 11.1. Цели поиска

1. Найти Hikvision-камеры и NVR/DVR в локальной сети.
2. Найти ONVIF/RTSP-совместимые IP-камеры, если возможно.
3. Позволить пользователю быстро добавить найденную камеру в локальный клиент.
4. Не блокировать основной worker.

### 11.2. Методы поиска

Реализовать несколько уровней discovery.

#### Уровень 1: Hikvision SDK discovery

Использовать доступные функции Hikvision SDK для поиска устройств в локальной сети, если SDK предоставляет такую возможность в используемой версии.

Ожидаемые данные:

```ts
export interface DiscoveredCamera {
  discoveryType: 'hikvision-sdk' | 'onvif' | 'network-scan' | 'manual'
  vendor?: string
  model?: string
  serialNumber?: string
  host: string
  port?: number
  macAddress?: string
  suggestedSourceType: 'hikvision-sdk' | 'rtsp'
  suggestedRtspUrls?: string[]
  requiresCredentials: boolean
}
```

#### Уровень 2: ONVIF WS-Discovery

Добавить ONVIF WS-Discovery как универсальный способ найти IP-камеры.

Задача этого этапа — обнаружить устройства и их IP-адреса. Получение RTSP URL может потребовать отдельного ONVIF media-запроса с credentials.

#### Уровень 3: network scan fallback

Опционально добавить fallback-сканирование подсети:

- проверка портов `80`, `443`, `554`, `8000`, `8080`;
- ограничение скорости сканирования;
- timeout на host;
- запрет бесконечного сканирования.

### 11.3. UI discovery flow

```text
1. Пользователь открывает Local Camera Client.
2. Переходит в раздел Cameras.
3. Нажимает Discover cameras.
4. Клиент показывает найденные устройства.
5. Пользователь выбирает устройство.
6. Вводит логин/пароль.
7. Клиент выполняет test snapshot.
8. Если snapshot успешен, камера сохраняется локально.
9. Пользователь привязывает камеру к GHOST channel.
```

---

## 12. Локальное хранение камер

Локальный клиент должен хранить список камер.

```ts
export interface LocalCameraStore {
  version: number
  cameras: LocalCameraDefinition[]
}
```

### 12.1. Требования к хранению

1. Credentials должны храниться локально.
2. По возможности использовать Windows Credential Manager или DPAPI.
3. Если используется файл, чувствительные поля должны быть зашифрованы.
4. Backend не должен получать полный RTSP URL с паролем.
5. В логах нельзя печатать пароли и полный RTSP URL.

### 12.2. Маскирование URL

Для отображения использовать masked URL:

```text
rtsp://admin:******@192.168.1.50:554/Streaming/Channels/101
```

---

## 13. Изменение capture work item

Для поддержки нескольких камер на одном агенте необходимо добавить `cameraId` в work item.

```ts
export interface CaptureWorkItem {
  id: string
  organizationId: string
  channelId: string
  deviceId: string
  cameraId: string
  profile: 'scan-low' | 'scan-standard' | 'chat-high'
  purpose: 'chat' | 'timeline' | 'preview'
  createdAtIso: string
  timeoutMs: number
}
```

`purpose: 'preview'` в данном задании означает только тестовый snapshot/предпросмотр статического кадра, а не live video.

---

## 14. Очередь и лимиты захвата

Локальный клиент должен защищаться от перегрузки.

### 14.1. Глобальные лимиты

```ts
export interface CaptureConcurrencyConfig {
  maxParallelCaptures: number
  maxParallelFfmpegCaptures: number
  maxParallelHikvisionCaptures: number
  maxParallelPerCamera: number
  maxParallelPerHost: number
}
```

Рекомендуемые значения по умолчанию:

```ts
{
  maxParallelCaptures: 4,
  maxParallelFfmpegCaptures: 3,
  maxParallelHikvisionCaptures: 8,
  maxParallelPerCamera: 1,
  maxParallelPerHost: 1
}
```

### 14.2. Требования

1. Никогда не запускать неограниченное количество FFmpeg-процессов.
2. Для одной камеры одновременно допускается только один capture.
3. Для одного Hikvision NVR/host желательно ограничить параллельные snapshot-запросы.
4. При ошибках должен использоваться backoff.
5. Scheduler должен уметь распределять операции по времени, чтобы не запускать все камеры одновременно.

---

## 15. Health status по камерам

Текущий heartbeat нужно расширить так, чтобы локальный клиент мог сообщать состояние нескольких камер.

```ts
export interface LocalCameraHealth {
  cameraId: string
  cameraLabel: string
  sourceType: 'usb-dshow' | 'rtsp' | 'hikvision-sdk'
  status: 'online' | 'degraded' | 'offline'
  lastCaptureAtIso?: string
  lastSuccessfulCaptureAtIso?: string
  lastError?: string
  latencyMs?: number
}
```

Heartbeat агента должен включать:

```ts
export interface LocalAgentHeartbeatPayload {
  channelId?: string
  deviceId: string
  deviceName: string
  status: 'online' | 'scanning' | 'degraded' | 'offline'
  message?: string
  cameras?: LocalCameraHealth[]
}
```

Для обратной совместимости можно временно сохранить старые поля `cameraName` и `channelId`, но новая логика должна использовать `cameraId`.

---

## 16. Изменения по основным файлам

### 16.1. `local-camera-client/src/types.ts`

Добавить:

- `CameraSource`;
- `LocalCameraDefinition`;
- `LocalCameraHealth`;
- `cameraId` в `CaptureWorkItem`;
- расширенный `LocalAgentBinding`.

### 16.2. `local-camera-client/src/camera.ts`

Разделить текущую логику на адаптеры.

Оставить публичную функцию:

```ts
export async function captureFrameDataUrl(
  camera: LocalCameraDefinition,
  profile: CaptureProfile,
): Promise<string>
```

Внутри:

```ts
const adapter = createCameraAdapter(camera.source)
const jpeg = await adapter.captureJpeg(camera, profile)
return `data:image/jpeg;base64,${jpeg.toString('base64')}`
```

### 16.3. Новый модуль `local-camera-client/src/cameras/`

Предлагаемая структура:

```text
local-camera-client/src/cameras/
  camera-adapter.ts
  camera-registry.ts
  camera-store.ts
  capture-service.ts
  adapters/
    usb-dshow-ffmpeg-adapter.ts
    rtsp-ffmpeg-adapter.ts
    hikvision-sdk-adapter.ts
  discovery/
    discovery-service.ts
    hikvision-discovery.ts
    onvif-discovery.ts
    network-scan-discovery.ts
  security/
    secret-store.ts
    mask-url.ts
```

### 16.4. `local-camera-client/src/worker.ts`

Изменить логику capture:

Было:

```ts
captureFrameDataUrl(this.config)
```

Должно стать:

```ts
const camera = this.cameraRegistry.getCamera(work.cameraId)
const frameDataUrl = await this.captureService.captureFrameDataUrl(camera, work.profile)
```

Для scheduled operations канал должен содержать binding с `cameraId`.

### 16.5. `local-camera-client/src/api-client.ts`

Обновить:

- `bindChannel`;
- `sendHeartbeat`;
- `waitForNextWork`;
- `submitCaptureResult`.

Добавить передачу `cameraId` там, где требуется.

### 16.6. `server/local-agent/schemas.ts`

Расширить схемы:

- `LocalAgentBindSchema`;
- `LocalAgentHeartbeatSchema`;
- `LocalAgentWorkPollSchema`, если нужно;
- `LocalAgentWorkResultSchema`, если нужно;
- capture request/result payload.

### 16.7. `server/local-agent/capture-broker.ts`

Добавить `cameraId` в `CaptureWorkItem`.

Очередь может остаться по `deviceId`, но work item должен содержать `cameraId`.

### 16.8. `server/local-agent/create-local-agent-router.ts`

Обновить:

- bind;
- unbind;
- heartbeat;
- capture-request;
- work/next;
- work/result.

Проверка binding должна учитывать пару:

```text
deviceId + cameraId + channelId
```

---

## 17. UI локального клиента

Необходимо добавить раздел управления камерами.

### 17.1. Экран Cameras

Функции:

1. Показать список локально сохранённых камер.
2. Добавить RTSP-камеру вручную.
3. Добавить Hikvision-камеру вручную.
4. Запустить поиск камер в сети.
5. Выполнить test snapshot.
6. Удалить камеру.
7. Переименовать камеру.
8. Привязать камеру к GHOST channel.

### 17.2. Добавление RTSP-камеры

Поля:

- label;
- RTSP URL;
- transport: tcp/udp;
- username/password, если не указаны в URL;
- test snapshot button.

### 17.3. Добавление Hikvision-камеры

Поля:

- label;
- host;
- port;
- username;
- password;
- channel number;
- test snapshot button.

### 17.4. Discovery UI

Показывать:

- IP;
- vendor;
- model;
- serial;
- suggested connection type;
- status;
- action: add / test / ignore.

---

## 18. Ошибки и диагностика

Все ошибки должны быть понятными для пользователя.

### 18.1. Примеры ошибок RTSP

```text
RTSP connection timed out.
Authentication failed.
Camera returned no video frames.
FFmpeg exited with code N.
Camera host is unreachable.
Invalid RTSP URL.
```

### 18.2. Примеры ошибок Hikvision SDK

```text
Hikvision SDK initialization failed.
Hikvision login failed: invalid username or password.
Hikvision device does not support JPEG snapshot for this channel.
Hikvision snapshot timed out.
Hikvision channel is unavailable.
```

### 18.3. Логи

Требования:

1. Не логировать пароли.
2. Не логировать полный RTSP URL с credentials.
3. Логировать cameraId, sourceType, host, masked URL, latency, error code.
4. Логи SDK helper должны быть отдельными.

---

## 19. Безопасность

1. Credentials камер хранятся локально.
2. Backend получает только `cameraId`, `cameraLabel`, `sourceType`, masked metadata.
3. RTSP URL с паролем не должен передаваться на backend.
4. В логах не должно быть паролей.
5. IPC между Electron main и helper-процессом не должен отдавать secrets в renderer без необходимости.
6. При экспорте настроек secrets должны быть исключены или зашифрованы.

---

## 20. Совместимость

После доработки должны продолжить работать:

- текущий USB DirectShow capture;
- текущий local-agent connect;
- текущий bind для одного канала;
- operation-scan;
- chat-vision;
- heartbeat;
- scheduled operations.

Допускается временный compatibility layer:

```ts
if (!binding.cameraId && binding.cameraName) {
  // legacy USB camera binding
}
```

---

## 21. Тестирование

### 21.1. Unit tests

Покрыть:

- `CameraSource` validation;
- RTSP URL masking;
- adapter selection;
- capture queue limits;
- camera registry;
- Hikvision session pool;
- error mapping;
- migration legacy binding → new binding.

### 21.2. Integration tests

Проверить:

1. USB camera snapshot через старую логику.
2. RTSP snapshot через FFmpeg.
3. Hikvision snapshot через SDK/helper.
4. Ошибка авторизации RTSP.
5. Ошибка авторизации Hikvision.
6. Timeout камеры.
7. Одновременные capture requests с лимитом.
8. 10+ камер в registry.
9. Scheduler не запускает все камеры одновременно.
10. Backend получает frameDataUrl как раньше.

### 21.3. Manual QA

Сценарии:

1. Установить локальный клиент на Windows.
2. Подключить USB-камеру.
3. Добавить RTSP-камеру вручную.
4. Добавить Hikvision-камеру вручную.
5. Найти Hikvision-камеру через discovery.
6. Выполнить test snapshot.
7. Привязать камеру к каналу.
8. Запустить scheduled operation.
9. Проверить сообщение с кадром в канале.
10. Отключить камеру от сети и проверить degraded/offline status.

---

## 22. Производительность

### 22.1. Требования

1. Локальный клиент должен поддерживать минимум 10 сохранённых камер.
2. Архитектура должна быть рассчитана на 20–50 камер при ограниченной параллельности.
3. Не должно быть неограниченного spawning FFmpeg-процессов.
4. Hikvision SDK sessions должны переиспользоваться.
5. Discovery не должен блокировать capture worker.
6. Capture timeout должен предотвращать зависание очереди.

### 22.2. Рекомендуемые значения

```ts
const DEFAULT_CAPTURE_TIMEOUT_MS = 10_000
const DEFAULT_RTSP_CONNECT_TIMEOUT_MS = 5_000
const DEFAULT_MAX_PARALLEL_CAPTURES = 4
const DEFAULT_MAX_PARALLEL_FFMPEG_CAPTURES = 3
const DEFAULT_MAX_PARALLEL_HIKVISION_CAPTURES = 8
const DEFAULT_MAX_PARALLEL_PER_CAMERA = 1
const DEFAULT_MAX_PARALLEL_PER_HOST = 1
```

---

## 23. Миграция

### 23.1. Legacy config

Если в сохранённой конфигурации есть только `cameraName`, создать legacy camera definition:

```ts
{
  cameraId: 'legacy-usb-main',
  label: cameraName,
  source: {
    type: 'usb-dshow',
    name: cameraName
  },
  enabled: true
}
```

### 23.2. Legacy binding

Если binding не содержит `cameraId`, использовать `legacy-usb-main`.

---

## 24. Acceptance criteria

Задача считается выполненной, если:

1. USB-камера продолжает работать как раньше.
2. RTSP-камера может быть добавлена вручную.
3. RTSP-камера может сделать test snapshot.
4. RTSP-камера может быть привязана к каналу.
5. Scheduled operation получает кадр с RTSP-камеры и сохраняет результат в канал.
6. Hikvision-камера может быть добавлена вручную.
7. Hikvision-камера получает JPEG snapshot через Hikvision SDK.
8. Hikvision snapshot не использует VLC/libVLC.
9. Локальный клиент умеет искать камеры в локальной сети.
10. Найденную камеру можно добавить и проверить test snapshot.
11. В work item используется `cameraId`.
12. Backend и AI-пайплайн продолжают получать `frameDataUrl` в прежнем формате.
13. Credentials не печатаются в логах.
14. Нельзя запустить неограниченное количество FFmpeg-процессов.
15. VLC/libVLC отсутствует в реализации данного задания.

---

## 25. Рекомендуемый порядок реализации

### Этап 1. Рефакторинг без изменения поведения

1. Вынести текущий USB FFmpeg capture в `UsbDshowFfmpegAdapter`.
2. Добавить `CameraAdapter` interface.
3. Добавить `CameraRegistry`.
4. Сохранить legacy compatibility.
5. Убедиться, что USB работает как раньше.

### Этап 2. RTSP support

1. Добавить `RtspFfmpegAdapter`.
2. Добавить ручное добавление RTSP-камеры.
3. Добавить test snapshot.
4. Добавить bind cameraId → channel.
5. Добавить capture work item с `cameraId`.

### Этап 3. Multi-camera queue

1. Добавить capture queue.
2. Добавить concurrency limits.
3. Добавить per-camera и per-host locks.
4. Добавить health по камерам.

### Этап 4. Hikvision SDK

1. Добавить Hikvision SDK helper.
2. Добавить session pool.
3. Добавить `HikvisionSdkAdapter`.
4. Добавить test snapshot через SDK.
5. Добавить error mapping.

### Этап 5. Discovery

1. Добавить Hikvision discovery.
2. Добавить ONVIF discovery.
3. Добавить fallback network scan, если нужно.
4. Добавить UI для найденных камер.

### Этап 6. Hardening

1. Secret storage.
2. Логи без credentials.
3. Retry/backoff.
4. Long-run test с 10+ камерами.
5. Regression test USB.

---

## 26. Итоговая целевая схема

```text
USB DirectShow camera ┐
RTSP camera           ├─ CameraAdapter ─ captureJpeg ─ data:image/jpeg;base64 ─ GHOST backend ─ AI
Hikvision SDK camera  ┘
```

Ключевое требование: независимо от источника камеры, весь существующий GHOST pipeline должен получать один и тот же результат — JPEG snapshot в формате `data:image/jpeg;base64,...`.
