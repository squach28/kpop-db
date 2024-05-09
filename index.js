import playwright, { chromium } from "playwright";
import cheerio, { load } from "cheerio";
import fs from "fs";
import { getDownloadURL } from "firebase-admin/storage";

const parseDate = (date) => {
  const splitBirthday = date.split(/\s/);
  if (splitBirthday.length < 3) {
    return null;
  }
  const day = splitBirthday[1];
  let numberedDay = "";
  const zeroCharCode = "0".charCodeAt(0);
  const nineCharCode = "9".charCodeAt(0);
  for (let i = 0; i < day.length; i++) {
    if (
      zeroCharCode <= day.charCodeAt(i) &&
      nineCharCode >= day.charCodeAt(i)
    ) {
      numberedDay += day[i];
    }
  }
  splitBirthday[1] = numberedDay;
  return splitBirthday.join(" ");
};

const launch = async (groupId, group) => {
  try {
    const browser = await chromium.launch({
      headless: true,
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(group.url, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(2000);
    const paragraphs = await page.locator("p").all();
    const result = [];
    for (let paragraph of paragraphs) {
      const all = await paragraph.innerHTML();
      if (all.includes("Stage Name:")) {
        if (all.includes("Members Profile")) {
          const split = all.split("<br>");
          const withoutMembersTitle = split.splice(1);
          result.push(withoutMembersTitle);
        } else {
          const split = all.split("<br>");
          result.push(split);
        }
      }
    }

    for (let i = 0; i < result.length; i++) {
      for (let j = 0; j < result[i].length; j++) {
        result[i][j] = result[i][j].trim();
      }
    }

    for (let i = 0; i < result.length; i++) {
      const idol = {};
      let imgUrl = "";
      idol.groupId = groupId;
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
            idol["dob"] = dob;
          } else if (parsedKey === "stage_name") {
            idol["name"] = parsedValue.split("(")[0].trim();
          } else if (parsedKey === "birth_name") {
            idol[parsedKey] = parsedValue.split("(")[0].trim();
          } else {
            idol[parsedKey] = parsedValue;
          }
        } else if (htmlString.includes("img")) {
          const element = load(htmlString);
          imgUrl = element("img").attr("src");
        }
      }
      downloadImage(idol.name, group.name, imgUrl)
        .then(async (res) => {
          const { groupName, idolName, fileType } = res;
          const upload = await storeImage(groupName, idolName, fileType);
          const name = upload.name;
          const file = admin.storage().bucket().file(name);
          const downloadURL = await getDownloadURL(file);
          idol.image_url = downloadURL;
          await addIdol(idol);
        })
        .catch((e) => {
          console.log(e);
        });
    }

    await page.waitForTimeout(2000);
    await browser.close();
    if (fs.existsSync(`./${group.name}`)) {
      fs.rmSync(`./${group.name}`, { recursive: true, force: true });
    }
  } catch (e) {
    console.log(e);
  }
};

const getGirlKpopGroupLinks = async () => {
  const URL = "https://kprofiles.com/k-pop-girl-groups/";
  const browser = await chromium.launch({
    headless: false,
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(URL, {
    waitUntil: "domcontentloaded",
  });

  await page.waitForTimeout(2000);
  const content = page.locator("#content");
  const links = await content.getByRole("link").all();
  const groups = [];
  for (let link of links) {
    const href = await link.getAttribute("href");
    const innerText = await link.innerText();
    if (href.includes("members-profile")) {
      let groupName = "";

      const splitted = innerText.split("PROFILE");
      if (splitted.length > 1) {
        groupName = splitted[0].trim();
      } else {
        groupName = innerText.trim();
      }
      const group = {
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

const createGroup = async (group) => {
  try {
    const name = group.name;
    const query =
      "INSERT INTO groups (name) VALUES ($1) ON CONFLICT DO NOTHING RETURNING ID";
    const result = await pool.query(query, [name]);
    if (result.rows.length > 0) {
      return result.rows[0].id;
    }
    return null;
  } catch (e) {
    console.log(e);
    return null;
  }
};

getGirlKpopGroupLinks().then(async (groups) => {
  for (const group of groups) {
    const groupId = await createGroup(group);
    if (groupId) {
      await launch(groupId, group);
    }
  }
});
