import { GoPlay } from "react-icons/go";
import { useContext, useState } from "react";
import MusicContext from "../context/MusicContext";
import he from "he";

const SongsList = ({
  name,
  artists,
  duration,
  downloadUrl,
  image,
  id,
  song,
  songs = [], // Complete list of songs
}) => {
  const [hovering, setHovering] = useState(false);

  const { playMusic } = useContext(MusicContext);

  const convertTime = (seconds) => {
    const value = Number(seconds);

    if (!Number.isFinite(value) || value < 0) {
      return "0:00";
    }

    const minutes = Math.floor(value / 60);
    const remainingSeconds = Math.floor(value % 60)
      .toString()
      .padStart(2, "0");

    return `${minutes}:${remainingSeconds}`;
  };

  const safeDecode = (value) => {
    try {
      return he.decode(String(value ?? ""));
    } catch {
      return String(value ?? "");
    }
  };

  // Get the best available image URL
  const imageUrl =
    image?.[2]?.url ||
    image?.[1]?.url ||
    image?.[0]?.url ||
    image?.url ||
    image ||
    "";

  // Get primary artists
  const artistNames =
    Array.isArray(artists?.primary) && artists.primary.length > 0
      ? artists.primary
          .map((artist) => artist?.name)
          .filter(Boolean)
          .join(", ")
      : "Unknown Artist";

  /*
   * Get the current song's audio URL.
   *
   * API usually returns:
   * downloadUrl: [
   *   { quality: "...", url: "..." },
   *   ...
   * ]
   */
  const currentDownloadUrl =
    downloadUrl?.[4]?.url ||
    downloadUrl?.[3]?.url ||
    downloadUrl?.[2]?.url ||
    downloadUrl?.[1]?.url ||
    downloadUrl?.[0]?.url ||
    downloadUrl?.url ||
    downloadUrl ||
    song?.downloadUrl?.[4]?.url ||
    song?.downloadUrl?.[3]?.url ||
    song?.downloadUrl?.[2]?.url ||
    song?.downloadUrl?.[1]?.url ||
    song?.downloadUrl?.[0]?.url ||
    song?.downloadUrl?.url ||
    song?.audio ||
    "";

  /*
   * IMPORTANT:
   *
   * `songs` must contain the COMPLETE list.
   *
   * Album:
   *   album songs -> songs
   *
   * Artist:
   *   artist songs -> songs
   *
   * Playlist:
   *   playlist songs -> songs
   *
   * Favourite:
   *   favourite songs -> songs
   *
   * MusicContext can then create:
   *
   * current song -> next song -> next song...
   * current song -> previous song...
   *
   * If no list is supplied, MusicContext can intentionally
   * create a one-song queue.
   */
  const songList = Array.isArray(songs) ? songs : [];

  const handlePlay = () => {
    playMusic(
      currentDownloadUrl,
      safeDecode(name),
      duration,
      imageUrl,
      id,
      artists,
      song,
      songList
    );
  };

  return (
    <div
      onClick={handlePlay}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className="overflow-clip h-[3.5rem] w-full song-item flex justify-between items-center p-2 song-info cursor-pointer"
    >
      {/* Image + Play Icon */}
      <div className="relative flex-shrink-0">
        <img
          src={imageUrl}
          alt={safeDecode(name)}
          className="w-[5rem] h-[3rem] object-cover transition-all duration-700"
        />

        {hovering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <GoPlay className="w-[2.35rem] h-[2.35rem] opacity-80 icon" />
          </div>
        )}
      </div>

      {/* Song Name */}
      <div className="flex w-full min-w-0 pl-5">
        <h3 className="overflow-hidden text-ellipsis whitespace-nowrap text-[0.75rem] lg:text-[0.875rem] h-[1.3rem] font-medium">
          {safeDecode(name)}
        </h3>
      </div>

      {/* Artists */}
      <div className="flex w-full min-w-0">
        <p className="text-[0.60rem] lg:text-[0.75rem] h-[1rem] mr-3 overflow-hidden text-ellipsis whitespace-nowrap lg:w-auto">
          {safeDecode(artistNames)}
        </p>
      </div>

      {/* Duration */}
      <div className="song-duration mr-2 flex-shrink-0">
        <span className="text-[0.60rem] lg:text-[0.75rem]">
          {convertTime(duration)}
        </span>
      </div>
    </div>
  );
};

export default SongsList;
