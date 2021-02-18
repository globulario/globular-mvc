import { Model } from "../Model";
import { theme } from "./Theme";
import '@polymer/paper-input/paper-input.js';

/**
 * 
 * <globular-form >
 *      <globular-form-section>
 *          <globular-string-field label="grape">
 *          </globular-string-field>
 *          <globular-string-field label="grapefruit" x="2" y="1">
 *          </globular-string-field>
 *      <globular-form-section>
 *      <globular-form-section>
 *          <globular-string-field label="Grapefruit Pie" x="1" y="1" width="2" height="3" xsmall ysmall widthsmall heightsmall xlarge ylarge widthlarge heightlarge>
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
    constructor(title, subtitle, sectionWidth, sectionHeight) {
        super()

        this.idTitle = title.split(" ").join("_");
        this.title = title
        this.subtitle = subtitle
        // Set the shadow dom.
        this.attachShadow({ mode: "open" });

        // Setup basic HTML
        this.shadowRoot.innerHTML = `
            <style>
                ${theme}
                #container {
                    display: grid;
                    grid-template-columns: repeat(${sectionWidth}, 1fr);
                    grid-template-rows: repeat(${sectionHeight}, 1fr);
                    gap: 1rem 1rem;
                }
                
                .card-title{
                    position: absolute;
                    font-size: 1rem;
                    text-transform: uppercase;
                    color: var(--cr-primary-text-color);
                    font-weight: 400;
                    letter-spacing: .25px;
                    margin-bottom: .35em;
                    margin-top: var(--cr-section-vertical-margin);
                    outline: none;
                    padding-bottom: .25em;
                    padding-top: .5em;
                    padding-left: 2em;
                }

                .card-subtitle{
                    padding: 48px;
                    letter-spacing: .01428571em;
                    font-family: Roboto,Arial,sans-serif;
                    font-size: .875rem;
                    font-weight: 400;
                    line-height: 1.25rem;
                    hyphens: auto;
                    word-break: break-word;
                    word-wrap: break-word;
                    color: var(--cr-primary-text-color);
                    flex-grow: 1;
                }

                .card {
                    display:flex;
                    flex-direction:column;
                }


            </style>
            <paper-card class="card" id="${this.idTitle}_form_section">
                <h2 class="card-title">${this.title}</h2>
                <div class="card-subtitle">${this.subtitle}</div>
                <slot id="container">
                </slot>
            </paper-card>
        `

        this.container = this.shadowRoot.getElementById("container")
    }

    clear() {
        this.container.innerHTML = ''
    }

    appendField(field) {
        if (field) {
            this.appendChild(field)
        }
    }
}

customElements.define("globular-form-section", FormSection);

/**
 * Never instantiate a Field variable. This is meant to be an abstract class that must be implemented by a derived class in order to be used properly.
 */
class Field extends HTMLElement {

    /**
     * If x or y are 0 or negative, then there cannot be a width or a height since the grid is dependent on initial position. 
     * The position will also be automatically placed within the grid.
     * 
     * If width or height are 0 or negative, then their value will be a default of 1.
     * 
     * The above conditions apply for all variations of those parameters. 
     * Also, it isn't necessary to have all the different dimensions. It is possible to only have the small dimensions, the phone dimensions or the regular dimensions.
     * 
     * @param {*} label 
     * @param {*} initialValue The initial value that the input will show
     * @param {*} x The initial position of the Field on the x axis. Starts at 1.
     * @param {*} y The initial position of the Field on the y axis. Starts at 1.
     * @param {*} width The width of the Field in grid units.
     * @param {*} height The height of the Field in grid units.
     * @param {*} xSmall The position of the Field on the x axis when the screen is small. Starts at 1.
     * @param {*} ySmall The position of the Field on the y axis when the screen is small. Starts at 1.
     * @param {*} widthSmall The width of the Field when the screen is small.
     * @param {*} heightSmall The height of the Field when the screen is small.
     * @param {*} xPhone The position of the Field on the x axis when the screen is about the size of a phone. Starts at 1.
     * @param {*} yPhone The position of the Field on the y axis when the screen is about the size of a phone. Starts at 1.
     * @param {*} widthPhone The width of the Field when the screen is about the size of a phone.
     * @param {*} heightPhone The height of the Field when the screen is about the size of a phone.
     */
    constructor(label, initialValue, x = 0, y = 0, width = 0, height = 0, xSmall = 0, ySmall = 0, widthSmall = 0, heightSmall = 0, xPhone = 0, yPhone = 0, widthPhone = 0, heightPhone = 0) {
        super()
        this.initialValue = initialValue

        let hostHtml = this._setAllSizes(x, y, width, height, xSmall, ySmall, widthSmall, heightSmall, xPhone, yPhone, widthPhone, heightPhone)

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
                    
                }
          
