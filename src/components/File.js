
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-card/paper-card.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-checkbox/paper-checkbox.js';

import { Model } from '../Model';
import { theme } from './Layout';

/**
 * File explorer.
 */
export class FileExplorer extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
    }

    getWorkspace() {
        return document.getElementById("workspace")
    }

    // The connection callback.
    connectedCallback() {
        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${theme}
        </style>

        <paper-icon-button id="openbutton" icon="icons:folder"></paper-icon-button>

        <paper-card id="file-explorer-box" class="file-explorer" style="display: none;">

        </paper-card>
        `
    }
}

customElements.define('globular-file-explorer', FileExplorer)