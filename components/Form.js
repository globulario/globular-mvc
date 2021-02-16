import { Model } from "../Model";
import { theme } from "./Theme";
import '@polymer/paper-input/paper-input.js';

/**
 * 
 * <globular-form >
 *      <globular-form-section>
 *          <globular-string-field>
 *          </globular-string-field>
 *          <globular-string-field>
 *          </globular-string-field>
 *      <globular-form-section>
 *      <globular-form-section>
 *          <globular-string-field>
 *          </globular-string-field>
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
        console.log("another test?")
        this.shadowRoot.innerHTML = `
            <style>
                ${theme}
                #container {
                    display: flex;
                    flex-direction: column;
                }    
            </style>
            <div id="container">
                <span>HELLO SIRS </span>
                <slot>
                </slot>
            </div>
        `

        this.container = this.shadowRoot.getElementById("container")
    }

    clear() {
        this.container.innerHTML = ''
    }

    appendFormSection() {
        //TODO: Create a new form section and append it to this item within the container
        // Create side menu item for each new section which navigates to the new form section.
    }
}

customElements.define("globular-form", Form);

export class FormSection extends HTMLElement {

    // Must be defined following the screen size.
    constructor(title, subtitle ) {
        super()

        //if very long, but not wide = more rows, less columns //Mostly for mobile
        //if wide, but not long = more columns, less rows // Large computer displays

        // Set the shadow dom.
        this.attachShadow({ mode: "open" });

        // Setup basic HTML
        this.shadowRoot.innerHTML = `
            <style>
                ${theme}
                #container {
                    display: grid;
                    grid-template-columns: repeat(${sectionHeight}, 1 fr);
                    grid-template-rows: repeat(${sectionWidth}, 1 fr);
                }
            </style>
            <div id="container">
                <slot>
                </slot>
            </div>
        `

        this.container = this.shadowRoot.getElementById("container")
    }

    clear() {
        this.container.innerHTML = ''
    }

    appendField(field) {
        let e = field.getElement()
        if (e) {
            e.tabIndex = this.childNodes.length
        }
        this.shadowRoot.appendChild(field)
    }
}

customElements.define("globular-form-section", FormSection);

/**
 * Never create a Field variable. This is meant to be an abstract class tht must be implemented by a derived class in order to be used properly.
 */
export class Field extends HTMLElement {
    constructor(name, initialValue, width=1, height=1, x=1, y=1) {
        super()
        this.initialValue = initialValue
        width = (width < 1) ? 1 : width
        height = (height < 1) ? 1 : height
        x = (x < 1) ? 1 : x
        y = (y < 1) ? 1 : y

        // Set the shadow dom.
        this.attachShadow({ mode: "open" });

        // Setup basic HTML
        this.shadowRoot.innerHTML = `
            <style>
                ${theme}

                .field-label {
                   line-height: 1rem;
                   font-size: .6875rem;
                   font-weight: 500;
                   flex-basis: 156px;
                   letter-spacing: .07272727em;
                   text-transform: uppercase;
                   hyphens: auto;
                   word-break: break-word;
                   word-wrap: break-word;
                }
                
                #container {
                    grid-column: ${x} / ${x + width}
                    grid-row: ${y} / ${y + height}
                }
          
              </style>
          
              <div id="container">
                <div id="name-div" class="field-label">${name}</div>
                <slot name="field-value"> 
                </slot>
              <div>
        `

        this.container = this.shadowRoot.getElementById("container")
    }
    
    /**
     * Hides all the field's elements
     */
    hide() {
        this.container.style.display = "none";
    }

    /**
     * Shows all the field's elements
     */
    show() {
        this.container.style.display = "";
    }

    /**
     * Reset the value of the view and input elements of the configuration with their initial value.
     */
    reset() {
        this.setValue(this.initialValue)
    }

    /**
     * Changes the initial value of the component to the new value. Modifies the current value.
     * @param {*} v New reset value
     */
    set(v) {
        this.initialValue = v
        this.setValue(v)
    }
    
    /**
     * Returns the value of the current input.
     * 
     * Abstract method.
     * Must be reimplemented in derived classes.
     */
    getValue() {
        return ""
    }

    /**
     * Sets the value of the current input of the view and input elements.
     * 
     * Abstract method.
     * Must be implemented in derived classes.
     * @param {*} v New value for the current input
     */
    setValue(v) { }

    /**
     * Sets the value of the view and input elements to a nill value.
     * 
     * Abstract method.
     * Must be implemented in derived classes.
     */
    clear() { }

    /**
     * Disables the input element and enables the view element.
     *  
     * Abstract method.
     * Must be implemented in derived classes.
     */
    lock() { }

    /**
     * Enables the input element and disables the view element.
     * 
     * Abstract method.
     * Must be implemented in derived classes.
     */
    unlock() { }

}

export class StringField extends Field {
    constructor(name, initialValue = "") {
        super(name, initialValue)
        // Add validation for the input
        let html = `
            <paper-input id="field-input" label="" raised required></paper-input>
            <div id="field-view"></div>
        `
        let range = document.createRange();
        this.shadowRoot.appendChild(range.createContextualFragment(html))
        this.input = this.shadowRoot.getElementById("field-input");
        this.view = this.shadowRoot.getElementById("field-view")
    }

    getValue() {
        return this.input.value
    }

    setValue(v) {
        this.input.value = value
        this.view.innerHTML = value
    }

    clear() { 
        this.setValue("")
    }

    lock() {
        this.input.style.display = "none"
        this.view.style.display = ""
    }

    unlock() {
        this.input.style.display = ""
        this.view.style.display = "none"
    }

}

customElements.define("globular-string-field", StringField);
