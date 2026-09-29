import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import {
  getTamilNewSongs,
  getMalayalamNewSongs,
  getHindiNewSongs,
  getTamilNewAlbums,
  getMalayalamNewAlbums,
  getHindiNewAlbums,
  getTamilNewPlaylists,
  getMalayalamNewPlaylists,
  getHindiNewPlaylists,
  getLanguageFeaturedRadios,
} from "../../fetch";

import MusicContext from "../context/MusicContext";
import SongGrid from "../SongGrid";
import ArtistItems from "../ArtistItems";
import artistData from "../genreData";

const FALLBACK_IMAGE = "/Unknown.png";

const resolveImage = (value) => {
  if (!value) return FALLBACK_IMAGE;

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
        const url = item.url || item.link || item.src;
        if (url) return url;
      }
    }
  }

  if (typeof value === "object") {
    return value.url || value.link || value.src || FALLBACK_IMAGE;
  }

  return FALLBACK_IMAGE;
};

const getItemImage = (item) =>
  resolveImage(
    item?.image ||
      item?.images ||
      item?.album?.image ||
      item?.album?.images ||
      item?.thumbnail ||
      item?.cover
  );

const getItemId = (item) =>
  item?.id ||
  item?.songId ||
  item?.song_id ||
  item?.trackId ||
  item?.albumId ||
  item?.playlistId ||
  item?.artistId ||
  item?.perma_url ||
  item?.permaUrl;

const getItemName = (item) =>
  item?.name ||
  item?.title ||
  item?.song ||
  item?.album_name ||
  item?.albumName ||
  "Unknown";

const getArtistName = (item) => {
  if (Array.isArray(item?.artists)) {
    return item.artists
      .map((artist) => artist?.name || artist)
      .filter(Boolean)
      .join(", ");
  }

  if (typeof item?.artists === "string") {
    return item.artists;
  }

  if (item?.primaryArtists) return item.primaryArtists;
  if (item?.artist) {
    if (typeof item.artist === "string") return item.artist;
    return item.artist?.name || "";
  }

  return "";
};

const normalizeArray = (response) => {
  if (Array.isArray(response)) return response;

  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.results)) return response.data.results;
  if (Array.isArray(response?.data?.songs)) return response.data.songs;
  if (Array.isArray(response?.data?.albums)) return response.data.albums;
  if (Array.isArray(response?.data?.playlists)) return response.data.playlists;
  if (Array.isArray(response?.data?.items)) return response.data.items;

  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.songs)) return response.songs;
  if (Array.isArray(response?.albums)) return response.albums;
  if (Array.isArray(response?.playlists)) return response.playlists;
  if (Array.isArray(response?.items)) return response.items;

  return [];
};

const uniqueItems = (items = []) => {
  const seen = new Set();

  return items.filter((item) => {
    const id =
      getItemId(item) ||
      `${getItemName(item)}-${getArtistName(item)}`.toLowerCase();

    if (!id || seen.has(id)) return false;

    seen.add(id);
    return true;
  });
};

const getSongAudio = (song) =>
  song?.audio ||
  song?.audioUrl ||
  song?.downloadUrl ||
  song?.download_url ||
  song?.media_url ||
  song?.mediaUrl ||
  song?.url ||
  song?.more_info?.encrypted_media_url ||
  song?.more_info?.media_url ||
  "";

const normalizeSong = (song) => {
  if (!song) return null;

  return {
    ...song,
    id: getItemId(song),
    name: getItemName(song),
    title: song?.title || getItemName(song),
    image: getItemImage(song),
    artists:
      song?.artists ||
      song?.primaryArtists ||
      song?.artist ||
      getArtistName(song),
    primaryArtists:
      song?.primaryArtists ||
      getArtistName(song) ||
      song?.artists ||
      "",
    audio: getSongAudio(song),
    duration:
      song?.duration ||
      song?.more_info?.duration ||
      song?.more_info?.duration_sec ||
      0,
  };
};

