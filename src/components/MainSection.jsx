import {
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  fetchplaylistsByID,
  searchAlbumByQuery,
  searchPlayListByQuery,
  getTamilNewTrending,
  getMalayalamNewTrending,
  getHindiNewTrending,
  getArtistRadio,
  getSongbyQuery,
} from "../../fetch";

import MusicContext from "../context/MusicContext";
import { artistData } from "../genreData";

import AlbumSlider from "./Sliders/AlbumSlider";
import PlaylistSlider from "./Sliders/PlaylistSlider";
import ArtistSlider from "./Sliders/ArtistSlider";

import {
  MdOutlineKeyboardArrowLeft,
  MdOutlineKeyboardArrowRight,
} from "react-icons/md";

import { FaPlay } from "react-icons/fa";

/* =========================================================
   HELPERS
========================================================= */

const FALLBACK_IMAGE = "/Unknown.png";
const SONG_LIMIT = 150;
const MAX_HOME_ITEMS = 50;

/* ---------------------------------------------------------
   Resolve image from any API response shape
--------------------------------------------------------- */
const resolveImage = (value) => {
  if (!value) {
    return FALLBACK_IMAGE;
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    for (let i = value.length - 1; i >= 0; i -= 1) {
      const item = value[i];

      if (typeof item === "string" && item.trim()) {
        return item;
      }

      if (item && typeof item === "object") {
        const url =
          item.url ||
          item.link ||
          item.src ||
          item.image;

        if (url) {
          return url;
        }
      }
    }

    return FALLBACK_IMAGE;
  }

  if (typeof value === "object") {
    return (
      value.url ||
      value.link ||
      value.src ||
      value.image ||
      FALLBACK_IMAGE
    );
  }

  return FALLBACK_IMAGE;
};

/* ---------------------------------------------------------
   Song ID
--------------------------------------------------------- */
const getSongId = (song) => {
  if (!song) {
    return "";
  }

  return (
    song.id ||
    song.songId ||
    song.song_id ||
    song.trackId ||
    song.track_id ||
    ""
  );
};

/* ---------------------------------------------------------
   Song name
--------------------------------------------------------- */
const getSongName = (song) => {
  if (!song) {
    return "Unknown Song";
  }

  return (
    song.name ||
    song.title ||
    song.songName ||
    song.song_name ||
    "Unknown Song"
  );
};

/* ---------------------------------------------------------
   Artist name
--------------------------------------------------------- */
const getArtistName = (song) => {
  if (!song) {
    return "Unknown Artist";
  }

  if (typeof song.artist === "string") {
    return song.artist;
  }

  if (typeof song.artists === "string") {
    return song.artists;
  }

  const artists =
    song.artists ||
    song.artist ||
    song.primaryArtists ||
    song.primary_artists;

  if (Array.isArray(artists)) {
    return artists
      .map((artist) => {
        if (typeof artist === "string") {
          return artist;
        }

        return (
          artist?.name ||
          artist?.title ||
          ""
        );
      })
      .filter(Boolean)
      .join(", ");
  }

  if (artists?.primary) {
    return artists.primary
      .map((artist) => artist?.name || "")
      .filter(Boolean)
      .join(", ");
  }

  return (
    song.singers ||
    song.singer ||
    song.artistName ||
    song.artist_name ||
    "Unknown Artist"
  );
};

/* ---------------------------------------------------------
   Audio URL
--------------------------------------------------------- */
const getSongAudio = (song) => {
  if (!song) {
    return "";
  }

  const downloadUrl = song.downloadUrl;

  if (Array.isArray(downloadUrl)) {
    for (let i = downloadUrl.length - 1; i >= 0; i -= 1) {
      const item = downloadUrl[i];

      if (typeof item === "string" && item.trim()) {
        return item;
      }

      if (item?.url) {
        return item.url;
      }

      if (item?.link) {
        return item.link;
      }
    }
  }

  if (typeof downloadUrl === "string") {
    return downloadUrl;
  }

  return (
    song.audioUrl ||
    song.audio_url ||
    song.audio ||
    song.url ||
    song.media_url ||
    song.streamUrl ||
    song.stream_url ||
    song.src ||
    ""
  );
};

