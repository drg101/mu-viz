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

const getBaseLog = (x, y) => {
    return Math.log(y) / Math.log(x);
}


const scaleLen = 4096;
const maxFreq = 48000 / 2;

const playMusic = (uri) => {
    const music = new Audio(uri);

    let bufferLength = scaleLen;
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
        analyser.fftSize = scaleLen * 2;
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        const c = document.getElementById("canv");
        const ctx = c.getContext("2d");
        ctx.canvas.width = window.innerWidth;
        ctx.canvas.height = window.innerHeight;
        let WIDTH = ctx.canvas.width;
        let HEIGHT = ctx.canvas.height;
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
            let beatHeight = 0
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
                barHeight = avg / 256 * HEIGHT;

                ctx.fillStyle = 'rgb(' + (barHeight / HEIGHT * 255) + ',50,50)';
                ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);

                if(i >= 3 && i <= 5) {
                    beatHeight += barHeight;
                }

                x += barWidth;
            }
            beatHeight /= 3
            ctx.fillStyle = `rgb(50,${(beatHeight / HEIGHT * 255)},${(beatHeight / HEIGHT * 255)})`;
            ctx.fillRect(WIDTH/2, HEIGHT/2, beatHeight / 4, beatHeight / 4);
            // console.log(buckets)



            requestAnimationFrame(draw)
        }
        requestAnimationFrame(draw)
    });

}

setListeners()