import { describe, it, expect, vi, beforeEach } from "vitest"
import { getBranchName, createBranch, branchExists, deleteBranch } from "@/lib/github/branches"

vi.mock("@/lib/github/client", () => ({
  octokit: {
    git: {
      createRef: vi.fn(),
      deleteRef: vi.fn(),
      getRef: vi.fn(),
    },
  },
  GITHUB_OWNER: "test-owner",
  GITHUB_REPO: "test-repo",
  GITHUB_BRANCH: "main",
}))

import { octokit } from "@/lib/github/client"

const git = octokit.git as unknown as {
  createRef: ReturnType<typeof vi.fn>
  deleteRef: ReturnType<typeof vi.fn>
  getRef: ReturnType<typeof vi.fn>
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("getBranchName", () => {
  it("strips leading slash and prepends content/", () => {
    expect(getBranchName("/devops-new-post-240115")).toBe("content/devops-new-post-240115")
  })

  it("prepends content/ when no leading slash", () => {
    expect(getBranchName("my-post-slug")).toBe("content/my-post-slug")
  })

  it("handles empty string", () => {
    expect(getBranchName("")).toBe("content/")
  })
})

describe("createBranch", () => {
  it("creates a ref with correct parameters", async () => {
    git.createRef.mockResolvedValue({
      data: { ref: "refs/heads/content/my-branch", object: { sha: "abc123" } },
    })

    const result = await createBranch("content/my-branch", "abc123")

    expect(git.createRef).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      ref: "refs/heads/content/my-branch",
      sha: "abc123",
    })
    expect(result).toEqual({ ref: "refs/heads/content/my-branch", object: { sha: "abc123" } })
  })
})

describe("deleteBranch", () => {
  it("deletes the ref with correct parameters", async () => {
    git.deleteRef.mockResolvedValue({})

    await deleteBranch("content/my-branch")

    expect(git.deleteRef).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      ref: "heads/content/my-branch",
    })
  })
})

describe("branchExists", () => {
  it("returns true when branch exists", async () => {
    git.getRef.mockResolvedValue({
      data: { ref: "refs/heads/content/my-branch", object: { sha: "abc" } },
    })

    const result = await branchExists("content/my-branch")

    expect(result).toBe(true)
    expect(git.getRef).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      ref: "heads/content/my-branch",
    })
  })

  it("returns false when branch does not exist", async () => {
    git.getRef.mockRejectedValue(new Error("Not Found"))

    const result = await branchExists("content/nonexistent")

    expect(result).toBe(false)
  })
})
