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

// Get the image default size...
function getMeta(url, callback) {
    const img = new Image();
    img.addEventListener("load", () => {
        callback({ width: img.naturalWidth, height: img.naturalHeight });
    });
    img.src = url;
}

// generate html from json data
function jsonToHtml(data, slot) {
    // So here I will get the plain html from the output json data.
    const edjsParser = edjsHTML();
    let elements = edjsParser.parse(data);
    let html = ""
    elements.forEach(e => {
        html += e
    });

    var div = document.createElement('div');
    div.slot = slot
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

        // Innitialisation of the layout.
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

        // The set page event...
        if (!this.set_page_listener)
            Model.eventHub.subscribe("_set_web_page_",
                uuid => this.set_page_listener = uuid,
                page => {
                    console.log("set page ", page)
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
        pageLnk.webPage = new WebPage("page_" + uuidv4(), "new page")
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

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}
            #container {
                width: 100%;
                height: 100%;
            }

            globular-layout-selector {
                position: fixed;
                top: 75px;
                right: 25px;
            }
            
        </style>
        <div id="container">
            <slot></slot>
        </div>
        `

        // Now I will create the main layout...
        this.layout = new Layout(data)
        if(this.layout.label.length == 0){
            this.layout.label = "main layout"
        }

        // append it to the page.
        this.appendChild(this.layout)

        // Tool to help select layout...
        this.layoutSelector = new LayoutSelector(this.layout)

    }

    // return the stringnify page...
    toString() {
        let str = JSON.stringify({ _id: this.id, name: this.name, index: this.index, user_id: localStorage.getItem("user_id"), data: this.layout.data })
        return str
    }

    // Return the list of all page...
    setPage() {
        Model.eventHub.publish("_set_web_page_", this, true)
    }

    // enter edit mode.
    setEditMode() {
        console.log("set edit mode...")
        // Here I will display the editor...
        this.layout.setEditMode()
        this.shadowRoot.querySelector("#container").appendChild(this.layoutSelector)
    }

    resetEditMode() {
        this.layout.resetEditMode()
        this.shadowRoot.querySelector("#container").removeChild(this.layoutSelector)
    }

    // Save the actual content.
    save(callback, errorCallback) {
        this.layout.getData(data => {

            // set the layout data...
            this.layout.data = data;

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
 * Layout tool.
 */
export class Layout extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(data) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        this.data = {}
        this.label = ""
        this.style_ = ""

        if (data) {
            this.data = data;

            // The style...
            this.style_ = data.style;

            // Also set the label.
            this.label = data.label

            for (var i = 0; i < this.data.children.length; i++) {
                let layout = new Layout(this.data.children[i])
                layout.style_ = this.data.children[i].style
                layout.label = this.data.children[i].label
                this.appendChild(layout)
            }

        } else {
            // The style of the container...
            this.style_ = `
#layout{
    width: 100%; 
    height: 100%;
}
        `
        }

        // Innitialisation of the layout.
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
        </style>

        <style id="layout-style">
            ${this.style_}
        </style>

        <div id="container">
            <div style="position: relative; width: 100%; height: 100%;">
                <div id="handle">
                </div>
            </div>
        </div>

        <div id="layout">
            <slot></slot>
        </div>
        `

        // Get the layout elements...
        this.container = this.shadowRoot.querySelector("#container")
        this.handle = this.shadowRoot.querySelector("#handle")
        this.layout = this.shadowRoot.querySelector("#layout")
        this.label = ""

        // The css button.
        this.css_editor = null

        // Keep the container synch with the layout div...
        window.addEventListener('resize', () => {
            this.setContainerPosition()
        });
    }

    /**
     * Add a new layout in that layout
     */
    createLayout() {
        // Here I will create a new child layout...
        let layout = new Layout(null)
        layout.setEditMode()
        this.appendChild(layout)
        Model.eventHub.publish("_need_save_event_", null, true)
    }

    /**
     * Set the layout label (name...)
     * @param {*} label 
     */
    setLabel(label){
        this.label = label
        if(this.css_editor){
            this.css_editor.setTitle(label)
        }
    }

    /**
     * Display the css editor.
     * @returns 
     */
    showCssEditor() {
        if (this.css_editor != null) {
            this.appendChild(this.css_editor)
            let editors = document.getElementsByTagName("globular-css-editor")
            for(var i=0; i < editors.length; i++){
                editors[i].style.zIndex = 1
            }
            this.css_editor.style.zIndex = 10
            return
        }

        // Set the css from the editor...
        this.css_editor = new CssEditor((evt) => {
            if(this.style_ !=this.css_editor.getText()){
                Model.eventHub.publish("_need_save_event_", null, true)
            }
            this.style_ = this.css_editor.getText()

            // Here I will set the css text of the layout...
            this.shadowRoot.querySelector("#layout-style").innerText = this.style_
            this.setContainerPosition()
            
        },()=>{
            this.emphasis()
        },
        ()=>{
            this.de_emphasis()
        })

        this.appendChild(this.css_editor)

        // Set the style to the editor...
        this.css_editor.setText(this.style_)
        this.css_editor.setTitle(this.label)
    }

    // The connected callback...
    connectedCallback() {
        // set the container style...
        this.setContainerPosition()
    }

    emphasis(){
        this.handle.style.borderColor = "var(--palette-primary-light)"
    }

    de_emphasis(){
        this.handle.style.borderColor = "var(--palette-divider)"
    }

    setContainerPosition() {
        this.container.style.left = this.layout.offsetLeft + "px";
        this.container.style.top = this.layout.offsetTop + "px";
        this.container.style.width = this.layout.offsetWidth + "px";
        this.container.style.height = this.layout.offsetHeight + "px";
    }

    /**
     * Return the data contain in the layout...
     */
    getData(callback, errorCallback) {
        // A layout is a recursive structure...
        let obj = { style: this.style_, children: [], label: this.label}
        let layouts = this.getElementsByTagName("globular-layout")
        let getData_ = (index) => {
            if (index == layouts.length - 1) {
                layouts[index].getData((o) => {
                    obj.children.push(o)
                    callback(obj) // Done go to previous level...
                })
            } else {
                layouts[index].getData((o) => {
                    obj.children.push(o)
                    index++
                    getData_(index) // append next children object.
                })
            }
        }

        if (layouts.length > 0) {
            getData_(0)
        } else {
            callback(obj)
        }

    }

    /**
     * Set layout edit mode.
     */
    setEditMode() {
        this.handle.style.display = "block"

        let layouts = this.getElementsByTagName("globular-layout")
        for (var i = 0; i < layouts.length; i++) {
            layouts[i].setEditMode()
        }

    }

    /**
     * Reset layout edit mode.
     */
    resetEditMode() {

        this.handle.style.display = "none"

        let layouts = this.getElementsByTagName("globular-layout")
        for (var i = 0; i < layouts.length; i++) {
            layouts[i].resetEditMode()
        }
    }
}

