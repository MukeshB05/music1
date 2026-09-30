// ============================================================
// MusicMax - API / fetch.js
// JioSaavn Developer API
// ============================================================

const API_URL = "https://jiosaavndev.vercel.app/api";

// ============================================================
// CONFIG
// ============================================================

// Number of items requested from the API per page.
// This is NOT a total-result limit.
const PAGE_SIZE = 50;

const DEFAULT_LIMIT = Infinity;
const REQUEST_TIMEOUT_MS = 15000;

// ============================================================
// COMMON HELPERS
// ============================================================

const toLimit = (value) => {
  if (
    value === Infinity ||
    value === "Infinity" ||
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return Infinity;
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    return Infinity;
  }

  return Math.floor(number);
};

const encode = (value) =>
  encodeURIComponent(String(value ?? "").trim());

const buildUrl = (path) => {
  const cleanPath = String(path || "").replace(/^\/+/, "");

  return `${API_URL.replace(/\/+$/, "")}/${cleanPath}`;
};

const normalizeLanguage = (language) => {
  const value = String(language || "")
    .trim()
    .toLowerCase();

  return value;
};

const capitalize = (value) =>
  value
    ? value.charAt(0).toUpperCase() + value.slice(1)
    : "";

// ============================================================
// UNIQUE ITEMS
// ============================================================

const getItemId = (item) => {
  if (!item) {
    return null;
  }

  return (
    item.id ||
    item.songId ||
    item.song_id ||
    item.trackId ||
    item.albumId ||
    item.playlistId ||
    item.artistId ||
    null
  );
};

const uniqueItems = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  const seen = new Set();
  const result = [];

  for (const item of items) {
    const id = getItemId(item);

    // No ID: keep the item.
    if (!id) {
      result.push(item);
      continue;
    }

    const key = String(id);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(item);
  }

  return result;
};

// ============================================================
// SAFE JSON REQUEST
// ============================================================

