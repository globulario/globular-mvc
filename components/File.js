
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-card/paper-card.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-checkbox/paper-checkbox.js';
import '@polymer/iron-icons/editor-icons.js'

import { Model } from '../Model';
import { File } from "../File";
import { theme } from './Theme';
import { v4 as uuidv4 } from "uuid";

// contain list of dir localy
const _dirs = {}

function _setDir(dir) {
    _dirs[dir._path] = dir
    // set child dir.
    for (const f of dir.files) {
        _setDir(f)
    }
}

/**
 * Read dir from local map if available. Read from the server
 * if not in the map of force (in case of refresh)
 * @param {*} path The path of the dir on the server
 * @param {*} callback The success callback
 * @param {*} errorCallback The error callback
 * @param {*} force If set the dir will be read from the server.
 */
function _readDir(path, callback, errorCallback, force) {
    if (_dirs[path] != undefined && force == undefined) {
        callback(_dirs[path]);
    } else {
        File.readDir(path, (dir) => {
            _setDir(dir)
            callback(dir)
        }, errorCallback)
    }
}

/**
 * That class is the base class of FilesListView and FilesIconView
 */
export class FilesView extends HTMLElement {
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // The active explorer path.
        this.path = undefined

        // The function will be call in case of error.
        this.onerror = undefined;

        Model.eventHub.subscribe("set_dir_event",
            (uuid) => {
                /** Nothin here. */
            },
            (dir) => {
                this.setDir(dir)
            }
        )
    }

    // Set the directory.
    setDir(dir) {
        /** Nothing to do here. */
    }

    // The connection callback.
    connectedCallback() {
        // Innitialisation of the layout.
        let id = uuidv4().split("-").join("_");

        this.shadowRoot.innerHTML = `
            <style>
                ${theme}

                table {
                    text-align: left;
                    position: relative;
                    border-collapse: separate; /* Don't collapse */
                    border-spacing: 0;
                }
                
                table th,
                table td {
                  /* Apply a left border on the first <td> or <th> in a row */
                  border-right: 1px solid  var(--palette-action-disabled);
                }

                table th:last-child,
                table td:last-child {
                  /* Apply a left border on the first <td> or <th> in a row */
                  border-right: none;
                }
                
                thead {
                    display: table-header-group;
                    vertical-align: middle;
                    border-color: inherit;
                }

                tbody {
                    display: table-row-group;
                    vertical-align: middle;
                    border-color: inherit;
                }

                tr {
                    display: table-row;
                    vertical-align: inherit;
                    border-color: inherit;
                    color: var(--palette-text-primary);
                }

                td {
                    display: table-cell;
                    vertical-align: inherit;
                }

                th, td {
                    padding: 0.25rem;
                    min-width: 150px;
                    padding-left: 5px;
                }
                 
                th {
                    z-index: 100;
                    position: sticky;
                    background-color: var(--palette-background-paper);
                    top: 0; /* Don't forget this, required for the stickiness */
                }

                .files-list-view-header {
                    padding-left: 5px;
                    padding-right: 5px;
                }

                .files-list-view-info {
                    padding: 2px;
                }

                .files-view-div{
                    display: flex;
                    flex-direction: column;
                    background-color: var(--palette-background-default);
                    color: var(--palette-text-primary);
                    position: absolute;
                    top: 0px;
                    left: 0px;
                    bottom: 0px;
                    right: 0px;
                    overflow: auto;
                }

            </style>

            <div class="files-view-div" id="${id}">
            </div>
            `
        // get the div.
        this.div = this.shadowRoot.getElementById(id)
        this.div.onscroll = () => {
            const headers = this.div.getElementsByClassName("files-list-view-header")
            if (this.div.scrollTop > 0) {
                for (var h of headers) {
                    h.style.boxShadow = "0 2px 2px -1px rgba(0, 0, 0, 0.4)"
                }
            } else {
                for (var h of headers) {
                    h.style.boxShadow = ""
                }
            }
        }
    }
}

/**
 * In this view files will be show as list.
 */
export class FilesListView extends FilesView {
    constructor() {
        super()
    }

