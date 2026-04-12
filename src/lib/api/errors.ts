import { ApiError } from "./client"

const ERROR_MESSAGES: Record<number, string> = {
  409: "Content modified externally. Please reload.",
  502: "GitHub is unavailable. Please try again.",
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return ERROR_MESSAGES[error.status] ?? error.message
  }

  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return "Connection lost. Check your network."
  }

  if (error instanceof Error) {
    return error.message
  }

  return "An unexpected error occurred"
}
