// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { CaptureQueue } from './capture-queue.js'

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

describe('capture queue', () => {
  it('enforces per-camera locking', async () => {
    const queue = new CaptureQueue({
      maxParallelCaptures: 4,
      maxParallelFfmpegCaptures: 4,
      maxParallelHikvisionCaptures: 4,
      maxParallelPerCamera: 1,
      maxParallelPerHost: 4,
    })

    const order: string[] = []
    const first = queue.enqueue({ cameraId: 'cam-1', kind: 'ffmpeg' }, async () => {
      order.push('first-start')
      await delay(30)
      order.push('first-end')
      return 'first'
    })
    const second = queue.enqueue({ cameraId: 'cam-1', kind: 'ffmpeg' }, async () => {
      order.push('second-start')
      return 'second'
    })

    await Promise.all([first, second])
    expect(order).toEqual(['first-start', 'first-end', 'second-start'])
  })

  it('enforces per-host locking without blocking unrelated hosts', async () => {
    const queue = new CaptureQueue({
      maxParallelCaptures: 3,
      maxParallelFfmpegCaptures: 3,
      maxParallelHikvisionCaptures: 3,
      maxParallelPerCamera: 1,
      maxParallelPerHost: 1,
    })

    let activeSameHost = 0
    let maxSameHost = 0
    const sameHostA = queue.enqueue({ cameraId: 'cam-a', host: '10.0.0.1', kind: 'ffmpeg' }, async () => {
      activeSameHost += 1
      maxSameHost = Math.max(maxSameHost, activeSameHost)
      await delay(25)
      activeSameHost -= 1
      return 'a'
    })
    const sameHostB = queue.enqueue({ cameraId: 'cam-b', host: '10.0.0.1', kind: 'ffmpeg' }, async () => {
      activeSameHost += 1
      maxSameHost = Math.max(maxSameHost, activeSameHost)
      await delay(10)
      activeSameHost -= 1
      return 'b'
    })
    const otherHost = queue.enqueue({ cameraId: 'cam-c', host: '10.0.0.2', kind: 'ffmpeg' }, async () => 'c')

    const results = await Promise.all([sameHostA, sameHostB, otherHost])
    expect(results.sort()).toEqual(['a', 'b', 'c'])
    expect(maxSameHost).toBe(1)
  })

  it('does not let one failed camera block unrelated cameras', async () => {
    const queue = new CaptureQueue({
      maxParallelCaptures: 2,
      maxParallelFfmpegCaptures: 2,
      maxParallelHikvisionCaptures: 2,
      maxParallelPerCamera: 1,
      maxParallelPerHost: 2,
    })

    const failed = queue.enqueue({ cameraId: 'cam-fail', kind: 'ffmpeg' }, async () => {
      throw new Error('boom')
    })
    const succeeded = queue.enqueue({ cameraId: 'cam-ok', kind: 'ffmpeg' }, async () => 'ok')

    await expect(failed).rejects.toThrow('boom')
    await expect(succeeded).resolves.toBe('ok')
  })
})
