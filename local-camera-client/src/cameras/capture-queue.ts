interface QueueLimits {
  maxParallelCaptures: number
  maxParallelFfmpegCaptures: number
  maxParallelHikvisionCaptures: number
  maxParallelPerCamera: number
  maxParallelPerHost: number
}

export interface CaptureQueueTaskContext {
  cameraId: string
  host?: string
  kind: 'ffmpeg' | 'hikvision' | 'other'
}

interface QueueEntry<T> {
  context: CaptureQueueTaskContext
  priority: number
  run: () => Promise<T>
  resolve: (value: T) => void
  reject: (error: unknown) => void
}

export class CaptureQueue {
  private readonly queue: QueueEntry<any>[] = []
  private readonly activeByCameraId = new Map<string, number>()
  private readonly activeByHost = new Map<string, number>()
  private activeTotal = 0
  private activeFfmpeg = 0
  private activeHikvision = 0

  constructor(private readonly limits: QueueLimits) {}

  enqueue<T>(context: CaptureQueueTaskContext, run: () => Promise<T>, priority = 10): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ context, priority, run, resolve, reject })
      this.queue.sort((a, b) => a.priority - b.priority)
      this.drain()
    })
  }

  private drain(): void {
    let launched = true
    while (launched) {
      launched = false
      const index = this.queue.findIndex((entry) => this.canRun(entry.context))
      if (index < 0) {
        return
      }

      const [entry] = this.queue.splice(index, 1)
      this.markStart(entry.context)
      launched = true

      void entry.run()
        .then((value) => entry.resolve(value))
        .catch((error) => entry.reject(error))
        .finally(() => {
          this.markDone(entry.context)
          this.drain()
        })
    }
  }

  private canRun(context: CaptureQueueTaskContext): boolean {
    if (this.activeTotal >= this.limits.maxParallelCaptures) return false
    if ((this.activeByCameraId.get(context.cameraId) ?? 0) >= this.limits.maxParallelPerCamera) return false
    if (context.host && (this.activeByHost.get(context.host) ?? 0) >= this.limits.maxParallelPerHost) return false
    if (context.kind === 'ffmpeg' && this.activeFfmpeg >= this.limits.maxParallelFfmpegCaptures) return false
    if (context.kind === 'hikvision' && this.activeHikvision >= this.limits.maxParallelHikvisionCaptures) return false
    return true
  }

  private markStart(context: CaptureQueueTaskContext): void {
    this.activeTotal += 1
    this.activeByCameraId.set(context.cameraId, (this.activeByCameraId.get(context.cameraId) ?? 0) + 1)
    if (context.host) {
      this.activeByHost.set(context.host, (this.activeByHost.get(context.host) ?? 0) + 1)
    }
    if (context.kind === 'ffmpeg') this.activeFfmpeg += 1
    if (context.kind === 'hikvision') this.activeHikvision += 1
  }

  private markDone(context: CaptureQueueTaskContext): void {
    this.activeTotal = Math.max(0, this.activeTotal - 1)
    decrementCounter(this.activeByCameraId, context.cameraId)
    if (context.host) decrementCounter(this.activeByHost, context.host)
    if (context.kind === 'ffmpeg') this.activeFfmpeg = Math.max(0, this.activeFfmpeg - 1)
    if (context.kind === 'hikvision') this.activeHikvision = Math.max(0, this.activeHikvision - 1)
  }
}

function decrementCounter(map: Map<string, number>, key: string): void {
  const next = (map.get(key) ?? 0) - 1
  if (next <= 0) {
    map.delete(key)
    return
  }
  map.set(key, next)
}
