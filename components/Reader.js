import { theme } from "./Theme";
import { Model } from '../Model';

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
        let location = window.location;

        // Set the file location.
        this.frame.src = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '') + path
        this.frame.style.height = this.parentNode.offsetHeight + "px"
        // must be white...
        this.frame.style.background = "white";
        this.frame.contentWindow.document.body.style.backgroundColor = "white";
    }

}

customElements.define('globular-file-reader', FileReader)