customElements.define('globular-layout', Layout)

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

        // Innitialisation of the layout.
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
            if(this.onclose){
                this.onclose()
            }
        }

        this.editor = null;

        let container = this.shadowRoot.querySelector("#container")

        container.onmouseover = onfocus;
        container.onmouseout = onblur;

        /*
        container.onclick = ()=>{
            container.style.zIndex = 100;
        }

        container.onmouseout = ()=>{
            container.style.zIndex = 0;
            onblur()
        }*/


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
    setTitle(title){
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
 * Display the hierarchy of layout and help to select it when
 * they are hidden...
 */
export class LayoutSelector extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(layout) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        this.layout = layout;

        // Innitialisation of the layout.
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

            #label:hover{
                cursor: pointer;
            }

        </style>
        <div id="container">
            <div id="edit-mode" style="display: none;">
                <input id="label-input" value="${this.layout.label}"></input>
                <paper-icon-button id="delete-layout-btn"  icon="icons:delete" class="btn"></paper-icon-button>
                <paper-tooltip for="delete-layout-btn" role="tooltip" tabindex="-1">Delete Layout</paper-tooltip>
                <paper-icon-button id="add-layout-btn" icon="icons:add" class="btn"></paper-icon-button>
                <paper-tooltip for="add-layout-btn" role="tooltip" tabindex="-1">Add Layout</paper-tooltip>
            </div>
   
            <span id="label">${this.layout.label}</span>
            <div id="childrens"></div>
        </div>
        `


        // Help to see where is the layout on the page.
        let label = this.shadowRoot.querySelector("#label")
        label.onmouseenter = ()=>{
            this.layout.emphasis()
        }

        label.onmouseout = ()=>{
            this.layout.de_emphasis()
        }

        // Display the 
        label.onclick = ()=>{
            this.layout.emphasis()
            label.style.display = "none";
            this.shadowRoot.querySelector("#edit-mode").style.display = "flex";
            this.layout.showCssEditor()
            this.layout.css_editor.onclose = ()=>{
                this.layout.de_emphasis()
                label.style.display = "block";
                this.shadowRoot.querySelector("#edit-mode").style.display = "none";
            }
        }

        let input = this.shadowRoot.querySelector("#label-input")
        input.onchange = ()=>{
           label.innerHTML = input.value;
           layout.setLabel(input.value)
           Model.eventHub.publish("_need_save_event_", null, true);

        }

        let addLayoutBtn = this.shadowRoot.querySelector("#add-layout-btn")
        addLayoutBtn.onclick = ()=>{

        }

        let deleteLayoutBtn = this.shadowRoot.querySelector("#delete-layout-btn")
        deleteLayoutBtn.onclick = ()=>{

        }

        for(var i=0; i < this.layout.children.length; i++){
            let c =  this.layout.children[i]
            if(c.label.length == 0){
                c.label = " children " + i
            }
            this.shadowRoot.querySelector("#childrens").appendChild(new LayoutSelector(c))
        }

    }
}
customElements.define('globular-layout-selector', LayoutSelector)

