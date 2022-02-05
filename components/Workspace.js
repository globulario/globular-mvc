import { theme } from "./Theme";

/**
 * That class is use to manage the content of the workspace div.
 * It use a css grid-layout at it base to do so. And it adapt to the
 * media to display correctly all the page content. It also use the 
 * local store to keep user preferences in therm of element placement in the
 * layout.
 */
 export class Workspace extends HTMLElement {
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
                display: grid;
                grid-gap: 1em;

                /** Position Element on the grid */
                grid-template-columns: repeat(16, 1fr);
                grid-auto-rows: minmax(100px, auto);
            }

            #container {

            }

        </style>

        <div id="container">
            <slot>

            </slot>
        </div>
        `
    
    }

}

customElements.define('globular-workspace', Workspace)