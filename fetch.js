// ============================================================
// MusicMax - API / fetch.js
// JioSaavn Developer API
// ============================================================

const API_URL = "https://jiosaavndev.vercel.app/api";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 150;
const REQUEST_TIMEOUT_MS = 15000;

// ============================================================
// COMMON HELPERS
// ============================================================

const toPositiveLimit = (value, fallback = DEFAULT_LIMIT) => {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    return fallback;
  }

  return Math.min(Math.floor(number), MAX_LIMIT);
};

const encode = (value) =>
  encodeURIComponent(String(value ?? "").trim());

const buildUrl = (path) => {
  const cleanPath = String(path || "").replace(/^\/+/, "");
  return `${API_URL.replace(/\/+$/, "")}/${cleanPath}`;
};

const normalizeLanguage = (language) => {
  const value = String(language || "").trim().toLowerCase();
  if (!value) return "";
  return value;
};

const capitalize = (value) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "";

// ============================================================
// SAFE JSON REQUEST (with timeout + abort)
// ============================================================

const apiRequest = async (path, options = {}) => {
  const url = buildUrl(path);
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    options.timeout ?? REQUEST_TIMEOUT_MS
  );

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

    const contentType = response.headers.get("content-type") || "";

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

    if (data && typeof data === "object" && data.success === false) {
      throw new Error(
        data.message || data.error || "API request failed"
      );
    }

    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      const timeoutError = new Error(
        `API request timed out after ${REQUEST_TIMEOUT_MS}ms`
      );
      console.error(`MusicMax API Timeout [${url}]`);
      throw timeoutError;
    }

    console.error(`MusicMax API Error [${url}]`, error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

// ============================================================
// RESPONSE NORMALIZATION
// ============================================================

export const extractResults = (response) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;

  const possibleArrays = [
    response?.data?.results,
    response?.data?.songs,
    response?.data?.data,
    response?.results,
    response?.songs,
    response?.data,
  ];

  for (const value of possibleArrays) {
    if (Array.isArray(value)) return value;
  }

  return [];
};

export const extractSongs = (response) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;

  const possibleArrays = [
    response?.data?.songs,
    response?.data?.results,
    response?.data?.data,
    response?.songs,
    response?.results,
    response?.data,
  ];

  for (const value of possibleArrays) {
    if (Array.isArray(value)) return value;
  }

  return [];
};

// ============================================================
// SEARCH HELPERS
// ============================================================

const emptySearchResponse = () => ({
  success: true,
  data: { results: [] },
});

const performSearch = async (endpoint, query, limit) => {
  const searchQuery = String(query || "").trim();
  if (!searchQuery) return emptySearchResponse();

  const safeLimit = toPositiveLimit(limit, DEFAULT_LIMIT);
  return apiRequest(
    `${endpoint}?query=${encode(searchQuery)}&limit=${safeLimit}`
  );
};

// ============================================================
// SONG SUGGESTIONS
// ============================================================

export const getSuggestionSong = async (id, limit = 150) => {
  if (!id) throw new Error("Song ID is required");
  const safeLimit = toPositiveLimit(limit, 150);

  return apiRequest(
    `/songs/${encode(id)}/suggestions?limit=${safeLimit}`
  );
};

// ============================================================
// SEARCH
// ============================================================

export const getSearchData = async (query, limit = 150) =>
  performSearch("/search", query, limit);

export const getSongbyQuery = async (query, limit = DEFAULT_LIMIT) =>
  performSearch("/search", query, limit);

export const getArtistbyQuery = async (query, limit = DEFAULT_LIMIT) =>
  performSearch("/search/artists", query, limit);

export const searchArtistByQuery = (query, limit = DEFAULT_LIMIT) =>
  getArtistbyQuery(query, limit);

export const searchAlbumByQuery = async (query, limit = DEFAULT_LIMIT) =>
  performSearch("/search/albums", query, limit);

export const searchPlayListByQuery = async (query, limit = DEFAULT_LIMIT) =>
  performSearch("/search/playlists", query, limit);

// ============================================================
// SONG / ALBUM / ARTIST / PLAYLIST BY ID
// ============================================================

export const getSongById = async (id) => {
  if (!id) throw new Error("Song ID is required");
  return apiRequest(`/songs/${encode(id)}`);
};

export const fetchAlbumByID = async (id) => {
  if (!id) throw new Error("Album ID is required");
  return apiRequest(`/albums?id=${encode(id)}`);
};

export const fetchArtistByID = async (id) => {
  if (!id) throw new Error("Artist ID is required");
  return apiRequest(`/artists?id=${encode(id)}`);
};

export const fetchplaylistsByID = async (id) => {
  if (!id) throw new Error("Playlist ID is required");
  return apiRequest(`/playlists?id=${encode(id)}`);
};

// ============================================================
// SONG SUGGESTIONS BY ID
// ============================================================

export const fetchSongSuggestionsByID = async (id, limit = DEFAULT_LIMIT) => {
  if (!id) throw new Error("Song ID is required");
  const safeLimit = toPositiveLimit(limit, DEFAULT_LIMIT);
  return apiRequest(
    `/songs/${encode(id)}/suggestions?limit=${safeLimit}`
  );
};

// ============================================================
// LYRICS
// ============================================================

export const LyricsByID = async (id) => {
  if (!id) throw new Error("Song ID is required");
  return apiRequest(`/lyrics?id=${encode(id)}`);
};

// ============================================================
// NEW TRENDING
// ============================================================

