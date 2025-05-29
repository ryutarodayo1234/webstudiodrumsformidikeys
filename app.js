// --- Global Variables ---
let audioContext;
let masterGainNode;
const loadedSounds = {}; // Stores AudioBuffers, keyed by soundFile path
const activeSources = {}; // Stores currently playing AudioBufferSourceNodes for choking
const loadingSpinner = document.getElementById('loading-spinner');
let midiAccessInstance = null; // Store the MIDI Access object

// --- Drum Instrument Mapping ---
// This drumMap is now configured based on your screenshot
// Each instrument has `velocityLayers` sorted by `maxVelocity`.
const drumMap = {
    48: { name: 'Kick', keyBinding: 'C2', group: 'kick', indicatorStyleClass: 'key-style-kick',
        velocityLayers: [
            { maxVelocity: 80, soundFile: 'sounds/kick_80.mp3' },
            { maxVelocity: 120, soundFile: 'sounds/kick_120.mp3' }
        ]
    },
    49: { name: 'Snare Closed Rim', keyBinding: 'C#2', group: 'snare', indicatorStyleClass: 'key-style-snare',
        velocityLayers: [
            { maxVelocity: 50, soundFile: 'sounds/snareClosedRim_50.mp3' },
            { maxVelocity: 120, soundFile: 'sounds/snareClosedRim_120.mp3' }
        ]
    },
    50: { name: 'Snare', keyBinding: 'D2', group: 'snare', indicatorStyleClass: 'key-style-snare',
        velocityLayers: [
            { maxVelocity: 50, soundFile: 'sounds/snare_50.mp3' },
            { maxVelocity: 90, soundFile: 'sounds/snare_90.mp3' },
            { maxVelocity: 120, soundFile: 'sounds/snare_120.mp3' }
        ]
    },
    51: { name: 'Snare Double Stroke', keyBinding: 'D#2', group: 'snare', indicatorStyleClass: 'key-style-snare',
        velocityLayers: [
            { maxVelocity: 50, soundFile: 'sounds/snareDoubleStroke_50.mp3' },
            { maxVelocity: 90, soundFile: 'sounds/snareDoubleStroke_90.mp3' },
            { maxVelocity: 120, soundFile: 'sounds/snareDoubleStroke_120.mp3' }
        ]
    },
    52: { name: 'Snare Rim', keyBinding: 'E2', group: 'snare', indicatorStyleClass: 'key-style-snare',
        velocityLayers: [
            { maxVelocity: 90, soundFile: 'sounds/snareRim_90.mp3' },
            { maxVelocity: 120, soundFile: 'sounds/snareRim_120.mp3' }
        ]
    },
    53: { name: 'Tom Low 2', keyBinding: 'F2', group: 'tomLow2', indicatorStyleClass: 'key-style-tom',
        velocityLayers: [
            { maxVelocity: 50, soundFile: 'sounds/tomLow2_50.mp3' },
            { maxVelocity: 90, soundFile: 'sounds/tomLow2_90.mp3' },
            { maxVelocity: 120, soundFile: 'sounds/tomLow2_120.mp3' }
        ]
    },
    54: { name: 'Closed HH', keyBinding: 'F#2', group: 'hh', indicatorStyleClass: 'key-style-hh',
        velocityLayers: [
            { maxVelocity: 50, soundFile: 'sounds/closedHH_50.mp3' },
            { maxVelocity: 90, soundFile: 'sounds/closedHH_90.mp3' },
            { maxVelocity: 120, soundFile: 'sounds/closedHH_120.mp3' }
        ]
    },
    55: { name: 'Tom Low 1', keyBinding: 'G2', group: 'tomLow1', indicatorStyleClass: 'key-style-tom',
        velocityLayers: [
            { maxVelocity: 50, soundFile: 'sounds/tomLow1_50.mp3' },
            { maxVelocity: 90, soundFile: 'sounds/tomLow1_90.mp3' },
            { maxVelocity: 120, soundFile: 'sounds/tomLow1_120.mp3' }
        ]
    },
    56: { name: 'Closed HH', keyBinding: 'G#2', group: 'hh', indicatorStyleClass: 'key-style-hh', // Shares samples with F#2
        velocityLayers: [
            { maxVelocity: 50, soundFile: 'sounds/closedHH_50.mp3' },
            { maxVelocity: 90, soundFile: 'sounds/closedHH_90.mp3' },
            { maxVelocity: 120, soundFile: 'sounds/closedHH_120.mp3' }
        ]
    },
    57: { name: 'Tom Low 1', keyBinding: 'A2', group: 'tomLow1', indicatorStyleClass: 'key-style-tom', // Shares samples with G2
        velocityLayers: [
            { maxVelocity: 50, soundFile: 'sounds/tomLow1_50.mp3' },
            { maxVelocity: 90, soundFile: 'sounds/tomLow1_90.mp3' },
            { maxVelocity: 120, soundFile: 'sounds/tomLow1_120.mp3' }
        ]
    },
    58: { name: 'Open HH', keyBinding: 'A#2', group: 'hh', indicatorStyleClass: 'key-style-hh',
        velocityLayers: [
            { maxVelocity: 50, soundFile: 'sounds/openHH_50.mp3' },
            { maxVelocity: 90, soundFile: 'sounds/openHH_90.mp3' },
            { maxVelocity: 120, soundFile: 'sounds/openHH_120.mp3' }
        ]
    },
    59: { name: 'Tom Mid', keyBinding: 'B2', group: 'tomMid', indicatorStyleClass: 'key-style-tom',
        velocityLayers: [
            { maxVelocity: 50, soundFile: 'sounds/tomMid_50.mp3' },
            { maxVelocity: 90, soundFile: 'sounds/tomMid_90.mp3' },
            { maxVelocity: 120, soundFile: 'sounds/tomMid_120.mp3' }
        ]
    },
    60: { name: 'Tom Mid', keyBinding: 'C3', group: 'tomMid', indicatorStyleClass: 'key-style-tom', // Shares samples with B2
        velocityLayers: [
            { maxVelocity: 50, soundFile: 'sounds/tomMid_50.mp3' },
            { maxVelocity: 90, soundFile: 'sounds/tomMid_90.mp3' },
            { maxVelocity: 120, soundFile: 'sounds/tomMid_120.mp3' }
        ]
    },
    61: { name: 'Clash Cymbal', keyBinding: 'C#3', group: 'clash', indicatorStyleClass: 'key-style-cymbal',
        velocityLayers: [
            { maxVelocity: 50, soundFile: 'sounds/clashCymbal_50.mp3' },
            { maxVelocity: 90, soundFile: 'sounds/clashCymbal_90.mp3' },
            { maxVelocity: 120, soundFile: 'sounds/clashCymbal_120.mp3' }
        ]
    },
    62: { name: 'Tom High', keyBinding: 'D3', group: 'tomHigh', indicatorStyleClass: 'key-style-tom',
        velocityLayers: [
            { maxVelocity: 50, soundFile: 'sounds/tomHigh_50.mp3' },
            { maxVelocity: 90, soundFile: 'sounds/tomHigh_90.mp3' },
            { maxVelocity: 120, soundFile: 'sounds/tomHigh_120.mp3' }
        ]
    },
    63: { name: 'Ride Bow', keyBinding: 'D#3', group: 'ride', indicatorStyleClass: 'key-style-cymbal',
        velocityLayers: [
            { maxVelocity: 50, soundFile: 'sounds/rideBow_50.mp3' },
            { maxVelocity: 90, soundFile: 'sounds/rideBow_90.mp3' },
            { maxVelocity: 120, soundFile: 'sounds/rideBow_120.mp3' }
        ]
    },
    64: { name: 'Ride Edge', keyBinding: 'E3', group: 'ride', indicatorStyleClass: 'key-style-cymbal',
        velocityLayers: [
            { maxVelocity: 50, soundFile: 'sounds/rideEdge_50.mp3' },
            { maxVelocity: 90, soundFile: 'sounds/rideEdge_90.mp3' },
            { maxVelocity: 120, soundFile: 'sounds/rideEdge_120.mp3' }
        ]
    },
    65: { name: 'Ride Bell', keyBinding: 'F3', group: 'ride', indicatorStyleClass: 'key-style-cymbal',
        velocityLayers: [
            { maxVelocity: 50, soundFile: 'sounds/rideBell_50.mp3' },
            { maxVelocity: 90, soundFile: 'sounds/rideBell_90.mp3' },
            { maxVelocity: 120, soundFile: 'sounds/rideBell_120.mp3' }
        ]
    },
    66: { name: 'Splash Cymbal', keyBinding: 'F#3', group: 'splash', indicatorStyleClass: 'key-style-cymbal',
        velocityLayers: [
            { maxVelocity: 50, soundFile: 'sounds/cymbalSplash_50.mp3' },
            { maxVelocity: 90, soundFile: 'sounds/cymbalSplash_90.mp3' },
            { maxVelocity: 120, soundFile: 'sounds/cymbalSplash_120.mp3' }
        ]
    }
};

