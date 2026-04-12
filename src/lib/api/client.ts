export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function fetchApi<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const json = await res.json();

  if (!res.ok) {
    throw new ApiError(
      res.status,
      json.error?.code || "UNKNOWN",
      json.error?.message || "An error occurred",
      json.error?.details,
    );
  }

  return json.data;
}
