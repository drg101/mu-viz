import './style.css'

const music = new Audio('sound.wav');

music.addEventListener("canplay", event => {
    console.log("here")
    document.getElementById("play").onclick = () => {
        music.play()
        const stream = music.captureStream()
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(stream);
        console.log(source)
        source.connect(analyser);
        analyser.connect(audioCtx.destination)
        analyser.fftSize = 2048;
        var bufferLength = analyser.frequencyBinCount;
        console.log(stream.getTracks())
        setInterval(() => {
            const dataArray = new Uint8Array(bufferLength);
            analyser.getByteTimeDomainData(dataArray);
            
        }, 100)
    }
    
});


