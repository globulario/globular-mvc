import { Model } from "../Model";
import { getTheme } from "./Theme";
import { SlidePanel } from "./Slide"
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import { ApplicationView } from "../ApplicationView";
import { mergeTypedArrays, uint8arrayToStringMethod } from "../Utility";
import { v4 as uuidv4 } from "uuid";
import * as JwtDecode from "jwt-decode";
import { DeleteOneRqst, FindRqst, ReplaceOneRqst } from "globular-web-client/persistence/persistence_pb";

// The ace editor...
import * as ace from 'brace';
import 'brace/mode/css';
import 'brace/mode/javascript';
import 'brace/mode/html';
import 'brace/theme/monokai';

import { setMoveable } from './moveable'
import { setResizeable } from './rezieable'
import { getCoords, randomUUID } from "./utility";
import * as getUuidByString from "uuid-by-string";

import * as cssbeautifier from "cssbeautifier"
import htmlBeautify from 'html-beautify'

// Test if the tag can hold text...
function canHoldText(tagName) {
    let tags = [
        "tt",
        "i",
        "b",
        "big",
        "small",
        "em",
        "strong",
        "dfn",
        "code",
        "samp",
        "kbd",
        "var",
        "cite",
        "abbr",
        "acronym",
        "sub",
        "sup",
        "span",
        "bdo",
        "address",
        "div",
        "a",
        "object",
        "p",
        "h1", "h2", "h3", "h4", "h5", "h6",
        "pre",
        "q",
        "ins",
        "del",
        "dt",
        "dd",
        "li",
        "label",
        "option",
        "textarea",
        "fieldset",
        "legend",
        "button",
        "caption",
        "td",
        "th",
        "title",
        "script",
        "style",
        "blockquote"]

    return tags.indexOf(tagName.toLowerCase()) != -1
}

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

        // Innitialisation of the element.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}

            #container{
                display: flex;
                align-items: center;
            }

            .vertical{
                flex-direction: column-reverse;
            }

            .horizontal{
                flex-grow: 1;
                border-right: 1px solid var(--palette-divider);
                margin-left: 10px;
                padding-left: 10px;
                margin-right: 10px;
                padding-right: 10px;
            }

            #toolbar {
                display: flex;
            }

        </style>


        <div id="container">

            <slot></slot>
            <div id="toolbar">
                <paper-icon-button id="create-page-btn" icon="icons:note-add"></paper-icon-button>
                <paper-tooltip for="create-page-btn" role="tooltip" tabindex="-1">Create Web Page</paper-tooltip>
                
                <paper-icon-button id="set-create-mode-btn" icon="icons:create"></paper-icon-button>
                <paper-tooltip for="set-create-mode-btn" role="tooltip" tabindex="-1">Enter Edit Mode</paper-tooltip>

                <paper-icon-button id="save-all-btn" icon="icons:save"></paper-icon-button>
                <paper-tooltip for="save-all-btn" role="tooltip" tabindex="-1">Save All Change</paper-tooltip>
            </div>
        </div>
        `

        // only display tool if the user is allowed...
        this.toolbar = this.shadowRoot.querySelector("#toolbar")
        this.toolbar.parentNode.removeChild(this.toolbar)
    }

    init() {
        this.navigation = new Navigation()

        this.appendChild(this.navigation)
        this.navigation.init()

        // init stuff.
        if (this.needSaveEventListener == null)
            Model.eventHub.subscribe("_need_save_event_", uuid => this.needSaveEventListener = uuid, evt => {
                let saveAllBtn = this.shadowRoot.querySelector("#save-all-btn")
                saveAllBtn.removeAttribute("disable")
                saveAllBtn.style.setProperty("--iron-icon-fill-color", "var(--palette-text-primary)")
                window.dispatchEvent(new Event('resize'));
            })
    }

    setVertical() {
        this.shadowRoot.querySelector("#container").classList.add("vertical")
        this.shadowRoot.querySelector("#container").classList.remove("horizontal")
        this.navigation.setVertical()
    }

    setHorizontal() {
        this.shadowRoot.querySelector("#container").classList.add("horizontal")
        this.shadowRoot.querySelector("#container").classList.remove("vertical")
        this.navigation.setHorizontal()
    }

    // Display the toolbar...
    setEditMode() {
        this.shadowRoot.querySelector("#container").appendChild(this.toolbar)
        let setCreateModeBtn = this.shadowRoot.querySelector("#set-create-mode-btn")
        let createPageBtn = this.shadowRoot.querySelector("#create-page-btn")
        let saveAllBtn = this.shadowRoot.querySelector("#save-all-btn")

        setCreateModeBtn.style.setProperty("--iron-icon-fill-color", "var(--palette-action-disabled)")
        createPageBtn.style.display = "none"
        saveAllBtn.style.display = "none"
        saveAllBtn.setAttribute("disable")
        saveAllBtn.style.setProperty("--iron-icon-fill-color", "var(--palette-action-disabled)")

        setCreateModeBtn.onclick = () => {
            if (createPageBtn.style.display == "none") {
                setCreateModeBtn.style.setProperty("--iron-icon-fill-color", "var(--palette-text-primary)")
                createPageBtn.style.display = "block"
                saveAllBtn.style.display = "block"
                Model.eventHub.publish("_set_content_edit_mode_", true, true)
            } else {
                setCreateModeBtn.style.setProperty("--iron-icon-fill-color", "var(--palette-action-disabled)")
                createPageBtn.style.display = "none"
                saveAllBtn.style.display = "none"
                Model.eventHub.publish("_set_content_edit_mode_", false, true)
            }
        }

        // Save all...
        saveAllBtn.onclick = () => {
            if (saveAllBtn.hasAttribute("disable")) {
                return // nothing to save...
            }

            // Save all pages at once.
            this.navigation.savePages()
            saveAllBtn.setAttribute("disable")
            saveAllBtn.style.setProperty("--iron-icon-fill-color", "var(--palette-action-disabled)")
        }

        createPageBtn.onclick = () => {
            Model.eventHub.publish("_create_page_event_", {}, true)
        }
    }

}

customElements.define('globular-content-manager', ContentManager)


/**
 * Contain the navigation panel
 */
export class Navigation extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the element.
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

        // keep page to be deleted...
        this.toDelete = []
    }

    init() {
        // set|reset edit mode
        if (!this.set_content_edit_mode_listener)
            Model.eventHub.subscribe("_set_content_edit_mode_", uuid => this.set_content_edit_mode_listener = uuid, evt => this.setEditMode(evt))


        // create a new page
        if (!this.create_page_listener)
            Model.eventHub.subscribe("_create_page_event_", uuid => this.create_page_listener = uuid, evt => this.createPage())

        // delete page event.
        if (!this.delete_page_listener)
            Model.eventHub.subscribe("_delete_web_page_", uuid => this.delete_page_listener = uuid, page => {
                console.log("delete page...", page)
                this.toDelete.push(page)

                // so here I will delete the page lnk...
                let lnk = page.link
                this.removeChild(lnk)
                let lnks = document.getElementsByTagName("globular-page-link")
                for (var i = 0; i < lnks.length; i++) {
                    lnks[i].webPage.index = i;
                }

                if (lnks.length > 0) {
                    if (lnk.webPage.index == 0) {
                        lnks[0].webPage.setPage()
                    } else {
                        lnks[lnk.webPage.index - 1].webPage.setPage()
                    }
                }

            })

        // The set page event...
        if (!this.set_page_listener)
            Model.eventHub.subscribe("_set_web_page_",
                uuid => this.set_page_listener = uuid,
                page => {
                    let lnks = document.getElementsByTagName("globular-page-link")
                    for (var i = 0; i < lnks.length; i++) {
                        lnks[i].de_emphasis()
                    }

                    lnks[page.index].emphasis()

                }, true)

        // Init the webpages...
        ApplicationView.wait(`<div style="display: flex; flex-direction: column; justify-content: center;"><span>load webpages</span><span>please wait</span><span>...</span></div>`)
        this.loadWebPages(pages => {
            ApplicationView.resume()
            for (var i = 0; i < pages.length; i++) {
                let page = new WebPage(pages[i]._id, pages[i].name, pages[i].style, pages[i].script, pages[i].index, pages[i].elements)
                let lnk = new NavigationPageLink(page)
                this.appendChild(lnk)
                if (page.index == 0) {
                    page.setPage()
                }
            }
        }, err => ApplicationView.displayMessage(err, 3000));
    }

    setVertical() {
        this.shadowRoot.querySelector("#container").style.flexDirection = "column"
    }

    setHorizontal() {
        this.shadowRoot.querySelector("#container").style.flexDirection = "row"
    }

    // Retreive webpage content...
    loadWebPages(callback, errorCallback) {

        // Insert the notification in the db.
        let rqst = new FindRqst();

        // set connection infos.
        let db = Model.application + "_db";
        rqst.setId(Model.application);
        rqst.setDatabase(db);
        rqst.setCollection("WebPages");
        rqst.setQuery("{}");

        let stream = Model.getGlobule(Model.address).persistenceService.find(rqst, {
            application: Model.application,
            domain: Model.domain
        });

        let data = [];

        stream.on("data", (rsp) => {
            data = mergeTypedArrays(data, rsp.getData());
        });

        stream.on("status", (status) => {
            if (status.code == 0) {
                uint8arrayToStringMethod(data, (str) => {
                    callback(JSON.parse(str));
                });
            } else {
                // In case of error I will return an empty array
                errorCallback(status.details)
            }
        });
    }

    // Set|Reset edit mode.
    setEditMode(edit) {
        let links = this.querySelectorAll("globular-page-link")
        for (var i = 0; i < links.length; i++) {
            links[i].edit = edit;
            if (edit) {
                // set the page edit mode.
                links[i].webPage.edit = true
                links[i].webPage.setEditMode()
            } else {
                links[i].resetEditMode()
                links[i].webPage.edit = false
                links[i].webPage.resetEditMode()
            }
        }
    }

    // Create page event.
    createPage() {

        let index = 0
        let lnks = document.getElementsByTagName("globular-page-link")
        if (lnks) {
            index = lnks.length
        }

        let page = new WebPage("page_" + uuidv4(), "new page", "", "", index)
        let pageLnk = new NavigationPageLink(page)
        this.appendChild(pageLnk)
        pageLnk.setEditMode()
    }

    // Save all pages...
    savePages() {

        // delete the page 
        let deletePages_ = (page) => {
            // delete the page.
            page.delete(() => {
                if (this.toDelete.length > 0) {
                    let page = this.toDelete.pop()
                    deletePages_(page)
                }
            }, err => {
                ApplicationView.displayMessage(err, 300);
                // also try to delete the page.
                if (this.toDelete.length > 0) {
                    let page = this.toDelete.pop()
                    deletePages_(page)
                }
            })
        }


        let links = this.querySelectorAll("globular-page-link")
        let savePages_ = (index) => {
            if (index < links.length - 1) {
                links[index].save(() => {
                    savePages_(++index)
                }, err => {
                    // I will set the page index before save it... 
                    links[index].webPage.index = index
                    ApplicationView.displayMessage(`fail to save page ${links[index].webPage.name} with error </br>`, err, 3000)
                    savePages_(++index)
                });
            } else {
                links[index].save(() => {
                    if (this.toDelete.length > 0) {
                        // remove page mark as delete...
                        let page = this.toDelete.pop()
                        deletePages_(page)
                    }
                    ApplicationView.displayMessage("all content was saved", 3000)
                }, err => {
                    ApplicationView.displayMessage(`fail to save page ${links[index].webPage.name} with error </br>`, err, 3000)
                });

            }
        }

        if (links.length > 0) {
            savePages_(0)
        }

    }
}

customElements.define('globular-navigation', Navigation)


/**
 * Page link...
 */
export class NavigationPageLink extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(webPage) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
        this.edit = true
        if (webPage) {
            this.webPage = webPage
            this.webPage.link = this
        }

        // Innitialisation of the element.
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
            <span id="page-name-editor" style="display: none;">
                <input id="page-name-editor-input" type="text"></input>
            </span>
        </div>
        `

        this.editor = this.shadowRoot.querySelector("#page-name-editor")
        this.input = this.shadowRoot.querySelector("#page-name-editor-input")
        this.span = this.shadowRoot.querySelector("#page-name-span")

        // Set the page...
        this.span.onclick = () => {
            this.webPage.setPage()
            this.emphasis()
        }

        // set initial values.
        if (this.webPage) {
            this.edit = false
            this.span.innerHTML = this.webPage.name
            this.input.value = this.webPage.name
        }

        // enter edit mode.
        this.span.addEventListener('dblclick', () => {
            if (this.edit) {
                this.setEditMode()
            }
        });

        // Set the page 
        this.input.onblur = () => {
            if (this.webPage.name != this.input.value) {

                this.webPage.setName(this.input.value)

            }
            this.resetEditMode()
        }

        // I will use the span to calculate the with of the input.
        this.input.onkeyup = (evt) => {
            if (evt.code === 'Enter' || evt.code === "NumpadEnter") {
                this.resetEditMode()
                return
            } else if (evt.code === 'Escape') {
                this.resetEditMode()
                return
            }
            this.setInputWidth()
        }
    }

    emphasis() {
        let lnks = this.shadowRoot.querySelectorAll("globular-page-link")
        for (var i = 0; i < lnks.length; i++) {
            lnks[i].de_emphasis()
        }

        this.span.style.textDecoration = "underline"
    }

    de_emphasis() {
        this.span.style.textDecoration = "none"
    }

    setInputWidth() {
        this.span.innerHTML = this.input.value;
        this.input.style.width = this.span.offsetWidth + 4 + "px"
    }

    setEditMode() {
        this.input.value = this.webPage.name
        this.setInputWidth()
        this.editor.style.display = "flex"
        this.span.style.visibility = "hidden"
        this.span.style.position = "absolute"
        setTimeout(() => {
            this.input.focus()
            this.input.setSelectionRange(0, this.input.value.length)
        }, 100)

        // also set it page to edit mode...
        this.webPage.edit = true
        this.webPage.setEditMode()

    }

    resetEditMode() {

        this.setInputWidth()
        this.editor.style.display = "none"
        this.span.style.visibility = "visible"
        this.span.style.position = ""
        this.webPage.edit = false
    }

    save(callback, errorCallback) {
        this.webPage.save(callback, errorCallback)
    }

}

