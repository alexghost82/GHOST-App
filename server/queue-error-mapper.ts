export interface QueueHttpErrorMapping {
  statusCode: number
  errorMessage: string
}

const AI_CIRCUIT_OPEN_CODE = 'AI_CIRCUIT_OPEN'
const AI_QUOTA_EXCEEDED_PREFIX = 'AI_QUOTA_EXCEEDED:'
const UNKNOWN_INTERNAL_ERROR_MESSAGE = 'שגיאה פנימית לא ידועה.'

export function mapQueueErrorToHttp(error: unknown, actionLabel: string): QueueHttpErrorMapping {
  const rawMessage = error instanceof Error ? error.message : UNKNOWN_INTERNAL_ERROR_MESSAGE

  if (rawMessage === AI_CIRCUIT_OPEN_CODE) {
    return {
      statusCode: 503,
      errorMessage: `${actionLabel}: שירות ה-AI עמוס זמנית. נסו שוב בעוד כ-30 שניות.`,
    }
  }

  if (rawMessage.startsWith(AI_QUOTA_EXCEEDED_PREFIX)) {
    return {
      statusCode: 429,
      errorMessage: `${actionLabel}: visual analysis is unavailable because the AI quota for the configured key is exhausted. Update billing or use a key with available quota and try again.`,
    }
  }

  return {
    statusCode: 502,
    errorMessage: `${actionLabel}: ${rawMessage}`,
  }
}
