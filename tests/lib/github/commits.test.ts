import { describe, it, expect, vi, beforeEach } from "vitest"
import { getLatestCommit, atomicCommit } from "@/lib/github/commits"

vi.mock("@/lib/github/client", () => ({
  octokit: {
    git: {
      getRef: vi.fn(),
      getCommit: vi.fn(),
      createBlob: vi.fn(),
      createTree: vi.fn(),
      createCommit: vi.fn(),
      updateRef: vi.fn(),
    },
  },
  GITHUB_OWNER: "test-owner",
  GITHUB_REPO: "test-repo",
  GITHUB_BRANCH: "main",
}))

import { octokit } from "@/lib/github/client"

const git = octokit.git as unknown as {
  getRef: ReturnType<typeof vi.fn>
  getCommit: ReturnType<typeof vi.fn>
  createBlob: ReturnType<typeof vi.fn>
  createTree: ReturnType<typeof vi.fn>
  createCommit: ReturnType<typeof vi.fn>
  updateRef: ReturnType<typeof vi.fn>
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("getLatestCommit", () => {
  it("returns commitSha and treeSha", async () => {
    git.getRef.mockResolvedValue({
      data: { object: { sha: "commit-sha-123" } },
    })
    git.getCommit.mockResolvedValue({
      data: { tree: { sha: "tree-sha-456" } },
    })

    const result = await getLatestCommit("main")

    expect(result).toEqual({
      commitSha: "commit-sha-123",
      treeSha: "tree-sha-456",
    })
    expect(git.getRef).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      ref: "heads/main",
    })
    expect(git.getCommit).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      commit_sha: "commit-sha-123",
    })
  })
})

describe("atomicCommit", () => {
  function setupMocks() {
    git.getRef.mockResolvedValue({
      data: { object: { sha: "parent-sha" } },
    })
    git.getCommit.mockResolvedValue({
      data: { tree: { sha: "base-tree-sha" } },
    })
    git.createBlob.mockResolvedValue({
      data: { sha: "blob-sha-img" },
    })
    git.createTree.mockResolvedValue({
      data: { sha: "new-tree-sha" },
    })
    git.createCommit.mockResolvedValue({
      data: { sha: "new-commit-sha" },
    })
    git.updateRef.mockResolvedValue({})
  }

  it("commits MDX + base64 image atomically", async () => {
    setupMocks()

    const result = await atomicCommit({
      message: "Add new post",
      files: [
        { path: "content/posts/hello.mdx", content: "---\ntitle: Hello\n---" },
        { path: "public/images/hero.png", content: "iVBOR...", encoding: "base64" },
      ],
    })

    expect(git.createBlob).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      content: "iVBOR...",
      encoding: "base64",
    })

    expect(git.createTree).toHaveBeenCalledWith(
      expect.objectContaining({
        base_tree: "base-tree-sha",
      }),
    )

    const treeCall = git.createTree.mock.calls[0][0]
    expect(treeCall.tree).toEqual(
      expect.arrayContaining([
        { path: "content/posts/hello.mdx", mode: "100644", type: "blob", content: "---\ntitle: Hello\n---" },
        { path: "public/images/hero.png", mode: "100644", type: "blob", sha: "blob-sha-img" },
      ]),
    )

    expect(git.createCommit).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      tree: "new-tree-sha",
      parents: ["parent-sha"],
      message: "Add new post",
    })

    expect(git.updateRef).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      ref: "heads/main",
      sha: "new-commit-sha",
    })

    expect(result).toEqual({ commitSha: "new-commit-sha" })
  })

  it("handles file deletions with sha: null", async () => {
    setupMocks()

    await atomicCommit({
      message: "Delete old post",
      files: [],
      deletions: [{ path: "content/posts/old.mdx" }],
    })

    const treeCall = git.createTree.mock.calls[0][0]
    expect(treeCall.tree).toContainEqual({
      path: "content/posts/old.mdx",
      mode: "100644",
      type: "blob",
      sha: null,
    })
  })

  it("always includes base_tree to preserve existing files", async () => {
    setupMocks()

    await atomicCommit({
      message: "Any commit",
      files: [{ path: "test.md", content: "test" }],
    })

    expect(git.createTree).toHaveBeenCalledWith(
      expect.objectContaining({
        base_tree: "base-tree-sha",
      }),
    )
  })

  it("executes the 5-step flow in correct order", async () => {
    setupMocks()

    const callOrder: string[] = []
    git.getRef.mockImplementation(async () => {
      callOrder.push("getRef")
      return { data: { object: { sha: "parent-sha" } } }
    })
    git.getCommit.mockImplementation(async () => {
      callOrder.push("getCommit")
      return { data: { tree: { sha: "base-tree-sha" } } }
    })
    git.createTree.mockImplementation(async () => {
      callOrder.push("createTree")
      return { data: { sha: "new-tree-sha" } }
    })
    git.createCommit.mockImplementation(async () => {
      callOrder.push("createCommit")
      return { data: { sha: "new-commit-sha" } }
    })
    git.updateRef.mockImplementation(async () => {
      callOrder.push("updateRef")
      return {}
    })

    await atomicCommit({
      message: "Ordered commit",
      files: [{ path: "test.md", content: "test" }],
    })

    expect(callOrder).toEqual(["getRef", "getCommit", "createTree", "createCommit", "updateRef"])
  })
})
