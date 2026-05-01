import { expect, test } from "@playwright/test";

test("home page carrega com header de marca", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/FFADV Dashboard/);
  await expect(page.getByText("FFADV Assessorias")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "FFADV Dashboard" }),
  ).toBeVisible();
});