    /**
     * Display the content of a directory
     * @param {*} dir 
     */
    setDir(dir) {
        this.div.innerHTML = "";
        let id = uuidv4().split("-").join("_");
        let html = `
            <table>
                <thead class="files-list-view-header">
                    <tr>
                        <th class="name_header_div files-list-view-header">Nom</th>
                        <th class="modified_header_div files-list-view-header">Modifié le</th>
                        <th class="mime_header_div files-list-view-header">Type</th>
                        <th class="size_header_div files-list-view-header">Taille</th>
                    </tr>
                </thead>
                <tbody id=${id}"_files_list_view_info" class="files-list-view-info"></tbody>
            </table>
        `

        // Create the header.
        this.div.innerHTML = html

        // get the info div that will contain the information.
        let fileListView = this.div.getElementsByClassName("files-list-view-info")[0]
        let range = document.createRange()

        for (let f of dir.files) {
            let size = ""
            let mime = "Dossier de fichiers"
            let icon = "icons:folder"

            if (!f.isDir) {
                icon = "editor:insert-drive-file";
                if (f.size > 1024) {
                    if (f.size > 1024 * 1024) {
                        if (f.size > 1024 * 1024 * 1024) {
                            let fileSize = f.size / (1024 * 1024 * 1024);

                            size = fileSize.toFixed(2) + " Gb";
                        } else {
                            let fileSize = f.size / (1024 * 1024);
                            size = fileSize.toFixed(2) + " Mb";
                        }
                    } else {
                        let fileSize = f.size / 1024;
                        size = fileSize.toFixed(2) + " Kb";
                    }
                } else {
                    size = f.size + " bytes";
                }
                mime = f.mime.split(";")[0].split("/")
            }

            // Set the text.
            let html = `
                <td>
                    <iron-icon id="${id}_icon" class="file-lnk-ico" style="height: 18px;" icon="${icon}"></iron-icon> 
                    <span> ${f.name} </span>
                </td>
                <td>${f.modTime.toLocaleString()}</td>
                <td>${mime}</td>
                <td>${size}</td>
            `
            let row = document.createElement("tr")
            row.innerHTML = html;

            if (f.isDir) {
                fileListView.insertBefore(row, fileListView.firstChild);
                let lnk = this.div.getElementsByClassName("file-lnk-ico")[0]
                lnk.onclick = () => {
                    Model.eventHub.publish("set_dir_event", _dirs[f._path], true)
                }

                lnk.onmouseover = () => {
                    lnk.style.cursor = "pointer"
                }

                lnk.onmouseleave = () => {
                    lnk.style.cursor = "default"
                }

            } else {
                fileListView.appendChild(row);

                // TODO create the code for open file.
            }
        }
    }
}

customElements.define('globular-files-list-view', FilesListView)

/**
 * In this view files will be show as icon
 */
export class FilesIconView extends FilesView {
    constructor() {
        super()
    }

    /**
     * Display the content of a directory
     * @param {*} dir 
     */
    setDir(dir) {
        // Here I will set the list of 
    }
}

customElements.define('globular-files-icon-view', FilesIconView)


/**
 * That component is use to navigate in path.
 */
export class PathNavigator extends HTMLElement {
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // the main div.
        this.div = undefined

        // The active explorer path.
        this.path = undefined

        // The function will be call in case of error.
        this.onerror = undefined;

        // List of listeners...
        this.navigationListener = ""

