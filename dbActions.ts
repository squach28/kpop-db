import { pool } from "./db";

const insertIdol = async (idol: Idol) => {
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

const insertImage = (groupName: string, idolName: string, fileType: string) => {
  try {
    const idolNameWithUnderScores = idolName.replace(/\s/, "_");
    const fileName = `./${groupName}/${idolName}.${fileType}`;
    const destination = `/${groupName}/${idolNameWithUnderScores}.${fileType}`;
  } catch (e) {
    console.log(e);
    return null;
  }
};
