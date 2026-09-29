// ============================================================
// MusicMax - API / fetch.js
// JioSaavn Developer API
// ============================================================

const API_URL = "https://jiosaavndev.vercel.app/api";

// ============================================================
// COMMON HELPERS
// ============================================================

const toPositiveLimit = (value, fallback = 50) => {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    return fallback;
  }

  return Math.min(Math.floor(number), 150);
};

const encode = (value) =>
  encodeURIComponent(String(value ?? "").trim());

const buildUrl = (path) => {
  const cleanPath = String(path || "").replace(/^\/+/, "");

  return `${API_URL.replace(/\/+$/, "")}/${cleanPath}`;
};

// ============================================================
// SAFE JSON REQUEST
// ============================================================

const apiRequest = async (path, options = {}) => {
  const url = buildUrl(path);

  try {
    const response = await fetch(url, {
      method: "GET",
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.headers || {}),
      },
    });

    const contentType =
      response.headers.get("content-type") || "";

    let data;

    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();

      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      const message =
        data?.message ||
        data?.error ||
        `API request failed (${response.status})`;

      throw new Error(message);
    }

    if (
      data &&
      typeof data === "object" &&
      data.success === false
    ) {
      throw new Error(
        data.message ||
          data.error ||
          "API request failed"
      );
    }

    return data;
  } catch (error) {
    console.error(
      `MusicMax API Error [${url}]`,
      error
    );

    throw error;
  }
};

// ============================================================
// RESPONSE NORMALIZATION
// ============================================================

export const extractResults = (response) => {
  if (!response) {
    return [];
  }

  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.results)) {
    return response.data.results;
  }

  if (Array.isArray(response?.results)) {
    return response.results;
  }

  if (Array.isArray(response?.data?.songs)) {
    return response.data.songs;
  }

  if (Array.isArray(response?.songs)) {
    return response.songs;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  return [];
};

