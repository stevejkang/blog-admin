import { Octokit } from "@octokit/rest"
import { throttling } from "@octokit/plugin-throttling"

const ThrottledOctokit = Octokit.plugin(throttling)

export const octokit = new ThrottledOctokit({
  auth: process.env.GITHUB_TOKEN,
  throttle: {
    onRateLimit: (retryAfter, options, octokit, retryCount) => {
      octokit.log.warn(
        `Rate limit hit for ${options.method} ${options.url}`,
      )
      if (retryCount <= 2) {
        octokit.log.info(`Retrying after ${retryAfter} seconds`)
        return true
      }
      return false
    },
    onSecondaryRateLimit: (retryAfter, options, octokit) => {
      octokit.log.warn(
        `Secondary rate limit hit for ${options.method} ${options.url}`,
      )
      return false
    },
  },
})

export const GITHUB_OWNER = process.env.GITHUB_OWNER || "stevejkang"
export const GITHUB_REPO = process.env.GITHUB_REPO || "blog"
export const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main"
