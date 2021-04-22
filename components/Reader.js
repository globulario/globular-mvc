import { theme } from "./Theme";
import { Model } from '../Model';
import { Application } from "../Application";

/**
 * Sample empty component
 */
export class FileReader extends HTMLElement {
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
                display: flex;
            }


        </style>
        <div id="container">
            <iframe id="frame" style="width: 100%;"></iframe>
        </div>
        `
        // give the focus to the input.
        let container = this.shadowRoot.querySelector("#container")
        this.frame = this.shadowRoot.querySelector("#frame")

        // Get the parent size and set the max width of te
        window.addEventListener("resize", () => {
            this.frame.style.height = this.parentNode.offsetHeight + "px"
        });
    }

    read(path) {
        // Read the file...
        let url = window.location.protocol + "//" + window.location.hostname  + ":"
        if(Application.globular.config.Protocol == "https"){
            url += Application.globular.config.PortHttps
        }else{
            url += Application.globular.config.PortHttp
        }
    
        // Set the file location.
        this.frame.src =url + path
        this.frame.style.height = this.parentNode.offsetHeight + "px"
        // must be white...
        this.frame.style.background = "white";
        this.frame.contentWindow.document.body.style.backgroundColor = "white";
    }

}

customElements.define('globular-file-reader', FileReader)