const normalizeSongs = (response, limit = 30) =>
  uniqueItems(
    normalizeArray(response)
      .map(normalizeSong)
      .filter((song) => song?.id)
  ).slice(0, limit);

const normalizeCards = (response, limit = 20) =>
  uniqueItems(normalizeArray(response).filter(Boolean)).slice(0, limit);

const SectionTitle = ({ children, to }) => (
  <div className="section-title-row">
    <h2>{children}</h2>

    {to ? (
      <Link to={to} className="section-view-all">
        See All
      </Link>
    ) : null}
  </div>
);

const EmptySection = ({ message = "No data available." }) => (
  <div className="empty-section">
    <p>{message}</p>
  </div>
);

const SongSection = ({ title, songs, queue, onPlay, viewAll }) => {
  const list = normalizeSongs(songs, 30);

  return (
    <section className="music-section song-section">
      <SectionTitle to={viewAll}>{title}</SectionTitle>

      {list.length ? (
        <div className="song-grid-wrapper">
          {list.map((song, index) => (
            <SongGrid
              key={song?.id || `${title}-${index}`}
              {...song}
              song={queue?.length ? queue : list}
              onClick={() => onPlay?.(song, list)}
            />
          ))}
        </div>
      ) : (
        <EmptySection />
      )}
    </section>
  );
};

const AlbumCard = ({ album }) => {
  const id = getItemId(album);
  const image = getItemImage(album);
  const name = getItemName(album);

  return (
    <Link
      to={id ? `/album/${id}` : "#"}
      className="media-card album-card"
      onClick={(event) => {
        if (!id) event.preventDefault();
      }}
    >
      <div className="media-card-image">
        <img
          src={image}
          alt={name}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src = FALLBACK_IMAGE;
          }}
        />
      </div>

      <div className="media-card-content">
        <h3>{name}</h3>
        <p>{getArtistName(album) || album?.year || "Album"}</p>
      </div>
    </Link>
  );
};

const PlaylistCard = ({ playlist }) => {
  const id = getItemId(playlist);
  const image = getItemImage(playlist);
  const name = getItemName(playlist);

  return (
    <Link
      to={id ? `/playlist/${id}` : "#"}
      className="media-card playlist-card"
      onClick={(event) => {
        if (!id) event.preventDefault();
      }}
    >
      <div className="media-card-image">
        <img
          src={image}
          alt={name}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src = FALLBACK_IMAGE;
          }}
        />
      </div>

      <div className="media-card-content">
        <h3>{name}</h3>
        <p>
          {playlist?.songCount ||
            playlist?.song_count ||
            playlist?.songs?.length ||
            "Playlist"}
        </p>
      </div>
    </Link>
  );
};

const CardGrid = ({ items, type }) => {
  const list = normalizeCards(items, 20);

  if (!list.length) {
    return <EmptySection />;
  }

  return (
    <div className="media-card-grid">
      {list.map((item, index) =>
        type === "playlist" ? (
          <PlaylistCard
            key={getItemId(item) || `playlist-${index}`}
            playlist={item}
          />
        ) : (
          <AlbumCard
            key={getItemId(item) || `album-${index}`}
            album={item}
          />
        )
      )}
    </div>
  );
};

