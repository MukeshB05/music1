// ============================================================
// MusicMax API
// ============================================================

const API_URL =
  "https://jiosaavndev.vercel.app/api";

if (!API_URL) {
  console.error(
    "MusicMax API URL is missing."
  );
}

// ============================================================
// COMMON HELPERS
// ============================================================

const encode = (value) =>
  encodeURIComponent(
    String(value ?? "").trim()
  );

const toPositiveLimit = (
  value,
  fallback = 50
) => {
  const number = Number(value);

  return Number.isFinite(number) &&
    number > 0
    ? Math.floor(number)
    : fallback;
};

/**
 * Remove trailing slash from API URL
 * and make sure endpoint starts with slash.
 */
const buildUrl = (endpoint) => {
  const base = API_URL.replace(
    /\/+$/,
    ""
  );

  const path = String(
    endpoint || ""
  ).startsWith("/")
    ? String(endpoint || "")
    : `/${String(endpoint || "")}`;

  return `${base}${path}`;
};

// ============================================================
// COMMON API REQUEST
// ============================================================

const apiRequest = async (
  endpoint
) => {
  const url = buildUrl(endpoint);

  try {
    const response = await fetch(
      url,
      {
        method: "GET",
        headers: {
          Accept:
            "application/json",
        },
      }
    );

    const text =
      await response.text();

    let data = null;

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
          data?.status ||
          `API request failed: ${response.status} ${response.statusText}`
      );
    }

    return data;
  } catch (error) {
    console.error(
      "MusicMax API Error:",
      url,
      error
    );

    throw (
      error instanceof Error
        ? error
        : new Error(
            "API request failed"
          )
    );
  }
};

// ============================================================
// RESPONSE NORMALIZERS
// ============================================================

