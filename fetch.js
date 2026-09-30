// ============================================================
// MusicMax - API / fetch.js
// JioSaavn Developer API
// ============================================================

const API_URL = "https://jiosaavndev.vercel.app/api";

// ============================================================
// LIMITS
// ============================================================

// Maximum songs we want from a collection
const MAX_LIMIT = 100;

// Most JioSaavn-compatible endpoints work reliably with
// 50 items per request. We fetch multiple pages when needed.
const PAGE_SIZE = 50;

const DEFAULT_LIMIT = 50;
const REQUEST_TIMEOUT_MS = 15000;

// ============================================================
// COMMON HELPERS
// ============================================================

const toPositiveLimit = (
  value,
  fallback = DEFAULT_LIMIT
) => {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    return fallback;
  }

  return Math.min(
    Math.floor(number),
    MAX_LIMIT
  );
};

const encode = (value) =>
  encodeURIComponent(
    String(value ?? "").trim()
  );

const buildUrl = (path) => {
  const cleanPath = String(path || "")
    .replace(/^\/+/, "");

  return `${API_URL.replace(
    /\/+$/,
    ""
  )}/${cleanPath}`;
};

const normalizeLanguage = (
  language
) => {
  const value = String(
    language || ""
  )
    .trim()
    .toLowerCase();

  if (!value) {
    return "";
  }

  return value;
};

const capitalize = (value) =>
  value
    ? value.charAt(0).toUpperCase() +
      value.slice(1)
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
    null
  );
};

