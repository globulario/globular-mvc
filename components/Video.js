
import { theme } from "./Theme";
import { Model } from '../Model';
import { Application } from "../Application";
import Plyr from 'plyr';
import "./plyr.css"


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
                background-color: var(--palette-primary-accent);
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

        this.shadowRoot.querySelector("#video-close-btn").onclick = ()=>{
            this.stop()
            this.shadowRoot.querySelector("#container").style.display = "none"
            if(this.onclose){
                this.onclose()
            }
        }
    }

    connectedCallback() {

    }

    play(path) {

        this.shadowRoot.querySelector("#title-span").innerHTML = path.substring(path.lastIndexOf("/") + 1)
        this.shadowRoot.querySelector("#container").style.display = ""

        let thumbnailPath = path
        // /users/sa/Fucking Her Way to Fame.mp4
        // /users/sa/.hidden/Fucking Her Way to Fame/__timeline__/thumbnails.vtt
        thumbnailPath = thumbnailPath.substring(0, thumbnailPath.lastIndexOf("."))
        thumbnailPath = thumbnailPath.substring(0, thumbnailPath.lastIndexOf("/") + 1) + ".hidden" + thumbnailPath.substring(thumbnailPath.lastIndexOf("/")) + "/__timeline__/thumbnails.vtt"
        console.log(thumbnailPath)
        // this.player
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
            url += "/" + encodeURIComponent(item.trim())
        })

        // Set the path and play.
        this.video.src = url
        this.video.src += "?application=" + Model.application
        if (localStorage.getItem("user_token") != undefined) {
            this.video.src += "&token=" + localStorage.getItem("user_token")
        }

        this.video.style.maxWidth = this.parentNode.offsetWidth + "px"

        if(this.onplay != null){
            this.onplay()
        }
    }

    stop() {
        this.video.pause();
    }
}

customElements.define('globular-video-player', VideoPlayer)