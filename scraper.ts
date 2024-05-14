import playwright, { chromium } from "playwright";
import cheerio, { load } from "cheerio";
import { Group } from "./types/Group";
import { Idol } from "./types/Idol";
import { downloadImage, getDownloadUrl, parseDate } from "./utils";
import { insertImage } from "./dbActions";

export const getKpopGroups = async (url: string): Promise<Group[]> => {
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
// scrap information about a kpop grooup using a group
// group contains id, name, and url
export const getIdolsInfo = async (group: Group): Promise<Idol[]> => {
  try {
    const browser = await chromium.launch({
      headless: true,
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(group.url, {
      waitUntil: "domcontentloaded",
    });
    const paragraphs = await page.locator("p").all(); // locate all blocks of text in paragraphs
    const result = [];
    for (let paragraph of paragraphs) {
      const all = await paragraph.innerHTML();
      if (all.includes("Stage Name:")) {
        // first title will always include stage name
        if (all.includes("Members Profile")) {
          const split = all.split("<br>");
          const withoutMembersTitle = split.splice(1); // exclude stage name and get member's name
          result.push(withoutMembersTitle);
        } else {
          const split = all.split("<br>");
          result.push(split);
        }
      }
    }

    // go through all members names and trim whitespace
    for (let i = 0; i < result.length; i++) {
      for (let j = 0; j < result[i].length; j++) {
        result[i][j] = result[i][j].trim();
      }
    }
    const idols: Idol[] = [];
    for (let i = 0; i < result.length; i++) {
      const data = {};
      for (let j = 0; j < result[i].length; j++) {
        const htmlString = result[i][j];
        if (htmlString.includes("</span>")) {
          const htmlString = result[i][j];
          const element = load(htmlString);
          const text = element.text();
          const [key, value] = text.split(":");
          const parsedKey = key.trim().toLowerCase().replace(" ", "_");
          const parsedValue = value.trim();

          if (parsedKey === "birthday" || parsedKey === "birth_date") {
            const dob = parseDate(parsedValue);
            data["dob"] = dob;
          } else if (parsedKey === "stage_name") {
            data["name"] = parsedValue.split("(")[0].trim();
          } else if (parsedKey === "birth_name") {
            data[parsedKey] = parsedValue.split("(")[0].trim();
          } else {
            data[parsedKey] = parsedValue;
          }
        } else if (htmlString.includes("img")) {
          const element = load(htmlString);
          data["image_url"] = element("img").attr("src");
        }
      }
      const imageUrl = data["image_url"];
      const name = data["name"];
      // download image from image_url
      downloadImage(name, group.name, imageUrl).then(async (res) => {
        if (res !== null) {
          const { groupName, idolName, fileType } = res;
          const upload = await insertImage(groupName, idolName, fileType);
          const name = upload["name"];
          const downloadURL = await getDownloadUrl(name);
        }
      });
    }

    return idols;
  } catch (e) {
    console.log(e);
    return [];
  }
};