customElements.define('globular-page-link', NavigationPageLink)

/**
 * A webpage is a container. It's use by the navigation bar to display
 * website section by subject. Ex. Home, Personal Page, About... 
 * ** not that blogs, contiue watching, fileExplorer are not part of page content, but at
 *    the application level.
 */
export class WebPage extends HTMLElement {

    // Create the applicaiton view.
    constructor(id, name, style, script, index, elements) {
        super()

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // The css editor.
        this.css_editor = null

        // The javascript editor
        this.javascript_editor = null

        // edit mode 
        this.edit = false

        // Page Name 
        this.name = name
        if (this.hasAttribute("name")) {
            this.name = this.getAttribute("name")
        } else if (name.length > 0) {
            this.setAttribute("name", name)
        }

        // set the page id.
        this.id = id;
        if (this.hasAttribute("id")) {
            this.id = this.getAttribute("id")
        } else if (id.length > 0) {
            this.setAttribute("id", id)
        }


        // The style element.
        this.style_ = style

        if (this.style_.length == 0) {

            this.style_ = `
#${this.id}{
    /** Element style here */
}`
        }


        // The script element
        this.script_ = script
        if (this.script_ == undefined) {
            this.script_ = ""
        }


        // The page index (use by navigation)
        if (index != undefined) {
            this.index = index
        } else {
            this.index = 0;
        }

        if (this.hasAttribute("index")) {
            this.index = this.getAttribute("index")
        } else if (index) {
            this.setAttribute("index", index)
        }

        // Innitialisation of the element.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}
            #container {
                width: 100%;
                height: 100%;
                position: relative;
            }


