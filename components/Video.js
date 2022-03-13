
import { theme } from "./Theme";
import { Model } from '../Model';
import { Application } from "../Application";
import Plyr from 'plyr';
import "./plyr.css"
import Hls, { ElementaryStreamTypes } from "hls.js";


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
export function playVideo(path, onplay, onclose) {

    let videoPlayer = document.getElementById("video-player-x")
    if (videoPlayer == null) {
        videoPlayer = new VideoPlayer()
        videoPlayer.id = "video-player-x"
        document.body.appendChild(videoPlayer)
        videoPlayer.style.position = "fixed"
        videoPlayer.style.top = "50%"
        videoPlayer.style.left = "50%"
        videoPlayer.style.transform = "translate(-50%, -50%)"
    }

    videoPlayer.onplay = onplay
    videoPlayer.onclose = onclose
    videoPlayer.play(path)
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

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${theme}
            #container{
                max-width: 1080px;
                margin: 10px;
            }

            .header{
                display: flex;
                align-items: center;
            }

            .header span{
                flex-grow: 1;
                text-align: center;
            }

            video{
                display: block;
                width:auto;
                height: auto;
            }

            paper-card {
                background: var(--palette-background-default); 
                border-top: 1px solid var(--palette-background-paper);
                border-left: 1px solid var(--palette-background-paper);
            }
        </style>
        <paper-card id="container">
            <div class="header">
                <paper-icon-button id="video-close-btn" icon="icons:close"></paper-icon-button>
                <span id="title-span"></span>
            </div>
            <slot></slot>
        </paper-card>
        `
        // <!--video id="player" controls autoplay></video-->

        // give the focus to the input.
        this.video = document.createElement("video")// this.shadowRoot.querySelector("video")
        this.video.id = "player"
        this.video.autoplay = true
        this.video.controls = true
        this.onclose = null
        this.onplay = null


        this.appendChild(this.video)

        // Plyr give a nice visual to the video player.
        // TODO set the preview and maybe quality bitrate if possible...
        // So here I will get the vtt file if one exist...
        this.player = new Plyr(this.video);

        // Get the parent size and set the max width of te
        window.addEventListener("resize", () => {
            this.video.style.maxWidth = this.parentNode.offsetWidth + "px"
        });

        this.shadowRoot.querySelector("#video-close-btn").onclick = () => {
            this.stop()
            this.shadowRoot.querySelector("#container").style.display = "none"
            if (this.onclose) {
                this.onclose()
            }
        }

        // HLS for streamming...
        this.hls = null;
        if (Hls.isSupported()) {
            this.hls = new Hls();
        }
    }

    connectedCallback() {

    }

    play(path) {

        // Set the title...
        let thumbnailPath = path.replace("/playlist.m3u8", "")

        this.shadowRoot.querySelector("#title-span").innerHTML = thumbnailPath.substring(thumbnailPath.lastIndexOf("/") + 1)
        this.shadowRoot.querySelector("#container").style.display = ""
       
        if(thumbnailPath.lastIndexOf(".")!= -1){
            thumbnailPath = thumbnailPath.substring(0, thumbnailPath.lastIndexOf("."))
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
            console.log(url)
            this.hls.attachMedia(this.video);
            this.hls.on(Hls.Events.MEDIA_ATTACHED, () => {
                console.log('video and hls.js are now bound together !');
                this.hls.loadSource(url);
                this.hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
                    console.log(
                        'manifest loaded, found ' + data.levels.length + ' quality level'
                    );
                    this.video.play();
                });
            });
        }

        this.video.style.maxWidth = this.parentNode.offsetWidth + "px"

        if (this.onplay != null) {
            this.onplay()
        }

    }

    /**
     * Stop the video.
     */
    stop() {
        this.video.pause();
    }
}

customElements.define('globular-video-player', VideoPlayer)