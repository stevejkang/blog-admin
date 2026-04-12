import { test, expect } from "@playwright/test"

test.describe("Dashboard (unauthenticated)", () => {
  test("root path redirects to login", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveURL(/\/login/)
  })

  test("pages list redirects to login", async ({ page }) => {
    await page.goto("/pages")
    await expect(page).toHaveURL(/\/login/)
  })

  test("new page route redirects to login", async ({ page }) => {
    await page.goto("/pages/new")
    await expect(page).toHaveURL(/\/login/)
  })

  test("tags route redirects to login", async ({ page }) => {
    await page.goto("/tags")
    await expect(page).toHaveURL(/\/login/)
  })

  test("login page renders correctly after redirect", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveURL(/\/login/)

    await expect(page.getByText("Blog Admin")).toBeVisible()
    await expect(
      page.getByText("Sign in to manage your blog content"),
    ).toBeVisible()
    await expect(page.getByText("Sign in with GitHub")).toBeVisible()
  })

  test("login page contains GitHub icon", async ({ page }) => {
    await page.goto("/login")
    const githubIcon = page.locator("button svg")
    await expect(githubIcon).toBeVisible()
  })
})
