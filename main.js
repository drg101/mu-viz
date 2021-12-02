import './style.css'

const music = new Audio('sound.wav');
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioCtx.createAnalyser();
setTimeout(() => {
    music.play();
    const stream = music.captureStream()
    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);
    analyser.connect(audioCtx.destination)
}, 1000)

