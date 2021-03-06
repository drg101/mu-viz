const inputElement = document.getElementById("music-upload");
const canv = document.getElementById("canv")
const app = document.getElementById("app")
const songlabel = document.getElementById("song-label")
const playpause = document.getElementById("playpause")
const allowFlashing = document.getElementById("allowflash")
const allowbgFlashing = document.getElementById("allowbackflash")

// Detect Safari
const userAgentString = navigator.userAgent;
let chromeAgent = userAgentString.indexOf("Chrome") > -1;
let safariAgent = userAgentString.indexOf("Safari") > -1;

// Discard Safari since it also matches Chrome
if ((chromeAgent) && (safariAgent)) safariAgent = false;
console.log({ safariAgent })


const ctx = canv.getContext("2d");
ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight;
let w = ctx.canvas.width;
let h = ctx.canvas.height;
const music = new Audio();
let musicPlaying = false;
let paused = true;
let allowFlash = true;
let allowbgFlash = true;
const wh = {
    WIDTH: w,
    HEIGHT: h
}

let width = w
let height = h

const ratio = width / 1600;

ctx.font = `${Math.floor(72 * ratio)}px Roboto`;
ctx.fillStyle = "white";
ctx.textAlign = "center";
ctx.fillText(safariAgent ? "Please Switch to Chrome or Firefox." : "Music Visualizer", width / 2, height / 2 - Math.floor(80 * ratio));
ctx.font = `${Math.floor(48 * ratio)}px Roboto`;
ctx.fillText(safariAgent ? "Safari is not supported!" : "Select a song or drag a music file onto this page.", width / 2, height / 2);
ctx.fillText(safariAgent ? "" : "⚠️ Flashing Colors & Lights ⚠️", width / 2, height / 2 + Math.floor(70 * ratio));

const setListeners = () => {
    inputElement.addEventListener("change", onMusicUpload, false);
}

const onMusicUpload = (file) => {
    const selectedFile = file.isTrusted ? inputElement.files[0] : file;
    if (!selectedFile) {
        return;
    }
    console.log(selectedFile)
    songlabel.innerHTML = selectedFile.name.length < 20 ? selectedFile.name : selectedFile.name.slice(0, 17) + "...";
    const uri = URL.createObjectURL(selectedFile);
    music.pause();
    music.src = uri;
    music.load();
    musicPlaying || playMusic()
}

const playPause = () => {
    if (!musicPlaying) {
        console.log("no need to start playing")
        return;
    }
    paused = !paused;
    playpause.innerHTML = paused ? '▶️' : '⏸'
    paused ? music.pause() : music.play()
}

playpause.onclick = playPause;

const changeFlashing = () => {
    allowFlash = !allowFlash;
    allowFlashing.innerHTML = allowFlash ? "Disable Dynamic Colors" : "Enable Dynamic Colors";
    if (!allowFlash) {
        playpause.style = {}
        songlabel.style = {}
        allowFlashing.style = {}
        allowbgFlashing.style = {}
    }
    if (musicPlaying) {
        playpause.style.display = 'inline-block'
    }
}

allowFlashing.onclick = changeFlashing;


const changebgFlashing = () => {
    allowbgFlash = !allowbgFlash;
    allowbgFlashing.innerHTML = allowbgFlash ? "Disable Background Flash" : "Enable Background Flash";
    if (!allowbgFlash) {
        app.style = {}
    }
    if (musicPlaying) {
        playpause.style.display = 'inline-block'
    }
}

allowbgFlashing.onclick = changebgFlashing;

window.dropHandler = (ev) => {
    console.log(ev)
    ev.preventDefault();
    if (ev.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        for (var i = 0; i < ev.dataTransfer.items.length; i++) {
            // If dropped items aren't files, reject them
            if (ev.dataTransfer.items[i].kind === 'file') {
                const file = ev.dataTransfer.items[i].getAsFile();
                console.log('... file[' + i + '].name = ' + file.name);
                onMusicUpload(file)
                return;
            }
        }
    } else {
        // Use DataTransfer interface to access the file(s)
        for (var i = 0; i < ev.dataTransfer.files.length; i++) {
            console.log('... file[' + i + '].name = ' + ev.dataTransfer.files[i].name);
        }
    }
}

window.dragOverHandler = (ev) => {
    console.log('File(s) in drop zone');

    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();
}

