import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import type { PostListItem, PostDetail } from "@/types"

const mockRequireAuth = vi.fn()
vi.mock("@/lib/auth", () => ({
  requireAuth: () => mockRequireAuth(),
}))

const mockParsePostList = vi.fn()
const mockParsePostDetail = vi.fn()
const mockSerializeFrontmatter = vi.fn()
vi.mock("@/lib/mdx/frontmatter", () => ({
  parsePostList: () => mockParsePostList(),
  parsePostDetail: (...args: unknown[]) => mockParsePostDetail(...args),
  serializeFrontmatter: (...args: unknown[]) => mockSerializeFrontmatter(...args),
}))

const mockAtomicCommit = vi.fn()
vi.mock("@/lib/github/commits", () => ({
  atomicCommit: (...args: unknown[]) => mockAtomicCommit(...args),
}))

const mockReadDirectory = vi.fn()
vi.mock("@/lib/github/content", () => ({
  readDirectory: (...args: unknown[]) => mockReadDirectory(...args),
}))

vi.mock("@/lib/mdx/schema", async () => {
  const actual = await vi.importActual<typeof import("@/lib/mdx/schema")>("@/lib/mdx/schema")
  return actual
})

vi.mock("@/lib/mdx/slug", async () => {
  const actual = await vi.importActual<typeof import("@/lib/mdx/slug")>("@/lib/mdx/slug")
  return actual
})

function authedSession() {
  mockRequireAuth.mockResolvedValue({
    session: { user: { name: "test" } },
    error: null,
  })
}

function unauthSession() {
  const { NextResponse } = require("next/server")
  mockRequireAuth.mockResolvedValue({
    session: null,
    error: NextResponse.json(
      { error: { message: "Unauthorized", code: "UNAUTHORIZED" } },
      { status: 401 },
    ),
  })
}

function makeRequest(url: string, options?: RequestInit) {
  return new NextRequest(new URL(url, "http://localhost:3000"), options)
}

const sampleFrontmatter = {
  title: "Test Post",
  description: "A test post",
  date: "2024-01-15",
  slug: "/devops-test-post-240115",
  tags: ["devops"],
}

const samplePostListItem: PostListItem = {
  frontmatter: { ...sampleFrontmatter, banner: undefined, canonicalUrl: undefined, defer: undefined },
  directoryName: "240115-devops-test-post",
  directoryPath: "content/posts/240115-devops-test-post",
  sha: "abc123",
  hasBanner: false,
  images: [],
}

const samplePostDetail: PostDetail = {
  ...samplePostListItem,
  body: "Hello world",
  rawContent: "---\ntitle: Test Post\n---\nHello world",
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("GET /api/posts", () => {
  it("returns post list when authenticated", async () => {
    authedSession()
    mockParsePostList.mockResolvedValue([samplePostListItem])

    const { GET } = await import("@/app/api/posts/route")
    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.data).toHaveLength(1)
    expect(json.data[0].frontmatter.title).toBe("Test Post")
  })

  it("returns 401 when not authenticated", async () => {
    unauthSession()

    const { GET } = await import("@/app/api/posts/route")
    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json.error.code).toBe("UNAUTHORIZED")
  })

  it("returns 502 on GitHub API error", async () => {
    authedSession()
    mockParsePostList.mockRejectedValue(new Error("GitHub down"))

    const { GET } = await import("@/app/api/posts/route")
    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(502)
    expect(json.error.code).toBe("GITHUB_API_ERROR")
  })
})

