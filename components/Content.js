import { Model } from "../Model";
import { getTheme } from "./Theme";
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import { ApplicationView } from "../ApplicationView";
import EditorJS from '@editorjs/editorjs';
import RawTool from '@editorjs/raw';
import Header from '@editorjs/header';
import Delimiter from '@editorjs/delimiter';
import Embed from '@editorjs/embed';
import Table from '@editorjs/table'
import Quote from '@editorjs/quote'
import SimpleImage from '@editorjs/simple-image'
import NestedList from '@editorjs/nested-list';
import Checklist from '@editorjs/checklist';
import Paragraph from 'editorjs-paragraph-with-alignment'
import CodeTool from '@editorjs/code'
import Underline from '@editorjs/underline';
import * as edjsHTML from 'editorjs-html'
import { mergeTypedArrays, uint8arrayToStringMethod } from "../Utility";

import { v4 as uuidv4 } from "uuid";
import * as JwtDecode from "jwt-decode";
import { FindRqst, ReplaceOneRqst } from "globular-web-client/persistence/persistence_pb";

import * as ace from 'brace';
import 'brace/mode/css';
import 'brace/theme/monokai';
import { setMoveable } from './moveable'
import { setResizeable } from './rezieable'
import { GetThumbnailsRequest } from "globular-web-client/file/file_pb";
import { randomUUID } from "./utility";

// Get the image default size...
function getMeta(url, callback) {
    const img = new Image();
    img.addEventListener("load", () => {
        callback({ width: img.naturalWidth, height: img.naturalHeight });
    });
    img.src = url;
}

