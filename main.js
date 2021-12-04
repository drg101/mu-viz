import './style.css'

const inputElement = document.getElementById("music-upload");
const canv = document.getElementById("canv")

const setListeners = () => {
    inputElement.addEventListener("change", onMusicUpload, false);
}

const onMusicUpload = () => {
    console.log('here')
    inputElement.style.display = "none";
    canv.style.display = "block";
    const selectedFile = inputElement.files[0];
    const uri = URL.createObjectURL(selectedFile);
    playMusic(uri)
}

const playMusic = (uri) => {
    const music = new Audio(uri);

    let bufferLength = 1024;
    let dataArray = new Uint8Array(bufferLength);

    music.addEventListener("canplay", event => {
        music.play()
        music.loop = true
        const stream = music.captureStream()
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(stream);
        console.log(source)
        source.connect(analyser);
        analyser.fftSize = 2048;
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        const c = document.getElementById("canv");
        const ctx = c.getContext("2d");
        ctx.canvas.width = window.innerWidth;
        ctx.canvas.height = window.innerHeight;
        let WIDTH = ctx.canvas.width;
        let HEIGHT = ctx.canvas.height;
        const draw = () => {
            analyser.getByteFrequencyData(dataArray);
            ctx.clearRect(0, 0, WIDTH, HEIGHT);
            var barWidth = (WIDTH / bufferLength);
            var barHeight;
            var x = 0;
            // console.log(dataArray)
            for (var i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 256 * HEIGHT;

                ctx.fillStyle = 'rgb(' + (barHeight / HEIGHT * 255) + ',50,50)';
                ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            }

            analyser.getByteTimeDomainData(dataArray);
            ctx.lineWidth = 5;
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
    });

}

setListeners()