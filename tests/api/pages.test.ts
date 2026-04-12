import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn(),
}))

vi.mock("@/lib/github/content", () => ({
  listPageDirectories: vi.fn(),
  readFile: vi.fn(),
  readDirectory: vi.fn(),
}))

vi.mock("@/lib/github/commits", () => ({
  atomicCommit: vi.fn(),
}))

import { requireAuth } from "@/lib/auth"
import { listPageDirectories, readFile, readDirectory } from "@/lib/github/content"
import { atomicCommit } from "@/lib/github/commits"
import { GET, POST } from "@/app/api/pages/route"
import {
  GET as GET_SLUG,
  PUT as PUT_SLUG,
  DELETE as DELETE_SLUG,
} from "@/app/api/pages/[slug]/route"

const mockRequireAuth = requireAuth as ReturnType<typeof vi.fn>
const mockListPageDirectories = listPageDirectories as ReturnType<typeof vi.fn>
const mockReadFile = readFile as ReturnType<typeof vi.fn>
const mockReadDirectory = readDirectory as ReturnType<typeof vi.fn>
const mockAtomicCommit = atomicCommit as ReturnType<typeof vi.fn>

function makeRequest(body?: object): Request {
  return new Request("http://localhost:3000/api/pages", {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
}

function makeSlugParams(slug: string) {
  return { params: Promise.resolve({ slug }) }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockRequireAuth.mockResolvedValue({ session: { user: { name: "test" } }, error: null })
})

describe("GET /api/pages", () => {
  it("returns unauthorized when not authenticated", async () => {
    const unauthorizedResponse = new Response(
      JSON.stringify({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }),
      { status: 401 },
    )
    mockRequireAuth.mockResolvedValue({ session: null, error: unauthorizedResponse })

    const response = await GET()

    expect(response.status).toBe(401)
  })

  it("returns sorted page list", async () => {
    mockListPageDirectories.mockResolvedValue([
      { name: "contact", path: "content/pages/contact", sha: "dir-sha-1" },
      { name: "about", path: "content/pages/about", sha: "dir-sha-2" },
    ])
    mockReadFile.mockImplementation(async (path: string) => {
      if (path.includes("contact")) {
        return {
          content: "---\ntitle: Contact\nslug: /contact\n---\nReach out",
          sha: "sha-contact",
        }
      }
      return {
        content: "---\ntitle: About\nslug: /about\n---\nAbout me",
        sha: "sha-about",
      }
    })

    const response = await GET()
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data).toHaveLength(2)
    expect(json.data[0].frontmatter.title).toBe("About")
    expect(json.data[1].frontmatter.title).toBe("Contact")
  })

  it("skips pages with read errors", async () => {
    mockListPageDirectories.mockResolvedValue([
      { name: "good", path: "content/pages/good", sha: "dir-sha-1" },
      { name: "broken", path: "content/pages/broken", sha: "dir-sha-2" },
    ])
    mockReadFile.mockImplementation(async (path: string) => {
      if (path.includes("broken")) throw new Error("Not Found")
      return {
        content: "---\ntitle: Good\nslug: /good\n---\nContent",
        sha: "sha-good",
      }
    })

    const response = await GET()
    const json = await response.json()

    expect(json.data).toHaveLength(1)
    expect(json.data[0].frontmatter.title).toBe("Good")
  })
})

describe("POST /api/pages", () => {
  it("returns unauthorized when not authenticated", async () => {
    const unauthorizedResponse = new Response(
      JSON.stringify({ error: { message: "Unauthorized" } }),
      { status: 401 },
    )
    mockRequireAuth.mockResolvedValue({ session: null, error: unauthorizedResponse })

    const response = await POST(makeRequest({ frontmatter: {}, body: "x" }))

    expect(response.status).toBe(401)
  })

  it("validates request body", async () => {
    const response = await POST(makeRequest({ frontmatter: { title: "" }, body: "" }))

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error.code).toBe("VALIDATION_ERROR")
  })

  it("creates page with correct path and commit message", async () => {
    mockAtomicCommit.mockResolvedValue({ commitSha: "new-sha-123" })

    const response = await POST(
      makeRequest({
        frontmatter: { title: "About Me", slug: "/about-me" },
        body: "Hello world",
        mode: "direct",
      }),
    )

    const json = await response.json()
    expect(response.status).toBe(201)
    expect(json.data.sha).toBe("new-sha-123")
    expect(json.data.path).toBe("content/pages/about-me/index.mdx")

    expect(mockAtomicCommit).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'content(page): add "About Me"',
        files: [
          expect.objectContaining({
            path: "content/pages/about-me/index.mdx",
          }),
        ],
      }),
    )
  })
})

