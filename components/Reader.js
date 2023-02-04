
import { Model } from '../Model';
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
           
        </style>
        
        <iframe id="frame" style="width: 100%; height: 100%; border: none;"></iframe>
        `
        // give the focus to the input.
        this.frame = this.shadowRoot.querySelector("#frame")
    }

    read(file) {
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
        if (localStorage.getItem("user_token") != undefined) {
            this.frame.src += "&token=" + localStorage.getItem("user_token")
        }

        // must be white...
        this.frame.style.background = "white";
        this.frame.contentWindow.document.body.style.backgroundColor = "white";
    }

}

customElements.define('globular-file-reader', GlobularFileReader)