            #selectors{
                display: flex;
                flex-direction: column;
                margin-left: 10px;
                font-size: 1rem;
            }
            
            #page-selector:hover{
                cursor: pointer;
            }

            globular-element-selector {
                margin-left: 16px;
            }

            globular-element-selector:hover{
                cursor: pointer;
            }

            #toolbar{
                display: flex;
                flex-direction: column;
                position: fixed;
                top: 65px;
                left: 0px;
            }

            .toolbar{
                display: flex;
                flex-direction: row;
                height: 40px;
            }


            .toolbar paper-icon-button, paper-button{
                height: 40px;
                margin: 0px;
                color: var(--palette-text-primary);
                background-color: var(--palette-primary-accent);
                border-bottom: 1px solid var(--palette-divider);
                border-radius: 0px;
            }

            #current-edit-page{
                font-family: var(--font-family);
                color: var(--palette-action-disabled);
                font-size: 1rem;
                margin-left: 5px;
            }

            #current-edit-page:hover{
                cursor: pointer;
            }

            #delete-page-btn{
                border-right: 1px solid var(--palette-divider);
            }

        </style>
        <div id="container">
            <slot></slot>
            <div id="toolbar">
                <div class="toolbar">
                    <paper-icon-button id="add-element-btn" icon="icons:add" class="btn"></paper-icon-button>
                    <paper-tooltip for="add-element-btn" role="tooltip" tabindex="-1">Add Element</paper-tooltip>
                    <paper-button id="css-edit-btn">css</paper-button>
                    <paper-tooltip for="css-edit-btn" role="tooltip" tabindex="-1">Edit CSS</paper-tooltip>
                    <paper-button id="js-edit-btn">js</paper-button>
                    <paper-tooltip for="js-edit-btn" role="tooltip" tabindex="-1">Edit JS</paper-tooltip>
                    <paper-icon-button id="delete-page-btn"  icon="icons:delete" class="btn"></paper-icon-button>
                    <paper-tooltip for="delete-page-btn" role="tooltip" tabindex="-1">Delete Page</paper-tooltip>
                </div>
                <span id="current-edit-page">
                    ${this.name}
                </span>
            </div>
            <globular-slide-panel side="right">
                <div id="selectors">
                    <div id="${this.id}_selector" style="text-decoration: underline;">${this.name}</div>
                    <div style="margin-left: 10px; display: flex; flex-direction: column;">
                    <slot name="selectors"></slot>
                    </div>
                </div>
            </globular-slide-panel>
        </div>
        `

        // Editing menu...
        this.toolbar = this.shadowRoot.querySelector("#toolbar")
        this.selectors = this.shadowRoot.querySelector("globular-slide-panel")

        this.shadowRoot.querySelector("#current-edit-page").onclick = () => {
            // scroll to page.
            document.getElementsByTagName("globular-web-page")[0].scrollTo({
                top: this.shadowRoot.querySelector(`#${this.id}_selector`).offsetTop - (65 + 10),
                left: 0,
                behavior: 'smooth'
            });
        }


        this.appendElementBtn = this.shadowRoot.querySelector("#add-element-btn")
        this.appendElementBtn.onclick = () => {
            this.appendElement("DIV", "_" + randomUUID()) // create an empty div...
        }

        this.pageSelector = this.shadowRoot.querySelector(`#${this.id}_selector`)
        this.pageSelector.onclick = () => {
            let selectors = document.getElementsByTagName("globular-element-selector")
            for (var i = 0; i < selectors.length; i++) {
                selectors[i].de_emphasis()
            }

            // Here I will reset all visible toolbar..
            this.emphasis()

            // hide all toolbar...
            let editors = document.getElementsByTagName("globular-element-editor")
            for (var i = 0; i < editors.length; i++) {
                editors[i].resetEditMode()
            }

            // display the page toolbar...
            this.toolbar.style.display = "flex"

        }

        // Now I will create the sytle element.
        let style_ = document.createElement("style")
        style_.innerText = this.style_
        style_.id = this.id + "_style"
        this.appendChild(style_)

        // set the script for the page.
        let script_ = document.createElement("script")
        script_.innerText = this.script_
        script_.id = this.id + "_script"

        // script_.setAttribute("type", "module")
        this.appendChild(script_)

        // Initialyse page elements and sub-elements.
        if (elements) {
            for (var i = 0; i < elements.length; i++) {
                let e = elements[i]
                e.parent = this
                let editor = new ElementEditor(e)
                editor.selector.slot = "selectors"
                if (!this.querySelector("#" + editor.selector.id))
                    this.appendChild(editor.selector)
            }
        }

        let editCssBtn = this.shadowRoot.querySelector("#css-edit-btn")
        editCssBtn.onclick = () => {
            this.showCssEditor()
        }

        let deletePageBtn = this.shadowRoot.querySelector("#delete-page-btn")
        deletePageBtn.onclick = () => {
            this.markForDelete()
        }

        let editJavascriptBtn = this.shadowRoot.querySelector("#js-edit-btn")
        editJavascriptBtn.onclick = () => {
            this.showJavascriptEditor()
        }

        // Keep the container synch with the element div...
        window.addEventListener('resize', () => {

        });

        // hide toolbar and selectors...
        this.resetEditMode()


        // The on drop event.
        this.ondrop = (evt) => {
            evt.preventDefault();

            var html = evt.dataTransfer.getData("text/html");
            let selector = this.getActiveSelector()
            if (selector != null) {
                selector.style.border = ""
                ApplicationView.wait("append content...")
                // Set the content from the html text...
                selector.editor.setHtml(html)
                ApplicationView.resume()
            }
        }

        // The drag over content.
        this.ondragover = (evt) => {
            evt.preventDefault();
            let selector = this.getActiveSelector()
            if (selector == null) {
                ApplicationView.displayMessage("select the target element where to drop the content.", 3500)
                return
            }
            selector.style.border = "1px solid var(--palette-divider)"
        }

    }

    // Append element on the page.
    appendElement(tagName, id) {
        // Now I will create the element selector and editor.
        let editor = new ElementEditor({ id: id, tagName, parentId: this.id, parent: this })
        this.appendChild(editor)
        editor.selector.slot = "selectors"
        this.appendChild(editor.selector)
        Model.eventHub.publish("_need_save_event_", null, true)
    }

    // Return the list of all page...
    setPage() {
        Model.eventHub.publish("_set_web_page_", this, true)
    }

    scrollTo(to) {
        this.selectors.scrollTo(to)
    }

    // Delete the webpage event...
    markForDelete() {
        // delete from it parent
        if (this.parentNode) {
            this.parentNode.removeChild(this)
        }
        Model.eventHub.publish("_delete_web_page_", this, true)
        Model.eventHub.publish("_need_save_event_", null, true)
    }

    // Set the page name
    setName(name) {
        this.setAttribute("name", name)
        this.name = name;
        Model.eventHub.publish("_need_save_event_", null, true)
        this.shadowRoot.querySelector("#page-selector").innerHTML = this.name
        this.shadowRoot.querySelector("#current-edit-page").innerHTML = this.name

        this.edit = true;
        this.setPage()
    }

    /**
     * Display the javascript code editor.
     * @returns 
     */
    showJavascriptEditor() {
        if (this.getJavascriptEditor() != null) {
            ApplicationView.layout.workspace().appendChild(this.getJavascriptEditor())
            let editors = document.getElementsByTagName("globular-code-editor")
            for (var i = 0; i < editors.length; i++) {
                editors[i].style.zIndex = 1
            }
            this.getJavascriptEditor().style.zIndex = 10
            return
        }
    }

    getJavascriptEditor() {
        if (this.javascript_editor != null) {
            return this.javascript_editor
        }
        // Set the css from the editor...
        this.javascript_editor = new CodeEditor("javascript", ApplicationView.layout.workspace(), (evt) => {
            if (this.style_ != this.javascript_editor.getText()) {
                Model.eventHub.publish("_need_save_event_", null, true)
            }

            // set the script
            this.script_ = this.javascript_editor.getText()

            // Here I will set the css text of the element...
            this.querySelector(`#${this.id}_script`).innerText = this.script_

        }, () => {
            // on editor focus
        }, () => {
            // on editor lost focus
        })

        // Set the style to the editor...
        this.javascript_editor.setText(this.script_)
        this.javascript_editor.setTitle("JS " + this.id)

        return this.javascript_editor
    }

    getCssEditor() {
        if (this.css_editor != null) {
            return this.css_editor
        }
        // Set the css from the editor...
        this.css_editor = new CodeEditor("css", ApplicationView.layout.workspace(), (evt) => {
            if (this.style_ != this.css_editor.getText()) {
                Model.eventHub.publish("_need_save_event_", null, true)
            }

            this.style_ = this.css_editor.getText()

            // Here I will set the css text of the element...
            this.querySelector(`#${this.id}_style`).innerText = this.style_

        }, () => {
            // focus
        }, () => {
            // lost focus
        })


        // Set the style to the editor...
        this.css_editor.setText(this.style_)
        this.css_editor.setTitle(this.id)

        return this.css_editor
    }

    // show the css edito.
    showCssEditor() {
        // Show the css to edit the element style.
        if (this.getCssEditor() != null) {
            ApplicationView.layout.workspace().appendChild(this.getCssEditor())
            let editors = document.getElementsByTagName("globular-code-editor")
            for (var i = 0; i < editors.length; i++) {
                editors[i].style.zIndex = 1
            }
            this.getCssEditor().style.zIndex = 10
            return
        }
    }

    hideToolbar() {
        this.shadowRoot.querySelector("#toolbar").style.display = "none"
    }

    getActiveSelector() {
        let selectors = document.getElementsByTagName("globular-element-selector")
        for (var i = 0; i < selectors.length; i++) {
            if (selectors[i].active) {
                return selectors[i]
            }
        }
        return null
    }

    // enter edit mode.
    setEditMode() {
        // Here I will display the editor...
        let editors = document.getElementsByTagName("globular-element-editor")
        for (var i = 0; i < editors.length; i++) {
            editors[i].edit = false
            editors[i].resetEditMode()
        }

        this.shadowRoot.querySelector("#container").appendChild(this.selectors)
        this.shadowRoot.querySelector("#container").appendChild(this.toolbar)
    }

    resetEditMode() {
        let editors = this.querySelectorAll("globular-element-editor")
        for (var i = 0; i < editors.length; i++) {
            editors[i].edit = false
            editors[i].resetEditMode()
        }
        this.shadowRoot.querySelector("#container").removeChild(this.selectors)
        this.shadowRoot.querySelector("#container").removeChild(this.toolbar)
    }

    emphasis() {
        this.shadowRoot.querySelector(`#${this.id}_selector`).style.textDecoration = "underline"
    }

    de_emphasis() {
        this.shadowRoot.querySelector(`#${this.id}_selector`).style.textDecoration = ""
    }

    delete(callback, errorCallback) {
        // save the user_data
        let rqst = new DeleteOneRqst();
        let db = Model.application + "_db";

        // set the connection infos,
        rqst.setId(Model.application);
        rqst.setDatabase(db);
        let collection = "WebPages";

        // save only user data and not the how user info...
        rqst.setCollection(collection);
        rqst.setQuery(`{"_id":"${this.id}"}`);

        // So here I will set the address from the address found in the token and not 
        // the address of the client itself.
        let token = localStorage.getItem("user_token")
        let decoded = JwtDecode(token);
        let address = decoded.address;
        let domain = decoded.domain;

        // call persist data
        Model.getGlobule(address).persistenceService
            .deleteOne(rqst, {
                token: token,
                application: Model.application,
                domain: domain,
                address: address
            })
            .then((rsp) => {
                // Here I will return the value with it
                Model.eventHub.publish(`update_page_${this.id}_evt`, str, false)
                callback(this);
            })
            .catch((err) => {
                errorCallback(err);
            });
    }

    // Save the actual content.
    save(callback, errorCallback) {

        let editors = []
        // keep only immediate childs.
        for (var i = 0; i < this.children.length; i++) {
            if (this.children[i].editor) {
                editors.push(this.children[i].editor)
            }
        }

        let elements = []

        let getData_ = (index) => {
            if (index < editors.length) {
                let editor = editors[index]
                editor.getData(data => {
                    // set the element data...
                    elements.push(data);
                    index += 1
                    getData_(index)
                }, errorCallback)
            } else {

                // create a string from page information..
                let str = JSON.stringify({ _id: this.id, name: this.name, style: this.style_, script: this.script_, index: this.index, user_id: localStorage.getItem("user_id"), elements: elements })

                // save the user_data
                let rqst = new ReplaceOneRqst();
                let db = Model.application + "_db";

                // set the connection infos,
                rqst.setId(Model.application);
                rqst.setDatabase(db);
                let collection = "WebPages";

                // save only user data and not the how user info...
                rqst.setCollection(collection);
                rqst.setQuery(`{"_id":"${this.id}"}`);
                rqst.setValue(str);
                rqst.setOptions(`[{"upsert": true}]`);

                // So here I will set the address from the address found in the token and not 
                // the address of the client itself.
                let token = localStorage.getItem("user_token")
                let decoded = JwtDecode(token);
                let address = decoded.address;
                let domain = decoded.domain;

                // call persist data
                Model.getGlobule(address).persistenceService
                    .replaceOne(rqst, {
                        token: token,
                        application: Model.application,
                        domain: domain,
                        address: address
                    })
                    .then((rsp) => {
                        // Here I will return the value with it
                        Model.eventHub.publish(`update_page_${this.id}_evt`, str, false)
                        callback(this);
                    })
                    .catch((err) => {
                        errorCallback(err);
                    });
            }
        }

        // save page element event it's empty...
        getData_(0)

    }
}