/* ---------------------------------------------------------
   Normalize song
--------------------------------------------------------- */
const normalizeSong = (song) => {
  if (!song || typeof song !== "object") {
    return null;
  }

  const id = getSongId(song);
  const name = getSongName(song);
  const artist = getArtistName(song);
  const image = resolveImage(
    song.image ||
      song.images ||
      song.album?.image ||
      song.album?.images
  );
  const audioUrl = getSongAudio(song);

  return {
    ...song,

    id: id || song.id,
    name,
    title: song.title || name,
    artist,
    artists: song.artists || artist,
    image,
    audioUrl,
    downloadUrl: song.downloadUrl || audioUrl,
  };
};

/* ---------------------------------------------------------
   Normalize songs
--------------------------------------------------------- */
const normalizeSongs = (songs) => {
  if (!Array.isArray(songs)) {
    return [];
  }

  return songs
    .map(normalizeSong)
    .filter(Boolean);
};

/* ---------------------------------------------------------
   Extract song array from API response
--------------------------------------------------------- */
const extractSongs = (response) => {
  if (!response) return [];
  if (Array.isArray(response)) return response.filter(Boolean);

  const candidates = [
    response?.data?.songs,
    response?.data?.results,
    response?.data?.items,
    response?.data?.tracks,
    response?.data?.data,
    response?.data?.new_trending,
    response?.songs,
    response?.results,
    response?.items,
    response?.tracks,
    response?.new_trending,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate.filter(Boolean);
  }

  return [];
};

/* ---------------------------------------------------------
   Extract general result arrays
--------------------------------------------------------- */
const extractResults = (response) => {
  if (!response) return [];
  if (Array.isArray(response)) return response.filter(Boolean);

  const candidates = [
    response?.data?.results,
    response?.data?.items,
    response?.data?.albums,
    response?.data?.playlists,
    response?.data?.artists,
    response?.results,
    response?.items,
    response?.albums,
    response?.playlists,
    response?.artists,
    response?.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate.filter(Boolean);
  }

  return [];
};

/* =========================================================
   PHOTO MODEL HOME PAGE
   - Screenshot-style compact horizontal music cards
   - Trending Now
   - Top Charts
   - New Releases
   - Editorial Picks
   - Radio Stations / Artist Radio
   - What's Hot In Chennai
   - Fresh Hits
   - Top Genres & Moods
   - Artist Radio loads a complete playable queue (up to 150)
========================================================= */

const uniqueSongs = (songs = []) => {
  const seen = new Set();

  return normalizeSongs(songs).filter((song) => {
    const id = String(getSongId(song) || "");

    if (!id) return true;
    if (seen.has(id)) return false;

    seen.add(id);
    return true;
  });
};

const uniqueItems = (items = []) => {
  const seen = new Set();

  return (Array.isArray(items) ? items : []).filter((item) => {
    const id = String(item?.id || item?.albumId || item?.playlistId || "");

    if (!id) return true;
    if (seen.has(id)) return false;

    seen.add(id);
    return true;
  });
};

const getItemTitle = (item, fallback = "Unknown") =>
  item?.title ||
  item?.name ||
  item?.albumName ||
  item?.playlistName ||
  fallback;

const getItemSubtitle = (item) =>
  item?.artist?.name ||
  item?.artist ||
  item?.artists?.primary?.map?.((a) => a?.name).filter(Boolean).join(", ") ||
  item?.primaryArtists ||
  item?.description ||
  "JioSaavn";