        // The the path
        Model.eventHub.subscribe("set_dir_event",
            (uuid) => {
                /** Nothin here. */
            },
            (dir) => {
                this.setDir(dir)
            }
        )
    }

    // Set the directory.
    setDir(dir) {

        if (this.path == dir._path) {
            return;
        }

        let values = dir._path.split("/")
        values.splice(0, 1)

        // Clear actual values.
        this.div.innerHTML = "";
        this.path = dir._path;

        let index = 0;
        let path = ""

        for (const dir of values) {
            let title = document.createElement("span")
            title.style.position = "relative"
            title.innerHTML = dir
            let path_ = path += "/" + dir
            let directoriesDiv = null
            if (index < values.length - 1) {
                // Here I will also append a button to go to a given path.
                let btn = document.createElement("iron-icon")
                btn.style.position = "relative"
                btn.icon = "icons:chevron-right"
                title.appendChild(btn)

                // Display the list of all subdirectories...
                btn.onclick = (evt) => {
                    evt.stopPropagation()
                    if (btn.icon == "icons:expand-more") {
                        directoriesDiv.style.display = "none"
                        btn.icon = "icons:chevron-right"
                        return
                    }

                    btn.icon = "icons:expand-more"

                    if (directoriesDiv != null) {
                        directoriesDiv.style.display = "flex"
                        return
                    }


                    // Create the div that will contain the list of sub-directories.
                    directoriesDiv = document.createElement("paper-card")
                    directoriesDiv.className = "directories-selector"
                    directoriesDiv.style.display = "flex"
                    directoriesDiv.style.flexDirection = "column"
                    directoriesDiv.style.position = "absolute"
                    directoriesDiv.style.padding = "5px"
                    directoriesDiv.style.zIndex = "100";
                    directoriesDiv.style.top = title.offsetHeight + "px"
                    directoriesDiv.style.right = "0px"
                    directoriesDiv.style.backgroundColor = "var(--palette-background-paper)"
                    directoriesDiv.style.color = "var(--palette-text-primary)"

                    _readDir(path_, (dir) => {
                        // Send read dir event.
                        for (let subDir of dir.files) {
                            let subDirSpan = document.createElement("span")
                            subDirSpan.innerHTML = subDir.name;
                            subDirSpan.padding = "4px"

                            if (subDir.isDir) {
                                directoriesDiv.appendChild(subDirSpan)

                                // Here I will set the span event.
                                subDirSpan.onmouseover = () => {
                                    subDirSpan.style.cursor = "pointer"
                                    subDirSpan.style.setProperty("background-color", "var(--palette-background-default)")
                                }

                                subDirSpan.onmouseleave = () => {
                                    subDirSpan.style.cursor = "default"
                                    subDirSpan.style.setProperty("background-color", "var(--palette-background-paper)")
                                }

                                subDirSpan.onclick = (evt) => {
                                    evt.stopPropagation()
                                    Model.eventHub.publish("set_dir_event", _dirs[subDir._path], true)
                                    directoriesDiv.style.display = "none"
                                    btn.icon = "icons:chevron-right"
                                }

                            }
                        }

                        title.appendChild(directoriesDiv)
                        directoriesDiv.style.right = -1 * (directoriesDiv.offsetWidth - btn.offsetWidth) + "px"

                        directoriesDiv.onmouseleave = () => {
                            directoriesDiv.style.display = "none"
                            if (btn == null) {
                                btn.icon = "icons:chevron-right"
                            }
                        }
                    }, this.onerror)
                }

                btn.onmouseover = () => {
                    btn.style.cursor = "pointer"
                }

                btn.onmouseleave = () => {
                    btn.style.cursor = "default"
                }
            }

            index++

            title.onmouseover = () => {
                title.style.cursor = "pointer"
                title.style.setProperty("background-color", "var(--palette-background-paper)")
            }

            title.onmouseleave = () => {
                title.style.cursor = "default"
                title.style.setProperty("background-color", "var(--palette-background-default)")
                if (directoriesDiv != undefined) {
                    directoriesDiv.style.display = "none"
                }
            }

            // Set the current directory to the clicked one.
            title.onclick = () => {
                _readDir(path_, (dir) => {
                    // Send read dir event.
                    Model.eventHub.publish("set_dir_event", _dirs[dir._path], true)
                }, this.onerror)
            }

            this.div.appendChild(title)
        }
    }

    // The connection callback.
    connectedCallback() {
        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
            <style>
                ${theme}

                #path-navigator-box{
                    flex-grow: 1;
                    background-color: var(--palette-background-default);
                    color: var(--palette-text-primary);
                    display: flex;
                    align-items: center;
                }


            </style>

            <div id="path-navigator-box">
            </div>
            `

        this.div = this.shadowRoot.querySelector("#path-navigator-box")
    }
}

customElements.define('globular-path-navigator', PathNavigator)

/**
 * That component is use to display file navigation tree.
 */
export class FileNavigator extends HTMLElement {
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // The active explorer path.
        this.path = undefined

        // The function will be call in case of error.
        this.onerror = undefined;

        // List of listeners...
        this.navigationListener = ""


        // The directory displayed in the navigator.
        this.dir = null

        // The root div.
        this.div = null

        // That control the heigth of the file navigator.
        this.height = 640

        // The control width
        this.width = 200
    }



    // Init the tree view.
    initTreeView(dir, div, level) {
        let id = uuidv4().split("-").join("_");
        let name = dir.path.split("/").pop();
        let offset = 10 * level
        let html = `
            <style>

                #${id}:hover{
                    cursor: pointer;
                }

            </style>

            <div id="${id}" style="padding-left: ${offset}px;">
                <div style="display: flex; padding-top: 5px; padding-bottom: 5px; align-items: center;  position: relative;">
                    <iron-icon id="${id}_expand_btn" icon="icons:chevron-right" style="--iron-icon-fill-color:var(--palette-action-disabled);"></iron-icon>
                    <iron-icon id="${id}_shrink_btn" icon="icons:expand-more" style="--iron-icon-fill-color:var(--palette-action-active); display: none;"></iron-icon>
                    <div id="${id}_directory_lnk" class="directory-lnk">
                        <iron-icon id="${id}_directory_icon" icon="icons:folder"></iron-icon>
                        <span style="margin-left: 5px;"> ${name}</span>
                    </div>
                    <paper-ripple recenters></paper-ripple>
                </div>
                <div id="${id}_files_div" style="display: none;">
                <div>
            </div>
        `

        let range = document.createRange()
        div.appendChild(range.createContextualFragment(html));

        /** Now i will get the */
        let shrinkBtn = this.shadowRoot.getElementById(id + "_shrink_btn")
        let expandBtn = this.shadowRoot.getElementById(id + "_expand_btn")

        shrinkBtn.onmouseover = () => {
            shrinkBtn.style.cursor = "pointer"
        }

        shrinkBtn.onmouseleave = () => {
            shrinkBtn.style.cursor = "default"
        }

        expandBtn.onmouseover = () => {
            expandBtn.style.cursor = "pointer"
        }

        expandBtn.onmouseleave = () => {
            expandBtn.style.cursor = "default"
        }

        let dirLnk = this.shadowRoot.getElementById(id + "_directory_lnk")
        let dirIco = this.shadowRoot.getElementById(id + "_directory_icon")

        let hasSubdir = false;
        let fileDiv = this.shadowRoot.getElementById(id + "_files_div")

        for (var f of dir._files) {
            if (f._isDir) {
                this.initTreeView(f, fileDiv, level + 1);
                hasSubdir = true;
            }
        }

        // hide the button if no sub-document exist.
        if (!hasSubdir) {
            expandBtn.style.visibility = "hidden"
        } else {
            expandBtn.style.visibility = "visible"
        }

        // Now actions.
        shrinkBtn.onmouseover = () => {
            shrinkBtn.style.cursor = "pointer"
        }

        shrinkBtn.onmouseleave = () => {
            shrinkBtn.style.cursor = "default"
        }

        shrinkBtn.onclick = () => {
            shrinkBtn.style.display = "none";
            fileDiv.style.display = "none"
            dirIco.icon = "icons:folder"

            if (dir._files.length > 0) {
                expandBtn.style.display = "block";
            } else {
                expandBtn.style.visibility = "visible";
            }
        }

        expandBtn.onclick = () => {
            shrinkBtn.style.display = "block"
            fileDiv.style.display = "block"
            dirIco.icon = "icons:folder-open"

            if (dir._files.length > 0) {
                expandBtn.style.display = "none";
            } else {
                expandBtn.style.visibility = "hidden";
            }
        }

        dirLnk.onclick = () => {
            Model.eventHub.publish("set_dir_event", _dirs[dir._path], true);
        }

        dirLnk.onmouseover = () => {
            dirLnk.style.cursor = "pointer"
        }

        dirLnk.onmouseleave = () => {
            dirLnk.style.cursor = "default"
        }

    }

    // Set the directory.
    setDir(dir) {
        console.log("set file navigation to dir: ", dir)
        this.dir = dir;
        this.initTreeView(dir, this.div, 0)
    }

    // The connection callback.
    connectedCallback() {
        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
            <style>
                ${theme}
            </style>

            <div id="file-navigator-div" style="min-width: ${this.width}px; max-height: ${this.height}px; min-height: ${this.height}px; overflow: auto;">
                
            </div>
            `

        // The get the root div.
        this.div = this.shadowRoot.querySelector("#file-navigator-div");
    }
}

