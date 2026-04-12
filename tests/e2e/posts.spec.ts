import { test, expect } from "@playwright/test"

test.describe("Posts (unauthenticated)", () => {
  test("posts list redirects to login", async ({ page }) => {
    await page.goto("/posts")
    await expect(page).toHaveURL(/\/login/)
  })

  test("new post page redirects to login", async ({ page }) => {
    await page.goto("/posts/new")
    await expect(page).toHaveURL(/\/login/)
  })

  test("edit post page redirects to login", async ({ page }) => {
    await page.goto("/posts/test-slug/edit")
    await expect(page).toHaveURL(/\/login/)
  })

  test("after redirect, login page is functional", async ({ page }) => {
    await page.goto("/posts")
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByText("Sign in with GitHub")).toBeVisible()
  })
})
