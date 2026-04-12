import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockGetContent } = vi.hoisted(() => ({
  mockGetContent: vi.fn(),
}))

vi.mock("@/lib/github/client", () => ({
  octokit: {
    repos: {
      getContent: mockGetContent,
    },
  },
  GITHUB_OWNER: "testowner",
  GITHUB_REPO: "testrepo",
  GITHUB_BRANCH: "main",
}))

import {
  parseFrontmatter,
  serializeFrontmatter,
  parsePostList,
  parsePostDetail,
} from "@/lib/mdx/frontmatter"

beforeEach(() => {
  vi.clearAllMocks()
})

const sampleMdx = `---
title: "Better Way to Handle Env"
description: "desc"
date: 2021-03-08
slug: "/devops-better-way-to-handle-env-210308"
tags:
  - devops
  - travis
banner: ./article-banner.png
---
# Content here

Some body text.`

describe("parseFrontmatter", () => {
  it("extracts frontmatter data and body from MDX", () => {
    const result = parseFrontmatter(sampleMdx)

    expect(result.data.title).toBe("Better Way to Handle Env")
    expect(result.data.description).toBe("desc")
    expect(result.data.slug).toBe("/devops-better-way-to-handle-env-210308")
    expect(result.data.tags).toEqual(["devops", "travis"])
    expect(result.data.banner).toBe("./article-banner.png")
    expect(result.content).toContain("# Content here")
    expect(result.content).toContain("Some body text.")
  })

  it("normalizes Date objects from gray-matter to YYYY-MM-DD strings", () => {
    const result = parseFrontmatter(sampleMdx)
    expect(typeof result.data.date).toBe("string")
    expect(result.data.date).toBe("2021-03-08")
  })

  it("trims whitespace from body content", () => {
    const mdx = `---
title: "Test"
---

  Body with leading space  

`
    const result = parseFrontmatter(mdx)
    expect(result.content).toBe("Body with leading space")
  })

  it("handles empty body", () => {
    const mdx = `---
title: "No body"
---
`
    const result = parseFrontmatter(mdx)
    expect(result.content).toBe("")
  })
})

describe("serializeFrontmatter", () => {
  it("produces valid YAML frontmatter with body", () => {
    const frontmatter = {
      title: "Test Post",
      description: "A test",
      date: "2024-01-15",
      slug: "/test-post",
      tags: ["test", "example"],
    }
    const body = "# Hello\n\nBody content."

    const result = serializeFrontmatter(frontmatter, body)

    expect(result).toContain("---")
    expect(result).toContain("title: Test Post")
    expect(result).toContain("description: A test")
    expect(result).toContain("# Hello")
    expect(result).toContain("Body content.")
  })

  it("handles empty body", () => {
    const frontmatter = { title: "Empty" }
    const result = serializeFrontmatter(frontmatter, "")

    expect(result).toContain("---")
    expect(result).toContain("title: Empty")
  })
})

describe("round-trip: parse → serialize → parse", () => {
  it("preserves frontmatter data through round-trip", () => {
    const original = `---
title: "Round Trip Test"
description: "Testing round-trip"
slug: "/round-trip"
tags:
  - alpha
  - beta
---
# Content

Paragraph here.`

    const parsed = parseFrontmatter(original)
    const serialized = serializeFrontmatter(parsed.data, parsed.content)
    const reparsed = parseFrontmatter(serialized)

    expect(reparsed.data.title).toBe(parsed.data.title)
    expect(reparsed.data.description).toBe(parsed.data.description)
    expect(reparsed.data.slug).toBe(parsed.data.slug)
    expect(reparsed.data.tags).toEqual(parsed.data.tags)
    expect(reparsed.content).toContain("# Content")
    expect(reparsed.content).toContain("Paragraph here.")
  })
})

