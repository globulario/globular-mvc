import { Model } from "../Model";
import { theme } from "./Theme";

/**
 * <globular-form >
 *      <globular-form-section sectionWidth="2" sectionHeight="1">
 *          <globular-field>
 *          </globular-field>
 *          <globular-field>
 *          </globular-field>
 *      <globular-form-section>
 *      <globular-form-section>
 *          <globular-field>
 *          </globular-field>
 *      <globular-form-section>
 * </globular-form>
 */
export class Form extends HTMLElement {
    //Should be defined with screen size as well. Might be useful to make it grid instead of flex.
    constructor() {
        super()

        // Set the shadow dom.
        this.attachShadow({ mode: "open" });

        // Setup basic HTML
        this.shadowRoot.innerHTML = `
            <style>
                ${theme}
                #container {
                    display: flex;
                    flex-direction: column;
                }    
            </style>
            <div id="container">
                <slot>
                </slot>
            </div>
        `

    }

    clear() {
        this.container.innerHTML = '';
    }

    appendFormSection() {
        //TODO: Create a new form section and append it to this item within the container
    }
}

customElements.define("globular-form", Form);

export class FormSection extends HTMLElement {

    // Must be defined following the screen size.
    constructor(title, subtitle, sectionWidth, sectionHeight) {
        super()
        sectionHeight = (sectionHeight < 1 ? 1 : sectionHeight)
        sectionWidth = (sectionWidth < 1 ? 1 : sectionWidth)

        // Set the shadow dom.
        this.attachShadow({ mode: "open" });

        // Setup basic HTML
        this.shadowRoot.innerHTML = `
            <style>
                ${theme}
                #container {
                    display: grid;
                    grid-template-columns: repeat(${sectionHeight}, 1 fr);
                    grid-template-rows: repeat(${sectionWidth}, 1 fr)
                }
            </style>
            <div id="container">
                <slot>
                </slot>
            </div>
        `

        this.container = this.shadowRoot.getElementById("container")
    }
}

customElements.define("globular-form-section", FormSection);

export class Field extends HTMLElement {
    constructor() {
        super()

        // Set the shadow dom.
        this.attachShadow({ mode: "open" });

        // Setup basic HTML
        this.shadowRoot.innerHTML = `
            <style>
                ${theme}
                #container {
                    display: grid;
                    grid-template-columns: repeat(${sectionHeight}, 1 fr);
                    grid-template-rows: repeat(${sectionWidth}, 1 fr)
                }
            </style>
            <div id="container">
                <slot>
                </slot>
            </div>
        `

        this.container = this.shadowRoot.getElementById("container")
    }
}

customElements.define("globular-field", FormSection);

