
/**
 * Sample empty component
 */
export class Empty extends HTMLElement {
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
                background-color: var(--palette-background-paper);
                color: var(--palette-text-primary);
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

customElements.define('globular-empty', Empty)

