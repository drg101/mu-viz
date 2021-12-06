import './style.css'

const inputElement = document.getElementById("music-upload");
const canv = document.getElementById("canv")
const app = document.getElementById("app")

const ctx = canv.getContext("2d");
ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight;
let WIDTH = ctx.canvas.width;
let HEIGHT = ctx.canvas.height;
const music = new Audio();
let musicPlaying = false;

setInterval(() => {
    WIDTH = ctx.canvas.width;
    HEIGHT = ctx.canvas.height;
}, 100)

ctx.font = "48px Arial";
ctx.fillStyle = "white";
ctx.textAlign = "center";
ctx.fillText("Select a song with \"Choose File\" or drag and drop.", WIDTH/2, HEIGHT/2 - 35);
ctx.fillText("⚠️Flashing Colors & Lights⚠️", WIDTH/2, HEIGHT/2 + 35);

const setListeners = () => {
    inputElement.addEventListener("change", onMusicUpload, false);
}

const onMusicUpload = () => {
    console.log('here')
    canv.style.display = "block";
    const selectedFile = inputElement.files[0];
    const uri = URL.createObjectURL(selectedFile);
    music.pause();
    music.src = uri;
    music.load();
    musicPlaying || playMusic()
}

const getBaseLog = (x, y) => {
    return Math.log(y) / Math.log(x);
}

function argMax(array) {
    return array.map((x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];
}


const scaleLen = 4096;
const maxFreq = 48000 / 2;

const playMusic = () => {
    musicPlaying = true;
    let bufferLength = scaleLen;
    let dataArray = new Uint8Array(bufferLength);

    music.addEventListener("canplay", event => {
        music.play()
        music.loop = true
        // const stream = music.mozCaptureStream ? music.mozCaptureStream() : music.captureStream()
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaElementSource(music);
        source.disconnect()
        source.connect(analyser);
        analyser.connect(audioCtx.destination)
        analyser.fftSize = scaleLen * 2;
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        let scaleBarriers = [6.875, 13.75, 27.5, 55, 110, 220, 440, 880, 1760, 3520, 7040, 14080]

        const draw = () => {
            const numBuckets = getBaseLog(2, scaleLen);
            analyser.getByteFrequencyData(dataArray);
            ctx.clearRect(0, 0, WIDTH, HEIGHT);
            const barWidth = (WIDTH / numBuckets);
            let x = 0;
            let barHeight;
            // console.log(bufferLength)
            let buckets = []
            let oldBucketMax = 0;
            console.log('loop')
            for (let i = 0; i < scaleBarriers.length; i++) {
                let bucketMax = Math.floor(scaleBarriers[i] / maxFreq * scaleLen);
                // console.log(`bucket start ${oldBucketMax} (${oldBucketMax * maxFreq / scaleLen}hz) bucket end ${bucketMax} (${bucketMax * maxFreq / scaleLen}hz)`)
                let sum = 0;
                for (let j = oldBucketMax; j < bucketMax; j++) {
                    sum += dataArray[j];
                }
                let avg = sum / (bucketMax - oldBucketMax);
                buckets.push(avg)
                oldBucketMax = bucketMax;
            }
            const beatIndex = 4
            const beatHeight = buckets[beatIndex]
            const beatScale = 1 - (1 / scaleBarriers.length * beatIndex)
            const beatLambda = 1.5;
            const beatValue = beatScale * beatHeight / beatLambda;

            canv.style.transform = `scale(${1 + beatValue / 255 * 0.1})`

            ctx.fillStyle = `rgb(${beatValue},${beatValue},${beatValue})`;
            app.style.backgroundColor = `rgb(${beatValue},${beatValue},${beatValue})`;
            canv.style.borderColor = `rgb(${255 - beatValue},${255 - beatValue},${255 - beatValue})`;
            ctx.fillRect(0, 0, WIDTH, HEIGHT);
            for (const avg of buckets) {
                const barHeight = avg / 256 * HEIGHT;
                ctx.fillStyle = 'hsl(' + (barHeight / HEIGHT * 360) + ' 100% 60%)';
                ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);
                x += barWidth;
            }

            requestAnimationFrame(draw)
        }
        requestAnimationFrame(draw)
    });

}

setListeners()