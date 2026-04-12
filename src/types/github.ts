export interface GitHubContentFile {
  type: "file"
  encoding: string
  size: number
  name: string
  path: string
  content: string
  sha: string
  url: string
  git_url: string
  html_url: string
  download_url: string | null
}

export interface GitHubContentDirectory {
  type: "dir"
  size: number
  name: string
  path: string
  sha: string
  url: string
  git_url: string
  html_url: string
  download_url: null
}

export type GitHubContent = GitHubContentFile | GitHubContentDirectory

export interface GitHubRef {
  ref: string
  node_id: string
  url: string
  object: {
    sha: string
    type: string
    url: string
  }
}

export interface GitHubCommit {
  sha: string
  node_id: string
  url: string
  html_url: string
  author: {
    name: string
    email: string
    date: string
  }
  committer: {
    name: string
    email: string
    date: string
  }
  message: string
  tree: {
    sha: string
    url: string
  }
  parents: Array<{
    sha: string
    url: string
    html_url: string
  }>
}

export interface GitHubTreeEntry {
  path: string
  mode: string
  type: "blob" | "tree"
  size?: number
  sha: string
  url: string
}

export interface GitHubTree {
  sha: string
  url: string
  tree: GitHubTreeEntry[]
  truncated: boolean
}

export interface GitHubBlob {
  content: string
  encoding: string
  url: string
  sha: string
  size: number
}

export interface GitHubPullRequest {
  url: string
  id: number
  node_id: string
  html_url: string
  number: number
  state: "open" | "closed"
  title: string
  body: string | null
  head: {
    label: string
    ref: string
    sha: string
  }
  base: {
    label: string
    ref: string
    sha: string
  }
  merged: boolean
  mergeable: boolean | null
  created_at: string
  updated_at: string
}
