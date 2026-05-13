import { randomUUID } from 'node:crypto'

export interface CaptureWorkItem {
  id: string
  organizationId: string
  channelId: string
  deviceId: string
  cameraId: string
  profile: 'scan-standard' | 'chat-high' | 'scan-low'
  purpose: 'chat' | 'timeline' | 'preview'
  createdAtIso: string
  timeoutMs: number
}

interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (error: unknown) => void
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

interface PendingCaptureRequest {
  work: CaptureWorkItem
  deferred: Deferred<{ frameDataUrl: string; capturedAtIso: string }>
  timeout: NodeJS.Timeout
}

export class LocalAgentCaptureBroker {
  private readonly queueByDeviceId = new Map<string, CaptureWorkItem[]>()
  private readonly pendingByWorkId = new Map<string, PendingCaptureRequest>()
  private readonly waiterByDeviceId = new Map<string, Deferred<CaptureWorkItem | null>>()

  async requestCapture(input: Omit<CaptureWorkItem, 'id' | 'createdAtIso'>): Promise<{ frameDataUrl: string; capturedAtIso: string }> {
    const work: CaptureWorkItem = {
      ...input,
      id: randomUUID(),
      createdAtIso: new Date().toISOString(),
    }
    const deferred = createDeferred<{ frameDataUrl: string; capturedAtIso: string }>()
    const timeout = setTimeout(() => {
      this.pendingByWorkId.delete(work.id)
      deferred.reject(new Error('Local agent capture timed out.'))
    }, input.timeoutMs)

    this.pendingByWorkId.set(work.id, { work, deferred, timeout })
    const waiter = this.waiterByDeviceId.get(work.deviceId)
    if (waiter) {
      this.waiterByDeviceId.delete(work.deviceId)
      waiter.resolve(work)
    } else {
      const queue = this.queueByDeviceId.get(work.deviceId) ?? []
      queue.push(work)
      this.queueByDeviceId.set(work.deviceId, queue)
    }

    return deferred.promise
  }

  async waitForWork(deviceId: string, waitMs: number): Promise<CaptureWorkItem | null> {
    const queue = this.queueByDeviceId.get(deviceId)
    if (queue && queue.length > 0) {
      const work = queue.shift() ?? null
      if (queue.length === 0) {
        this.queueByDeviceId.delete(deviceId)
      }
      return work
    }

    const deferred = createDeferred<CaptureWorkItem | null>()
    this.waiterByDeviceId.set(deviceId, deferred)
    const timeout = setTimeout(() => {
      if (this.waiterByDeviceId.get(deviceId) === deferred) {
        this.waiterByDeviceId.delete(deviceId)
        deferred.resolve(null)
      }
    }, waitMs)

    try {
      return await deferred.promise
    } finally {
      clearTimeout(timeout)
      if (this.waiterByDeviceId.get(deviceId) === deferred) {
        this.waiterByDeviceId.delete(deviceId)
      }
    }
  }

  submitResult(workId: string, deviceId: string, cameraId: string, frameDataUrl: string, capturedAtIso: string): void {
    const pending = this.pendingByWorkId.get(workId)
    if (!pending) {
      throw new Error('Capture request not found or already completed.')
    }
    if (pending.work.deviceId !== deviceId) {
      throw new Error('Capture result device mismatch.')
    }
    if (pending.work.cameraId !== cameraId) {
      throw new Error('Capture result camera mismatch.')
    }

    clearTimeout(pending.timeout)
    this.pendingByWorkId.delete(workId)
    pending.deferred.resolve({ frameDataUrl, capturedAtIso })
  }
}