export const extractSongs = (response) => {
  if (!response) {
    return [];
  }

  if (Array.isArray(response)) {
    return response;
  }

  const possibleArrays = [
    response?.data?.songs,
    response?.data?.results,
    response?.data?.data,
    response?.songs,
    response?.results,
    response?.data,
  ];

  for (const value of possibleArrays) {
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
};

// ============================================================
// SONG SUGGESTIONS
// ============================================================

export const getSuggestionSong = async (id) => {
  if (!id) {
    throw new Error("Song ID is required");
  }

  return apiRequest(
    `/songs/${encode(id)}/suggestions?limit=150`
  );
};

// ============================================================
// SEARCH
// ============================================================

export const getSearchData = async (query, limit = 150) => {
  const searchQuery = String(query || "").trim();

  if (!searchQuery) {
    return {
      success: true,
      data: {
        results: [],
      },
    };
  }

  const safeLimit = toPositiveLimit(limit, 150);

  return apiRequest(
    `/search?query=${encode(searchQuery)}&limit=${safeLimit}`
  );
};

// ============================================================
// SONG SEARCH
// ============================================================

export const getSongbyQuery = async (
  query,
  limit = 50
) => {
  const searchQuery = String(query || "").trim();

  if (!searchQuery) {
    return {
      success: true,
      data: {
        results: [],
      },
    };
  }

  const safeLimit = toPositiveLimit(limit, 50);

  return apiRequest(
    `/search?query=${encode(searchQuery)}&limit=${safeLimit}`
  );
};

// ============================================================
// ARTIST SEARCH
// ============================================================

export const getArtistbyQuery = async (
  query,
  limit = 50
) => {
  const searchQuery = String(query || "").trim();

  if (!searchQuery) {
    return {
      success: true,
      data: {
        results: [],
      },
    };
  }

  const safeLimit = toPositiveLimit(limit, 50);

  return apiRequest(
    `/search/artists?query=${encode(searchQuery)}&limit=${safeLimit}`
  );
};

export const searchArtistByQuery = async (
  query,
  limit = 50
) => {
  return getArtistbyQuery(query, limit);
};

// ============================================================
// SONG BY ID
// ============================================================

export const getSongById = async (id) => {
  if (!id) {
    throw new Error("Song ID is required");
  }

  return apiRequest(`/songs/${encode(id)}`);
};

// ============================================================
// ALBUM SEARCH
// ============================================================

export const searchAlbumByQuery = async (
  query,
  limit = 50
) => {
  const searchQuery = String(query || "").trim();

  if (!searchQuery) {
    return {
      success: true,
      data: {
        results: [],
      },
    };
  }

  const safeLimit = toPositiveLimit(limit, 50);

  return apiRequest(
    `/search/albums?query=${encode(searchQuery)}&limit=${safeLimit}`
  );
};

// ============================================================
// ALBUM BY ID
// ============================================================

export const fetchAlbumByID = async (id) => {
  if (!id) {
    throw new Error("Album ID is required");
  }

  return apiRequest(`/albums?id=${encode(id)}`);
};

// ============================================================
// ARTIST BY ID
// ============================================================

export const fetchArtistByID = async (id) => {
  if (!id) {
    throw new Error("Artist ID is required");
  }

  return apiRequest(`/artists?id=${encode(id)}`);
};

// ============================================================
// PLAYLIST SEARCH
// ============================================================

export const searchPlayListByQuery = async (
  query,
  limit = 50
) => {
  const searchQuery = String(query || "").trim();

  if (!searchQuery) {
    return {
      success: true,
      data: {
        results: [],
      },
    };
  }

  const safeLimit = toPositiveLimit(limit, 50);

  return apiRequest(
    `/search/playlists?query=${encode(searchQuery)}&limit=${safeLimit}`
  );
};

// ============================================================
// PLAYLIST BY ID
// ============================================================

export const fetchplaylistsByID = async (id) => {
  if (!id) {
    throw new Error("Playlist ID is required");
  }

  return apiRequest(`/playlists?id=${encode(id)}`);
};

// ============================================================
// SONG SUGGESTIONS BY ID
// ============================================================

export const fetchSongSuggestionsByID = async (
  id,
  limit = 50
) => {
  if (!id) {
    throw new Error("Song ID is required");
  }

  const safeLimit = toPositiveLimit(limit, 50);

  return apiRequest(
    `/songs/${encode(id)}/suggestions?limit=${safeLimit}`
  );
};

// ============================================================
// LYRICS
// ============================================================

export const LyricsByID = async (id) => {
  if (!id) {
    throw new Error("Song ID is required");
  }

  return apiRequest(`/lyrics?id=${encode(id)}`);
};

// ============================================================
// NEW TRENDING
// ============================================================

export const getNewTrending = async (
  language,
  limit = 50
) => {
  const normalizedLanguage = String(
    language || ""
  )
    .trim()
    .toLowerCase();

  if (!normalizedLanguage) {
    throw new Error("Language is required");
  }

  const safeLimit = toPositiveLimit(limit, 50);

  return apiRequest(
    `/new_trending?language=${encode(
      normalizedLanguage
    )}&limit=${safeLimit}`
  );
};

// ============================================================
// LANGUAGE NEW TRENDING
// ============================================================

export const getTamilNewTrending = async (
  limit = 50
) => {
  return getNewTrending("tamil", limit);
};

export const getMalayalamNewTrending = async (
  limit = 50
) => {
  return getNewTrending("malayalam", limit);
};

export const getHindiNewTrending = async (
  limit = 50
) => {
  return getNewTrending("hindi", limit);
};

export const getEnglishNewTrending = async (
  limit = 50
) => {
  return getNewTrending("english", limit);
};

export const getNewTrendingLanguages = async (
  limit = 50
) => {
  const results = await Promise.allSettled([
    getTamilNewTrending(limit),
    getMalayalamNewTrending(limit),
    getHindiNewTrending(limit),
    getEnglishNewTrending(limit),
  ]);

  return {
    tamil:
      results[0].status === "fulfilled"
        ? results[0].value
        : null,

    malayalam:
      results[1].status === "fulfilled"
        ? results[1].value
        : null,

    hindi:
      results[2].status === "fulfilled"
        ? results[2].value
        : null,

    english:
      results[3].status === "fulfilled"
        ? results[3].value
        : null,
  };
};

// ============================================================
// FEATURED RADIO
// ============================================================

export const getFeaturedRadio = async (
  name
) => {
  const stationName = String(name || "").trim();

  if (!stationName) {
    throw new Error(
      "Radio station name is required"
    );
  }

  return apiRequest(
    `/radio/featured?name=${encode(
      stationName
    )}`
  );
};

// ============================================================
// LANGUAGE FEATURED RADIO
// ============================================================

export const getTamilFeaturedRadio = async () => {
  return getFeaturedRadio("Tamil");
};

export const getMalayalamFeaturedRadio =
  async () => {
    return getFeaturedRadio("Malayalam");
  };

export const getHindiFeaturedRadio =
  async () => {
    return getFeaturedRadio("Hindi");
  };

export const getEnglishFeaturedRadio =
  async () => {
    return getFeaturedRadio("English");
  };

export const getFeaturedRadioLanguages =
  async () => {
    const results = await Promise.allSettled([
      getTamilFeaturedRadio(),
      getMalayalamFeaturedRadio(),
      getHindiFeaturedRadio(),
      getEnglishFeaturedRadio(),
    ]);

    return {
      tamil:
        results[0].status === "fulfilled"
          ? results[0].value
          : null,

      malayalam:
        results[1].status === "fulfilled"
          ? results[1].value
          : null,

      hindi:
        results[2].status === "fulfilled"
          ? results[2].value
          : null,

      english:
        results[3].status === "fulfilled"
          ? results[3].value
          : null,
    };
  };

// ============================================================
// NEW: ARTIST RADIO
//
// Endpoint:
// /radio/artist?name=Tamil&query=tamil
// ============================================================

export const getArtistRadio = async (
  name,
  query = ""
) => {
  const artistName = String(name || "").trim();

  if (!artistName) {
    throw new Error(
      "Artist radio name is required"
    );
  }

  const searchQuery = String(
    query || artistName
  ).trim();

  const params = new URLSearchParams();

  params.set("name", artistName);

  if (searchQuery) {
    params.set("query", searchQuery);
  }

  return apiRequest(
    `/radio/artist?${params.toString()}`
  );
};

// ============================================================
// LANGUAGE ARTIST RADIO
// ============================================================

export const getTamilArtistRadio = async () => {
  return getArtistRadio(
    "Tamil",
    "tamil"
  );
};

export const getMalayalamArtistRadio =
  async () => {
    return getArtistRadio(
      "Malayalam",
      "malayalam"
    );
  };

export const getHindiArtistRadio =
  async () => {
    return getArtistRadio(
      "Hindi",
      "hindi"
    );
  };

export const getEnglishArtistRadio =
  async () => {
    return getArtistRadio(
      "English",
      "english"
    );
  };

// ============================================================
// ALL ARTIST RADIO
// ============================================================

export const getAllArtistRadio = async () => {
  const results = await Promise.allSettled([
    getTamilArtistRadio(),
    getMalayalamArtistRadio(),
    getHindiArtistRadio(),
    getEnglishArtistRadio(),
  ]);

  return {
    tamil:
      results[0].status === "fulfilled"
        ? results[0].value
        : null,

    malayalam:
      results[1].status === "fulfilled"
        ? results[1].value
        : null,

    hindi:
      results[2].status === "fulfilled"
        ? results[2].value
        : null,

    english:
      results[3].status === "fulfilled"
        ? results[3].value
        : null,
  };
};

// ============================================================
// GET RADIO STATION ID
// ============================================================

export const getRadioStationId = (
  response
) => {
  return (
    response?.data?.stationId ||
    response?.stationId ||
    response?.data?.id ||
    response?.id ||
    null
  );
};

// ============================================================
// EXTRACT RADIO SONGS
//
// Supports different possible response shapes.
// ============================================================

export const extractRadioSongs = (
  response
) => {
  if (!response) {
    return [];
  }

  if (Array.isArray(response)) {
    return response;
  }

  const possibleArrays = [
    response?.data?.songs,
    response?.data?.results,
    response?.data?.tracks,
    response?.data?.items,
    response?.songs,
    response?.results,
    response?.tracks,
    response?.items,
  ];

  for (const list of possibleArrays) {
    if (Array.isArray(list)) {
      return list;
    }
  }

  return [];
};

// ============================================================
// COMBINED LANGUAGE RADIO
//
// Gets:
// 1. Artist radio metadata
// 2. Language trending songs
//
// IMPORTANT:
// stationId is NOT treated as an audio URL.
// ============================================================

export const getLanguageRadio = async (
  language,
  limit = 50
) => {
  const normalizedLanguage = String(
    language || ""
  )
    .trim()
    .toLowerCase();

  if (!normalizedLanguage) {
    throw new Error("Language is required");
  }

  const radioName =
    normalizedLanguage.charAt(0).toUpperCase() +
    normalizedLanguage.slice(1);

  const [
    radioResult,
    songsResult,
  ] = await Promise.allSettled([
    getArtistRadio(
      radioName,
      normalizedLanguage
    ),

    getNewTrending(
      normalizedLanguage,
      limit
    ),
  ]);

  const radio =
    radioResult.status === "fulfilled"
      ? radioResult.value
      : null;

  const songs =
    songsResult.status === "fulfilled"
      ? extractSongs(songsResult.value)
      : [];

  return {
    language: normalizedLanguage,

    stationId:
      getRadioStationId(radio),

    radio,

    songs,

    radioError:
      radioResult.status === "rejected"
        ? radioResult.reason
        : null,

    songsError:
      songsResult.status === "rejected"
        ? songsResult.reason
        : null,
  };
};

// ============================================================
// LANGUAGE RADIO SHORTCUTS
// ============================================================

export const getTamilRadio = async (
  limit = 50
) => {
  return getLanguageRadio(
    "tamil",
    limit
  );
};

export const getMalayalamRadio =
  async (limit = 50) => {
    return getLanguageRadio(
      "malayalam",
      limit
    );
  };

export const getHindiRadio = async (
  limit = 50
) => {
  return getLanguageRadio(
    "hindi",
    limit
  );
};

export const getEnglishRadio = async (
  limit = 50
) => {
  return getLanguageRadio(
    "english",
    limit
  );
};

// ============================================================
// ALL LANGUAGE RADIO
// ============================================================

export const getAllLanguageRadio =
  async (limit = 50) => {
    const results = await Promise.allSettled([
      getTamilRadio(limit),
      getMalayalamRadio(limit),
      getHindiRadio(limit),
      getEnglishRadio(limit),
    ]);

    return {
      tamil:
        results[0].status === "fulfilled"
          ? results[0].value
          : null,

      malayalam:
        results[1].status === "fulfilled"
          ? results[1].value
          : null,

      hindi:
        results[2].status === "fulfilled"
          ? results[2].value
          : null,

      english:
        results[3].status === "fulfilled"
          ? results[3].value
          : null,
    };
};

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {
  getSuggestionSong,
  getSearchData,
  getSongbyQuery,
  getArtistbyQuery,
  getSongById,

  searchAlbumByQuery,
  searchArtistByQuery,
  fetchAlbumByID,
  fetchArtistByID,

  searchPlayListByQuery,
  fetchplaylistsByID,

  fetchSongSuggestionsByID,
  LyricsByID,

  getNewTrending,
  getTamilNewTrending,
  getMalayalamNewTrending,
  getHindiNewTrending,
  getEnglishNewTrending,
  getNewTrendingLanguages,

  getFeaturedRadio,
  getTamilFeaturedRadio,
  getMalayalamFeaturedRadio,
  getHindiFeaturedRadio,
  getEnglishFeaturedRadio,
  getFeaturedRadioLanguages,

  getArtistRadio,
  getTamilArtistRadio,
  getMalayalamArtistRadio,
  getHindiArtistRadio,
  getEnglishArtistRadio,
  getAllArtistRadio,

  getRadioStationId,
  extractRadioSongs,

  getLanguageRadio,
  getTamilRadio,
  getMalayalamRadio,
  getHindiRadio,
  getEnglishRadio,
  getAllLanguageRadio,
};
