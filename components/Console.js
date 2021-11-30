
/**
 * This is the globular server console.
 */
import { theme } from "./Theme";
import { Model } from '../Model';

/**
 * The Globular console.
 */
export class Console extends HTMLElement {
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

            .error_message{
                color: var(--palette-secondary-main);
            }

            .info_message{
                color: var(--palette-secondary-light);
            }

         </style>
         <paper-card>
            <div id="container" style="flex-grow: 1; height: 30vh; overflow-y: auto;">
            </div>
            
         </paper-card>
         `
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
        if (this.new_log_evt_listener == undefined) {
            Model.eventHub.subscribe("new_log_evt", uuid => this.new_log_evt_listener = uuid,
                evt => {
                    this.printMessage(JSON.parse(evt))
                }, false)
        }

    }
}

customElements.define('globular-console', Console)