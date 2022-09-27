import { getTheme } from "./Theme";
import { Model } from '../Model';
import { Application } from "../Application";
import { ApplicationView } from "../ApplicationView";
import { GetFileVideosRequest } from "globular-web-client/title/title_pb";
import { setMoveable } from './moveable'
import WaveSurfer from "wavesurfer.js";
import { PlayList } from "./Playlist"
import { fireResize } from "./utility";

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

    let audioPlayer = document.getElementById("audio-player-x")

    if (audioPlayer == null) {
        audioPlayer = new AudioPlayer()
        audioPlayer.id = "audio-player-x"
    } else {
        audioPlayer.stop()
        audioPlayer.playlist.clear()
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
    if (path.endsWith("audio.m3u") || path.startsWith("#EXTM3U")) {
        audioPlayer.loadPlaylist(path, globule)
        audioPlayer.showPlaylist()
    } else {
        audioPlayer.play(path, globule, title)
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
            ${getTheme()}
            #container{
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
                height: 600px;
                display: flex;
                background: #000000;
                justify-items: center;
                overflow: hidden;
            }

            /** Audio vizualizer **/
            .vz-wrapper {
                width: 600px;
                height: 600px;
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

            audio {
                display: none;
            }

            .album-name {
                font-size: 1.5rem;
                font-weight: 500;
            }

            .album-year {
                font-size: 1.5rem;
                padding-left: 20px;
            }

            .track-title {
                font-size: 1.6rem;
            }

        </style>
        <audio></audio>
        <div id="content">
            <globular-playlist></globular-playlist>

            <div class="vz-wrapper" style="display: flex; justify-content: center;">
               
                <div style="display: flex;">
                    <span class="album-name"></span>
                    <span class="album-year"></span>
                </div>

                <img class="album-cover"> </img>
                <span class="track-title"> </span>

                <div id="waveform"></div>
                <div class="buttons">
                    <div style="flex-grow: 1; display: flex; align-items: center; width: 95%;">
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
        </div>
        `


        let range = document.createRange()
        this.appendChild(range.createContextualFragment(content))

        // The audio element.
        this.audio = this.querySelector("audio")

        // The presentation elements...
        this.albumName = this.querySelector(".album-name")
        this.albumYear = this.querySelector(".album-year")
        this.ablumCover = this.querySelector(".album-cover")
        this.trackTitle = this.querySelector(".track-title")

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

        this.loop = false
        if (localStorage.getItem("audio_loop")) {
            this.loop = localStorage.getItem("audio_loop") == "true"
        }

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
            <paper-card id="volume-panel" style="position: absolute; top:42px; right: 0px;">
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
            hideScrollbar: true
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

        })

        this.wavesurfer.on("finish", () => {
            this.stop()
            if (this.playlist) {
                this.playlist.playNext()
            }
        })

        fireResize()
    }

    play(path, globule, audio) {

        this.shadowRoot.querySelector("#container").style.display = "block"

        this.stop()
        this.playBtn.style.display = "block"
        this.pauseBtn.style.display = "none"

        if (audio) {
            // TODO see how to get the featuring info...
            this.shadowRoot.querySelector("#title-span").innerHTML = audio.getAlbum()

            this.albumName.innerHTML = audio.getAlbum()
            this.albumYear.innerHTML = audio.getYear()
            this.ablumCover.src = audio.getPoster().getContenturl()
            this.trackTitle.innerHTML = audio.getTitle()

        } else {
            let end = path.lastIndexOf("?")
            if (end == -1) {
                end = path.length
            }
        }

        let url = ""

        if (path.startsWith("http")) {
            url = path;
        } else {
            url = globule.config.Protocol + "://" + globule.config.Domain
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

            url += path

            url += "?application=" + Model.application
            if (localStorage.getItem("user_token") != undefined) {
                url += "&token=" + localStorage.getItem("user_token")
            }
        }

        this.audio.src = url
        this.wavesurfer.load(this.audio)
    }

    // load the playlist...
    loadPlaylist(path, globule) {
        this.playlist.clear()
        this.playlist.load(path, globule, this)
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
        this.shadowRoot.querySelector("#container").style.display = "none"
        if (this.onclose) {
            this.onclose()
        }
    }

    stop() {

        this.playSlider.value = 0;

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
    }

    showPlaylist() {
        this.playlist.style.display = ""
        this.shuffleBtn.style.display = ""
        this.skipNextBtn.style.display = ""
        this.skipPresiousBtn.style.display = ""
    }
}

customElements.define('globular-audio-player', AudioPlayer)