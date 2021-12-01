import { theme } from "./Theme";
import { Model } from '../Model';


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
            this.audio.style.maxWidth = this.parentNode.offsetWidth + "px"
        });
    }

    play(path) {
        if(!this.audio.paused && this.audio.currentSrc.endsWith(path)){
            // Do nothing...
            return
        }else if(this.audio.paused && this.audio.currentSrc.endsWith(path)){
            // Resume the audio...
            this.audio.play()
            return
        }

        // Set the path and play.
        this.audio.src = path
        this.video.src += "?application=" + Model.application
        if(localStorage.getItem("user_token")!=undefined){
            this.audio.src += "&token=" + localStorage.getItem("user_token")
        } 
        this.currentTrackTitle.innerHTML = path
   
        this.audio.style.maxWidth = this.parentNode.offsetWidth + "px"
    }

    stop(){
        this.audio.pause();
    }
}

customElements.define('globular-audio-player', AudioPlayer)