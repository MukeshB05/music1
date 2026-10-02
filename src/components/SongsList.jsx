import { GoPlay } from "react-icons/go";
import { useContext, useState } from "react";
import MusicContext from "../context/MusicContext";
import he from "he";

/* =========================================================
   SAFE HTML ENTITY DECODE
========================================================= */
const safeDecode = (value) => {
  try {
    return he.decode(String(value ?? ""));
  } catch {
    return String(value ?? "");
  }
};

/* =========================================================
   FORMAT DURATION
========================================================= */
const formatTime = (value) => {
  const seconds = Math.max(0, Math.floor(Number(value) || 0));

  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(
    2,
    "0"
  )}`;
};

/* =========================================================
   GET BEST IMAGE URL
========================================================= */
const getImageUrl = (image) => {
  if (!image) {
    return "/Unknown.png";
  }

  /* Direct URL */
  if (typeof image === "string") {
    return image;
  }

  /* Image array */
  if (Array.isArray(image)) {
    for (let i = image.length - 1; i >= 0; i -= 1) {
      const item = image[i];

      const url =
        typeof item === "string"
          ? item
          : item?.url ||
            item?.link ||
            item?.src ||
            item?.image;

      if (url) {
        return url;
      }
    }

    return "/Unknown.png";
  }

  /* Image object */
  if (typeof image === "object") {
    return (
      image?.url ||
      image?.link ||
      image?.src ||
      image?.image ||
      "/Unknown.png"
    );
  }

  return "/Unknown.png";
};

/* =========================================================
   GET ARTIST NAMES
========================================================= */
const getArtistNames = (artists) => {
  if (!artists) {
    return "Unknown Artist";
  }

  /* JioSaavn style:
     artists: {
       primary: [...]
     }
  */
  if (Array.isArray(artists?.primary)) {
    const names = artists.primary
      .map((artist) => {
        if (typeof artist === "string") {
          return artist;
        }

        return artist?.name;
      })
      .filter(Boolean)
      .join(", ");

    return names || "Unknown Artist";
  }

  /* Normal artist array */
  if (Array.isArray(artists)) {
    const names = artists
      .map((artist) => {
        if (typeof artist === "string") {
          return artist;
        }

        return artist?.name;
      })
      .filter(Boolean)
      .join(", ");

    return names || "Unknown Artist";
  }

  /* String */
  if (typeof artists === "string") {
    return artists || "Unknown Artist";
  }

  /* Single artist object */
  if (typeof artists === "object") {
    return (
      artists?.name ||
      artists?.title ||
      artists?.artist ||
      "Unknown Artist"
    );
  }

  return "Unknown Artist";
};

/* =========================================================
   SONG LIST COMPONENT
========================================================= */
const SongsList = (props) => {
  const [hovering, setHovering] = useState(false);

  const { playMusic } = useContext(MusicContext) || {};

  const {
    name,
    title,
    artists,
    artist,
    duration,
    image,
    id,
    song,
    songs,
    songList,
    onPlay,
  } = props;

  /* =======================================================
     COMPLETE QUEUE

     Supports:

     song={[...songs]}
     songs={[...songs]}
     songList={[...songs]}

     Important:
     An array is NEVER treated as the current song.
  ======================================================= */
  const queue = Array.isArray(song)
    ? song
    : Array.isArray(songs)
      ? songs
      : Array.isArray(songList)
        ? songList
        : [];

  /* =======================================================
     CURRENT SONG

     If `song` is an object, use it.

     If `song` is an array, use props as the current item.
  ======================================================= */
  const item =
    song &&
    !Array.isArray(song) &&
    typeof song === "object"
      ? song
      : props;

  /* =======================================================
     SONG NAME
  ======================================================= */
  const songName =
    item?.name ||
    item?.title ||
    item?.songName ||
    name ||
    title ||
    "Unknown Song";

  /* =======================================================
     ARTIST
  ======================================================= */
  const artistData =
    item?.artists ||
    item?.artist ||
    artists ||
    artist;

  const artistNames = getArtistNames(artistData);

  /* =======================================================
     IMAGE

     Prefer current item's image.
     Fall back to component image prop.
  ======================================================= */
  const imageUrl = getImageUrl(
    item?.image ||
      item?.images ||
      image
  );

  /* =======================================================
     DURATION
  ======================================================= */
  const songDuration =
    item?.duration ??
    duration ??
    0;

  /* =======================================================
     PLAY SONG
  ======================================================= */
  const handleClick = async (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    /* Custom play handler */
    if (typeof onPlay === "function") {
      onPlay(item, queue);
      return;
    }

    /* MusicContext unavailable */
    if (typeof playMusic !== "function") {
      console.error(
        "MusicContext.playMusic is not available."
      );
      return;
    }

    try {
      /*
       * Pass complete queue when available.

       Album:
       album songs -> Next / Previous

       Artist:
       artist songs -> Next / Previous

       Playlist:
       playlist songs -> Next / Previous

       Favourite:
       favourite songs -> Next / Previous

       Without queue:
       MusicContext creates a one-song queue.
      */
      await playMusic(
        item,
        queue.length > 0
          ? queue
          : undefined
      );
    } catch (error) {
      console.error(
        "Failed to play song:",
        error
      );
    }
  };

  /* =======================================================
     COMPONENT
  ======================================================= */
  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className="
        group
        relative
        w-full

        /* IMPORTANT:
           Row must be large enough for the new cover.
        */
        min-h-[6.5rem]
        sm:min-h-[7rem]
        lg:min-h-[9rem]

        overflow-hidden

        flex
        items-center

        gap-3
        sm:gap-4
        lg:gap-5

        px-2
        sm:px-3
        lg:px-4

        py-2

        text-left

        song-item
        song-info

        rounded-lg

        transition-colors
        duration-200

        hover:bg-white/[0.04]
      "
      aria-label={`Play ${safeDecode(songName)}`}
    >
      {/* =================================================
          FULL SIZE COVER IMAGE
      ================================================= */}
      <div
        className="
          relative
          shrink-0
          overflow-hidden
          rounded-lg

          /* Mobile */
          w-[10rem]
          h-[6rem]

          /* Small screens */
          sm:w-[11rem]
          sm:h-[6.5rem]

          /* Medium */
          md:w-[12rem]
          md:h-[7rem]

          /* Desktop */
          lg:w-[13rem]
          lg:h-[8rem]
        "
      >
        <img
          src={imageUrl}
          alt={safeDecode(songName)}
          loading="lazy"
          draggable="false"
          className="
            block
            w-full
            h-full

            object-cover
            object-center

            rounded-lg

            select-none

            transition-transform
            duration-200

            group-hover:scale-[1.03]
          "
          onError={(event) => {
            if (
              event.currentTarget.src.includes(
                "Unknown.png"
              )
            ) {
              return;
            }

            event.currentTarget.src =
              "/Unknown.png";
          }}
        />

        {/* ===============================================
            HOVER OVERLAY
        =============================================== */}
        <div
          className="
            absolute
            inset-0

            flex
            items-center
            justify-center

            bg-black/0
            group-hover:bg-black/30

            transition-all
            duration-200
          "
        >
          <GoPlay
            className="
              hidden
              lg:block

              w-[2.35rem]
              h-[2.35rem]

              text-white

              opacity-0
              group-hover:opacity-100

              transition-opacity
              duration-200

              icon
            "
          />
        </div>
      </div>

      {/* =================================================
          SONG TITLE
      ================================================= */}
      <div
        className="
          flex
          flex-1
          min-w-0

          pl-1
          sm:pl-2
          lg:pl-3
        "
      >
        <h3
          title={safeDecode(songName)}
          className="
            w-full

            overflow-hidden
            text-ellipsis
            whitespace-nowrap

            text-[0.85rem]
            sm:text-[0.95rem]
            lg:text-[1rem]

            font-medium
          "
        >
          {safeDecode(songName)}
        </h3>
      </div>

      {/* =================================================
          ARTIST
      ================================================= */}
      <div
        className="
          flex
          flex-1
          min-w-0

          hidden
          sm:flex
        "
      >
        <p
          title={safeDecode(artistNames)}
          className="
            w-full

            overflow-hidden
            text-ellipsis
            whitespace-nowrap

            text-[0.75rem]
            md:text-[0.8rem]
            lg:text-[0.875rem]

            mr-2
          "
        >
          {safeDecode(artistNames)}
        </p>
      </div>

      {/* =================================================
          DURATION
      ================================================= */}
      <div
        className="
          song-duration
          shrink-0

          mr-1
          sm:mr-2
          lg:mr-3
        "
      >
        <span
          className="
            whitespace-nowrap

            text-[0.7rem]
            sm:text-[0.75rem]
            lg:text-[0.875rem]
          "
        >
          {formatTime(songDuration)}
        </span>
      </div>
    </button>
  );
};

export default SongsList;
