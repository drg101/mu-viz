import './style.css'

const music = new Audio('sound.wav');

let bufferLength = 1024;
let dataArray = new Uint8Array(bufferLength);

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
        bufferLength = analyser.frequencyBinCount;
        console.log(stream.getTracks())
        setInterval(() => {
            dataArray = new Uint8Array(bufferLength);
            analyser.getByteTimeDomainData(dataArray);

        }, 100)
    }

});

const c = document.getElementById("myCanvas");
const ctx = c.getContext("2d");
const WIDTH = ctx.canvas.width;
const HEIGHT = ctx.canvas.height;

const draw = () => {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgb(0, 0, 0)';
    ctx.beginPath();
    var sliceWidth = WIDTH * 1.0 / bufferLength;
    var x = 0;
    for (var i = 0; i < bufferLength; i++) {

        var v = dataArray[i] / 128.0;
        var y = v * HEIGHT / 2;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }

        x += sliceWidth;
    }
    ctx.lineTo(WIDTH, HEIGHT/2);
    ctx.stroke();

    requestAnimationFrame(draw)
}
requestAnimationFrame(draw)


