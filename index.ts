import { insertGroup } from "./dbActions";
import { getIdolsInfo, getKpopGroups } from "./scraper";
import { getArtistInfo, getTopKpopArtists } from "./spotify";
import { Group } from "./types/Group";
import { deleteGroupDirectory } from "./utils";

const url = "https://kprofiles.com/k-pop-girl-groups/";

// getTopKpopArtists().then((artists) => {
// fs.writeFileSync("artists.txt", JSON.stringify(artists));
// const names = artists.map((artist) => artist.name.toLowerCase());
getKpopGroups(url).then(async (groups) => {
  for (let group of groups) {
    const artistInfo = await getArtistInfo(group.name);
    setTimeout(() => {}, 2000);
    if (artistInfo !== null) {
      const groupInfo: Group = {
        name: artistInfo.name,
        url: group.url,
        imageUrl:
          artistInfo.images.length > 0 ? artistInfo.images[0].url : null,
      };
      const groupId = await insertGroup(groupInfo);
      groupInfo.id = groupId;
      await getIdolsInfo(groupInfo);
      deleteGroupDirectory(group.name);
    }
  }
});
// });
