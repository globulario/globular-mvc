
import { theme } from "./Theme";

/**
 * Command prompt to execute command on the server.
 */
 export class Terminal extends HTMLElement {
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

            paper-card{
                display: flex;
                flex-direction: column;
                margin-top: 10%;
                marging-bottom: 10%;
                width: 100%;
                height: 100%;
            }

            textarea, input{
                border: none;
                background: transparent;
                color: var(--palette-text-primary);
                flex-grow: 1;
            }

            textarea:focus, input:focus{
                outline: none;
            }

            .title{
                height: 20px;
            }

            .oupout{
                flex-grow: 1;
            }

        </style>
        <paper-card>
            <span class="title">
              Terminal
            </span>

            <div class="oupout"> </div>
            <div style="display: flex; padding-top: 5px; padding-bottom: 5px;">
                <iron-icon icon="icons:chevron-right"></iron-icon>
                <input type="text" class="rq-form-element" />
            </div>
        </paper-card>
        `
        this.input = this.shadowRoot.querySelector("input")
    }

    connectedCallback() {
        // Focus the input
        this.input.focus();
    }
}

customElements.define('globular-terminal', Terminal)