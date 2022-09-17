import { getTheme } from "./Theme.js";

/**
 * A play list is accociated with a directory. So you must specify the path
 * where media files can be read...
 */
export class PlayList extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(dir) {
        super()
        
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });



        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}
            #container{

            }
        </style>
        <div id="container">
        </div>
        `

        // give the focus to the input.
        let container = this.shadowRoot.querySelector("#container")

        

    }

    // The connection callback.
    connectedCallback() {

    }

}

customElements.define('globular-playlist', PlayList)