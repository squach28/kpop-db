import playwright, { chromium } from "playwright";
import cheerio, { load } from "cheerio";
import { Group } from "./types/Group";

export const getKpopGroups = async (url) => {
  const browser = await chromium.launch({
    headless: true,
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(url, {
    waitUntil: "domcontentloaded",
  });

  await page.waitForTimeout(2000);

  const content = page.locator("#content");
  const links = await content.getByRole("link").all();

  const groups: Group[] = [];

  for (let link of links) {
    const href = await link.getAttribute("href");
    const innerText = await link.innerText();
    if (href && href.includes("members-profile")) {
      let groupName = "";
      const splitted = innerText.split("PROFILE");

      if (splitted.length > 1) {
        groupName = splitted[0].trim();
      } else {
        groupName = innerText.trim();
      }

      const group: Group = {
        name: groupName,
        url: href,
      };
      groups.push(group);
    }
  }

  await page.waitForTimeout(2000);
  await browser.close();
  return groups;
};
