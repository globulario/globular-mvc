import { theme } from "./Theme";
import { Model } from '../Model';
import { Application } from "../Application";


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

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${theme}
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
        <div id="container">
            <audio controls autoplay>
            </audio>
            <span id="current-track-title"></span>
        </div>
        `
        // give the focus to the input.
        let container = this.shadowRoot.querySelector("#container")
        this.audio = this.shadowRoot.querySelector("audio")
        this.currentTrackTitle = this.shadowRoot.querySelector("#current-track-title")


        // Get the parent size and set the max width of te
        window.addEventListener("resize", ()=>{
            //this.audio.style.maxWidth = this.parentNode.offsetWidth + "px"
        });
    }

    play(path, globule) {
        console.log("play path ", globule,  path)

        if(!this.audio.paused && this.audio.currentSrc.endsWith(path)){
            // Do nothing...
            return
        }else if(this.audio.paused && this.audio.currentSrc.endsWith(path)){
            // Resume the audio...
            this.audio.play()
            return
        }

        let url = globule.config.Protocol + "://" +  globule.config.Domain
        if (globule.config.Protocol == "https") {
            if(globule.config.PortHttps!=443)
                url += ":" + globule.config.PortHttps
        } else {
            if(globule.config.PortHttps!=80)
                url +=  ":" + globule.config.PortHttp
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

        let values = path.split("/")
        this.currentTrackTitle.innerHTML = values[values.length - 1]
        //this.audio.style.maxWidth = this.parentNode.offsetWidth + "px"
    }

    stop(){
        this.audio.pause();
    }
}

customElements.define('globular-audio-player', AudioPlayer)