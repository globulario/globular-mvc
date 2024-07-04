import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-icon-button/paper-icon-button.js';


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
        if (this.hasAttribute("width")) {
            this.width = "100%"
        }

        let label = this.getAttribute("label");
        let type = this.getAttribute("type")
        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>

            paper-card {
                background-color: var(--palette-background-paper);
                color: var(--palette-text-primary);
            }

        </style>

        <div id="autocomplete-div">
            <paper-input  id='input' type='${type}' label='${label}' style='flex-grow: 1; width:${this.width}px;'></paper-input>
            <paper-card id="values_div" style="max-height: 350px; overflow-y: auto;  width:${this.width}px; z-index: 10;"> </paper-card>
        </div>
        `

    }

    focus(){
        let nameInput = this.shadowRoot.getElementById("input")
        setTimeout(() => {
          nameInput.focus()
        }, 100)
    }

    setValues(values){
        let valuesDiv = this.shadowRoot.getElementById("values_div")
        valuesDiv.innerHTML = "";
        for (var i = 0; i < values.length; i++) {
            let div = this.displayValue(values[i])
            valuesDiv.appendChild(div)
        }
    }

    getValue(){
        let input = this.shadowRoot.getElementById("input")
        return input.value
    }

    clear() {
        input.value = '';
        let valuesDiv = this.shadowRoot.getElementById("values_div")
        valuesDiv.innerHTML = ""
    }
}

customElements.define('globular-autocomplete', Autocomplete)