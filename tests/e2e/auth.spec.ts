import { test, expect } from "@playwright/test"

test.describe("Authentication", () => {
  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveURL(/\/login/)
  })

  test("login page renders with GitHub button", async ({ page }) => {
    await page.goto("/login")
    await expect(page.getByText("Blog Admin")).toBeVisible()
    await expect(page.getByText("Sign in with GitHub")).toBeVisible()
  })

  test("login page shows sign-in description", async ({ page }) => {
    await page.goto("/login")
    await expect(
      page.getByText("Sign in to manage your blog content"),
    ).toBeVisible()
  })

  test("login page has centered card layout", async ({ page }) => {
    await page.goto("/login")
    const card = page.locator(".w-full.max-w-sm")
    await expect(card).toBeVisible()
  })

  test("dashboard routes redirect to login when unauthenticated", async ({
    page,
  }) => {
    await page.goto("/posts")
    await expect(page).toHaveURL(/\/login/)
  })

  test("posts new route redirects to login when unauthenticated", async ({
    page,
  }) => {
    await page.goto("/posts/new")
    await expect(page).toHaveURL(/\/login/)
  })

  test("tags route redirects to login when unauthenticated", async ({
    page,
  }) => {
    await page.goto("/tags")
    await expect(page).toHaveURL(/\/login/)
  })
})
