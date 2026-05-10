import { describe, expect, it } from 'vitest'
import { isComplexTrigger, selectVisionDetailLevel, selectVisionModel } from './model-selector'

describe('model-selector', () => {
  it('detects complex triggers by keywords', () => {
    expect(isComplexTrigger('detect objects and count vehicles near the gate')).toBe(true)
    expect(isComplexTrigger('check whether the gate is open')).toBe(false)
  })

  it('selects the stronger model for complex scan tasks', () => {
    const model = selectVisionModel({
      task: 'scan',
      triggerText: 'detect objects and count vehicles',
    })
    expect(model).toBe('gpt-4.1')
  })

  it('honors modelOverride even for simple triggers', () => {
    const model = selectVisionModel({
      task: 'scan',
      triggerText: 'simple check',
      modelOverride: 'gpt-4.1-mini',
    })
    expect(model).toBe('gpt-4.1-mini')
  })

  it('uses lighter detail defaults for simple scan and chat flows', () => {
    expect(selectVisionDetailLevel({ task: 'scan', triggerText: 'check gate status' })).toBe('low')
    expect(selectVisionDetailLevel({ task: 'chat' })).toBe('auto')
  })
})
