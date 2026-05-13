import type { MessagePayload, Operation, OperationScanResult } from './types.js'

export function buildScanMessage(operation: Operation, result: OperationScanResult, frameDataUrl: string, now: Date): MessagePayload {
  const base = {
    author: 'system' as const,
    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    frameDataUrl,
  }

  switch (operation.mode) {
    case 'alert':
      return {
        ...base,
        text: result.critical
          ? `Critical alert | ${operation.name}: ${result.summary || 'Trigger detected.'}`
          : `Routine scan | ${operation.name}: ${result.summary || 'No critical trigger detected.'}`,
        alertLevel: result.critical ? 'critical' : 'routine',
      }
    case 'report':
      return {
        ...base,
        text: `Report | ${operation.name}: ${result.summary || 'No significant findings.'}`,
        alertLevel: 'report',
      }
    case 'rating':
      return {
        ...base,
        text: `Rating | ${operation.name}: ${result.score ?? '-'}/10. ${result.summary || ''}`.trim(),
        alertLevel: 'rating',
        score: result.score,
      }
    case 'assessment':
      return {
        ...base,
        text: `Assessment | ${operation.name}: ${result.summary || 'No significant findings.'}`,
        alertLevel: 'assessment',
      }
  }
}

export function buildScanErrorMessage(
  operation: Operation,
  frameDataUrl: string,
  errorMessage: string,
  now: Date,
): MessagePayload {
  return {
    author: 'system',
    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    frameDataUrl,
    alertLevel: 'report',
    text: `Report | ${operation.name}: scan failed. ${errorMessage}`.trim(),
  }
}