customElements.define('globular-web-page', WebPage)


/**
 * Element Editor.
 */
export class ElementEditor extends HTMLElement {

    // Create the applicaiton view.
    constructor(data) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the element.
        this.shadowRoot.innerHTML = `
               <style>
                   ${getTheme()}
                   #container{
                       position: absolute;
                   }
       
                   #handle{
                       display: none;
                       position: absolute;
                       top: 0px;
                       left: 0px;
                       bottom: 0px;
                       right: 0px;
                       border: 4px dashed var(--palette-divider);
                   }
       

                   #toolbar{
                        display: flex;
                        flex-direction: column;
                        position: fixed;
                        top: 65px;
                        left: 0px;
                    }
        
                    .toolbar{
                        display: flex;
                        flex-direction: row;
                        height: 40px;
                    }
        
                    .toolbar paper-icon-button, paper-button{
                        height: 40px;
                        margin: 0px;
                        color: var(--palette-text-primary);
                        background-color: var(--palette-primary-accent);
                        border-bottom: 1px solid var(--palette-divider);
                        border-radius: 0px;
                    }
        
                    #current-edit-element{
                        font-family: var(--font-family);
                        color: var(--palette-action-disabled);
                        font-size: 1rem;
                        margin-left: 5px;
                    }

                    #current-edit-element:hover{
                        cursor: pointer;
                    }
        

                    #delete-element-btn{
                        border-right: 1px solid var(--palette-divider);
                    }
                   
               </style>
       
               <div id="container">
                   <div style="position: relative; width: 100%; height: 100%;">
                       <div id="handle"></div>
                   </div>
                   <div id="toolbar">
                        <div class="toolbar">
                            <paper-icon-button id="add-element-btn" icon="icons:add" class="btn"></paper-icon-button>
                            <paper-tooltip for="add-element-btn" role="tooltip" tabindex="-1">Add Element</paper-tooltip>
                            <paper-button id="css-edit-btn">css</paper-button>
                            <paper-tooltip for="css-edit-btn" role="tooltip" tabindex="-1">Edit CSS</paper-tooltip>
                            <paper-button id="js-edit-btn">js</paper-button>
                            <paper-tooltip for="js-edit-btn" role="tooltip" tabindex="-1">Edit JS</paper-tooltip>
                            <paper-icon-button style="display: none;" id="text-edit-btn"  icon="editor:text-fields" class="btn"></paper-icon-button>
                            <paper-tooltip for="text-edit-btn" role="tooltip" tabindex="-1">Edit Text</paper-tooltip>
                            <paper-icon-button style="display: none;" id="image-edit-btn"  icon="editor:insert-photo" class="btn"></paper-icon-button>
                            <paper-tooltip for="image-edit-btn" role="tooltip" tabindex="-1">Set Image</paper-tooltip>
                            <paper-icon-button id="delete-element-btn"  icon="icons:delete" class="btn"></paper-icon-button>
                            <paper-tooltip for="delete-element-btn" role="tooltip" tabindex="-1">Delete Element</paper-tooltip>
                        </div>
                        <span id="current-edit-element">
                            ${data.id}
                        </span>
                    </div>
               </div>
               <slot></slot>
               `

