import { Model } from "../Model";

import { SlidePanel } from "./Slide"
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import { ApplicationView } from "../ApplicationView";
import { mergeTypedArrays, uint8arrayToStringMethod } from "../Utility";
import { v4 as uuidv4 } from "uuid";
import * as JwtDecode from "jwt-decode";
import { DeleteOneRqst, FindOneRqst, FindRqst, ReplaceOneRqst } from "globular-web-client/persistence/persistence_pb";

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
import jsBeautify from 'js-beautify'
import nodeToDataURL from 'html-element-to-image'
import { GetThumbnailsRequest, GetThumbnailsResponse, GetVideoConversionLogsRequest } from "globular-web-client/file/file_pb";
import { DeleteDocumentRequest, IndexJsonObjectRequest } from "globular-web-client/search/search_pb";
import { PermissionManager } from "../Permission";
import { Application } from "../Application";
import { SubjectType } from "globular-web-client/rbac/rbac_pb";
import domtoimage from 'dom-to-image';
import { timeSince } from "./BlogPost";
import { RemoveGroupMemberAccountRqst } from "globular-web-client/resource/resource_pb";

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

function getChildIndex(node) {
    return Array.prototype.indexOf.call(node.parentNode.childNodes, node);
}

// Return the css editor.
function getCssEditor(style) {

    if (getWorkspace().querySelector("#" + style.id + "_css_editor") != null) {
        return getWorkspace().querySelector("#" + style.id + "_css_editor")
    }


    // Set the css from the editor...
    let css_editor = new CodeEditor("css", (evt) => {
        try {
            if (cssbeautifier(style.innerText) != css_editor.getText()) {
                Model.eventHub.publish("_need_save_event_", null, true)
            }

            // Here I will set the css text of the element...
            style.innerText = css_editor.getText()
        } catch (err) {
            style.innerText = css_editor.getText()
        }

    }, () => {
        // focus
    }, () => {
        // lost focus
    })

    // Set the style to the editor...
    css_editor.setText(cssbeautifier(style.innerText))
    if (style.name)
        css_editor.setTitle("CSS:" + style.name)
    else
        css_editor.setTitle("CSS:" + style.id.replace("_style", ""))

    return css_editor
}

// show the css editor.
function showCssEditor(style) {
    // Show the css to edit the element style.
    let editor = getCssEditor(style)
    if (editor != null) {
        ApplicationView.layout.workspace().appendChild(editor)
        editor.style.zIndex = 1000;
        let editors = document.getElementsByTagName("globular-code-editor")
        for (var i = 0; i < editors.length; i++) {
            editors[i].style.zIndex = 1
        }
        editor.style.zIndex = 100

        return
    }
}

/**
 * Display the javascript code editor.
 * @returns 
 */
function showJavascriptEditor(script) {
    let javascript_editor = getJavascriptEditor(script)
    if (javascript_editor != null) {
        ApplicationView.layout.workspace().appendChild(javascript_editor)
        javascript_editor.style.zIndex = 1000;
        let editors = document.getElementsByTagName("globular-code-editor")
        for (var i = 0; i < editors.length; i++) {
            editors[i].style.zIndex = 1
        }
        javascript_editor.style.zIndex = 100
        return
    }
}

function getJavascriptEditor(script) {

    if (getWorkspace().querySelector("#" + script.id + "_js_editor") != null) {
        return getWorkspace().querySelector("#" + style.id + "_js_editor")
    }

    // Set the css from the editor...
    let javascript_editor = new CodeEditor("javascript", (evt) => {
        try {
            if (jsBeautify(script.innerText) != javascript_editor.getText()) {
                script.reload = true // mark it to be reload at save time...
                Model.eventHub.publish("_need_save_event_", null, true)
            }

            // set the script
            script.innerText = javascript_editor.getText().split("<br>").join("")
        } catch (err) {
            script.innerText = javascript_editor.getText().split("<br>").join("")
        }
    }, () => {
        // on editor focus
    }, () => {
        // on editor lost focus
    })

    // set the editor id
    javascript_editor.id = script.id + "_js_editor"

    // Set the style to the editor...
    javascript_editor.setText(jsBeautify(script.innerText))
    if (script.name)
        javascript_editor.setTitle("JS:" + script.name)
    else
        javascript_editor.setTitle("JS:" + script.id.replace("_script", ""))

    return javascript_editor
}

/**
 * Show html editor.
 * @returns 
 */
function showHtmlEditor(element) {
    let html_editor = getHtmlEditor(element)
    if (html_editor != null) {
        ApplicationView.layout.workspace().appendChild(html_editor)
        html_editor.style.zIndex = 1000;
        let editors = document.getElementsByTagName("globular-code-editor")
        for (var i = 0; i < editors.length; i++) {
            editors[i].style.zIndex = 1
        }
        html_editor.style.zIndex = 100
        return
    }
}

