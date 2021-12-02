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
        analyser.fftSize = 256;
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        console.log(stream.getTracks())

        const c = document.getElementById("myCanvas");
        const ctx = c.getContext("2d");
        const WIDTH = ctx.canvas.width;
        const HEIGHT = ctx.canvas.height;

        const draw = () => {
            analyser.getByteFrequencyData(dataArray);
            ctx.clearRect(0, 0, WIDTH, HEIGHT);
            var barWidth = (WIDTH / bufferLength) * 2.5;
            var barHeight;
            var x = 0;
            // console.log({bufferLength})
            for (var i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2;

                ctx.fillStyle = 'rgb(' + (barHeight + 100) + ',50,50)';
                ctx.fillRect(x, HEIGHT - barHeight / 2, barWidth, barHeight);

                x += barWidth + 1;
            }

            
            requestAnimationFrame(draw)
        }
        requestAnimationFrame(draw)
    }

});




