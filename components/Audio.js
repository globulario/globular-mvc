import { getTheme } from "./Theme";
import { Model } from '../Model';
import { Application } from "../Application";
import { ApplicationView } from "../ApplicationView";
import { GetFileVideosRequest } from "globular-web-client/title/title_pb";
import { AUDIO } from "./visualizer"
import { setMoveable } from './moveable'
import { setResizeable } from './rezieable'
import WaveSurfer from "wavesurfer.js";

export function secondsToTime(secs) {
    var hours = Math.floor(secs / (60 * 60));

    var divisor_for_minutes = secs % (60 * 60);
    var minutes = Math.floor(divisor_for_minutes / 60);

    var divisor_for_seconds = divisor_for_minutes % 60;
    var seconds = Math.ceil(divisor_for_seconds);

    var obj = {
        "h": hours,
        "m": minutes,
        "s": seconds
    };
    return obj;
}


function getVideoInfo(globule, path, callback) {

    let rqst = new GetFileVideosRequest
    console.log("read title for file ", path)
    rqst.setIndexpath(globule.config.DataPath + "/search/audios")
    rqst.setFilepath(path)

    globule.titleService.getFileVideos(rqst, { application: Application.application, domain: globule.config.Domain, token: localStorage.getItem("user_token") })
        .then(rsp => {
            let audios = rsp.getVideos().getVideosList()
            callback(audios)
        })
        .catch(err => {
            callback([])
        })
}

export function playAudio(path, onplay, onclose, title, globule) {
    let audioPlayer = document.getElementById("audio-player-x")

    if (audioPlayer == null) {
        audioPlayer = new AudioPlayer()
        audioPlayer.id = "audio-player-x"
    }

    audioPlayer.style.height = "0px"
    audioPlayer.style.width = "0px"

    ApplicationView.layout.workspace().appendChild(audioPlayer)

    if (onplay && !audioPlayer.onplay) {
        audioPlayer.onplay = onplay
    }

    if (onclose && !audioPlayer.onclose) {
        audioPlayer.onclose = onclose
    }

    // play a given title.
    audioPlayer.play(path, globule, title)

    return audioPlayer
}

// display the timeline and the wave of the mp3
var wavesurfer = null;
var visualizer = null;

/**
 * Sample empty component
 */