const apiRequest = async (path, options = {}) => {
  const url = buildUrl(path);

  const controller = new AbortController();

  const timeout = options.timeout ?? REQUEST_TIMEOUT_MS;

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const response = await fetch(url, {
      method: "GET",
      ...options,
      signal: controller.signal,

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
    if (error?.name === "AbortError") {
      const timeoutError = new Error(
        `API request timed out after ${timeout}ms`
      );

      console.error(
        `MusicMax API Timeout [${url}]`
      );

      throw timeoutError;
    }

    console.error(
      `MusicMax API Error [${url}]`,
      error
    );

    throw error;
  } finally {
    clearTimeout(timeoutId);
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

  const possibleArrays = [
    response?.data?.results,
    response?.data?.songs,
    response?.data?.albums,
    response?.data?.playlists,
    response?.data?.artists,
    response?.data?.data,
    response?.results,
    response?.songs,
    response?.albums,
    response?.playlists,
    response?.artists,
    response?.data,
  ];

  for (const value of possibleArrays) {
    if (Array.isArray(value)) {
      return value;
    }
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
// REPLACE RESPONSE ARRAY
// ============================================================

const responseWithResults = (response, results) => {
  const unique = uniqueItems(results);

  if (Array.isArray(response)) {
    return unique;
  }

  if (
    !response ||
    typeof response !== "object"
  ) {
    return {
      success: true,
      data: {
        results: unique,
      },
    };
  }

  // data.songs
  if (Array.isArray(response?.data?.songs)) {
    return {
      ...response,
      data: {
        ...response.data,
        songs: unique,
      },
    };
  }

  // data.results
  if (Array.isArray(response?.data?.results)) {
    return {
      ...response,
      data: {
        ...response.data,
        results: unique,
      },
    };
  }

  // data.albums
  if (Array.isArray(response?.data?.albums)) {
    return {
      ...response,
      data: {
        ...response.data,
        albums: unique,
      },
    };
  }

  // data.playlists
  if (Array.isArray(response?.data?.playlists)) {
    return {
      ...response,
      data: {
        ...response.data,
        playlists: unique,
      },
    };
  }

  // data.artists
  if (Array.isArray(response?.data?.artists)) {
    return {
      ...response,
      data: {
        ...response.data,
        artists: unique,
      },
    };
  }

  // data.data
  if (Array.isArray(response?.data?.data)) {
    return {
      ...response,
      data: {
        ...response.data,
        data: unique,
      },
    };
  }

  // results
  if (Array.isArray(response?.results)) {
    return {
      ...response,
      results: unique,
    };
  }

  // songs
  if (Array.isArray(response?.songs)) {
    return {
      ...response,
      songs: unique,
    };
  }

  // albums
  if (Array.isArray(response?.albums)) {
    return {
      ...response,
      albums: unique,
    };
  }

  // playlists
  if (Array.isArray(response?.playlists)) {
    return {
      ...response,
      playlists: unique,
    };
  }

  // artists
  if (Array.isArray(response?.artists)) {
    return {
      ...response,
      artists: unique,
    };
  }

  return {
    ...response,
    data: unique,
  };
};

// Keep old function name compatible.
const responseWithSongs = (response, songs) => {
  return responseWithResults(response, songs);
};

// ============================================================
// UNLIMITED PAGINATED COLLECTION REQUEST
// ============================================================
//
// IMPORTANT:
//
// There is NO client-side maximum here.
//
// The function continues:
//   page=1
//   page=2
//   page=3
//   ...
//
// until:
//
// 1. The API returns no items, OR
// 2. The API returns only items that were already received.
//
// This prevents an infinite loop if the backend does not actually
// support pagination and keeps returning the same page.
//
// `limit` can still optionally be supplied if a caller specifically
// wants a finite number.
//
// Default = Infinity.
// ============================================================

const fetchCollection = async (
  endpoint,
  params = {},
  limit = DEFAULT_LIMIT
) => {
  const requestedLimit = toLimit(limit);

  const allResults = [];
  const seen = new Set();

  let page = 1;
  let firstResponse = null;

  while (true) {
    const urlParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
      ) {
        urlParams.set(key, String(value));
      }
    }

    urlParams.set("page", String(page));
    urlParams.set("limit", String(PAGE_SIZE));

    let response;

    try {
      response = await apiRequest(
        `${endpoint}?${urlParams.toString()}`
      );
    } catch (error) {
      // If the first page fails, propagate the error.
      if (page === 1) {
        throw error;
      }

      // If a later page fails, return everything already fetched.
      console.warn(
        `Pagination stopped at page ${page}:`,
        error
      );

      break;
    }

    if (!firstResponse) {
      firstResponse = response;
    }

    const pageResults = extractResults(response);

    // No more data.
    if (!Array.isArray(pageResults) || pageResults.length === 0) {
      break;
    }

    let addedThisPage = 0;

    for (const item of pageResults) {
      const id = getItemId(item);

      // If the API item has no ID, retain it.
      if (!id) {
        allResults.push(item);
        addedThisPage++;
        continue;
      }

      const key = String(id);

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      allResults.push(item);
      addedThisPage++;
    }

    // Optional caller limit.
    if (
      requestedLimit !== Infinity &&
      allResults.length >= requestedLimit
    ) {
      break;
    }

    // Backend is returning the same data repeatedly.
    // Stop to prevent an infinite request loop.
    if (addedThisPage === 0) {
      break;
    }

    // A short page normally means the backend has no more data.
    if (pageResults.length < PAGE_SIZE) {
      break;
    }

    page++;
  }

  const finalResults =
    requestedLimit === Infinity
      ? allResults
      : allResults.slice(0, requestedLimit);

  return responseWithResults(
    firstResponse || {
      success: true,
      data: {
        results: [],
      },
    },
    finalResults
  );
};

// ============================================================
// SEARCH HELPERS
// ============================================================

const emptySearchResponse = () => ({
  success: true,
  data: {
    results: [],
  },
});

const performSearch = async (
  endpoint,
  query,
  limit = Infinity
) => {
  const searchQuery =
    String(query || "").trim();

  if (!searchQuery) {
    return emptySearchResponse();
  }

  return fetchCollection(
    endpoint,
    {
      query: searchQuery,
    },
    limit
  );
};

// ============================================================
// SONG SUGGESTIONS - UNLIMITED
// ============================================================

export const getSuggestionSong = async (
  id,
  limit = Infinity
) => {
  if (!id) {
    throw new Error("Song ID is required");
  }

  return fetchCollection(
    `/songs/${encode(id)}/suggestions`,
    {},
    limit
  );
};

// ============================================================
// SEARCH - UNLIMITED
// ============================================================

export const getSearchData = async (
  query,
  limit = Infinity
) => {
  return performSearch(
    "/search",
    query,
    limit
  );
};

export const getSongbyQuery = async (
  query,
  limit = Infinity
) => {
  return performSearch(
    "/search",
    query,
    limit
  );
};

// ============================================================
// ARTIST SEARCH - UNLIMITED
// ============================================================

export const getArtistbyQuery = async (
  query,
  limit = Infinity
) => {
  return performSearch(
    "/search/artists",
    query,
    limit
  );
};

export const searchArtistByQuery = (
  query,
  limit = Infinity
) => {
  return getArtistbyQuery(
    query,
    limit
  );
};

// ============================================================
// ALBUM SEARCH - UNLIMITED
// ============================================================

export const searchAlbumByQuery = async (
  query,
  limit = Infinity
) => {
  return performSearch(
    "/search/albums",
    query,
    limit
  );
};

// ============================================================
// PLAYLIST SEARCH - UNLIMITED
// ============================================================

export const searchPlayListByQuery = async (
  query,
  limit = Infinity
) => {
  return performSearch(
    "/search/playlists",
    query,
    limit
  );
};

// ============================================================
// SONG / ALBUM / ARTIST / PLAYLIST BY ID
// ============================================================

export const getSongById = async (id) => {
  if (!id) {
    throw new Error("Song ID is required");
  }

  return apiRequest(
    `/songs/${encode(id)}`
  );
};

export const fetchAlbumByID = async (id) => {
  if (!id) {
    throw new Error("Album ID is required");
  }

  return apiRequest(
    `/albums?id=${encode(id)}`
  );
};

export const fetchArtistByID = async (id) => {
  if (!id) {
    throw new Error("Artist ID is required");
  }

  return apiRequest(
    `/artists?id=${encode(id)}`
  );
};

export const fetchplaylistsByID = async (id) => {
  if (!id) {
    throw new Error("Playlist ID is required");
  }

  return apiRequest(
    `/playlists?id=${encode(id)}`
  );
};

// ============================================================
// SONG SUGGESTIONS BY ID - UNLIMITED
// ============================================================

export const fetchSongSuggestionsByID = async (
  id,
  limit = Infinity
) => {
  if (!id) {
    throw new Error("Song ID is required");
  }

  return fetchCollection(
    `/songs/${encode(id)}/suggestions`,
    {},
    limit
  );
};

// ============================================================
// LYRICS
// ============================================================

export const LyricsByID = async (id) => {
  if (!id) {
    throw new Error("Song ID is required");
  }

  return apiRequest(
    `/lyrics?id=${encode(id)}`
  );
};

// ============================================================
// NEW TRENDING - UNLIMITED
// ============================================================

export const getNewTrending = async (
  language,
  limit = Infinity
) => {
  const lang =
    normalizeLanguage(language);

  if (!lang) {
    throw new Error("Language is required");
  }

  return fetchCollection(
    "/new_trending",
    {
      language: lang,
    },
    limit
  );
};

export const getTamilNewTrending = (
  limit = Infinity
) =>
  getNewTrending(
    "tamil",
    limit
  );

export const getMalayalamNewTrending = (
  limit = Infinity
) =>
  getNewTrending(
    "malayalam",
    limit
  );

export const getHindiNewTrending = (
  limit = Infinity
) =>
  getNewTrending(
    "hindi",
    limit
  );

export const getEnglishNewTrending = (
  limit = Infinity
) =>
  getNewTrending(
    "english",
    limit
  );

// ============================================================
// NEW TRENDING - ALL LANGUAGES
// ============================================================

export const getNewTrendingLanguages = async (
  limit = Infinity
) => {
  const [
    tamil,
    malayalam,
    hindi,
    english,
  ] = await Promise.allSettled([
    getTamilNewTrending(limit),
    getMalayalamNewTrending(limit),
    getHindiNewTrending(limit),
    getEnglishNewTrending(limit),
  ]);

  const unwrap = (result) =>
    result.status === "fulfilled"
      ? result.value
      : null;

  return {
    tamil: unwrap(tamil),
    malayalam: unwrap(malayalam),
    hindi: unwrap(hindi),
    english: unwrap(english),
  };
};

// ============================================================
// FEATURED RADIO
// ============================================================

export const getFeaturedRadio = async (
  name
) => {
  const stationName =
    String(name || "").trim();

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

export const getTamilFeaturedRadio = () =>
  getFeaturedRadio("Tamil");

export const getMalayalamFeaturedRadio = () =>
  getFeaturedRadio("Malayalam");

export const getHindiFeaturedRadio = () =>
  getFeaturedRadio("Hindi");

export const getEnglishFeaturedRadio = () =>
  getFeaturedRadio("English");

export const getFeaturedRadioLanguages =
  async () => {
    const [
      tamil,
      malayalam,
      hindi,
      english,
    ] = await Promise.allSettled([
      getTamilFeaturedRadio(),
      getMalayalamFeaturedRadio(),
      getHindiFeaturedRadio(),
      getEnglishFeaturedRadio(),
    ]);

    const unwrap = (result) =>
      result.status === "fulfilled"
        ? result.value
        : null;

    return {
      tamil: unwrap(tamil),
      malayalam: unwrap(malayalam),
      hindi: unwrap(hindi),
      english: unwrap(english),
    };
  };

// ============================================================
// ARTIST RADIO
// ============================================================

export const getArtistRadio = async (
  name,
  query = ""
) => {
  const artistName =
    String(name || "").trim();

  if (!artistName) {
    throw new Error(
      "Artist radio name is required"
    );
  }

  const searchQuery =
    String(query || artistName).trim();

  const params =
    new URLSearchParams({
      name: artistName,
    });

  if (searchQuery) {
    params.set(
      "query",
      searchQuery
    );
  }

  return apiRequest(
    `/radio/artist?${params.toString()}`
  );
};

export const getTamilArtistRadio = () =>
  getArtistRadio(
    "Tamil",
    "tamil"
  );

export const getMalayalamArtistRadio = () =>
  getArtistRadio(
    "Malayalam",
    "malayalam"
  );

export const getHindiArtistRadio = () =>
  getArtistRadio(
    "Hindi",
    "hindi"
  );

export const getEnglishArtistRadio = () =>
  getArtistRadio(
    "English",
    "english"
  );

export const getAllArtistRadio = async () => {
  const [
    tamil,
    malayalam,
    hindi,
    english,
  ] = await Promise.allSettled([
    getTamilArtistRadio(),
    getMalayalamArtistRadio(),
    getHindiArtistRadio(),
    getEnglishArtistRadio(),
  ]);

  const unwrap = (result) =>
    result.status === "fulfilled"
      ? result.value
      : null;

  return {
    tamil: unwrap(tamil),
    malayalam: unwrap(malayalam),
    hindi: unwrap(hindi),
    english: unwrap(english),
  };
};

// ============================================================
// RADIO HELPERS
// ============================================================

export const getRadioStationId = (
  response
) =>
  response?.data?.stationId ??
  response?.stationId ??
  response?.data?.id ??
  response?.id ??
  null;

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
// ============================================================

export const getLanguageRadio = async (
  language,
  limit = Infinity
) => {
  const lang =
    normalizeLanguage(language);

  if (!lang) {
    throw new Error(
      "Language is required"
    );
  }

  const radioName =
    capitalize(lang);

  const [
    radioResult,
    songsResult,
  ] = await Promise.allSettled([
    getArtistRadio(
      radioName,
      lang
    ),

    getNewTrending(
      lang,
      limit
    ),
  ]);

  const radio =
    radioResult.status === "fulfilled"
      ? radioResult.value
      : null;

  const trendingSongs =
    songsResult.status === "fulfilled"
      ? extractSongs(
          songsResult.value
        )
      : [];

  const radioSongs =
    extractRadioSongs(radio);

  return {
    language: lang,

    stationId:
      getRadioStationId(radio),

    radio,

    songs: uniqueItems(
      trendingSongs.length
        ? trendingSongs
        : radioSongs
    ).slice(
      0,
      limit === Infinity
        ? undefined
        : toLimit(limit)
    ),

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

export const getTamilRadio = (
  limit = Infinity
) =>
  getLanguageRadio(
    "tamil",
    limit
  );

export const getMalayalamRadio = (
  limit = Infinity
) =>
  getLanguageRadio(
    "malayalam",
    limit
  );

export const getHindiRadio = (
  limit = Infinity
) =>
  getLanguageRadio(
    "hindi",
    limit
  );

export const getEnglishRadio = (
  limit = Infinity
) =>
  getLanguageRadio(
    "english",
    limit
  );

export const getAllLanguageRadio = async (
  limit = Infinity
) => {
  const [
    tamil,
    malayalam,
    hindi,
    english,
  ] = await Promise.allSettled([
    getTamilRadio(limit),
    getMalayalamRadio(limit),
    getHindiRadio(limit),
    getEnglishRadio(limit),
  ]);

  const unwrap = (result) =>
    result.status === "fulfilled"
      ? result.value
      : null;

  return {
    tamil: unwrap(tamil),
    malayalam: unwrap(malayalam),
    hindi: unwrap(hindi),
    english: unwrap(english),
  };
};

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {
  // Suggestions
  getSuggestionSong,
  fetchSongSuggestionsByID,

  // Search
  getSearchData,
  getSongbyQuery,
  getArtistbyQuery,
  searchArtistByQuery,
  searchAlbumByQuery,
  searchPlayListByQuery,

  // By ID
  getSongById,
  fetchAlbumByID,
  fetchArtistByID,
  fetchplaylistsByID,
  LyricsByID,

  // Trending
  getNewTrending,
  getTamilNewTrending,
  getMalayalamNewTrending,
  getHindiNewTrending,
  getEnglishNewTrending,
  getNewTrendingLanguages,

  // Featured Radio
  getFeaturedRadio,
  getTamilFeaturedRadio,
  getMalayalamFeaturedRadio,
  getHindiFeaturedRadio,
  getEnglishFeaturedRadio,
  getFeaturedRadioLanguages,

  // Artist Radio
  getArtistRadio,
  getTamilArtistRadio,
  getMalayalamArtistRadio,
  getHindiArtistRadio,
  getEnglishArtistRadio,
  getAllArtistRadio,

  // Radio Helpers
  getRadioStationId,
  extractRadioSongs,

  // Language Radio
  getLanguageRadio,
  getTamilRadio,
  getMalayalamRadio,
  getHindiRadio,
  getEnglishRadio,
  getAllLanguageRadio,

  // Extractors
  extractResults,
  extractSongs,
};