const SmallSongCard = ({ song, songs, onPlay }) => {
  const image = resolveImage(
    song?.image ||
      song?.images ||
      song?.album?.image ||
      song?.album?.images
  );

  const title = getSongName(song);
  const artist = getArtistName(song);

  return (
    <button
      type="button"
      onClick={() => onPlay?.(song, songs)}
      className="
        group
        min-w-[112px]
        w-[112px]
        shrink-0
        text-left
        rounded-lg
        p-1
        transition-all
        duration-200
        hover:-translate-y-1
        active:scale-[0.98]
        focus:outline-none
        focus-visible:ring-2
        focus-visible:ring-black/40
        dark:focus-visible:ring-white/40
      "
      title={title}
    >
      <div className="relative overflow-hidden rounded-md bg-black/5 dark:bg-white/5 aspect-square shadow-sm">
        <img
          src={image}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(event) => {
            if (event.currentTarget.src.endsWith(FALLBACK_IMAGE)) {
              event.currentTarget.onerror = null;
              return;
            }
            event.currentTarget.src = FALLBACK_IMAGE;
          }}
        />

        <span className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-black text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
          <FaPlay className="ml-0.5 text-[10px]" />
        </span>
      </div>

      <p className="mt-1 truncate text-[12px] font-medium leading-4">
        {title}
      </p>

      <p className="truncate text-[10px] leading-4 opacity-60">
        {artist}
      </p>
    </button>
  );
};

const SongRow = ({ title, songs, scrollRef, onPlay }) => {
  const safeSongs = Array.isArray(songs) ? songs : [];

  return (
    <section className="w-full">
      <div className="mb-2 flex items-center justify-between px-4">
        <h2 className="text-[18px] font-semibold tracking-tight">
          {title}
        </h2>

        {safeSongs.length > 7 && (
          <div className="hidden gap-1 md:flex">
            <button
              type="button"
              onClick={() => scrollRef?.current?.scrollBy({ left: -500, behavior: "smooth" })}
              className="rounded-full border border-black/10 px-2 py-1 text-sm dark:border-white/10"
              aria-label={`Scroll ${title} left`}
            >
              <MdOutlineKeyboardArrowLeft />
            </button>
            <button
              type="button"
              onClick={() => scrollRef?.current?.scrollBy({ left: 500, behavior: "smooth" })}
              className="rounded-full border border-black/10 px-2 py-1 text-sm dark:border-white/10"
              aria-label={`Scroll ${title} right`}
            >
              <MdOutlineKeyboardArrowRight />
            </button>
          </div>
        )}
      </div>

      {safeSongs.length ? (
        <div
          ref={scrollRef}
          className="
            flex
            w-full
            gap-1
            overflow-x-auto
            px-3
            pb-2
            scroll-smooth
            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden
          "
        >
          {safeSongs.map((song, index) => (
            <SmallSongCard
              key={`${getSongId(song) || getSongName(song)}-${index}`}
              song={song}
              songs={safeSongs}
              onPlay={onPlay}
            />
          ))}
        </div>
      ) : (
        <p className="px-4 text-sm opacity-50">No songs available.</p>
      )}
    </section>
  );
};

const CircleStationCard = ({ station, loading, onPlay }) => {
  const image = resolveImage(
    station?.image ||
      station?.artist?.image ||
      station?.artist?.images
  );

  return (
    <button
      type="button"
      onClick={() => onPlay?.(station)}
      disabled={loading}
      className="group flex w-[88px] shrink-0 flex-col items-center text-center disabled:opacity-60"
      title={`Play ${station?.name || station?.language || "Artist Radio"}`}
    >
      <div className="relative h-[76px] w-[76px] overflow-hidden rounded-full border-4 border-black/10 bg-white shadow-md dark:border-white/10 dark:bg-black">
        <img
          src={image}
          alt={station?.name || "Artist Radio"}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          onError={(event) => {
            if (event.currentTarget.src.endsWith(FALLBACK_IMAGE)) {
              event.currentTarget.onerror = null;
              return;
            }
            event.currentTarget.src = FALLBACK_IMAGE;
          }}
        />

        <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/25">
          {loading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/80 text-white opacity-0 transition-opacity group-hover:opacity-100">
              <FaPlay className="ml-0.5 text-[10px]" />
            </span>
          )}
        </span>
      </div>

      <p className="mt-1 w-full truncate text-[11px] font-medium">
        {station?.name || station?.language || "Artist Radio"}
      </p>

      <p className="w-full truncate text-[10px] opacity-60">
        {station?.subtitle || "Artist Radio"}
      </p>
    </button>
  );
};

