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
  getTamilFeaturedRadio,
  getMalayalamFeaturedRadio,
  getHindiFeaturedRadio,
} from "../../fetch";

import MusicContext from "../context/MusicContext";
import { artistData } from "../genreData";

import AlbumSlider from "./Sliders/AlbumSlider";
import PlaylistSlider from "./Sliders/PlaylistSlider";
import ArtistSlider from "./Sliders/ArtistSlider";
import SongGrid from "./SongGrid";

import {
  MdOutlineKeyboardArrowLeft,
  MdOutlineKeyboardArrowRight,
} from "react-icons/md";

import { FaPlay, FaPause } from "react-icons/fa";

/* =========================================================
   HELPERS
========================================================= */

const FALLBACK_IMAGE = "/Unknown.png";

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
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter(Boolean);
    }
  }

  return [];
};

/* ---------------------------------------------------------
   Extract general result arrays
--------------------------------------------------------- */
const extractResults = (response) => {
  if (!response) {
    return [];
  }

  const candidates = [
    response?.data?.results,
    response?.data?.items,
    response?.data?.albums,
    response?.data?.playlists,
    response?.data?.artists,
    response?.data,
    response?.results,
    response?.items,
    response?.albums,
    response?.playlists,
    response?.artists,
    response,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter(Boolean);
    }
  }

  return [];
};

/* ---------------------------------------------------------
   Get station ID
--------------------------------------------------------- */
const getStationId = (response) => {
  return (
    response?.data?.stationId ||
    response?.data?.station_id ||
    response?.stationId ||
    response?.station_id ||
    ""
  );
};

/* ---------------------------------------------------------
   Station image
--------------------------------------------------------- */
const getStationImage = (language) => {
  const images = {
    tamil:
      "https://c.saavncdn.com/featured/Tamil-Hits_500x500.jpg",

    malayalam:
      "https://c.saavncdn.com/featured/Malayalam-Hits_500x500.jpg",

    hindi:
      "https://c.saavncdn.com/featured/Hindi-Hits_500x500.jpg",
  };

  return images[language] || FALLBACK_IMAGE;
};

/* =========================================================
   MAIN SECTION
========================================================= */

