import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-card/paper-card.js';

import { Model } from '../Model';
import { theme } from './Layout';

/**
 * Search Box
 */
export class ContactPanel extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
    }

    // The connection callback.
    connectedCallback() {

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>

            ${theme}
        </style>

        <paper-card id="panel">
        </div>
        `

        // give the focus to the input.
        let panel = this.shadowRoot.getElementById("panel")
    }
}

customElements.define('globular-contact-panel', ContactPanel)