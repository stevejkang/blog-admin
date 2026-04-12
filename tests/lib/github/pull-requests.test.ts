import { describe, it, expect, vi, beforeEach } from "vitest"
import { createPR, getPR, listContentPRs, mergePR } from "@/lib/github/pull-requests"

vi.mock("@/lib/github/client", () => ({
  octokit: {
    pulls: {
      create: vi.fn(),
      get: vi.fn(),
      list: vi.fn(),
      merge: vi.fn(),
    },
  },
  GITHUB_OWNER: "test-owner",
  GITHUB_REPO: "test-repo",
  GITHUB_BRANCH: "main",
}))

import { octokit } from "@/lib/github/client"

const pulls = octokit.pulls as unknown as {
  create: ReturnType<typeof vi.fn>
  get: ReturnType<typeof vi.fn>
  list: ReturnType<typeof vi.fn>
  merge: ReturnType<typeof vi.fn>
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("createPR", () => {
  it("creates PR and returns url and number", async () => {
    pulls.create.mockResolvedValue({
      data: { html_url: "https://github.com/test-owner/test-repo/pull/42", number: 42 },
    })

    const result = await createPR({
      title: "Add new post",
      body: "Content update",
      head: "content/my-post",
    })

    expect(pulls.create).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      title: "Add new post",
      body: "Content update",
      head: "content/my-post",
      base: "main",
    })
    expect(result).toEqual({
      prUrl: "https://github.com/test-owner/test-repo/pull/42",
      prNumber: 42,
    })
  })

  it("uses custom base branch when provided", async () => {
    pulls.create.mockResolvedValue({
      data: { html_url: "https://github.com/test-owner/test-repo/pull/1", number: 1 },
    })

    await createPR({
      title: "Test",
      body: "Test",
      head: "content/test",
      base: "develop",
    })

    expect(pulls.create).toHaveBeenCalledWith(
      expect.objectContaining({ base: "develop" }),
    )
  })
})

describe("getPR", () => {
  it("returns PR data", async () => {
    const prData = { number: 42, title: "Test PR", state: "open" }
    pulls.get.mockResolvedValue({ data: prData })

    const result = await getPR(42)

    expect(pulls.get).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      pull_number: 42,
    })
    expect(result).toEqual(prData)
  })
})

describe("listContentPRs", () => {
  it("filters PRs to only content/ branches", async () => {
    pulls.list.mockResolvedValue({
      data: [
        { number: 1, head: { ref: "content/post-1" } },
        { number: 2, head: { ref: "feature/new-ui" } },
        { number: 3, head: { ref: "content/post-2" } },
      ],
    })

    const result = await listContentPRs()

    expect(result).toHaveLength(2)
    expect(result[0].number).toBe(1)
    expect(result[1].number).toBe(3)
  })

  it("returns empty array when no content PRs", async () => {
    pulls.list.mockResolvedValue({
      data: [{ number: 1, head: { ref: "feature/something" } }],
    })

    const result = await listContentPRs()

    expect(result).toHaveLength(0)
  })
})

describe("mergePR", () => {
  it("merges with squash by default", async () => {
    pulls.merge.mockResolvedValue({
      data: { merged: true, sha: "merge-sha-123" },
    })

    const result = await mergePR(42)

    expect(pulls.merge).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      pull_number: 42,
      merge_method: "squash",
    })
    expect(result).toEqual({ merged: true, sha: "merge-sha-123" })
  })

  it("uses specified merge method", async () => {
    pulls.merge.mockResolvedValue({
      data: { merged: true, sha: "rebase-sha" },
    })

    await mergePR(10, "rebase")

    expect(pulls.merge).toHaveBeenCalledWith(
      expect.objectContaining({ merge_method: "rebase" }),
    )
  })
})