                ${hostHtml}
              </style>
          
              <paper-card id="container">
                <div id="name-div" class="field-label">${label}</div>
              <paper-card>
        `

        this.container = this.shadowRoot.getElementById("container")
    }

    _setAllSizes(x, y, width, height, xSmall, ySmall, widthSmall, heightSmall, xPhone, yPhone, widthPhone, heightPhone) {
        let hostHtml = this._setSize(x, y, width, height)
        hostHtml += this._setConditionalSize(800, xSmall, ySmall, widthSmall, heightSmall)
        hostHtml += this._setConditionalSize(500, xPhone, yPhone, widthPhone, heightPhone)
        return hostHtml
    }

    _setConditionalSize(pixelWidth, x, y, width, height) {
        let conditionalHtml = ``
        if(!pixelWidth || pixelWidth < 0){
            return conditionalHtml
        }
        conditionalHtml = `@media only screen and (max-width: ${pixelWidth}px) {
            ${this._setSize(x, y, width, height)}
        }`

        return conditionalHtml
        
    }
    
    /**
     * Sets the CSS for the size of the host element. 
     * 
     * If x or y are 0 or negative, then there cannot be a width or a height since the grid is dependent on initial position. 
     * The position will also be automatically placed within the grid.
     * 
     * If width or height are 0 or negative, then their value will be 1.
     * 
     * @param {*} x The initial position of the Field on the x axis. Starts at 1.
     * @param {*} y The initial position of the Field on the y axis. Starts at 1.
     * @param {*} width The width of the Field in grid units.
     * @param {*} height The height of the Field in grid units.
     */
    _setSize(x, y, width, height) {
        let hostHtml = `:host {
            `
        if (x && x > 0) {
            hostHtml += `grid-column: ${x}`
            if (width && width > 0) {
                hostHtml += ` / ${x + width}`
            }
            hostHtml += `;
                `
        }

        if (y && y > 0) {
            hostHtml += `grid-row: ${y}`
            if (height && height > 0) {
                hostHtml += ` / ${y + height}`
            }
            hostHtml += `;
                `
        }

        hostHtml += `}
            `
        return hostHtml
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

/**
 * A simple input field which accepts any string as its input.
 */
export class StringField extends Field {

    /**
     * If x or y are 0 or negative, then there cannot be a width or a height since the grid is dependent on initial position. 
     * The position will also be automatically placed within the grid.
     * 
     * If width or height are 0 or negative, then their value will be a default of 1.
     * 
     * The above conditions apply for all variations of those parameters. 
     * Also, it isn't necessary to have all the different dimensions. It is possible to only have the small dimensions, the phone dimensions or the regular dimensions.
     * 
     * @param {*} label 
     * @param {*} initialValue The initial value that the input will show
     * @param {*} x The initial position of the Field on the x axis. Starts at 1.
     * @param {*} y The initial position of the Field on the y axis. Starts at 1.
     * @param {*} width The width of the Field in grid units.
     * @param {*} height The height of the Field in grid units.
     * @param {*} xSmall The position of the Field on the x axis when the screen is small. Starts at 1.
     * @param {*} ySmall The position of the Field on the y axis when the screen is small. Starts at 1.
     * @param {*} widthSmall The width of the Field when the screen is small.
     * @param {*} heightSmall The height of the Field when the screen is small.
     * @param {*} xPhone The position of the Field on the x axis when the screen is about the size of a phone. Starts at 1.
     * @param {*} yPhone The position of the Field on the y axis when the screen is about the size of a phone. Starts at 1.
     * @param {*} widthPhone The width of the Field when the screen is about the size of a phone.
     * @param {*} heightPhone The height of the Field when the screen is about the size of a phone.
     */
    constructor(label, initialValue = "", x = 0, y = 0, width = 0, height = 0, xSmall = 0, ySmall = 0, widthSmall = 0, heightSmall = 0, xPhone = 0, yPhone = 0, widthPhone = 0, heightPhone = 0) {
        super(label, initialValue, x, y, width, height, xSmall, ySmall, widthSmall, heightSmall , xPhone, yPhone, widthPhone, heightPhone)
        // Add validation for the input
        let html = `
            <paper-input id="field-input" label="" raised required></paper-input>
            <div id="field-view"></div>
        `
        let range = document.createRange();
        this.container.appendChild(range.createContextualFragment(html))
        this.input = this.shadowRoot.getElementById("field-input");
        this.view = this.shadowRoot.getElementById("field-view")

        //By default, show the input element and not the view element
        this.unlock()
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
        this.view.innerHTML = this.input.value

        // Temporary: Change the method to remove and replace the elements
        this.input.style.display = "none"
        this.view.style.display = ""
    }

    unlock() {
        this.input.style.display = ""
        this.view.style.display = "none"
    }

}

customElements.define("globular-string-field", StringField);
