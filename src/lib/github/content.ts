import { octokit, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH } from "./client"

export async function listDirectories(
  path: string,
): Promise<Array<{ name: string; path: string; sha: string }>> {
  const { data } = await octokit.repos.getContent({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    path,
    ref: GITHUB_BRANCH,
  })
  if (!Array.isArray(data))
    throw new Error(`Expected directory listing for ${path}`)
  return data
    .filter((item) => item.type === "dir")
    .map((item) => ({ name: item.name, path: item.path, sha: item.sha }))
}

export async function readFile(
  path: string,
): Promise<{ content: string; sha: string }> {
  const { data } = await octokit.repos.getContent({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    path,
    ref: GITHUB_BRANCH,
  })
  if (Array.isArray(data) || data.type !== "file")
    throw new Error(`Expected file at ${path}`)
  const content = Buffer.from(data.content, "base64").toString("utf-8")
  return { content, sha: data.sha }
}

export async function readDirectory(
  path: string,
): Promise<
  Array<{
    name: string
    path: string
    sha: string
    type: string
    size?: number
  }>
> {
  const { data } = await octokit.repos.getContent({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    path,
    ref: GITHUB_BRANCH,
  })
  if (!Array.isArray(data))
    throw new Error(`Expected directory at ${path}`)
  return data.map((item) => ({
    name: item.name,
    path: item.path,
    sha: item.sha,
    type: item.type,
    size: item.size,
  }))
}

export async function listPostDirectories() {
  return listDirectories("content/posts")
}

export async function listPageDirectories() {
  return listDirectories("content/pages")
}

export async function listPostImages(
  directoryPath: string,
): Promise<string[]> {
  const items = await readDirectory(directoryPath)
  return items
    .filter(
      (item) =>
        item.type === "file" && /\.(png|jpg|jpeg|webp)$/i.test(item.name),
    )
    .map((item) => item.name)
}
