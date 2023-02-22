
import { generatePeerToken, Model } from '../Model';
import { Application } from "../Application";

/**
 * Sample empty component
 */
export class GlobularFileReader extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
            ::-webkit-scrollbar {
                width: 5px;
                height: 5px;
            }
                
            ::-webkit-scrollbar-track {
                background: var(--palette-background-default);
            }
            
            ::-webkit-scrollbar-thumb {
                background: var(--palette-divider); 
            }

            #title{
                flex-grow: 1;
                text-align: center;
                font-size: 1.2rem;
            }

            #header{
                display: flex;
                align-items: center;
                background-color: rgb(50, 54, 57);
            }

        </style>
        <div id="content"  style="width: 100%; height: calc(100% - 40px);">
            <div id="header">
                <span id="title"></span>
                <paper-icon-button icon="icons:close" id="close-btn" style="--iron-icon-fill-color: var(--palette-text-accent);"></paper-icon-button>
            </div>
            <iframe id="frame" style="width: 100%; height: 100%; border: none;"></iframe>

        </div>
        `

        // give the focus to the input.
        this.frame = this.shadowRoot.querySelector("#frame")
        this.closeBtn = this.shadowRoot.querySelector("#close-btn")
        this.content = this.shadowRoot.querySelector("#content")
        this.file = null;
        this.onclose = null;
        this.titleDiv = this.shadowRoot.querySelector("#title")

        this.closeBtn.onclick = ()=>{
            this.content.style.display = "none"
            if(this.onclose){
                this.onclose()
            }
        }
    }

    read(file) {

        this.file = file;

        // Read the file...
        let url = file.globule.config.Protocol + "://" + file.globule.domain + ":"
        if (file.globule.config.Protocol == "https") {
            url += file.globule.config.PortHttps
        } else {
            url += file.globule.config.PortHttp
        }

        file.path.split("/").forEach(item => {
            url += "/" + encodeURIComponent(item.trim())
        })

        // Set the file location.
        this.frame.src = url
        this.frame.src += "?application=" + Model.application

        generatePeerToken(file.globule, token => {
            this.frame.src += "&token=" + token
        })

        // must be white...
        this.content.style.display = ""
        this.frame.style.background = "white";
        this.titleDiv.innerHTML = this.file.path.split("/")[this.file.path.split("/").length - 1]
    }

}

customElements.define('globular-file-reader', GlobularFileReader)