describe("POST /api/posts", () => {
  const validBody = {
    category: "devops",
    frontmatter: sampleFrontmatter,
    body: "# Hello\n\nThis is content.",
    images: [],
    mode: "direct",
  }

  it("creates a post and returns commitSha", async () => {
    authedSession()
    mockSerializeFrontmatter.mockReturnValue("---\ntitle: Test Post\n---\n# Hello\n\nThis is content.")
    mockAtomicCommit.mockResolvedValue({ commitSha: "new-sha-456" })

    const { POST } = await import("@/app/api/posts/route")
    const req = makeRequest("/api/posts", {
      method: "POST",
      body: JSON.stringify(validBody),
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.data.commitSha).toBe("new-sha-456")
    expect(mockAtomicCommit).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'content(post): add "Test Post"',
        files: expect.arrayContaining([
          expect.objectContaining({ path: "content/posts/240115-devops-test-post/index.mdx" }),
        ]),
      }),
    )
  })

  it("returns 401 when not authenticated", async () => {
    unauthSession()

    const { POST } = await import("@/app/api/posts/route")
    const req = makeRequest("/api/posts", {
      method: "POST",
      body: JSON.stringify(validBody),
    })
    const res = await POST(req)

    expect(res.status).toBe(401)
  })

  it("returns 400 on invalid body", async () => {
    authedSession()

    const { POST } = await import("@/app/api/posts/route")
    const req = makeRequest("/api/posts", {
      method: "POST",
      body: JSON.stringify({ frontmatter: {}, body: "" }),
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it("returns 400 when category is missing", async () => {
    authedSession()

    const { POST } = await import("@/app/api/posts/route")
    const req = makeRequest("/api/posts", {
      method: "POST",
      body: JSON.stringify({ ...validBody, category: undefined }),
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it("handles image uploads as base64", async () => {
    authedSession()
    mockSerializeFrontmatter.mockReturnValue("---\ntitle: Test Post\n---\ncontent")
    mockAtomicCommit.mockResolvedValue({ commitSha: "img-sha" })

    const bodyWithImages = {
      ...validBody,
      images: [{ filename: "hero.png", content: "iVBOR...", type: "banner" }],
    }

    const { POST } = await import("@/app/api/posts/route")
    const req = makeRequest("/api/posts", {
      method: "POST",
      body: JSON.stringify(bodyWithImages),
    })
    const res = await POST(req)

    expect(res.status).toBe(201)
    expect(mockAtomicCommit).toHaveBeenCalledWith(
      expect.objectContaining({
        files: expect.arrayContaining([
          expect.objectContaining({
            path: "content/posts/240115-devops-test-post/hero.png",
            content: "iVBOR...",
            encoding: "base64",
          }),
        ]),
      }),
    )
  })

  it("returns 501 for branch-pr mode", async () => {
    authedSession()

    const { POST } = await import("@/app/api/posts/route")
    const req = makeRequest("/api/posts", {
      method: "POST",
      body: JSON.stringify({ ...validBody, mode: "branch-pr" }),
    })
    const res = await POST(req)

    expect(res.status).toBe(501)
  })
})

describe("GET /api/posts/[slug]", () => {
  it("returns post detail when found", async () => {
    authedSession()
    mockParsePostList.mockResolvedValue([samplePostListItem])
    mockParsePostDetail.mockResolvedValue(samplePostDetail)

    const { GET } = await import("@/app/api/posts/[slug]/route")
    const req = makeRequest("/api/posts/devops-test-post-240115")
    const res = await GET(req, { params: Promise.resolve({ slug: "devops-test-post-240115" }) })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.data.frontmatter.title).toBe("Test Post")
    expect(json.data.body).toBe("Hello world")
  })

  it("returns 404 when post not found", async () => {
    authedSession()
    mockParsePostList.mockResolvedValue([])

    const { GET } = await import("@/app/api/posts/[slug]/route")
    const req = makeRequest("/api/posts/nonexistent")
    const res = await GET(req, { params: Promise.resolve({ slug: "nonexistent" }) })

    expect(res.status).toBe(404)
  })

  it("returns 401 when not authenticated", async () => {
    unauthSession()

    const { GET } = await import("@/app/api/posts/[slug]/route")
    const req = makeRequest("/api/posts/some-slug")
    const res = await GET(req, { params: Promise.resolve({ slug: "some-slug" }) })

    expect(res.status).toBe(401)
  })
})

describe("PUT /api/posts/[slug]", () => {
  const updateBody = {
    frontmatter: sampleFrontmatter,
    body: "Updated content",
    sha: "abc123",
    images: [],
    removedImages: [],
    mode: "direct",
  }

  it("updates a post when SHA matches", async () => {
    authedSession()
    mockParsePostList.mockResolvedValue([samplePostListItem])
    mockSerializeFrontmatter.mockReturnValue("---\ntitle: Test Post\n---\nUpdated content")
    mockAtomicCommit.mockResolvedValue({ commitSha: "updated-sha" })

    const { PUT } = await import("@/app/api/posts/[slug]/route")
    const req = makeRequest("/api/posts/devops-test-post-240115", {
      method: "PUT",
      body: JSON.stringify(updateBody),
    })
    const res = await PUT(req, { params: Promise.resolve({ slug: "devops-test-post-240115" }) })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.data.commitSha).toBe("updated-sha")
    expect(mockAtomicCommit).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'content(post): update "Test Post"',
      }),
    )
  })

  it("returns 409 on SHA mismatch", async () => {
    authedSession()
    mockParsePostList.mockResolvedValue([samplePostListItem])

    const { PUT } = await import("@/app/api/posts/[slug]/route")
    const req = makeRequest("/api/posts/devops-test-post-240115", {
      method: "PUT",
      body: JSON.stringify({ ...updateBody, sha: "stale-sha" }),
    })
    const res = await PUT(req, { params: Promise.resolve({ slug: "devops-test-post-240115" }) })

    expect(res.status).toBe(409)
  })

  it("returns 404 when post not found", async () => {
    authedSession()
    mockParsePostList.mockResolvedValue([])

    const { PUT } = await import("@/app/api/posts/[slug]/route")
    const req = makeRequest("/api/posts/nonexistent", {
      method: "PUT",
      body: JSON.stringify(updateBody),
    })
    const res = await PUT(req, { params: Promise.resolve({ slug: "nonexistent" }) })

    expect(res.status).toBe(404)
  })

  it("returns 401 when not authenticated", async () => {
    unauthSession()

    const { PUT } = await import("@/app/api/posts/[slug]/route")
    const req = makeRequest("/api/posts/some-slug", {
      method: "PUT",
      body: JSON.stringify(updateBody),
    })
    const res = await PUT(req, { params: Promise.resolve({ slug: "some-slug" }) })

    expect(res.status).toBe(401)
  })

  it("handles image removals", async () => {
    authedSession()
    mockParsePostList.mockResolvedValue([samplePostListItem])
    mockSerializeFrontmatter.mockReturnValue("---\n---\ncontent")
    mockAtomicCommit.mockResolvedValue({ commitSha: "del-img-sha" })

    const { PUT } = await import("@/app/api/posts/[slug]/route")
    const req = makeRequest("/api/posts/devops-test-post-240115", {
      method: "PUT",
      body: JSON.stringify({ ...updateBody, removedImages: ["old-banner.png"] }),
    })
    const res = await PUT(req, { params: Promise.resolve({ slug: "devops-test-post-240115" }) })

    expect(res.status).toBe(200)
    expect(mockAtomicCommit).toHaveBeenCalledWith(
      expect.objectContaining({
        deletions: [{ path: "content/posts/240115-devops-test-post/old-banner.png" }],
      }),
    )
  })
})

describe("DELETE /api/posts/[slug]", () => {
  it("deletes all files in the post directory", async () => {
    authedSession()
    mockParsePostList.mockResolvedValue([samplePostListItem])
    mockReadDirectory.mockResolvedValue([
      { name: "index.mdx", path: "content/posts/240115-devops-test-post/index.mdx", sha: "s1", type: "file" },
      { name: "banner.png", path: "content/posts/240115-devops-test-post/banner.png", sha: "s2", type: "file" },
    ])
    mockAtomicCommit.mockResolvedValue({ commitSha: "delete-sha" })

    const { DELETE } = await import("@/app/api/posts/[slug]/route")
    const req = makeRequest("/api/posts/devops-test-post-240115", { method: "DELETE" })
    const res = await DELETE(req, { params: Promise.resolve({ slug: "devops-test-post-240115" }) })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.data.commitSha).toBe("delete-sha")
    expect(mockAtomicCommit).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'content(post): remove "Test Post"',
        files: [],
        deletions: [
          { path: "content/posts/240115-devops-test-post/index.mdx" },
          { path: "content/posts/240115-devops-test-post/banner.png" },
        ],
      }),
    )
  })

  it("returns 404 when post not found", async () => {
    authedSession()
    mockParsePostList.mockResolvedValue([])

    const { DELETE } = await import("@/app/api/posts/[slug]/route")
    const req = makeRequest("/api/posts/nonexistent", { method: "DELETE" })
    const res = await DELETE(req, { params: Promise.resolve({ slug: "nonexistent" }) })

    expect(res.status).toBe(404)
  })

  it("returns 401 when not authenticated", async () => {
    unauthSession()

    const { DELETE } = await import("@/app/api/posts/[slug]/route")
    const req = makeRequest("/api/posts/some-slug", { method: "DELETE" })
    const res = await DELETE(req, { params: Promise.resolve({ slug: "some-slug" }) })

    expect(res.status).toBe(401)
  })
})