export class AudioPlayer extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
        let hideheader = this.getAttribute("hideheader") != undefined


        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}
            #container{
                width: 720px;
                position: fixed;
            }

            .header{
                display: flex;
                align-items: center;
                color: var(--palette-text-accent);
                background-color: var(--palette-primary-accent);
            }

            .header span{
                flex-grow: 1;
                text-align: center;
                font-size: 1.1rem;
                font-weight: 500;
                display: inline-block;
                white-space: nowrap;
                overflow: hidden !important;
                text-overflow: ellipsis;
            }

            paper-card {
                background: var(--palette-background-default); 
                border-top: 1px solid var(--palette-background-paper);
                border-left: 1px solid var(--palette-background-paper);
            }

        </style>
        <paper-card id="container" class="no-select">
            <div class="header" style="${hideheader ? "display:none;" : ""}">
                <paper-icon-button id="video-close-btn" icon="icons:close" style="min-width: 40px; --iron-icon-fill-color: var(--palette-text-accent);"></paper-icon-button>
                <span id="title-span"></span>
            </div>
            
            <slot></slot>
            
            
        </paper-card>
        `

        let container = this.shadowRoot.querySelector("#container")

        // so here I will use the ligth dom...
        let content = `
        <style>
            #content{
                display: flex;
                background: #000000;
                height: calc(100% - 40px);
                overflow: hidden;
            }

            /** Audio vizualizer **/
            .vz-wrapper {
                min-width: 420px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                background: -webkit-gradient(radial, center center, 0, center center, 460, from(#39668b), to(#000000));
                background: -webkit-radial-gradient(circle, #39668b, #000000);
                background: -moz-radial-gradient(circle, #39668b, #000000);
                background: -ms-radial-gradient(circle, #39668b, #000000);
                box-shadow: inset 0 0 160px 0 #000;
                cursor: pointer;
            }

            .vz-wrapper.-canvas {
                height: initial;
                width: initial;
                background: transparent;
                box-shadow: none;
            }

            iron-icon {
                fill: white;
            }

            @media screen and (min-width: 420px) {
                .vz-wrapper { box-shadow: inset 0 0 200px 60px #000; }
            }

            .buttons{
                margin-top: 20px;
                display: flex;
                justify-content: center;
                align-items: center;
                flex-direction: column;
            }

            .buttons iron-icon{
                transition: 0.3s;
                height: 20px;
                width: 20px;
            }

            .buttons span{
                color: white;
                font-size: .75rem;
                padding-left: 2px;
                padding-right: 2px;
            }

            .buttons iron-icon:hover{
                cursor: pointer;
                height: 24px;
                width: 24px;
            }

            .toolbar iron-icon{
                transition: 0.3s;
                height: 28px;
                width: 28px;
            }

            .toolbar iron-icon:hover{
                cursor: pointer;
                height: 32px;
                width: 32px;
            }

            .toolbar #pause, #play-arrow{
                transition: 0.3s;
                height: 40px;
                width: 40px;
            }

            .toolbar #pause:hover, #play-arrow:hover{
                cursor: pointer;
                height: 42px;
                width: 42px;
            }

            #shuffle, #skip-previous{
                padding-right: 20px;
            }

            #repeat, #skip-next{
                padding-left: 20px;
            }

            #skip-previous{
                padding-right: 10px;
            }

            #skip-next{
                padding-left: 10px;
            }

            #volume-up{
                
            }

            #waveform{
                width: 90%;
                align-self: center;
            }

        </style>

        <div id="content">
            <globular-playlist></globular-playlist>

            <div class="vz-wrapper" style="display: flex; justify-content: center;">
                <canvas id="myCanvas" width="800" height="400"></canvas>
                <div id="waveform"></div>
                <div class="buttons">
                    <div class="toolbar" style="display: flex; padding-left: 10px; padding-right: 10px; align-items: center;  height: 40px;">
                        <iron-icon title="Shuffle Playlist" id="shuffle" icon="av:shuffle"></iron-icon>
                        <iron-icon id="skip-previous" title="Previous Track" icon="av:skip-previous"></iron-icon>
                        <iron-icon id="fast-rewind" title="Rewind" icon="av:fast-rewind"></iron-icon>
                        <iron-icon id="play-arrow" title="Play" icon="av:play-circle-outline"></iron-icon>
                        <iron-icon id="pause" title="Pause" icon="av:pause-circle-outline"></iron-icon>
                        <iron-icon id="fast-forward" title="Foward" icon="av:fast-forward"></iron-icon>
                        <iron-icon id="skip-next" title="Next Track" icon="av:skip-next"></iron-icon>
                        <iron-icon id="stop" title="Stop" icon="av:stop"></iron-icon>
                        <iron-icon title="Loop Playlist" id="repeat" icon="av:repeat"></iron-icon>
                    </div>
                    <div style="flex-grow: 1; display: flex; align-items: center; width: 100%;">
                        <paper-slider style="flex-grow: 1;"></paper-slider>
                        <div  style="display: flex; align-items: center; padding-right: 10px;">
                            <span id="current-time"></span> <span>/</span> <span id="total-time"></span>
                        </div>
                        <div style="position: relative;">
                            <iron-icon id="volume-up" icon="av:volume-up"></iron-icon>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `


        let range = document.createRange()
        this.appendChild(range.createContextualFragment(content))


        // Now the buttons actions.
        this.skipPresiousBtn = this.querySelector("#skip-previous")
        this.fastRewindBtn = this.querySelector("#fast-rewind")
        this.playBtn = this.querySelector("#play-arrow")
        this.pauseBtn = this.querySelector("#pause")
        this.stopBtn = this.querySelector("#stop")
        this.fastForwardBtn = this.querySelector("#fast-forward")
        this.skipNextBtn = this.querySelector("#skip-next")
        this.playSlider = this.querySelector("paper-slider")
        this.loopBtn = this.querySelector("#repeat")
        this.shuffleBtn = this.querySelector("#shuffle")
        this.volumeBtn = this.querySelector("#volume-up")
        this.currentTimeSpan = this.querySelector("#current-time")
        this.totalTimeSpan = this.querySelector("#total-time")

        // give the focus to the input.
        let offsetTop = this.shadowRoot.querySelector(".header").offsetHeight
        if (offsetTop == 0) {
            offsetTop = 60
        }

        if (localStorage.getItem("__audio_player_position__")) {
            let position = JSON.parse(localStorage.getItem("__audio_player_position__"))
            if (position.top < offsetTop) {
                position.top = offsetTop
            }
            container.style.top = position.top + "px"
            container.style.left = position.left + "px"
        } else {
            container.style.left = ((document.body.offsetWidth - 720) / 2) + "px"
            container.style.top = "80px"
        }

        if (localStorage.getItem("__audio_player_dimension__")) {
            let dimension = JSON.parse(localStorage.getItem("__audio_player_dimension__"))
            container.style.width = dimension.width + "px"
            container.style.height = dimension.height + "px"
        }

        setResizeable(container, (width, height) => {
            localStorage.setItem("__audio_player_dimension__", JSON.stringify({ width: width, height: height }))
            container.style.height = height + "px"
        })
        container.resizeHeightDiv.style.display = "none"


        // toggle full screen when the user double click on the header.
        this.shadowRoot.querySelector(".header").ondblclick = () => {

        }

        setMoveable(this.shadowRoot.querySelector(".header"), container, (left, top) => {
            localStorage.setItem("__audio_player_position__", JSON.stringify({ top: top, left: left }))
        }, this, offsetTop)

        this.shadowRoot.querySelector("#video-close-btn").onclick = () => {
            this.close()
        }


        this.querySelector("#content").onclick = () => {

            let volumePanel = this.volumeBtn.parentNode.querySelector("#volume-panel")
            if (volumePanel) {
                volumePanel.parentNode.removeChild(volumePanel)
            }
        }

    }

    // The connection callback.
    connectedCallback() {
        // create the visualizer once.
        if (visualizer) {
            return
        }
    }

    play(path, globule, title) {
        this.shadowRoot.querySelector("#container").style.display = "block"
        let filename = path.substring(path.lastIndexOf("/") + 1)

        if (visualizer) {
            if (visualizer.url.indexOf(filename) != -1 && visualizer.isPlaying) {
                // Do nothing...
                return
            } else if (visualizer.url.indexOf(filename) != -1 && !visualizer.isPlaying) {

                // Resume the audio...
                visualizer.setBufferSourceNode(wavesurfer.backend.source)
                    .start(wavesurfer.getCurrentTime())


                this.playBtn.style.display = "none"
                this.pauseBtn.style.display = "block"

                wavesurfer.play()

                return
            }
        }

        this.stop()
        this.playBtn.style.display = "block"
        this.pauseBtn.style.display = "none"

        if (wavesurfer == null) {
            wavesurfer = WaveSurfer.create({
                container: '#waveform',
                scrollParent: true,
                waveColor: '#93a1ad',
                progressColor: '#172a39',
                background: 'transparent',
                height: 70,
                cursorColor: "#1976d2",
                hideScrollbar: true
            });

            wavesurfer.on("seek", () => {
                // refresh the source
                visualizer.setBufferSourceNode(wavesurfer.backend.source)
                    .start(wavesurfer.getCurrentTime())

                if (wavesurfer.isPlaying()) {
                    this.playBtn.style.display = "none"
                    this.pauseBtn.style.display = "block"
                } else {
                    this.playBtn.style.display = "block"
                    this.pauseBtn.style.display = "none"
                }
            })
        }

        // Now I will set the visualizer...
        if (visualizer == null) {
            visualizer = AUDIO.VISUALIZER.getInstance({
                autoplay: false,
                loop: false,
                canvas: 'myCanvas',
                style: 'lounge',
                barWidth: 2,
                barHeight: 2,
                barSpacing: 7,
                barColor: '#ffffff',
                shadowBlur: 20,
                shadowColor: '#ffffff',
                font: ['12px', 'Helvetica']
            });


            visualizer.onclick = () => {

                if (wavesurfer.isPlaying()) {
                    visualizer.pause()
                    this.playBtn.style.display = "block"
                    this.pauseBtn.style.display = "none"
                    wavesurfer.pause()
                } else {
                    wavesurfer.play()
                    visualizer.setBufferSourceNode(wavesurfer.backend.source)
                        .start(wavesurfer.getCurrentTime())
                    this.playBtn.style.display = "none"
                    this.pauseBtn.style.display = "block"

                }

            }
        }


        // reset visualiser values.
        visualizer.author = ""
        visualizer.featuring = ""
        visualizer.title = ""
        visualizer.url = ""

        if (title) {

            visualizer.title = title.getDescription()
            this.shadowRoot.querySelector("#title-span").innerHTML = title.getDescription()

            if (title.getDescription().indexOf(" - ") != -1) {
                // Try the best to get correct values...
                let title_ = title.getDescription().split(" - ")[1].replace(/FEAT./i, "ft.");
                let feat = ""

                if (title_.indexOf(" ft.") != -1) {
                    feat = title_.split(" ft.")[1]
                    title_ = title_.split(" ft.")[0]
                } else if (title_.indexOf("(ft.") != -1) {
                    feat = title_.split("(ft.")[1].replace(")", 0)
                    title_ = title_.split(" ft.")[0]
                }

                title_ = title_.replace(/ *\([^)]*\) */g, " ").replace(/ *\[[^)]*\] */g, " ").replace(/LYRICS/i, "");

                visualizer.title = title_
                this.shadowRoot.querySelector("#title-span").innerHTML = title_
                let author = title.getDescription().split(" - ")[0].replace(/FEAT./i, "ft.").trim()

                if (author.indexOf(" ft.") != -1) {
                    feat = author.split(" ft.")[1]
                    author = author.split(" ft.")[0]
                } else if (author.indexOf("(ft.") != -1) {
                    feat = author.split("(ft.")[1].replace(")", 0)
                    author = author.split(" ft.")[0]
                }

                feat = feat.replace(/ *\([^)]*\) */g, " ").replace(/ *\[[^)]*\] */g, " ");

                if (feat.length > 0) {
                    visualizer.featuring = feat
                }
                author = author.replace(/ *\([^)]*\) */g, " ").replace(/ *\[[^)]*\] */g, " ");

                visualizer.author = author
            }

        } else {
            let values = path.split("/")
            visualizer.title = values[values.length - 1]
        }

        let url = globule.config.Protocol + "://" + globule.config.Domain
        if (window.location != globule.config.Domain) {
            if (globule.config.AlternateDomains.indexOf(window.location.host) != -1) {
                url = globule.config.Protocol + "://" + window.location.host
            }
        }

        if (globule.config.Protocol == "https") {
            if (globule.config.PortHttps != 443)
                url += ":" + globule.config.PortHttps
        } else {
            if (globule.config.PortHttps != 80)
                url += ":" + globule.config.PortHttp
        }

        path.split("/").forEach(item => {
            item = item.trim()
            if (item.length > 0) {
                url += "/" + encodeURIComponent(item)
            }
        })

        url += "?application=" + Model.application
        if (localStorage.getItem("user_token") != undefined) {
            url += "&token=" + localStorage.getItem("user_token")
        }

        visualizer.url = url

        wavesurfer.on("ready", () => {

            this.playSlider.max = wavesurfer.getDuration();
            if (localStorage.getItem("audio_volume")) {
                wavesurfer.setVolume(parseFloat(localStorage.getItem("audio_volume")))
            }

            // display the track lenght...
            let obj = secondsToTime(wavesurfer.getDuration())
            var hours = obj.h
            var min = obj.m
            var sec = obj.s
            let hours_ = (hours < 10) ? '0' + hours : hours;
            let minutes_ = (min < 10) ? '0' + min : min;
            let seconds_ = (sec < 10) ? '0' + sec : sec;

            this.totalTimeSpan.innerHTML = hours_ + ":" + minutes_ + ":" + seconds_;

            wavesurfer.play();

            // start the visualization...
            visualizer.setContext(wavesurfer.backend.ac)
                .setAnalyser()
                .setFrequencyData()
                .setBufferSourceNode(wavesurfer.backend.source)
                .start()

            this.playBtn.style.display = "none"
            this.pauseBtn.style.display = "block"

        })

        this.fastForwardBtn.onclick = () => {
            if (!visualizer.isPlaying) {
                return
            }

            let position = this.playSlider.value / this.playSlider.max;
            position += .1
            if (position < 1) {
                wavesurfer.seekAndCenter(position)
            } else {
                this.stop()
            }
        }

        this.fastRewindBtn.onclick = () => {
            if (!visualizer.isPlaying) {
                return
            }

            let position = this.playSlider.value / this.playSlider.max;
            position -= .1
            if (position > 0) {
                wavesurfer.seekAndCenter(position)
            } else {
                this.stop()
            }
        }

        this.playSlider.onmousedown = () => {
            this.playSlider.busy = true
        }

        this.playSlider.onmouseup = () => {
            wavesurfer.seekTo(this.playSlider.value / this.playSlider.max)
            this.playSlider.busy = false
        }

        // Connect the play process...
        wavesurfer.on("audioprocess", (position) => {

            let percent = position / wavesurfer.getDuration();
            if (!this.playSlider.busy)
                this.playSlider.value = position

            this.playSlider.title = parseFloat(percent * 100).toFixed(2) + "%"

            // display the track lenght...
            let obj = secondsToTime(position)
            var hours = obj.h
            var min = obj.m
            var sec = obj.s
            let hours_ = (hours < 10) ? '0' + hours : hours;
            let minutes_ = (min < 10) ? '0' + min : min;
            let seconds_ = (sec < 10) ? '0' + sec : sec;

            visualizer.time = this.currentTimeSpan.innerHTML = hours_ + ":" + minutes_ + ":" + seconds_;

        })

        wavesurfer.on("finish", () => {
            this.stop()
        })

        // Actions...
        this.playBtn.onclick = () => {
            wavesurfer.play()
            visualizer.setBufferSourceNode(wavesurfer.backend.source)
                .start(wavesurfer.getCurrentTime())
            this.playBtn.style.display = "none"
            this.pauseBtn.style.display = "block"
        }

        this.pauseBtn.onclick = () => {
            visualizer.pause()
            wavesurfer.pause()
            this.playBtn.style.display = "block"
            this.pauseBtn.style.display = "none"
        }

        // stop the audio player....
        this.stopBtn.onclick = () => {
            this.stop()
        }

        // The volume button...
        this.volumeBtn.onclick = (evt) => {
            evt.stopPropagation()

            let volumePanel = this.volumeBtn.parentNode.querySelector("#volume-panel")
            if (volumePanel) {
                volumePanel.parentNode.removeChild(volumePanel)
                return
            }

            let html = `
                <paper-card id="volume-panel" style="position: absolute; top:-42px; right: 0px;">
                    <div style="display: flex; align-items: center;">
                        <iron-icon id="volume-down-btn" icon="av:volume-down" style="fill: black;" ></iron-icon>
                        <paper-slider style=""></paper-slider>
                        <iron-icon id="volume-up-btn" icon="av:volume-up" style="fill: black;"></iron-icon>
                    </div>
                </paper-card>
            `

            let range = document.createRange()
            this.volumeBtn.parentNode.appendChild(range.createContextualFragment(html))
            volumePanel = this.volumeBtn.parentNode.querySelector("#volume-panel")
            volumePanel.querySelector("paper-slider").max = 100

            if (wavesurfer.getVolume() == 0) {
                volumePanel.querySelector("#volume-down-btn").icon = "av:volume-off"
            } else {
                volumePanel.querySelector("#volume-down-btn").icon = "av:volume-down"
            }


            // set the slider position.
            volumePanel.querySelector("paper-slider").value = wavesurfer.getVolume() * 100

            volumePanel.querySelector("paper-slider").onclick = (evt) => {
                evt.stopPropagation()
            }

            volumePanel.querySelector("paper-slider").onchange = () => {
                let volume = Number(volumePanel.querySelector("paper-slider").value / 100)
                wavesurfer.setVolume(volume)
                localStorage.setItem("audio_volume", volume)
                if (volume == 0) {
                    this.volumeBtn.icon = volumePanel.querySelector("#volume-down-btn").icon = "av:volume-off"
                } else {
                    volumePanel.querySelector("#volume-down-btn").icon = "av:volume-down"
                    this.volumeBtn.icon = "av:volume-up"
                }
            }

            volumePanel.querySelector("#volume-down-btn").onclick = (evt) => {
                evt.stopPropagation()

                let volume = volumePanel.querySelector("paper-slider").value

                volume -= 10
                if (volume <= 0) {
                    this.volumeBtn.icon = volumePanel.querySelector("#volume-down-btn").icon = "av:volume-off"
                    wavesurfer.setVolume(0)
                    volumePanel.querySelector("paper-slider").value = 0
                } else {
                    volumePanel.querySelector("#volume-down-btn").icon = "av:volume-down"
                    this.volumeBtn.icon = "av:volume-up"
                    volumePanel.querySelector("paper-slider").value = volume
                    wavesurfer.setVolume(Number(volume / 100))
                }
            }

            volumePanel.querySelector("#volume-up-btn").onclick = (evt) => {
                evt.stopPropagation()

                let volume = volumePanel.querySelector("paper-slider").value
                volumePanel.querySelector("#volume-down-btn").icon = "av:volume-down"
                this.volumeBtn.icon = "av:volume-up"

                if (volume < 100) {
                    volume += 10
                    volumePanel.querySelector("paper-slider").value = volume
                    wavesurfer.setVolume(Number(volume / 100))
                }
            }
        }

        wavesurfer.load(url)

    }


    /**
     * Close the player...
     */
    close() {
        this.stop()
        this.shadowRoot.querySelector("#container").style.display = "none"
        if (this.onclose) {
            this.onclose()
        }
    }

    stop() {

        this.playSlider.value = 0;

        if (wavesurfer) {
            wavesurfer.stop()
            wavesurfer.seekAndCenter(0)
        }

        if (visualizer) {
            visualizer.stop()
            visualizer.isPlaying = false
            visualizer.time = "00:00:00"
        }

        this.playBtn.style.display = "block"
        this.pauseBtn.style.display = "none"
    }
}

customElements.define('globular-audio-player', AudioPlayer)