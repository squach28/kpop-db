import { pool } from "./db";
import { bucket } from "./firebase";
import { Idol } from "./types/Idol";
import { Group } from "./types/Group";

// inserts image into pg db
export const insertIdol = async (idol: Idol) => {
  try {
    const INSERT_QUERY =
      "INSERT INTO idols (name, birth_name, dob, image_url, nationality, group_id) values ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING RETURNINiG ID";
    return pool.query(
      INSERT_QUERY,
      [
        idol.name,
        idol.birthName,
        idol.dob,
        idol.imageUrl,
        idol.nationality,
        idol.groupId,
      ],
      (err, result) => {
        if (err) {
          console.log(err);
          console.log(`err for ${idol.name}`);
        }
        if (result.rows.length > 0) {
          return result.rows[0].id;
        }
      },
    );
  } catch (e) {
    console.log(e);
  }
};

// inserts an image (file) into firebase storage
// returns uploaded file if successful
// returns null if file fails to upload
export const insertImage = async (
  groupName: string,
  idolName: string,
  fileType: string,
) => {
  try {
    const idolNameWithUnderScores = idolName.replace(/\s/, "_");
    const fileName = `./${groupName}/${idolName}.${fileType}`;
    const destination = `/${groupName}/${idolNameWithUnderScores}.${fileType}`;
    const upload = await bucket.upload(fileName, {
      destination,
      gzip: true,
    });

    return upload[1];
  } catch (e) {
    console.log(e);
    return null;
  }
};

export const insertGroup = async (group: Group) => {
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
