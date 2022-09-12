import { getTheme } from "./Theme";
import { Model } from '../Model';
import { Application } from "../Application";
import { ApplicationView } from "../ApplicationView";
import { GetFileVideosRequest } from "globular-web-client/title/title_pb";
import { AUDIO } from "./visualizer"

function getVideoInfo(globule, path, callback) {

    let rqst = new GetFileVideosRequest
    console.log("read title for file ", path)
    rqst.setIndexpath(globule.config.DataPath + "/search/videos")
    rqst.setFilepath(path)

    globule.titleService.getFileVideos(rqst, { application: Application.application, domain: globule.config.Domain, token: localStorage.getItem("user_token") })
        .then(rsp => {
            let videos = rsp.getVideos().getVideosList()
            callback(videos)
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

    // keep the title
    audioPlayer.title = title;

    if (onclose && !audioPlayer.onclose) {
        audioPlayer.onclose = onclose
    }

    // play a given title.
    audioPlayer.play(path, globule, title)

    return audioPlayer
}

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

        this.title = null;

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}
            #container{
                max-width: 500px;
                padding: 15px;
                display: flex;
                flex-direction: column;
            }

            audio{
                display: block;
                min-width: 400px;
                width:auto;
                height: auto;
                height: 50px;
                width: 100%;
            }

            #current-track-title{
                font-size: 1.1rem;
                padding: 15px;
            }

        </style>
        <slot></slot>
        `

        // so here I will use the ligth dom...
        let content = `
        <div class="vz-wrapper">
            <audio id="myAudio"></audio>
            <div class="vz-wrapper -canvas">
                <canvas id="myCanvas" width="800" height="400"></canvas>
            </div>
        </div>
        `

        let range = document.createRange()
        this.appendChild(range.createContextualFragment(content))


        this.visualizer = null;

        // give the focus to the input.
        this.audio = this.querySelector("audio")
        this.currentTrackTitle = this.shadowRoot.querySelector("#current-track-title")


        // Get the parent size and set the max width of te
        window.addEventListener("resize", () => {
            //this.audio.style.maxWidth = this.parentNode.offsetWidth + "px"
        });

    }

    // The connection callback.
    connectedCallback() {
        // create the visualizer once.
        if (this.visualizer) {
            return
        }


    }

    play(path, globule) {

        let filename = path.substring(path.lastIndexOf("/") + 1)
        if (!this.audio.paused && this.audio.currentSrc.indexOf(filename) != -1) {
            // Do nothing...
            return
        } else if (this.audio.paused && this.audio.currentSrc.indexOf(filename) != -1) {
            // Resume the audio...
            this.visualizer.playSound()
            return
        }

        getVideoInfo(globule, path, titles => {

            // Now I will set the visualizer...
            if (this.visualizer == null) {
                this.visualizer = AUDIO.VISUALIZER.getInstance({
                    autoplay: false,
                    loop: true,
                    audio: 'myAudio',
                    canvas: 'myCanvas',
                    style: 'lounge',
                    barWidth: 2,
                    barHeight: 2,
                    barSpacing: 7,
                    barColor: '#cafdff',
                    shadowBlur: 20,
                    shadowColor: '#ffffff',
                    font: ['12px', 'Helvetica']
                });
            } else {
                this.visualizer.pauseSound()
            }

            if (titles.length > 0) {

                let title = titles[0].getDescription()
                this.audio.setAttribute("data-title", title)
                this.audio.setAttribute("data-author", "")
                if (title.indexOf(" - ") != -1) {
                    // Try the best to get correct values...
                    this.audio.setAttribute("data-title", title.split(" - ")[1])
                    this.audio.setAttribute("data-author", title.split(" - ")[0].trim())
                }

            } else {
                let values = path.split("/")
                this.audio.setAttribute("data-title", values[values.length - 1])
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

            // Set the path and play.
            this.audio.src = url
            this.visualizer.setContext()
                .setAnalyser()
                .setFrequencyData()
                .setBufferSourceNode()
                
            this.visualizer.loadSound()
        })




    }

    stop() {
        if (this.visualizer)
            this.visualizer.pauseSound()
    }
}

customElements.define('globular-audio-player', AudioPlayer)