function getHtmlEditor(element) {
    // be sure that the element reference is up to date.

    if (getWorkspace().querySelector("#" + element.id + "_html_editor") != null) {
        return getWorkspace().querySelector("#" + element.id + "_html_editor")
    }

    // Set the css from the editor...
    let html_editor = new CodeEditor("html", (evt) => {
        // Test if the innerHTML has change...
        try {
            if (htmlBeautify(element.outerHTML) != html_editor.getText()) {
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

            getEditors(element)

            // set the innerHTML value. The element object will be lost...
            element.outerHTML = html_editor.getText().replace(/(\r\n|\n|\r)/gm, "").trim() // that will flush the actual element...
            element = document.getElementById(element.id)

            // So I will set back new element object in it editor.
            editors.forEach(editor => {
                // Set element      
                editor.element = document.getElementById(editor.element.id) // refresh the element reference in the editor.
                editor.element.editor = editor

                // set back the editor position...
                editor.setContainerPosition()
                editor.setElementEvents()
            })
        } catch (err) {
            // script.innerText = javascript_editor.getText().split("<br>").join("")
        }


    }, () => {
        element.editor.emphasis()
    }, () => {
        element.editor.de_emphasis()
    })

    // Set the style to the editor...
    html_editor.id = element.id + "_html_editor"
    html_editor.setText(htmlBeautify(element.outerHTML))
    //html_editor.setText(element.outerHTML)
    html_editor.setTitle("HTML " + element.id)

    return html_editor
}

function getWorkspace() {
    return document.getElementsByTagName("globular-workspace")[0];//document.body
}

/**
 * 
 * @returns The active page, editor must be on the active page.
 */
export function getActiveWebPage() {
    return getWorkspace().getElementsByTagName("globular-web-page")[0]
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
           

            #container{
                display: flex;
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
                z-index: 100;
                align-items: center;
            }

            #edit-create-css-style-btn{
                position: relative;
            }

            @media (max-width: 1024px) {
                #toolbar {
                    display: none;
                }
            }

        </style>


        <div id="container">
            <slot></slot>
            <div id="toolbar">
                <div style="position: relative;">
                    <paper-button id="edit-create-js-style-btn" icon="icons:create">JS</paper-button>
                    <paper-tooltip for="edit-create-js-style-btn" role="tooltip" tabindex="-1">Application Scripts</paper-tooltip>
                    <slot name="javascript-manager"/>
                </div>
                <div style="position: relative;">
                    <paper-button id="edit-create-css-style-btn" icon="icons:create">CSS</paper-button>
                    <paper-tooltip for="edit-create-css-style-btn" role="tooltip" tabindex="-1">Application Styles</paper-tooltip>
                    <slot name="css-manager"/>
                </div>

                <paper-icon-button id="create-page-btn" icon="icons:note-add"></paper-icon-button>
                <paper-tooltip for="create-page-btn" role="tooltip" tabindex="-1">Create Web Page</paper-tooltip>
                
                <paper-icon-button id="set-create-mode-btn" icon="icons:create"></paper-icon-button>
                <paper-tooltip for="set-create-mode-btn" role="tooltip" tabindex="-1">Enter Edit Mode</paper-tooltip>

                <paper-icon-button id="save-all-btn" icon="icons:save"></paper-icon-button>
                <paper-tooltip for="save-all-btn" role="tooltip" tabindex="-1">Save All Change</paper-tooltip>
            </div>
        </div>
        `

        // The style manager.
        this.styleManager = new CodeManager("css")
        this.styleManager.slot = "css-manager"
        this.appendChild(this.styleManager)

        this.scriptManager = new CodeManager("javascript")
        this.scriptManager.slot = "javascript-manager"
        this.appendChild(this.scriptManager)


        // only display tool if the user is allowed...
        this.toolbar = this.shadowRoot.querySelector("#toolbar")
        this.toolbar.parentNode.removeChild(this.toolbar)
    }

    init() {
        this.navigation = new Navigation()
        this.appendChild(this.navigation)
        
        this.navigation.init()

        // load style...
        this.loadStyles(styles => {
            styles.forEach(s => {
                let style = document.createElement("style")
                style.id = s.id
                style.name = s.name
                style.innerText = s.text
                ApplicationView.layout.workspace().appendChild(style)

            })

            // load scripts 
            this.loadScripts(scripts => {
                scripts.forEach(s => {
                    let style = document.createElement("script")
                    style.id = s.id
                    style.name = s.name
                    style.innerText = s.text
                    ApplicationView.layout.workspace().appendChild(style)
                })
            }, err => ApplicationView.displayMessage(err, 3000))
        }, err => ApplicationView.displayMessage(err, 3000))

        // init stuff.
        if (this.needSaveEventListener == null)
            Model.eventHub.subscribe("_need_save_event_", uuid => this.needSaveEventListener = uuid, evt => {
                let saveAllBtn = this.shadowRoot.querySelector("#save-all-btn")
                saveAllBtn.removeAttribute("disable")
                saveAllBtn.style.setProperty("--iron-icon-fill-color", "var(--palette-text-primary)")
                window.dispatchEvent(new Event('resize'));
                // set need save...
                getActiveWebPage().needSave = true;
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
        let createEditCss = this.shadowRoot.querySelector("#edit-create-css-style-btn")
        let createEditJs = this.shadowRoot.querySelector("#edit-create-js-style-btn")


        setCreateModeBtn.style.setProperty("--iron-icon-fill-color", "var(--palette-action-disabled)")
        createPageBtn.style.display = "none"
        saveAllBtn.style.display = "none"
        createEditCss.style.display = "none"
        createEditJs.style.display = "none"

        saveAllBtn.setAttribute("disable")
        saveAllBtn.style.setProperty("--iron-icon-fill-color", "var(--palette-action-disabled)")

        setCreateModeBtn.onclick = () => {
            let highlighted = document.getElementsByClassName("highlighted")
            for (var i = 0; i < highlighted.length; i++) {
                if (highlighted[i].lowlight)
                    highlighted[i].lowlight();
            }

            if (createPageBtn.style.display == "none") {
                setCreateModeBtn.style.setProperty("--iron-icon-fill-color", "var(--palette-text-primary)")
                createPageBtn.style.display = "block"
                createEditCss.style.display = "block"
                createEditJs.style.display = "block"
                saveAllBtn.style.display = "block"
                Model.eventHub.publish("_set_content_edit_mode_", true, true)
                this.navigation.edit = true
            } else {
                setCreateModeBtn.style.setProperty("--iron-icon-fill-color", "var(--palette-action-disabled)")
                createPageBtn.style.display = "none"
                saveAllBtn.style.display = "none"
                createEditCss.style.display = "none"
                createEditJs.style.display = "none"
                Model.eventHub.publish("_set_content_edit_mode_", false, true)
                this.navigation.edit = false
            }
        }

        // Display styles...
        createEditCss.onclick = (evt) => {
            evt.stopPropagation()
            this.styleManager.show()
        }

        createEditJs.onclick = (evt) => {
            evt.stopPropagation()
            this.scriptManager.show()
        }

        // Save all...
        saveAllBtn.onclick = () => {
            if (saveAllBtn.hasAttribute("disable")) {
                return // nothing to save...
            }

            // Save all pages at once.
            this.navigation.savePages()

            // Delete style...
            let deleteStyle = (style) => {
                // delete the page.
                this.deleteStyle(style, () => {globular-content-manager
                    if (this.styleManager.toDelete.length > 0) {
                        let style = this.styleManager.toDelete.pop()
                        deleteStyle(style)
                    }
                }, err => {
                    ApplicationView.displayMessage(err, 300);
                    // also try to delete the page.
                    if (this.styleManager.toDelete.length > 0) {
                        let style = this.styleManager.toDelete.pop()
                        deleteStyle(style)
                    }
                })
            }

            let deleteScript = (script) => {
                // delete the page.
                this.deleteScript(script, () => {
                    if (this.scriptManager.toDelete.length > 0) {
                        let script = this.scriptManager.toDelete.pop()
                        deleteScript(script)
                    }
                }, err => {
                    ApplicationView.displayMessage(err, 300);
                    // also try to delete the page.
                    if (this.scriptManager.toDelete.length > 0) {
                        let script = this.scriptManager.toDelete.pop()
                        deleteScript(script)
                    }
                })
            }


            // I will save all style...
            this.saveStyles(() => {
                this.saveScripts(() => {
                    // Delete script and style as needed...
                    if (this.scriptManager.toDelete.length > 0) {
                        this.deleteScript(this.scriptManager.toDelete.pop(), () => {
                            if (this.styleManager.toDelete.length > 0) {
                                this.deleteStyle(this.styleManager.toDelete.pop(), () => {
                                    console.log("all style and scipt are delete...")
                                }, err => ApplicationView.displayMessage(err, 3000))
                            } else {
                                console.log("all scipt are delete...")
                            }
                        }, err => ApplicationView.displayMessage(err, 3000))
                    } else if (this.styleManager.toDelete.length > 0) {
                        this.deleteStyle(this.styleManager.toDelete.pop(), () => {
                            console.log("all style are delete...")
                        }, err => ApplicationView.displayMessage(err, 3000))
                    }
                })
            })

            saveAllBtn.setAttribute("disable")
            saveAllBtn.style.setProperty("--iron-icon-fill-color", "var(--palette-action-disabled)")
        }

        createPageBtn.onclick = () => {
            Model.eventHub.publish("_create_page_event_", {}, true)
        }
    }

    // Load existing css styles...
    loadStyles(callback, errorCallback) {
        let rqst = new FindRqst();

        // set connection infos.
        let db = Model.application + "_db";
        rqst.setId(Model.application);
        rqst.setDatabase(db);
        rqst.setCollection("Styles");
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

    // save all styles element present in the workspace...
    saveStyles(callback) {
        // Get immediate style elements.
        let styles_ = ApplicationView.layout.workspace().querySelectorAll("style")
        let styles = []
        for (var i = 0; i < styles_.length; i++) {
            let style = styles_[i]
            if (style.parentNode == ApplicationView.layout.workspace()) {
                styles.push(style)
            }
        }

        let saveStyle = (index) => {
            let style = styles[index]

            // I will put the style content into the style...
            let str = JSON.stringify({ id: style.id, name: style.name, text: style.innerText })

            // save the user_data
            let rqst = new ReplaceOneRqst();
            let db = Model.application + "_db";

            // set the connection infos,
            rqst.setId(Model.application);
            rqst.setDatabase(db);
            let collection = "Styles";

            // save only user data and not the how user info...
            rqst.setCollection(collection);
            rqst.setQuery(`{"_id":"${style.id}"}`);
            rqst.setValue(str);
            rqst.setOptions(`[{"upsert": true}]`);

            // So here I will set the address from the address found in the token and not 
            // the address of the client itself.
            let token = localStorage.getItem("user_token")
            let domain = Application.account.session.domain


            // call persist data
            Model.getGlobule(domain).persistenceService
                .replaceOne(rqst, {
                    token: token,
                    application: Model.application,
                    domain: domain
                })
                .then((rsp) => {
                    index += 1
                    if (index < styles.length) {
                        saveStyle(index)
                    } else {
                        callback()
                    }
                })
                .catch((err) => {
                    console.log(err)
                    index += 1
                    // try to save next style
                    if (index < styles.length) {
                        saveStyle(index)
                    } else {
                        callback()
                    }
                });
        }

        if (styles.length > 0) {
            saveStyle(0)
        } else {
            callback()
        }
    }

    deleteStyle(style, callback, errorCallback) {
        // save the user_data
        let rqst = new DeleteOneRqst();
        let db = Model.application + "_db";

        // set the connection infos,
        rqst.setId(Model.application);
        rqst.setDatabase(db);
        let collection = "Styles";

        // save only user data and not the how user info...
        rqst.setCollection(collection);
        rqst.setQuery(`{"_id":"${style.id}"}`);

        // So here I will set the address from the address found in the token and not 
        // the address of the client itself.
        let token = localStorage.getItem("user_token")
        let decoded = JwtDecode(token);
        let domain = Application.account.session.domain


        // call persist data
        Model.getGlobule(domain).persistenceService
            .deleteOne(rqst, {
                token: token,
                application: Model.application,
                domain: domain
            })
            .then((rsp) => {
                // Here I will return the value with it
                callback(this);
            })
            .catch((err) => {
                errorCallback(err);
            });
    }

    // Load existing css scripts...
    loadScripts(callback, errorCallback) {
        let rqst = new FindRqst();

        // set connection infos.
        let db = Model.application + "_db";
        rqst.setId(Model.application);
        rqst.setDatabase(db);
        rqst.setCollection("Scripts");
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

    // save all scripts element present in the workspace...
    saveScripts(callback) {
        // Get immediate style elements.
        let scripts_ = ApplicationView.layout.workspace().querySelectorAll("script")
        let scripts = []
        for (var i = 0; i < scripts_.length; i++) {
            let s = scripts_[i]
            if (s.parentNode == ApplicationView.layout.workspace()) {
                scripts.push(s)
            }
        }

        let saveScript = (index) => {
            let s = scripts[index]

            // I will put the style content into the style...
            let str = JSON.stringify({ id: s.id, name: s.name, text: s.innerText })

            // save the user_data
            let rqst = new ReplaceOneRqst();
            let db = Model.application + "_db";

            // set the connection infos,
            rqst.setId(Model.application);
            rqst.setDatabase(db);
            let collection = "Scripts";

            // save only user data and not the how user info...
            rqst.setCollection(collection);
            rqst.setQuery(`{"_id":"${s.id}"}`);
            rqst.setValue(str);
            rqst.setOptions(`[{"upsert": true}]`);

            // So here I will set the address from the address found in the token and not 
            // the address of the client itself.
            let token = localStorage.getItem("user_token")
            let decoded = JwtDecode(token);
            let domain = Application.account.session.domain


            // call persist data
            Model.getGlobule(domain).persistenceService
                .replaceOne(rqst, {
                    token: token,
                    application: Model.application,
                    domain: domain
                })
                .then((rsp) => {
                    index += 1
                    if (index < scripts.length) {
                        saveScript(index)
                    } else {
                        callback()
                    }
                })
                .catch((err) => {
                    console.log(err)
                    index += 1
                    // try to save next style
                    if (index < scripts.length) {
                        saveScript(index)
                    } else {
                        callback()
                    }
                });
        }

        if (scripts.length > 0) {
            saveScript(0)
        } else {
            callback()
        }
    }

    deleteScript(script, callback, errorCallback) {
        // save the user_data
        let rqst = new DeleteOneRqst();
        let db = Model.application + "_db";

        // set the connection infos,
        rqst.setId(Model.application);
        rqst.setDatabase(db);
        let collection = "Scripts";

        // save only user data and not the how user info...
        rqst.setCollection(collection);
        rqst.setQuery(`{"_id":"${script.id}"}`);

        // So here I will set the address from the address found in the token and not 
        // the address of the client itself.
        let token = localStorage.getItem("user_token")
        let domain = Application.account.session.domain


        // call persist data
        Model.getGlobule(domain).persistenceService
            .deleteOne(rqst, {
                token: token,
                application: Model.application,
                domain: domain
            })
            .then((rsp) => {
                // Here I will return the value with it
                callback(this);
            })
            .catch((err) => {
                errorCallback(err);
            });
    }
}

customElements.define('globular-content-manager', ContentManager)

/**
 * 
 */
export class CodeManager extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(mode) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        this.mode = mode

        // keep the list of style to be deleted...
        this.toDelete = []

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
            paper-card{
                background-color: var(--palette-background-paper);
                color: var(--palette-text-primary);
            }

            #container{
                display: flex;
                flex-direction: column;
                position: absolute;
                top: 64px;
                right: 0px;
                background-color: var(--palette-background-paper);
                color: var(--palette-text-primary);
                min-width: 290px;
            }

            #styles{
                display: flex;
                align-items: center;
                flex-direction: column;
                text-transform: initial;
            }

            .element-lnk {
                position: relative;
                display: flex; 
                align-items: center; 
                width: 100%; 
                transition: background 0.2s ease,padding 0.8s linear;
                background-color: var(--palette-background-paper);
                color: var(--palette-text-primary);
            }

            .element-lnk:hover{
                filter: invert(10%);
                cursor: pointer;
            }

        </style>
        <paper-card id="container">
            <div style="display: flex; border-bottom: 1px solid var(--palette-divider);">
                <paper-icon-button id="add-element-btn" icon="icons:add" class="btn_"></paper-icon-button>
                <paper-tooltip for="add-element-btn" role="tooltip" tabindex="-1">Add Style</paper-tooltip>
                <div id="create-element-div" style="display: none; flex-grow: 1;">
                    <paper-input  style="display: flex;flex-grow: 1;" no-label-float></paper-input>
                </div>
            </div>

            <div style="max-height: 400px; overflow-y: auto">
                <div id="content">
                    
                </div>
            </div>
            
        </paper-card>
        `

        // The container.
        this.container = this.shadowRoot.querySelector("#container")
        this.container.onclick = (evt) => {
            evt.stopPropagation()
        }


        let addElementBtn = this.shadowRoot.querySelector("#add-element-btn")
        addElementBtn.onclick = (evt) => {
            evt.stopPropagation()
            this.addCodeElement()
        }

        this.parent = null
        this.visible = false

        // Hide the 
        document.body.addEventListener("click", (evt) => {
            if (this.visible) {
                var rectMenu = this.container.getBoundingClientRect();
                var overMenu = evt.x > rectMenu.x && evt.x < rectMenu.right && evt.y > rectMenu.y && evt.y < rectMenu.bottom
                if (!overMenu) {
                    this.hide()
                }
            }
        })
    }

    connectedCallback() {
        // keep the parent in variable.
        this.parent = this.parentNode
        if (!this.visible) {
            this.hide()
        }

        this.displayContent()
    }

    show() {
        if (this.parent) {
            if (!this.visible) {
                let codeManagers = document.getElementsByTagName("globular-code-manager")
                for (var i = 0; i < codeManagers.length; i++) {
                    codeManagers[i].hide()
                }
                this.visible = true
                this.parent.appendChild(this)
            }
        }
    }

    hide() {
        if (this.parentNode) {
            this.visible = false
            this.parentNode.removeChild(this)
        }
    }

    // Display list of existing script...
    displayContent() {

        // display style or script depending of the mode.
        let tagName = ""
        if (this.mode == "css") {
            tagName = "style"
        } else if (this.mode == "javascript") {
            tagName = "script"
        }

        let div = this.shadowRoot.querySelector("#content")
        div.innerHTML = "";

        // workspace must be active.
        if (!ApplicationView.layout.workspace()) {
            return
        }

        // Get style list.
        let elements_ = ApplicationView.layout.workspace().querySelectorAll(tagName)
        let elements = []
        for (var i = 0; i < elements_.length; i++) {
            let e = elements_[i]
            if (e.parentNode == ApplicationView.layout.workspace()) {
                elements.push(e)
            }
        }

        for (var i = 0; i < elements.length; i++) {

            let e = elements[i]
            if (e.parentNode == ApplicationView.layout.workspace()) {
                let html = `
                <div class="element-lnk">
                    <paper-icon-button id="edit-${e.id}-btn"  icon="icons:create" class="btn_"></paper-icon-button>
                    <span id="edit-${e.id}-lnk" style="flex-grow: 1; padding-left: 16px;">${e.name}</span>
                    <paper-icon-button id="delete-${e.id}-btn"  icon="icons:delete" class="btn_"></paper-icon-button>
                    <paper-ripple> </paper-ripple>
                </div>
                `

                let range = document.createRange()
                div.appendChild(range.createContextualFragment(html))

                let editLnk = div.querySelector(`#edit-${e.id}-lnk`)
                editLnk.onclick = () => {
                    if (this.mode == "css")
                        showCssEditor(e)
                    else if (this.mode = "javascript") {
                        showJavascriptEditor(e)
                    }
                    this.hide()
                }

                let deleteBtn = div.querySelector(`#delete-${e.id}-btn`)

                let editBtn = div.querySelector(`#edit-${e.id}-btn`)
                editBtn.onclick = (evt) => {
                    // remove the editLnk 
                    let parent = editLnk.parentNode
                    parent.removeChild(editLnk)

                    editBtn.setAttribute("disable")
                    editBtn.style.setProperty("--iron-icon-fill-color", "var(--palette-action-disabled)")

                    // Create the input to set the new name...
                    let input = document.createElement("paper-input")
                    input.setAttribute("no-label-float")
                    parent.insertBefore(input, deleteBtn)
                    input.value = e.name

                    // put in edit mode and pre-select the text.
                    setTimeout(() => {
                        input.focus()
                        input.inputElement.inputElement.select()

                    }, 100)

                    input.onkeyup = (evt) => {
                        if (evt.code === 'Enter' || evt.code === "NumpadEnter" || evt.code === 'Escape') {

                            if (evt.code != 'Escape') {
                                let id = ""
                                if (this.mode == "css") {
                                    id = "_" + getUuidByString(input.value + "_style")
                                } else {
                                    id = "_" + getUuidByString(input.value + "_script")
                                }

                                if (document.getElementById(id)) {
                                    if (this.mode == "css") {
                                        ApplicationView.displayMessage("style with name " + input.value + " already exist!", 3000)
                                    } else {
                                        ApplicationView.displayMessage("script with name " + input.value + " already exist!", 3000)
                                    }

                                    // reselect the text...
                                    input.inputElement.inputElement.select()

                                    return
                                }

                                // create a copy of the node to delete at save...
                                this.toDelete.push(e.cloneNode(true))

                                // set name...
                                e.name = input.value
                                e.id = id
                                editLnk.innerText = e.name

                                // set need save...
                                Model.eventHub.publish("_need_save_event_", null, true)
                            }

                            editBtn.removeAttribute("disable")
                            editBtn.style.setProperty("--iron-icon-fill-color", "var(--palette-text-primary)")
                            parent.removeChild(input)
                            parent.insertBefore(editLnk, deleteBtn)
                        }
                    }

                }


                deleteBtn.onclick = () => {
                    // remove the element menu
                    deleteBtn.parentNode.parentNode.removeChild(deleteBtn.parentNode)

                    // remove the element itself...
                    e.parentNode.removeChild(e)

                    // mark the element to be deleted in the next save.
                    this.toDelete.push(e)

                    Model.eventHub.publish("_need_save_event_", null, true)
                }

            }
        }
    }

    // Add a new css style or js script element
    addCodeElement() {
        let div = this.shadowRoot.querySelector("#create-element-div")
        div.style.display = "flex"
        let input = div.querySelector("paper-input")

        setTimeout(() => {
            input.focus()
        }, 100)

        input.onkeyup = (evt) => {
            evt.stopPropagation();

            if (evt.code === 'Enter' || evt.code === "NumpadEnter") {
                console.log("Enter key press!")
                let name = input.value;
                let id = ""

                // if code is css style...
                if (this.mode == "css") {
                    id = "_" + getUuidByString(name + "_style")
                    if (ApplicationView.layout.workspace().querySelector("#" + id)) {
                        ApplicationView.displayMessage("A style named " + name + " already exist!")
                        return
                    }

                    input.value = ""
                    div.style.display = "none"
                    // So here I will create style and put in the workspace...
                    let style = document.createElement("style")
                    style.id = id
                    style.name = name

                    // append the style in the workspace.
                    ApplicationView.layout.workspace().appendChild(style)

                    // refresh the style list...
                    this.displayContent()
                } else if (this.mode == "javascript") {
                    id = "_" + getUuidByString(name + "_script")
                    // Here the code is javascript.
                    if (ApplicationView.layout.workspace().querySelector("#" + id)) {
                        ApplicationView.displayMessage("A script named " + name + " already exist!")
                        return
                    }

                    input.value = ""
                    div.style.display = "none"
                    // So here I will create style and put in the workspace...
                    let script = document.createElement("script")
                    script.id = id
                    script.name = name

                    // append the style in the workspace.
                    ApplicationView.layout.workspace().appendChild(script)

                    // refresh the style list...
                    this.displayContent()
                }

                Model.eventHub.publish("_need_save_event_", null, true)

                return
            } else if (evt.code === 'Escape') {
                input.value = ""
                input.blur()
                div.style.display = "none"
                return
            }
        }
    }
}