        this.id = ""
        this.style_ = ""
        this.script_ = ""
        this.edit = false;

        if (data) {

            this.id = data.id + "_editor"

            // The parent id where to create the element...
            this.parentId = data.parentId
            if (data.parent == undefined) {
                this.parent = document.getElementById(this.parentId)
                if (!this.parent) {
                    ApplicationView.displayMessage("no node found with id " + this.parentId, 3000)
                    return
                }
            } else {
                this.parent = data.parent
            }

            // The tagName
            this.tagName_ = data.tagName

            // The style...
            if (data.style) {
                this.style_ = data.style;
            } else {
                this.style_ = `
#${data.id}{
    /** Element style here */
}
`
            }

            // set the script.
            if (data.script) {
                this.script_ = data.script
            }

            this.element = this.parent.querySelector("#" + data.id)
            if (this.element == undefined) {

                // I will create the element it-self
                this.element = document.createElement(data.tagName)
                if (this.element == null) {
                    this.element = document.createElement("DIV")
                    console.log("fail to create element of type ", data.tagName, " I will use a DIV instead...")
                }

                this.element.id = data.id
                this.element.editor = this
                this.parent.appendChild(this.element)

                this.setElementEvents()

                // the classes
                if (data.classes) {
                    for (var i = 0; i < data.classes.length; i++) {
                        if (data.classes[i].length > 0) {
                            let className = data.classes[i]
                            this.element.classList.add(className)

                        }
                    }
                }

                // the attributes...
                if (data.attributes) {
                    for (var name in data.attributes) {
                        // I will keep generated id instead of exting one.
                        if (name != "id" && name != "style" && name != "class") {
                            if (data.attributes[name])
                                this.element.setAttribute(name, data.attributes[name])
                        }
                    }
                }

                // set the data depending of the type
                if (data.data) {
                    if (data.tagName == "IMG") {
                        this.element.src = data.data
                    } else {
                        this.element.innerHTML = data.data
                    }
                }

                // if the node can hold text I will display the edit button...
                if (canHoldText(data.tagName)) {
                    this.shadowRoot.querySelector("#text-edit-btn").style.display = "block"
                    this.shadowRoot.querySelector("#text-edit-btn").onclick = () => {
                        this.showHtmlEditor()
                    }
                } else if (data.tagName == "IMG") {
                    this.shadowRoot.querySelector("#image-edit-btn").style.display = "block"
                }

                // I will create the element style.
                this.elementStyle = document.createElement("style")
                this.elementStyle.id = data.id + "_style"
                this.parent.appendChild(this.elementStyle)
                this.parent.querySelector(`#${data.id}_style`).innerText = this.style_

                // I will create the element script.
                this.elementScript = document.createElement("script")
                this.elementScript.id = data.id + "_script"
                this.parent.appendChild(this.elementScript)
                this.parent.querySelector(`#${data.id}_script`).innerText = this.script_

            }

            // Set the element selector
            if (this.selector == null) {
                this.selector = new ElementSelector(this)
                this.selector.id = data.id + "_selector"
                if (this.parent.editor) {
                    if (this.parent.editor.selector) {
                        this.parent.editor.selector.appendSelector(this.selector)
                    }
                }
            }

            // set elment in view...
            this.shadowRoot.querySelector("#current-edit-element").onclick = () => {
                let position = getCoords(document.getElementById(this.element.id))
                window.scrollTo({
                    top: position.top - (65 + 10),
                    left: 0,
                    behavior: 'smooth'
                });

                document.getElementsByTagName("globular-web-page")[0].scrollTo({
                    top: document.getElementById(this.selector.id).offsetTop - (65 + 10),
                    left: 0,
                    behavior: 'smooth'
                });
            }


            // Initilalyse sub-elements and sub-element editor...
            if (data.children) {
                for (var i = 0; i < data.children.length; i++) {
                    data.children[i].parent = this.element // set the element in the data...
                    new ElementEditor(data.children[i])
                }
            }
        }

