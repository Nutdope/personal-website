// Optional: choose exactly what "Now playing" shows for a song.
//
// Without this, the player reads the title/artist tags stored inside the MP3 and,
// if there are none, falls back to the file name ("Artist - Title.mp3").
//
// Key = the file name, with or without the extension, in any capitalization.
// You can set just one of the two fields.
export const TRACK_INFO = {
  // "night-drive.mp3": { title: "Night Drive", artist: "Some Artist" },
  // "song2": { artist: "Another Artist" },
};