// generate html from json data
function jsonToHtml(data) {
    // So here I will get the plain html from the output json data.
    const edjsParser = edjsHTML();
    let elements = edjsParser.parse(data);
    let html = ""
    elements.forEach(e => {
        html += e
    });

    var div = document.createElement('div');
    div.innerHTML = html.trim();

    // Now I will set image height.
    let images = div.querySelectorAll("img")
    images.forEach(img => {
        getMeta(img.src, meta => {
            if (meta.width < div.offsetWidth && meta.height < div.offsetHeight) {
                img.style.width = meta.width + "px"
                img.style.height = meta.height + "px"
            }
        })

    })
    return div
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

            globular-navigation {
                flex-grow: 1;
            }

        </style>


        <div id="container">

            <globular-navigation></globular-navigation>

            <div id="toolbar" style="display: flex;">
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
        // init stuff.
        this.shadowRoot.querySelector("globular-navigation").init()

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
        this.shadowRoot.querySelector("globular-navigation").setVertical()
    }

    setHorizontal() {
        this.shadowRoot.querySelector("#container").classList.add("horizontal")
        this.shadowRoot.querySelector("#container").classList.remove("vertical")
        this.shadowRoot.querySelector("globular-navigation").setHorizontal()
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
            this.shadowRoot.querySelector("globular-navigation").savePages()
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
export class GlobularNavigation extends HTMLElement {
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
    }

    init() {
        // set|reset edit mode
        if (!this.set_content_edit_mode_listener)
            Model.eventHub.subscribe("_set_content_edit_mode_", uuid => this.set_content_edit_mode_listener = uuid, evt => this.setEditMode(evt))


        // create a new page
        if (!this.create_page_listener)
            Model.eventHub.subscribe("_create_page_event_", uuid => this.create_page_listener = uuid, evt => this.createPage())

        // The set page event...
        if (!this.set_page_listener)
            Model.eventHub.subscribe("_set_web_page_",
                uuid => this.set_page_listener = uuid,
                page => {
                    console.log("set page ", page)
                    let lnks = this.querySelectorAll("globular-page-link")
                    for (var i = 0; i < lnks.length; i++) {
                        lnks[i].span.style.textDecoration = "none"
                    }

                    lnks[page.index].span.style.textDecoration = "underline"

                }, true)

        // Init the webpages...
        this.loadWebPages(pages => {
            for (var i = 0; i < pages.length; i++) {
                let page = new WebPage(pages[i]._id, pages[i].name, pages[i].index, pages[i].data)
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
                links[i].webPage.setEditMode()
            } else {
                links[i].resetEditMode()
                links[i].webPage.resetEditMode()
            }
        }
    }

    // Create page event.
    createPage() {
        let pageLnk = new NavigationPageLink()
        this.appendChild(pageLnk)
        let index = 0
        let pages = ApplicationView.layout.workspace().querySelectorAll("globular-web-page")
        if (pages) {
            index = pages.length
        }
        pageLnk.webPage = new WebPage("page_" + uuidv4(), "new page", index)
        pageLnk.setEditMode()
    }

    // Save all pages...
    savePages() {
        let links = this.querySelectorAll("globular-page-link")
        let savePages_ = (index) => {
            if (index < links.length - 1) {
                links[index].save(() => {
                    savePages_(++index)
                }, err => {
                    ApplicationView.displayMessage(`fail to save page ${links[index].webPage.name} with error </br>`, err)
                    savePages_(++index)
                });
            } else {
                links[index].save(() => {
                    ApplicationView.displayMessage("all content was saved", 3000)
                }, err => {
                    ApplicationView.displayMessage(`fail to save page ${links[index].webPage.name} with error </br>`, err)
                });

            }
        }

        if (links.length > 0) {
            savePages_(0)
        }

    }
}

customElements.define('globular-navigation', GlobularNavigation)


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
        this.webPage = webPage

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
                <paper-icon-button icon="icons:delete"></paper-icon-button>
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
                this.webPage.name = this.input.value;
                this.webPage.setAttribute("name", this.webPage.name)
                Model.eventHub.publish("_need_save_event_", null, true)
                this.webPage.edit = true;
                this.webPage.setPage()
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
    constructor(id, name, index, data) {
        super()

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

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

            globular-element-selector {
                position: fixed;
                top: 75px;
                right: 25px;
            }

            #add-page-element-btn{
                display: none;
                position: absolute;
                top: 0px;
                left: 0px;
            }
            
        </style>
        <div id="container">
            <paper-icon-button id="add-page-element-btn" icon="icons:add"></paper-icon-button>
            <paper-tooltip for="add-page-element-btn" role="tooltip" tabindex="-1">Add Element</paper-tooltip>
            <slot></slot>
        </div>
        `

        // Now I will create the main element...
        /*this.element = new ElementEditor(data)
        if (this.element.id.length == 0) {
            this.element.id = "_" + uuidv4()
        }

        // append it to the page.
        this.appendChild(this.element)

        // Tool to help select element...
        this.elementSelector = new ElementSelector(this.element)*/

        this.appendElementBtn = this.shadowRoot.querySelector("#add-page-element-btn")
        this.appendElementBtn.onclick = () => {
            this.appendElement("div", "_" + randomUUID()) // create an empty div...
        }

    }

    // Append element on the page.
    appendElement(tagName, id) {
   
        // Now I will create the element selector and editor.
        let elementEditor = new ElementEditor({id: "_" + randomUUID(), tagName:"DIV", parentId: this.id})
        this.appendChild(elementEditor)

        // set in edit mode.
        elementEditor.setEditMode()
    }

    // return the stringnify page...
    toString() {
        let str = JSON.stringify({ _id: this.id, name: this.name, index: this.index, user_id: localStorage.getItem("user_id"), data: this.element.data })
        return str
    }

    // Return the list of all page...
    setPage() {
        Model.eventHub.publish("_set_web_page_", this, true)
    }

    // enter edit mode.
    setEditMode() {
        console.log("set edit mode...")
        this.appendElementBtn.style.display = "block"
        // Here I will display the editor...
        //this.element.setEditMode()
        //this.shadowRoot.querySelector("#container").appendChild(this.elementSelector)
    }

    resetEditMode() {
        this.appendElementBtn.style.display = "none"
        //this.element.resetEditMode()
        //this.shadowRoot.querySelector("#container").removeChild(this.elementSelector)
    }

    // Save the actual content.
    save(callback, errorCallback) {
        // TODO save all imediate child...
        
        this.element.getData(data => {

            // set the element data...
            this.element.data = data;

            // save the editor content to the application database.
            let str = this.toString()

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
                    console.log(str)
                    callback(this);
                })
                .catch((err) => {
                    errorCallback(err);
                });
        }, errorCallback)

    }
}

customElements.define('globular-web-page', WebPage)

/**
 * Return the list of all rules.
 * @param {*} el 
 * @returns 
 */
let getRules = (el) => {
    var sheets = window.document.styleSheets, ret = [];
    el.matches = el.matches || el.webkitMatchesSelector || el.mozMatchesSelector || el.msMatchesSelector || el.oMatchesSelector;
    for (var i in sheets) {
        try {
            var rules = sheets[i].rules || sheets[i].cssRules;
            for (var r in rules) {
                if (el.matches(rules[r].selectorText)) {
                    ret.push(rules[r]);
                }
            }
        } catch (exception) {

        }
    }

    return ret;
}

/**
 * Return the list of inheriated rules.
 * @param {*} node 
 * @param {*} parentNode 
 */
let getInheritedRules = (node, parentNode) => {

    if (parentNode.cssRules == undefined) {
        parentNode.cssRules = []
    }

    if (node.inheritedCssRules == undefined) {
        node.inheritedCssRules = []
    }

    for (var i = 0; i < parentNode.cssRules.length; i++) {
        let rule = parentNode.cssRules[i]
        if (node.matches(rule.selectorText)) {
            if (node.inheritedCssRules.indexOf(rule) == -1 && node.cssRules.indexOf(rule) == -1) {
                node.inheritedCssRules.push(rule);
            }
        }
    }

    if (parentNode.parentNode != undefined) {
        getInheritedRules(node, parentNode.parentNode)
    }
}

/**
 * Element Editor.
 */
export class ElementEditor extends HTMLElement {

    // Create the applicaiton view.
    constructor(data) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
        this.id = ""
        this.style_ = ""
        this.edit = false;

        if (data) {

            // The tagName
            this.tagName_ = data.tagName

            // The style...
            if(data.style_){
                this.style_ = data.style;
            }else{
                this.style_ = `
#${data.id}{
    /** Element style here */
}
`
            }

            // Also set the id.
            this.id = data.id

            // The parent id where to create the element...
            this.parentId = data.parentId
            this.parent = document.getElementById(this.parentId)
            if(!this.parent){
                ApplicationView.displayMessage("no node found with id " + this.parentId)
                return
            }

            this.element = this.parent.querySelector("#" + this.id)
            if(this.element==undefined){

                // I will create the element it-self
                this.element = document.createElement(data.tagName)
                this.element.id = this.id
                this.parent.appendChild(this.element)

                // I will create the element style.
                this.elementStyle = document.createElement("style")
                this.elementStyle.id = this.id + "_style"
                this.parent.appendChild(this.elementStyle)

            }

            /**
                for (var i = 0; i < data.children.length; i++) {
                    let element = new ElementEditor(data.children[i])
                    element.style_ = data.children[i].style
                    element.id = data.children[i].id
                    element.content = data.children[i].content
                    this.appendChild(element)
                }
            */
        }

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
                position: absolute;
                top: 0px;
                left: 0px;

            }
        </style>

        <div id="container">
            <div style="position: relative; width: 100%; height: 100%;">
                <div id="handle">
                    <div id="toolbar">
                        <paper-icon-button id="delete-element-btn"  icon="icons:delete" class="btn"></paper-icon-button>
                        <paper-tooltip for="delete-element-btn" role="tooltip" tabindex="-1">Delete Layout</paper-tooltip>
                        <paper-icon-button id="add-element-btn" icon="icons:add" class="btn"></paper-icon-button>
                        <paper-tooltip for="add-element-btn" role="tooltip" tabindex="-1">Add Layout</paper-tooltip>
                        <paper-button id="css-edit-btn">css</paper-button>
                        <paper-tooltip for="css-edit-btn" role="tooltip" tabindex="-1">Edit CSS</paper-tooltip>
                        <paper-button id="js-edit-btn">js</paper-button>
                        <paper-tooltip for="js-edit-btn" role="tooltip" tabindex="-1">Edit JS</paper-tooltip>
                    </div>
                </div>
            </div>
        </div>
        <slot></slot>
        `

        // Get the element elements...
        this.container = this.shadowRoot.querySelector("#container")
        this.handle = this.shadowRoot.querySelector("#handle")
        this.selector = null

        // The css editor...
        this.css_editor = null

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
            Model.eventHub.publish("_need_save_event_", null, true)
        }

        let editCssBtn = this.shadowRoot.querySelector("#css-edit-btn")
        editCssBtn.onclick = () => {
            this.showCssEditor()
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
        let element = new ElementEditor({ tagName:"DIV", parentId:this.id, id:"_" + uuidv4(), style:""})
        element.setEditMode()
        this.appendChild(element)
        Model.eventHub.publish("_need_save_event_", null, true)

        // this.selector.appendSelector(new ElementSelector(element))
    }

    /**
     * Set the element id (name...)
     * @param {*} id 
     */
    setId(id) {
        this.id = id
        if (this.css_editor) {
            this.css_editor.setTitle(id)
        }
    }

    /**
     * Display the css editor.
     * @returns 
     */
    showCssEditor() {

        // Show the css to edit the element style.
        if (this.css_editor != null) {
            this.appendChild(this.css_editor)
            let editors = document.getElementsByTagName("globular-css-editor")
            for (var i = 0; i < editors.length; i++) {
                editors[i].style.zIndex = 1
            }
            this.css_editor.style.zIndex = 10
            return
        }

        // Set the css from the editor...
        this.css_editor = new CssEditor((evt) => {
            if (this.style_ != this.css_editor.getText()) {
                Model.eventHub.publish("_need_save_event_", null, true)
            }

            this.style_ = this.css_editor.getText()

            // Here I will set the css text of the element...
            this.parent.querySelector(`#${this.id}_style`).innerText = this.style_

            // TODO set the context (element style, stylesheet etc.)
            this.setContainerPosition()

        }, () => {
            this.emphasis()
        }, () => {
            this.de_emphasis()
        })

        this.appendChild(this.css_editor)

        // Set the style to the editor...
        this.css_editor.setText(this.style_)
        this.css_editor.setTitle(this.id)
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

    setContainerPosition() {
        this.container.style.left = this.element.offsetLeft + "px";
        this.container.style.top = this.element.offsetTop + "px";
        this.container.style.width = this.element.offsetWidth + "px";
        this.container.style.height = this.element.offsetHeight + "px";
    }

    /**
     * Return the data contain in the element...
     */
    getData(callback, errorCallback) {
        // A element is a recursive structure...
        let obj = { tagName: this.tagName_, style: this.style_, children: [], id: this.id, parentId: this.parentId }

        if (this.editor_js) {
            // save the editor content to the application database.
            this.editor_js.save().then((data) => {
                obj.content = data
                callback(obj)

            }).catch(err => errorCallback(err))
        } else if (this.content) {
            callback(obj)
        } else {

            let elements_ = this.querySelectorAll("globular-element-editor")
            let elements = []

            // keep only immediate childs...
            for (var i = 0; i < elements_.length; i++) {
                if (elements_[i].parentNode == this) {
                    elements.push(elements_[i])
                }
            }

            let getData_ = (index) => {
                if (index == elements.length - 1) {
                    elements[index].getData((o) => {
                        obj.children.push(o)
                        callback(obj) // Done go to previous level...
                    })
                } else {
                    elements[index].getData((o) => {
                        obj.children.push(o)
                        index++
                        getData_(index) // append next children object.
                    })
                }
            }

            if (elements.length > 0) {
                getData_(0)
            } else {
                callback(obj)
            }
        }
    }

    /**
     * Set element edit mode.
     */
    setEditMode() {
        this.handle.style.display = "block"
        this.edit = true

        /** see if all element must be in edit mode...
        let elements = this.getElementsByTagName("globular-element-editor")
        for (var i = 0; i < elements.length; i++) {
            elements[i].setEditMode()
        }
        */
    }

    /**
     * Reset element edit mode.
     */
    resetEditMode() {
        this.handle.style.display = "none"
        this.edit = false

        /** see if all element must be in edit mode.
        let elements = this.getElementsByTagName("globular-element-editor")
        for (var i = 0; i < elements.length; i++) {
            elements[i].resetEditMode()
        }
        */
    }
}

