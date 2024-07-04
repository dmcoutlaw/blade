document.addEventListener("DOMContentLoaded", function () {
    const musicFolder = "music/";
    const musicFiles = ["song1.mp3", "song2.mp3", "song3.mp3"]; // Replace with your actual file names
    const backgroundMusic = document.getElementById("backgroundMusic");
    const muteButton = document.getElementById("muteButton");

    // Choose a random music file
    const randomMusicFile = musicFiles[Math.floor(Math.random() * musicFiles.length)];
    backgroundMusic.src = musicFolder + randomMusicFile;

    // Mute/Unmute functionality
    muteButton.addEventListener("click", function () {
        if (backgroundMusic.muted) {
            backgroundMusic.muted = false;
            muteButton.textContent = "Mute";
        } else {
            backgroundMusic.muted = true;
            muteButton.textContent = "Unmute";
        }
    });
});