const CircleItemCard = ({ item }) => {
  const image = resolveImage(
    item?.image ||
      item?.images ||
      item?.artist?.image
  );

  return (
    <div className="w-[88px] shrink-0 text-center">
      <div className="mx-auto h-[76px] w-[76px] overflow-hidden rounded-full border border-black/10 bg-black/5 shadow-sm dark:border-white/10">
        <img
          src={image}
          alt={getItemTitle(item)}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={(event) => {
            if (event.currentTarget.src.endsWith(FALLBACK_IMAGE)) {
              event.currentTarget.onerror = null;
              return;
            }
            event.currentTarget.src = FALLBACK_IMAGE;
          }}
        />
      </div>
      <p className="mt-1 truncate text-[11px] font-medium">
        {getItemTitle(item)}
      </p>
      <p className="truncate text-[10px] opacity-60">
        {getItemSubtitle(item)}
      </p>
    </div>
  );
};

const CircleRow = ({ title, items }) => (
  <section className="w-full">
    <h2 className="mb-2 px-4 text-[18px] font-semibold tracking-tight">
      {title}
    </h2>

    {items?.length ? (
      <div className="flex w-full gap-3 overflow-x-auto px-3 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item, index) => (
          <CircleItemCard
            key={`${item?.id || item?.name || index}-${index}`}
            item={item}
          />
        ))}
      </div>
    ) : (
      <p className="px-4 text-sm opacity-50">No items available.</p>
    )}
  </section>
);

const GenreCard = ({ name, subtitle }) => (
  <div className="min-w-[120px] rounded-xl border border-black/10 bg-black/[0.035] px-3 py-4 dark:border-white/10 dark:bg-white/[0.04]">
    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black">
      <span className="text-xs">♪</span>
    </div>
    <p className="truncate text-sm font-semibold">{name}</p>
    <p className="truncate text-[10px] opacity-60">{subtitle}</p>
  </div>
);

