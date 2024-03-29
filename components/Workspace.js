

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
           

            #container{
                display: flex;
                justify-content: center;
                padding-left: 10px;
                padding-right: 10px;
                overflow: hidden;
                min-height: calc(100vh - 65px);
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