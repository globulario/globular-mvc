
import { theme } from "./Theme";
import { Model } from '../Model';
import { Application } from "../Application";
import Plyr from 'plyr';
import "./plyr.css"
import Hls from "hls.js";
import { ApplicationView } from "../ApplicationView";
import { GetFileTitlesRequest, GetFileVideosRequest } from "globular-web-client/title/title_pb";
import { setMoveable } from './moveable'
import { setResizeable } from './rezieable'

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
export function playVideo(path, onplay, onclose, title) {
    let videoPlayer = document.getElementById("video-player-x")

    if (videoPlayer == null) {
        videoPlayer = new VideoPlayer()
        videoPlayer.id = "video-player-x"
    }

    parent = document.getElementsByTagName("globular-workspace")[0];//document.body
    parent.appendChild(videoPlayer)

    if (onplay && !videoPlayer.onplay) {
        videoPlayer.onplay = onplay
    }

    // keep the title
    videoPlayer.title = title;

    if (onclose && !videoPlayer.onclose) {
        videoPlayer.onclose = onclose
    }

    videoPlayer.play(path)
    return videoPlayer
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

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${theme}
            #container{
                width: 720px;
                position: fixed;
            }

            .header{
                display: flex;
                align-items: center;
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
                <paper-icon-button id="video-close-btn" icon="icons:close"></paper-icon-button>
                <span id="title-span"></span>
            </div>
            <slot></slot>
        </paper-card>
        `

        let container = this.shadowRoot.querySelector("#container")

        // give the focus to the input.
        this.video = document.createElement("video")
        this.video.id = "player"
        this.video.autoplay = true
        this.video.controls = true
        this.onclose = null
        this.onplay = null

        this.appendChild(this.video)
        if (localStorage.getItem("__video_player_position__")) {
            let position = JSON.parse(localStorage.getItem("__video_player_position__"))
            container.style.top = position.top + "px"
            container.style.left = position.left + "px"
        } else {
            container.style.left = ((document.body.offsetWidth - 720) / 2) + "px"
            container.style.top = "80px"
        }

        if (localStorage.getItem("__video_player_dimension__")) {
            let dimension = JSON.parse(localStorage.getItem("__video_player_dimension__"))
            container.style.width = dimension.width + "px"
            container.style.height = "auto"
        }

        setResizeable(container, (width, height) => {
            localStorage.setItem("__video_player_dimension__", JSON.stringify({ width: width, height: height }))
            if (this.video > 0) {
                container.style.height = this.video.offsetHeight + "px"
            } else {
                container.style.height = "auto"
            }
        })
        container.resizeHeightDiv.style.display = "none"

        setMoveable(this.shadowRoot.querySelector(".header"), container, (left, top) => {
            localStorage.setItem("__video_player_position__", JSON.stringify({ top: top, left: left }))
        }, this)

        // Plyr give a nice visual to the video player.
        // TODO set the preview and maybe quality bitrate if possible...
        // So here I will get the vtt file if one exist...
        this.player = new Plyr(this.video);
        this.shadowRoot.querySelector("#video-close-btn").onclick = () => {
            this.close()
        }

        // HLS for streamming...
        this.hls = null;
        if (Hls.isSupported()) {
            this.hls = new Hls(
                {
                    xhrSetup: xhr => {
                        xhr.setRequestHeader('application', Model.application)
                        xhr.setRequestHeader('token', localStorage.getItem("user_token"))
                    }
                }
            );
        }
    }

    connectedCallback() {

    }

    play(path) {

        this.style.zIndex = 100
        // Set the title...
        let thumbnailPath = path.replace("/playlist.m3u8", "")
        this.shadowRoot.querySelector("#title-span").innerHTML = thumbnailPath.substring(thumbnailPath.lastIndexOf("/") + 1)
        this.shadowRoot.querySelector("#container").style.display = ""

        // So Here I will try to get the title or the video info...

        // Now I will test if imdb info are allready asscociated.
        let getTitleInfo = (path, callback) => {
            let rqst = new GetFileTitlesRequest
            rqst.setIndexpath(Model.globular.config.DataPath + "/search/titles")
            rqst.setFilepath(path)

            Model.globular.titleService.getFileTitles(rqst, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
                .then(rsp => {
                    callback(rsp.getTitles().getTitlesList())
                })
        }


        let getVideoInfo = (path, callback) => {
            let rqst = new GetFileVideosRequest
            rqst.setIndexpath(Model.globular.config.DataPath + "/search/videos")
            rqst.setFilepath(path)

            Model.globular.titleService.getFileVideos(rqst, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
                .then(rsp => {
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
                    }

                    Model.eventHub.publish("play_video_player_evt_", { _id: this.titleInfo.getId(), isVideo: this.titleInfo.isVideo, currentTime: this.video.currentTime, date: new Date() }, true)
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
        if (thumbnailPath.lastIndexOf(".mp4") != -1) {
            thumbnailPath = thumbnailPath.substring(0, thumbnailPath.lastIndexOf("."))
        } else if (!path.endsWith("/playlist.m3u8")) {
            path += "/playlist.m3u8"
        } else {
            ApplicationView.displayMessage("the file cannot be play by the video player", 3000)
            return
        }
        thumbnailPath = thumbnailPath.substring(0, thumbnailPath.lastIndexOf("/") + 1) + ".hidden" + thumbnailPath.substring(thumbnailPath.lastIndexOf("/")) + "/__timeline__/thumbnails.vtt"

        this.player.setPreviewThumbnails({ enabled: "true", src: thumbnailPath })


        if (!this.video.paused && this.video.currentSrc.endsWith(path)) {
            // Do nothing...
            return
        } else if (this.video.paused && this.video.currentSrc.endsWith(path)) {
            // Resume the video...
            this.video.play()
            return
        }

        // set the complete url.
        let url = window.location.protocol + "//" + window.location.hostname + ":"
        if (Application.globular.config.Protocol == "https") {
            url += Application.globular.config.PortHttps
        } else {
            url += Application.globular.config.PortHttp
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
        // Set the path and play.
        this.video.src = url

        if (path.endsWith(".m3u8")) {
            this.hls.attachMedia(this.video);
            this.hls.on(Hls.Events.MEDIA_ATTACHED, () => {
                this.hls.loadSource(url);
                this.hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
                    this.video.play();
                });
            });
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
        this.shadowRoot.querySelector("#container").style.display = "none"
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
            if( this.video.duration != this.video.currentTime){
                Model.eventHub.publish("stop_video_player_evt_", { _id: this.titleInfo.getId(), isVideo: this.titleInfo.isVideo, currentTime: this.video.currentTime, date: new Date() }, true)
            }else{
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