describe("GET /api/pages/[slug]", () => {
  it("returns page detail", async () => {
    mockReadFile.mockResolvedValue({
      content: "---\ntitle: About\nslug: /about\n---\nAbout content here",
      sha: "sha-about",
    })

    const response = await GET_SLUG(
      new Request("http://localhost:3000/api/pages/about"),
      makeSlugParams("about"),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.frontmatter.title).toBe("About")
    expect(json.data.body).toBe("About content here")
    expect(json.data.sha).toBe("sha-about")
    expect(json.data.directoryName).toBe("about")
  })

  it("returns 404 when page not found", async () => {
    mockReadFile.mockRejectedValue(new Error("Not Found"))

    const response = await GET_SLUG(
      new Request("http://localhost:3000/api/pages/nonexistent"),
      makeSlugParams("nonexistent"),
    )

    expect(response.status).toBe(404)
  })
})

describe("PUT /api/pages/[slug]", () => {
  it("validates request body", async () => {
    const request = new Request("http://localhost:3000/api/pages/about", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frontmatter: {}, body: "", sha: "" }),
    })

    const response = await PUT_SLUG(request, makeSlugParams("about"))

    expect(response.status).toBe(400)
  })

  it("returns 409 on SHA mismatch", async () => {
    mockReadFile.mockResolvedValue({ content: "old", sha: "current-sha" })

    const request = new Request("http://localhost:3000/api/pages/about", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        frontmatter: { title: "About", slug: "/about" },
        body: "Updated",
        sha: "stale-sha",
      }),
    })

    const response = await PUT_SLUG(request, makeSlugParams("about"))

    expect(response.status).toBe(409)
    const json = await response.json()
    expect(json.error.code).toBe("SHA_MISMATCH")
  })

  it("updates page in-place when slug unchanged", async () => {
    mockReadFile.mockResolvedValue({ content: "old", sha: "matching-sha" })
    mockAtomicCommit.mockResolvedValue({ commitSha: "updated-sha" })

    const request = new Request("http://localhost:3000/api/pages/about", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        frontmatter: { title: "About Updated", slug: "/about" },
        body: "New content",
        sha: "matching-sha",
      }),
    })

    const response = await PUT_SLUG(request, makeSlugParams("about"))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.sha).toBe("updated-sha")
    expect(mockAtomicCommit).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'content(page): update "About Updated"',
      }),
    )
  })

  it("handles slug rename with old directory deletion", async () => {
    mockReadFile.mockResolvedValue({ content: "old", sha: "matching-sha" })
    mockReadDirectory.mockResolvedValue([
      { name: "index.mdx", path: "content/pages/about/index.mdx", sha: "f-sha", type: "file" },
    ])
    mockAtomicCommit.mockResolvedValue({ commitSha: "renamed-sha" })

    const request = new Request("http://localhost:3000/api/pages/about", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        frontmatter: { title: "About Us", slug: "/about-us" },
        body: "Renamed content",
        sha: "matching-sha",
      }),
    })

    const response = await PUT_SLUG(request, makeSlugParams("about"))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.path).toBe("content/pages/about-us/index.mdx")
    expect(mockAtomicCommit).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'content(page): rename "About Us"',
        deletions: [{ path: "content/pages/about/index.mdx" }],
      }),
    )
  })
})

describe("DELETE /api/pages/[slug]", () => {
  it("deletes page and all files in directory", async () => {
    mockReadDirectory.mockResolvedValue([
      { name: "index.mdx", path: "content/pages/about/index.mdx", sha: "f-sha", type: "file" },
    ])
    mockReadFile.mockResolvedValue({
      content: "---\ntitle: About\nslug: /about\n---\nContent",
      sha: "sha-about",
    })
    mockAtomicCommit.mockResolvedValue({ commitSha: "deleted-sha" })

    const response = await DELETE_SLUG(
      new Request("http://localhost:3000/api/pages/about", { method: "DELETE" }),
      makeSlugParams("about"),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.sha).toBe("deleted-sha")
    expect(mockAtomicCommit).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'content(page): delete "About"',
        deletions: [{ path: "content/pages/about/index.mdx" }],
      }),
    )
  })

  it("returns 404 when directory is empty", async () => {
    mockReadDirectory.mockResolvedValue([])

    const response = await DELETE_SLUG(
      new Request("http://localhost:3000/api/pages/nonexistent", { method: "DELETE" }),
      makeSlugParams("nonexistent"),
    )

    expect(response.status).toBe(404)
  })

  it("returns 404 when directory not found", async () => {
    mockReadDirectory.mockRejectedValue(new Error("Not Found"))

    const response = await DELETE_SLUG(
      new Request("http://localhost:3000/api/pages/nonexistent", { method: "DELETE" }),
      makeSlugParams("nonexistent"),
    )

    expect(response.status).toBe(404)
  })
})