const getBaseLog = (x, y) => {
    return Math.log(y) / Math.log(x);
}

function argMax(array) {
    return array.map((x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];
}

const mean = arr => {
    const sum = arr.reduce((acc, cur) => acc + cur);
    const average = sum / arr.length;
    return average;
}

const scaleLen = 4096;
const maxFreq = 48000 / 2;
let analyser;
let audioCtx, source;
const playMusic = () => {
    let bufferLength = scaleLen;
    let dataArray = new Uint8Array(bufferLength);

    music.addEventListener("canplay", async event => {
        if (!safariAgent) {
            await music.play()
        }
        else {
            paused = true;
            playpause.style.display = 'inline-block'
            playpause.innerHTML = '▶️'
            await new Promise((resolve) => {
                const oncleek = async () => {
                    await music.play()
                    playpause.removeEventListener('click', oncleek)
                    resolve()
                }
                playpause.addEventListener('click', oncleek)
            })
        }
        paused = false;
        playpause.style.display = 'inline-block'
        playpause.innerHTML = '⏸'

        music.loop = true
        // const stream = music.mozCaptureStream ? music.mozCaptureStream() : music.captureStream()
        if (!musicPlaying) {
            audioCtx = new (window.AudioContext ?? window.webkitAudioContext)();
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = scaleLen * 2;
            // const stream = music.mozCaptureStream ? music.mozCaptureStream() : music.captureStream()
            source = audioCtx.createMediaElementSource(music);
            // source = audioCtx.createMediaStreamSource(stream);
            source.connect(audioCtx.destination);
            source.connect(analyser);
            bufferLength = analyser.frequencyBinCount;
            musicPlaying = true;
        }

        dataArray = new Uint8Array(bufferLength);

        let scaleBarriers = [6.875, 13.75, 27.5, 55, 110, 220, 440, 880, 1760, 3520, 7040, 14080]

        const draw = () => {
            const { width, height } = ctx.canvas.getBoundingClientRect();
            wh.WIDTH = width;
            wh.HEIGHT = height;
            ctx.canvas.width = width;
            ctx.canvas.height = height;
            // console.log(wh)
            const { WIDTH, HEIGHT } = wh;
            // console.log({WIDTH, HEIGHT})
            const numBuckets = getBaseLog(2, scaleLen);
            analyser.getByteFrequencyData(dataArray);
            ctx.clearRect(0, 0, WIDTH, HEIGHT);
            const barWidth = (WIDTH / numBuckets);
            // console.log(barWidth)
            let x = 0;
            let barHeight;
            // console.log(bufferLength)
            let buckets = []
            let oldBucketMax = 0;
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

            const loudness = mean(buckets);

            canv.style.transform = `scale(${1 + beatValue / 255 * 0.1})`

            if (allowFlash) {
                const coolColor = 'hsl(' + (360 - (loudness / 256 * 360)) + ' 100% 60%)';
                songlabel.style.backgroundColor = coolColor;
                playpause.style.backgroundColor = coolColor;
                allowFlashing.style.backgroundColor = coolColor;
                allowbgFlashing.style.backgroundColor = coolColor;
            }

            if (allowbgFlash) {
                app.style.backgroundColor = `rgb(${beatValue},${beatValue},${beatValue})`;
                canv.style.borderColor = `rgb(${255 - beatValue},${255 - beatValue},${255 - beatValue})`;
                ctx.fillStyle = `rgb(${beatValue},${beatValue},${beatValue})`;
            }
            else {
                ctx.fillStyle = '#202124'
            }
            ctx.fillRect(0, 0, WIDTH, HEIGHT);
            for (const avg of buckets) {
                const barHeight = avg / 256 * HEIGHT;
                if (allowFlash) {
                    ctx.fillStyle = 'hsl(' + (barHeight / HEIGHT * 360) + ' 100% 60%)';
                }
                else {
                    ctx.fillStyle = 'hsl(0 100% 60%)';
                }
                ctx.fillRect(x, HEIGHT - barHeight + barWidth / 2, barWidth, barHeight);
                ctx.beginPath();
                ctx.arc(x + barWidth / 2, HEIGHT - barHeight + barWidth / 2, barWidth / 2, 0, Math.PI * 2);
                ctx.fill();
                x += barWidth;
            }

            requestAnimationFrame(draw)
        }
        requestAnimationFrame(draw)
    });

}

setListeners()