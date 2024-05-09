import axios from "axios";
import fs from "fs";
import { getDownloadURL } from "firebase-admin/storage";
import { bucket } from "./firebase";

// downloads an image from a name (idol), groupName, and url to download the image from
export const downloadImage = async (
  name: string,
  groupName: string,
  url: string,
) => {
  try {
    const idolName = name.toLowerCase();
    const res = await axios({
      url,
      responseType: "stream",
    });

    return new Promise((resolve, reject) => {
      const contentType = res.headers["content-type"];
      const splittedType = contentType.split("/");
      const fileType = splittedType[splittedType.length - 1];

      res.data
        .pipe(fs.createWriteStream(`./${groupName}/${idolName}.${fileType}`))
        .on("finish", () => resolve({ groupName, idolName, fileType }))
        .on("error", (e) => reject(e));
    });
  } catch (e) {
    console.log(e);
    return null;
  }
};

export const getDownloadUrl = async (fileName: string) => {
  try {
    const file = bucket.file(fileName);
    const downloadURL = await getDownloadURL(file);
    return downloadURL;
  } catch (e) {
    console.log(e);
    return null;
  }
};

// creates a directory for a kpop group
export const createGroupDirectory = (groupName: string) => {
  if (!fs.existsSync(groupName)) {
    return;
  }
  fs.mkdirSync(groupName);
};

// removes all files from a directory and deletes the directory
export const deleteGroupDirectory = (groupName) => {
  if (fs.existsSync(groupName)) {
    fs.rmSync(`./${groupName}`, { recursive: true, force: true });
  }
};
