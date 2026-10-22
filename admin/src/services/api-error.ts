export async function getApiError(
  response: Response,
  fallback: string,
): Promise<Error> {
  const errorBody = await response.json().catch(() => null) as {
    message?: unknown
  } | null

  let apiMessage = ''

  if (typeof errorBody?.message === 'string') {
    apiMessage = errorBody.message
  } else if (
    Array.isArray(errorBody?.message) &&
    errorBody.message.every((message): message is string => typeof message === 'string')
  ) {
    apiMessage = errorBody.message.join(', ')
  }

  return new Error(apiMessage || fallback)
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}