customElements.define('globular-code-manager', CodeManager)

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
           

            #container {
                display: flex;
                user-select: none;
                -moz-user-select: none;
                -khtml-user-select: none;
                -webkit-user-select: none;
                -o-user-select: none;
            }

            ::slotted(.drop-zone) {
                background-color: transparent;
                width: 20px;
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

        this.edit = false;

        this.dragging = false;
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

                    if (lnks.length > 0) {
                         lnks[page.index].emphasis()
                    }

                }, true)

        // Init the webpages...
        ApplicationView.wait(`<div style="display: flex; flex-direction: column; justify-content: center;"><span>load webpages</span><span>please wait</span><span>...</span></div>`)
        this.loadWebPages(pages => {
            ApplicationView.resume()
            pages = pages.sort((a, b) => (a.index > b.index) ? 1 : ((b.index > a.index) ? -1 : 0))

            // Test if the element is in the context...
            for (var i = 0; i < pages.length; i++) {
                let page = new WebPage(pages[i]._id, pages[i].name, pages[i].style, pages[i].script, pages[i].index, pages[i].elements,  pages[i].thumbnail)
                let lnk = new NavigationPageLink(page)
                this.appendLink(lnk)
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
                ApplicationView.resume()
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

        this.appendLink(pageLnk)
        pageLnk.setEditMode()


        getWorkspace().appendChild(page)
        page.setEditMode()
        
    }

    appendLink(lnk) {
        lnk.setAttribute("draggable", "true")

        // the mouvse down on the div
        lnk.ondragstart = (evt) => {
            if (this.edit) {
                lnk.style.cursor = "move";
                this.dragging = true;
                evt.dataTransfer.setData("Text", lnk.id);
            }
        }

        // set back to default
        lnk.ondragend = () => {
            lnk.style.cursor = "default";
            this.dragging = false;
        }

        let dropZones = this.querySelectorAll(".drop-zone")
        if (dropZones.length == 0) {
            // I will append the leading drop-zone.
            this.appendChild(this.createDropZone())
        }

        this.appendChild(lnk)

        // append the drop zone after the element.
        this.appendChild(this.createDropZone())
    }

    createDropZone() {
        let dropZone = document.createElement("div")
        dropZone.classList.add("drop-zone")

        dropZone.ondragenter = (evt) => {
            evt.preventDefault()
            if (this.dragging) {
                dropZone.style.backgroundColor = "var(--palette-action-disabled)"
            }
        }

        dropZone.ondragover = (evt) => {
            evt.preventDefault()
        }

        dropZone.ondragleave = (evt) => {
            evt.preventDefault()
            if (this.dragging) {
                dropZone.style.backgroundColor = ""
            }
        }

        dropZone.ondrop = (evt) => {
            evt.preventDefault()
            if (this.dragging) {
                var id = evt.dataTransfer.getData("Text");
                var lnk = this.querySelector("#" + id)

                // so here I will 
                let index = getChildIndex(lnk)

                // mode elements
                this.insertBefore(this.children[index - 1], dropZone)
                this.insertBefore(lnk, dropZone)

                // re-index pages...
                let lnks = this.querySelectorAll("globular-page-link")
                for (var i = 0; i < lnks.length; i++) {
                    // set the new index
                    lnks[i].webPage.setAttribute("index", i)
                    lnks[i].webPage.index = i
                }

                Model.eventHub.publish("_need_save_event_", null, true)

                dropZone.style.backgroundColor = ""
            }
        }


        return dropZone
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
            if (index < links.length) {
                console.log(index, links[index])
                links[index].webPage.index = index

                links[index].save(() => {
                    index += 1
                    savePages_(index)
                }, err => {
                    // I will set the page index before save it... 
                    ApplicationView.displayMessage(`fail to save page ${links[index].webPage.name} with error </br>`, err, 3000)
                    index += 1
                    savePages_(index)
                });
            } else {
                if (this.toDelete.length > 0) {
                    // remove page mark as delete...
                    let page = this.toDelete.pop()
                    deletePages_(page)
                }
                ApplicationView.displayMessage("all content was saved", 3000)
                window.dispatchEvent(new Event('resize'));

            }
        }

        if (links.length > 0) {
            savePages_(0)
        } else if (this.toDelete.length > 0) {
            // remove page mark as delete...
            let page = this.toDelete.pop()
            deletePages_(page)
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
        this.active = false
        if (webPage) {
            this.webPage = webPage
            this.webPage.link = this
        }

        // Innitialisation of the element.
        this.shadowRoot.innerHTML = `
        <style>
           

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

        this.id = this.webPage.id + "_lnk"
        

        this.editor = this.shadowRoot.querySelector("#page-name-editor")
        this.input = this.shadowRoot.querySelector("#page-name-editor-input")

        // contain the name of the link...
        this.span = this.shadowRoot.querySelector("#page-name-span")


        // Set the page...
        this.span.onclick = () => {
            // I will remove all highligted text..
            let highlighted = document.getElementsByClassName("highlighted")
            for (var i = 0; i < highlighted.length; i++) {
                if (highlighted[i].lowlight)
                    highlighted[i].lowlight();
            }

            this.click()
        }

        // enter edit mode.
        this.span.addEventListener('dblclick', () => {
            if (this.edit) {
                this.setEditMode()
            }
        });

        // set initial values.
        if (this.webPage) {
            this.edit = false
            this.span.innerHTML = this.webPage.name
            this.input.value = this.webPage.name
        }


        // Set the page 
        this.input.onblur = () => {
            if (this.webPage.name != this.input.value) {

                this.webPage.setName(this.input.value)
                this.id = this.webPage.id + "_lnk"

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

    click() {
        this.webPage.setPage()
        this.emphasis()
    }

    emphasis() {
        let lnks = this.shadowRoot.querySelectorAll("globular-page-link")
        for (var i = 0; i < lnks.length; i++) {
            lnks[i].de_emphasis()
        }

        this.span.style.textDecoration = "underline"
        this.active = true
    }

    de_emphasis() {
        this.span.style.textDecoration = "none"
        this.active = false
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
    constructor(id, name, style, script, index, elements, thumbnail) {
        super()

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // edit mode 
        this.edit = false

        // set the thumbnail.
        this.thumbnail = ""
        if(thumbnail){
            this.thumbnail = thumbnail
        }

        // limit the saving time...
        this.needSave = false

        // Page Name 
        this.name = name
        if (this.hasAttribute("name")) {
            this.name = this.getAttribute("name")
        }

        // set the page id.
        this.id = id;
        if (this.hasAttribute("id")) {
            this.id = this.getAttribute("id")
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
                text-align: left;
                user-select: none;
                -moz-user-select: none;
                -khtml-user-select: none;
                -webkit-user-select: none;
                -o-user-select: none;
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
                top: 75px;
                left: 10px;
                z-index: 100;
            }

            .toolbar{
                display: flex;
                flex-direction: column;
                flex-direction: row;
                height: 40px;
                user-select: none;
                -moz-user-select: none;
                -khtml-user-select: none;
                -webkit-user-select: none;
                -o-user-select: none;
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
                    <paper-icon-button id="add-element-btn" icon="icons:add" class="btn_"></paper-icon-button>
                    <paper-tooltip for="add-element-btn" role="tooltip" tabindex="-1">Add Element</paper-tooltip>
                    <paper-button id="css-edit-btn">css</paper-button>
                    <paper-tooltip for="css-edit-btn" role="tooltip" tabindex="-1">Edit CSS</paper-tooltip>
                    <paper-button id="js-edit-btn">js</paper-button>
                    <paper-tooltip for="js-edit-btn" role="tooltip" tabindex="-1">Edit JS</paper-tooltip>
                    <paper-icon-button id="delete-page-btn"  icon="icons:delete" class="btn_"></paper-icon-button>
                    <paper-tooltip for="delete-page-btn" role="tooltip" tabindex="-1">Delete Page</paper-tooltip>
                </div>
                <span id="current-edit-page">
                    ${this.name}
                </span>
            </div>
            <globular-slide-panel side="right" style="z-index: 99;">
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
            let element = this.appendElement("DIV", "_" + randomUUID()) // create an empty div...
            element.editor.selector.click()
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
        this.style_ = document.createElement("style")

        if (style) {

            style = `
/** Page style here */
#${this.id}{
    width: 100%;
    min-height: 500px;
}`
        }
        this.style_.innerText = style


        this.style_.setAttribute("scoped", "")
        this.style_.id = this.id + "_style"

        this.appendChild(this.style_)

        // set the script for the page.
        this.script_ = document.createElement("script")
        if (script) {
            this.script_.innerText = script
        } else {
            this.script_.innerText = `/** Page script here */`
        }
        this.script_.id = this.id + "_script"

        // script_.setAttribute("type", "module")
        this.appendChild(this.script_)

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
            showCssEditor(this.style_)
        }

        let deletePageBtn = this.shadowRoot.querySelector("#delete-page-btn")
        deletePageBtn.onclick = () => {
            this.markForDelete()
        }

        let editJavascriptBtn = this.shadowRoot.querySelector("#js-edit-btn")
        editJavascriptBtn.onclick = () => {
            showJavascriptEditor(this.script_)
        }

        // Keep the container synch with the element div...
        window.addEventListener('resize', () => {

        });

        // hide toolbar and selectors...
        this.resetEditMode()


        this.dragging = false;

        this.ondragstart = () => {
            this.dragging = true
        }

        this.ondragend = () => {
            this.dragging = false
        }

        // The on drop event.
        this.ondrop = (evt) => {
            evt.preventDefault();
            if (this.dragging) {
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
        }

        // The drag over content.
        this.ondragover = (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
            this.dragging = true;

            let selector = this.getActiveSelector()
            if (selector == null && this.dragging) {
                // ApplicationView.displayMessage("select the target element where to drop the content.", 3500)
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
        return editor.element
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
        this.edit = true;
        this.setPage()

        if (this.shadowRoot.querySelector(`#${this.id}_selector`))
            this.shadowRoot.querySelector(`#${this.id}_selector`).innerHTML = this.name
        if (this.shadowRoot.querySelector("#current-edit-page"))
            this.shadowRoot.querySelector("#current-edit-page").innerHTML = this.name
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

    removeAllSearchIndex(callback, errorCallback) {

        let getDataElements = (elements) => {
            let dataElements = []
            for (var i = 0; i < elements.length; i++) {
                if (elements[i].data.length > 0) {
                    dataElements.push(elements[i].id)
                }

                if (elements[i].children) {
                    dataElements = dataElements.concat(getDataElements(elements[i].children))
                }
            }
            return dataElements
        }

        // Remove index.
        let removeSearchIndex_ = (dataElements) => {
            let element = dataElements.pop()
            this.removeSearchIndex(element, () => {

                if (dataElements.length == 0) {
                    callback()
                } else {
                    removeSearchIndex_(dataElements)
                }
            }, err => {
                console.log("fail to remove index for ", element, err)
                if (dataElements.length == 0) {
                    callback()
                } else {
                    removeSearchIndex_(dataElements)
                }
            })
        }


        // get page data from the db...
        this.loadPageData(data => {
            let dataElements = getDataElements(data.elements)
            removeSearchIndex_(dataElements)
        }, (err) => {
            console.log(err)
            callback()
        })
    }

    /**
     * Remove the search index of a element with a given id.
     * @param {*} id The element id
     * @param {*} callback The remove callback
     * @param {*} errorCallback The error callback
     */
    removeSearchIndex(id, callback, errorCallback) {

        let rqst = new DeleteDocumentRequest()
        rqst.setPath(Model.globular.config.DataPath + "/search/applications/" + Model.application)
        rqst.setId(id)

        // So here I will set the address from the address found in the token and not 
        // the address of the client itself.
        let token = localStorage.getItem("user_token")
        let domain = Application.account.session.domain

        // call persist data
        Model.getGlobule(domain).searchService.deleteDocument(rqst,
            {
                token: token,
                application: Model.application,
                domain: domain
            }
        ).then(() => {
            console.log("remove indexation success!")
            callback(this)
        }).catch(err => {
            console.log("fail to remove indexation", err)
            errorCallback(err)
        })

    }

    // Delete the page.
    delete(callback, errorCallback) {
        // delete indexation first...
        this.removeAllSearchIndex(() => {

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
            let domain = Application.account.session.domain


            // call persist data
            Model.getGlobule(domain).persistenceService
                .deleteOne(rqst, {
                    token: token,
                    application: Model.application,
                    domain: domain
                })
                .then((rsp) => {
                    // Here I will return the value with it
                    PermissionManager.deleteResourcePermissions(this.id, () => {
                        callback(this)
                    }, errorCallback)
                })
                .catch((err) => {
                    errorCallback(err);
                });

        }, errorCallback)
    }

    // Save the search index.
    saveSearchIndex(pageId, pageName, elements, callback, errorCallback) {
        // first of all i will keep only usefull field, those that contain data...
        let getDataElements = (elements) => {
            let dataElements = []
            for (var i = 0; i < elements.length; i++) {
                if (elements[i].data.length > 0) {
                    dataElements.push({ Id: elements[i].id, PageId: pageId, PageName: pageName, Text: elements[i].data })
                }

                if (elements[i].children) {
                    dataElements = dataElements.concat(getDataElements(elements[i].children))
                }
            }
            return dataElements
        }

        let dataElements = getDataElements(elements)

        dataElements.forEach(e => {

            // Index the json object.
            let rqst = new IndexJsonObjectRequest
            rqst.setPath(Model.globular.config.DataPath + "/search/applications/" + Model.application)
            rqst.setJsonstr(JSON.stringify(e))
            rqst.setLanguage("en")
            rqst.setId("Id")
            rqst.setIndexsList(["PageId", "Id", "Text"])
            let token = localStorage.getItem("user_token")
            let domain = Application.account.session.domain


            // call persist data
            Model.getGlobule(domain).searchService
                .indexJsonObject(rqst, {
                    token: token,
                    application: Model.application,
                    domain: domain
                })
                .then((rsp) => {
                    callback()
                })
                .catch(err => { console.log(err); errorCallback(err) })

        })
    }

    // load the page data...
    loadPageData(callback, errorCallback) {
        const collection = "WebPages";

        // save the user_data
        let rqst = new FindOneRqst();
        let db = Model.application + "_db";

        // set the connection infos,
        rqst.setId(Model.application);
        rqst.setDatabase(db);
        rqst.setCollection(collection)
        rqst.setQuery(`{"_id":"${this.id}"}`)

        // So here I will set the address from the address found in the token and not 
        // the address of the client itself.
        let token = localStorage.getItem("user_token")
        let domain = Application.account.session.domain

        // call persist data
        Model.getGlobule(domain).persistenceService
            .findOne(rqst, {
                token: token,
                application: Model.application,
                domain: domain
            })
            .then(rsp => {
                // Here I will return the value with it
                let data = rsp.getResult().toJavaScript();
                callback(data);
            })
            .catch(errorCallback);
    }



    // Save the actual content.
    save(callback, errorCallback) {

        if (!this.needSave) {
            callback()
            return
        }

        this.needSave = false


        // I will remove all highligted text..
        let highlighted = document.getElementsByClassName("highlighted")
        for (var i = 0; i < highlighted.length; i++) {
            if (highlighted[i].lowlight)
                highlighted[i].lowlight();
        }

        // remove existing indexation.
        this.removeAllSearchIndex(() => {
            let editors = []
            // keep only immediate childs.
            for (var i = 0; i < this.children.length; i++) {
                if (this.children[i].editor) {
                    editors.push(this.children[i].editor)
                }
            }

            // get the list of elements from the actual page.
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

                    // Validate the access firt...
                    PermissionManager.validateAccess(this.id, "write", Application.account.id + "@" + Application.account.domain, SubjectType.ACCOUNT, () => {
                        // generate the thumbnail
                        domtoimage.toJpeg(this, { quality: 0.95 })
                            .then((dataUrl) => {
                                this.thumbnail = dataUrl

                                // create a string from page information..
                                let str = JSON.stringify({ _id: this.id, name: this.name, style: this.style_.innerText, script: this.script_.innerText, index: this.index, user_id: Application.account.id + "@" + Application.account.domain, elements: elements, thumbnail: this.thumbnail })


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
                                let domain = Application.account.session.domain


                                // call persist data
                                Model.getGlobule(domain).persistenceService
                                    .replaceOne(rqst, {
                                        token: token,
                                        application: Model.application,
                                        domain: domain,
                                    })
                                    .then((rsp) => {

                                        // set the resource owner...
                                        PermissionManager.addResourceOwner(this.id, "webpage", Application.account.id + "@" + Application.account.domain, SubjectType.ACCOUNT, () => {
                                            console.log("Web Page " + this.name, " is owned by " + Application.account.name)

                                            // Here I will return the value with it
                                            Model.publish(`update_page_${this.id}_evt`, str, false)

                                            // Eval the script to make modification effective...
                                            let scripts = this.querySelectorAll("script")
                                            for (var i = 0; i < scripts.length; i++) {
                                                let s = scripts[i]
                                                if (s.reload) {
                                                    let parent = s.parentNode
                                                    parent.removeChild(s)

                                                    let s_ = document.createElement("script")

                                                    s_.id = s.id
                                                    s_.name = s.name
                                                    s_.innerText = s.innerText.split("<br>").join("") // remove beautify...
                                                    parent.appendChild(s_)
                                                }
                                            }

                                            this.saveSearchIndex(this.id, this.name, elements, () => {
                                                callback(this);
                                            }, err => {
                                                console.log("err ", err)
                                                ApplicationView.displayMessage(err, 3000);
                                            })

                                        }, err => ApplicationView.displayMessage(err, 3000))

                                    })
                                    .catch((err) => {
                                        errorCallback(err);
                                    });
                            });


                    }, err => ApplicationView.displayMessage(err))


                }
            }

            // save page element event it's empty...
            getData_(0)

        }, errorCallback)
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
        this.id = ""
        this.edit = false;
        if (data) {
            this.id = data.id
        }

        // Innitialisation of the element.
        this.shadowRoot.innerHTML = `
               <style>
                  
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
                        top: 75px;
                        left: 10px;
                        z-index: 100;
                    }
        

                    .toolbar{
                        display: flex;
                        flex-direction: column;
                        flex-direction: row;
                        height: 40px;
                        user-select: none;
                        -moz-user-select: none;
                        -khtml-user-select: none;
                        -webkit-user-select: none;
                        -o-user-select: none;
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
                            <paper-icon-button id="add-element-btn" icon="icons:add" class="btn_"></paper-icon-button>
                            <paper-tooltip for="add-element-btn" role="tooltip" tabindex="-1">Add Element</paper-tooltip>
                            <paper-button id="css-edit-btn">css</paper-button>
                            <paper-tooltip for="css-edit-btn" role="tooltip" tabindex="-1">Edit CSS</paper-tooltip>
                            <paper-button id="js-edit-btn">js</paper-button>
                            <paper-tooltip for="js-edit-btn" role="tooltip" tabindex="-1">Edit JS</paper-tooltip>
                            <paper-button id="html-edit-btn"  class="btn_">HTML</paper-button>
                            <paper-tooltip for="html-edit-btn" role="tooltip" tabindex="-1">Edit Text</paper-tooltip>
                            <paper-icon-button id="delete-element-btn"  icon="icons:delete" class="btn_"></paper-icon-button>
                            <paper-tooltip for="delete-element-btn" role="tooltip" tabindex="-1">Delete Element</paper-tooltip>
                        </div>
                        <span id="current-edit-element">
                            ${this.id}
                        </span>
                    </div>
               </div>
               <slot></slot>
               `

        if (data) {

            this.id = data.id + "_editor"

            // The parent id where to create the element...
            this.parentId = data.parentId

            // The tagName
            this.tagName_ = data.tagName

            // I will not keep the reference.
            let parent = data.parent

            if (!parent) {
                parent = this.getParent()
                if (!parent) {
                    console.log("fail to get parent with id ", this.parentId)
                    return
                }
            }
            this.element = parent.querySelector("#" + data.id)
            if (this.element == undefined) {

                // I will create the element it-self
                this.element = document.createElement(data.tagName)
                if (this.element == null) {
                    this.element = document.createElement("DIV")
                    console.log("fail to create element of type ", data.tagName, " I will use a DIV instead...")
                }

                this.element.id = data.id
                this.element.editor = this

                parent.appendChild(this.element)

                this.setElementEvents()

                // the classes
                if (data.classes) {
                    this.element.className = data.classes
                }

                // the attributes...
                if (data.attributes) {
                    for (var name in data.attributes) {
                        // I will keep generated id instead of exting one.
                        if (name != "id" && name != "class") {
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

                // I will create the element style.
                this.elementStyle = document.createElement("style")
                this.elementStyle.setAttribute("scoped", "")
                this.elementStyle.id = data.id + "_style"
                parent.appendChild(this.elementStyle)

                if (data.style) {
                    parent.querySelector(`#${data.id}_style`).innerText = data.style
                } else {
                    parent.querySelector(`#${data.id}_style`).innerText = `
#${data.id}{
    /** Element style here */
}
`
                }


                // I will create the element script.
                this.elementScript = document.createElement("script")
                this.elementScript.id = data.id + "_script"
                parent.appendChild(this.elementScript)
                if (data.script)
                    parent.querySelector(`#${data.id}_script`).innerText = data.script
                else
                    parent.querySelector(`#${data.id}_script`).innerText = `/** Wrote Element Script here **/
                    `
            }

            // Set the element selector
            if (this.selector == null) {
                this.selector = new ElementSelector(this)
                this.selector.id = data.id + "_selector"

                // Append the selector to the parent editor.
                if (parent.editor) {
                    if (parent.editor.selector) {
                        parent.editor.selector.appendSelector(this.selector)
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
            showCssEditor(this.getParent().querySelector(`#${this.element.id}_style`))
        }

        let editJavascriptBtn = this.shadowRoot.querySelector("#js-edit-btn")
        editJavascriptBtn.onclick = () => {
            showJavascriptEditor(this.getParent().querySelector(`#${this.element.id}_script`))
        }

        this.shadowRoot.querySelector("#html-edit-btn").onclick = () => {
            showHtmlEditor(this.element)
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
        editor.selector.click()
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
            if (this.countChildren(e) == 0 && canHoldText(e.tagName)) {
                data = e.innerText
            } else {
                // here I will try to see if the content contain free text..
                let text = [].reduce.call(e.childNodes, (a, b) => { return a + (b.nodeType === 3 ? b.textContent : ''); }, '');
                if (text.trim().length > 0) {
                    data = e.innerHTML
                    e.hasFreeText = true;
                }
            }
        }

        return data
    }

    /**
     * Append element...
     */
    appendElement(e) {
        if (e === this.element) {
            return // can't insert element to itself...
        }

        // Now the element style...
        if (e.tagName != "STYLE") {
            let style_ = ""
            let id = "_" + uuidv4()

            if (e.hasAttribute("style"))
                style_ = `#${id}{${e.getAttribute("style")}}`


            const attrs = e.getAttributeNames().reduce((acc, name) => {
                return { ...acc, [name]: this.element.getAttribute(name) };
            }, {});

            let editor = new ElementEditor({ tagName: e.tagName, parentId: this.id, parent: this.element, id: id, style: style_, data: this.getElementData(e), attributes: attrs, classes: e.className })

            // I will make the function recursive...
            for (var i = 0; i < e.children.length; i++) {
                editor.appendElement(e.children[i])
            }

            window.dispatchEvent(new Event('resize'));
        }

        Model.eventHub.publish("_need_save_event_", null, true)
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


        // A element is a recursive structure...
        let obj = { tagName: this.tagName_, style: this.elementStyle.innerText, script: this.elementScript.innerText, children: [], id: this.element.id, parentId: this.parentId, data: this.getElementData(this.element), classes: this.element.className, attributes: attrs }
        let editors = []

        // keep only immediate childs...
        if (!this.element.hasFreeText)
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
     * return the parent reference.
     */
    getParent() {
        // Get the parent element node by default
        if (this.element)
            if (this.element.parentNode)
                return this.element.parentNode

        // Get the element by it id in case element are not initialyse
        return document.getElementById(this.parentId)
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
        this.getParent().appendChild(this)
    }

    /**
     * Reset element edit mode.
     */
    resetEditMode() {
        this.toolbar.style.display = "none";

        this.handle.style.display = "none"
        this.edit = false
        if (this.parentNode) {
            this.parentNode.removeChild(this)
        }
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
    constructor(mode, onchange, onfocus, onblur, onclose) {
        super()

        this.mode = mode;

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
           
            #container{
                width: 720px;
                height: 400px;
                position: fixed;
                background: var(--palette-background-default); 
                border-top: 1px solid var(--palette-background-paper);
                border-left: 1px solid var(--palette-background-paper);
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

        container.name = "code_editor"

        setMoveable(this.shadowRoot.querySelector(".header"), container, (left, top) => {
            /** */
        }, this, offsetTop)

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

        if (!this.editor) {
            return
        }

        // Innitialisation of the element.
        this.shadowRoot.innerHTML = `
        <style>
           
            #container{
                display: flex;
                flex-direction: column;
                font-size: 1.2rem;
                margin-left: 20px;
                width: 100%;
                user-select: none;
                -moz-user-select: none;
                -khtml-user-select: none;
                -webkit-user-select: none;
                -o-user-select: none;
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

            .drop-zone{
                height: 2px;
                width: 100%;
            }

        </style>
        <div id="container" draggable="true">
            <span class="drop-zone" id="drop-before-${this.editor.element.id}"></span>
            <span id="id">${this.editor.element.tagName.toLowerCase()} id="${this.editor.element.id}"</span>
            <div id="childrens">
                <slot></slot>
            </div>
            <span class="drop-zone" id="drop-after-${this.editor.element.id}"></span>
        </div>
        `



        this.editor.selector = this

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
            this.click()
        }

        id.ondragenter = (evt) => {
            document.getElementsByTagName("globular-web-page")[0].dragging = false;
            evt.preventDefault()
            id.style.border = "1px solid var(--palette-action-disabled)"
        }

        id.ondragend = id.ondragleave = (evt) => {
            evt.preventDefault()
            id.style.border = ""
        }

        id.ondragover = (evt) => {
            evt.preventDefault()
            evt.stopPropagation();
        }

        id.ondrop = (evt) => {
            evt.preventDefault()
            id.style.border = ""
            var id_ = evt.dataTransfer.getData("Text");
            let e = document.getElementById(id_)

            if (this.editor.element.children.length == 0) {
                this.editor.element.appendChild(e)
                // I will also move it style 
                this.editor.element.appendChild(document.getElementById(e.id + "_style"))

                // and it script.
                this.editor.element.appendChild(document.getElementById(e.id + "_script"))

                this.editor.selector.appendChild(e.editor.selector)
            } else {

                // and it script.
                this.editor.element.insertBefore(document.getElementById(e.id + "_script"), this.editor.element.children[0])

                // I will also move it style 
                this.editor.element.insertBefore(document.getElementById(e.id + "_style"), this.editor.element.children[0])


                // append the element
                this.editor.element.insertBefore(e, this.editor.element.children[0])

                // append at top...
                this.editor.selector.insertBefore(e.editor.selector, this.editor.selector.children[0])


            }

            e.editor.selector.slot = ""


            e.editor.parentId = e.parentNode.id
            this.setFirstSelectors()

            window.dispatchEvent(new Event('resize'));
            Model.eventHub.publish("_need_save_event_", null, true)

        }

        // Get the list of all child drop zone...

        let dropBefore = this.shadowRoot.querySelector(`#drop-before-${this.editor.element.id}`)
        dropBefore.ondragenter = (evt) => {
            evt.preventDefault()
            document.getElementsByTagName("globular-web-page")[0].dragging = false;
            dropBefore.style.height = "10px"
            dropBefore.style.backgroundColor = "var(--palette-action-disabled)"
        }

        dropBefore.ondragend = dropBefore.ondragleave = (evt) => {
            evt.preventDefault()
            dropBefore.style.height = "2px"
            dropBefore.style.backgroundColor = ""
        }

        dropBefore.ondragover = (evt) => {
            evt.preventDefault()
            evt.stopPropagation();
        }

        dropBefore.ondrop = (evt) => {
            evt.preventDefault()
            dropAfter.style.height = "2px"
            dropAfter.style.backgroundColor = ""
            var id = evt.dataTransfer.getData("Text");
            let parent = this.editor.getParent()

            if (parent) {
                let getNextChild = (c) => {
                    if (c.tagName != "STYLE" && c.tagName != "SCRIPT") {
                        return c
                    }
                    let index = getChildIndex(c)
                    index++
                    if (parent.children[index])
                        return getNextChild(parent.children[index])

                    return null
                }

                let e = document.getElementById(id)
                let index = getChildIndex(this.editor.element)
                let count = parent.children.length

                // I will not count element selector and editor in case the parent is a webpage...
                for (var i = 0; i < parent.children.length - 1; i++) {
                    if (parent.children[i].tagName == "GLOBULAR-ELEMENT-SELECTOR" || parent.children[i].tagName == "GLOBULAR-ELEMENT-EDITOR") {
                        count = count - 1
                    }
                }

                if (index < count - 3) {

                    // insert before element...
                    parent.insertBefore(e, this.editor.element)

                    // I will also move it style 
                    parent.insertBefore(document.getElementById(e.id + "_style"), this.editor.element)

                    // and it script.
                    parent.insertBefore(document.getElementById(e.id + "_script"), this.editor.element)

                    // append it selector...
                    if (parent.editor) {
                        parent.editor.selector.insertBefore(e.editor.selector, this.editor.selector)
                    } else {
                        e.editor.selector.slot = "selectors"
                        parent.insertBefore(e.editor.selector, this.editor.selector)
                    }
                } else {
                    parent.appendChild(e)

                    // I will also move it style 
                    parent.appendChild(document.getElementById(e.id + "_style"))

                    // and it script.
                    parent.appendChild(document.getElementById(e.id + "_script"))

                    // append it selector...
                    if (parent.editor)
                        parent.editor.selector.appendChild(e.editor.selector)
                    else {
                        e.editor.selector.slot = "selectors"
                        parent.appendChild(e.editor.selector)
                    }
                }

                // set it new parent id.
                e.editor.parentId = e.parentNode.id
                this.setFirstSelectors()
                window.dispatchEvent(new Event('resize'));
                Model.eventHub.publish("_need_save_event_", null, true)

            }
        }

        if (getChildIndex(this.editor.element) > 0) {
            dropBefore.style.display = "none"
        }


        let dropAfter = this.shadowRoot.querySelector(`#drop-after-${this.editor.element.id}`)
        dropAfter.ondragenter = (evt) => {
            evt.preventDefault()
            document.getElementsByTagName("globular-web-page")[0].dragging = false;
            dropAfter.style.height = "10px"
            dropAfter.style.backgroundColor = "var(--palette-action-disabled)"
        }

        dropAfter.ondragend = dropAfter.ondragleave = (evt) => {
            evt.preventDefault()
            dropAfter.style.height = "2px"
            dropAfter.style.backgroundColor = ""
        }

        dropAfter.ondragover = (evt) => {
            evt.preventDefault()
            evt.stopPropagation();
        }

        dropAfter.ondrop = (evt) => {
            evt.preventDefault()
            dropAfter.style.height = "2px"
            dropAfter.style.backgroundColor = ""
            var id = evt.dataTransfer.getData("Text");
            let parent = this.editor.getParent()

            if (parent) {
                let getNextChild = (c) => {
                    if (c.tagName != "STYLE" && c.tagName != "SCRIPT") {
                        return c
                    }
                    let index = getChildIndex(c)
                    index++
                    if (parent.children[index])
                        return getNextChild(parent.children[index])

                    return null
                }

                let e = document.getElementById(id)
                let index = getChildIndex(this.editor.element)
                let count = parent.children.length

                // I will not count element selector and editor in case the parent is a webpage...
                for (var i = 0; i < parent.children.length - 1; i++) {
                    if (parent.children[i].tagName == "GLOBULAR-ELEMENT-SELECTOR" || parent.children[i].tagName == "GLOBULAR-ELEMENT-EDITOR") {
                        count = count - 1
                    }
                }

                if (index < count - 3) {

                    let e_ = getNextChild(parent.children[index + 3])

                    // insert before element...
                    parent.insertBefore(e, e_)

                    // I will also move it style 
                    parent.insertBefore(document.getElementById(e.id + "_style"), e_)

                    // and it script.
                    parent.insertBefore(document.getElementById(e.id + "_script"), e_)

                    // append it selector...
                    if (parent.editor) {
                        if (e_.editor) {
                            parent.editor.selector.insertBefore(e.editor.selector, e_.editor.selector)
                        } else if (e_.selector) {
                            parent.editor.selector.insertBefore(e.editor.selector, e_.selector)
                        }
                    } else {
                        e.editor.selector.slot = "selectors"
                        if (e_.editor) {
                            parent.insertBefore(e.editor.selector, e_.editor.selector)
                        } else if (e_.selector) {
                            parent.insertBefore(e.editor.selector, e_.selector)
                        }
                    }


                } else {
                    parent.appendChild(e)

                    // I will also move it style 
                    parent.appendChild(document.getElementById(e.id + "_style"))

                    // and it script.
                    parent.appendChild(document.getElementById(e.id + "_script"))


                    // append it selector...
                    if (parent.editor)
                        parent.editor.selector.appendChild(e.editor.selector)
                    else {
                        e.editor.selector.slot = "selectors"
                        parent.appendChild(e.editor.selector)
                    }
                }

                // set it new parent id.
                e.editor.parentId = e.parentNode.id

                this.setFirstSelectors()

                window.dispatchEvent(new Event('resize'));
                Model.eventHub.publish("_need_save_event_", null, true)
            }
        }

        let container = this.shadowRoot.querySelector("#container")
        container.ondragstart = (evt) => {
            evt.stopPropagation()
            // set the id of the element to be move...
            evt.dataTransfer.setData("Text", this.editor.element.id);
        }
    }

    connectedCallback() {
        this.setFirstSelectors()
    }

    // Set the first element
    setFirstSelectors() {
        let selectors = document.getElementsByTagName("globular-element-selector")
        for (var i = 0; i < selectors.length; i++) {
            selectors[i].setFirstSelector()
        }
    }

    // return the get drop before element
    setFirstSelector() {
        let dropBefore = this.shadowRoot.querySelector(`#drop-before-${this.editor.element.id}`)
        let isFirst = true;
        for (var i = 0; i < this.editor.element.parentNode.children.length; i++) {
            let e = this.editor.element.parentNode.children[i]
            if (e.tagName == "GLOBULAR-ELEMENT-SELECTOR") {
                if (e === this.editor.selector) {
                    break;
                } else {
                    isFirst = false
                    break
                }
            }
        }

        if (isFirst) {
            dropBefore.style.display = ""
        } else {
            dropBefore.style.display = "none"
        }
        dropBefore.style.backgroundColor = ""
        dropBefore.style.height = "2px"
    }

    click() {
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

