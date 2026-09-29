import {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  fetchplaylistsByID,
  searchAlbumByQuery,
  searchPlayListByQuery,
} from "../../fetch";

import AlbumSlider from "./Sliders/AlbumSlider";
import PlaylistSlider from "./Sliders/PlaylistSlider";
import ArtistSlider from "./Sliders/ArtistSlider";
import SongGrid from "./SongGrid";

import {
  MdOutlineKeyboardArrowLeft,
  MdOutlineKeyboardArrowRight,
} from "react-icons/md";

import { artistData } from "../genreData";
import MusicContext from "../context/MusicContext";


// ============================================================
// HELPERS
// ============================================================

const FALLBACK_IMAGE = "/Unknown.png";

const getImage = (value) => {
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
        if (item.url) return item.url;
        if (item.link) return item.link;
        if (item.src) return item.src;
      }
    }
  }

  if (typeof value === "object") {
    return (
      value.url ||
      value.link ||
      value.src ||
      FALLBACK_IMAGE
    );
  }

  return FALLBACK_IMAGE;
};


const getSongId = (song) => {
  if (!song) {
    return null;
  }

  return (
    song.id ||
    song.songId ||
    song.song_id ||
    song.trackId ||
    song.track_id ||
    null
  );
};


const getSongAudio = (song) => {
  if (!song) {
    return "";
  }

  return (
    song.audio ||
    song.audioUrl ||
    song.audio_url ||
    song.downloadUrl ||
    song.download_url ||
    song.media_url ||
    song.mediaUrl ||
    song.url ||
    song.more_info?.media_url ||
    song.more_info?.encrypted_media_url ||
    ""
  );
};


const getSongName = (song) => {
  if (!song) {
    return "Unknown Song";
  }

  return (
    song.name ||
    song.title ||
    song.song ||
    song.song_name ||
    "Unknown Song"
  );
};


const getArtists = (song) => {
  if (!song) {
    return "";
  }

  if (typeof song.primaryArtists === "string") {
    return song.primaryArtists;
  }

  if (typeof song.primary_artists === "string") {
    return song.primary_artists;
  }

  if (typeof song.artists === "string") {
    return song.artists;
  }

  if (Array.isArray(song.artists)) {
    return song.artists
      .map((artist) => {
        if (typeof artist === "string") {
          return artist;
        }

        return artist?.name || "";
      })
      .filter(Boolean)
      .join(", ");
  }

  if (song.artist) {
    if (typeof song.artist === "string") {
      return song.artist;
    }

    return song.artist?.name || "";
  }

  return "";
};


const normalizeSong = (song) => {
  if (!song || typeof song !== "object") {
    return null;
  }

  const id = getSongId(song);

  return {
    ...song,

    id,

    name: getSongName(song),

    title:
      song.title ||
      song.name ||
      song.song ||
      "Unknown Song",

    image: getImage(
      song.image ||
        song.images ||
        song.album?.image ||
        song.album?.images
    ),

    artists:
      song.artists ||
      song.primaryArtists ||
      song.primary_artists ||
      song.artist ||
      "",

    primaryArtists: getArtists(song),

    audio: getSongAudio(song),

    duration:
      song.duration ||
      song.more_info?.duration ||
      0,
  };
};


const normalizeSongs = (songs) => {
  if (!Array.isArray(songs)) {
    return [];
  }

  const output = [];
  const seen = new Set();

  songs.forEach((song) => {
    const normalized = normalizeSong(song);

    if (!normalized) {
      return;
    }

    const id = normalized.id;

    if (id !== null && id !== undefined) {
      const key = String(id);

      if (seen.has(key)) {
        return;
      }

      seen.add(key);
    }

    output.push(normalized);
  });

  return output;
};


const extractSongs = (response) => {
  if (!response) {
    return [];
  }

  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data?.songs)) {
    return response.data.songs;
  }

  if (Array.isArray(response?.data?.results)) {
    return response.data.results;
  }

  if (Array.isArray(response?.data?.items)) {
    return response.data.items;
  }

  if (Array.isArray(response?.songs)) {
    return response.songs;
  }

  if (Array.isArray(response?.results)) {
    return response.results;
  }

  if (Array.isArray(response?.items)) {
    return response.items;
  }

  return [];
};


