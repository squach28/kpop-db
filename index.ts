import { insertGroup } from "./dbActions";
import { getIdolsInfo, getKpopGroups } from "./scraper";

const url = "https://kprofiles.com/k-pop-girl-groups/";

getKpopGroups(url).then(async (groups) => {
  for (let group of groups) {
    await insertGroup(group);
    await getIdolsInfo(group);
  }
});
