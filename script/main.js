// === GLOBAL SETUP ===
let started = false;
let pitch = 1;
let reverbWet = 0.5;
let currentPlayer = null;
const keysPressed = new Set();
let students = [];
let currentStudentIndex = 0;
let mediaRecorder;
let chunks = [];
let timer;
let pitchInterval = null;
let reverbInterval = null;

// Tone.js Setup
const masterGain = new Tone.Gain().toDestination();
const streamDest = Tone.context.createMediaStreamDestination();
masterGain.connect(streamDest);
const reverb = new Tone.Reverb({ decay: 3, wet: reverbWet }).connect(
  masterGain
);
const analyser = new Tone.Analyser("fft", 64);
reverb.connect(analyser);
const bgLoop = new Tone.Player("sound/backGround.wav").connect(masterGain);
bgLoop.loop = true;

const players = {
  a: new Tone.Player("sound/soundOne.wav").connect(reverb),
  s: new Tone.Player("sound/soundTwo.wav").connect(reverb),
  d: new Tone.Player("sound/soundThree.wav").connect(reverb),
  f: new Tone.Player("sound/soundFour.wav").connect(reverb),
  g: new Tone.Player("sound/soundFive.wav").connect(reverb),
  h: new Tone.Player("sound/soundSix.wav").connect(reverb),
  j: new Tone.Player("sound/soundSeven.wav").connect(reverb),
  k: new Tone.Player("sound/soundEight.wav").connect(reverb),
};

// === DOM REFERENCES ===
const nameEntry = document.getElementById("nameEntry");
const soundControls = document.getElementById("soundControls");
const message = document.getElementById("message");
const messageText = message.querySelector("p");
const playback = document.getElementById("playback");
const currentNameDisplay = document.getElementById("currentStudentName");
const submitNameBtn = document.getElementById("submitName");
const nextStudentBtn = document.getElementById("nextStudentButton");
const timeDisplay = document.getElementById("timer");
const visualizerContainer = document.getElementById("visualizer-container");
const pitchValue = document.getElementById("pitchValue");
const reverbValue = document.getElementById("reverbValue");
const pitchFill = document.getElementById("pitchFill");
const reverbFill = document.getElementById("reverbFill");

// === AUDIO RECORDING ===
mediaRecorder = new MediaRecorder(streamDest.stream);
mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

mediaRecorder.onstop = () => {
  const blob = new Blob(chunks, { type: "audio/webm" });
  students[currentStudentIndex - 1].recording = blob;
  chunks = [];
  if (students.length >= 2) showPlayback();
};

// === LOGIC ===
submitNameBtn.addEventListener("click", async () => {
  const nameInput = document.getElementById("studentName");
  const name = nameInput.value.trim();
  if (!name) return;

  nameInput.value = "";
  students.push({ name });
  currentStudentIndex = students.length;

  nameEntry.style.display = "none";
  soundControls.style.display = "block";
  visualizerContainer.style.display = "block";

  if (!started) {
    await Tone.start();
    bgLoop.start();
    started = true;
  }

  mediaRecorder.start();
  startTimer();
});

