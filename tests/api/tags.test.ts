import { describe, it, expect, vi, beforeEach } from "vitest"
import type { PostListItem } from "@/types"

const mockRequireAuth = vi.fn()
const mockParsePostList = vi.fn()

vi.mock("@/lib/auth", () => ({
  requireAuth: () => mockRequireAuth(),
}))

vi.mock("@/lib/mdx/frontmatter", () => ({
  parsePostList: () => mockParsePostList(),
}))

import { GET } from "@/app/api/tags/route"

beforeEach(() => {
  vi.clearAllMocks()
})

function makePost(overrides: Partial<PostListItem["frontmatter"]> & { title: string; slug: string; date: string; tags: string[] }): PostListItem {
  return {
    frontmatter: {
      title: overrides.title,
      description: overrides.description ?? "",
      date: overrides.date,
      slug: overrides.slug,
      tags: overrides.tags,
      banner: overrides.banner,
    },
    directoryName: overrides.slug.replace("/", ""),
    directoryPath: `content/posts/${overrides.slug.replace("/", "")}`,
    sha: "sha-" + overrides.slug,
    hasBanner: !!overrides.banner,
    images: [],
  }
}

describe("GET /api/tags", () => {
  it("returns 401 when not authenticated", async () => {
    const { NextResponse } = await import("next/server")
    mockRequireAuth.mockResolvedValue({
      session: null,
      error: NextResponse.json(
        { error: { message: "Unauthorized", code: "UNAUTHORIZED" } },
        { status: 401 },
      ),
    })

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error.code).toBe("UNAUTHORIZED")
  })

  it("aggregates tags with correct counts and posts", async () => {
    mockRequireAuth.mockResolvedValue({ session: { user: {} }, error: null })
    mockParsePostList.mockResolvedValue([
      makePost({ title: "Post A", slug: "/a", date: "2024-01-01", tags: ["react", "typescript"] }),
      makePost({ title: "Post B", slug: "/b", date: "2024-06-15", tags: ["react", "node"] }),
      makePost({ title: "Post C", slug: "/c", date: "2024-03-10", tags: ["typescript"] }),
    ])

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data).toHaveLength(3)

    const react = body.data.find((t: { name: string }) => t.name === "react")
    expect(react.count).toBe(2)
    expect(react.posts).toHaveLength(2)
    expect(react.posts.map((p: { slug: string }) => p.slug)).toContain("/a")
    expect(react.posts.map((p: { slug: string }) => p.slug)).toContain("/b")

    const typescript = body.data.find((t: { name: string }) => t.name === "typescript")
    expect(typescript.count).toBe(2)

    const node = body.data.find((t: { name: string }) => t.name === "node")
    expect(node.count).toBe(1)
  })

  it("sorts tags by count descending", async () => {
    mockRequireAuth.mockResolvedValue({ session: { user: {} }, error: null })
    mockParsePostList.mockResolvedValue([
      makePost({ title: "P1", slug: "/p1", date: "2024-01-01", tags: ["rare"] }),
      makePost({ title: "P2", slug: "/p2", date: "2024-02-01", tags: ["common", "rare"] }),
      makePost({ title: "P3", slug: "/p3", date: "2024-03-01", tags: ["common"] }),
      makePost({ title: "P4", slug: "/p4", date: "2024-04-01", tags: ["common"] }),
    ])

    const response = await GET()
    const body = await response.json()

    expect(body.data[0].name).toBe("common")
    expect(body.data[0].count).toBe(3)
    expect(body.data[1].name).toBe("rare")
    expect(body.data[1].count).toBe(2)
  })

  it("tracks lastUsed as the most recent date", async () => {
    mockRequireAuth.mockResolvedValue({ session: { user: {} }, error: null })
    mockParsePostList.mockResolvedValue([
      makePost({ title: "Old", slug: "/old", date: "2023-01-01", tags: ["test"] }),
      makePost({ title: "New", slug: "/new", date: "2024-12-25", tags: ["test"] }),
      makePost({ title: "Mid", slug: "/mid", date: "2024-06-15", tags: ["test"] }),
    ])

    const response = await GET()
    const body = await response.json()

    expect(body.data[0].name).toBe("test")
    expect(body.data[0].lastUsed).toBe("2024-12-25")
  })

  it("returns empty array when no posts exist", async () => {
    mockRequireAuth.mockResolvedValue({ session: { user: {} }, error: null })
    mockParsePostList.mockResolvedValue([])

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data).toEqual([])
  })

  it("returns 502 when parsePostList throws", async () => {
    mockRequireAuth.mockResolvedValue({ session: { user: {} }, error: null })
    mockParsePostList.mockRejectedValue(new Error("GitHub API error"))

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(502)
    expect(body.error.code).toBe("GITHUB_API_ERROR")
  })
})