        // Get the element elements...
        this.container = this.shadowRoot.querySelector("#container")


        this.handle = this.shadowRoot.querySelector("#handle")

        // Here the user try to access element hidden by this editor...
        this.handle.addEventListener('dblclick', (evt) => {
            this.selector.de_emphasis()
            this.de_emphasis()
            this.parentNode.removeChild(this)
        })

        this.toolbar = this.shadowRoot.querySelector("#toolbar")

        // The css editor...
        this.css_editor = null

        // The javascript editor
        this.javascript_editor = null

        // The html content editor...
        this.html_editor = null

        // Add new element...
        let addLayoutBtn = this.shadowRoot.querySelector("#add-element-btn")
        addLayoutBtn.onclick = () => {
            this.createElement()
        }

        // Delete element.
        let deleteLayoutBtn = this.shadowRoot.querySelector("#delete-element-btn")
        deleteLayoutBtn.onclick = () => {
            // also remove it selector.
            this.selector.parentNode.removeChild(this.selector)
            this.parentNode.removeChild(this)
            this.element.parentNode.removeChild(this.element)
            Model.eventHub.publish("_need_save_event_", null, true)
        }

        let editCssBtn = this.shadowRoot.querySelector("#css-edit-btn")
        editCssBtn.onclick = () => {
            this.showCssEditor()
        }

        let editJavascriptBtn = this.shadowRoot.querySelector("#js-edit-btn")
        editJavascriptBtn.onclick = () => {
            this.showJavascriptEditor()
        }

        // Keep the container synch with the element div...
        window.addEventListener('resize', () => {
            this.setContainerPosition()
        });

