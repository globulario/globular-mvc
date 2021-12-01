
/**
 * This is the globular server console.
 */
import { theme } from "./Theme";
import { Model } from '../Model';
import { Application } from "../Application";

/**
 * The Globular console.
 */
export class Console extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        this.onenterfullscreen = null
        this.onexitfullscreen = null
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
         <style>
             ${theme}
   

             paper-card{
                position: relative;
                display: flex;
                flex-direction: column;
                width: 100%;
                height: 100%;
                font: 1rem Inconsolata, monospace;
                text-shadow: 0 0 1px #C8C8C8;
                background: repeating-linear-gradient(
                    0deg,
                    rgba(black, 0.15),
                    rgba(black, 0.15) 1px,
                    transparent 1px,
                    transparent 2px
                  );
            }

            
            .title{
                text-align: center;
                height: 20px;
                padding-top: 10px;
                padding-bottom: 10px;
                color: var(--palette-action-disabled);
                
                flex-grow: 1;
            }

            .error_message{
                color: var(--palette-secondary-main);
            }

            .info_message{
                color: var(--palette-secondary-light);
            }

         </style>
         <paper-card>
            <div style="display: flex; width: 100%; border-bottom: 1px solid var(--palette-action-disabled);">
                <span class="title"></span>
                <paper-icon-button icon="icons:fullscreen" id="enter-full-screen-btn"></paper-icon-button>
                <paper-icon-button icon="icons:fullscreen-exit" id="exit-full-screen-btn" style="display: none;"></paper-icon-button>
            </div>
            <div id="container" style="flex-grow: 1; height: 30vh; overflow-y: auto;">
            </div>
            
         </paper-card>
         `

        this.enterFullScreenBtn = this.shadowRoot.querySelector("#enter-full-screen-btn")
        this.exitFullScreenBtn = this.shadowRoot.querySelector("#exit-full-screen-btn")

        // I will use the resize event to set the size of the file explorer.
        this.exitFullScreenBtn.onclick = () => {
            this.enterFullScreenBtn.style.display = "block"
            this.exitFullScreenBtn.style.display = "none"
            this.style.position = ""
            this.style.top = ""
            this.style.bottom = ""
            this.style.right = ""
            this.style.left = ""
            this.shadowRoot.querySelector("#container").style.height = "30vh "
            document.querySelector("globular-console").style.display = ""
            if (this.onexitfullscreen) {
                this.onexitfullscreen()
            }
        }

        this.enterFullScreenBtn.onclick = () => {
            this.style.position = "absolute"
            this.style.top = "60px"
            this.style.bottom = "00px"
            this.style.right = "0px"
            this.style.left = "0px"
            this.enterFullScreenBtn.style.display = "none"
            this.exitFullScreenBtn.style.display = "block"

            if (this.onenterfullscreen) {
                this.onenterfullscreen()
            }
        }
    }

    printMessage(info) {
        let method = "NA"
        if (info["method"] != undefined) {
            method = info["method"]
        }

        if (info["functionName"] != undefined) {
            method = info["functionName"]
        }
        let numberOfOccurence = info["occurences"].length
        let lastOccurence = info["occurences"].pop()
        let messageTime = new Date(lastOccurence.date / 1000)
        let line = ""
        let text = ""
        // Now the message itself...
        if (info["message"] != undefined) {

            let msg = info["message"]
            if (msg.startsWith("rpc")) {
                let startIndex = msg.indexOf("{")
                let lastIndex = msg.lastIndexOf("}") + 1
                let jsonStr = msg.substring(startIndex, lastIndex)
                let obj = JSON.parse(jsonStr)
                if (obj["FileLine"] != null) {
                    line = obj["FileLine"]
                }
                if (obj["ErrorMsg"] != null) {
                    text = obj["ErrorMsg"]
                }

            } else {
                if (info["line"] != null) {
                    line = info["line"]
                }
                text = msg
            }

            // Now I will display the message in the console.
            if (text.length > 0) {
                let range = document.createRange()
                let html = `
                <div  style="padding-top: 10px;">
                    <div class="${info["level"].toLowerCase()}"  style="word-break: break-all;">${line}</div>
                    <div  style="word-break: break-all;">${text}</div>
                </div>
                `
                this.shadowRoot.querySelector("#container").appendChild(range.createContextualFragment(html))
                this.gotoBottom()
            }
        }



    }

    /**
 * Go to the bottom of the div...
 */
    gotoBottom() {
        var element = this.shadowRoot.querySelector("#container");
        element.scrollTop = element.scrollHeight - element.clientHeight;
    }


    /**
     * The this is call at login time.
     */
    connectedCallback() {
        this.shadowRoot.querySelector(`.title`).innerHTML = `Console @${Application.globular.config.Domain} Globular ${Application.globular.config.Version}`
        if (this.new_log_evt_listener == undefined) {
            Model.eventHub.subscribe("new_log_evt", uuid => this.new_log_evt_listener = uuid,
                evt => {
                    this.printMessage(JSON.parse(evt))
                }, false)
        }

    }
}

customElements.define('globular-console', Console)