const mappedMIDINotes = Object.keys(drumMap).map(Number);

// --- Audio Initialization and Loading ---
function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        masterGainNode = audioContext.createGain();
        const masterVolumeSlider = document.querySelector('input[type="range"][oninput^="setMasterVolume"]'); //
        masterGainNode.gain.value = masterVolumeSlider ? parseFloat(masterVolumeSlider.value) : 0.3;
        masterGainNode.connect(audioContext.destination);
        console.log("AudioContext initialized.");
    }
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().then(() => console.log("AudioContext resumed by init."));
    }
}

async function fetchAndDecodeAudio(soundFilePath) {
    try {
        const response = await fetch(soundFilePath);
        if (!response.ok) {
            throw new Error(`Sound file not found or error loading: ${soundFilePath} - Status: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        loadedSounds[soundFilePath] = audioBuffer;
    } catch (error) {
        console.error(`Error loading sound ${soundFilePath}:`, error);
        throw error; 
    }
}

async function loadInstrument() {
    initAudioContext();
    if (loadingSpinner) loadingSpinner.style.display = 'flex';

    const soundFilesToLoad = new Set();
    Object.values(drumMap).forEach(instrument => {
        if (instrument.velocityLayers) {
            instrument.velocityLayers.forEach(layer => {
                soundFilesToLoad.add(layer.soundFile);
            });
        }
    });

    const soundPromises = [];
    soundFilesToLoad.forEach(filePath => {
        if (!loadedSounds[filePath]) { // Only load if not already loaded
            soundPromises.push(fetchAndDecodeAudio(filePath));
        }
    });

    try {
        await Promise.all(soundPromises);
        const allRequestedFiles = Array.from(soundFilesToLoad);
        const successfullyLoadedCount = allRequestedFiles.filter(file => loadedSounds[file]).length;
        console.log(`${successfullyLoadedCount} of ${allRequestedFiles.length} unique sound files processed.`);
        
        if (successfullyLoadedCount < allRequestedFiles.length) {
            const missingFiles = allRequestedFiles.filter(file => !loadedSounds[file]);
            console.warn("Some sound files may have failed to load or were already missing:", missingFiles);
            if (missingFiles.length > 0) {
                alert(`Warning: ${missingFiles.length} sound file(s) failed to load. Check console for details. Missing examples: ${missingFiles.slice(0,3).join(', ')}`);
            }
        } else if (soundPromises.length > 0) { // Only log "all loaded" if new sounds were attempted
             console.log("All newly requested sounds loaded successfully!");
        } else {
            console.log("No new sounds to load; all previously requested sounds are present.");
        }

        dimUnusedPianoKeys();
        applyKeyColorIndicators();
        if (navigator.requestMIDIAccess) {
            setupMIDIAccess(false);
        } else {
            console.warn("Web MIDI API not supported in this browser.");
            alert("Web MIDI API is not supported in your browser.");
        }
    } catch (error) {
        console.error("An error occurred during the sound loading process:", error);
        alert("An error occurred while loading sounds. Check the console for details.");
    } finally {
        if (loadingSpinner) loadingSpinner.style.display = 'none';
    }
}

// --- UI Styling for Piano Keys ---
function dimUnusedPianoKeys() {
    const pianoKeys = document.querySelectorAll('#pianoroll .roll-key'); //
    pianoKeys.forEach(key => {
        const note = parseInt(key.dataset.note);
        if (!mappedMIDINotes.includes(note)) {
            key.classList.add('dimmed');
        } else {
            key.classList.remove('dimmed');
        }
    });
}

function applyKeyColorIndicators() {
    const pianoKeys = document.querySelectorAll('#pianoroll .roll-key'); //
    pianoKeys.forEach(key => {
        const note = parseInt(key.dataset.note);
        const instrument = drumMap[note];

        Object.values(drumMap).forEach(instr => { 
            if (instr.indicatorStyleClass) key.classList.remove(instr.indicatorStyleClass);
        });

        if (instrument && instrument.indicatorStyleClass) {
            if (!key.classList.contains('dimmed')) {
                 key.classList.add(instrument.indicatorStyleClass);
            }
        }
    });
}

// --- MIDI Handling ---
function setupMIDIAccess(isInitialLoad = false) {
    if (!navigator.requestMIDIAccess) {
        if (!isInitialLoad) alert("Web MIDI API is not supported in this browser.");
        console.warn("Web MIDI API not supported in this browser.");
        return;
    }
    navigator.requestMIDIAccess()
        .then((midi) => {
            midiAccessInstance = midi;
            console.log("MIDI Access Granted!");
            bindMIDIEvents(isInitialLoad);
            midiAccessInstance.onstatechange = (event) => {
                console.log(`MIDI device state changed: ${event.port.name}, type: ${event.port.type}, state: ${event.port.state}`);
                bindMIDIEvents(true);
                dimUnusedPianoKeys();
                applyKeyColorIndicators();
            };
        })
        .catch((error) => {
            console.error("Could not access MIDI devices:", error);
            if (!isInitialLoad) alert("Could not access MIDI devices. Grant permission or check other apps.");
        });
}

function bindMIDIEvents(isInitialLoad = false) {
    if (!midiAccessInstance) return;
    const inputs = midiAccessInstance.inputs.values();
    let deviceFound = false;
    for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
        deviceFound = true;
        input.value.onmidimessage = null;
        input.value.onmidimessage = onMIDIMessage;
        console.log(`Listening to MIDI input: ${input.value.name} (Manufacturer: ${input.value.manufacturer || 'N/A'})`);
    }
    if (!deviceFound && !isInitialLoad) {
        console.warn("No MIDI input devices found after explicit check.");
        alert("No MIDI input devices found. Connect a device; it might be detected automatically or try reloading instruments.");
    } else if (!deviceFound) {
        console.warn("No MIDI input devices found on initial check.");
    }
}

function onMIDIMessage(event) {
    if (!audioContext) {
        console.warn("AudioContext not ready for MIDI message.");
        return;
    }
    // Check if any sounds are loaded, more robustly by checking the loadedSounds object.
    let soundsAvailable = false;
    if (drumMap[event.data[1]] && drumMap[event.data[1]].velocityLayers) {
        soundsAvailable = drumMap[event.data[1]].velocityLayers.some(layer => loadedSounds[layer.soundFile]);
    }
    if (!soundsAvailable && Object.keys(loadedSounds).length === 0) { // Fallback check
        // console.log("Sounds not loaded yet for MIDI message.");
        return;
    }

    if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => console.log("AudioContext resumed by MIDI event."));
    }

    const command = event.data[0] >> 4;
    const note = event.data[1];
    const velocity = event.data[2];

    if (command === 9 && velocity > 0) { // Note On
        window.playNote(note, velocity);
    } else if (command === 8 || (command === 9 && velocity === 0)) { // Note Off
         window.stopNote(note);
    }
}

// --- Sound Playback ---
window.playNote = function(midiNote, velocity) {
    if (!audioContext || !masterGainNode) {
        console.warn("AudioContext/MasterGain not ready. Cannot play note.");
        return;
    }
    if (audioContext.state === 'suspended') {
        console.warn("AudioContext is suspended. Attempting to resume for playback.");
        audioContext.resume(); // Try to resume, playback might be delayed or fail if not user-initiated context
    }

    const instrument = drumMap[midiNote];
    if (instrument && instrument.velocityLayers && instrument.velocityLayers.length > 0) {
        let selectedLayer = null;
        // Find the correct layer (velocityLayers MUST be sorted by maxVelocity ASC)
        for (const layer of instrument.velocityLayers) {
            if (velocity <= layer.maxVelocity) {
                selectedLayer = layer;
                break;
            }
        }
        if (!selectedLayer) { // Should not happen if last layer has maxVelocity: 120
            selectedLayer = instrument.velocityLayers[instrument.velocityLayers.length - 1];
        }

        const soundToPlayPath = selectedLayer.soundFile;
        const audioBufferForVelocity = loadedSounds[soundToPlayPath];

        if (audioBufferForVelocity) {
            if (activeSources[instrument.group]) {
                try {
                    activeSources[instrument.group].stop();
                    activeSources[instrument.group].disconnect();
                } catch (e) { /* ignore if already stopped */ }
            }

            const source = audioContext.createBufferSource();
            source.buffer = audioBufferForVelocity;

            const gainNode = audioContext.createGain();
            // gainNode.gain.value = Math.sqrt(velocity / 127); // より自然な音量変化
            gainNode.gain.value = Math.sqrt(velocity / 127) * 5; // ゲインをさらに上げる（最大値は1.5倍）

            source.connect(gainNode);
            gainNode.connect(masterGainNode);
            source.start(0);
            activeSources[instrument.group] = source;
        } else {
            console.warn(`Sound buffer not found for: ${soundToPlayPath} (MIDI: ${midiNote}, vel: ${velocity}). Ensure it loaded correctly.`);
        }
    } else if (instrument) {
        console.warn(`No velocity layers defined or found for instrument: ${instrument.name} (MIDI: ${midiNote})`);
    }
};

window.stopNote = function(midiNote) {
    // For pianoroll.js to unhighlight its key
};

// --- Master Volume Control ---
function setMasterVolume(value) { //
    if (masterGainNode) {
        masterGainNode.gain.value = parseFloat(value);
    } else if (audioContext) {
        console.warn("Master gain node not ready, but volume changed.");
    }
}

// --- Event Listeners & Initial Setup ---
document.addEventListener('DOMContentLoaded', () => {
    setupMIDIAccess(true);
    dimUnusedPianoKeys();
    applyKeyColorIndicators();
});

window.loadInstrument = loadInstrument;
window.setMasterVolume = setMasterVolume;