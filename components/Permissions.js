// Polymer dependencies
import { PolymerElement, html } from '@polymer/polymer';

import { theme } from "./Theme";

import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/iron-icons/iron-icons.js';

// List of imported functionality.
import { randomUUID } from "../utility.js"

class PermissionElement extends PolymerElement {
    constructor() {
        super();
    }

    /**
     * The internal component properties.
     */
    static get properties() {
        return {
            pagesize : Number
        }
    }

    static get template() {
        return html`
        <style>
            ${theme}
            /** The permission panel **/
            .globular-permissions-panel {

            }

        </style>
        <div class="globular-permissions-panel">
            
        </div>
    `;

    }

    /**
     * That function is call when the table is ready to be diplay.
     */
    ready() {
        super.ready();

        
    }

}
customElements.define('globular-permissions', TablePaginationElement);