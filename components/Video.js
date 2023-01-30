
import { getTheme } from "./Theme";
import { generatePeerToken, Model } from '../Model';
import { Application } from "../Application";
import Plyr from 'plyr';
import "./plyr.css"
import Hls from "hls.js";
import { ApplicationView } from "../ApplicationView";
import { GetFileTitlesRequest, GetFileVideosRequest } from "globular-web-client/title/title_pb";
import { setMoveable } from './moveable'
import { setResizeable } from './rezieable'
import { File } from "../File"
import { formatBoolean, randomUUID } from "./utility";
import { PlayList } from "./Playlist"
import { readDir } from "globular-web-client/api";

Object.defineProperty(HTMLMediaElement.prototype, 'playing', {
    get: function () {
        return !!(this.currentTime > 0 && !this.paused && !this.ended && this.readyState > 2);
    }
})

String.prototype.endsWith = function (suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

/**
 * Function to play a video on the same player.
 * @param {*} path 
 * @param {*} onplay 
 * @param {*} onclose 
 */
export function playVideo(path, onplay, onclose, title, globule) {

    if (title) {
        if (title.globule) {
            globule = title.globule
        }
    }

    let menus = document.body.querySelectorAll("globular-dropdown-menu")
    for (var i = 0; i < menus.length; i++) {
        menus[i].close()
        if (menus[i].classList.contains("file-dropdown-menu")) {
            menus[i].parentNode.removeChild(menus[i])
        }
    }

    let videoPlayer = document.getElementById("video-player-x")

    if (videoPlayer == null) {
        videoPlayer = new VideoPlayer()
        videoPlayer.id = "video-player-x"
    } else {
        videoPlayer.stop()
    }

    videoPlayer.resume = false;
    videoPlayer.style.zIndex = 100

    ApplicationView.layout.workspace().appendChild(videoPlayer)

    if (onplay && !videoPlayer.onplay) {
        videoPlayer.onplay = onplay
    }

    // keep the title
    videoPlayer.titleInfo = title;
    videoPlayer.globule = globule;

    if (onclose && !videoPlayer.onclose) {
        videoPlayer.onclose = onclose
    }


    // clear the playlist...
    if (videoPlayer.playlist)
        videoPlayer.playlist.clear()

    // play a given title.
    if (path.endsWith("video.m3u") || path.startsWith("#EXTM3U")) {
        videoPlayer.loadPlaylist(path, globule)
        videoPlayer.showPlaylist()
    } else {
        videoPlayer.hidePlaylist()
        videoPlayer.play(path, globule)
    }


    return videoPlayer
}


function getSubtitlesFiles(globule, path, callback) {
    let subtitlesPath = path.substr(0, path.lastIndexOf("."))
    subtitlesPath = subtitlesPath.substring(0, subtitlesPath.lastIndexOf("/") + 1) + ".hidden" + subtitlesPath.substring(subtitlesPath.lastIndexOf("/")) + "/__subtitles__"


    File.readDir(subtitlesPath, false, callback, err => console.log(err), globule)

}

/**
 * Sample empty component
 */
export class VideoPlayer extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
        let hideheader = this.getAttribute("hideheader") != undefined
        this.titleInfo = null; // movie, serie title, video
        this.playlist = null; // The playlist...
        this.globule = null;
        this.skipPresiousBtn = null;
        this.stopBtn = null;
        this.skipNextBtn = null;
        this.loopBtn = null;
        this.shuffleBtn = null;
        this.trackInfo = null;
        this.loop = true;
        this.shuffle = false;
        this.resume = false;

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}
            #container{
                width: 720px;
                position: fixed;
            }

            #content{
                display: flex;
                background: #000000;
                justify-items: center;
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

            .header select {
                background: var(--palette-background-default); 
                color: var(--palette-text-accent);
                border:0px;
                outline:0px;
            }

            video{
                display: block;
                width:auto;
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
                
                <select id="audio-track-selector" style="display: none"></select>
                <paper-icon-button id="title-info-button" icon="icons:arrow-drop-down-circle"></paper-icon-button>
            </div>
            <div id="content" style="display: flex; background: black;">
                <globular-playlist style="display: none; min-width: 450px; overflow:hidden; height: 600px;"></globular-playlist>
                <slot></slot>
            </div>
        </paper-card>
        `

        let container = this.shadowRoot.querySelector("#container")
        let content = this.shadowRoot.querySelector("#content")


        this.shadowRoot.querySelector("#title-info-button").onclick = (evt) => {
            evt.stopPropagation()
            if (this.titleInfo) {
                if (this.titleInfo.clearActorsList != undefined) {
                    this.showTitleInfo(this.titleInfo)
                } else {
                    this.showVideoInfo(this.titleInfo)
                }
            } else {
                ApplicationView.displayMessage("no title information found", 3000)
            }

        }

        // give the focus to the input.
        this.video = document.createElement("video")
        this.video.id = "player"
        this.video.autoplay = true
        this.video.controls = true
        this.video.playsinline = true



        this.onclose = null
        this.onplay = null
        let offsetTop = this.shadowRoot.querySelector(".header").offsetHeight
        if (offsetTop == 0) {
            offsetTop = 60
        }
        this.path = ""
        this.appendChild(this.video)

        container.name = "video_player"
        setResizeable(container, (width, height) => {
            localStorage.setItem("__video_player_dimension__", JSON.stringify({ width: width, height: height }))
            container.style.height = "auto"
        })

        container.resizeHeightDiv.style.display = "none"
        container.style.height = "auto"

        // set the initial size of the video player to fit the played video...
        this.video.onplaying = (evt) => {
            if (this.resume) {
                return
            }

            this.resume = true

            if (this.video.videoHeight > 0 && this.video.videoWidth) {

                // event resize the video only if the video is new...
                this.playlist.style.height = this.video.videoHeight + "px"
                if (this.playlist.style.display == "none") {
                    container.style.width = this.video.videoWidth + "px"
                } else {
                    container.style.width = this.video.videoWidth + this.playlist.offsetWidth + "px"
                }
                localStorage.setItem("__video_player_dimension__", JSON.stringify({ width: this.video.videoWidth, height: this.video.videoHeight }))
            }
        }


        // toggle full screen when the user double click on the header.
        this.shadowRoot.querySelector(".header").ondblclick = () => {
            var type = this.player.media.tagName.toLowerCase(),
                toggle = document.querySelector("[data-plyr='fullscreen']");

            if (type === "video" && toggle) {
                toggle.addEventListener("click", this.player.toggleFullscreen, false);
            }
            toggle.click()
        }

        setMoveable(this.shadowRoot.querySelector("#title-span"), container, (left, top) => {
            /** */
        }, this, offsetTop)

        // Plyr give a nice visual to the video player.
        // TODO set the preview and maybe quality bitrate if possible...
        // So here I will get the vtt file if one exist...
        this.player = new Plyr(this.video, {
            captions: {
                active: true,
                update: true,// THAT line solved my problem
            }
        });

        this.shadowRoot.querySelector("#video-close-btn").onclick = () => {
            this.close()
        }

        // https://www.tomsguide.com/how-to/how-to-set-chrome-flags
        // you must set enable-experimental-web-platform-features to true
        // chrome://flags/ 
        this.video.onloadeddata = () => {

            getSubtitlesFiles(this.globule, this.path, subtitles_files => {

                let globule = this.globule
                let url = globule.config.Protocol + "://" + globule.domain

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

                subtitles_files.files.forEach(f => {
                    let track = document.createElement("track")
                    //   <track kind="captions" label="English captions" src="/path/to/captions.vtt" srclang="en" default />
                    track.kind = "captions"

                    // ex. View_From_A_Blue_Moon_Trailer-576p.fr.vtt
                    let language_id = f.name.split(".")[f.name.split.length - 1]
                    const languageNames = new Intl.DisplayNames([language_id], {
                        type: 'language'
                      });
                      
                    track.label =  languageNames.of(language_id)// todo set the true language.

                    let url_ = f.path

                    url_ = f.path
                    if (url_.startsWith("/")) {
                        url_ = url + url_
                    } else {
                        url_ = url + "/" + url_
                    }

                    track.src = url_

                    track.srclang = language_id

                    this.player.media.appendChild(track)

                })
            })

            if (this.video.audioTracks) {
                console.log(this.video.audioTracks)
                // This will set the video langual...
                if (this.video.audioTracks.length > 1) {
                    let audioTrackSelect = this.shadowRoot.querySelector("#audio-track-selector")
                    audioTrackSelect.style.display = "block"
                    for (let i = 0; i < this.video.audioTracks.length; i++) {
                        let track = this.video.audioTracks[i]
                        let option = document.createElement("option")
                        option.innerHTML = track.language
                        option.value = i
                        audioTrackSelect.appendChild(option)
                    }

                    // Set the language with the browser
                    let browser_language = navigator.language || navigator.userLanguage; // IE <= 10
                    for (let i = 0; i < this.video.audioTracks.length; i++) {
                        let track_language = this.video.audioTracks[i].language.substr(0, 2);

                        // +++ Set the enabled audio track language +++
                        if (track_language) {
                            // When the track language matches the browser language, then enable that audio track
                            if (track_language === browser_language) {
                                // When one audio track is enabled, others are automatically disabled
                                this.video.audioTracks[i].enabled = true;
                                audioTrackSelect.value = i
                                this.player.rewind(0)
                            } else {
                                this.video.audioTracks[i].enabled = false;
                            }
                        }
                    }

                    audioTrackSelect.onchange = (evt) => {
                        evt.stopPropagation()
                        if (this.player) {
                           
                            var selectElement = evt.target;
                            var value = selectElement.value;
                            for (let i = 0; i < this.video.audioTracks.length; i++) {
                                let track = this.video.audioTracks[i]
                                if (i == value) {
                                    track.enabled = true

                                    this.player.forward(0)
                                } else {
                                    track.enabled = false
                                }
                            }
                        }
                    }

                }
            }
        }

        // HLS for streamming...
        this.hls = null;

        this.playlist = this.shadowRoot.querySelector("globular-playlist")
        this.playlist.videoPlayer = this
    }

    connectedCallback() {
        if (this.skipPresiousBtn) {
            return
        }

        let controls = this.querySelector(".plyr__controls")
        controls.style.flexWrap = "wrap"
        controls.style.justifyContent = "flex-start"

        let plyrVideo = this.querySelector(".plyr--video")

        // add additional button for the playlist...
        let html = `
            <div style="flex-basis: 100%; height: 5px;"></div>
            <iron-icon style="--iron-icon-height: 32px; --iron-icon-width: 32px; fill: #424242;" class="plyr__controls__item plyr__control" title="Shuffle Playlist" id="shuffle" icon="av:shuffle"></iron-icon>
            <iron-icon style="--iron-icon-height: 32px; --iron-icon-width: 32px;" class="plyr__controls__item plyr__control" id="skip-previous" title="Previous Track" icon="av:skip-previous"></iron-icon>
            <iron-icon style="--iron-icon-height: 32px; --iron-icon-width: 32px;" class="plyr__controls__item plyr__control" id="skip-next" title="Next Track" icon="av:skip-next"></iron-icon>
            <iron-icon style="--iron-icon-height: 32px; --iron-icon-width: 32px;" class="plyr__controls__item plyr__control" id="stop" title="Stop" icon="av:stop"></iron-icon>
            <iron-icon style="--iron-icon-height: 32px; --iron-icon-width: 32px;" class="plyr__controls__item plyr__control" title="Loop Playlist" id="repeat" icon="av:repeat"></iron-icon>
            <div id="track-info"></div>
        `
        let range = document.createRange()
        controls.appendChild(range.createContextualFragment(html))

        // Now the buttons actions.
        this.skipPresiousBtn = this.querySelector("#skip-previous")
        this.stopBtn = this.querySelector("#stop")
        this.skipNextBtn = this.querySelector("#skip-next")
        this.loopBtn = this.querySelector("#repeat")
        this.shuffleBtn = this.querySelector("#shuffle")
        this.trackInfo = this.querySelector("#track-info")

        let playPauseBtn = controls.children[0]
        playPauseBtn.addEventListener("click", evt => {

            let state = evt.target.getAttribute("aria-label")
            if (state == "Play") {
                this.playlist.resumePlaying()
            } else if (state == "Pause") {
                this.playlist.pausePlaying()
            }

        }, true)

        plyrVideo.addEventListener("click", evt => {
            let state = playPauseBtn.getAttribute("aria-label")
            if (state == "Play") {
                this.playlist.resumePlaying()
            } else if (state == "Pause") {
                this.playlist.pausePlaying()
            }

        }, true)

        this.loop = false
        if (localStorage.getItem("video_loop")) {
            this.loop = localStorage.getItem("video_loop") == "true"
        }

        if (this.loop) {
            this.loopBtn.style.fill = "white"
        } else {
            this.loopBtn.style.fill = "gray"
        }

        this.shuffle = false
        if (localStorage.getItem("video_shuffle")) {
            this.shuffle = localStorage.getItem("video_shuffle") == "true"
        }

        if (this.shuffle) {
            this.shuffleBtn.style.fill = "white"
        } else {
            this.shuffleBtn.style.fill = "#424242"
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
                localStorage.setItem("video_loop", "false");
                this.loop = false;
            } else {
                localStorage.setItem("video_loop", "true")
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
                localStorage.setItem("video_shuffle", "false");
                this.shuffle = false;
            } else {
                localStorage.setItem("video_shuffle", "true")
                this.shuffle = true;
            }

            if (this.shuffle) {
                this.shuffleBtn.style.fill = "white"
            } else {
                this.shuffleBtn.style.fill = "#424242"
            }

            this.playlist.orderItems()
        }

    }

    loadPlaylist(path, globule) {
        this.playlist.clear()
        this.playlist.load(path, globule, this)

    }

    showPlaylist() {
        this.playlist.style.display = "block"
        let playlistButtons = this.querySelectorAll("iron-icon")
        for (var i = 0; i < playlistButtons.length; i++) {
            playlistButtons[i].style.display = "block"
        }
    }

    hidePlaylist() {
        this.playlist.style.display = "none"
        let playlistButtons = this.querySelectorAll("iron-icon")
        for (var i = 0; i < playlistButtons.length; i++) {
            playlistButtons[i].style.display = "none"
        }
    }

    setTarckInfo(index, total) {
        // display the position on the list...
        console.log("set " + index + " of " + total)
    }

    showVideoInfo(video) {
        let uuid = randomUUID()
        let html = `
        <paper-card id="video-info-box-dialog-${uuid}" style="padding: 15px; background: var(--palette-background-default); border-top: 1px solid var(--palette-background-paper); border-left: 1px solid var(--palette-background-paper);">
            <globular-informations-manager id="video-info-box"></globular-informations-manager>
        </paper-card>
        `
        let videoInfoBox = document.getElementById("video-info-box")


        if (videoInfoBox == undefined) {
            let range = document.createRange()
            document.body.appendChild(range.createContextualFragment(html))
            videoInfoBox = document.getElementById("video-info-box")
            let parent = document.getElementById("video-info-box-dialog-" + uuid)
            parent.style.position = "fixed"
            parent.style.top = "75px"
            parent.style.left = "50%"
            parent.style.transform = "translate(-50%)"
            videoInfoBox.onclose = () => {
                parent.parentNode.removeChild(parent)
            }
        }
        videoInfoBox.setVideosInformation([video])
    }

    showTitleInfo(title) {
        let uuid = randomUUID()
        let html = `
        <paper-card id="video-info-box-dialog-${uuid}" style="padding: 15px; background: var(--palette-background-default); border-top: 1px solid var(--palette-background-paper); border-left: 1px solid var(--palette-background-paper);">
            <globular-informations-manager id="title-info-box"></globular-informations-manager>
        </paper-card>
        `
        let titleInfoBox = document.getElementById("title-info-box")
        if (titleInfoBox == undefined) {
            let range = document.createRange()
            document.body.appendChild(range.createContextualFragment(html))
            titleInfoBox = document.getElementById("title-info-box")
            let parent = document.getElementById("video-info-box-dialog-" + uuid)
            parent.style.position = "fixed"
            parent.style.top = "75px"
            parent.style.left = "50%"
            parent.style.transform = "translate(-50%)"

            titleInfoBox.onclose = () => {
                parent.parentNode.removeChild(parent)
            }
        }
        titleInfoBox.setTitlesInformation([title])
    }

    play(path, globule, titleInfo) {
        if (titleInfo) {
            this.titleInfo = titleInfo
            this.titleInfo.globule = globule
        }

        generatePeerToken(globule, token => {
            let url = path;
            if (!url.startsWith("http")) {
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

                path.split("/").forEach(item => {
                    item = item.trim()
                    if (item.length > 0) {
                        url += "/" + encodeURIComponent(item)
                    }
                })

                url += "?application=" + Model.application
                url += "&token=" + token

            } else {
                var parser = document.createElement('a');
                parser.href = url
                path = decodeURIComponent(parser.pathname)
            }

            if (this.path == path) {
                this.resume = true;
                this.video.play()
                return
            } else {
                // keep track of the current path
                this.path = path
                this.resume = false;
            }

            // validate url access.
            fetch(url, { method: "HEAD" })
                .then((response) => {
                    if (response.status == 401) {
                        ApplicationView.displayMessage(`unable to read the file ${path} Check your access privilege`, 3500)
                        this.close()
                        return
                    } else if (response.status == 200) {
                        if (File.hasLocal) {
                            File.hasLocal(path, exists => {
                                if (exists) {
                                    // local-media
                                    this.play_(path, globule, true, token)
                                } else {
                                    this.play_(path, globule, false, token)
                                }
                            })
                        } else {
                            this.play_(path, globule, false, token)
                        }
                    } else {
                        throw new Error(response.status)
                    }
                })
                .catch((error) => {
                    ApplicationView.displayMessage("fail to read url " + url + "with error " + error, 4000)
                    if (this.parentNode) {
                        this.parentNode.removeChild(this)
                    }
                });

        }, err => ApplicationView.displayMessage(err, 4000))


    }

    play_(path, globule, local = false, token) {

        // replace separator...
        path = path.split("\\").join("/")

        this.style.zIndex = 100
        // Set the title...
        let thumbnailPath = path.replace("/playlist.m3u8", "")
        this.shadowRoot.querySelector("#title-span").innerHTML = thumbnailPath.substring(thumbnailPath.lastIndexOf("/") + 1)
        this.shadowRoot.querySelector("#container").style.display = ""

        // So Here I will try to get the title or the video info...
        if (!globule) {
            globule = Model.globular
        }

        // Now I will test if imdb info are allready asscociated.
        let getTitleInfo = (path, callback) => {
            // The title info is already set...
            if (this.titleInfo) {
                if (this.titleInfo.getName != undefined) {
                    this.titleInfo.isVideo = false;
                    callback([this.titleInfo])
                    return
                } else {
                    this.titleInfo.isVideo = true;
                    callback([])
                    return
                }
            }

            let rqst = new GetFileTitlesRequest
            rqst.setIndexpath(globule.config.DataPath + "/search/titles")
            rqst.setFilepath(path)

            globule.titleService.getFileTitles(rqst, { application: Application.application, domain: Application.domain, token: token })
                .then(rsp => {
                    rsp.getTitles().getTitlesList().forEach(t => t.globule = globule)
                    callback(rsp.getTitles().getTitlesList())
                })
        }


        let getVideoInfo = (path, callback) => {
            if (this.titleInfo) {
                if (this.titleInfo.getDescription != undefined) {
                    this.titleInfo.isVideo = true;
                    callback([this.titleInfo])
                    return
                } else {
                    this.titleInfo.isVideo = false;
                    callback([])
                    return
                }
            }

            let rqst = new GetFileVideosRequest
            rqst.setIndexpath(globule.config.DataPath + "/search/videos")
            rqst.setFilepath(path)

            globule.titleService.getFileVideos(rqst, { application: Application.application, domain: Application.domain, token: token })
                .then(rsp => {
                    rsp.getVideos().getVideosList().forEach(v => v.globule = globule)
                    callback(rsp.getVideos().getVideosList())
                })
        }

        getVideoInfo(path, videos => {
            if (videos.length > 0) {
                let video = videos.pop()
                this.titleInfo = video
                this.titleInfo.isVideo = true
                this.shadowRoot.querySelector("#title-span").innerHTML = video.getDescription().replace("</br>", " ")
                // Start where the video was stop last time... TODO 
                if (this.titleInfo) {
                    if (localStorage.getItem(this.titleInfo.getId())) {
                        let currentTime = parseFloat(localStorage.getItem(this.titleInfo.getId()))
                        this.video.currentTime = currentTime
                    }

                    this.video.onended = () => {
                        console.log("the video is ended....")
                        this.resume = false;
                        localStorage.removeItem(this.titleInfo.getId())
                        if (this.playlist.items.length > 1) {
                            this.playlist.playNext()
                        } else if (this.loop) {
                            if (File.hasLocal) {
                                File.hasLocal(this.path, exists => {
                                    this.play(this.path, this.titleInfo.globule)
                                })
                            } else {
                                this.play(this.path, this.titleInfo.globule)
                            }
                        } else {
                            this.stop()
                        }
                    }

                    //Model.eventHub.publish("play_video_player_evt_", { _id: this.titleInfo.getId(), isVideo: this.titleInfo.isVideo, currentTime: this.video.currentTime, date: new Date() }, true)
                }

            }
        })

        getTitleInfo(path, tittles => {
            if (tittles.length > 0) {
                let title = tittles.pop()
                this.titleInfo = title
                this.titleInfo.isVideo = false
                this.shadowRoot.querySelector("#title-span").innerHTML = title.getName()
                if (title.getYear()) {
                    this.shadowRoot.querySelector("#title-span").innerHTML += " (" + title.getYear() + ") "
                }
                if (title.getType() == "TVEpisode") {
                    this.shadowRoot.querySelector("#title-span").innerHTML += " S" + title.getSeason() + "E" + title.getEpisode()
                }

                if (this.onplay != null) {
                    this.onplay(this.player, title)
                }

                // Start where the video was stop last time... TODO 
                if (this.titleInfo) {
                    if (localStorage.getItem(this.titleInfo.getId())) {
                        let currentTime = parseFloat(localStorage.getItem(this.titleInfo.getId()))
                        this.video.currentTime = currentTime
                    }
                    Model.eventHub.publish("play_video_player_evt_", { _id: this.titleInfo.getId(), isVideo: this.titleInfo.isVideo, currentTime: this.video.currentTime, duration: this.video.duration, date: new Date() }, true)
                }
            }
        })

        // Only HLS and MP4 are allow by the video player so if is not one it's the other...
        if (thumbnailPath.lastIndexOf(".mp4") != -1 || thumbnailPath.lastIndexOf(".MP4") != -1) {
            thumbnailPath = thumbnailPath.substring(0, thumbnailPath.lastIndexOf("."))
        } else if (!path.endsWith("/playlist.m3u8")) {
            path += "/playlist.m3u8"
        } else {

            if (!(path.endsWith("/playlist.m3u8") || path.endsWith(".mp4") || path.endsWith(".webm"))) {
                ApplicationView.displayMessage("the file cannot be play by the video player", 3000)
                return
            }
        }

        thumbnailPath = thumbnailPath.substring(0, thumbnailPath.lastIndexOf("/") + 1) + ".hidden" + thumbnailPath.substring(thumbnailPath.lastIndexOf("/")) + "/__timeline__/thumbnails.vtt"

        // set the complete url.
        // Get image from the globule.
        let url = globule.config.Protocol + "://" + globule.domain

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


        if (thumbnailPath.startsWith("/")) {
            thumbnailPath = url + thumbnailPath
        } else {
            thumbnailPath = url + "/" + thumbnailPath
        }

        this.player.setPreviewThumbnails({ enabled: "true", src: thumbnailPath })

        if (!this.video.paused && this.video.currentSrc.endsWith(path)) {
            // Do nothing...
            return
        } else if (this.video.paused && this.video.currentSrc.endsWith(path)) {
            // Resume the video...
            this.video.play()
            return
        }

        path.split("/").forEach(item => {
            item = item.trim()
            if (item.length > 0) {
                url += "/" + encodeURIComponent(item)
            }
        })

        url += "?application=" + Model.application
        url += "&token=" + token


        if (local) {
            url = "local-media://" + path
        }

        // Set the path and play.
        this.video.src = url

        if (path.endsWith(".m3u8")) {
            if (Hls.isSupported()) {
                this.hls = new Hls(
                    {
                        xhrSetup: xhr => {
                            xhr.setRequestHeader('application', Model.application)
                            xhr.setRequestHeader('token', token)
                        }
                    }
                );

                this.hls.attachMedia(this.video);

                this.hls.on(Hls.Events.MEDIA_ATTACHED, () => {
                    this.hls.loadSource(url);
                    this.hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
                        this.video.play();
                    });
                });
            }
        }

        if (this.parentNode.offsetWidth > 0) {
            this.video.style.maxWidth = this.parentNode.offsetWidth + "px"
        }


    }

    /**
     * Close the player...
     */
    close() {
        this.stop()
        if (this.parentNode)
            this.parentElement.removeChild(this)

        if (this.onclose) {
            this.onclose()
        }
    }

    /**
     * Stop the video.
     */
    stop() {
        this.video.pause();
        // keep the current video location
        if (this.titleInfo != null) {

            // Stop the video
            if (this.video.duration != this.video.currentTime) {
                Model.eventHub.publish("stop_video_player_evt_", { _id: this.titleInfo.getId(), isVideo: this.titleInfo.isVideo, currentTime: this.video.currentTime, date: new Date() }, true)
            } else {
                Model.eventHub.publish("remove_video_player_evt_", { _id: this.titleInfo.getId(), isVideo: this.titleInfo.isVideo, currentTime: this.video.currentTime, date: new Date() }, true)
            }
            // keep video info in the local storage...
            localStorage.setItem(this.titleInfo.getId(), this.video.currentTime)
        }
    }

    hideHeader() {
        this.shadowRoot.querySelector(".header").style.display = "none";
    }

    showHeader() {
        this.shadowRoot.querySelector(".header").style.display = "";
    }

    setHeight(h) {
        this.querySelector("video").style.maxHeight = h + "px"
    }

    resetHeight() {
        this.querySelector("video").style.maxHeight = ""
    }
}

customElements.define('globular-video-player', VideoPlayer)