        // That function will be use to edit the content of the element...
        this.handle.addEventListener('dblclick', (evt) => {
            evt.stopImmediatePropagation()
        });
    }

    /**
     * Add a new element in that element
     */
    createElement() {
        // Here I will create a new child element...
        let editor = new ElementEditor({ tagName: "DIV", parentId: this.id, parent: this.element, id: "_" + uuidv4(), style: "" })
        this.element.appendChild(editor)
        Model.eventHub.publish("_need_save_event_", null, true)
    }

    /**
     * 
     * @param {*} e 
     */
    countChildren(e) {
        let count = 0;
        for (var i = 0; i < e.children.length; i++) {
            let c = e.children[i]
            if (c.tagName != "STYLE" && c.tagName != "SCRIPT") {
                count += 1
            }
        }
        return count
    }

    getElementData(e) {
        let data = ""

        // Here I will get various element data.
        if (e.tagName == "IMG") {
            data = e.src
        } else if (e.tagName == "INPUT" || e.tagName == "TEXT-AREA") {
            data = e.value
        } else {
            if (this.countChildren(e) == 0) {
                data = e.innerText
            } else {
                // here I will try to see if the content contain free text..
                let text = [].reduce.call(e.childNodes, (a, b) => { return a + (b.nodeType === 3 ? b.textContent : ''); }, '');
                if (text.length > 0) {
                    data = e.innerHTML
                    e.innerHTML = "" // I will not process it childs...
                }
            }
        }

        return data
    }

    /**
     * Append element...
     */
    appendElement(e) {

        // Now the element style...
        if (e.tagName != "STYLE") {
            let style_ = ""
            let id = "_" + uuidv4()

            if (e.hasAttribute("style"))
                style_ = `#${id}{${e.getAttribute("style")}}`


            const attrs = e.getAttributeNames().reduce((acc, name) => {
                return { ...acc, [name]: this.element.getAttribute(name) };
            }, {});

            let classes = []
            this.element.classList.forEach(c => {
                classes.push(c)
            });

            let editor = new ElementEditor({ tagName: e.tagName, parentId: this.id, parent: this.element, id: id, style:style_, data: this.getElementData(e), attributes: attrs, classes: classes })

            // I will make the function recursive...
            for (var i = 0; i < e.children.length; i++) {
                editor.appendElement(e.children[i])
            }

            window.dispatchEvent(new Event('resize'));
        }

        Model.eventHub.publish("_need_save_event_", null, true)
    }

    /**
     * Show html editor.
     * @returns 
     */
    showHtmlEditor() {
        if (this.getHtmlEditor() != null) {
            ApplicationView.layout.workspace().appendChild(this.getHtmlEditor())
            let editors = document.getElementsByTagName("globular-code-editor")
            for (var i = 0; i < editors.length; i++) {
                editors[i].style.zIndex = 1
            }
            this.getHtmlEditor().style.zIndex = 10
            return
        }
    }

    getHtmlEditor() {
        if (this.html_editor != null) {
            return this.html_editor
        }


        // Set the css from the editor...
        this.html_editor = new CodeEditor("html", ApplicationView.layout.workspace(), (evt) => {
            // Test if the innerHTML has change...
            if (this.element.innerHTML != this.html_editor.getText()) {
                Model.eventHub.publish("_need_save_event_", null, true)
            }

            // get active editor...
            let editors = []
            let getEditors = (e) => {
                if (e.editor != undefined) {
                    editors.push(e.editor)
                }
                for (var i = 0; i < e.children.length; i++) {
                    getEditors(e.children[i])
                }
            }

            getEditors(this.element)

            // set the innerHTML value. The element object will be lost...
            this.element.innerHTML = this.html_editor.getText().replace(/(\r\n|\n|\r)/gm, "").replace("<br>", "");

            // So I will set back new element object in it editor.
            editors.forEach(editor => {
                // Set element       
                editor.element = document.getElementById(editor.element.id)
                editor.element.editor = editor
                editor.parent = editor.element.parentNode
                editor.setContainerPosition()
                editor.setElementEvents()
            })

            

        }, () => {
            this.emphasis()
        }, () => {
            this.de_emphasis()
        })

        // Set the style to the editor...
        this.html_editor.setText(htmlBeautify(this.element.innerHTML))
        this.html_editor.setTitle("HTML " + this.element.id)

        return this.html_editor
    }

    /**
     * Display the javascript code editor.
     * @returns 
     */
    showJavascriptEditor() {
        if (this.getJavascriptEditor() != null) {
            ApplicationView.layout.workspace().appendChild(this.getJavascriptEditor())
            let editors = document.getElementsByTagName("globular-code-editor")
            for (var i = 0; i < editors.length; i++) {
                editors[i].style.zIndex = 1
            }
            this.getJavascriptEditor().style.zIndex = 10
            return
        }
    }

    getJavascriptEditor() {
        if (this.javascript_editor != null) {
            return this.javascript_editor
        }
        // Set the css from the editor...
        this.javascript_editor = new CodeEditor("javascript", ApplicationView.layout.workspace(), (evt) => {
            if (this.script_ != this.javascript_editor.getText()) {
                Model.eventHub.publish("_need_save_event_", null, true)
            }

            // set the script
            this.script_ = this.javascript_editor.getText()

            // Here I will set the css text of the element...
            this.parent.querySelector(`#${this.element.id}_script`).innerText = this.script_

        }, () => {
            this.emphasis()
        }, () => {
            this.de_emphasis()
        })

        // Set the style to the editor...
        this.javascript_editor.setText(this.script_)
        this.javascript_editor.setTitle("JS " + this.element.id)

        return this.javascript_editor
    }

    /**
     * Display the css editor.
     * @returns 
     */
    showCssEditor() {
        // Show the css to edit the element style.
        if (this.getCssEditor() != null) {
            ApplicationView.layout.workspace().appendChild(this.getCssEditor())
            let editors = document.getElementsByTagName("globular-code-editor")
            for (var i = 0; i < editors.length; i++) {
                editors[i].style.zIndex = 1
            }
            this.getCssEditor().style.zIndex = 10
            return
        }
    }

    getCssEditor() {
        if (this.css_editor != null) {
            return this.css_editor
        }
        // Set the css from the editor...
        this.css_editor = new CodeEditor("css", ApplicationView.layout.workspace(), (evt) => {
            if (this.style_ != this.css_editor.getText().replace(/(\r\n|\n|\r)/gm, "").replace("<br>", "")) {
                Model.eventHub.publish("_need_save_event_", null, true)
            }

            this.style_ = this.css_editor.getText().replace(/(\r\n|\n|\r)/gm, "").replace("<br>", "");

            // Here I will set the css text of the element...
            if (this.parent.querySelector(`#${this.element.id}_style`))
                this.parent.querySelector(`#${this.element.id}_style`).innerText = this.style_

            // TODO set the context (element style, stylesheet etc.)
            this.setContainerPosition()

        }, () => {
            this.emphasis()
        }, () => {
            this.de_emphasis()
        })

        // Set the style to the editor...
        this.css_editor.setText(cssbeautifier(this.style_))
        this.css_editor.setTitle("CSS " + this.element.id)

        return this.css_editor
    }

    // The connected callback...
    connectedCallback() {
        // set the container style...
        this.setContainerPosition()
    }

    emphasis() {
        this.handle.style.borderColor = "var(--palette-primary-light)"
    }

    de_emphasis() {
        this.handle.style.borderColor = "var(--palette-divider)"
    }

    setElementEvents() {
        // The double click event.
        this.element.addEventListener('dblclick', (evt) => {
            let page = document.getElementsByTagName("globular-web-page")[0]
            if (page.edit) {
                evt.stopPropagation()
                this.element.editor.edit = true
                this.element.editor.setEditMode()
                this.element.editor.emphasis()
                let selectors = document.getElementsByTagName("globular-element-selector")
                for (var i = 0; i < selectors.length; i++) {
                    selectors[i].de_emphasis()
                }
                this.element.editor.selector.emphasis()
                page.hideToolbar()
                // Now I will scroll to the selector...
                page.scrollTo({
                    top: document.getElementById(this.element.editor.selector.id).offsetTop - (65 + 10),
                    left: 0,
                    behavior: 'smooth'
                });
            }
        });
    }

    setContainerPosition() {

        if (this.element == null) {
            return
        }

        this.container.style.top = this.element.offsetTop + "px";
        this.container.style.left = this.element.offsetLeft + "px";
        this.container.style.width = this.element.offsetWidth + "px";
        this.container.style.height = this.element.offsetHeight + "px";
    }

    /**
     * Return the data contain in the element...
     */
    getData(callback, errorCallback) {

        // get the list of all attributes.
        const attrs = this.element.getAttributeNames().reduce((acc, name) => {
            return { ...acc, [name]: this.element.getAttribute(name) };
        }, {});

        let classes = []
        this.element.classList.forEach(c => {
            classes.push(c)
        });

        // A element is a recursive structure...
        let obj = { tagName: this.tagName_, style: this.style_, script: this.script_, children: [], id: this.element.id, parentId: this.parentId, data: this.getElementData(this.element), classes: classes, attributes: attrs }
        let editors = []

        // keep only immediate childs...
        for (var i = 0; i < this.element.children.length; i++) {
            if (this.element.children[i].editor) {
                editors.push(this.element.children[i].editor)
            }
        }

        let getData_ = (index) => {
            if (index == editors.length - 1) {
                editors[index].getData((o) => {
                    obj.children.push(o)
                    callback(obj) // Done go to previous level...
                })
            } else {
                editors[index].getData((o) => {
                    obj.children.push(o)
                    index++
                    getData_(index) // append next children object.
                })
            }
        }

        if (editors.length > 0) {
            getData_(0)
        } else {
            callback(obj)
        }
    }

    showToolbar() {
        let pages = document.getElementsByTagName("globular-web-page")
        for (var i = 0; i < pages.length; i++) {
            pages[i].hideToolbar()
        }

        let editors = document.getElementsByTagName("globular-element-editor")
        for (var i = 0; i < editors.length; i++) {
            editors[i].hideToolbar()
        }

        this.shadowRoot.querySelector("#toolbar").style.display = "flex"
    }

    hideToolbar() {
        this.shadowRoot.querySelector("#toolbar").style.display = "none"
    }

    /**
     * Set element edit mode.
     */
    setEditMode() {
        // reset actual editor...
        let editors = document.getElementsByTagName("globular-element-editor")
        for (var i = 0; i < editors.length; i++) {
            editors[i].resetEditMode()
        }

        this.toolbar.style.display = "flex";


        // Set the actual editor.
        this.handle.style.display = "block";
        this.edit = true;
        this.parent.appendChild(this)
    }

    /**
     * Reset element edit mode.
     */
    resetEditMode() {
        this.toolbar.style.display = "none";

        this.handle.style.display = "none"
        this.edit = false
        this.parent.removeChild(this)
    }

    /**
     * Set html content.
     */
    setHtml(html) {

        // make a new parser
        const parser = new DOMParser();

        // convert html string into DOM
        const doc = parser.parseFromString(html, "text/html");
        for (var i = 0; i < doc.body.children.length; i++) {
            this.appendElement(doc.body.children[i])
        }

        this.resetEditMode()
    }
}

