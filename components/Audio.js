
import { generatePeerToken, Model } from '../Model';
import { ApplicationView } from "../ApplicationView";
import { setMoveable } from './moveable'
import WaveSurfer from "wavesurfer.js";
import { PlayList } from "./Playlist"
import { fireResize } from "./utility";
import { File } from "../File";

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

export function playAudio(path, onplay, onclose, title, globule) {

    let menus = document.body.querySelectorAll("globular-dropdown-menu")
    for (var i = 0; i < menus.length; i++) {
        menus[i].close()
        menus[i].parentNode.removeChild(menus[i])
    }

    let audioPlayer = document.getElementById("audio-player-x")

    if (audioPlayer == null) {
        audioPlayer = new AudioPlayer()
        audioPlayer.id = "audio-player-x"
    } else {
        audioPlayer.stop()
        audioPlayer.playlist.clear()
    }

    audioPlayer.style.zIndex = 100

    ApplicationView.layout.workspace().appendChild(audioPlayer)

    if (onplay && !audioPlayer.onplay) {
        audioPlayer.onplay = onplay
    }

    if (onclose && !audioPlayer.onclose) {
        audioPlayer.onclose = onclose
    }

    if (audioPlayer.playlist)
        audioPlayer.playlist.clear()

    // play a given title.
    if (path.endsWith("audio.m3u") || path.startsWith("#EXTM3U")) {
        audioPlayer.loadPlaylist(path, globule)
        audioPlayer.showPlaylist()
    } else {
        if (File.hasLocal) {
            File.hasLocal(path, exists => {
                if (exists) {
                    audioPlayer.play(path, globule, title, true)
                } else {
                    audioPlayer.play(path, globule, title, false)
                }
            })
        } else {
            audioPlayer.play(path, globule, title, false)
        }

        audioPlayer.hidePlaylist()
    }


    return audioPlayer
}

