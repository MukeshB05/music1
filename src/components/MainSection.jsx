import { useEffect, useRef, useState } from "react";

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


// =========================================================
// MAIN SECTION
// =========================================================

const MainSection = () => {
  // =========================================================
  // STATE
  // =========================================================

  const [trending, setTrending] = useState([]);
  const [latestSongs, setLatestSongs] = useState([]);

  const [tamilNewReleases, setTamilNewReleases] = useState([]);
  const [malayalamNewReleases, setMalayalamNewReleases] =
    useState([]);
  const [hindiNewReleases, setHindiNewReleases] = useState([]);
  const [englishNewReleases, setEnglishNewReleases] =
    useState([]);

  const [albums, setAlbums] = useState([]);
  const [artists, setArtists] = useState([]);
  const [playlists, setPlaylists] = useState([]);

  const [recentlyPlayedSongs, setRecentlyPlayedSongs] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  // =========================================================
  // REFS
  // =========================================================

  const recentlyPlayedScrollRef = useRef(null);
  const latestSongsScrollRef = useRef(null);
  const trendingScrollRef = useRef(null);

  const tamilNewReleasesScrollRef = useRef(null);
  const malayalamNewReleasesScrollRef = useRef(null);
  const hindiNewReleasesScrollRef = useRef(null);
  const englishNewReleasesScrollRef = useRef(null);


  // =========================================================
  // READ RECENTLY PLAYED
  // =========================================================

  const loadRecentlyPlayed = () => {
    try {
      const storedSongs =
        localStorage.getItem("playedSongs");

      if (!storedSongs) {
        setRecentlyPlayedSongs([]);
        return;
      }

      const parsedSongs = JSON.parse(storedSongs);

      if (!Array.isArray(parsedSongs)) {
        setRecentlyPlayedSongs([]);
        return;
      }

      setRecentlyPlayedSongs(parsedSongs);
    } catch (err) {
      console.error(
        "Unable to read recently played songs:",
        err
      );

      setRecentlyPlayedSongs([]);
    }
  };


  // =========================================================
  // INITIAL RECENTLY PLAYED LOAD
  // =========================================================

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


  // =========================================================
  // SCROLL LEFT
  // =========================================================

  const scrollLeft = (ref) => {
    if (!ref?.current) {
      return;
    }

    ref.current.scrollBy({
      left: -800,
      behavior: "smooth",
    });
  };


  // =========================================================
  // SCROLL RIGHT
  // =========================================================

  const scrollRight = (ref) => {
    if (!ref?.current) {
      return;
    }

    ref.current.scrollBy({
      left: 800,
      behavior: "smooth",
    });
  };


  // =========================================================
  // GREETING
  // =========================================================

  const getGreeting = () => {
    const hour = new Date().getHours();

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


  // =========================================================
  // NORMALIZE ARRAY
  // =========================================================

  const getArray = (value) => {
    if (Array.isArray(value)) {
      return value;
    }

    return [];
  };


  // =========================================================
  // GET PLAYLIST ID
  //
  // Supports:
  // id
  // listid
  // listId
  // playlistId
  // playlist_id
  // url
  // permalink
  // =========================================================

  const getPlaylistId = (playlist) => {
    if (!playlist) {
      return null;
    }

    const directId =
      playlist?.id ??
      playlist?.listid ??
      playlist?.listId ??
      playlist?.playlistId ??
      playlist?.playlist_id;

    if (directId) {
      return String(directId);
    }

    const possibleUrl =
      playlist?.url ??
      playlist?.perma_url ??
      playlist?.permalink ??
      playlist?.link;

    if (typeof possibleUrl === "string") {
      const matches = possibleUrl.match(
        /([A-Za-z0-9_-]{8,})\/?$/
      );

      if (matches?.[1]) {
        return matches[1];
      }
    }

    return null;
  };


  // =========================================================
  // EXTRACT PLAYLIST RESULTS
  // =========================================================

  const getPlaylistResults = (response) => {
    const possibleResults = [
      response?.data?.results,
      response?.data?.playlists,
      response?.data?.playlist,
      response?.results,
      response?.playlists,
      response?.playlist,
    ];

    for (const value of possibleResults) {
      if (Array.isArray(value)) {
        return value;
      }
    }

    return [];
  };


  // =========================================================
  // EXTRACT SONGS
  // =========================================================

  const getSongsFromResponse = (response) => {
    const possibleSongs = [
      response?.data?.songs,
      response?.data?.data?.songs,
      response?.songs,
      response?.data?.results,
      response?.results,
    ];

    for (const value of possibleSongs) {
      if (Array.isArray(value)) {
        return value;
      }
    }

    return [];
  };


  // =========================================================
  // CHECK PLAYLIST TITLE
  // =========================================================

  const getPlaylistTitle = (playlist) => {
    return String(
      playlist?.title ??
        playlist?.name ??
        playlist?.playlistName ??
        playlist?.label ??
        ""
    ).toLowerCase();
  };


  // =========================================================
  // FIND BEST NEW RELEASE PLAYLIST
  // =========================================================

  const findNewReleasePlaylist = (
    playlists,
    language
  ) => {
    if (!Array.isArray(playlists) || playlists.length === 0) {
      return null;
    }

    const normalizedLanguage =
      String(language).toLowerCase();

    // -------------------------------------------------------
    // First priority:
    // language + new release/new song/latest
    // -------------------------------------------------------

    const exactMatch = playlists.find((playlist) => {
      const title = getPlaylistTitle(playlist);

      const hasLanguage =
        title.includes(normalizedLanguage);

      const hasReleaseKeyword =
        title.includes("new release") ||
        title.includes("new releases") ||
        title.includes("new song") ||
        title.includes("new songs") ||
        title.includes("latest") ||
        title.includes("fresh");

      return hasLanguage && hasReleaseKeyword;
    });

    if (exactMatch) {
      return exactMatch;
    }


    // -------------------------------------------------------
    // Second priority:
    // language only
    // -------------------------------------------------------

    const languageMatch = playlists.find((playlist) => {
      const title = getPlaylistTitle(playlist);

      return title.includes(normalizedLanguage);
    });

    if (languageMatch) {
      return languageMatch;
    }


    // -------------------------------------------------------
    // Third priority:
    // new releases keyword
    // -------------------------------------------------------

    const releaseMatch = playlists.find((playlist) => {
      const title = getPlaylistTitle(playlist);

      return (
        title.includes("new release") ||
        title.includes("new releases") ||
        title.includes("latest") ||
        title.includes("fresh")
      );
    });

    if (releaseMatch) {
      return releaseMatch;
    }


    return playlists[0];
  };


  // =========================================================
  // LOAD LANGUAGE NEW RELEASES
  //
  // 1. Search playlist
  // 2. Find matching language playlist
  // 3. Get playlist ID
  // 4. Fetch complete playlist songs
  // =========================================================

  const loadLanguageNewReleases = async (
    language
  ) => {
    try {
      const searchQueries = [
        `${language} New Releases`,
        `${language} New Songs`,
        `${language} Latest Songs`,
        `${language} Latest`,
      ];

      let playlist = null;

      for (const query of searchQueries) {
        try {
          const response =
            await searchPlayListByQuery(query);

          const results =
            getPlaylistResults(response);

          const found =
            findNewReleasePlaylist(
              results,
              language
            );

          if (found) {
            playlist = found;
            break;
          }
        } catch (searchError) {
          console.warn(
            `${language} playlist search failed:`,
            searchError
          );
        }
      }

      if (!playlist) {
        console.warn(
          `No ${language} New Releases playlist found.`
        );

        return [];
      }

      const playlistId =
        getPlaylistId(playlist);

      if (!playlistId) {
        console.warn(
          `No playlist ID found for ${language}.`,
          playlist
        );

        return [];
      }

      const playlistResponse =
        await fetchplaylistsByID(playlistId);

      const songs =
        getSongsFromResponse(playlistResponse);

      return songs;
    } catch (err) {
      console.error(
        `${language} New Releases Error:`,
        err
      );

      return [];
    }
  };


  // =========================================================
  // FETCH DATA
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");


        // =====================================================
        // LOAD MAIN DATA
        // =====================================================

        const [
          trendingResponse,
          latestResponse,
          albumResponse,
          playlistResponse,
        ] = await Promise.all([
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


        // =====================================================
        // LOAD LANGUAGE NEW RELEASES
        //
        // allSettled prevents one language API failure
        // from breaking the entire homepage.
        // =====================================================

        const [
          tamilResult,
          malayalamResult,
          hindiResult,
          englishResult,
        ] = await Promise.allSettled([
          loadLanguageNewReleases("Tamil"),
          loadLanguageNewReleases("Malayalam"),
          loadLanguageNewReleases("Hindi"),
          loadLanguageNewReleases("English"),
        ]);


        if (!mounted) {
          return;
        }


        // =====================================================
        // TRENDING
        // =====================================================

        const trendingSongs =
          getSongsFromResponse(
            trendingResponse
          );

        setTrending(trendingSongs);


        // =====================================================
        // LATEST SONGS
        // =====================================================

        const newSongs =
          getSongsFromResponse(
            latestResponse
          );

        setLatestSongs(newSongs);


        // =====================================================
        // TAMIL NEW RELEASES
        // =====================================================

        setTamilNewReleases(
          tamilResult.status === "fulfilled"
            ? getArray(tamilResult.value)
            : []
        );


        // =====================================================
        // MALAYALAM NEW RELEASES
        // =====================================================

        setMalayalamNewReleases(
          malayalamResult.status === "fulfilled"
            ? getArray(malayalamResult.value)
            : []
        );


        // =====================================================
        // HINDI NEW RELEASES
        // =====================================================

        setHindiNewReleases(
          hindiResult.status === "fulfilled"
            ? getArray(hindiResult.value)
            : []
        );


        // =====================================================
        // ENGLISH NEW RELEASES
        // =====================================================

        setEnglishNewReleases(
          englishResult.status === "fulfilled"
            ? getArray(englishResult.value)
            : []
        );


        // =====================================================
        // ALBUMS
        // =====================================================

        const albumResults =
          albumResponse?.data?.results;

        setAlbums(
          Array.isArray(albumResults)
            ? albumResults
            : []
        );


        // =====================================================
        // PLAYLISTS
        // =====================================================

        const playlistResults =
          playlistResponse?.data?.results;

        setPlaylists(
          Array.isArray(playlistResults)
            ? playlistResults
            : []
        );


        // =====================================================
        // ARTISTS
        // =====================================================

        if (
          Array.isArray(
            artistData?.results
          )
        ) {
          setArtists(
            artistData.results
          );
        } else if (
          Array.isArray(artistData)
        ) {
          setArtists(artistData);
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
              "Unable to load music data. Please try again."
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


  // =========================================================
  // LOADING
  // =========================================================

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


  // =========================================================
  // ERROR
  // =========================================================

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


  // =========================================================
  // SONG SECTION COMPONENT
  // =========================================================

  const SongSection = ({
    title,
    songs,
    scrollRef,
    emptyText = "No songs available.",
  }) => {
    if (!Array.isArray(songs) || songs.length === 0) {
      return null;
    }

    return (
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
          {title}
        </h2>


        <div className="flex justify-center items-center gap-3 w-full">

          {/* LEFT */}

          <button
            type="button"
            aria-label={`Scroll ${title} left`}
            onClick={() =>
              scrollLeft(scrollRef)
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
              shrink-0
            "
          >
            <MdOutlineKeyboardArrowLeft />
          </button>


          {/* SONGS */}

          <div
            ref={scrollRef}
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

            {songs.map((song, index) => (
              <SongGrid
                key={
                  song?.id ??
                  song?.songId ??
                  song?.song_id ??
                  song?.trackId ??
                  `${title}-${index}`
                }
                {...song}
                songs={songs}
              />
            ))}

          </div>


          {/* RIGHT */}

          <button
            type="button"
            aria-label={`Scroll ${title} right`}
            onClick={() =>
              scrollRight(scrollRef)
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
              shrink-0
            "
          >
            <MdOutlineKeyboardArrowRight />
          </button>

        </div>

      </section>
    );
  };


  // =========================================================
  // MAIN UI
  // =========================================================

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

      {/* =====================================================
          GREETING
      ====================================================== */}

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


      {/* =====================================================
          RECENTLY PLAYED
      ====================================================== */}

      {recentlyPlayedSongs.length > 0 && (
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
                shrink-0
              "
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
                scroll-smooth
              "
            >

              {recentlyPlayedSongs.map(
                (song, index) => (
                  <SongGrid
                    key={
                      song?.id ??
                      song?.songId ??
                      song?.song_id ??
                      index
                    }
                    {...song}
                    songs={recentlyPlayedSongs}
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
                shrink-0
              "
            >
              <MdOutlineKeyboardArrowRight />
            </button>

          </div>

        </section>
      )}


      {/* =====================================================
          NEW SONGS
      ====================================================== */}

      <SongSection
        title="New Songs"
        songs={latestSongs}
        scrollRef={latestSongsScrollRef}
      />

      <br />


      {/* =====================================================
          TAMIL NEW RELEASES
      ====================================================== */}

      <SongSection
        title="Tamil New Releases"
        songs={tamilNewReleases}
        scrollRef={tamilNewReleasesScrollRef}
      />

      <br />


      {/* =====================================================
          MALAYALAM NEW RELEASES
      ====================================================== */}

      <SongSection
        title="Malayalam New Releases"
        songs={malayalamNewReleases}
        scrollRef={malayalamNewReleasesScrollRef}
      />

      <br />


      {/* =====================================================
          HINDI NEW RELEASES
      ====================================================== */}

      <SongSection
        title="Hindi New Releases"
        songs={hindiNewReleases}
        scrollRef={hindiNewReleasesScrollRef}
      />

      <br />


      {/* =====================================================
          ENGLISH NEW RELEASES
      ====================================================== */}

      <SongSection
        title="English New Releases"
        songs={englishNewReleases}
        scrollRef={englishNewReleasesScrollRef}
      />

      <br />


      {/* =====================================================
          TODAY TRENDING
      ====================================================== */}

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
              shrink-0
            "
          >
            <MdOutlineKeyboardArrowLeft />
          </button>


          <div
            ref={trendingScrollRef}
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
              (song, index) => (
                <SongGrid
                  key={
                    song?.id ??
                    song?.songId ??
                    song?.song_id ??
                    index
                  }
                  {...song}
                  songs={trending}
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
              shrink-0
            "
          >
            <MdOutlineKeyboardArrowRight />
          </button>

        </div>

      </section>

      <br />


      {/* =====================================================
          TOP ALBUMS
      ====================================================== */}

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


      {/* =====================================================
          TOP ARTISTS
      ====================================================== */}

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


      {/* =====================================================
          TOP PLAYLISTS
      ====================================================== */}

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
