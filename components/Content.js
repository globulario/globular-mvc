import { Model } from "../Model";
import { getTheme } from "./Theme";
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-icon-button/paper-icon-button.js';

/**
 * The content creator, it control edit mode and page creation.
 */
export class ContentManager extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}

            #container{
                display: flex;
                align-items: center;
                flex-grow: 1;
                border-right: 1px solid var(--palette-divider);
                margin-left: 10px;
                padding-left: 10px;
                margin-right: 10px;
                padding-right: 10px;
            }

            globular-navigation {
                flex-grow: 1;
            }

        </style>


        <div id="container">
            <globular-navigation></globular-navigation>
            <paper-icon-button id="create-page-btn" icon="icons:note-add" title="create page"></paper-icon-button>
            <paper-icon-button id="set-create-mode-btn" icon="icons:create" title="edit mode" ></paper-icon-button>
        </div>
        `

        let setCreateModeBtn = this.shadowRoot.querySelector("#set-create-mode-btn")
        let createPageBtn = this.shadowRoot.querySelector("#create-page-btn")

        setCreateModeBtn.style.setProperty("--iron-icon-fill-color", "var(--palette-action-disabled)")
        createPageBtn.style.display = "none"

        setCreateModeBtn.onclick = () => {
            if (createPageBtn.style.display == "none") {
                setCreateModeBtn.style.setProperty("--iron-icon-fill-color", "var(--palette-text-primary)")
                createPageBtn.style.display = "block"
                Model.eventHub.publish("_set_content_edit_mode_", true, true)
            } else {
                setCreateModeBtn.style.setProperty("--iron-icon-fill-color", "var(--palette-action-disabled)")
                createPageBtn.style.display = "none"
                Model.eventHub.publish("_set_content_edit_mode_", false, true)
            }


        }

        createPageBtn.onclick = () => {
            Model.eventHub.publish("_create_page_event_", {}, true)
        }
    }

    init() {
        // init stuff.
        this.shadowRoot.querySelector("globular-navigation").init()
    }
}

customElements.define('globular-content-manager', ContentManager)


/**
 * Contain the navigation panel
 */
export class GlobularNavigation extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}

            #container {
                display: flex;
            }

            ::slotted(globular-page-link){
                margin-left: 10px;
                margin-right: 10px;
            }

        </style>
        <div id="container">
            <slot></slot>
        </div>
        `

        // Connect to event
        this.set_content_edit_mode_listener = null

        this.create_page_listener = null
    }

    init() {
        // set|reset edit mode
        if (!this.set_content_edit_mode_listener)
            Model.eventHub.subscribe("_set_content_edit_mode_", uuid => this.set_content_edit_mode_listener = uuid, evt => this.setEditMode(evt))


        // create a new page
        if (!this.create_page_listener)
            Model.eventHub.subscribe("_create_page_event_", uuid => this.create_page_listener = uuid, evt => this.createPage())
    }

    // Set|Reset edit mode.
    setEditMode(edit) {
        let links = this.querySelectorAll("globular-page-link")
        for (var i = 0; i < links.length; i++) {
            links[i].edit = edit;
            if (edit) {
                links[i].resetEditMode()
            }
        }
    }

    // Create page event.
    createPage() {
        let pageLnk = new NavigationPageLink()
        this.appendChild(pageLnk)
        pageLnk.pageName = "new page"
        pageLnk.setEditMode()

    }
}

customElements.define('globular-navigation', GlobularNavigation)


/**
 * Page link...
 */
export class NavigationPageLink extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
        this.edit = false
        this.pageName = ""

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}

            #page-name-span {
                font-size: 1.5rem;
            }

            #page-name-editor{
                display: none;
                border-bottom: 1px solid;
            }

            #page-name-editor-input{
                border: none;
                font-size: 1.5rem;
                width: fit-content;
            }
            
            #page-name-editor-input:focus{
                outline: none;
            }

            #page-name-span:hover{
                cursor: pointer;
            }

        </style>
        <div>
            <span id="page-name-span"></span>
            <span id="page-name-editor" style="display: flex;">
                <paper-icon-button icon="icons:delete"></paper-icon-button>
                <input id="page-name-editor-input" type="text"></input>
            </span>
        </div>
        `

        this.editor = this.shadowRoot.querySelector("#page-name-editor")
        this.input = this.shadowRoot.querySelector("#page-name-editor-input")

        this.span = this.shadowRoot.querySelector("#page-name-span")

        // enter edit mode.
        this.span.addEventListener('dblclick', () => {
            if(this.edit){
                this.setEditMode()
            }
        });

        // Set the pageName 
        this.input.onblur = () => {
            this.pageName = this.input.value;
            this.resetEditMode()
        }

        // I will use the span to calculate the with of the input.
        this.input.onkeyup = (evt) => {
            if (evt.code === 'Enter') {
                this.pageName = this.input.value
                this.resetEditMode()
                return
            } else if (evt.code === 'Escape') {
                this.resetEditMode()
                return
            }
            this.setInputWidth()
        }

    }

    setInputWidth() {
        this.span.innerHTML = this.input.value;
        this.input.style.width = this.span.offsetWidth + 4 + "px"
    }

    setEditMode() {
        this.input.value = this.pageName
        this.setInputWidth()
        this.editor.style.display = "flex"
        this.span.style.visibility = "hidden"
        this.span.style.position = "absolute"
        setTimeout(() => {
            this.input.focus()
            this.input.setSelectionRange(0, this.input.value.length)
        }, 100)
    }

    resetEditMode() {
        this.setInputWidth()
        this.editor.style.display = "none"
        this.span.style.visibility = "visible"
        this.span.style.position = ""
    }

}

customElements.define('globular-page-link', NavigationPageLink)