const uniqueItems = (
  items
) => {
  if (!Array.isArray(items)) {
    return [];
  }

  const seen = new Set();
  const result = [];

  for (const item of items) {
    const id = getItemId(item);

    // If there is no ID, keep the item.
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

const apiRequest = async (
  path,
  options = {}
) => {
  const url = buildUrl(path);

  const controller =
    new AbortController();

  const timeoutId =
    setTimeout(
      () =>
        controller.abort(),
      options.timeout ??
        REQUEST_TIMEOUT_MS
    );

  try {
    const response =
      await fetch(url, {
        method: "GET",
        ...options,
        signal:
          controller.signal,

        headers: {
          Accept:
            "application/json",
          ...(options.headers ||
            {}),
        },
      });

    const contentType =
      response.headers.get(
        "content-type"
      ) || "";

    let data;

    if (
      contentType.includes(
        "application/json"
      )
    ) {
      data =
        await response.json();
    } else {
      const text =
        await response.text();

      try {
        data =
          JSON.parse(text);
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
      typeof data ===
        "object" &&
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
    if (
      error?.name ===
      "AbortError"
    ) {
      const timeoutError =
        new Error(
          `API request timed out after ${REQUEST_TIMEOUT_MS}ms`
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
    clearTimeout(
      timeoutId
    );
  }
};

// ============================================================
// RESPONSE NORMALIZATION
// ============================================================

export const extractResults = (
  response
) => {
  if (!response) {
    return [];
  }

  if (
    Array.isArray(response)
  ) {
    return response;
  }

  const possibleArrays = [
    response?.data?.results,
    response?.data?.songs,
    response?.data?.data,
    response?.results,
    response?.songs,
    response?.data,
  ];

  for (
    const value of possibleArrays
  ) {
    if (
      Array.isArray(value)
    ) {
      return value;
    }
  }

  return [];
};

export const extractSongs = (
  response
) => {
  if (!response) {
    return [];
  }

  if (
    Array.isArray(response)
  ) {
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

  for (
    const value of possibleArrays
  ) {
    if (
      Array.isArray(value)
    ) {
      return value;
    }
  }

  return [];
};

// ============================================================
// REPLACE RESPONSE SONG ARRAY
// ============================================================

const responseWithSongs = (
  response,
  songs
) => {
  const unique =
    uniqueItems(songs);

  if (
    Array.isArray(response)
  ) {
    return unique;
  }

  if (
    !response ||
    typeof response !==
      "object"
  ) {
    return {
      success: true,
      data: {
        results: unique,
      },
    };
  }

  // ----------------------------------------------------------
  // data.songs
  // ----------------------------------------------------------

  if (
    Array.isArray(
      response?.data?.songs
    )
  ) {
    return {
      ...response,
      data: {
        ...response.data,
        songs: unique,
      },
    };
  }

  // ----------------------------------------------------------
  // data.results
  // ----------------------------------------------------------

  if (
    Array.isArray(
      response?.data?.results
    )
  ) {
    return {
      ...response,
      data: {
        ...response.data,
        results: unique,
      },
    };
  }

  // ----------------------------------------------------------
  // data.data
  // ----------------------------------------------------------

  if (
    Array.isArray(
      response?.data?.data
    )
  ) {
    return {
      ...response,
      data: {
        ...response.data,
        data: unique,
      },
    };
  }

  // ----------------------------------------------------------
  // results
  // ----------------------------------------------------------

  if (
    Array.isArray(
      response?.results
    )
  ) {
    return {
      ...response,
      results: unique,
    };
  }

  // ----------------------------------------------------------
  // songs
  // ----------------------------------------------------------

  if (
    Array.isArray(
      response?.songs
    )
  ) {
    return {
      ...response,
      songs: unique,
    };
  }

  // ----------------------------------------------------------
  // fallback
  // ----------------------------------------------------------

  return {
    ...response,
    data: unique,
  };
};

// ============================================================
// PAGINATED COLLECTION REQUEST
// ============================================================
//
// Fetches:
//   1 - 50
//   51 - 100
//
// Then combines everything into one response.
//
// This prevents the backend from silently limiting
// `limit=100` or `limit=150` to only 20/50 items.
// ============================================================

const fetchCollection = async (
  endpoint,
  params = {},
  limit = DEFAULT_LIMIT
) => {
  const safeLimit =
    toPositiveLimit(
      limit,
      DEFAULT_LIMIT
    );

  const pageCount =
    Math.ceil(
      safeLimit /
        PAGE_SIZE
    );

  const requests = [];

  for (
    let page = 1;
    page <= pageCount;
    page += 1
  ) {
    const urlParams =
      new URLSearchParams();

    for (
      const [
        key,
        value,
      ] of Object.entries(
        params
      )
    ) {
      if (
        value !==
          undefined &&
        value !== null &&
        String(value).trim()
      ) {
        urlParams.set(
          key,
          String(value)
        );
      }
    }

    urlParams.set(
      "page",
      String(page)
    );

    urlParams.set(
      "limit",
      String(PAGE_SIZE)
    );

    requests.push(
      apiRequest(
        `${endpoint}?${urlParams.toString()}`
      )
    );
  }

  const results =
    await Promise.allSettled(
      requests
    );

  const allSongs = [];

  for (
    const result of results
  ) {
    if (
      result.status !==
      "fulfilled"
    ) {
      continue;
    }

    const songs =
      extractSongs(
        result.value
      );

    if (
      Array.isArray(songs)
    ) {
      allSongs.push(
        ...songs
      );
    }
  }

  const finalSongs =
    uniqueItems(
      allSongs
    ).slice(
      0,
      safeLimit
    );

  // Use the first successful response
  // as the base response.
  const firstSuccessful =
    results.find(
      (result) =>
        result.status ===
        "fulfilled"
    );

  if (
    !firstSuccessful
  ) {
    throw new Error(
      "All API collection requests failed"
    );
  }

  return responseWithSongs(
    firstSuccessful.value,
    finalSongs
  );
};

// ============================================================
// SEARCH HELPERS
// ============================================================

const emptySearchResponse =
  () => ({
    success: true,
    data: {
      results: [],
    },
  });

const performSearch = async (
  endpoint,
  query,
  limit
) => {
  const searchQuery =
    String(
      query || ""
    ).trim();

  if (!searchQuery) {
    return emptySearchResponse();
  }

  return fetchCollection(
    endpoint,
    {
      query:
        searchQuery,
    },
    limit
  );
};

// ============================================================
// SONG SUGGESTIONS
// ============================================================

export const getSuggestionSong =
  async (
    id,
    limit = 100
  ) => {
    if (!id) {
      throw new Error(
        "Song ID is required"
      );
    }

    return fetchCollection(
      `/songs/${encode(
        id
      )}/suggestions`,
      {},
      limit
    );
  };

// ============================================================
// SEARCH
// ============================================================

export const getSearchData =
  async (
    query,
    limit = 100
  ) =>
    performSearch(
      "/search",
      query,
      limit
    );

export const getSongbyQuery =
  async (
    query,
    limit = 100
  ) =>
    performSearch(
      "/search",
      query,
      limit
    );

export const getArtistbyQuery =
  async (
    query,
    limit = DEFAULT_LIMIT
  ) =>
    performSearch(
      "/search/artists",
      query,
      limit
    );

export const searchArtistByQuery =
  (
    query,
    limit = DEFAULT_LIMIT
  ) =>
    getArtistbyQuery(
      query,
      limit
    );

export const searchAlbumByQuery =
  async (
    query,
    limit = DEFAULT_LIMIT
  ) =>
    performSearch(
      "/search/albums",
      query,
      limit
    );

export const searchPlayListByQuery =
  async (
    query,
    limit = DEFAULT_LIMIT
  ) =>
    performSearch(
      "/search/playlists",
      query,
      limit
    );

// ============================================================
// SONG / ALBUM / ARTIST / PLAYLIST BY ID
// ============================================================

export const getSongById =
  async (id) => {
    if (!id) {
      throw new Error(
        "Song ID is required"
      );
    }

    return apiRequest(
      `/songs/${encode(id)}`
    );
  };

export const fetchAlbumByID =
  async (id) => {
    if (!id) {
      throw new Error(
        "Album ID is required"
      );
    }

    return apiRequest(
      `/albums?id=${encode(
        id
      )}`
    );
  };

export const fetchArtistByID =
  async (id) => {
    if (!id) {
      throw new Error(
        "Artist ID is required"
      );
    }

    return apiRequest(
      `/artists?id=${encode(
        id
      )}`
    );
  };

export const fetchplaylistsByID =
  async (id) => {
    if (!id) {
      throw new Error(
        "Playlist ID is required"
      );
    }

    return apiRequest(
      `/playlists?id=${encode(
        id
      )}`
    );
  };

// ============================================================
// SONG SUGGESTIONS BY ID
// ============================================================

export const fetchSongSuggestionsByID =
  async (
    id,
    limit = 100
  ) => {
    if (!id) {
      throw new Error(
        "Song ID is required"
      );
    }

    return fetchCollection(
      `/songs/${encode(
        id
      )}/suggestions`,
      {},
      limit
    );
  };

// ============================================================
// LYRICS
// ============================================================

export const LyricsByID =
  async (id) => {
    if (!id) {
      throw new Error(
        "Song ID is required"
      );
    }

    return apiRequest(
      `/lyrics?id=${encode(
        id
      )}`
    );
  };

// ============================================================
// NEW TRENDING
// ============================================================

export const getNewTrending =
  async (
    language,
    limit = 100
  ) => {
    const lang =
      normalizeLanguage(
        language
      );

    if (!lang) {
      throw new Error(
        "Language is required"
      );
    }

    return fetchCollection(
      "/new_trending",
      {
        language: lang,
      },
      limit
    );
  };

export const getTamilNewTrending =
  (
    limit = 100
  ) =>
    getNewTrending(
      "tamil",
      limit
    );

export const getMalayalamNewTrending =
  (
    limit = 100
  ) =>
    getNewTrending(
      "malayalam",
      limit
    );

export const getHindiNewTrending =
  (
    limit = 100
  ) =>
    getNewTrending(
      "hindi",
      limit
    );

export const getEnglishNewTrending =
  (
    limit = 100
  ) =>
    getNewTrending(
      "english",
      limit
    );

// ============================================================
// NEW TRENDING - ALL LANGUAGES
// ============================================================

export const getNewTrendingLanguages =
  async (
    limit = 100
  ) => {
    const [
      tamil,
      malayalam,
      hindi,
      english,
    ] =
      await Promise.allSettled([
        getTamilNewTrending(
          limit
        ),

        getMalayalamNewTrending(
          limit
        ),

        getHindiNewTrending(
          limit
        ),

        getEnglishNewTrending(
          limit
        ),
      ]);

    const unwrap =
      (result) =>
        result.status ===
        "fulfilled"
          ? result.value
          : null;

    return {
      tamil:
        unwrap(tamil),

      malayalam:
        unwrap(malayalam),

      hindi:
        unwrap(hindi),

      english:
        unwrap(english),
    };
  };

// ============================================================
// FEATURED RADIO
// ============================================================

export const getFeaturedRadio =
  async (name) => {
    const stationName =
      String(
        name || ""
      ).trim();

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

export const getTamilFeaturedRadio =
  () =>
    getFeaturedRadio(
      "Tamil"
    );

export const getMalayalamFeaturedRadio =
  () =>
    getFeaturedRadio(
      "Malayalam"
    );

export const getHindiFeaturedRadio =
  () =>
    getFeaturedRadio(
      "Hindi"
    );

export const getEnglishFeaturedRadio =
  () =>
    getFeaturedRadio(
      "English"
    );

export const getFeaturedRadioLanguages =
  async () => {
    const [
      tamil,
      malayalam,
      hindi,
      english,
    ] =
      await Promise.allSettled([
        getTamilFeaturedRadio(),
        getMalayalamFeaturedRadio(),
        getHindiFeaturedRadio(),
        getEnglishFeaturedRadio(),
      ]);

    const unwrap =
      (result) =>
        result.status ===
        "fulfilled"
          ? result.value
          : null;

    return {
      tamil:
        unwrap(tamil),

      malayalam:
        unwrap(malayalam),

      hindi:
        unwrap(hindi),

      english:
        unwrap(english),
    };
  };

// ============================================================
// ARTIST RADIO
// ============================================================

export const getArtistRadio =
  async (
    name,
    query = ""
  ) => {
    const artistName =
      String(
        name || ""
      ).trim();

    if (!artistName) {
      throw new Error(
        "Artist radio name is required"
      );
    }

    const searchQuery =
      String(
        query || artistName
      ).trim();

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

export const getTamilArtistRadio =
  () =>
    getArtistRadio(
      "Tamil",
      "tamil"
    );

export const getMalayalamArtistRadio =
  () =>
    getArtistRadio(
      "Malayalam",
      "malayalam"
    );

export const getHindiArtistRadio =
  () =>
    getArtistRadio(
      "Hindi",
      "hindi"
    );

export const getEnglishArtistRadio =
  () =>
    getArtistRadio(
      "English",
      "english"
    );

export const getAllArtistRadio =
  async () => {
    const [
      tamil,
      malayalam,
      hindi,
      english,
    ] =
      await Promise.allSettled([
        getTamilArtistRadio(),
        getMalayalamArtistRadio(),
        getHindiArtistRadio(),
        getEnglishArtistRadio(),
      ]);

    const unwrap =
      (result) =>
        result.status ===
        "fulfilled"
          ? result.value
          : null;

    return {
      tamil:
        unwrap(tamil),

      malayalam:
        unwrap(malayalam),

      hindi:
        unwrap(hindi),

      english:
        unwrap(english),
    };
  };

// ============================================================
// RADIO HELPERS
// ============================================================

export const getRadioStationId =
  (response) =>
    response?.data
      ?.stationId ??
    response?.stationId ??
    response?.data?.id ??
    response?.id ??
    null;

export const extractRadioSongs =
  (response) => {
    if (!response) {
      return [];
    }

    if (
      Array.isArray(response)
    ) {
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

    for (
      const list of possibleArrays
    ) {
      if (
        Array.isArray(list)
      ) {
        return list;
      }
    }

    return [];
  };

// ============================================================
// COMBINED LANGUAGE RADIO
// ============================================================

export const getLanguageRadio =
  async (
    language,
    limit = 100
  ) => {
    const lang =
      normalizeLanguage(
        language
      );

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
    ] =
      await Promise.allSettled([
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
      radioResult.status ===
      "fulfilled"
        ? radioResult.value
        : null;

    const trendingSongs =
      songsResult.status ===
      "fulfilled"
        ? extractSongs(
            songsResult.value
          )
        : [];

    const radioSongs =
      extractRadioSongs(
        radio
      );

    return {
      language: lang,

      stationId:
        getRadioStationId(
          radio
        ),

      radio,

      songs:
        uniqueItems(
          trendingSongs.length
            ? trendingSongs
            : radioSongs
        ).slice(
          0,
          toPositiveLimit(
            limit,
            100
          )
        ),

      radioError:
        radioResult.status ===
        "rejected"
          ? radioResult.reason
          : null,

      songsError:
        songsResult.status ===
        "rejected"
          ? songsResult.reason
          : null,
    };
  };

// ============================================================
// LANGUAGE RADIO SHORTCUTS
// ============================================================

export const getTamilRadio =
  (
    limit = 100
  ) =>
    getLanguageRadio(
      "tamil",
      limit
    );

export const getMalayalamRadio =
  (
    limit = 100
  ) =>
    getLanguageRadio(
      "malayalam",
      limit
    );

export const getHindiRadio =
  (
    limit = 100
  ) =>
    getLanguageRadio(
      "hindi",
      limit
    );

export const getEnglishRadio =
  (
    limit = 100
  ) =>
    getLanguageRadio(
      "english",
      limit
    );

export const getAllLanguageRadio =
  async (
    limit = 100
  ) => {
    const [
      tamil,
      malayalam,
      hindi,
      english,
    ] =
      await Promise.allSettled([
        getTamilRadio(
          limit
        ),

        getMalayalamRadio(
          limit
        ),

        getHindiRadio(
          limit
        ),

        getEnglishRadio(
          limit
        ),
      ]);

    const unwrap =
      (result) =>
        result.status ===
        "fulfilled"
          ? result.value
          : null;

    return {
      tamil:
        unwrap(tamil),

      malayalam:
        unwrap(malayalam),

      hindi:
        unwrap(hindi),

      english:
        unwrap(english),
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