export const extractResults = (
  response
) => {
  if (!response) {
    return [];
  }

  const candidates = [
    response,

    response?.data?.results,
    response?.data?.songs,
    response?.data?.items,
    response?.data?.albums,
    response?.data?.artists,
    response?.data?.playlists,
    response?.data?.data,

    response?.results,
    response?.songs,
    response?.items,
    response?.albums,
    response?.artists,
    response?.playlists,

    response?.data,
  ];

  for (const item of candidates) {
    if (Array.isArray(item)) {
      return item.filter(Boolean);
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

  const candidates = [
    response,

    response?.data?.songs,
    response?.data?.results,
    response?.data?.items,
    response?.data?.data,
    response?.data?.new_trending,

    response?.songs,
    response?.results,
    response?.items,
    response?.new_trending,

    response?.data,
  ];

  for (const item of candidates) {
    if (Array.isArray(item)) {
      return item.filter(Boolean);
    }
  }

  return [];
};

// ============================================================
// SONG
// ============================================================

export const getSuggestionSong =
  async (id) => {
    if (!id) {
      throw new Error(
        "Song ID is required"
      );
    }

    return apiRequest(
      `/songs/${encode(
        id
      )}/suggestions?limit=150`
    );
  };

// ============================================================
// GENERAL SEARCH
// ============================================================

export const getSearchData =
  async (query) => {
    if (!query) {
      throw new Error(
        "Search query is required"
      );
    }

    return apiRequest(
      `/search?query=${encode(
        query
      )}&limit=150`
    );
  };

// ============================================================
// SEARCH SONGS
// ============================================================

export const getSongbyQuery =
  async (
    query,
    limit = 50
  ) => {
    if (!query) {
      throw new Error(
        "Song search query is required"
      );
    }

    return apiRequest(
      `/search/songs?query=${encode(
        query
      )}&limit=${toPositiveLimit(
        limit
      )}`
    );
  };

// ============================================================
// SEARCH ARTISTS
// ============================================================

export const getArtistbyQuery =
  async (
    query,
    limit = 50
  ) => {
    if (!query) {
      throw new Error(
        "Artist search query is required"
      );
    }

    return apiRequest(
      `/search/artists?query=${encode(
        query
      )}&limit=${toPositiveLimit(
        limit
      )}`
    );
  };

// ============================================================
// SONG BY ID
// ============================================================

export const getSongById =
  async (songId) => {
    if (!songId) {
      throw new Error(
        "Song ID is required"
      );
    }

    return apiRequest(
      `/songs/${encode(songId)}`
    );
  };

// ============================================================
// ALBUM SEARCH
// ============================================================

export const searchAlbumByQuery =
  async (query) => {
    if (!query) {
      throw new Error(
        "Album search query is required"
      );
    }

    return apiRequest(
      `/search/albums?query=${encode(
        query
      )}&limit=130`
    );
  };

// ============================================================
// ARTIST SEARCH
// ============================================================

export const searchArtistByQuery =
  async (query) => {
    if (!query) {
      throw new Error(
        "Artist search query is required"
      );
    }

    return apiRequest(
      `/search/artists?query=${encode(
        query
      )}&limit=130`
    );
  };

// ============================================================
// ALBUM BY ID
// ============================================================

export const fetchAlbumByID =
  async (ID) => {
    if (!ID) {
      throw new Error(
        "Album ID is required"
      );
    }

    return apiRequest(
      `/albums?id=${encode(
        ID
      )}&limit=130`
    );
  };

// ============================================================
// ARTIST BY ID
// ============================================================

export const fetchArtistByID =
  async (ID) => {
    if (!ID) {
      throw new Error(
        "Artist ID is required"
      );
    }

    return apiRequest(
      `/artists?id=${encode(ID)}`
    );
  };

// ============================================================
// PLAYLIST SEARCH
// ============================================================

export const searchPlayListByQuery =
  async (query) => {
    if (!query) {
      throw new Error(
        "Playlist search query is required"
      );
    }

    return apiRequest(
      `/search/playlists?query=${encode(
        query
      )}&limit=130`
    );
  };

// ============================================================
// PLAYLIST BY ID
// ============================================================

export const fetchplaylistsByID =
  async (ID) => {
    if (!ID) {
      throw new Error(
        "Playlist ID is required"
      );
    }

    return apiRequest(
      `/playlists?id=${encode(
        ID
      )}&limit=130`
    );
  };

// ============================================================
// SONG SUGGESTIONS BY ID
// ============================================================

export const fetchSongSuggestionsByID =
  async (ID) => {
    if (!ID) {
      throw new Error(
        "Song ID is required"
      );
    }

    return apiRequest(
      `/songs/${encode(
        ID
      )}/suggestions?limit=130`
    );
  };

// ============================================================
// LYRICS
// ============================================================

export const LyricsByID =
  async (ID) => {
    if (!ID) {
      throw new Error(
        "Song ID is required"
      );
    }

    return apiRequest(
      `/songs/${encode(ID)}/lyrics`
    );
  };

// ============================================================
// NEW TRENDING
// ============================================================

/**
 * Endpoint:
 *
 * /new_trending?language=tamil&limit=50
 * /new_trending?language=malayalam&limit=50
 * /new_trending?language=hindi&limit=50
 */

export const getNewTrending =
  async (
    language,
    limit = 50
  ) => {
    const normalizedLanguage =
      String(language || "")
        .trim()
        .toLowerCase();

    if (!normalizedLanguage) {
      throw new Error(
        "Language is required for new trending"
      );
    }

    const safeLimit =
      toPositiveLimit(
        limit,
        50
      );

    return apiRequest(
      `/new_trending?language=${encode(
        normalizedLanguage
      )}&limit=${safeLimit}`
    );
  };

// ============================================================
// TAMIL NEW TRENDING
// ============================================================

export const getTamilNewTrending =
  async (limit = 50) => {
    return getNewTrending(
      "tamil",
      limit
    );
  };

// ============================================================
// MALAYALAM NEW TRENDING
// ============================================================

export const getMalayalamNewTrending =
  async (limit = 50) => {
    return getNewTrending(
      "malayalam",
      limit
    );
  };

// ============================================================
// HINDI NEW TRENDING
// ============================================================

export const getHindiNewTrending =
  async (limit = 50) => {
    return getNewTrending(
      "hindi",
      limit
    );
  };

// ============================================================
// ALL NEW TRENDING LANGUAGES
// ============================================================

export const getNewTrendingLanguages =
  async (limit = 50) => {
    const [
      tamil,
      malayalam,
      hindi,
    ] = await Promise.allSettled([
      getTamilNewTrending(
        limit
      ),

      getMalayalamNewTrending(
        limit
      ),

      getHindiNewTrending(
        limit
      ),
    ]);

    return {
      tamil:
        tamil.status ===
        "fulfilled"
          ? tamil.value
          : null,

      malayalam:
        malayalam.status ===
        "fulfilled"
          ? malayalam.value
          : null,

      hindi:
        hindi.status ===
        "fulfilled"
          ? hindi.value
          : null,
    };
  };

// ============================================================
// FEATURED RADIO
// ============================================================

/**
 * IMPORTANT:
 *
 * /radio/featured returns radio
 * station metadata.
 *
 * It does NOT necessarily return
 * a direct MP3/audio URL.
 *
 * Example:
 *
 * /radio/featured?name=malayalam
 *
 * The returned stationId can be
 * displayed/identified, but it
 * should not be passed directly
 * to <audio src="">.
 */

export const getFeaturedRadio =
  async (name) => {
    const normalizedName =
      String(name || "")
        .trim()
        .toLowerCase();

    if (!normalizedName) {
      throw new Error(
        "Radio name is required"
      );
    }

    return apiRequest(
      `/radio/featured?name=${encode(
        normalizedName
      )}`
    );
  };

// ============================================================
// TAMIL FEATURED RADIO
// ============================================================

export const getTamilFeaturedRadio =
  async () => {
    return getFeaturedRadio(
      "tamil"
    );
  };

// ============================================================
// MALAYALAM FEATURED RADIO
// ============================================================

export const getMalayalamFeaturedRadio =
  async () => {
    return getFeaturedRadio(
      "malayalam"
    );
  };

// ============================================================
// HINDI FEATURED RADIO
// ============================================================

export const getHindiFeaturedRadio =
  async () => {
    return getFeaturedRadio(
      "hindi"
    );
  };

// ============================================================
// ALL FEATURED RADIO
// ============================================================

export const getFeaturedRadioLanguages =
  async () => {
    const [
      tamil,
      malayalam,
      hindi,
    ] = await Promise.allSettled([
      getTamilFeaturedRadio(),
      getMalayalamFeaturedRadio(),
      getHindiFeaturedRadio(),
    ]);

    return {
      tamil:
        tamil.status ===
        "fulfilled"
          ? tamil.value
          : null,

      malayalam:
        malayalam.status ===
        "fulfilled"
          ? malayalam.value
          : null,

      hindi:
        hindi.status ===
        "fulfilled"
          ? hindi.value
          : null,
    };
  };

// ============================================================
// GET RADIO STATION ID
// ============================================================

export const getRadioStationId =
  (response) => {
    return (
      response?.data?.stationId ||
      response?.data?.station_id ||
      response?.stationId ||
      response?.station_id ||
      ""
    );
  };

// ============================================================
// LANGUAGE RADIO DATA
// ============================================================

/**
 * Returns both:
 *
 * 1. Featured radio metadata
 * 2. New-trending songs
 *
 * This is useful for MusicMax because
 * the featured-radio endpoint gives
 * station information while the
 * new-trending endpoint provides the
 * playable song queue.
 */

export const getLanguageRadio =
  async (
    language,
    limit = 50
  ) => {
    const normalizedLanguage =
      String(language || "")
        .trim()
        .toLowerCase();

    if (!normalizedLanguage) {
      throw new Error(
        "Language is required"
      );
    }

    const [
      radioResult,
      trendingResult,
    ] = await Promise.allSettled([
      getFeaturedRadio(
        normalizedLanguage
      ),

      getNewTrending(
        normalizedLanguage,
        limit
      ),
    ]);

    const radio =
      radioResult.status ===
      "fulfilled"
        ? radioResult.value
        : null;

    const trending =
      trendingResult.status ===
      "fulfilled"
        ? trendingResult.value
        : null;

    return {
      language:
        normalizedLanguage,

      stationId:
        getRadioStationId(
          radio
        ),

      radio,

      songs:
        extractSongs(
          trending
        ),

      radioError:
        radioResult.status ===
        "rejected"
          ? radioResult.reason
          : null,

      songsError:
        trendingResult.status ===
        "rejected"
          ? trendingResult.reason
          : null,
    };
  };

// ============================================================
// TAMIL RADIO + SONGS
// ============================================================

export const getTamilRadio =
  async (limit = 50) => {
    return getLanguageRadio(
      "tamil",
      limit
    );
  };

// ============================================================
// MALAYALAM RADIO + SONGS
// ============================================================

export const getMalayalamRadio =
  async (limit = 50) => {
    return getLanguageRadio(
      "malayalam",
      limit
    );
  };

// ============================================================
// HINDI RADIO + SONGS
// ============================================================

export const getHindiRadio =
  async (limit = 50) => {
    return getLanguageRadio(
      "hindi",
      limit
    );
  };

// ============================================================
// ALL LANGUAGE RADIO + SONGS
// ============================================================

export const getAllLanguageRadio =
  async (limit = 50) => {
    const [
      tamil,
      malayalam,
      hindi,
    ] = await Promise.allSettled([
      getTamilRadio(limit),
      getMalayalamRadio(limit),
      getHindiRadio(limit),
    ]);

    return {
      tamil:
        tamil.status ===
        "fulfilled"
          ? tamil.value
          : null,

      malayalam:
        malayalam.status ===
        "fulfilled"
          ? malayalam.value
          : null,

      hindi:
        hindi.status ===
        "fulfilled"
          ? hindi.value
          : null,
    };
  };
