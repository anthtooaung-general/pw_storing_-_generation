import { test, expect } from "@playwright/test";

async function unlock(page) {
  await page.goto("/");
  await page.getByLabel("Email address").fill("anthtooaung2792005@gmail.com");
  await page.getByLabel("Vault password", { exact: true }).fill("password");
  await page.getByRole("button", { name: "Unlock your vault" }).click();
  await expect(
    page.getByRole("heading", { name: "Your vault." }),
  ).toBeVisible();
}

async function fitsViewport(page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}

test("populated vault, longest generator output and dialogs fit phone through wide desktop", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await unlock(page);
  await page.getByRole("button", { name: "Add password", exact: true }).click();
  await page
    .getByLabel("Name", { exact: true })
    .fill("LongAccountName".repeat(6));
  await page
    .getByLabel("Email or username")
    .fill("long-email-address".repeat(8) + "@example.com");
  await page
    .getByLabel("Password", { exact: true })
    .fill("Example-password-123!");
  await page
    .getByRole("button", { name: "Save password", exact: false })
    .click();
  for (const width of [
    320, 375, 390, 680, 681, 768, 900, 1024, 1200, 1440, 1920,
  ]) {
    await page.setViewportSize({ width, height: 844 });
    await page.getByRole("button", { name: "My vault", exact: true }).click();
    await fitsViewport(page);
    await expect(page.locator(".vault-item")).toBeVisible();
    if (width <= 680) {
      for (const button of await page.locator(".item-actions button").all()) {
        const rect = await button.boundingBox();
        expect(rect.width).toBeGreaterThanOrEqual(44);
        expect(rect.height).toBeGreaterThanOrEqual(44);
      }
    }
    await page.getByRole("button", { name: /^Edit LongAccountName/ }).click();
    const dialog = page.getByRole("dialog", {
      name: "Edit password",
      exact: true,
    });
    await expect(dialog).toBeVisible();
    expect(
      await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    await page.getByRole("button", { name: "Close dialog" }).click();
    await page.getByRole("button", { name: "Generator", exact: true }).click();
    await page.getByLabel("Password length").fill("64");
    await expect(page.locator("#generated")).toHaveText(/^.{64}$/);
    await fitsViewport(page);
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await fitsViewport(page);
  }
  expect(errors).toEqual([]);
});

test("keyboard navigation, password visibility, dialog escape and focus return", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByLabel("Vault password", { exact: true }).fill("password");
  const reveal = page.getByRole("button", {
    name: "Show password",
    exact: true,
  });
  await reveal.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByLabel("Vault password", { exact: true }),
  ).toHaveAttribute("type", "text");
  await expect(
    page.getByRole("button", { name: "Hide password" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Enter");
  await expect(
    page.getByLabel("Vault password", { exact: true }),
  ).toHaveAttribute("type", "password");
  await unlock(page);
  const add = page.getByRole("button", { name: "Add password", exact: true });
  await add.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Name", { exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(add).toBeFocused();
  await page.getByRole("button", { name: "Generator", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Password generator." }),
  ).toBeFocused();
  await expect(
    page.getByRole("button", { name: "Generator", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  const uppercase = page.getByLabel("Uppercase letters");
  await uppercase.focus();
  await page.keyboard.press("Space");
  await expect(uppercase).not.toBeChecked();
  await page.getByRole("link", { name: "Still home" }).click();
  await expect(
    page.getByRole("heading", { name: "Your vault." }),
  ).toBeVisible();
});
