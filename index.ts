import { insertGroup } from "./dbActions";
import { getIdolsInfo, getKpopGroups } from "./scraper";
import { getArtistInfo, getTopKpopArtists } from "./spotify";
import fs from "fs";
const url = "https://kprofiles.com/k-pop-girl-groups/";

// getTopKpopArtists().then((artists) => {
// fs.writeFileSync("artists.txt", JSON.stringify(artists));
// const names = artists.map((artist) => artist.name.toLowerCase());
getKpopGroups(url).then(async (groups) => {
  for (let group of groups) {
    await getArtistInfo(group.name);
    setTimeout(() => {}, 2000);
    // if (names.includes(group.name.toLowerCase())) {
    // console.log(group.name);
    // }
  }
});
// });