customElements.define('globular-element-editor', ElementEditor)

/**
 * Ace Editor use as CSS editor...
 */
export class CodeEditor extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(mode, parent, onchange, onfocus, onblur, onclose) {
        super()

        this.mode = mode;

        this.parent = parent;

        // This is call when the editor text change.
        this.onchange = onchange;

        // Call when the editor is close.
        this.onclose = onclose;

        this.onfocus = onfocus;

        this.onblur = onblur;

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the element.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}
            #container{
                width: 720px;
                height: 400px;
                position: fixed;
            }

            .header{
                display: flex;
                align-items: center;
                color: var(--palette-text-accent);
                background-color: var(--palette-primary-accent);
                border-bottom: 1px solid var(--palette-divider);
                z-index: 100;
            }

            .header span{
                flex-grow: 1;
                text-align: center;
                font-size: 1.1rem;
                font-weight: 500;
                display: inline-block;
                white-space: nowrap;
                overflow: hidden !important;
                text-overflow: ellipsis;
            }

            paper-card {
                background: var(--palette-background-default); 
                border-top: 1px solid var(--palette-background-paper);
                border-left: 1px solid var(--palette-background-paper);
            }

        </style>
        <paper-card id="container" class="no-select">
            <div class="header">
                <paper-icon-button id="close-btn" icon="icons:close" style="min-width: 40px; --iron-icon-fill-color: var(--palette-text-accent);"></paper-icon-button>
                <span id="title-span"></span>
            </div>

            <slot></slot>
            
        </paper-card>
        `

        this.shadowRoot.querySelector("#close-btn").onclick = () => {
            this.parentNode.removeChild(this)
            if (this.onclose) {
                this.onclose()
            }
        }

        this.editor = null;

        let container = this.shadowRoot.querySelector("#container")

        container.onmouseover = onfocus;
        container.onmouseout = onblur;

        let offsetTop = this.shadowRoot.querySelector(".header").offsetHeight
        if (offsetTop == 0) {
            offsetTop = 60
        }

        if (localStorage.getItem("__code_editor_position__")) {
            let position = JSON.parse(localStorage.getItem("__code_editor_position__"))
            if (position.top < offsetTop) {
                position.top = offsetTop
            }
            container.style.top = position.top + "px"
            container.style.left = position.left + "px"
        } else {
            container.style.left = ((document.body.offsetWidth - 720) / 2) + "px"
            container.style.top = "80px"
        }


        setMoveable(this.shadowRoot.querySelector(".header"), container, (left, top) => {
            localStorage.setItem("__code_editor_position__", JSON.stringify({ top: top, left: left }))
        }, this, offsetTop)


        if (localStorage.getItem("__code_editor_dimension__")) {
            let dimension = JSON.parse(localStorage.getItem("__code_editor_dimension__"))
            container.style.width = dimension.width + "px"
            container.style.height = dimension.height + "px"
        }

        // Set resizable properties...
        setResizeable(container, (width, height) => {
            localStorage.setItem("__code_editor_dimension__", JSON.stringify({ width: width, height: height }))
        })

        this.init()
    }

    init() {
        // init the ace editor.
        if (this.editor == null) {

            let content = document.createElement("div")
            content.style.position = "relative"
            content.style.height = "calc(100% - 40px)"
            content.style.width = "100%"
            content.id = "css-editor-" + uuidv4()
            this.appendChild(content)

            // Create the css editor...
            this.editor = ace.edit(content);
            this.editor.getSession().setMode('ace/mode/' + this.mode);

            // Set the theme...
            if (localStorage.getItem(localStorage.getItem("user_id") + "_theme") == "dark") {
                this.editor.setTheme('ace/theme/monokai');
            }

            // Connect the change event.
            this.editor.getSession().on('change', this.onchange);
        }
    }

    // Set the editor title.
    setTitle(title) {
        this.shadowRoot.querySelector("#title-span").innerHTML = title;
    }

    // Set the text to edit...
    setText(txt) {
        // Set the text.
        this.editor.setValue(txt)
    }

    // Return the editor content.
    getText() {
        return this.editor.getValue()
    }
}

customElements.define('globular-code-editor', CodeEditor)

/**
 * Layout Selector
 * Display the hierarchy of element and help to select it when
 * they are hidden...
 */
export class ElementSelector extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(editor) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // true if the selector is active.
        this.active = false

        this.editor = editor;

        // associate the selector with it element.
        editor.selector = this;

        // Innitialisation of the element.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}
            #container{
                display: flex;
                flex-direction: column;
                font-size: 1.2rem;
                margin-left: 20px;
                width: 100%;
            }

            #container span {
                white-space:nowrap;
                font-size: 1rem;
            }

            #childrens{
                display: flex;
                flex-direction: column;
            }

            #read-mode, #edit-mode{
                align-items: center;
            }

            .btn{
                --iron-icon-height: 16px;
                --iron-icon-width: 16px;
            }

            #id:hover{
                cursor: pointer;
            }

            #childrens{
                display: inline;
                width: 100%;
            }

        </style>
        <div id="container">
            <span id="id">${this.editor.element.tagName.toLowerCase()} id="${this.editor.element.id}"</span>
            <div id="childrens">
                <slot></slot>
            </div>
        </div>
        `

        // Help to see where is the element on the page.
        let id = this.shadowRoot.querySelector("#id")
        id.onmouseenter = () => {
            this.editor.emphasis()
        }

        id.onmouseout = () => {
            this.editor.de_emphasis()
        }

        // Display the id.
        id.onclick = () => {
            let position = getCoords(document.getElementById(this.editor.element.id))
            // Scroll to the element.
            window.scrollTo({
                top: position.top - (65 + 10),
                left: 0,
                behavior: 'smooth'
            });

            let pages = document.getElementsByTagName("globular-web-page")
            for (var i = 0; i < pages.length; i++) {
                pages[i].de_emphasis()
            }

            let selectors = document.getElementsByTagName("globular-element-selector")
            for (var i = 0; i < selectors.length; i++) {
                selectors[i].de_emphasis()
            }

            this.emphasis()
            this.editor.emphasis()

            // set edit mode
            this.editor.edit = true
            this.editor.setEditMode()

            // show it tool bar.
            this.editor.showToolbar()

            // set the onclose event.
            this.editor.getCssEditor().onclose = () => {
                // this.editor.resetEditMode()
            }
        }
    }

    emphasis() {
        this.active = true
        this.shadowRoot.querySelector("#id").style.textDecoration = "underline"
        this.shadowRoot.querySelector("#id").style.color = "var(--palette-primary-light)"
    }

    de_emphasis() {
        this.active = false
        this.shadowRoot.querySelector("#id").style.textDecoration = ""
        this.shadowRoot.querySelector("#id").style.color = ""
    }

    appendSelector(selector) {

        // append selector once...
        for (var i = 0; i < this.children.length; i++) {
            if (this.children[i].id == selector.id) {
                return
            }
        }

        this.appendChild(selector)
    }


}

customElements.define('globular-element-selector', ElementSelector)