const RadioSection = ({ radios }) => {
  const list = Array.isArray(radios) ? radios : [];

  if (!list.length) return null;

  return (
    <section className="music-section radio-section">
      <SectionTitle>Featured Radio</SectionTitle>

      <div className="radio-grid">
        {list.map((radio, index) => {
          const name =
            radio?.name ||
            radio?.language ||
            radio?.stationName ||
            "Featured Radio";

          const stationId =
            radio?.stationId ||
            radio?.station_id ||
            radio?.id ||
            "";

          return (
            <div
              className="radio-card"
              key={stationId || `${name}-${index}`}
            >
              <div className="radio-icon">♫</div>

              <div className="radio-info">
                <h3>{name}</h3>
                <p>
                  {stationId
                    ? `Station ID: ${stationId}`
                    : "Featured station"}
                </p>
              </div>

              <button
                type="button"
                className="radio-play-button"
                disabled
                title="Station playback endpoint is not available from this API response"
              >
                ▶
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};

const MainSection = () => {
  const { currentSong, playMusic } = MusicContext.useContext
    ? MusicContext.useContext()
    : {};

  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [tamilSongs, setTamilSongs] = useState([]);
  const [malayalamSongs, setMalayalamSongs] = useState([]);
  const [hindiSongs, setHindiSongs] = useState([]);

  const [tamilAlbums, setTamilAlbums] = useState([]);
  const [malayalamAlbums, setMalayalamAlbums] = useState([]);
  const [hindiAlbums, setHindiAlbums] = useState([]);

  const [tamilPlaylists, setTamilPlaylists] = useState([]);
  const [malayalamPlaylists, setMalayalamPlaylists] = useState([]);
  const [hindiPlaylists, setHindiPlaylists] = useState([]);

  const [radios, setRadios] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("recentlyPlayed");

      if (!stored) {
        setRecentlyPlayed([]);
        return;
      }

      const parsed = JSON.parse(stored);

      if (Array.isArray(parsed)) {
        setRecentlyPlayed(
          uniqueItems(
            parsed
              .map(normalizeSong)
              .filter((song) => song?.id)
          ).slice(0, 20)
        );
      }
    } catch (storageError) {
      console.error("Recently played error:", storageError);
      setRecentlyPlayed([]);
    }
  }, [currentSong]);

  useEffect(() => {
    const loadHomeData = async () => {
      setLoading(true);
      setError("");

      try {
        const [
          tamilSongResponse,
          malayalamSongResponse,
          hindiSongResponse,

          tamilAlbumResponse,
          malayalamAlbumResponse,
          hindiAlbumResponse,

          tamilPlaylistResponse,
          malayalamPlaylistResponse,
          hindiPlaylistResponse,

          radioResponse,
        ] = await Promise.allSettled([
          getTamilNewSongs(30),
          getMalayalamNewSongs(30),
          getHindiNewSongs(30),

          getTamilNewAlbums(20),
          getMalayalamNewAlbums(20),
          getHindiNewAlbums(20),

          getTamilNewPlaylists(20),
          getMalayalamNewPlaylists(20),
          getHindiNewPlaylists(20),

          getLanguageFeaturedRadios(),
        ]);

        if (!mountedRef.current) return;

        const getValue = (result) =>
          result?.status === "fulfilled" ? result.value : [];

        setTamilSongs(
          normalizeSongs(getValue(tamilSongResponse), 30)
        );

        setMalayalamSongs(
          normalizeSongs(getValue(malayalamSongResponse), 30)
        );

        setHindiSongs(
          normalizeSongs(getValue(hindiSongResponse), 30)
        );

        setTamilAlbums(
          normalizeCards(getValue(tamilAlbumResponse), 20)
        );

        setMalayalamAlbums(
          normalizeCards(getValue(malayalamAlbumResponse), 20)
        );

        setHindiAlbums(
          normalizeCards(getValue(hindiAlbumResponse), 20)
        );

        setTamilPlaylists(
          normalizeCards(getValue(tamilPlaylistResponse), 20)
        );

        setMalayalamPlaylists(
          normalizeCards(getValue(malayalamPlaylistResponse), 20)
        );

        setHindiPlaylists(
          normalizeCards(getValue(hindiPlaylistResponse), 20)
        );

        const radioValue = getValue(radioResponse);

        if (Array.isArray(radioValue)) {
          setRadios(radioValue);
        } else if (Array.isArray(radioValue?.data)) {
          setRadios(radioValue.data);
        } else {
          setRadios([]);
        }
      } catch (loadError) {
        console.error("MainSection API error:", loadError);

        if (mountedRef.current) {
          setError(
            loadError?.message ||
              "Unable to load music data. Please try again."
          );
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    loadHomeData();
  }, []);

  const allSongs = useMemo(() => {
    return uniqueItems([
      ...tamilSongs,
      ...malayalamSongs,
      ...hindiSongs,
      ...recentlyPlayed,
    ]);
  }, [
    tamilSongs,
    malayalamSongs,
    hindiSongs,
    recentlyPlayed,
  ]);

  const recentlyPlayedSongs = useMemo(() => {
    return normalizeSongs(recentlyPlayed, 20);
  }, [recentlyPlayed]);

  const artistList = useMemo(() => {
    if (!Array.isArray(artistData)) return [];

    return artistData.filter(Boolean);
  }, []);

  const handlePlay = (song, queue = allSongs) => {
    if (!song || !playMusic) return;

    const normalizedSong = normalizeSong(song);
    const normalizedQueue = normalizeSongs(queue, 100);

    try {
      playMusic(
        normalizedSong,
        normalizedQueue.length ? normalizedQueue : [normalizedSong]
      );
    } catch (firstError) {
      try {
        playMusic(normalizedSong);
      } catch (secondError) {
        console.error(
          "Unable to play selected song:",
          secondError || firstError
        );
      }
    }
  };

  if (loading) {
    return (
      <main className="main-section loading-page">
        <div className="home-loader">
          <div className="loader-spinner" />
          <p>Loading MusicMax...</p>
        </div>
      </main>
    );
  }

  if (error && !allSongs.length) {
    return (
      <main className="main-section error-page">
        <div className="home-error">
          <h2>Something went wrong</h2>
          <p>{error}</p>

          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="main-section">
      {error ? (
        <div className="inline-api-warning">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      ) : null}

      {/* Recently Played */}
      {recentlyPlayedSongs.length > 0 ? (
        <SongSection
          title="Recently Played"
          songs={recentlyPlayedSongs}
          queue={recentlyPlayedSongs}
          onPlay={handlePlay}
        />
      ) : null}

      {/* Tamil New Songs */}
      <SongSection
        title="New Songs - Tamil"
        songs={tamilSongs}
        queue={allSongs}
        onPlay={handlePlay}
        viewAll="/new-releases/tamil"
      />

      {/* Malayalam New Songs */}
      <SongSection
        title="New Songs - Malayalam"
        songs={malayalamSongs}
        queue={allSongs}
        onPlay={handlePlay}
        viewAll="/new-releases/malayalam"
      />

      {/* Hindi New Songs */}
      <SongSection
        title="New Songs - Hindi"
        songs={hindiSongs}
        queue={allSongs}
        onPlay={handlePlay}
        viewAll="/new-releases/hindi"
      />

      {/* Albums */}
      <section className="music-section">
        <SectionTitle>Albums - Tamil</SectionTitle>
        <CardGrid items={tamilAlbums} type="album" />
      </section>

      <section className="music-section">
        <SectionTitle>Albums - Malayalam</SectionTitle>
        <CardGrid items={malayalamAlbums} type="album" />
      </section>

      <section className="music-section">
        <SectionTitle>Albums - Hindi</SectionTitle>
        <CardGrid items={hindiAlbums} type="album" />
      </section>

      {/* Artists */}
      {artistList.length > 0 ? (
        <section className="music-section artists-section">
          <SectionTitle>Artists</SectionTitle>

          <div className="artist-grid">
            {artistList.map((artist, index) => (
              <ArtistItems
                key={
                  artist?.id ||
                  artist?.artistId ||
                  artist?.name ||
                  index
                }
                {...artist}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* Playlists */}
      <section className="music-section">
        <SectionTitle>Playlists - Tamil</SectionTitle>
        <CardGrid items={tamilPlaylists} type="playlist" />
      </section>

      <section className="music-section">
        <SectionTitle>Playlists - Malayalam</SectionTitle>
        <CardGrid
          items={malayalamPlaylists}
          type="playlist"
        />
      </section>

      <section className="music-section">
        <SectionTitle>Playlists - Hindi</SectionTitle>
        <CardGrid items={hindiPlaylists} type="playlist" />
      </section>

      {/* Featured Radio */}
      <RadioSection radios={radios} />
    </main>
  );
};

export default MainSection;
