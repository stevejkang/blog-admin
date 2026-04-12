import { octokit, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH } from "./client"

interface CreatePRParams {
  title: string
  body: string
  head: string
  base?: string
}

export async function createPR({ title, body, head, base = GITHUB_BRANCH }: CreatePRParams) {
  const { data } = await octokit.pulls.create({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    title,
    body,
    head,
    base,
  })
  return { prUrl: data.html_url, prNumber: data.number }
}

export async function getPR(prNumber: number) {
  const { data } = await octokit.pulls.get({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    pull_number: prNumber,
  })
  return data
}

export async function listContentPRs() {
  const { data } = await octokit.pulls.list({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    state: "open",
  })
  return data.filter((pr) => pr.head.ref.startsWith("content/"))
}

export async function mergePR(prNumber: number, method: "squash" | "merge" | "rebase" = "squash") {
  const { data } = await octokit.pulls.merge({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    pull_number: prNumber,
    merge_method: method,
  })
  return data
}
