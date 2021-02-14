import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-icon-button/paper-icon-button.js';

import { theme } from "./Theme";
/**
 * Autocomplete
 */
export class Autocomplete extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // That function return the list of values.
        this.getValues = null;

        // That function will display values.
        this.displayValue = null;

        this.width = 300;
        if(this.hasAttribute("width")){
            this.width = parseInt(this.getAttribute("width"))
        }
    }

    // The connection callback.
    connectedCallback() {
        let label = this.getAttribute("label");
        let type = this.getAttribute("type")
        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>

            ${theme}

        </style>

        <div id="autocomplete-div">
            <paper-input  id='input' type='${type}' label='${label}' style='flex-grow: 1; width:${this.width}px;'></paper-input>
            <paper-card id="values_div" style="position: absolute; max-height: 350px; overflow-y: auto;  width:${this.width}px;"> </paper-card>
        </div>
        `
        // Action's
        let input = this.shadowRoot.getElementById("input")
        let valuesDiv = this.shadowRoot.getElementById("values_div")

        input.onkeyup = () => {

            this.getValues(input.value, (values) => {
                valuesDiv.innerHTML = "";
                for (var i = 0; i < values.length; i++) {
                    let div = this.displayValue(values[i])
                    valuesDiv.appendChild(div)
                }

            });
        }


    }
}

customElements.define('globular-autocomplete', Autocomplete)