export const getNewTrending = async (language, limit = DEFAULT_LIMIT) => {
  const lang = normalizeLanguage(language);
  if (!lang) throw new Error("Language is required");

  const safeLimit = toPositiveLimit(limit, DEFAULT_LIMIT);
  return apiRequest(
    `/new_trending?language=${encode(lang)}&limit=${safeLimit}`
  );
};

export const getTamilNewTrending = (limit = DEFAULT_LIMIT) =>
  getNewTrending("tamil", limit);

export const getMalayalamNewTrending = (limit = DEFAULT_LIMIT) =>
  getNewTrending("malayalam", limit);

export const getHindiNewTrending = (limit = DEFAULT_LIMIT) =>
  getNewTrending("hindi", limit);

export const getEnglishNewTrending = (limit = DEFAULT_LIMIT) =>
  getNewTrending("english", limit);

export const getNewTrendingLanguages = async (limit = DEFAULT_LIMIT) => {
  const [tamil, malayalam, hindi, english] = await Promise.allSettled([
    getTamilNewTrending(limit),
    getMalayalamNewTrending(limit),
    getHindiNewTrending(limit),
    getEnglishNewTrending(limit),
  ]);

  const unwrap = (r) => (r.status === "fulfilled" ? r.value : null);

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

export const getFeaturedRadio = async (name) => {
  const stationName = String(name || "").trim();
  if (!stationName) throw new Error("Radio station name is required");
  return apiRequest(`/radio/featured?name=${encode(stationName)}`);
};

export const getTamilFeaturedRadio = () => getFeaturedRadio("Tamil");
export const getMalayalamFeaturedRadio = () => getFeaturedRadio("Malayalam");
export const getHindiFeaturedRadio = () => getFeaturedRadio("Hindi");
export const getEnglishFeaturedRadio = () => getFeaturedRadio("English");

export const getFeaturedRadioLanguages = async () => {
  const [tamil, malayalam, hindi, english] = await Promise.allSettled([
    getTamilFeaturedRadio(),
    getMalayalamFeaturedRadio(),
    getHindiFeaturedRadio(),
    getEnglishFeaturedRadio(),
  ]);

  const unwrap = (r) => (r.status === "fulfilled" ? r.value : null);

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

export const getArtistRadio = async (name, query = "") => {
  const artistName = String(name || "").trim();
  if (!artistName) throw new Error("Artist radio name is required");

  const searchQuery = String(query || artistName).trim();
  const params = new URLSearchParams({ name: artistName });
  if (searchQuery) params.set("query", searchQuery);

  return apiRequest(`/radio/artist?${params.toString()}`);
};

export const getTamilArtistRadio = () => getArtistRadio("Tamil", "tamil");
export const getMalayalamArtistRadio = () =>
  getArtistRadio("Malayalam", "malayalam");
export const getHindiArtistRadio = () => getArtistRadio("Hindi", "hindi");
export const getEnglishArtistRadio = () => getArtistRadio("English", "english");

export const getAllArtistRadio = async () => {
  const [tamil, malayalam, hindi, english] = await Promise.allSettled([
    getTamilArtistRadio(),
    getMalayalamArtistRadio(),
    getHindiArtistRadio(),
    getEnglishArtistRadio(),
  ]);

  const unwrap = (r) => (r.status === "fulfilled" ? r.value : null);

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

export const getRadioStationId = (response) =>
  response?.data?.stationId ??
  response?.stationId ??
  response?.data?.id ??
  response?.id ??
  null;

export const extractRadioSongs = (response) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;

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
    if (Array.isArray(list)) return list;
  }

  return [];
};

// ============================================================
// COMBINED LANGUAGE RADIO
// ============================================================

export const getLanguageRadio = async (language, limit = DEFAULT_LIMIT) => {
  const lang = normalizeLanguage(language);
  if (!lang) throw new Error("Language is required");

  const radioName = capitalize(lang);

  const [radioResult, songsResult] = await Promise.allSettled([
    getArtistRadio(radioName, lang),
    getNewTrending(lang, limit),
  ]);

  const radio =
    radioResult.status === "fulfilled" ? radioResult.value : null;

  const trendingSongs =
    songsResult.status === "fulfilled"
      ? extractSongs(songsResult.value)
      : [];

  // Try to extract songs embedded in the radio response too.
  const radioSongs = extractRadioSongs(radio);

  return {
    language: lang,
    stationId: getRadioStationId(radio),
    radio,
    songs: trendingSongs.length ? trendingSongs : radioSongs,
    radioError:
      radioResult.status === "rejected" ? radioResult.reason : null,
    songsError:
      songsResult.status === "rejected" ? songsResult.reason : null,
  };
};

// ============================================================
// LANGUAGE RADIO SHORTCUTS
// ============================================================

export const getTamilRadio = (limit = DEFAULT_LIMIT) =>
  getLanguageRadio("tamil", limit);

export const getMalayalamRadio = (limit = DEFAULT_LIMIT) =>
  getLanguageRadio("malayalam", limit);

export const getHindiRadio = (limit = DEFAULT_LIMIT) =>
  getLanguageRadio("hindi", limit);

export const getEnglishRadio = (limit = DEFAULT_LIMIT) =>
  getLanguageRadio("english", limit);

export const getAllLanguageRadio = async (limit = DEFAULT_LIMIT) => {
  const [tamil, malayalam, hindi, english] = await Promise.allSettled([
    getTamilRadio(limit),
    getMalayalamRadio(limit),
    getHindiRadio(limit),
    getEnglishRadio(limit),
  ]);

  const unwrap = (r) => (r.status === "fulfilled" ? r.value : null);

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
