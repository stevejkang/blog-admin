import { octokit, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH } from "./client"

export async function getLatestCommit(branch: string = GITHUB_BRANCH) {
  const { data } = await octokit.git.getRef({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    ref: `heads/${branch}`,
  })
  const commitSha = data.object.sha
  const { data: commit } = await octokit.git.getCommit({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    commit_sha: commitSha,
  })
  return { commitSha, treeSha: commit.tree.sha }
}

export async function createBlob(content: string, encoding: "utf-8" | "base64" = "utf-8") {
  const { data } = await octokit.git.createBlob({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    content,
    encoding,
  })
  return data.sha
}

export async function createTree(
  baseTreeSha: string,
  entries: Array<{ path: string; mode: "100644"; type: "blob"; sha?: string | null; content?: string }>
) {
  const { data } = await octokit.git.createTree({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    base_tree: baseTreeSha, // CRITICAL: always include to preserve existing files
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tree: entries as any,
  })
  return data.sha
}

export async function createCommit(treeSha: string, parentSha: string, message: string) {
  const { data } = await octokit.git.createCommit({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    tree: treeSha,
    parents: [parentSha],
    message,
  })
  return data.sha
}

export async function updateRef(branch: string, commitSha: string, force = false) {
  await octokit.git.updateRef({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    ref: `heads/${branch}`,
    sha: commitSha,
    force,
  })
}

interface AtomicCommitOptions {
  branch?: string
  message: string
  files: Array<{ path: string; content: string; encoding?: "utf-8" | "base64" }>
  deletions?: Array<{ path: string }>
}

export async function atomicCommit({ branch = GITHUB_BRANCH, message, files, deletions = [] }: AtomicCommitOptions) {
  const { commitSha, treeSha } = await getLatestCommit(branch)

  const treeEntries: Array<{ path: string; mode: "100644"; type: "blob"; sha?: string | null; content?: string }> = []

  for (const file of files) {
    if (file.encoding === "base64") {
      const blobSha = await createBlob(file.content, "base64")
      treeEntries.push({ path: file.path, mode: "100644", type: "blob", sha: blobSha })
    } else {
      treeEntries.push({ path: file.path, mode: "100644", type: "blob", content: file.content })
    }
  }

  for (const del of deletions) {
    treeEntries.push({ path: del.path, mode: "100644", type: "blob", sha: null })
  }

  const newTreeSha = await createTree(treeSha, treeEntries)
  const newCommitSha = await createCommit(newTreeSha, commitSha, message)
  await updateRef(branch, newCommitSha)

  return { commitSha: newCommitSha }
}

/** Replace HEAD commit on a PR branch with updated content (force push). */
export async function amendCommit({ branch, message, files, deletions = [] }: AtomicCommitOptions) {
  if (!branch || branch === GITHUB_BRANCH) {
    throw new Error("amendCommit must target a non-default branch")
  }

  const { data: ref } = await octokit.git.getRef({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    ref: `heads/${branch}`,
  })
  const headSha = ref.object.sha

  const { data: headCommit } = await octokit.git.getCommit({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    commit_sha: headSha,
  })
  const parentSha = headCommit.parents[0].sha

  const { data: parentCommit } = await octokit.git.getCommit({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    commit_sha: parentSha,
  })
  const baseTreeSha = parentCommit.tree.sha

  const treeEntries: Array<{ path: string; mode: "100644"; type: "blob"; sha?: string | null; content?: string }> = []

  for (const file of files) {
    if (file.encoding === "base64") {
      const blobSha = await createBlob(file.content, "base64")
      treeEntries.push({ path: file.path, mode: "100644", type: "blob", sha: blobSha })
    } else {
      treeEntries.push({ path: file.path, mode: "100644", type: "blob", content: file.content })
    }
  }

  for (const del of deletions) {
    treeEntries.push({ path: del.path, mode: "100644", type: "blob", sha: null })
  }

  const newTreeSha = await createTree(baseTreeSha, treeEntries)
  const newCommitSha = await createCommit(newTreeSha, parentSha, message)
  await updateRef(branch, newCommitSha, true) // force push

  return { commitSha: newCommitSha }
}
