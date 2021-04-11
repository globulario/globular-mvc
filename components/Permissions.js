import { theme } from "../../../globular-mvc/components/Theme.js";

/**
 * Sample empty component
 */
export class PermissionsManager extends HTMLElement {
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

customElements.define('globular-permissions-manager', PermissionsManager)

