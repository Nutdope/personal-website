/* ---------------------------------------------------- */
/* Audio Playlist & Skip Engine                         */
/* ---------------------------------------------------- */

// List your tracks in assets/audio/ here
const PLAYLIST = [
  "assets/audio/song.mp3",
  "assets/audio/song2.mp3",
  "assets/audio/song3.mp3"
];

let currentTrackIndex = 0;
let isPlaying = false;

document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("bg-audio");
  const audioToggle = document.getElementById("audio-toggle");
  const audioSkip = document.getElementById("audio-skip");
  const audioIcon = document.getElementById("audio-icon");
  const gate = document.getElementById("gate");

  if (!audio) return;

  // Initialize first song
  audio.src = PLAYLIST[currentTrackIndex];
  audio.volume = 0.4; // Default comfortable volume (40%)

  function updateUiState() {
    if (isPlaying) {
      audioToggle.classList.add("playing");
      audioIcon.className = "fa-solid fa-volume-high";
    } else {
      audioToggle.classList.remove("playing");
      audioIcon.className = "fa-solid fa-volume-xmark";
    }
  }

  async function playCurrentTrack() {
    try {
      await audio.play();
      isPlaying = true;
      updateUiState();
    } catch (err) {
      console.warn("Autoplay was prevented by browser policy:", err);
      isPlaying = false;
      updateUiState();
    }
  }

  function pauseTrack() {
    audio.pause();
    isPlaying = false;
    updateUiState();
  }

  function playNextTrack() {
    currentTrackIndex = (currentTrackIndex + 1) % PLAYLIST.length;
    audio.src = PLAYLIST[currentTrackIndex];
    audio.currentTime = 0;
    playCurrentTrack();
  }

  // 1. Play/Pause toggle
  if (audioToggle) {
    audioToggle.addEventListener("click", () => {
      if (isPlaying) {
        pauseTrack();
      } else {
        playCurrentTrack();
      }
    });
  }

  // 2. Skip track button
  if (audioSkip) {
    audioSkip.addEventListener("click", () => {
      // Little visual button bounce feedback
      audioSkip.style.transform = "scale(0.9)";
      setTimeout(() => (audioSkip.style.transform = ""), 150);

      playNextTrack();
    });
  }

  // 3. Automatically advance to next track when one finishes
  audio.addEventListener("ended", () => {
    playNextTrack();
  });

  // 4. Start audio upon entering through the entry gate
  if (gate) {
    gate.addEventListener("click", () => {
      playCurrentTrack();
    }, { once: true });
  }
});