function startTimer() {
  let timeLeft = 15;
  timeDisplay.style.display = "block";
  timeDisplay.textContent = `Time remaining: ${timeLeft}s`;
  timer = setInterval(() => {
    timeLeft--;
    timeDisplay.textContent = `Time remaining: ${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(timer);
      mediaRecorder.stop();
      soundControls.style.display = "none";
      visualizerContainer.style.display = "none";
      timeDisplay.style.display = "none";
      message.style.display = "block";
      messageText.textContent = `${
        students[currentStudentIndex - 1].name
      } has added their sounds.`;
      nextStudentBtn.style.display = "inline-block";
    }
  }, 1000);
}

nextStudentBtn.addEventListener("click", () => {
  message.style.display = "none";
  nextStudentBtn.style.display = "none";
  if (students.length < 2) {
    nameEntry.style.display = "block";
  }
});

// === KEYPRESS SOUNDS + CONTROLS ===
document.addEventListener("keydown", (e) => {
  if (soundControls.style.display !== "block") return;

  const key = e.key.toLowerCase();
  if (["a", "s", "d", "f", "g", "h", "j", "k"].includes(key)) {
    const sound = new Tone.Player(players[key].buffer).connect(reverb);
    sound.playbackRate = pitch;
    sound.start();
  }

  if (!keysPressed.has(e.key)) {
    keysPressed.add(e.key);
    if (e.key === "ArrowUp") {
      pitchInterval = setInterval(() => {
        pitch = Math.min(pitch + 0.01, 3);
        pitchValue.textContent = pitch.toFixed(2);
      }, 50);
    }
    if (e.key === "ArrowDown") {
      pitchInterval = setInterval(() => {
        pitch = Math.max(pitch - 0.01, 0.5);
        pitchValue.textContent = pitch.toFixed(2);
      }, 50);
    }
    if (e.key === "ArrowRight") {
      reverbInterval = setInterval(() => {
        reverbWet = Math.min(reverbWet + 0.01, 1);
        reverb.wet.value = reverbWet;
        reverbValue.textContent = reverbWet.toFixed(2);
      }, 50);
    }
    if (e.key === "ArrowLeft") {
      reverbInterval = setInterval(() => {
        reverbWet = Math.max(reverbWet - 0.01, 0);
        reverb.wet.value = reverbWet;
        reverbValue.textContent = reverbWet.toFixed(2);
      }, 50);
    }
  }
});

document.addEventListener("keyup", (e) => {
  keysPressed.delete(e.key);
  if (["ArrowUp", "ArrowDown"].includes(e.key)) clearInterval(pitchInterval);
  if (["ArrowRight", "ArrowLeft"].includes(e.key))
    clearInterval(reverbInterval);
});

// === PITCH & REVERB SLIDER CLICKS ===
pitchFill.addEventListener("click", (e) => {
  const percent = e.offsetX / pitchFill.clientWidth;
  pitch = 0.5 + percent * 2;
  pitchValue.textContent = pitch.toFixed(2);
  pitchFill.style.background = `linear-gradient(to right, #4caf50 ${
    percent * 100
  }%, #ccc ${percent * 100}%)`;
});

reverbFill.addEventListener("click", (e) => {
  const percent = e.offsetX / reverbFill.clientWidth;
  reverbWet = percent;
  reverb.wet.value = reverbWet;
  reverbValue.textContent = reverbWet.toFixed(2);
  reverbFill.style.background = `linear-gradient(to right, #4caf50 ${
    percent * 100
  }%, #ccc ${percent * 100}%)`;
});

// === PLAYBACK ===
function showPlayback() {
  bgLoop.stop(); // prevent background music overlap

  playback.style.display = "block";
  soundControls.style.display = "none";
  visualizerContainer.style.display = "none";
  timeDisplay.style.display = "none";
  message.style.display = "none";
  nameEntry.style.display = "none";

  let i = 0;
  const playNext = () => {
    if (i >= students.length) {
      setTimeout(resetApp, 1000);
      return;
    }
    currentNameDisplay.textContent = `Now Playing: ${students[i].name}`;
    const url = URL.createObjectURL(students[i].recording);
    const audio = new Audio(url);
    audio.onended = () => {
      URL.revokeObjectURL(url);
      i++;
      playNext();
    };
    audio.play();
  };
  playNext();
}

function resetApp() {
  playback.style.display = "none";
  students = [];
  currentStudentIndex = 0;
  nameEntry.style.display = "block";
}

// === VISUALIZER ===
const canvas = document.createElement("canvas");
canvas.id = "visualizer";
canvas.width = 800;
canvas.height = 200;
visualizerContainer.appendChild(canvas);
const ctx = canvas.getContext("2d");

function drawVisualizer() {
  requestAnimationFrame(drawVisualizer);
  const values = analyser.getValue();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const barWidth = canvas.width / values.length;
  values.forEach((v, i) => {
    const height = (v + 140) * 1.5;
    ctx.fillStyle = `rgb(${height + 50}, 50, 200)`;
    ctx.fillRect(i * barWidth, canvas.height - height, barWidth - 2, height);
  });
}
drawVisualizer();