customElements.define('globular-file-navigator', FileNavigator)

/**
 * File explorer.
 */
export class FileExplorer extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // The active explorer path.
        this.path = undefined

        // The root path
        this.root = undefined

        // contain the statck of navigations.
        this.navigations = []

        // The function will be call in case of error.
        this.onerror = undefined;

        // The function is call when the explorer is call
        this.onclose = undefined;

        // This function is call when the explorer is open.
        this.onopen = undefined;

        // Interface elements...
        // The main explorer button
        this.fileExplorerBox = undefined
        this.fileExplorerOpenBtn = undefined
        this.fileExplererCloseBtn = undefined

        // The file view.
        this.filesListView = undefined
        this.filesIconView = undefined

        // The path navigator
        this.pathNavigator = undefined

        // The file navigator.
        this.fileNavigator = undefined

        this.filesListBtn = undefined
        this.fileIconBtn = undefined

        // The refresh button
        this.refreshBtn = undefined

        // File navigation button.
        this.backNavigationBtn = undefined
        this.fowardNavigationBtn = undefined
        this.upwardNavigationBtn = undefined
        this.lstNavigationBtn = undefined


    }

    // Set the file explorer directory.
    init() {

        Model.eventHub.subscribe("set_dir_event",
            (uuid) => {
                /** Nothin here. */
            },
            (dir) => {
                // keep the active path.
                this.setDir(dir)
            }
        )

        if (this.root == undefined) {
            // Set the path to application folder by default.
            this.root = "/" + Model.application; // set to the application folder.
        }

        // Read the fd
        _readDir(this.root, (dir) => {
            // set interface with the given directory.

            if (this.fileNavigator != null) {
                this.fileNavigator.setDir(dir)
            } else {
                console.log("no file navigator!")
            }

            if (this.pathNavigator != null) {
                this.pathNavigator.setDir(dir)
            } else {
                console.log("no path navigator!")
            }

            if (this.filesListView != null) {
                this.filesListView.setDir(dir)
            } else {
                console.log("no file list view!")
            }

            if (this.filesIconView) {
                this.filesIconView.setDir(dir)
            } else {
                console.log("no file icon view!")
            }


            this.setDir(dir)


        }, this.onerror)
    }

    setRoot(root) {
        this.root = root
        this.init()
    }

    setDir(dir) {


        if (this.backNavigationBtn != null) {
            this.backNavigationBtn.style.setProperty("--iron-icon-fill-color", "var(--palette-action-disabled)")
        }
        if (this.fowardNavigationBtn != null) {
            this.fowardNavigationBtn.style.setProperty("--iron-icon-fill-color", "var(--palette-action-disabled)")
        }
        if (this.upwardNavigationBtn != null) {
            this.upwardNavigationBtn.style.setProperty("--iron-icon-fill-color", "var(--palette-action-disabled)")
        }



        // Append the dir in the list of 
        if (this.navigations.indexOf(dir.path) == -1) {
            this.navigations.push(dir.path) // set the path in the navigation.
        }

        if (this.navigations.length > 2 && this.lstNavigationBtn != null) {
            this.lstNavigationBtn.style.display = "block"
            let navigationLst = null
            console.log(this.lstNavigationBtn.parentNode.childNodes)
            if (this.lstNavigationBtn.parentNode.children.length == 1) {
                // Here I will set the navigation list.
                navigationLst = document.createElement("paper-card")
                navigationLst.className = "directories-selector"
                navigationLst.style.display = "none"
                navigationLst.style.flexDirection = "column"
                navigationLst.style.position = "absolute"
                navigationLst.style.padding = "5px"
                navigationLst.style.zIndex = "100";
                navigationLst.style.top = title.offsetHeight + "px"
                navigationLst.style.right = "0px"
                navigationLst.style.backgroundColor = "var(--palette-background-paper)"
                navigationLst.style.color = "var(--palette-text-primary)"
                this.lstNavigationBtn.parentNode.appendChild(navigationLst)
                this.lstNavigationBtn.onclick = () => {
                    if (navigationLst.style.display == "flex") {
                        navigationLst.style.display = "none"
                    } else {
                        navigationLst.style.display = "flex"
                    }
                }

                navigationLst.onmouseleave = () => {
                    navigationLst.style.display = "none"
                }

            } else {
                navigationLst = this.lstNavigationBtn.parentNode.children[1]
            }

            navigationLst.innerHTML = "";
            let range = document.createRange()

            for (let path of this.navigations) {
                let html = `
                    <div style="display: flex; align-items: center;">
                        <iron-icon style="height: 16px;"></iron-icon><div> ${path.split("/").pop()} </div>
                    </div>
                `
                navigationLst.appendChild(range.createContextualFragment(html));
                let index = navigationLst.children.length - 1
                let navigationLine = navigationLst.children[index]
                let _index = this.navigations.indexOf(dir.path)
                if (index < _index) {
                    navigationLine.children[0].icon = "icons:arrow-back"
                } else if (index > _index) {
                    navigationLine.children[0].icon = "icons:arrow-forward"
                } else {
                    navigationLine.children[0].icon = "icons:check"
                }

                navigationLine.onmouseover = () => {
                    navigationLine.style.cursor = "pointer"
                    navigationLine.style.setProperty("background-color", "var(--palette-background-default)")
                    navigationLine.children[0].style.setProperty("background-color", "var(--palette-background-default)")
                    navigationLine.children[1].style.setProperty("background-color", "var(--palette-background-default)")
                }

                navigationLine.onmouseleave = () => {
                    navigationLine.style.cursor = "default"
                    navigationLine.style.setProperty("background-color", "var(--palette-background-paper)")
                    navigationLine.children[0].style.setProperty("background-color", "var(--palette-background-paper)")
                    navigationLine.children[1].style.setProperty("background-color", "var(--palette-background-paper)")
                }

                navigationLine.onclick = () => {
                    navigationLst.style.display = "none"
                    Model.eventHub.publish("set_dir_event", _dirs[this.navigations[index]], true)
                }
            }


            let index = this.navigations.indexOf(dir.path)
            if (index > 0) {
                this.backNavigationBtn.style.setProperty("--iron-icon-fill-color", "var(--palette-action-active)")
            }

            if (index < this.navigations.length - 1) {
                this.fowardNavigationBtn.style.setProperty("--iron-icon-fill-color", "var(--palette-action-active)")
            }
        }

        this.path = dir.path;

        if (this.path.split("/").length > 2 && this.upwardNavigationBtn != null) {
            this.upwardNavigationBtn.style.setProperty("--iron-icon-fill-color", "var(--palette-action-active)")
        }
    }

    getWorkspace() {
        return document.getElementById("workspace")
    }


    // The connection callback.
    connectedCallback() {
        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${theme}
            
            iron-icon:hover{
                cursor: pointer;
            }

            #file-navigation-panel{
                background-color: var(--palette-background-default);
                color: var(--palette-text-primary);
            }

            #file-selection-panel{
                margin-left: 15px;
                flex-grow: 1;
                background-color: var(--palette-background-default);
                color: var(--palette-text-primary);
                position: relative;
            }

            #file-explorer-content{
                display: flex;
                flex-direction: column;
                min-width: 800px;
            }

            paper-card{
                font-size: 1.0rem;
            }

            .card-actions{
                display: flex;
            }

        </style>

        <paper-icon-button id="file-explorer-box-open-btn" icon="icons:folder"></paper-icon-button>

        <paper-card id="file-explorer-box" class="file-explorer" style="flex-direction: column; display: none;">
            <div id="file-explorer-content" class="card-content">
                <div style="display: flex; align-items: center;">
                    <paper-icon-button id="navigation-back-btn" icon="icons:icons:arrow-back"></paper-icon-button>
                    <paper-icon-button id="navigation-foward-btn" icon="icons:arrow-forward"></paper-icon-button>
                    <div style="position: relative;">
                        <iron-icon id="navigation-lst-btn" icon="icons:expand-more" style="--iron-icon-fill-color:var(--palette-action-active); display: none; height: 16px;"></iron-icon>
                    </div>
                    <paper-icon-button id="navigation-upward-btn" icon="icons:arrow-upward"></paper-icon-button>
                    <globular-path-navigator id="globular-path-navigator" style="flex-grow: 1;"></globular-path-navigator>
                    <paper-icon-button id="navigation-refresh-btn" icon="icons:refresh"></paper-icon-button>
                </div>
                <div style="display: flex; flex-grow: 1;">
                    <div id="file-navigation-panel">
                        <globular-file-navigator id="globular-file-navigator"></globular-file-navigator>
                    </div>
                    <div  id="file-selection-panel" style="position: relative;">
                        <globular-files-list-view id="globular-files-list-view" ></globular-files-list-view>
                        <globular-files-icon-view id="globular-files-icon-view"  style="display:none;"></globular-files-icon-view>
                        <div style="position: absolute; bottom: 8px; right: 8px; display: flex; background-color:var(--palette-background-default)" >
                            <paper-icon-button id="files-list-btn" icon="icons:view-list" style="--iron-icon-fill-color: var(--palette-action-active);"></paper-icon-button>
                            <paper-icon-button id="files-icon-btn" icon="icons:view-module" style="--iron-icon-fill-color: var(--palette-action-disabled);"></paper-icon-button>
                        </div>
                    </div>
                </div>

            </div>
            <div class="card-actions">
                <span style="flex-grow: 1;"></span>
                <paper-button id="file-explorer-box-close-btn">Close</paper-button>
            </div>
        </paper-card>
        `

        // The main explorer button
        this.fileExplorerBox = this.shadowRoot.querySelector("#file-explorer-box")
        this.fileExplorerOpenBtn = this.shadowRoot.querySelector("#file-explorer-box-open-btn")
        this.fileExplererCloseBtn = this.shadowRoot.querySelector("#file-explorer-box-close-btn")

        // The file view.
        this.filesListView = this.shadowRoot.querySelector("#globular-files-list-view")
        this.filesIconView = this.shadowRoot.querySelector("#globular-files-icon-view")

        // The path navigator
        this.pathNavigator = this.shadowRoot.querySelector("#globular-path-navigator")

        // The file navigator.
        this.fileNavigator = this.shadowRoot.querySelector("#globular-file-navigator")

        this.filesListBtn = this.shadowRoot.querySelector("#files-list-btn")
        this.fileIconBtn = this.shadowRoot.querySelector("#files-icon-btn")

        // The refresh button
        this.refreshBtn = this.shadowRoot.querySelector("#navigation-refresh-btn")

        // File navigation button.
        this.backNavigationBtn = this.shadowRoot.querySelector("#navigation-back-btn")
        this.fowardNavigationBtn = this.shadowRoot.querySelector("#navigation-foward-btn")
        this.upwardNavigationBtn = this.shadowRoot.querySelector("#navigation-upward-btn")
        this.lstNavigationBtn = this.shadowRoot.querySelector("#navigation-lst-btn")

        this.backNavigationBtn.onclick = () => {
            let index = this.navigations.indexOf(this.path)
            index--
            if (index < this.navigations.length && index > -1) {
                Model.eventHub.publish("set_dir_event", _dirs[this.navigations[index]], true)
            }
        }

        this.fowardNavigationBtn.onclick = () => {
            let index = this.navigations.indexOf(this.path)
            index++
            if (index < this.navigations.length && index > -1) {
                Model.eventHub.publish("set_dir_event", _dirs[this.navigations[index]], true)
            }
        }

        this.upwardNavigationBtn.onclick = () => {

            if (this.path.split("/").length > 2) {
                this.path = this.path.substring(0, this.path.lastIndexOf("/"))
                Model.eventHub.publish("set_dir_event", _dirs[this.path], true)
            }
        }


        this.filesListBtn.onclick = () => {
            this.filesListView.style.display = ""
            this.filesIconView.style.display = "none"
            this.filesListBtn.style.setProperty("--iron-icon-fill-color", "var(--palette-action-active)")
            this.fileIconBtn.style.setProperty("--iron-icon-fill-color", "var(--palette-action-disabled)")
        }

        this.fileIconBtn.onclick = () => {
            this.filesListView.style.display = "none"
            this.filesIconView.style.display = ""
            this.filesListBtn.style.setProperty("--iron-icon-fill-color", "var(--palette-action-disabled)")
            this.fileIconBtn.style.setProperty("--iron-icon-fill-color", "var(--palette-action-active)")
        }

        this.fileExplorerOpenBtn.onclick = () => {
            this.fileExplorerBox.style.display = "flex"
            this.fileExplorerOpenBtn.style.display = "none"
            if (this.onopen != undefined) {
                this.onopen();
            }
        }

        this.fileExplererCloseBtn.onclick = () => {
            this.fileExplorerBox.style.display = "none"
            this.fileExplorerOpenBtn.style.display = ""
            if (this.onclose != undefined) {
                this.onclose();
            }
        }

        // Refresh the root directory and send event to
        // refresh all the interface.
        this.refreshBtn.onclick = () => {
            _readDir(this.root, (dir) => {
                Model.eventHub.publish("set_dir_event", _dirs[this.path], true)
            }, this.onerror, true)
        }

        if (this.hasAttribute("maximized")) {
            this.fileExplorerOpenBtn.click();
        }

        if (this.hasAttribute("hideactions")) {
            this.shadowRoot.querySelector(".card-actions").style.display = "none";
        }
        
        // Need to set event on each webcomponents.
        this.init();
    }
}

customElements.define('globular-file-explorer', FileExplorer)