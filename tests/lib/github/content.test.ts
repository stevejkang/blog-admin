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
  listDirectories,
  readFile,
  readDirectory,
  listPostDirectories,
  listPageDirectories,
  listPostImages,
} from "@/lib/github/content"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("listDirectories", () => {
  it("returns only directory entries", async () => {
    mockGetContent.mockResolvedValue({
      data: [
        { name: "post-1", path: "content/posts/post-1", sha: "abc", type: "dir" },
        { name: "post-2", path: "content/posts/post-2", sha: "def", type: "dir" },
        { name: ".gitkeep", path: "content/posts/.gitkeep", sha: "ghi", type: "file" },
      ],
    })

    const result = await listDirectories("content/posts")

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ name: "post-1", path: "content/posts/post-1", sha: "abc" })
    expect(result[1]).toEqual({ name: "post-2", path: "content/posts/post-2", sha: "def" })
  })

  it("throws when response is not an array (single file)", async () => {
    mockGetContent.mockResolvedValue({
      data: { name: "file.txt", type: "file", sha: "abc", content: "" },
    })

    await expect(listDirectories("some/path")).rejects.toThrow(
      "Expected directory listing for some/path",
    )
  })
})

describe("readFile", () => {
  it("decodes base64 content correctly", async () => {
    const originalContent = "Hello, World!\nLine 2"
    const base64Content = Buffer.from(originalContent).toString("base64")

    mockGetContent.mockResolvedValue({
      data: {
        name: "index.mdx",
        type: "file",
        sha: "abc123",
        content: base64Content,
      },
    })

    const result = await readFile("content/posts/my-post/index.mdx")

    expect(result.content).toBe(originalContent)
    expect(result.sha).toBe("abc123")
  })

  it("throws when response is a directory", async () => {
    mockGetContent.mockResolvedValue({
      data: [{ name: "file.txt", type: "file" }],
    })

    await expect(readFile("content/posts")).rejects.toThrow(
      "Expected file at content/posts",
    )
  })

  it("throws when response is not a file type", async () => {
    mockGetContent.mockResolvedValue({
      data: { name: "subdir", type: "dir", sha: "abc" },
    })

    await expect(readFile("content/posts/subdir")).rejects.toThrow(
      "Expected file at content/posts/subdir",
    )
  })
})

describe("readDirectory", () => {
  it("returns all items with correct properties", async () => {
    mockGetContent.mockResolvedValue({
      data: [
        { name: "index.mdx", path: "p/index.mdx", sha: "a1", type: "file", size: 1024 },
        { name: "banner.png", path: "p/banner.png", sha: "b2", type: "file", size: 2048 },
        { name: "subdir", path: "p/subdir", sha: "c3", type: "dir", size: 0 },
      ],
    })

    const result = await readDirectory("p")

    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({
      name: "index.mdx",
      path: "p/index.mdx",
      sha: "a1",
      type: "file",
      size: 1024,
    })
    expect(result[2].type).toBe("dir")
  })

  it("throws when response is not an array", async () => {
    mockGetContent.mockResolvedValue({
      data: { name: "file.txt", type: "file", sha: "abc", content: "" },
    })

    await expect(readDirectory("some/file")).rejects.toThrow(
      "Expected directory at some/file",
    )
  })
})

describe("listPostDirectories", () => {
  it("calls listDirectories with content/posts", async () => {
    mockGetContent.mockResolvedValue({
      data: [
        { name: "post-1", path: "content/posts/post-1", sha: "abc", type: "dir" },
      ],
    })

    const result = await listPostDirectories()

    expect(mockGetContent).toHaveBeenCalledWith(
      expect.objectContaining({ path: "content/posts" }),
    )
    expect(result).toHaveLength(1)
  })
})

describe("listPageDirectories", () => {
  it("calls listDirectories with content/pages", async () => {
    mockGetContent.mockResolvedValue({
      data: [
        { name: "about", path: "content/pages/about", sha: "xyz", type: "dir" },
      ],
    })

    const result = await listPageDirectories()

    expect(mockGetContent).toHaveBeenCalledWith(
      expect.objectContaining({ path: "content/pages" }),
    )
    expect(result).toHaveLength(1)
  })
})

describe("listPostImages", () => {
  it("returns only image filenames", async () => {
    mockGetContent.mockResolvedValue({
      data: [
        { name: "index.mdx", path: "p/index.mdx", sha: "a", type: "file", size: 100 },
        { name: "banner.png", path: "p/banner.png", sha: "b", type: "file", size: 200 },
        { name: "photo.jpg", path: "p/photo.jpg", sha: "c", type: "file", size: 300 },
        { name: "icon.webp", path: "p/icon.webp", sha: "d", type: "file", size: 400 },
        { name: "data.json", path: "p/data.json", sha: "e", type: "file", size: 50 },
        { name: "subdir", path: "p/subdir", sha: "f", type: "dir", size: 0 },
      ],
    })

    const result = await listPostImages("p")

    expect(result).toEqual(["banner.png", "photo.jpg", "icon.webp"])
  })

  it("is case-insensitive for extensions", async () => {
    mockGetContent.mockResolvedValue({
      data: [
        { name: "PHOTO.PNG", path: "p/PHOTO.PNG", sha: "a", type: "file", size: 100 },
        { name: "image.JPEG", path: "p/image.JPEG", sha: "b", type: "file", size: 200 },
      ],
    })

    const result = await listPostImages("p")

    expect(result).toEqual(["PHOTO.PNG", "image.JPEG"])
  })
})
