import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const SPOTIFY_API_URL = "https://api.spotify.com/v1";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";

// gets an access token to make calls with spotify api
const getAccessToken = async () => {
  const auth = Buffer.from(
    process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_SECRET,
  ).toString("base64");
  const res = await axios.post(
    `${SPOTIFY_TOKEN_URL}`,
    {
      grant_type: "client_credentials",
    },
    {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  return res.data.access_token;
};

export const getTopKpopArtists = async () => {
  try {
    const ITEMS_PER_PAGE = 20;
    const accessToken = await getAccessToken();
    const url = `${SPOTIFY_API_URL}/search?q=genre%3Dk-pop&type=artist&limit=20`;
    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const total = res.data.artists.total;
    const offsets = [];
    let offset = 0;
    while (offset < total) {
      offsets.push(offset);
      offset += ITEMS_PER_PAGE;
    }

    const promises = [];

    for (let offset of offsets) {
      const promise = axios.get(`${url}&offset=${offset}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      promises.push(promise);
    }
    const results = [];
    const promiseResults = await Promise.all(promises);
    promiseResults.forEach((result) => {
      const items = result.data.artists.items;
      items.forEach((item) => {
        if (!results.includes(item.name)) {
          results.push(item.name);
        }
      });
    });

    return results;
  } catch (e) {
    console.log(e);
  }
};

// gets information about an artist using the name
export const getArtistInfo = async (artistName: string) => {
  try {
    const accessToken = await getAccessToken();
    const url = `${SPOTIFY_API_URL}/search?q=artist:${artistName}&type=artist&limit=1`;
    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (res.data.artists.items.length < 1) {
      return null;
    }

    const artist = res.data.artists.items[0];
    const isKpopArtist = artist.genres.find((genre: string[]) =>
      genre.includes("k-pop"),
    );
    if (!isKpopArtist) {
      return null;
    }

    return artist;
  } catch (e) {
    console.log(e);
    return null;
  }
};