// display the timeline and the wave of the mp3

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
        this.wavesurfer = null;

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
            #container{
                position: fixed;
                background: var(--palette-background-default); 
                border-top: 1px solid var(--palette-background-paper);
                border-left: 1px solid var(--palette-background-paper);
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
                max-width: calc(100vw - 50px);
            }

            #content{
                height: 600px;
                display: flex;
                background: #000000;
                justify-items: center;
                overflow: hidden;
                background-color: var(--palette-background-paper);
                color: var(--palette-text-primary);
            }

            @media (max-width: 600px) {
                #content{
                    height: calc(100vh - 100px);
                    overflow-y: auto;
                    width: 100vw;
                    background: black;
                    flex-direction: column-reverse;
                }

                #content {
                    height: 420px;
                    overflow: hidden;
                }
            }

        </style>

        <paper-card id="container" class="no-select">
            <div class="header" style="${hideheader ? "display:none;" : ""}">
                <paper-icon-button id="close-btn" icon="icons:close" style="min-width: 40px; --iron-icon-fill-color: var(--palette-text-accent);"></paper-icon-button>
                <span id="title-span"></span>
            </div>
            <div id=content>
                <slot></slot>
            </div>
        </paper-card>
        `

        let container = this.shadowRoot.querySelector("#container")

        this.shadowRoot.querySelector("#close-btn").onclick = () => {
            this.stop()
            this.parentNode.removeChild(this)
        }

        // so here I will use the ligth dom...
        let content = `
        <style>
            /** Audio vizualizer **/
            .vz-wrapper {
                width: 100%;
                height: 600px;
                padding: 0px 5px 0px 5px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                background: -webkit-gradient(radial, center center, 0, center center, 460, from(#39668b), to(#000000));
                background: -webkit-radial-gradient(circle, #39668b, #000000);
                background: -moz-radial-gradient(circle, #39668b, #000000);
                background: -ms-radial-gradient(circle, #39668b, #000000);
                box-shadow: inset 0 0 160px 0 #000;
                cursor: pointer;
            }

            .vz-wrapper img {
                max-width: 300px;
                max-height: 300px;
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
                width: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                flex-direction: column;
                margin-bottom: 10px;
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
                width: 100%;
                align-self: center;
            }

            audio {
                display: none;
            }

            .album-name {
                font-size: 1.5rem;
                font-weight: 500;
                color: white;
                white-space: nowrap;
                overflow: hidden !important;
                text-overflow: ellipsis;
                text-align: center;
            }

            .album-year {
                font-size: 1.5rem;
                padding-left: 20px;
                color: white;
            }

            .album-cover {
                margin-top: 10px;
                margin-bottom: 10px;
                border: 1px solid black;
                -webkit-box-shadow: 5px 5px 15px 5px #152635;
                box-shadow: 5px 5px 15px 5px #152635;
            }

            .track-title {
                margin-top: 10px;
                font-size: 1.6rem;
                flex-grow: 1;
                color: white;
                display: inline-block;
                white-space: nowrap;
                overflow: hidden !important;
                text-overflow: ellipsis;
                text-align: center;
                white-space: initial;
            }

            #track-info{
                position: absolute;
                bottom: 10px;
                left: 20px;
                color: white;
                font-size: 1.6rem;
            }

            @media (max-width: 600px) {

                .album-year {
                    display: none;
                }

                .track-title {
                    font-size: 1.25rem;
                }

                #track-info {
                    bottom: 50px;
                    font-size: 1rem;
                }

                .vz-wrapper {
                    height: auto;
                    padding: 0px;
                }

                .vz-wrapper img {
                    max-width: 180px;
                    max-height: 180px;
                }

                globular-playlist {
                    margin-bottom: 50px;
                }
            }

        </style>

        <audio></audio>

        <globular-playlist></globular-playlist>

        <div class="vz-wrapper" style="display: flex; justify-content: center; position: relative;">
            <div id="track-info"> </div>
            <div style="display: flex; margin-top: 10px;">
                <span class="album-name"></span>
                <span class="album-year"></span>
            </div>

            <img class="album-cover"> </img>
            <span class="track-title"> </span>

            <div id="waveform"></div>
            <div class="buttons">
                <div style="flex-grow: 1; display: flex; align-items: center; width: 100%;">
                    <paper-slider style="flex-grow: 1;"></paper-slider>
                    <div  style="display: flex; align-items: center; padding-right: 10px;">
                        <span id="current-time"></span> <span>/</span> <span id="total-time"></span>
                    </div>
                    <div style="position: relative;">
                        <iron-icon id="volume-up" icon="av:volume-up"></iron-icon>
                    </div>
                </div>
                <div class="toolbar" style="display: flex; padding-left: 10px; padding-right: 10px; align-items: center; height: 40px; margin-top: 20px;">
                    <iron-icon title="Shuffle Playlist" id="shuffle" icon="av:shuffle"></iron-icon>
                    <iron-icon id="skip-previous" title="Previous Track" icon="av:skip-previous"></iron-icon>
                    <iron-icon id="fast-rewind" title="Rewind" icon="av:fast-rewind"></iron-icon>
                    <iron-icon id="play-arrow" title="Play" icon="av:play-circle-outline"></iron-icon>
                    <iron-icon id="pause" title="Pause" style="display: none;" icon="av:pause-circle-outline"></iron-icon>
                    <iron-icon id="fast-forward" title="Foward" icon="av:fast-forward"></iron-icon>
                    <iron-icon id="skip-next" title="Next Track" icon="av:skip-next"></iron-icon>
                    <iron-icon id="stop" title="Stop" icon="av:stop"></iron-icon>
                    <iron-icon title="Loop Playlist" id="repeat" icon="av:repeat"></iron-icon>
                </div>
            </div>
        </div>
        `


        let range = document.createRange()
        this.appendChild(range.createContextualFragment(content))

        // The audio element.
        this.audio = this.querySelector("audio")

        // The current file path
        this.path = ""

        // The presentation elements...
        this.albumName = this.querySelector(".album-name")
        this.albumYear = this.querySelector(".album-year")
        this.ablumCover = this.querySelector(".album-cover")
        this.trackTitle = this.querySelector(".track-title")
        this.trackInfo = this.querySelector("#track-info")

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
        this.playlist = this.querySelector("globular-playlist")
        this.playlist.audioPlayer = this

        this.loop = false
        if (localStorage.getItem("audio_loop")) {
            this.loop = localStorage.getItem("audio_loop") == "true"
        }

        if (this.loop) {
            this.loopBtn.style.fill = "white"
        } else {
            this.loopBtn.style.fill = "gray"
        }

        this.shuffle = false
        if (localStorage.getItem("audio_shuffle")) {
            this.shuffle = localStorage.getItem("audio_shuffle") == "true"
        }

        if (this.shuffle) {
            this.shuffleBtn.style.fill = "white"
        } else {
            this.shuffleBtn.style.fill = "#424242"
        }


        // give the focus to the input.
        let offsetTop = this.shadowRoot.querySelector(".header").offsetHeight
        if (offsetTop == 0) {
            offsetTop = 60
        }

        // toggle full screen when the user double click on the header.
        this.shadowRoot.querySelector(".header").ondblclick = () => {

        }

        container.name = "audio_player"
        setMoveable(this.shadowRoot.querySelector(".header"), container, (left, top) => {
            /** */
        }, this, offsetTop)


        this.querySelector(".vz-wrapper").onclick = () => {
            let volumePanel = this.volumeBtn.parentNode.querySelector("#volume-panel")
            if (volumePanel) {
                volumePanel.parentNode.removeChild(volumePanel)
            }
        }

        // Actions...
        this.playBtn.onclick = () => {
            this.wavesurfer.play()
            this.playBtn.style.display = "none"
            this.pauseBtn.style.display = "block"
            if (this.playlist) {
                this.playlist.resumePlaying()
            }
        }

        this.pauseBtn.onclick = () => {
            if (this.playlist) {
                this.playlist.pausePlaying()
            }
            this.pause()
        }

        // stop the audio player....
        this.stopBtn.onclick = () => {
            this.stop()
            if (this.playlist) {
                this.playlist.stop()
            }
            this.trackInfo.innerHTML = ""
        }

        this.skipNextBtn.onclick = () => {
            this.stop()
            if (this.playlist) {
                this.playlist.playNext()
            }
        }

        this.skipPresiousBtn.onclick = () => {
            this.stop()
            if (this.playlist) {
                this.playlist.playPrevious()
            }
        }

        // loop...
        this.loopBtn.onclick = () => {

            if (this.loop) {
                localStorage.setItem("audio_loop", "false");
                this.loop = false;
            } else {
                localStorage.setItem("audio_loop", "true")
                this.loop = true;
            }

            if (this.loop) {
                this.loopBtn.style.fill = "white"
            } else {
                this.loopBtn.style.fill = "#424242"
            }

        }

        this.shuffleBtn.onclick = () => {
            if (this.shuffle) {
                localStorage.setItem("audio_shuffle", "false");
                this.shuffle = false;
            } else {
                localStorage.setItem("audio_shuffle", "true")
                this.shuffle = true;
            }

            if (this.shuffle) {
                this.shuffleBtn.style.fill = "white"
            } else {
                this.shuffleBtn.style.fill = "#424242"
            }

            this.playlist.orderItems()
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
            <paper-card id="volume-panel" style="position: absolute; top:24px; right: 0px; z-index:100">
                <div style="display: flex; align-items: center;">
                    <iron-icon id="volume-down-btn" icon="av:volume-down" style="fill: white;" ></iron-icon>
                    <paper-slider style=""></paper-slider>
                    <iron-icon id="volume-up-btn" icon="av:volume-up" style="fill: white;"></iron-icon>
                </div>
            </paper-card>
            `

            let range = document.createRange()
            this.volumeBtn.parentNode.appendChild(range.createContextualFragment(html))
            volumePanel = this.volumeBtn.parentNode.querySelector("#volume-panel")
            volumePanel.querySelector("paper-slider").max = 100

            if (this.wavesurfer.getVolume() == 0) {
                volumePanel.querySelector("#volume-down-btn").icon = "av:volume-off"
            } else {
                volumePanel.querySelector("#volume-down-btn").icon = "av:volume-down"
            }


            // set the slider position.
            volumePanel.querySelector("paper-slider").value = this.wavesurfer.getVolume() * 100

            volumePanel.querySelector("paper-slider").onclick = (evt) => {
                evt.stopPropagation()
            }

            volumePanel.querySelector("paper-slider").onchange = () => {
                let volume = Number(volumePanel.querySelector("paper-slider").value / 100)
                this.wavesurfer.setVolume(volume)
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
                    this.wavesurfer.setVolume(0)
                    volumePanel.querySelector("paper-slider").value = 0
                } else {
                    volumePanel.querySelector("#volume-down-btn").icon = "av:volume-down"
                    this.volumeBtn.icon = "av:volume-up"
                    volumePanel.querySelector("paper-slider").value = volume
                    this.wavesurfer.setVolume(Number(volume / 100))
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
                    this.wavesurfer.setVolume(Number(volume / 100))
                }
            }
        }

        this.fastForwardBtn.onclick = () => {
            if (!this.wavesurfer.isPlaying()) {
                return
            }

            let position = this.playSlider.value / this.playSlider.max;
            position += .1
            if (position < 1) {
                this.wavesurfer.seekAndCenter(position)
            } else {
                this.stop()
            }
        }

        this.fastRewindBtn.onclick = () => {
            if (!this.wavesurfer.isPlaying()) {
                return
            }

            let position = this.playSlider.value / this.playSlider.max;
            position -= .1
            if (position > 0) {
                this.wavesurfer.seekAndCenter(position)
            } else {
                this.stop()
            }
        }

        this.playSlider.onmousedown = () => {
            this.playSlider.busy = true
        }

        this.playSlider.onmouseup = () => {
            this.wavesurfer.seekTo(this.playSlider.value / this.playSlider.max)
            this.playSlider.busy = false
        }
    }

    // The connection callback.
    connectedCallback() {

        if (this.wavesurfer) {
            return
        }

        this.wavesurfer = WaveSurfer.create({
            container: '#waveform',
            scrollParent: true,
            waveColor: '#93a1ad',
            progressColor: '#172a39',
            background: 'transparent',
            height: 70,
            cursorColor: "#1976d2",
            hideScrollbar: true,
            xhr: { cache: 'default', mode: 'no-cors' }
        });

        this.wavesurfer.on("seek", () => {
            if (!this.wavesurfer.backend.source) {
                return
            }

            if (this.wavesurfer.isPlaying()) {
                this.playBtn.style.display = "none"
                this.pauseBtn.style.display = "block"
            } else {
                this.playBtn.style.display = "block"
                this.pauseBtn.style.display = "none"
            }
        })


        this.wavesurfer.on("ready", () => {

            this.playSlider.max = this.wavesurfer.getDuration();
            if (localStorage.getItem("audio_volume")) {
                this.wavesurfer.setVolume(parseFloat(localStorage.getItem("audio_volume")))
            }

            // display the track lenght...
            let obj = secondsToTime(this.wavesurfer.getDuration())
            var hours = obj.h
            var min = obj.m
            var sec = obj.s
            let hours_ = (hours < 10) ? '0' + hours : hours;
            let minutes_ = (min < 10) ? '0' + min : min;
            let seconds_ = (sec < 10) ? '0' + sec : sec;

            this.totalTimeSpan.innerHTML = hours_ + ":" + minutes_ + ":" + seconds_;

            this.wavesurfer.play();
            this.playBtn.style.display = "none"
            this.pauseBtn.style.display = "block"

            fireResize()
        })



        // Connect the play process...
        this.wavesurfer.on("audioprocess", (position) => {

            let percent = position / this.wavesurfer.getDuration();
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

            this.currentTimeSpan.innerHTML = hours_ + ":" + minutes_ + ":" + seconds_;
        })

        this.wavesurfer.on("finish", () => {

            if (this.playlist.items.length > 1) {
                this.playlist.playNext()
            } else if (this.loop) {
                if (File.hasLocal) {
                    File.hasLocal(this.path, exists => {
                        if (exists) {
                            this.play(this.path, this._audio_.globule, this._audio_, true)
                        } else {
                            this.play(this.path, this._audio_.globule, this._audio_, false)
                        }
                    })
                } else {
                    this.play(this.path, this._audio_.globule, this._audio_)
                }
            } else {
                this.stop()
            }
        })
    }

    setTarckInfo(index, total) {
        this.trackInfo.innerHTML = `${index + 1} / ${total}`
    }

    play(path, globule, audio, local = false) {

        if (this._audio_ && audio) {
            if (this._audio_.getId() == audio.getId() && this.wavesurfer.isPlaying()) {
                // be sure the audio player is visible...
                return
            } else if (this._audio_.getId() == audio.getId()) {

                this.wavesurfer.play()

                // Resume the audio...
                this.playBtn.style.display = "none"
                this.pauseBtn.style.display = "block"

                return
            }
        }

        this.shadowRoot.querySelector("#container").style.display = "block"

        this.stop()
        this.playBtn.style.display = "block"
        this.pauseBtn.style.display = "none"


        if (audio) {
            if (audio.getArtist()) {
                this.shadowRoot.querySelector("#title-span").innerHTML = audio.getArtist() + " : "
            }
            // TODO see how to get the featuring info...
            this.shadowRoot.querySelector("#title-span").innerHTML += audio.getTitle()

            this.albumName.innerHTML = audio.getAlbum()
            this.albumYear.innerHTML = ""

            if (audio.getYear() > 0)
                this.albumYear.innerHTML = audio.getYear()
            this.ablumCover.src = audio.getPoster().getContenturl()
            this.trackTitle.innerHTML = audio.getTitle()

        } else {
            let end = path.lastIndexOf("?")
            if (end == -1) {
                end = path.length
            }
        }

        generatePeerToken(globule, token => {
            let url = ""


            if (path.startsWith("http")) {
                url = path;
            } else {

                url = globule.config.Protocol + "://" + globule.domain
                if (window.location != globule.domain) {
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

                //url += path
                path.split("/").forEach(item => {
                    item = item.trim()
                    if (item.length > 0) {
                        url += "/" + encodeURIComponent(item)
                    }
                })

                url += "?application=" + Model.application

                url += "&token=" + token

            }

            if (local) {
                url = "local-media://" + path
            }

            this.path = path;
            if (audio) {
                this._audio_ = audio
                this._audio_.globule = globule
                this.audio.src = url
            }

            var xhr = new XMLHttpRequest();
            xhr.open('get', url, true);

            // Load the data directly as a Blob.
            xhr.responseType = 'blob';

            xhr.onload = (evt) => {
                if (evt.target.status == 401) {
                    ApplicationView.displayMessage(`unable to read the file ${path} Check your access privilege`, 3500)
                    this.close()
                    return
                }
                if (evt.target.response.size < 48000000) {
                    this.wavesurfer.loadBlob(evt.target.response);
                } else {
                    ApplicationView.displayMessage("this file is to large to be play by the audio player. The maximum size is 24MB for audio file", 3000)
                }

            };

            xhr.send();
        })



    }

    // load the playlist...
    loadPlaylist(path, globule) {
        this.playlist.clear()
        this.playlist.load(path, globule, this)
        
        // set the css value to display the playlist correctly...
        window.addEventListener("resize", (evt) => {
            let content = this.shadowRoot.querySelector("#content")
            let w = ApplicationView.layout.width();
            if (w < 500) {
                content.style.height = "calc(100vh - 100px)"
                content.style.overflowY = "auto"
            }else{
                content.style.height = ""
                content.style.overflowY = ""
            }
        })
      
    }

    // Pause the player...
    pause() {
        this.wavesurfer.pause()
        this.playBtn.style.display = "block"
        this.pauseBtn.style.display = "none"
    }

    /**
     * Close the player...
     */
    close() {
        this.stop()
        this.path = ""
        this._audio_ = null;
        this.parentElement.removeChild(this)
        if (this.onclose) {
            this.onclose()
        }
    }

    stop() {

        this.playSlider.value = 0;

        // do not remove those infos, require by loop option...
        //this.path = "";
        //this._audio_ = null;

        if (this.wavesurfer) {
            this.wavesurfer.stop()
            this.wavesurfer.seekAndCenter(0)
        }

        this.playBtn.style.display = "block"
        this.pauseBtn.style.display = "none"

    }

    hidePlaylist() {
        this.playlist.style.display = "none"
        this.shuffleBtn.style.display = "none"
        this.skipNextBtn.style.display = "none"
        this.skipPresiousBtn.style.display = "none"
        this.trackInfo.style.display = "none"
    }

    showPlaylist() {
        this.playlist.style.display = ""
        this.shuffleBtn.style.display = ""
        this.skipNextBtn.style.display = ""
        this.skipPresiousBtn.style.display = ""
        this.trackInfo.style.display = ""
    }
}

customElements.define('globular-audio-player', AudioPlayer)