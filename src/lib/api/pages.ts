import { fetchApi } from "./client"
import type {
  PageListItem,
  PageDetail,
  CreatePageInput,
  UpdatePageInput,
} from "@/types"

export function fetchPages(): Promise<PageListItem[]> {
  return fetchApi<PageListItem[]>("/api/pages")
}

export function fetchPage(slug: string): Promise<PageDetail> {
  return fetchApi<PageDetail>(`/api/pages/${slug}`)
}

export function createPage(
  input: CreatePageInput,
): Promise<{ sha: string; path: string }> {
  return fetchApi<{ sha: string; path: string }>("/api/pages", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function updatePage(
  slug: string,
  input: UpdatePageInput,
): Promise<{ sha: string; path: string }> {
  return fetchApi<{ sha: string; path: string }>(`/api/pages/${slug}`, {
    method: "PUT",
    body: JSON.stringify(input),
  })
}

export function deletePage(slug: string): Promise<{ sha: string }> {
  return fetchApi<{ sha: string }>(`/api/pages/${slug}`, {
    method: "DELETE",
  })
}
