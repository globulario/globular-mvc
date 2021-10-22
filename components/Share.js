/**
 * Share ressource manager.
 */
 export class ShareResourceManager extends HTMLElement {
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

        <div>

        </div>
        `

        // test create offer...
    }

}

customElements.define('globular-share-resource-manager', ShareResourceManager)