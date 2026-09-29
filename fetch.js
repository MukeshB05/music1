const API_URL = "https://jiosaavndev.vercel.app/api";

if (!API_URL) {
  console.error("API URL is missing");
}

const encode = (value) =>
  encodeURIComponent(String(value ?? "").trim());

const toPositiveLimit = (value, fallback = 50) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0
    ? Math.floor(number)
    : fallback;
};

// ----------------------------------------------------
// Common API request helper
// ----------------------------------------------------
const apiRequest = async (endpoint) => {
  const cleanEndpoint = String(endpoint || "");
  const url = `${API_URL}${cleanEndpoint}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    const text = await response.text();

    let data = {};

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          `API returned invalid JSON (${response.status} ${response.statusText})`
        );
      }
    }

    if (!response.ok) {
      throw new Error(
        data?.message ||
          data?.error ||
          `API request failed: ${response.status} ${response.statusText}`
      );
    }

    return data;
  } catch (error) {
    console.error(`API Error: ${url}`, error);
    throw error instanceof Error
      ? error
      : new Error("API request failed");
  }
};

// ----------------------------------------------------
// Song Suggestions
// ----------------------------------------------------
export const getSuggestionSong = async (id) => {
  if (!id) throw new Error("Song ID is required");

  return apiRequest(
    `/songs/${encode(id)}/suggestions?limit=150`
  );
};

// ----------------------------------------------------
// General Search
// ----------------------------------------------------
export const getSearchData = async (query) => {
  if (!query) throw new Error("Search query is required");

  return apiRequest(
    `/search?query=${encode(query)}&limit=150`
  );
};

// ----------------------------------------------------
// Search Songs
// ----------------------------------------------------
export const getSongbyQuery = async (query, limit = 50) => {
  if (!query) throw new Error("Song search query is required");

  return apiRequest(
    `/search/songs?query=${encode(query)}&limit=${toPositiveLimit(limit)}`
  );
};

// ----------------------------------------------------
// Search Artists
// ----------------------------------------------------
export const getArtistbyQuery = async (query, limit = 50) => {
  if (!query) throw new Error("Artist search query is required");

  return apiRequest(
    `/search/artists?query=${encode(query)}&limit=${toPositiveLimit(limit)}`
  );
};

// ----------------------------------------------------
// Get Song By ID
// ----------------------------------------------------
export const getSongById = async (songId) => {
  if (!songId) throw new Error("Song ID is required");

  return apiRequest(`/songs/${encode(songId)}`);
};

// ----------------------------------------------------
// Search Albums
// ----------------------------------------------------
export const searchAlbumByQuery = async (query) => {
  if (!query) throw new Error("Album search query is required");

  return apiRequest(
    `/search/albums?query=${encode(query)}&limit=130`
  );
};

// ----------------------------------------------------
// Search Artists
// ----------------------------------------------------
export const searchArtistByQuery = async (query) => {
  if (!query) throw new Error("Artist search query is required");

  return apiRequest(
    `/search/artists?query=${encode(query)}&limit=130`
  );
};

// ----------------------------------------------------
// Get Album By ID
// ----------------------------------------------------
export const fetchAlbumByID = async (ID) => {
  if (!ID) throw new Error("Album ID is required");

  return apiRequest(`/albums?id=${encode(ID)}&limit=130`);
};

// ----------------------------------------------------
// Get Artist By ID
// ----------------------------------------------------
export const fetchArtistByID = async (ID) => {
  if (!ID) throw new Error("Artist ID is required");

  return apiRequest(`/artists?id=${encode(ID)}`);
};

// ----------------------------------------------------
// Search Playlists
// ----------------------------------------------------
export const searchPlayListByQuery = async (query) => {
  if (!query) throw new Error("Playlist search query is required");

  return apiRequest(
    `/search/playlists?query=${encode(query)}&limit=130`
  );
};

// ----------------------------------------------------
// Get Playlist By ID
// ----------------------------------------------------
export const fetchplaylistsByID = async (ID) => {
  if (!ID) throw new Error("Playlist ID is required");

  return apiRequest(
    `/playlists?id=${encode(ID)}&limit=130`
  );
};

// ----------------------------------------------------
// Song Suggestions By ID
// ----------------------------------------------------
export const fetchSongSuggestionsByID = async (ID) => {
  if (!ID) throw new Error("Song ID is required");

  return apiRequest(
    `/songs/${encode(ID)}/suggestions?limit=130`
  );
};

// ----------------------------------------------------
// Lyrics By ID
// ----------------------------------------------------
export const LyricsByID = async (ID) => {
  if (!ID) throw new Error("Song ID is required");

  return apiRequest(`/songs/${encode(ID)}/lyrics`);
};

// ====================================================
// NEW TRENDING
// ====================================================

// Exact endpoint format:
// /new_trending?language=tamil
// /new_trending?language=malayalam
// /new_trending?language=hindi
export const getNewTrending = async (language) => {
  const normalizedLanguage = String(language || "")
    .trim()
    .toLowerCase();

  if (!normalizedLanguage) {
    throw new Error("Language is required for new trending");
  }

  return apiRequest(
    `/new_trending?language=${encode(normalizedLanguage)}`
  );
};

export const getTamilNewTrending = async () =>
  getNewTrending("tamil");

export const getMalayalamNewTrending = async () =>
  getNewTrending("malayalam");

export const getHindiNewTrending = async () =>
  getNewTrending("hindi");

// All three languages. One failed language does not reject the others.
export const getNewTrendingLanguages = async () => {
  const [tamil, malayalam, hindi] =
    await Promise.allSettled([
      getTamilNewTrending(),
      getMalayalamNewTrending(),
      getHindiNewTrending(),
    ]);

  return {
    tamil:
      tamil.status === "fulfilled" ? tamil.value : null,
    malayalam:
      malayalam.status === "fulfilled"
        ? malayalam.value
        : null,
    hindi:
      hindi.status === "fulfilled" ? hindi.value : null,
  };
};

// ====================================================
// FEATURED RADIO
// ====================================================

// Exact endpoint format:
// /radio/featured?name=malayalam
export const getFeaturedRadio = async (name) => {
  const normalizedName = String(name || "")
    .trim()
    .toLowerCase();

  if (!normalizedName) {
    throw new Error("Radio name is required");
  }

  return apiRequest(
    `/radio/featured?name=${encode(normalizedName)}`
  );
};

export const getTamilFeaturedRadio = async () =>
  getFeaturedRadio("tamil");

export const getMalayalamFeaturedRadio = async () =>
  getFeaturedRadio("malayalam");

export const getHindiFeaturedRadio = async () =>
  getFeaturedRadio("hindi");

export const getFeaturedRadioLanguages = async () => {
  const [tamil, malayalam, hindi] =
    await Promise.allSettled([
      getTamilFeaturedRadio(),
      getMalayalamFeaturedRadio(),
      getHindiFeaturedRadio(),
    ]);

  return {
    tamil:
      tamil.status === "fulfilled" ? tamil.value : null,
    malayalam:
      malayalam.status === "fulfilled"
        ? malayalam.value
        : null,
    hindi:
      hindi.status === "fulfilled" ? hindi.value : null,
  };
};
