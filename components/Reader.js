import { theme } from "./Theme";
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
            ${theme}
        </style>
        
        <iframe id="frame" style="width: 100%; height: 100%; border: none;"></iframe>
        `
        // give the focus to the input.
        this.frame = this.shadowRoot.querySelector("#frame")
    }

    read(path) {
        // Read the file...
        let url = window.location.protocol + "//" + window.location.hostname  + ":"
        if(Application.globular.config.Protocol == "https"){
            url += Application.globular.config.PortHttps
        }else{
            url += Application.globular.config.PortHttp
        }

        path.split("/").forEach(item=>{
            url += "/" +  encodeURIComponent(item.trim())
        })

    
        // Set the file location.
        this.frame.src =url
        this.frame.src += "?application=" + Model.application
        if(localStorage.getItem("user_token")!=undefined){
            this.frame.src += "&token=" + localStorage.getItem("user_token")
        }
        
        // must be white...
        this.frame.style.background = "white";
        this.frame.contentWindow.document.body.style.backgroundColor = "white";
    }

}

customElements.define('globular-file-reader', GlobularFileReader)