customElements.define('globular-element-editor', ElementEditor)

/**
 * Ace Editor use as CSS editor...
 */
export class CssEditor extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(onchange, onfocus, onblur, onclose) {
        super()

        // This is call when the editor text change.
        this.onchange = onchange;

        // Call when the editor is close.
        this.onclose = onclose

        this.onfocus = onfocus

        this.onblur = onblur

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

        if (localStorage.getItem("__css_editor_position__")) {
            let position = JSON.parse(localStorage.getItem("__css_editor_position__"))
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
            localStorage.setItem("__css_editor_position__", JSON.stringify({ top: top, left: left }))
        }, this, offsetTop)


        if (localStorage.getItem("__css_editor_dimension__")) {
            let dimension = JSON.parse(localStorage.getItem("__css_editor_dimension__"))
            container.style.width = dimension.width + "px"
            container.style.height = dimension.height + "px"
        }

        // Set resizable properties...
        setResizeable(container, (width, height) => {
            localStorage.setItem("__css_editor_dimension__", JSON.stringify({ width: width, height: height }))
        })
    }

    connectedCallback() {
        // init the ace editor.
        if (this.editor == null) {

            let content = document.createElement("div")
            content.style.position = "relative"
            content.style.height = "calc(100% - 40px)"
            content.style.width = "100%"
            content.id = "css-editor-" + uuidv4()
            this.appendChild(content)


            // Create the css editor...
            this.editor = ace.edit(content.id);
            this.editor.getSession().setMode('ace/mode/css');

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
        console.log("set value ", txt)
        this.editor.setValue(txt)
    }

    // Return the editor content.
    getText() {
        return this.editor.getValue()
    }
}

