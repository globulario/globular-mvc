import { Model } from "../Model";
import { theme } from "./Theme";
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-dropdown-menu/paper-dropdown-menu.js'
import '@polymer/paper-listbox/paper-listbox.js'
import '@polymer/paper-item/paper-item.js'
import '@polymer/paper-menu-button/paper-menu-button.js'
import '@polymer/neon-animation/neon-animation-runner-behavior.js'
import 'web-animations-js/web-animations-next.min.js'
import '@polymer/paper-input/paper-textarea.js';
import { IronResizableBehavior } from '@polymer/iron-resizable-behavior/iron-resizable-behavior.js';
// import 'web-animations-js/src/we'

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
                    width: 85vw;
                }    
            </style>
            <div id="container">
                <slot>
                </slot>
                <paper-button id="save-btn">Enregistrer</paper-button>
            </div>
        `

        this.toast = ""
        this.container = this.shadowRoot.getElementById("container")
        this.shadowRoot.getElementById("save-btn").onclick = this.confirm.bind(this)
    }

    clear() {
        this.container.innerHTML = ''
    }

    appendFormSection(formSection) {
        if (formSection) {
            this.appendChild(formSection)
        }
        // TODO: Create side menu item for each new section which navigates to the new form section.
    }

    /**
     * Creates a Toast popup to confirm if the user wants to save their form.
     */
    confirm() {
        const toastHtml = `
        <style>
            #button-container {
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                background-color: transparent;
                flex-grow: 1;
            }
            
            #toast-main-container {
                display: flex;
                flex-direction: column;
                background-color: transparent;
            }

            #toast-text {
                padding-bottom: 2rem;
            }

            .toast-btn {
                box-shadow: none;
                background-color: transparent;
                cursor: pointer;
                transition: background-color .2s;
                border: none;
                border-radius: 3px;
                padding: 0.5rem;
            }

            .toast-btn:focus {
                background-color: rgba(255,255,255,0.1);
            }
        </style>
        <div id="toast-main-container">
            <span id="toast-text">Est-ce que vous voulez sauvegarder votre formulaire?</span>
            <div id="button-container">
                <button class="toast-btn" id="save-btn">Enregistrer</button>
                <button class="toast-btn" id="no-save-btn">Ne pas enregistrer</button>
                <button class="toast-btn" id="cancel-btn">Annuler</button>
            </div>
        </div>
        `
        M.toast({html: toastHtml, displayLength: 999999})

        let toast = document.querySelector(".toast")
        toast.querySelector("#save-btn").onclick = this.save.bind(this)
        toast.querySelector("#no-save-btn").onclick = this.noSave.bind(this)
        toast.querySelector("#cancel-btn").onclick = this.cancel.bind(this)

        Model.eventHub.publish("lock_form_evt", true, true)
    }

    /**
     * Sends an event over your local network to save, unlock, then reset the current form.
     */
    save() {
        Model.eventHub.publish("save_form_evt", true, true)
        document.querySelector(".toast").remove()
        Model.eventHub.publish("unlock_form_evt", true, true)
        // Model.eventHub.publish("reset_form_evt", true, true)
    }

    /**
     * Sends an event over your local network to reset, then unlock the current form.
     */
    noSave() {
        Model.eventHub.publish("reset_form_evt", true, true)
        document.querySelector(".toast").remove()
        Model.eventHub.publish("unlock_form_evt", true, true)
    }

    /**
     * Sends an event over your local network to unlock the current form.
     */
    cancel() {
        document.querySelector(".toast").remove()
        Model.eventHub.publish("unlock_form_evt", true, true)
    }

}

customElements.define("globular-form", Form);

export class FormSection extends HTMLElement {

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
                    paddding: 1rem;
                }
                
                .card-title{
                    position: absolute;
                    font-size: 1.25rem;
                    text-transform: uppercase;
                    color: var(--cr-primary-text-color);
                    font-weight: 400;
                    top: .25rem;
                    letter-spacing: .25px;
                    margin-bottom: .35em;
                    margin-top: var(--cr-section-vertical-margin);
                    outline: none;
                    padding-bottom: .25em;
                    padding-top: .5em;
                    padding-left: 2em;
                    background: transparent;
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
                <div>
                    <slot id="container">
                    </slot>
                </div>
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
export class Field extends HTMLElement {

    /**
     * If x or y are 0 or negative, then there cannot be a width or a height since the grid is dependent on initial position. 
     * The position will also be automatically placed within the grid.
     * 
     * If width or height are 0 or negative, then their value will be a default of 1.
     * 
     * The above conditions apply for all variations of those parameters. 
     * Also, it isn't necessary to have all the different dimensions. It is possible to only have an arbitrary amount of the small dimensions, the phone dimensions or the regular dimensions.
     * 
     * @param {*} label (aka Title) The string which will be display at the top of the Field.
     * @param {*} initialValue The initial value that the input will show
     * @param {*} x The initial position of the Field on the x axis. Starts at 1.
     * @param {*} y The initial position of the Field on the y axis. Starts at 1.
     * @param {*} width The width of the Field in grid units.
     * @param {*} height The height of the Field in grid units.
     * @param {*} xSmall The position of the Field on the x axis when the screen is small. Starts at 1.
     * @param {*} ySmall The position of the Field on the y axis when the screen is small. Starts at 1.
     * @param {*} widthSmall The width of the Field when the screen is small in grid units.
     * @param {*} heightSmall The height of the Field when the screen is small in grid units.
     * @param {*} xPhone The position of the Field on the x axis when the screen is about the size of a phone. Starts at 1.
     * @param {*} yPhone The position of the Field on the y axis when the screen is about the size of a phone. Starts at 1.
     * @param {*} widthPhone The width of the Field when the screen is about the size of a phone in grid units.
     * @param {*} heightPhone The height of the Field when the screen is about the size of a phone in grid units.
     */
    constructor(label, initialValue, x = 0, y = 0, width = 0, height = 0, xSmall = 0, ySmall = 0, widthSmall = 0, heightSmall = 0, xPhone = 0, yPhone = 0, widthPhone = 0, heightPhone = 0) {
        super()
        this.initialValue = initialValue
        this.smallThreshold = 800
        this.phoneThreshold = 500
        this.invalidColor = "red"
        this.validColor = "var(--paper-card-background-color, var(--primary-background-color))"

        let hostHtml = this._getAllSizes(x, y, width, height, xSmall, ySmall, widthSmall, heightSmall, xPhone, yPhone, widthPhone, heightPhone)

        // Set the shadow dom.
        this.attachShadow({ mode: "open" });

        // Setup basic HTML
        this.shadowRoot.innerHTML = `
            <style>
                ${theme}

                .field-label {
                   line-height: 1rem;
                   font-size: .875rem;
                   font-weight: 500;
                   letter-spacing: .07272727em;
                   text-transform: uppercase;
                   hyphens: auto;
                   word-break: break-word;
                   word-wrap: break-word;
                   padding: .5rem;
                }

                #container {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }

                #container paper-input {
                    margin-top: auto;
                    padding: 0.5rem;
                }

                #container paper-input:invalid {
                    border-bottom: 1px dashed red;
                }

                #container paper-dropdown-menu {
                    margin-top: auto;
                    padding: 0.5rem;
                }

                #container textarea {
                    margin-top:auto;
                    word-wrap: break-word;
                    margin:0.5rem;
                    outline: var(--paper-input-container-shared-input-style_-_outline);
                    background: var(--paper-input-container-shared-input-style_-_background);
                    border: var(--paper-input-container-shared-input-style_-_border);
                    font-family: var(--paper-input-container-shared-input-style_-_font-family);
                    font-size: var(--paper-input-container-shared-input-style_-_font-size);
                    font-weight: var(--paper-input-container-shared-input-style_-_font-weight);

                }

                #field-view {
                    text-align: center;
                    font-size: 1rem;
                }
          
                ${hostHtml}
              </style>
          
              <paper-card id="container">
                <div id="name-div" class="field-label">${label}</div>
              </paper-card>
        `

        this.container = this.shadowRoot.getElementById("container")
    }

    /**
     * Gets the HTML resize and size code for the all the different dimensions.
     * 
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
    _getAllSizes(x, y, width, height, xSmall, ySmall, widthSmall, heightSmall, xPhone, yPhone, widthPhone, heightPhone) {
        let hostHtml = this._getSize(x, y, width, height)
        hostHtml += this._getConditionalSize(this.smallThreshold, xSmall, ySmall, widthSmall, heightSmall)
        hostHtml += this._getConditionalSize(this.phoneThreshold, xPhone, yPhone, widthPhone, heightPhone)
        return hostHtml
    }

    /**
     * Gets the conditional resize code for the specified dimensions.
     * 
     * @param {*} pixelWidth If the width of the screen drops underneath this value, then the dimensions will change
     * @param {*} x The initial position of the Field on the x axis. Starts at 1.
     * @param {*} y The initial position of the Field on the y axis. Starts at 1.
     * @param {*} width The width of the Field in grid units.
     * @param {*} height The height of the Field in grid units.
     */
    _getConditionalSize(pixelWidth, x, y, width, height) {
        let conditionalHtml = ``
        if (!pixelWidth || pixelWidth < 0) {
            return conditionalHtml
        }
        conditionalHtml = `@media only screen and (max-width: ${pixelWidth}px) {
            ${this._getSize(x, y, width, height)}
        }`

        return conditionalHtml

    }

    /**
     * Gets the CSS for the size of the host element. The size is setup using grid-columns.
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
    _getSize(x, y, width, height) {
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
     */
    getValue() {
        return ""
    }

    /**
     * Sets the value of the current input of the view and input elements.
     * 
     * @param {*} v New value for the current input
     */
    setValue(v) { }

    /**
     * Sets the value of the view and input elements to a nill value.
     */
    clear() { }

    /**
     * Checks to see whether the input field is valid.
     */
    isValid() {
        return false
     }

    /**
     * Marks the field as being invalid either by making it red or something of the sort.
     */
    markInvalid() { }

    /**
     * Marks the field as being valid by making it normal.
     */
    markValid() { }

    /**
     * Disables the input element and enables the view element.
     */
    lock() { }

    /**
     * Enables the input element and disables the view element.
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
     * @param {*} label (aka Title) The string which will be display at the top of the Field.
     * @param {*} description The string which is displayed within the input and hovers above it once text is entered. 
     * @param {*} initialValue The initial value that the input will show
     * @param {*} x The initial position of the Field on the x axis. Starts at 1.
     * @param {*} y The initial position of the Field on the y axis. Starts at 1.
     * @param {*} width The width of the Field in grid units.
     * @param {*} height The height of the Field in grid units.
     * @param {*} xSmall The position of the Field on the x axis when the screen is small. Starts at 1.
     * @param {*} ySmall The position of the Field on the y axis when the screen is small. Starts at 1.
     * @param {*} widthSmall The width of the Field when the screen is small in grid units.
     * @param {*} heightSmall The height of the Field when the screen is small in grid units.
     * @param {*} xPhone The position of the Field on the x axis when the screen is about the size of a phone. Starts at 1.
     * @param {*} yPhone The position of the Field on the y axis when the screen is about the size of a phone. Starts at 1.
     * @param {*} widthPhone The width of the Field when the screen is about the size of a phone in grid units.
     * @param {*} heightPhone The height of the Field when the screen is about the size of a phone in grid units.
     */
    constructor(label, description, initialValue = "", x = 0, y = 0, width = 0, height = 0, xSmall = 0, ySmall = 0, widthSmall = 0, heightSmall = 0, xPhone = 0, yPhone = 0, widthPhone = 0, heightPhone = 0) {
        super(label, initialValue, x, y, width, height, xSmall, ySmall, widthSmall, heightSmall, xPhone, yPhone, widthPhone, heightPhone)
        let html = `
            <paper-input id="field-input" label="${description}" raised required error="This field is required."></paper-input>
            <div id="field-view"></div>
        `

        // Inserts the html into the proper area in the container
        let range = document.createRange();
        this.container.appendChild(range.createContextualFragment(html))

        // Gets the elements necessary for manipulating the DOM
        this.input = this.shadowRoot.getElementById("field-input");
        this.view = this.shadowRoot.getElementById("field-view")

        //By default, show the input element and not the view element
        this.unlock()
        this.reset()

    }

    getValue() {
        return this.input.value
    }

    setValue(v) {
        this.input.value = v
        this.view.innerHTML = v
    }

    clear() {
        this.setValue("")
    }

    isValid() {
        return this.getValue() && this.getValue() !== ""
    }

    markInvalid() {
        this.input.style.backgroundColor = this.invalidColor
    }

    markValid() {
        this.input.style.backgroundColor = this.validColor
    }

    lock() {
        this.view.innerHTML = this.input.value

        // TODO: Change the method to remove and replace the elements
        this.input.style.display = "none"
        this.view.style.display = ""
    }

    unlock() {
        this.input.style.display = ""
        this.view.style.display = "none"
    }
}

customElements.define("globular-string-field", StringField);

/**
 * An input field with multiple lines which can accept any string as input.
 */
export class TextAreaField extends Field {

    /**
     * If x or y are 0 or negative, then there cannot be a width or a height since the grid is dependent on initial position. 
     * The position will also be automatically placed within the grid.
     * 
     * If width or height are 0 or negative, then their value will be a default of 1.
     * 
     * The above conditions apply for all variations of those parameters. 
     * Also, it isn't necessary to have all the different dimensions. It is possible to only have the small dimensions, the phone dimensions or the regular dimensions.
     * 
     * @param {*} label (aka Title) The string which will be display at the top of the Field.
     * @param {*} description The string which is displayed within the input and hovers above it once text is entered. 
     * @param {*} initialValue The initial value that the input will show
     * @param {*} x The initial position of the Field on the x axis. Starts at 1.
     * @param {*} y The initial position of the Field on the y axis. Starts at 1.
     * @param {*} width The width of the Field in grid units.
     * @param {*} height The height of the Field in grid units.
     * @param {*} xSmall The position of the Field on the x axis when the screen is small. Starts at 1.
     * @param {*} ySmall The position of the Field on the y axis when the screen is small. Starts at 1.
     * @param {*} widthSmall The width of the Field when the screen is small in grid units.
     * @param {*} heightSmall The height of the Field when the screen is small in grid units.
     * @param {*} xPhone The position of the Field on the x axis when the screen is about the size of a phone. Starts at 1.
     * @param {*} yPhone The position of the Field on the y axis when the screen is about the size of a phone. Starts at 1.
     * @param {*} widthPhone The width of the Field when the screen is about the size of a phone in grid units.
     * @param {*} heightPhone The height of the Field when the screen is about the size of a phone in grid units.
     */
    constructor(label, description, initialValue = "", x = 0, y = 0, width = 0, height = 0, xSmall = 0, ySmall = 0, widthSmall = 0, heightSmall = 0, xPhone = 0, yPhone = 0, widthPhone = 0, heightPhone = 0) {
        super(label, initialValue, x, y, width, height, xSmall, ySmall, widthSmall, heightSmall, xPhone, yPhone, widthPhone, heightPhone)
        const rows = 3 + Math.floor(5.5 * Math.max(height - 1, 0))
        let html = `
            <textarea id="field-input" placeholder="${description}" rows="${rows}"></textarea>
            <div id="field-view"></div>
        `

        // Inserts the html into the proper area in the container
        let range = document.createRange();
        this.container.appendChild(range.createContextualFragment(html))

        // Gets the elements necessary for manipulating the DOM
        this.input = this.shadowRoot.getElementById("field-input");
        this.view = this.shadowRoot.getElementById("field-view")

        //Three listeners to change amount of rows
        this._setMaxHeightListener(heightSmall, this.smallThreshold)
        this._setMaxHeightListener(heightPhone, this.phoneThreshold)
        this._setMinHeightListener(heightSmall, this.smallThreshold)

        //By default, show the input element and not the view element
        this.unlock()
        this.reset()
    }

    /**
     * Sets a listener which checks when the viewport width is greater than a certain threshold
     * @param {*} height The height of the input after the modification in grid units. 
     * @param {*} threshold in pixels.
     */
    _setMinHeightListener(height, threshold) {
        if (height && height > 0) {
            let watcher = window.matchMedia("(min-width: " + (threshold + 1) + "px)")
            this._mediaQueryRows(watcher, height)
            watcher.addEventListener("change", () => {
                this._mediaQueryRows(watcher, height)
            })
        }
    }

    /**
     * Sets a listener which checks when the viewport width is lesser than a certain threshold
     * @param {*} height The height of the input after the modification in grid units. 
     * @param {*} threshold in pixels.
     */
    _setMaxHeightListener(height, threshold) {
        if (height && height > 0) {
            let watcher = window.matchMedia("(max-width: " + threshold + "px)")
            this._mediaQueryRows(watcher, height)
            watcher.addEventListener("change", () => {
                this._mediaQueryRows(watcher, height)
            })
        }
    }

    /**
     * Queries the watcher to check when the condition is met, then modifies the rows to the appropriate height.
     * @param {*} watcher The media query which specifies the necessary condition.
     * @param {*} height The height of the input after the modification in grid units. 
     */
    _mediaQueryRows(watcher, height) {
        if (watcher.matches) {
            this.input.setAttribute("rows", this._calcRow(height))
        }
    }

    /**
     * Calculates the amount of rows necessary for a given height. (Subject to change if found to be ugly)
     * @param {*} height The height of the input after the modification in grid space.
     */
    _calcRow(height) {
        return 3 + Math.floor(5.5 * Math.max(height - 1, 0))
    }

    getValue() {
        return this.input.value
    }

    setValue(v) {
        this.input.value = v
        this.view.innerHTML = v
    }

    clear() {
        this.setValue("")
    }

    isValid() {
        return this.getValue() && this.getValue() !== ""
    }

    markInvalid() {
        this.input.style.backgroundColor = this.invalidColor
    }

    markValid() {
        this.input.style.backgroundColor = this.validColor
    }

    lock() {
        this.view.innerHTML = this.input.value

        // TODO: Change the method to remove and replace the elements
        this.input.style.display = "none"
        this.view.style.display = ""
    }

    unlock() {
        this.input.style.display = ""
        this.view.style.display = "none"
    }
}

customElements.define("globular-text-area-field", TextAreaField);

/**
 * An input field which uses a list that the user will choose from.
 */
export class DropdownField extends Field {
    /**
         * If x or y are 0 or negative, then there cannot be a width or a height since the grid is dependent on initial position. 
         * The position will also be automatically placed within the grid.
         * 
         * If width or height are 0 or negative, then their value will be a default of 1.
         * 
         * The above conditions apply for all variations of those parameters. 
         * Also, it isn't necessary to have all the different dimensions. It is possible to only have the small dimensions, the phone dimensions or the regular dimensions.
         * 
         * @param {*} label (aka Title) The string which will be display at the top of the Field.
         * @param {*} description The string which is displayed within the input and hovers above it once text is entered. 
         * @param {*} itemList The items displayed in the dropdown list. 
         * @param {*} initialValue The initial value that the input will show
         * @param {*} x The initial position of the Field on the x axis. Starts at 1.
         * @param {*} y The initial position of the Field on the y axis. Starts at 1.
         * @param {*} width The width of the Field in grid units.
         * @param {*} height The height of the Field in grid units.
         * @param {*} xSmall The position of the Field on the x axis when the screen is small. Starts at 1.
         * @param {*} ySmall The position of the Field on the y axis when the screen is small. Starts at 1.
         * @param {*} widthSmall The width of the Field when the screen is small in grid units.
         * @param {*} heightSmall The height of the Field when the screen is small in grid units.
         * @param {*} xPhone The position of the Field on the x axis when the screen is about the size of a phone. Starts at 1.
         * @param {*} yPhone The position of the Field on the y axis when the screen is about the size of a phone. Starts at 1.
         * @param {*} widthPhone The width of the Field when the screen is about the size of a phone in grid units.
         * @param {*} heightPhone The height of the Field when the screen is about the size of a phone in grid units.
         */
    constructor(label, description, itemList, initialValue = "", x = 0, y = 0, width = 0, height = 0, xSmall = 0, ySmall = 0, widthSmall = 0, heightSmall = 0, xPhone = 0, yPhone = 0, widthPhone = 0, heightPhone = 0) {
        super(label, initialValue, x, y, width, height, xSmall, ySmall, widthSmall, heightSmall, xPhone, yPhone, widthPhone, heightPhone)

        this.itemList = itemList
        let html = `
            <paper-dropdown-menu id="field-input" class="dropdown-menu" label="${description}" raised>
                <paper-listbox class="dropdown-content" slot="dropdown-content">
                </paper-listbox>
            </paper-dropdown-menu>
            <div id="field-view"></div>
        `

        // Inserts the html into the proper area in the container
        let range = document.createRange();
        this.container.appendChild(range.createContextualFragment(html))

        // Gets the elements necessary for manipulating the DOM
        this.input = this.shadowRoot.getElementById("field-input")
        this.view = this.shadowRoot.getElementById("field-view")
        this.listbox = this.shadowRoot.querySelector(".dropdown-content")

        this.shadowRoot.querySelector(".dropdown-content").innerHTML = this._getHtmlArray()
        //By default, show the input element and not the view element
        this.unlock()
        this.reset()
    }

    /**
     * A connected callback executes after the constructor and is necessary to make sure HTML is properly initialized
     */
    connectedCallback() {
        this.addEventListener('iron-resize', this._onIronResize.bind(this));
    }

    /**
     * Resizes the dropdown list to be the same size as the input. 
     */
    _onIronResize() {
        this.listbox.style.width = this.input.shadowRoot.getElementById("menuButton").offsetWidth + "px"
    }

    /**
     * Gets the HTML for the items within the dropdown list.
     */
    _getHtmlArray() {
        let htmlArray = ``
        if (!this.itemList || this.itemList.length < 0) {
            return htmlArray;
        }
        for (let i = 0; i < this.itemList.length; i++) {
            htmlArray += `<paper-item value="${this.itemList[i]}">${this.itemList[i]}</paper-item>
            `
        }
        return htmlArray
    }


    getValue() {
        if(!this.listbox.selected || this.listbox.selected < 0) 
            return ""
        return this.listbox.getElementsByTagName("paper-item")[this.listbox.selected].getAttribute("value")
    }

    setValue(v) {
        let htmlItemlist = this.listbox.getElementsByTagName("paper-item")
        for (let i = 0; i < htmlItemlist.length; i++) {
            if (htmlItemlist[i].getAttribute("value") == v) {
                this.listbox.selected = i
                return
            }
        }
    }

    clear() {
        this.setValue("")
    }

    isValid() {
        return this.getValue() && this.getValue() !== ""
    }

    markInvalid() {
        this.input.style.backgroundColor = this.invalidColor
    }

    markValid() {
        this.input.style.backgroundColor = this.validColor
    }

    lock() {
        this.view.innerHTML = this.getValue()

        // TODO: Change the method to remove and replace the elements
        this.input.style.display = "none"
        this.view.style.display = ""
    }

    unlock() {
        this.input.style.display = ""
        this.view.style.display = "none"
    }

    reset() {
        this.listbox.selected = -1
    }
}

customElements.define("globular-dropdown-field", DropdownField);

/**
 * An input field which accepts an Image from the user's disk.
 */
export class ImageField extends Field {
    /**
         * If x or y are 0 or negative, then there cannot be a width or a height since the grid is dependent on initial position. 
         * The position will also be automatically placed within the grid.
         * 
         * If width or height are 0 or negative, then their value will be a default of 1.
         * 
         * The above conditions apply for all variations of those parameters. 
         * Also, it isn't necessary to have all the different dimensions. It is possible to only have the small dimensions, the phone dimensions or the regular dimensions.
         * 
         * @param {*} label (aka Title) The string which will be display at the top of the Field.
         * @param {*} description The string which is displayed within the input and hovers above it once text is entered. 
         * @param {*} initialValue The initial value that the input will show
         * @param {*} x The initial position of the Field on the x axis. Starts at 1.
         * @param {*} y The initial position of the Field on the y axis. Starts at 1.
         * @param {*} width The width of the Field in grid units.
         * @param {*} height The height of the Field in grid units.
         * @param {*} xSmall The position of the Field on the x axis when the screen is small. Starts at 1.
         * @param {*} ySmall The position of the Field on the y axis when the screen is small. Starts at 1.
         * @param {*} widthSmall The width of the Field when the screen is small in grid units.
         * @param {*} heightSmall The height of the Field when the screen is small in grid units.
         * @param {*} xPhone The position of the Field on the x axis when the screen is about the size of a phone. Starts at 1.
         * @param {*} yPhone The position of the Field on the y axis when the screen is about the size of a phone. Starts at 1.
         * @param {*} widthPhone The width of the Field when the screen is about the size of a phone in grid units.
         * @param {*} heightPhone The height of the Field when the screen is about the size of a phone in grid units.
         */
    constructor(label, description, initialValue = "", x = 0, y = 0, width = 0, height = 0, xSmall = 0, ySmall = 0, widthSmall = 0, heightSmall = 0, xPhone = 0, yPhone = 0, widthPhone = 0, heightPhone = 0) {
        super(label, initialValue, x, y, width, height, xSmall, ySmall, widthSmall, heightSmall, xPhone, yPhone, widthPhone, heightPhone)
        let html = `
            <style>
                #custom-file-upload span{
                    flex-grow: 1;
                }
        
                #custom-file-upload iron-icon{
                    padding-right: 15px;
                }
        
                #custom-file-upload{
                    display: flex;
                    align-items: flex-end;
                    border-bottom: 1px solid var(--palette-text-primary);
                    font-size: 1rem;
                    flex-basis: 100%;
                    letter-spacing: .00625em;
                    font-weight: 400;
                    line-height: 1.5rem;
                    word-break: break-word;
                    margin-top: auto;
                    padding: 0.5rem;
                }
        
                #custom-file-upload:hover{
                    cursor: pointer;
                }
                
                #field-input {
                    display: none;
                }

                #image-view {
                    height: 100%;
                    width: 100%;
                }

                #image-display-div{
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 32px;
                    height: 100%;
                    max-height:100%;
                    width:auto;
                    max-width:100%;
                }

                img {
                    position: absolute;
                    height: 100%;
                    width: auto;
                }
      
            </style>

            <div id="visual-input">
                <div id="custom-file-upload">
                    <iron-icon icon="cloud-upload"> </iron-icon>
                    <span>${description}</span>
                </div>
            </div>
            <div id="image-view">
                <div id="image-display-div">
                    <img id="image-display" src="#" />
                    <iron-icon id="no-image-display" icon="image:photo"></iron-icon>
                </div>
            </div>
            <input type="file" id="field-input"></input>
        `

        // Inserts the html into the proper area in the container
        let range = document.createRange();
        this.container.appendChild(range.createContextualFragment(html))
        // Gets the elements necessary for manipulating the DOM
        this.visualInput = this.shadowRoot.getElementById("visual-input")
        this.input = this.shadowRoot.getElementById("field-input")
        this.image = this.shadowRoot.getElementById("image-display")
        this.icon = this.shadowRoot.getElementById("no-image-display")

        this.image.style.display = "none"
        this.onchange = null

        this._initFileEvent()

        // Links the fancy div's onclick event with the input's onclick event.
        this.shadowRoot.getElementById("custom-file-upload").onclick = () => {
            this.input.click();
        }

        //By default, show the input element and not the view element
        this.unlock()
        this.reset()

    }

    /**
     * Tells the input to put the file that was found by the user into an img tag to display it.
     */
    _initFileEvent() {
        this.input.onchange = (evt) => {
            const files = evt.target.files
            if (files && files[0]) {
                let reader = new FileReader()

                reader.onload = (e) => {
                    this.image.src = e.target.result
                    // Setup the onchange event
                    if (this.onchange) {
                        this.onchange(this.image.src)
                    }

                    this.image.style.display = "block";
                    this.icon.style.display = "none";
                }

                reader.readAsDataURL(files[0])
            }
        }
    }

    getValue() {
        return this.image.src
    }

    setValue(v) {
        this.input.value = v
    }

    clear() {
        this.setValue("")
    }

    isValid() {
        return this.getValue() && this.getValue() !== ""
    }

    markInvalid() {
        this.input.style.backgroundColor = this.invalidColor
    }

    markValid() {
        this.input.style.backgroundColor = this.validColor
    }

    lock() {

        // TODO: Change the method to remove and replace the elements
        this.visualInput.style.display = "none"
    }

    unlock() {
        // TODO: The actual view is not disabled in this case when unlocked because you want to see it
        this.visualInput.style.display = ""
        // this.view.style.display = "none"
    }
}

customElements.define("globular-image-field", ImageField);

/**
 * An input field which accepts a date and also has a fancy date picker.
 */
export class DateField extends Field {

    /**
     * If x or y are 0 or negative, then there cannot be a width or a height since the grid is dependent on initial position. 
     * The position will also be automatically placed within the grid.
     * 
     * If width or height are 0 or negative, then their value will be a default of 1.
     * 
     * The above conditions apply for all variations of those parameters. 
     * Also, it isn't necessary to have all the different dimensions. It is possible to only have the small dimensions, the phone dimensions or the regular dimensions.
     * 
     * @param {*} label (aka Title) The string which will be display at the top of the Field.
     * @param {*} description The string which is displayed within the input and hovers above it once text is entered. 
     * @param {*} initialValue The initial value that the input will show
     * @param {*} x The initial position of the Field on the x axis. Starts at 1.
     * @param {*} y The initial position of the Field on the y axis. Starts at 1.
     * @param {*} width The width of the Field in grid units.
     * @param {*} height The height of the Field in grid units.
     * @param {*} xSmall The position of the Field on the x axis when the screen is small. Starts at 1.
     * @param {*} ySmall The position of the Field on the y axis when the screen is small. Starts at 1.
     * @param {*} widthSmall The width of the Field when the screen is small in grid units.
     * @param {*} heightSmall The height of the Field when the screen is small in grid units.
     * @param {*} xPhone The position of the Field on the x axis when the screen is about the size of a phone. Starts at 1.
     * @param {*} yPhone The position of the Field on the y axis when the screen is about the size of a phone. Starts at 1.
     * @param {*} widthPhone The width of the Field when the screen is about the size of a phone in grid units.
     * @param {*} heightPhone The height of the Field when the screen is about the size of a phone in grid units.
     */
    constructor(label, description, initialValue = "", x = 0, y = 0, width = 0, height = 0, xSmall = 0, ySmall = 0, widthSmall = 0, heightSmall = 0, xPhone = 0, yPhone = 0, widthPhone = 0, heightPhone = 0) {
        super(label, initialValue, x, y, width, height, xSmall, ySmall, widthSmall, heightSmall, xPhone, yPhone, widthPhone, heightPhone)
        let html = `
            <paper-input id="field-input" label="${description}" type="datetime-local" raised required error="This field is required."></paper-input>
            <div id="field-view"></div>
        `

        // Inserts the html into the proper area in the container
        let range = document.createRange();
        this.container.appendChild(range.createContextualFragment(html))

        // Gets the elements necessary for manipulating the DOM
        this.input = this.shadowRoot.getElementById("field-input");
        this.view = this.shadowRoot.getElementById("field-view")

        //By default, show the input element and not the view element
        this.unlock()
        this.reset()

    }

    getValue() {
        return this.input.value
    }

    setValue(v) {
        this.input.value = v
        this.view.innerHTML = v
    }

    clear() {
        this.setValue("")
    }

    isValid() {
        return this.getValue() && this.getValue() !== ""
    }

    markInvalid() {
        this.input.style.backgroundColor = this.invalidColor
    }

    markValid() {
        this.input.style.backgroundColor = this.validColor
    }


    lock() {
        this.view.innerHTML = this.input.value

        // TODO: Change the method to remove and replace the elements
        this.input.style.display = "none"
        this.view.style.display = ""
    }

    unlock() {
        this.input.style.display = ""
        this.view.style.display = "none"
    }
}

customElements.define("globular-date-field", DateField);