describe("parsePostList", () => {
  it("returns sorted posts with images", async () => {
    mockGetContent.mockImplementation(async ({ path }: { path: string }) => {
      if (path === "content/posts") {
        return {
          data: [
            { name: "post-a", path: "content/posts/post-a", sha: "d1", type: "dir" },
            { name: "post-b", path: "content/posts/post-b", sha: "d2", type: "dir" },
          ],
        }
      }
      if (path === "content/posts/post-a/index.mdx") {
        return {
          data: {
            type: "file",
            sha: "sha-a",
            content: Buffer.from(
              `---\ntitle: "Post A"\ndescription: "A"\ndate: "2024-01-01"\nslug: "/a"\ntags:\n  - test\nbanner: ./banner.png\n---\nBody A`,
            ).toString("base64"),
          },
        }
      }
      if (path === "content/posts/post-b/index.mdx") {
        return {
          data: {
            type: "file",
            sha: "sha-b",
            content: Buffer.from(
              `---\ntitle: "Post B"\ndescription: "B"\ndate: "2024-06-15"\nslug: "/b"\ntags:\n  - test\n---\nBody B`,
            ).toString("base64"),
          },
        }
      }
      if (path === "content/posts/post-a") {
        return {
          data: [
            { name: "index.mdx", path: "content/posts/post-a/index.mdx", sha: "f1", type: "file", size: 100 },
            { name: "banner.png", path: "content/posts/post-a/banner.png", sha: "f2", type: "file", size: 500 },
          ],
        }
      }
      if (path === "content/posts/post-b") {
        return {
          data: [
            { name: "index.mdx", path: "content/posts/post-b/index.mdx", sha: "f3", type: "file", size: 100 },
          ],
        }
      }
      throw new Error(`Unexpected path: ${path}`)
    })

    const result = await parsePostList()

    expect(result).toHaveLength(2)
    expect(result[0].frontmatter.title).toBe("Post B")
    expect(result[1].frontmatter.title).toBe("Post A")
    expect(result[1].images).toEqual(["banner.png"])
    expect(result[1].hasBanner).toBe(true)
    expect(result[0].hasBanner).toBe(false)
  })

  it("skips posts that fail to load", async () => {
    mockGetContent.mockImplementation(async ({ path }: { path: string }) => {
      if (path === "content/posts") {
        return {
          data: [
            { name: "good-post", path: "content/posts/good-post", sha: "d1", type: "dir" },
            { name: "bad-post", path: "content/posts/bad-post", sha: "d2", type: "dir" },
          ],
        }
      }
      if (path === "content/posts/good-post/index.mdx") {
        return {
          data: {
            type: "file",
            sha: "sha-good",
            content: Buffer.from(
              `---\ntitle: "Good"\ndescription: "ok"\ndate: "2024-01-01"\nslug: "/good"\ntags: []\n---\nBody`,
            ).toString("base64"),
          },
        }
      }
      if (path === "content/posts/good-post") {
        return {
          data: [
            { name: "index.mdx", path: "content/posts/good-post/index.mdx", sha: "f1", type: "file", size: 50 },
          ],
        }
      }
      if (path === "content/posts/bad-post/index.mdx") {
        throw new Error("Not found")
      }
      throw new Error(`Unexpected path: ${path}`)
    })

    const result = await parsePostList()

    expect(result).toHaveLength(1)
    expect(result[0].frontmatter.title).toBe("Good")
  })
})

describe("parsePostDetail", () => {
  it("returns full post detail with body and rawContent", async () => {
    const rawMdx = `---\ntitle: "Detail Post"\ndescription: "detail"\ndate: "2024-03-01"\nslug: "/detail"\ntags:\n  - one\nbanner: ./img.png\n---\n# Heading\n\nParagraph.`

    mockGetContent.mockImplementation(async ({ path }: { path: string }) => {
      if (path === "content/posts/my-post/index.mdx") {
        return {
          data: {
            type: "file",
            sha: "sha-detail",
            content: Buffer.from(rawMdx).toString("base64"),
          },
        }
      }
      if (path === "content/posts/my-post") {
        return {
          data: [
            { name: "index.mdx", path: "content/posts/my-post/index.mdx", sha: "f1", type: "file", size: 100 },
            { name: "img.png", path: "content/posts/my-post/img.png", sha: "f2", type: "file", size: 1000 },
            { name: "notes.txt", path: "content/posts/my-post/notes.txt", sha: "f3", type: "file", size: 50 },
          ],
        }
      }
      throw new Error(`Unexpected path: ${path}`)
    })

    const result = await parsePostDetail("content/posts/my-post")

    expect(result.frontmatter.title).toBe("Detail Post")
    expect(result.sha).toBe("sha-detail")
    expect(result.directoryName).toBe("my-post")
    expect(result.directoryPath).toBe("content/posts/my-post")
    expect(result.body).toContain("# Heading")
    expect(result.body).toContain("Paragraph.")
    expect(result.rawContent).toBe(rawMdx)
    expect(result.images).toEqual(["img.png"])
    expect(result.hasBanner).toBe(true)
  })
})
