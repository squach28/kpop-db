import { pool } from "./db";
import { bucket } from "./firebase";
import { Idol } from "./types/Idol";
import { Group } from "./types/Group";

// inserts image into pg db
export const insertIdol = async (idol: Idol) => {
  try {
    const INSERT_QUERY =
      "INSERT INTO idols (name, birth_name, dob, image_url, nationality, group_id) values ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING RETURNING ID";
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
          return false;
        }
        console.log(result);
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
): Promise<Object> => {
  try {
    console.log("inserting image");
    const idolNameWithUnderScores = idolName.replace(/\s/, "_");
    const fileName = `./${groupName}/${idolName}.${fileType}`;
    const destination = `/${groupName}/${idolNameWithUnderScores}.${fileType}`;
    const upload = await bucket.upload(fileName, {
      destination,
      gzip: true,
    });
    console.log(upload[1]);
    return upload[1];
  } catch (e) {
    console.log(e);
    return null;
  }
};

export const getGroupById = async (id: number) => {
  try {
    const query = "SELECT * FROM groups WHERE id = $1";
    const result = pool.query(query, [id], (err, res) => {
      if (err) {
        console.log(err);
        return null;
      }

      if (res.rows.length === 0) {
        return null;
      }
      const group = res.rows[0];
      return group;
    });

    return result;
  } catch (e) {
    console.log(e);
    return null;
  }
};

export const insertGroup = async (group: Group) => {
  try {
    const query =
      "INSERT INTO groups (name, url, image_url) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING ID";
    const result = await pool.query(query, [
      group.name,
      group.url,
      group.imageUrl,
    ]);
    if (result.rows.length > 0) {
      return result.rows[0].id;
    }
    return null;
  } catch (e) {
    console.log(e);
    return null;
  }
};