const extractResults = (response) => {
  if (!response) {
    return [];
  }

  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data?.results)) {
    return response.data.results;
  }

  if (Array.isArray(response?.data?.albums)) {
    return response.data.albums;
  }

  if (Array.isArray(response?.data?.playlists)) {
    return response.data.playlists;
  }

  if (Array.isArray(response?.results)) {
    return response.results;
  }

  if (Array.isArray(response?.albums)) {
    return response.albums;
  }

  if (Array.isArray(response?.playlists)) {
    return response.playlists;
  }

  return [];
};


// ============================================================
// MAIN COMPONENT
// ============================================================

const MainSection = () => {
  const musicContext = useContext(MusicContext);

  const playMusic =
    musicContext?.playMusic ||
    null;

  // ==========================================================
  // STATE
  // ==========================================================

  const [trending, setTrending] = useState([]);

  const [latestSongs, setLatestSongs] =
    useState([]);

  const [albums, setAlbums] =
    useState([]);

  const [artists, setArtists] =
    useState([]);

  const [playlists, setPlaylists] =
    useState([]);

  const [
    recentlyPlayedSongs,
    setRecentlyPlayedSongs,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ==========================================================
  // REFS
  // ==========================================================

  const recentlyPlayedScrollRef =
    useRef(null);

  const latestSongsScrollRef =
    useRef(null);

  const trendingScrollRef =
    useRef(null);

  // ==========================================================
  // RECENTLY PLAYED
  // ==========================================================

  const loadRecentlyPlayed = () => {
    try {
      const stored =
        localStorage.getItem("playedSongs");

      if (!stored) {
        setRecentlyPlayedSongs([]);
        return;
      }

      const parsed =
        JSON.parse(stored);

      if (!Array.isArray(parsed)) {
        setRecentlyPlayedSongs([]);
        return;
      }

      setRecentlyPlayedSongs(
        normalizeSongs(parsed)
      );
    } catch (err) {
      console.error(
        "Recently played error:",
        err
      );

      setRecentlyPlayedSongs([]);
    }
  };


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


  // ==========================================================
  // ALL SONGS / PLAY QUEUE
  // ==========================================================

  const songList = useMemo(() => {
    return normalizeSongs([
      ...recentlyPlayedSongs,
      ...trending,
      ...latestSongs,
    ]);
  }, [
    recentlyPlayedSongs,
    trending,
    latestSongs,
  ]);


  // ==========================================================
  // SCROLL FUNCTIONS
  // ==========================================================

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


  // ==========================================================
  // GREETING
  // ==========================================================

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


  // ==========================================================
  // LOAD HOME DATA
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          trendingResult,
          latestResult,
          albumResult,
          playlistResult,
        ] = await Promise.allSettled([
          fetchplaylistsByID(10763385),

          fetchplaylistsByID(80802063),

          searchAlbumByQuery(
            "Tamil, Malayalam"
          ),

          searchPlayListByQuery(
            "Tamil, Malayalam"
          ),
        ]);

        if (!mounted) {
          return;
        }


        // ======================================================
        // TRENDING
        // ======================================================

        if (
          trendingResult.status ===
          "fulfilled"
        ) {
          const songs =
            extractSongs(
              trendingResult.value
            );

          setTrending(
            normalizeSongs(songs)
          );
        } else {
          console.error(
            "Trending API:",
            trendingResult.reason
          );

          setTrending([]);
        }


        // ======================================================
        // NEW SONGS
        // ======================================================

        if (
          latestResult.status ===
          "fulfilled"
        ) {
          const songs =
            extractSongs(
              latestResult.value
            );

          setLatestSongs(
            normalizeSongs(songs)
          );
        } else {
          console.error(
            "Latest songs API:",
            latestResult.reason
          );

          setLatestSongs([]);
        }


        // ======================================================
        // ALBUMS
        // ======================================================

        if (
          albumResult.status ===
          "fulfilled"
        ) {
          const results =
            extractResults(
              albumResult.value
            );

          setAlbums(
            Array.isArray(results)
              ? results
              : []
          );
        } else {
          console.error(
            "Albums API:",
            albumResult.reason
          );

          setAlbums([]);
        }


        // ======================================================
        // PLAYLISTS
        // ======================================================

        if (
          playlistResult.status ===
          "fulfilled"
        ) {
          const results =
            extractResults(
              playlistResult.value
            );

          setPlaylists(
            Array.isArray(results)
              ? results
              : []
          );
        } else {
          console.error(
            "Playlists API:",
            playlistResult.reason
          );

          setPlaylists([]);
        }


        // ======================================================
        // ARTISTS
        // ======================================================

        if (Array.isArray(artistData)) {
          setArtists(artistData);
        } else if (
          Array.isArray(
            artistData?.results
          )
        ) {
          setArtists(
            artistData.results
          );
        } else {
          setArtists([]);
        }

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


  // ==========================================================
  // SONG CLICK
  // ==========================================================

  const handlePlaySong = (
    song,
    queue = songList
  ) => {
    if (
      !song ||
      typeof playMusic !== "function"
    ) {
      return;
    }

    const normalized =
      normalizeSong(song);

    if (!normalized) {
      return;
    }

    const normalizedQueue =
      normalizeSongs(queue);

    try {
      playMusic(
        normalized,
        normalizedQueue.length
          ? normalizedQueue
          : [normalized]
      );
    } catch (error1) {
      console.error(
        "playMusic queue error:",
        error1
      );

      try {
        playMusic(normalized);
      } catch (error2) {
        console.error(
          "playMusic error:",
          error2
        );
      }
    }
  };


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div
        className="
          min-h-[60vh]
          w-full
          flex
          items-center
          justify-center
        "
      >
        <div
          className="
            flex
            flex-col
            items-center
            gap-3
          "
        >
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


  // ==========================================================
  // ERROR
  // ==========================================================

  if (
    error &&
    !trending.length &&
    !latestSongs.length &&
    !albums.length &&
    !playlists.length
  ) {
    return (
      <div
        className="
          min-h-[60vh]
          w-full
          flex
          items-center
          justify-center
        "
      >
          <div className="text-center">

            <h2 className="text-xl font-semibold">
              Unable to load MusicMax
            </h2>

            <p className="mt-3 text-sm opacity-70">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
              className="
                mt-4
                px-5
                py-2
                rounded-lg
                bg-black
                text-white
                dark:bg-white
                dark:text-black
                transition
              "
            >
              Try Again
            </button>

          </div>
          </div>
  );
}


// ==========================================================
// MAIN UI
// ==========================================================

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
    {/* ============================================
        GREETING
    ============================================ */}

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


    {/* ============================================
        ERROR MESSAGE
    ============================================ */}

    {error && (
      <div
        className="
          w-[95%]
          lg:w-[90%]
          p-3
          rounded-lg
          border
          border-red-500/30
          bg-red-500/10
          text-sm
        "
      >
        <p className="text-red-400">
          {error}
        </p>
      </div>
    )}


    {/* ============================================
        RECENTLY PLAYED
    ============================================ */}

    {recentlyPlayedSongs.length > 0 && (
      <section className="flex flex-col items-center w-full">

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
            onClick={() =>
              scrollLeft(
                recentlyPlayedScrollRef
              )
            }
            className="
              text-3xl
              hidden
              lg:flex
              items-center
              justify-center
              cursor-pointer
              h-[9rem]
              hover:scale-125
              transition
            "
            aria-label="Scroll recently played left"
          >
            <MdOutlineKeyboardArrowLeft />
          </button>

          <div
            ref={recentlyPlayedScrollRef}
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
            "
          >
            {recentlyPlayedSongs.map(
              (song, index) => (
                <SongGrid
                  key={
                    song?.id ||
                    `recent-${index}`
                  }
                  {...song}
                  song={songList}
                />
              )
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              scrollRight(
                recentlyPlayedScrollRef
              )
            }
            className="
              text-3xl
              hidden
              lg:flex
              items-center
              justify-center
              cursor-pointer
              h-[9rem]
              hover:scale-125
              transition
            "
            aria-label="Scroll recently played right"
          >
            <MdOutlineKeyboardArrowRight />
          </button>

        </div>
      </section>
    )}


    {/* ============================================
        NEW SONGS
    ============================================ */}

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
          onClick={() =>
            scrollLeft(
              latestSongsScrollRef
            )
          }
          className="
            text-3xl
            hidden
            lg:flex
            items-center
            justify-center
            cursor-pointer
            h-[9rem]
            hover:scale-125
            transition
          "
          aria-label="Scroll new songs left"
        >
          <MdOutlineKeyboardArrowLeft />
        </button>

        <div
          ref={latestSongsScrollRef}
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
          "
        >
          {latestSongs.length > 0 ? (
            latestSongs.map(
              (song, index) => (
                <SongGrid
                  key={
                    song?.id ||
                    `latest-${index}`
                  }
                  {...song}
                  song={songList}
                />
              )
            )
          ) : (
            <p className="px-5">
              No new songs available.
            </p>
          )}
        </div>

          <button
            type="button"
            onClick={() =>
              scrollRight(
                latestSongsScrollRef
              )
            }
            className="
              text-3xl
              hidden
              lg:flex
              items-center
              justify-center
              cursor-pointer
              h-[9rem]
              hover:scale-125
              transition
            "
            aria-label="Scroll new songs right"
          >
            <MdOutlineKeyboardArrowRight />
          </button>

      </div>
    </section>


    {/* ============================================
        TODAY TRENDING
    ============================================ */}

    <section className="flex flex-col items-center w-full">

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
          onClick={() =>
            scrollLeft(
              trendingScrollRef
            )
          }
          className="
            text-3xl
            hidden
            lg:flex
            items-center
            justify-center
            cursor-pointer
            h-[9rem]
            hover:scale-125
            transition
          "
          aria-label="Scroll trending songs left"
        >
          <MdOutlineKeyboardArrowLeft />
        </button>

        <div
          ref={trendingScrollRef}
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
          "
        >
          {trending.length > 0 ? (
            trending.map(
              (song, index) => (
                <SongGrid
                  key={
                    song?.id ||
                    `trending-${index}`
                  }
                  {...song}
                  song={songList}
                />
              )
            )
          ) : (
            <p className="px-5">
              No trending songs available.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() =>
            scrollRight(
              trendingScrollRef
            )
          }
          className="
            text-3xl
            hidden
            lg:flex
            items-center
            justify-center
            cursor-pointer
            h-[9rem]
            hover:scale-125
            transition
          "
          aria-label="Scroll trending songs right"
        >
          <MdOutlineKeyboardArrowRight />
        </button>

      </div>
    </section>


    {/* ============================================
        TOP ALBUMS
    ============================================ */}

    <section className="w-full">

      <h2
        className="
          m-4
          mt-0
          text-xl
          lg:text-2xl
          font-semibold
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
        <p className="px-5">
          No albums available.
        </p>
      )}

    </section>


    {/* ============================================
        TOP ARTISTS
    ============================================ */}

    <section className="w-full">

      <h2
        className="
          m-4
          mt-0
          text-xl
          lg:text-2xl
          font-semibold
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
        <p className="px-5">
          No artists available.
        </p>
      )}

    </section>


    {/* ============================================
        TOP PLAYLISTS
    ============================================ */}

    <section className="w-full">

      <h2
        className="
          m-1
          text-xl
          lg:text-2xl
          font-semibold
          ml-[1rem]
          lg:ml-[2.8rem]
        "
      >
        Top Playlists
      </h2>

      <div className="flex items-center">

        {playlists.length > 0 ? (
          <PlaylistSlider
            playlists={playlists}
          />
          ) : (
            <p className="px-5">
              No playlists available.
            </p>
          )}

      </div>

    </section>

  </main>
);

};

export default MainSection;
