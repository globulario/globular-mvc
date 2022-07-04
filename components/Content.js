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
    div.slot = "read-mode"
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
            })
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



        // The page data...
        if (data != undefined) {
            this.data = data
        } else {
            this.data = {} // empty object...
        }

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
        </style>
        <slot name="read-mode">
        </slot>
        <slot name="edit-mode">
        </slot>
        `

        // Create the editor div...
        this.editorDiv = document.createElement("div")
        this.editorDiv.id = id + "_editorjs"
        this.editorDiv.slot = "edit-mode"
        this.appendChild(this.editorDiv)

        // append the content as read mode...
        this.setContent()
    }

    setContent() {
        // Here the content is initialysed...
        if (this.data.version) {
            let div = jsonToHtml(this.data)
            div.id = "content"
            this.appendChild(div)
        }
    }

    // Set the page editor...
    setEditor(callback) {

        // Here I will create the editor...
        // Here I will create a new editor...

        this.editor = new EditorJS({
            onChange: (api, event) => {
                /** Publish need save event. */
                Model.eventHub.publish("_need_save_event_", null, true)
            },
            holder: this.editorDiv.id,
            autofocus: true,
            /** 
             * Available Tools list. 
             * Pass Tool's class or Settings object for each Tool you want to use 
             * 
             * linkTool: {
                    class: LinkTool,
                    config: {
                        endpoint: 'http://localhost:8008/fetchUrl', // Your backend endpoint for url data fetching
                    }
                },
             */
            tools: {
                header: Header,
                delimiter: Delimiter,
                quote: Quote,
                list: NestedList,
                checklist: {
                    class: Checklist,
                    inlineToolbar: true,
                },
                table: Table,
                paragraph: {
                    class: Paragraph,
                    inlineToolbar: true,
                },
                underline: Underline,
                code: CodeTool,
                raw: RawTool,
                embed: {
                    class: Embed,
                    inlineToolbar: false,
                    config: {
                        services: {
                            youtube: true,
                            coub: true,
                            codepen: true,
                            imgur: true,
                            gfycat: true,
                            twitchvideo: true,
                            vimeo: true,
                            vine: true,
                            twitter: true,
                            instagram: true,
                            aparat: true,
                            facebook: true,
                            pinterest: true,
                        }
                    },
                },
                image: SimpleImage,
            },
            data: this.getData()
        });

        // Move the editor inside the 
        this.editor.isReady
            .then(() => {
                /** Do anything you need after editor initialization */
                this.editorDiv.querySelector(".codex-editor__redactor").style.paddingBottom = "0px";
                /** done with the editor initialisation */
                callback()

            })
            .catch((reason) => {
                ApplicationView.displayMessage(`Editor.js initialization failed because of ${reason}`, 3000)
            });

    }

    getData() {
        return this.data
    }

    toString() {
        let str = JSON.stringify({ _id: this.id, name: this.name, index: this.index, user_id: localStorage.getItem("user_id"), data: this.data })
        return str
    }

    fromString(str) {
        // Here I will initialise the page from string.
        let obj = JSON.parse(str)
        this.id = obj._id
        this.name = obj.name
        this.data = obj.data
    }

    // Return the list of all page...
    setPage() {
        Model.eventHub.publish("_set_web_page_", this, true)
    }

    // enter edit mode.
    setEditMode() {
        // Here I will display the editor...
        this.setEditor(() => {
            let content = this.querySelector("#content")
            if (content)
                this.removeChild(content)
        })
    }

    resetEditMode() {
        this.editorDiv.innerHTML = ""
        this.setContent()
    }

    // Save the actual content.
    save(callback, errorCallback) {
        if (this.editor == null) {
            errorCallback("no editor was initilyse")
            return
        }

        // save the editor content to the application database.
        this.editor.save().then((data) => {

            this.data = data
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
        })

    }
}

customElements.define('globular-web-page', WebPage)