const MainSection = () => {
  const musicContext = useContext(MusicContext) || {};

  const {
    playMusic,
    currentSong,
    isPlaying,
  } = musicContext;

  /* =======================================================
     STATE
  ======================================================= */

  const [trending, setTrending] = useState([]);

  const [latestSongs, setLatestSongs] =
    useState([]);

  const [albums, setAlbums] =
    useState([]);

  const [artists, setArtists] =
    useState([]);

  const [playlists, setPlaylists] =
    useState([]);

  const [featuredStations, setFeaturedStations] =
    useState([]);

  const [recentlyPlayedSongs, setRecentlyPlayedSongs] =
    useState([]);

  const [stationLoading, setStationLoading] =
    useState("");

  const [stationError, setStationError] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* =======================================================
     REFS
  ======================================================= */

  const recentlyPlayedScrollRef =
    useRef(null);

  const latestSongsScrollRef =
    useRef(null);

  const trendingScrollRef =
    useRef(null);

  /* =======================================================
     RECENTLY PLAYED
  ======================================================= */

  const loadRecentlyPlayed = () => {
    try {
      const storedSongs =
        localStorage.getItem("playedSongs");

      if (!storedSongs) {
        setRecentlyPlayedSongs([]);
        return;
      }

      const parsedSongs =
        JSON.parse(storedSongs);

      if (!Array.isArray(parsedSongs)) {
        setRecentlyPlayedSongs([]);
        return;
      }

      setRecentlyPlayedSongs(
        normalizeSongs(parsedSongs)
      );
    } catch (err) {
      console.error(
        "Unable to read recently played songs:",
        err
      );

      setRecentlyPlayedSongs([]);
    }
  };

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadRecentlyPlayed();

    const handleStorage = () => {
      loadRecentlyPlayed();
    };

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, []);

  /* =======================================================
     SCROLL
  ======================================================= */

  const scrollLeft = (ref) => {
    if (!ref?.current) {
      return;
    }

    ref.current.scrollBy({
      left: -800,
      behavior: "smooth",
    });
  };

  const scrollRight = (ref) => {
    if (!ref?.current) {
      return;
    }

    ref.current.scrollBy({
      left: 800,
      behavior: "smooth",
    });
  };

  /* =======================================================
     GREETING
  ======================================================= */

  const getGreeting = () => {
    const hour =
      new Date().getHours();

    if (hour < 12) {
      return "Good Morning";
    }

    if (hour < 18) {
      return "Good Afternoon";
    }

    if (hour < 21) {
      return "Good Evening";
    }

    return "Good Night";
  };

  /* =======================================================
     LOAD MAIN DATA
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          trendingResult,
          latestResult,

          tamilTrendingResult,
          malayalamTrendingResult,
          hindiTrendingResult,

          albumResult,
          playlistResult,

          tamilRadioResult,
          malayalamRadioResult,
          hindiRadioResult,
        ] = await Promise.allSettled([
          fetchplaylistsByID(10763385),

          fetchplaylistsByID(80802063),

          getTamilNewTrending(50),
          getMalayalamNewTrending(50),
          getHindiNewTrending(50),

          searchAlbumByQuery(
            "Tamil, Malayalam"
          ),

          searchPlayListByQuery(
            "Tamil, Malayalam"
          ),

          getTamilFeaturedRadio(),
          getMalayalamFeaturedRadio(),
          getHindiFeaturedRadio(),
        ]);

        if (!mounted) {
          return;
        }

        const unwrap = (result) =>
          result?.status === "fulfilled"
            ? result.value
            : null;

        /* =================================================
           TRENDING
        ================================================= */

        setTrending(
          normalizeSongs(
            extractSongs(
              unwrap(trendingResult)
            )
          )
        );

        /* =================================================
           NEW SONGS
        ================================================= */

        const existingNewSongs =
          extractSongs(
            unwrap(latestResult)
          );

        const tamilNewSongs =
          extractSongs(
            unwrap(
              tamilTrendingResult
            )
          );

        const malayalamNewSongs =
          extractSongs(
            unwrap(
              malayalamTrendingResult
            )
          );

        const hindiNewSongs =
          extractSongs(
            unwrap(
              hindiTrendingResult
            )
          );

        const mergedNewSongs =
          normalizeSongs([
            ...existingNewSongs,
            ...tamilNewSongs,
            ...malayalamNewSongs,
            ...hindiNewSongs,
          ]);

        /* =================================================
           REMOVE DUPLICATES
        ================================================= */

        const seenIds =
          new Set();

        const uniqueNewSongs =
          mergedNewSongs.filter(
            (song) => {
              const id =
                getSongId(song);

              if (!id) {
                return true;
              }

              const key =
                String(id);

              if (
                seenIds.has(key)
              ) {
                return false;
              }

              seenIds.add(key);

              return true;
            }
          );

        setLatestSongs(
          uniqueNewSongs
        );

        /* =================================================
           ALBUMS
        ================================================= */

        setAlbums(
          extractResults(
            unwrap(albumResult)
          )
        );

        /* =================================================
           PLAYLISTS
        ================================================= */

        setPlaylists(
          extractResults(
            unwrap(playlistResult)
          )
        );

        /* =================================================
           FEATURED RADIO
        ================================================= */

        const radioItems = [
          {
            language: "Tamil",
            key: "tamil",
            response:
              unwrap(
                tamilRadioResult
              ),
          },

          {
            language: "Malayalam",
            key: "malayalam",
            response:
              unwrap(
                malayalamRadioResult
              ),
          },

          {
            language: "Hindi",
            key: "hindi",
            response:
              unwrap(
                hindiRadioResult
              ),
          },
        ]
          .map((item) => ({
            ...item,
            stationId:
              getStationId(
                item.response
              ),
          }))
          .filter(
            (item) =>
              item.stationId
          );

        setFeaturedStations(
          radioItems
        );

        /* =================================================
           ARTISTS
        ================================================= */

        let artistList = [];

        if (
          Array.isArray(
            artistData
          )
        ) {
          artistList =
            artistData;
        } else if (
          Array.isArray(
            artistData?.results
          )
        ) {
          artistList =
            artistData.results;
        } else if (
          Array.isArray(
            artistData?.artists
          )
        ) {
          artistList =
            artistData.artists;
        } else if (
          Array.isArray(
            artistData?.data
          )
        ) {
          artistList =
            artistData.data;
        }

        setArtists(
          artistList
        );
      } catch (err) {
        console.error(
          "MainSection Error:",
          err
        );

        if (mounted) {
          setError(
            err?.message ||
              "Unable to load music data."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  /* =======================================================
     PLAY STATION
     
     IMPORTANT:
     /radio/featured returns station metadata.
     It does NOT return an audio URL.

     Therefore we create a playable station MIX from
     the corresponding language's new-trending queue.
  ======================================================= */

  const playStation = async (
    station
  ) => {
    if (!station?.key) {
      return;
    }

    if (
      typeof playMusic !==
      "function"
    ) {
      console.error(
        "MusicContext.playMusic is not available."
      );

      return;
    }

    const language =
      station.key;

    setStationError("");

    setStationLoading(
      language
    );

    try {
      let response;

      if (
        language === "tamil"
      ) {
        response =
          await getTamilNewTrending(
            50
          );
      } else if (
        language === "malayalam"
      ) {
        response =
          await getMalayalamNewTrending(
            50
          );
      } else if (
        language === "hindi"
      ) {
        response =
          await getHindiNewTrending(
            50
          );
      } else {
        throw new Error(
          "Unsupported radio station."
        );
      }

      const songs =
        normalizeSongs(
          extractSongs(response)
        );

      /* -----------------------------------------------
         Only keep songs with playable audio
      ------------------------------------------------ */

      const playableSongs =
        songs.filter(
          (song) =>
            Boolean(
              getSongAudio(song)
            )
        );

      if (
        playableSongs.length === 0
      ) {
        throw new Error(
          `${station.language} station has no playable songs right now.`
        );
      }

      const firstSong =
        playableSongs[0];

      const firstAudio =
        getSongAudio(
          firstSong
        );

      if (!firstAudio) {
        throw new Error(
          "No playable audio URL found."
        );
      }

      /*
       * Pass the COMPLETE station queue
       * to MusicContext.
       *
       * This makes:
       * Next
       * Previous
       * Auto-next
       * Repeat
       * Shuffle
       *
       * work with the station mix.
       */

      playMusic(
        firstSong,
        playableSongs
      );
    } catch (err) {
      console.error(
        `${station.language} station error:`,
        err
      );

      setStationError(
        err?.message ||
          `Unable to play ${station.language} station.`
      );
    } finally {
      setStationLoading("");
    }
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="min-h-[60vh] w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className="
              w-10
              h-10
              border-4
              border-gray-400
              border-t-transparent
              rounded-full
              animate-spin
            "
          />

          <p className="text-lg font-medium">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error) {
    return (
      <div className="min-h-[60vh] w-full flex items-center justify-center px-5">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-red-500">
            Something went wrong
          </h2>

          <p className="mt-2 text-sm opacity-70 break-words">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="
              mt-5
              px-5
              py-2
              rounded-lg
              bg-white
              text-black
              font-medium
              hover:opacity-80
              transition
            "
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /* =======================================================
     COMBINED PLAYER QUEUE
  ======================================================= */

  const combinedQueue =
    normalizeSongs([
      ...recentlyPlayedSongs,
      ...trending,
      ...latestSongs,
    ]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main
      className="
        pt-[3rem]
        lg:pt-5
        my-[2rem]
        mt-[5rem]
        lg:my-[4rem]
        flex
        flex-col
        items-center
        overflow-x-clip
        gap-[0.3rem]
        w-full
      "
    >
      {/* ===================================================
          GREETING
      =================================================== */}

      <div
        className="
          hidden
          lg:block
          text-2xl
          w-full
          font-semibold
          lg:ml-[5.5rem]
          m-1
        "
      >
        {getGreeting()}
      </div>

      {/* ===================================================
          RECENTLY PLAYED
      =================================================== */}

      {recentlyPlayedSongs.length >
        0 && (
        <section className="flex flex-col justify-center items-center w-full">
          <h2
            className="
              m-4
              mt-0
              text-xl
              lg:text-2xl
              font-semibold
              w-full
              ml-[3.5rem]
              lg:ml-[6.5rem]
            "
          >
            Recently Played
          </h2>

          <div className="flex justify-center items-center gap-3 w-full">
            <button
              type="button"
              aria-label="Scroll recently played left"
              onClick={() =>
                scrollLeft(
                  recentlyPlayedScrollRef
                )
              }
              className="
                text-3xl
                hover:scale-125
                transition-all
                duration-200
                cursor-pointer
                h-[9rem]
                arrow-btn
                hidden
                lg:flex
                items-center
                justify-center
              "
            >
              <MdOutlineKeyboardArrowLeft />
            </button>

            <div
              ref={
                recentlyPlayedScrollRef
              }
              className="
                grid
                grid-rows-1
                grid-flow-col
                justify-start
                overflow-x-auto
                scroll-hide
                items-center
                gap-3
                lg:gap-2
                w-full
                px-3
                lg:px-0
                scroll-smooth
              "
            >
              {recentlyPlayedSongs.map(
                (
                  song,
                  index
                ) => (
                  <SongGrid
                    key={
                      getSongId(
                        song
                      ) ||
                      index
                    }
                    {...song}
                    song={song}
                    songs={
                      recentlyPlayedSongs
                    }
                  />
                )
              )}
            </div>

            <button
              type="button"
              aria-label="Scroll recently played right"
              onClick={() =>
                scrollRight(
                  recentlyPlayedScrollRef
                )
              }
              className="
                text-3xl
                hover:scale-125
                transition-all
                duration-200
                cursor-pointer
                h-[9rem]
                arrow-btn
                hidden
                lg:flex
                items-center
                justify-center
              "
            >
              <MdOutlineKeyboardArrowRight />
            </button>
          </div>
        </section>
      )}

      {/* ===================================================
          NEW SONGS
      =================================================== */}

      <section className="flex flex-col items-center w-full">
        <h2
          className="
            m-4
            text-xl
            lg:text-2xl
            font-semibold
            w-full
            ml-[3.5rem]
            lg:ml-[6.5rem]
          "
        >
          New Songs
        </h2>

        <div className="flex justify-center items-center gap-3 w-full">
          <button
            type="button"
            aria-label="Scroll new songs left"
            onClick={() =>
              scrollLeft(
                latestSongsScrollRef
              )
            }
            className="
              text-3xl
              hover:scale-125
              transition-all
              duration-200
              cursor-pointer
              h-[9rem]
              arrow-btn
              hidden
              lg:flex
              items-center
              justify-center
            "
          >
            <MdOutlineKeyboardArrowLeft />
          </button>

          <div
            ref={
              latestSongsScrollRef
            }
            className="
              grid
              grid-rows-1
              lg:grid-rows-2
              grid-flow-col
              justify-start
              overflow-x-auto
              scroll-hide
              items-center
              gap-3
              lg:gap-2
              w-full
              px-3
              lg:px-0
              scroll-smooth
            "
          >
            {latestSongs.map(
              (
                song,
                index
              ) => (
                <SongGrid
                  key={
                    getSongId(
                      song
                    ) ||
                    index
                  }
                  {...song}
                  song={song}
                  songs={
                    latestSongs
                  }
                />
              )
            )}
          </div>

          <button
            type="button"
            aria-label="Scroll new songs right"
            onClick={() =>
              scrollRight(
                latestSongsScrollRef
              )
            }
            className="
              text-3xl
              hover:scale-125
              transition-all
              duration-200
              cursor-pointer
              h-[9rem]
              arrow-btn
              hidden
              lg:flex
              items-center
              justify-center
            "
          >
            <MdOutlineKeyboardArrowRight />
          </button>
        </div>
      </section>

      <br />

      {/* ===================================================
          TODAY TRENDING
      =================================================== */}

      <section className="flex flex-col justify-center items-center w-full">
        <h2
          className="
            m-4
            mt-0
            text-xl
            lg:text-2xl
            font-semibold
            w-full
            ml-[3.5rem]
            lg:ml-[6.5rem]
          "
        >
          Today Trending
        </h2>

        <div className="flex justify-center items-center gap-3 w-full">
          <button
            type="button"
            aria-label="Scroll trending songs left"
            onClick={() =>
              scrollLeft(
                trendingScrollRef
              )
            }
            className="
              text-3xl
              hover:scale-125
              transition-all
              duration-200
              cursor-pointer
              h-[9rem]
              arrow-btn
              hidden
              lg:flex
              items-center
              justify-center
            "
          >
            <MdOutlineKeyboardArrowLeft />
          </button>

          <div
            ref={
              trendingScrollRef
            }
            className="
              grid
              grid-rows-1
              sm:grid-rows-2
              grid-flow-col
              justify-start
              overflow-x-auto
              scroll-hide
              items-center
              gap-3
              lg:gap-2
              w-full
              px-3
              lg:px-0
              scroll-smooth
            "
          >
            {trending.map(
              (
                song,
                index
              ) => (
                <SongGrid
                  key={
                    getSongId(
                      song
                    ) ||
                    index
                  }
                  {...song}
                  song={song}
                  songs={
                    trending
                  }
                />
              )
            )}
          </div>

          <button
            type="button"
            aria-label="Scroll trending songs right"
            onClick={() =>
              scrollRight(
                trendingScrollRef
              )
            }
            className="
              text-3xl
              hover:scale-125
              transition-all
              duration-200
              cursor-pointer
              h-[9rem]
              arrow-btn
              hidden
              lg:flex
              items-center
              justify-center
            "
          >
            <MdOutlineKeyboardArrowRight />
          </button>
        </div>
      </section>

      <br />

      {/* ===================================================
          RECOMMENDED ARTIST STATIONS
      =================================================== */}

      <section className="w-full px-3 lg:px-12">
        <h2
          className="
            m-4
            mt-0
            text-xl
            lg:text-2xl
            font-semibold
          "
        >
          Recommended Artist Stations
        </h2>

        {stationError && (
          <div
            className="
              mx-4
              mb-4
              rounded-lg
              bg-red-500/10
              border
              border-red-500/20
              px-4
              py-3
              text-sm
              text-red-500
            "
          >
            {stationError}
          </div>
        )}

        {featuredStations.length >
        0 ? (
          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-2
              lg:grid-cols-3
              gap-4
            "
          >
            {featuredStations.map(
              (station) => {
                const isLoading =
                  stationLoading ===
                  station.key;

                const isCurrentStation =
                  currentSong &&
                  station.key ===
                    String(
                      currentSong?.language ||
                        ""
                    ).toLowerCase();

                return (
                  <div
                    key={
                      station.key
                    }
                    className="
                      group
                      overflow-hidden
                      rounded-2xl
                      border
                      border-black/10
                      dark:border-white/10
                      bg-black/[0.04]
                      dark:bg-white/[0.05]
                      shadow-sm
                      hover:shadow-xl
                      transition-all
                      duration-300
                    "
                  >
                    <div className="relative">
                      <img
                        src={getStationImage(
                          station.key
                        )}
                        alt={`${station.language} Radio`}
                        className="
                          w-full
                          h-44
                          object-cover
                          transition-transform
                          duration-500
                          group-hover:scale-105
                        "
                        onError={(
                          event
                        ) => {
                          event.currentTarget.src =
                            FALLBACK_IMAGE;
                        }}
                      />

                      <div
                        className="
                          absolute
                          inset-0
                          bg-gradient-to-t
                          from-black/80
                          via-black/20
                          to-transparent
                        "
                      />

                      <div
                        className="
                          absolute
                          left-4
                          right-4
                          bottom-4
                          text-white
                        "
                      >
                        <p className="text-lg font-bold">
                          {station.language} Radio
                        </p>

                        <p className="text-xs opacity-80">
                          Recommended {station.language} music
                        </p>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold truncate">
                            {station.language} Station
                          </h3>

                          <p className="text-xs opacity-60 mt-1">
                            {station.stationId
                              ? "Featured station"
                              : "Music mix"}
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={
                            isLoading
                          }
                          onClick={() =>
                            playStation(
                              station
                            )
                          }
                          aria-label={`Play ${station.language} station`}
                          className="
                            shrink-0
                            w-11
                            h-11
                            rounded-full
                            flex
                            items-center
                            justify-center
                            bg-black
                            text-white
                            dark:bg-white
                            dark:text-black
                            hover:scale-105
                            active:scale-95
                            transition
                            disabled:opacity-50
                            disabled:cursor-not-allowed
                          "
                        >
                          {isLoading ? (
                            <span
                              className="
                                w-5
                                h-5
                                border-2
                                border-current
                                border-t-transparent
                                rounded-full
                                animate-spin
                              "
                            />
                          ) : (
                            <FaPlay className="ml-0.5 text-sm" />
                          )}
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={
                          isLoading
                        }
                        onClick={() =>
                          playStation(
                            station
                          )
                        }
                        className="
                          mt-3
                          w-full
                          rounded-xl
                          py-2.5
                          text-sm
                          font-medium
                          bg-black/10
                          dark:bg-white/10
                          hover:bg-black/15
                          dark:hover:bg-white/15
                          transition
                          disabled:opacity-50
                        "
                      >
                        {isLoading
                          ? "Loading Station..."
                          : "Play Station Mix"}
                      </button>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        ) : (
          <div
            className="
              mx-4
              rounded-xl
              border
              border-black/10
              dark:border-white/10
              p-5
              text-sm
              opacity-70
            "
          >
            Radio stations are currently unavailable.
          </div>
        )}
      </section>

      <br />

      {/* ===================================================
          TOP ALBUMS
      =================================================== */}

      <section className="w-full">
        <h2
          className="
            m-4
            mt-0
            text-xl
            lg:text-2xl
            font-semibold
            w-full
            ml-[1rem]
            lg:ml-[3rem]
          "
        >
          Top Albums
        </h2>

        {albums.length > 0 ? (
          <AlbumSlider
            albums={albums}
          />
        ) : (
          <p className="px-5 opacity-60">
            No albums available.
          </p>
        )}
      </section>

      <br />

      {/* ===================================================
          TOP ARTISTS
      =================================================== */}

      <section className="w-full">
        <h2
          className="
            pr-1
            m-4
            mt-0
            text-xl
            lg:text-2xl
            font-semibold
            w-full
            ml-[1rem]
            lg:ml-[3.5rem]
          "
        >
          Top Artists
        </h2>

        {artists.length > 0 ? (
          <ArtistSlider
            artists={artists}
          />
        ) : (
          <p className="px-5 opacity-60">
            No artists available.
          </p>
        )}
      </section>

      <br />

      {/* ===================================================
          TOP PLAYLISTS
      =================================================== */}

      <section className="w-full flex flex-col gap-3">
        <h2
          className="
            m-1
            text-xl
            lg:text-2xl
            font-semibold
            w-full
            ml-[1rem]
            lg:ml-[2.8rem]
          "
        >
          Top Playlists
        </h2>

        {playlists.length > 0 ? (
          <PlaylistSlider
            playlists={playlists}
          />
        ) : (
          <p className="px-5 opacity-60">
            No playlists available.
          </p>
        )}
      </section>
    </main>
  );
};

export default MainSection;
