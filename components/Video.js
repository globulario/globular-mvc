
import { theme } from "./Theme";
import { Model } from '../Model';
import { Application } from "../Application";

Object.defineProperty(HTMLMediaElement.prototype, 'playing', {
    get: function () {
        return !!(this.currentTime > 0 && !this.paused && !this.ended && this.readyState > 2);
    }
})

String.prototype.endsWith = function (suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

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
                max-width: 500px;
            }

            video{
                display: block;
                width:auto;
                height: auto;
            }
        </style>
        <div id="container">
            <video controls autoplay>
            </video>
        </div>
        `
        // give the focus to the input.
        let container = this.shadowRoot.querySelector("#container")
        this.video = this.shadowRoot.querySelector("video")


        // Get the parent size and set the max width of te
        window.addEventListener("resize", () => {
            this.video.style.maxWidth = this.parentNode.offsetWidth + "px"
        });
    }

    play(path) {

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

        // Set the path and play.
        this.video.src = url + path
        this.video.src += "?application=" + Model.application
        if (localStorage.getItem("user_token") != undefined) {
            this.video.src += "&token=" + localStorage.getItem("user_token")
        }

        this.video.style.maxWidth = this.parentNode.offsetWidth + "px"
    }

    stop() {
        this.video.pause();
    }
}

customElements.define('globular-video-player', VideoPlayer)