const MainSection = () => {
  const musicContext = useContext(MusicContext) || {};
  const { playMusic } = musicContext;

  const [trending, setTrending] = useState([]);
  const [topCharts, setTopCharts] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [editorialSongs, setEditorialSongs] = useState([]);
  const [chennaiSongs, setChennaiSongs] = useState([]);
  const [freshHits, setFreshHits] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [artists, setArtists] = useState([]);
  const [artistRadioStations, setArtistRadioStations] = useState([]);
  const [radioStations, setRadioStations] = useState([]);
  const [radioLoading, setRadioLoading] = useState("");
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const recentlyPlayedRef = useRef(null);
  const trendingRef = useRef(null);
  const chartsRef = useRef(null);
  const releasesRef = useRef(null);
  const editorialRef = useRef(null);
  const chennaiRef = useRef(null);
  const freshRef = useRef(null);

  /* =======================================================
     RECENTLY PLAYED
     MusicContext saves the latest songs in localStorage under
     "playedSongs". This keeps the home page in sync even when
     the song is played from another section.
  ======================================================= */
  const loadRecentlyPlayed = () => {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        setRecentlyPlayed([]);
        return;
      }

      const saved = window.localStorage.getItem("playedSongs");
      const parsed = saved ? JSON.parse(saved) : [];

      if (!Array.isArray(parsed)) {
        setRecentlyPlayed([]);
        return;
      }

      setRecentlyPlayed(
        uniqueSongs(parsed)
          .filter((song) => Boolean(getSongId(song)))
          .slice(0, 20)
      );
    } catch (err) {
      console.warn("Could not load recently played songs:", err);
      setRecentlyPlayed([]);
    }
  };

  useEffect(() => {
    loadRecentlyPlayed();

    const handleStorage = (event) => {
      if (!event.key || event.key === "playedSongs") {
        loadRecentlyPlayed();
      }
    };

    window.addEventListener("storage", handleStorage);

    // The storage event does not fire in the same browser tab.
    // A light refresh keeps Recently Played updated after playback.
    const refreshTimer = window.setInterval(loadRecentlyPlayed, 1000);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.clearInterval(refreshTimer);
    };
  }, []);

  const playQueue = async (song, songs) => {
    if (!song || typeof playMusic !== "function") {
      setError("Music player is not available.");
      return;
    }

    const sourceQueue =
      Array.isArray(songs) && songs.length ? songs : [song];

    const queue = uniqueSongs(sourceQueue);
    const playable = queue.filter((item) => Boolean(getSongAudio(item)));

    const requestedId = String(getSongId(song) || "");

    const first =
      playable.find(
        (item) => String(getSongId(item) || "") === requestedId
      ) || playable[0];

    if (!first) {
      setError("No playable audio URL was found for this song.");
      return;
    }

    try {
      await playMusic(first, playable);
      setError("");
    } catch (err) {
      console.error("Song playback error:", err);
      setError(err?.message || "Unable to play this song.");
    }
  };;

  const playArtistRadio = async (station) => {
    const query = String(station?.query || station?.language || "").trim();
    if (!query || typeof playMusic !== "function") return;

    setRadioLoading(station.key || query);

    try {
      let radioSongs = [];

      try {
        const radioResponse = await getArtistRadio(
          station.language || query,
          query
        );
        radioSongs = extractSongs(radioResponse);
      } catch (radioError) {
        console.warn("Artist radio endpoint failed; using search fallback.", radioError);
      }

      /*
       * IMPORTANT:
       * /radio/artist can return station metadata/stationId instead
       * of playable tracks. Never put stationId into <audio src>.
       * Use the language search as the playlist source when needed.
       */
      if (!radioSongs.length) {
        const searchResponse = await getSongbyQuery(query, SONG_LIMIT);
        radioSongs = extractSongs(searchResponse);
      }

      const queue = uniqueSongs(radioSongs)
        .filter((song) => Boolean(getSongAudio(song)))
        .slice(0, SONG_LIMIT);

      if (!queue.length) {
        throw new Error(`No playable ${station.language || query} radio songs found.`);
      }

      await playMusic(queue[0], queue);
    } catch (err) {
      console.error(`${station?.language || query} Artist Radio error:`, err);
      setError(err?.message || "Unable to play Artist Radio.");
    } finally {
      setRadioLoading("");
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const results = await Promise.allSettled([
          fetchplaylistsByID(10763385),
          fetchplaylistsByID(80802063),
          getTamilNewTrending(50),
          getMalayalamNewTrending(50),
          getHindiNewTrending(50),
          getSongbyQuery("Tamil top charts", 50),
          getSongbyQuery("Malayalam top charts", 50),
          getSongbyQuery("Hindi top charts", 50),
          getSongbyQuery("Tamil new releases", 50),
          getSongbyQuery("Malayalam new releases", 50),
          getSongbyQuery("Tamil editorial picks", 50),
          getSongbyQuery("Tamil hits", 50),
          getSongbyQuery("Chennai hits", 50),
          searchAlbumByQuery("Tamil Malayalam", MAX_HOME_ITEMS),
          searchPlayListByQuery("Tamil Malayalam", MAX_HOME_ITEMS),
          getArtistRadio("Tamil", "tamil"),
          getArtistRadio("Malayalam", "malayalam"),
          getArtistRadio("Hindi", "hindi"),
          getArtistRadio("English", "english"),
        ]);

        if (!mounted) return;

        const value = (index) =>
          results[index]?.status === "fulfilled"
            ? results[index].value
            : null;

        const songs = (index) => extractSongs(value(index));

        const fulfilledCount = results.filter(
          (result) => result?.status === "fulfilled"
        ).length;

        if (fulfilledCount === 0) {
          throw new Error(
            "Music API is unavailable. Please check the API server and try again."
          );
        }

        const baseTrending = songs(0);
        const latest = songs(1);
        const tamilTrending = songs(2);
        const malayalamTrending = songs(3);
        const hindiTrending = songs(4);

        setTrending(uniqueSongs(baseTrending));

        setNewReleases(
          uniqueSongs([
            ...latest,
            ...tamilTrending,
            ...malayalamTrending,
            ...hindiTrending,
          ]).slice(0, 50)
        );

        setTopCharts(
          uniqueSongs([
            ...songs(5),
            ...songs(6),
            ...songs(7),
          ]).slice(0, 50)
        );

        setEditorialSongs(
          uniqueSongs(songs(10)).slice(0, 30)
        );

        setChennaiSongs(
          uniqueSongs([
            ...songs(12),
            ...songs(11),
          ]).slice(0, 30)
        );

        setFreshHits(
          uniqueSongs([
            ...songs(11),
            ...songs(8),
          ]).slice(0, 30)
        );

        setAlbums(
          uniqueItems(extractResults(value(13))).slice(0, 30)
        );

        setPlaylists(
          uniqueItems(extractResults(value(14))).slice(0, 30)
        );

        const radioDefinitions = [
          { key: "tamil", language: "Tamil", query: "tamil" },
          { key: "malayalam", language: "Malayalam", query: "malayalam" },
          { key: "hindi", language: "Hindi", query: "hindi" },
          { key: "english", language: "English", query: "english" },
        ];

        const radioResponses = [
          value(15),
          value(16),
          value(17),
          value(18),
        ];

        setArtistRadioStations(
          radioDefinitions.map((station, index) => {
            const response = radioResponses[index];
            const stationId =
              response?.data?.stationId ||
              response?.stationId ||
              response?.data?.data?.stationId ||
              "";

            return {
              ...station,
              name: `${station.language} Radio`,
              subtitle: "Complete Artist Radio",
              stationId,
              image: resolveImage(
                response?.data?.image ||
                  response?.data?.images ||
                  response?.image
              ),
            };
          })
        );

        let artistList = [];
        if (Array.isArray(artistData)) {
          artistList = artistData;
        } else if (Array.isArray(artistData?.results)) {
          artistList = artistData.results;
        } else if (Array.isArray(artistData?.artists)) {
          artistList = artistData.artists;
        } else if (Array.isArray(artistData?.data)) {
          artistList = artistData.data;
        }

        setArtists(artistList.slice(0, 20));

        /* Screenshot-style radio station row.
           These are visual station entries; clicking Artist Radio
           is what creates the complete playable queue. */
        setRadioStations(
          [
            { name: "Shiva Shambo", subtitle: "Malayalam Radio", query: "malayalam", image: "/Unknown.png" },
            { name: "Jai Ganesh", subtitle: "Tamil Radio", query: "tamil", image: "/Unknown.png" },
            { name: "Neenga Mudiyala", subtitle: "Tamil Radio", query: "tamil", image: "/Unknown.png" },
            { name: "En Party En Gethu", subtitle: "Tamil Radio", query: "tamil", image: "/Unknown.png" },
            { name: "Deivam Stuti", subtitle: "Tamil Radio", query: "tamil", image: "/Unknown.png" },
            { name: "Kanneer Pookkal", subtitle: "Malayalam Radio", query: "malayalam", image: "/Unknown.png" },
            { name: "Dance Machi", subtitle: "Tamil Radio", query: "tamil", image: "/Unknown.png" },
          ]
        );
      } catch (err) {
        console.error("MainSection error:", err);
        if (mounted) {
          setError(err?.message || "Unable to load music data.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-black/20 border-t-black dark:border-white/20 dark:border-t-white" />
      </div>
    );
  }

  if (error && !trending.length && !newReleases.length) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center px-5 text-center">
        <div>
          <p className="font-semibold text-red-500">Unable to load MusicMax</p>
          <p className="mt-2 max-w-md text-sm opacity-60">{error}</p>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.reload();
              }
            }}
            className="mt-4 rounded-full bg-black px-5 py-2 text-sm font-semibold text-white dark:bg-white dark:text-black"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const genres = [
    ["Tamil", "Tamil Hits"],
    ["Malayalam", "Malayalam Hits"],
    ["Hindi", "Bollywood"],
    ["English", "International"],
    ["Melody", "Soft & Calm"],
    ["Romance", "Love Songs"],
    ["Party", "Dance Hits"],
    ["Devotional", "Spiritual"],
  ];

  return (
    <main
      className="
        mt-[4.5rem]
        w-full
        overflow-x-hidden
        pb-24
        pt-4
        lg:mt-16
        lg:pb-10
      "
    >
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-7">
        {/* Recently Played — always the first music row */}
        <SongRow
          title="Recently Played"
          songs={recentlyPlayed}
          scrollRef={recentlyPlayedRef}
          onPlay={playQueue}
        />

        <SongRow
          title="Trending Now"
          songs={trending}
          scrollRef={trendingRef}
          onPlay={playQueue}
        />

        <SongRow
          title="Top Charts"
          songs={topCharts}
          scrollRef={chartsRef}
          onPlay={playQueue}
        />

        <SongRow
          title="New Releases"
          songs={newReleases}
          scrollRef={releasesRef}
          onPlay={playQueue}
        />

        <section className="w-full px-3">
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-[18px] font-semibold tracking-tight">
              Editorial Picks
            </h2>
          </div>

          {playlists.length ? (
            <PlaylistSlider playlists={playlists.slice(0, 12)} />
          ) : (
            <SongRow
              title="Editorial Picks"
              songs={editorialSongs}
              scrollRef={editorialRef}
              onPlay={playQueue}
            />
          )}
        </section>

        <section className="w-full">
          <h2 className="mb-2 px-4 text-[18px] font-semibold tracking-tight">
            Radio Stations
          </h2>

          <div className="flex w-full gap-3 overflow-x-auto px-3 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {radioStations.map((station, index) => (
              <CircleStationCard
                key={`${station.name}-${index}`}
                station={station}
                loading={radioLoading === station.query}
                onPlay={playArtistRadio}
              />
            ))}
          </div>
        </section>

        <section className="w-full">
          <div className="mb-2 flex items-center justify-between px-4">
            <div>
              <h2 className="text-[18px] font-semibold tracking-tight">
                Artist Radio
              </h2>
              <p className="text-[11px] opacity-50">
                Tap any station to start the complete songs playlist
              </p>
            </div>
          </div>

          <div className="flex w-full gap-3 overflow-x-auto px-3 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {artistRadioStations.map((station) => (
              <CircleStationCard
                key={station.key}
                station={station}
                loading={radioLoading === station.key}
                onPlay={playArtistRadio}
              />
            ))}
          </div>
        </section>

        <SongRow
          title="What's Hot In Chennai"
          songs={chennaiSongs}
          scrollRef={chennaiRef}
          onPlay={playQueue}
        />

        <SongRow
          title="Fresh Hits"
          songs={freshHits}
          scrollRef={freshRef}
          onPlay={playQueue}
        />

        <section className="w-full px-3">
          <h2 className="mb-2 px-1 text-[18px] font-semibold tracking-tight">
            Top Albums
          </h2>
          {albums.length ? (
            <AlbumSlider albums={albums.slice(0, 18)} />
          ) : (
            <p className="px-1 text-sm opacity-50">No albums available.</p>
          )}
        </section>

        <section className="w-full px-3">
          <h2 className="mb-2 px-1 text-[18px] font-semibold tracking-tight">
            Top Artists
          </h2>
          {artists.length ? (
            <ArtistSlider artists={artists.slice(0, 18)} />
          ) : (
            <p className="px-1 text-sm opacity-50">No artists available.</p>
          )}
        </section>

        <section className="w-full">
          <h2 className="mb-2 px-4 text-[18px] font-semibold tracking-tight">
            Top Genres &amp; Moods
          </h2>

          <div className="flex w-full gap-3 overflow-x-auto px-3 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {genres.map(([name, subtitle]) => (
              <GenreCard
                key={name}
                name={name}
                subtitle={subtitle}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default MainSection;
