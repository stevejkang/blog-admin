import { octokit, GITHUB_OWNER, GITHUB_REPO } from "./client"

export function getBranchName(slug: string): string {
  const normalized = slug.startsWith("/") ? slug.slice(1) : slug
  return `content/${normalized}`
}

export async function createBranch(branchName: string, fromSha: string) {
  const { data } = await octokit.git.createRef({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    ref: `refs/heads/${branchName}`,
    sha: fromSha,
  })
  return data
}

export async function deleteBranch(branchName: string) {
  await octokit.git.deleteRef({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    ref: `heads/${branchName}`,
  })
}

export async function branchExists(branchName: string): Promise<boolean> {
  try {
    await octokit.git.getRef({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      ref: `heads/${branchName}`,
    })
    return true
  } catch {
    return false
  }
}