customElements.define('globular-css-editor', CssEditor)

/**
 * Layout Selector
 * Display the hierarchy of element and help to select it when
 * they are hidden...
 */
export class ElementSelector extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(element) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        this.element = element;

        // associate the selector with it element.
        element.selector = this;

        // Innitialisation of the element.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}
            #container{
                display: flex;
                flex-direction: column;
                font-size: 1.2rem;
            }

            #childrens{
                display: flex;
                flex-direction: column;
                margin-left: 20px;
            }

            input{
                border: none;
                font-size: 1.2rem;
                width: 120px;
                background-color: transparent;
            }

            input:focus{
                outline: none;
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

        </style>
        <div id="container">
            <div id="edit-mode" style="display: none;">
                <input id="id-input" value="${this.element.id}"></input>
            </div>
            <span id="id">${this.element.id}</span>
            <div id="childrens"></div>
        </div>
        `

        // Help to see where is the element on the page.
        let id = this.shadowRoot.querySelector("#id")
        id.onmouseenter = () => {
            this.element.emphasis()
        }

        id.onmouseout = () => {
            this.element.de_emphasis()
        }

        // Display the id.
        id.onclick = () => {
            this.element.emphasis()
            id.style.display = "none";
            this.shadowRoot.querySelector("#edit-mode").style.display = "flex";
            // set the onclose event.
            this.element.css_editor.onclose = () => {
                this.element.de_emphasis()
                id.style.display = "block";
                this.shadowRoot.querySelector("#edit-mode").style.display = "none";
            }
        }

        let input = this.shadowRoot.querySelector("#id-input")
        input.onchange = () => {
            id.innerHTML = input.value;
            element.setId(input.value)
            Model.eventHub.publish("_need_save_event_", null, true);

        }

        for (var i = 0; i < this.element.children.length; i++) {
            let c = this.element.children[i]
            if (c.tagName == "GLOBULAR-LAYOUT") {
                if (c.id.length == 0) {
                    c.id = "children " + i
                }
                this.appendSelector(new ElementSelector(c))
            }
        }

    }

    appendSelector(element) {
        this.shadowRoot.querySelector("#childrens").appendChild(element)
    }
}

customElements.define('globular-element-selector', ElementSelector)

