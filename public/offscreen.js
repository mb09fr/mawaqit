// Listen for messages from the background script
let currentAudio = null;

chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'PLAY_AUDIO') {
        playAudio(msg.url, msg.volume);
    } else if (msg.type === 'STOP_AUDIO') {
        stopAudio();
    } else if (msg.type === 'GET_STATUS') {
        sendResponse({ playing: !!currentAudio && !currentAudio.paused });
    }
    return true; // Keep channel open for sendResponse
});

function playAudio(url, volume) {
    stopAudio(); // Stop any currently playing audio
    currentAudio = new Audio(url);
    currentAudio.volume = volume || 1.0;
    currentAudio.onended = () => {
        currentAudio = null;
    };
    currentAudio.play().catch(error => {
        console.error('Error playing audio:', error);
    });
}

function stopAudio() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
}
