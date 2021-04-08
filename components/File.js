
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-card/paper-card.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-checkbox/paper-checkbox.js';
import '@polymer/iron-icons/editor-icons.js'
import "@polymer/iron-icons/social-icons";
import "@polymer/iron-icons/av-icons";

import { Model } from '../Model';
import { File } from "../File";
import { Menu } from './Menu';
import { VideoPlayer } from './Video'
import { theme } from './Theme';
import { v4 as uuidv4 } from "uuid";

// Menu to set action on files.
import { DropdownMenuElement } from './menu/dropdownMenu.js';
import { MenuItemElement } from './menu/menuItem.js';
import { createElement } from "./element.js";
import { ItemManufacturer } from 'globular-web-client/catalog/catalog_pb';
import { GetThumbnailsResponse } from 'globular-web-client/file/file_pb';
import { downloadFileHttp, uploadFiles } from 'globular-web-client/api';
import { ApplicationView } from '../ApplicationView';
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
        // Innitialisation of the layout.
        let id = "_" + uuidv4().split("-").join("_");

        this.menu = new DropdownMenuElement()
        this.menu.innerHTML = `
        <menu-item-element id="item-0">
            <iron-icon icon="more-vert"></iron-icon>
            <menu-item-element id="share-menu-item" style="text-agling: left;" action="">
                <iron-icon icon="folder-shared" style="height: 18px; width: 18px"></iron-icon>
                <span style="margin-left: 10px;">Share</span>
            </menu-item-element>
            <menu-item-element id="manage-acess-menu-item" style="text-agling: left;" action="">
                <iron-icon icon="social:group" style="height: 18px; width: 18px"></iron-icon>
                <span style="margin-left: 10px;">Manage access</span>
            </menu-item-element>
            <menu-item-element id="rename-menu-item" style="text-agling: left;" action="">
                <iron-icon icon="icons:create" style="height: 18px; width: 18px"></iron-icon>
                <span style="margin-left: 10px;">Rename</span>
            </menu-item-element>
            <menu-item-element id="delete-menu-item" style="text-agling: left;" action="">
                <iron-icon icon="icons:delete" style="height: 18px; width: 18px"></iron-icon>
                <span style="margin-left: 10px;">Delete</span>
            </menu-item-element>
            <menu-item-element id="download-menu-item" style="text-agling: left;" action="">
                <iron-icon icon="icons:cloud-download" style="height: 18px; width: 18px"></iron-icon>
                <span style="margin-left: 10px;">Download</span>
            </menu-item-element>
        </menu-item-element>
        `

        this.shareAccessMenuItem = this.menu.querySelector("#share-menu-item")
        this.mananageAccessMenuItem = this.menu.querySelector("#manage-acess-menu-item")
        this.renameMenuItem = this.menu.querySelector("#rename-menu-item")
        this.deleteMenuItem = this.menu.querySelector("#delete-menu-item")
        this.downloadMenuItem = this.menu.querySelector("#download-menu-item")

        this.downloadMenuItem.action = () => {
            console.log("download menu click")
            this.menu.parentNode.removeChild(this.menu)
        }

        this.shareAccessMenuItem.action = () => {
            console.log("share menu click")
            this.menu.parentNode.removeChild(this.menu)
        }

        this.deleteMenuItem.action = () => {
            console.log("delete menu click")
            this.menu.parentNode.removeChild(this.menu)
        }

        this.renameMenuItem.action = () => {
            console.log("rename menu click")
            this.menu.parentNode.removeChild(this.menu)
        }

        this.mananageAccessMenuItem.action = () => {
            console.log("manage access menu click")
            this.menu.parentNode.removeChild(this.menu)
        }

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
                    h.style.boxShadow = "var(--dark-mode-shadow)"
                }
            } else {
                for (var h of headers) {
                    h.style.boxShadow = ""
                }
            }
        }
    }

    init() {
        // The the path
        Model.eventHub.subscribe("set_dir_event",
            (uuid) => {
                /** Nothin here. */
            },
            (dir) => {
                this.setDir(dir)
            }, true
        )
    }

    // Set the directory.
    setDir(dir) {
        /** Nothing to do here. */
    }
}

/**
 * In this view files will be show as list.
 * TODO 
 * - file sorter at the header of the panel
 * - Drag and drop
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
        if (dir.name.startsWith(".")) {
            return;
        }
        this.div.innerHTML = "";
        let id = "_" + uuidv4().split("-").join("_");
        let html = `
        <style>
            tbody tr {
                background-color: var(--palette-background-default);
                transition: background 0.2s ease,padding 0.8s linear;
            }

            tbody tr:hover {
                -webkit-filter: invert(10%);
                filter: invert(10%);
            }

            .first-cell {
                display: flex;
                align-items: center;
            }

            .first-cell span{
                flex-grow: 1;
                padding-top: 4px;
                padding-left: 4px;
            }

            .first-cell span:hover{
                cursor: pointer;
                /*text-decoration: underline;*/
            }
            
            .first-cell paper-checkbox, paper-icon-button {
                visibility: hidden;
            }

            .first-cell paper-icon-button {
                min-width: 40px;
            }

        </style>
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

        this.div.querySelector(`table`).onmouseleave = (evt) => {
            let item0 = this.menu.querySelector("#item-0")
            evt.stopPropagation()
            let isopen = false;
            if (item0.menu != undefined) {
                isopen = item0.menu.isopen
            }
            if (!isopen) {
                this.menu.style.display = "none"
            }
        }

        this.div.onclick = (evt) => {
            evt.stopPropagation()
            let item0 = this.menu.querySelector("#item-0")
            let isopen = false;
            if (item0.menu != undefined) {
                isopen = item0.menu.isopen
            }
            if (isopen) {
                item0.click()
                item0.menu.isopen = false;
                //this.div.querySelector(`table`).mouseleave()
                this.menu.parentNode.removeChild(this.menu)
            }
        }


        // get the info div that will contain the information.
        let fileListView = this.div.getElementsByClassName("files-list-view-info")[0]
        if (dir == undefined) {
            return
        }
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
            } else {
                size = f.files.length + " items"
            }

            // Set the text.
            let html = `
                <td class="first-cell">
                    <paper-checkbox></paper-checkbox>
                    <iron-icon id="${id}_icon" class="file-lnk-ico" style="height: 18px;" icon="${icon}"></iron-icon> 
                    <span> ${f.name} </span>
                </td>
                <td>${f.modTime.toLocaleString()}</td>
                <td>${mime}</td>
                <td>${size}</td>
            `
            let row = document.createElement("tr")
            row.innerHTML = html;

            let checkbox = row.querySelector("paper-checkbox")

            let span = row.querySelector("span")
            row.onclick = ()=>{
                if(f.mime.startsWith("video")){
                    Model.eventHub.publish("__play_video__", f.path, true)
                }else if(f.isDir){
                    Model.eventHub.publish("set_dir_event", _dirs[f._path], true)
                }
            }

            // On mouse over event.
            row.onmouseover = () => {
                checkbox.style.visibility = "visible"
                let item0 = this.menu.querySelector("#item-0")
                // I will remove the background color for that item...
                let isopen = false;
                if (item0.menu != undefined) {
                    isopen = item0.menu.isopen
                }
                if (!isopen) {
                    row.querySelector(".first-cell").appendChild(this.menu)
                    item0.style.background = "none";
                    this.menu.style.display = "block"
                }
            }

            // On mouseout event.
            row.onmouseout = (evt) => {
                evt.stopPropagation()
                if (!checkbox.checked) {
                    checkbox.style.visibility = "hidden"
                }
            }
            if (!f.name.startsWith(".")) {
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
}

customElements.define('globular-files-list-view', FilesListView)

/**
 * In this view files will be show as icon
 */
export class FilesIconView extends FilesView {
    constructor() {
        super()
        this.imageHeight = 80
    }

    /**
     * Display the content of a directory
     * @param {*} dir 
     */
    /**
     * Display the content of a directory
     * @param {*} dir 
     */
    setDir(dir) {
        if (dir.name.startsWith(".")) {
            return;
        }

        this.div.innerHTML = "";
        let h = this.imageHeight; // the heigth of the image/icon div
        let w = this.imageHeight;
        let hidden = null;

        let html = `
        <style>
            #container {
                background-color: var(--palette-background-default);
                display: flex;
                flex-direction: column;
                padding: 8px;
            }

            /** The file section */
            .file-type-section {
                display: flex;
                flex-direction: column;
            }

            .file-type-section .title{
                font-size: 1.2rem;
                font-weight: 400;
                text-transform: uppercase;
                color: var(--palette-text-secondary);
                border-bottom: 2px solid;
                border-color: var(--palette-divider);
                width: 66.66%;
               
            }

            .file-type-section .content {
                display: flex;
                margin-bottom: 16px;
                margin-top: 16px;
                flex-wrap: wrap;
            }

            .file-type-section .title span {
                font-weight: 400;
                font-size: 1rem;
            }

            /** Display icon div */
            .file-icon-div{
                display: flex;
                position: relative;
                flex-direction: column;
                margin: 5px;
                padding: 5px;
                padding-top:25px;
                border-radius: 5px;
                transition: background 0.2s ease,padding 0.8s linear;
                background-color: var(--palette-background-paper);
                height: ${h}px;
                min-width: ${w}px;
                justify-content: center;
                align-items: center;
            }

            .file-icon-div paper-checkbox{
                position: absolute;
                display: none;
                top: 5px; 
                left: 5px;
            }

            .file-icon-div .menu-div{
                position: absolute;
                top: 1px; 
                right: 1px;
            }

            .file-icon-div img {
                display: block;
                width:auto;
                height: 100%;
            }


            .file-div {
                display:flex; 
                flex-direction: column;
                align-items: center;
            }

            .file-icon-div:hover{
                cursor: pointer;
            }

            .file-div span {
                /*
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                */
               word-wrap: break-word;
               text-align: center;
            }

            .file-icon-div:hover {
                -webkit-filter: invert(10%);
                filter: invert(10%);
            }

        </style>
        <div id="container">
        
        </div>
        `

        // Create the header.
        this.div.innerHTML = html

        this.div.querySelector(`#container`).onmouseleave = (evt) => {
            let item0 = this.menu.querySelector("#item-0")
            evt.stopPropagation()
            let isopen = false;
            if (item0.menu != undefined) {
                isopen = item0.menu.isopen
            }
            if (!isopen) {
                this.menu.style.display = "none"
            }
        }

        this.div.querySelector(`#container`).onclick = (evt) => {
            evt.stopPropagation()
            let item0 = this.menu.querySelector("#item-0")
            let isopen = false;
            if (item0.menu != undefined) {
                isopen = item0.menu.isopen
            }
            if (isopen) {
                item0.click()
                item0.menu.isopen = false;
                this.menu.parentNode.removeChild(this.menu)
            }
        }

        let filesByType = {};
        // get the info div that will contain the information.
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
            } else {
                size = f.files.length + " items"
            }
            // the first part of the mime type will be use as tile and category of file.
            let fileType = f._mime.split("/")[0]
            if (f.isDir) {
                fileType = "folder"
            }
            if (filesByType[fileType] == undefined) {
                filesByType[fileType] = []
            }

            if (!f.name.startsWith(".")) {
                filesByType[fileType].push(f)
            } else {
                // The hidden dir.
                hidden = f
            }

        }
        let range = document.createRange()
        // Now I will display files by their categories.
        for (var fileType in filesByType) {
            let section = this.div.querySelector(`#${fileType}_section`)
            if (section == undefined && filesByType[fileType].length > 0) {
                let html = `
                <div class="file-type-section">
                    <div class="title">${fileType} <span>(${filesByType[fileType].length})</span></div>
                    <div class="content" id="${fileType}_section"></div>
                </div>
                `
                this.div.querySelector(`#container`).appendChild(range.createContextualFragment(html))
                section = this.div.querySelector(`#${fileType}_section`)
            }

            // Now I will create the icon file view.
            filesByType[fileType].forEach(file => {
                let id = "_" + uuidv4().split("-").join("_");

                let html = `
                <div class="file-div" >
                    <div class="file-icon-div" id="${id}">
                        <paper-checkbox></paper-checkbox>
                        <div class="menu-div"></div>
                    </div>
                </div>
                `

                section.appendChild(range.createContextualFragment(html))
                let fileIconDiv = section.querySelector(`#${id}`)
                // Now I will append the file name span...
                let fileNameSpan = document.createElement("span")

                // Here I will append the interation.
                fileIconDiv.onmouseover = (evt) => {
                    let checkbox = fileIconDiv.querySelector("paper-checkbox")
                    checkbox.style.display = "block"
                    let item0 = this.menu.querySelector("#item-0")
                    // I will remove the background color for that item...
                    let isopen = false;
                    if (item0.menu != undefined) {
                        isopen = item0.menu.isopen
                    }
                    if (!isopen) {
                        fileIconDiv.querySelector(".menu-div").appendChild(this.menu)
                        item0.style.background = "none";
                        this.menu.style.display = "block"
                    }
                }

                fileIconDiv.onmouseout = (evt) => {
                    let checkbox = fileIconDiv.querySelector("paper-checkbox")
                    if (!checkbox.checked) {
                        checkbox.style.display = "none"
                    }
                }

                if (file.isDir) {
                    
                    // Here I will create a folder mosaic from the folder content...
                    let folderIcon = document.createRange().createContextualFragment(`<iron-icon icon="icons:folder"></iron-icon>`)
                    fileIconDiv.insertBefore(folderIcon, fileIconDiv.firstChild)

                    fileIconDiv.onclick = ()=>{
                        Model.eventHub.publish("set_dir_event", _dirs[file._path], true)
                    }
                    
                } else if (fileType == "video") {
                    /** In that case I will display the vieo preview. */
                    if (hidden != null) {
                        for (var i = 0; i < hidden.files.length; i++) {
                            let file_ = hidden.files[i]
                            if (file.name.startsWith(file_.name)) {
                                for (var j = 0; j < file_.files.length; j++) {
                                    let file__ = file_.files[j]
                                    if (file__.name == "__preview__") {
                                        let files__ = file__.files;
                                        let preview = new VideoPreview(file.path, files__, h, () => {
                                            if (preview.width > 0 && preview.height > 0) {
                                                w = (preview.width / preview.height) * h
                                            }
                                            fileNameSpan.style.maxWidth = w + "px";
                                        })
                                        fileIconDiv.insertBefore(preview, fileIconDiv.firstChild)

                                    }
                                }
                                break;
                            }
                        }
                    }

                } else if (fileType == "image") {
                    /** Display the thumbnail. */
                    let img = document.createElement("img")
                    img.src = file.thumbnail

                    fileIconDiv.insertBefore(img, fileIconDiv.firstChild)
                    if (img.width > 0 && img.height > 0) {
                        w = (img.width / img.height) * h
                    }

                    console.log("image width ", img.width, "image heigth", img.height)
                }


                fileNameSpan.innerHTML = file.name;
                fileNameSpan.style.maxWidth = w + "px";
                fileIconDiv.parentNode.appendChild(fileNameSpan);

            })
        }

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

    init() {
        // The the path
        Model.eventHub.subscribe("set_dir_event",
            (uuid) => {
                /** Nothin here. */
            },
            (dir) => {
                this.setDir(dir)
            }, true
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

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${theme}

            #file-navigator-div {
                min-width: ${this.width}px; 
                max-height: ${this.height}px; 
                min-height: ${this.height}px; 
                overflow: auto;
            }

            /** On smaller display **/
            @media only screen and (max-width: 801px) {
                #file-navigator-div{
                    min-height: 150px;
                }
            }

        </style>

        <div id="file-navigator-div" style="">
            
        </div>
        `

        // The get the root div.
        this.div = this.shadowRoot.querySelector("#file-navigator-div");
    }



    // Init the tree view.
    initTreeView(dir, div, level) {

        // I will not display hidden directory...
        if (dir.name.startsWith(".")) {
            return;
        }

        let id = dir.path.split("/").join("_").split(".").join("_").split("[").join("_").split("]").join("_").split("(").join("_").split(")").join("_").split("{").join("_").split("}").join("_");
        //let id = "_" + uuidv4().split("-").join("_");
        if (this.div.querySelector(`#${id}`) == undefined) {
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
        }

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
        if (this.dir == dir) {
            return;
        }

        this.dir = dir;
        this.initTreeView(dir, this.div, 0)
    }

    // The connection callback.
    connectedCallback() {

    }
}

customElements.define('globular-file-navigator', FileNavigator)

/**
 * File explorer.
 * TODO
 * - search bar
 * - Append a garbadge forlder
 * - Append shared link folder
 * - (?? video or picture special icons...)
 */
export class FileExplorer extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        this.parent = this.getWorkspace()

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

        // Event listener...
        this.set_dir_event_listener = null;
        this.upload_files_event_listener = null;
        this.__play_video__listener = null

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

            #file-explorer-layout{
                display: flex; 
                flex-grow: 1;
            }

            @media only screen and (max-width: 800px) {
                #file-explorer-layout {
                    flex-direction: column;
                }
                #file-explorer-content{
                    min-width: 0px;
                }

                #file-selection-panel{
                    min-height: 500px;
                    margin-left: 0px;
                    margin-top: 15px;
                }
            }
  
            @media only screen and (max-width: 1024px) {

            }
    

            #globular-video-player{
                display: none;
            }

        </style>
        <div style="padding: 7px">
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
                    <paper-icon-button id="navigation-cloud-upload-btn" icon="icons:cloud-upload"></paper-icon-button>
                    <paper-icon-button id="navigation-refresh-btn" icon="icons:refresh"></paper-icon-button>
                </div>
                <div id="file-explorer-layout">
                    <div id="file-navigation-panel">
                        <globular-file-navigator id="globular-file-navigator"></globular-file-navigator>
                    </div>
                    <div  id="file-selection-panel" style="position: relative;">
                        <globular-files-list-view id="globular-files-list-view" style="display:none;" ></globular-files-list-view>
                        <globular-files-icon-view id="globular-files-icon-view"></globular-files-icon-view>
                        <globular-video-player id="globular-video-player"></globular-video-player>
                        <div style="position: absolute; bottom: 8px; right: 8px; display: flex; background-color:var(--palette-background-default)" >
                            
                        <paper-icon-button id="files-icon-btn" icon="icons:view-module" style="--iron-icon-fill-color: var(--palette-action-active);"></paper-icon-button>
                            <paper-icon-button id="files-list-btn" icon="icons:view-list" style="--iron-icon-fill-color: var(--palette-action-disabled);"></paper-icon-button>
                        </div>
                    </div>
                </div>

            </div>
            <div class="card-actions">
                <span style="flex-grow: 1;"></span>
                <paper-button id="file-explorer-box-close-btn">Close</paper-button>
            </div>
        </paper-card>
        </div>
        `

        // The main explorer button
        this.fileExplorerBox = this.shadowRoot.querySelector("#file-explorer-box")
        this.fileExplererCloseBtn = this.shadowRoot.querySelector("#file-explorer-box-close-btn")

        // The file view.
        this.filesListView = this.shadowRoot.querySelector("#globular-files-list-view")
        this.filesIconView = this.shadowRoot.querySelector("#globular-files-icon-view")

        // The video player
        this.videoPlayer = this.shadowRoot.querySelector("#globular-video-player")

        // The path navigator
        this.pathNavigator = this.shadowRoot.querySelector("#globular-path-navigator")

        // The file navigator.
        this.fileNavigator = this.shadowRoot.querySelector("#globular-file-navigator")

        this.filesListBtn = this.shadowRoot.querySelector("#files-list-btn")
        this.fileIconBtn = this.shadowRoot.querySelector("#files-icon-btn")

        // The refresh button
        this.refreshBtn = this.shadowRoot.querySelector("#navigation-refresh-btn")

        // The upload file button.
        this.uploadBtn = this.shadowRoot.querySelector("#navigation-cloud-upload-btn")

        // File navigation button.
        this.backNavigationBtn = this.shadowRoot.querySelector("#navigation-back-btn")
        this.fowardNavigationBtn = this.shadowRoot.querySelector("#navigation-foward-btn")
        this.upwardNavigationBtn = this.shadowRoot.querySelector("#navigation-upward-btn")
        this.lstNavigationBtn = this.shadowRoot.querySelector("#navigation-lst-btn")

        // Resize the file selection panel.
        this.fileSelectionPanel = this.shadowRoot.querySelector("#file-selection-panel")
        this.fileExplorerContent = this.shadowRoot.querySelector("#file-explorer-content")
        this.actionsCard = this.shadowRoot.querySelector("#card-actions")

        // I will use the resize event to set the size of the file explorer.
        window.addEventListener("resize", () => {
            // Here I will use the workspace to define the with of the content...
            this.fileExplorerContent.style.minHeight = window.innerHeight - 164 + "px"
        })

        // Here I will connect the windows resize event...
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
            this.videoPlayer.stop();
            this.videoPlayer.style.display = "none"

            this.filesListBtn.style.setProperty("--iron-icon-fill-color", "var(--palette-action-active)")
            this.fileIconBtn.style.setProperty("--iron-icon-fill-color", "var(--palette-action-disabled)")
        }

        this.fileIconBtn.onclick = () => {
            this.filesListView.style.display = "none"
            this.filesIconView.style.display = ""
            this.videoPlayer.stop();
            this.videoPlayer.style.display = "none"
            this.filesListBtn.style.setProperty("--iron-icon-fill-color", "var(--palette-action-disabled)")
            this.fileIconBtn.style.setProperty("--iron-icon-fill-color", "var(--palette-action-active)")
        }

        this.fileExplererCloseBtn.onclick = () => {
            this.close()
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

        // Upload a file.
        this.uploadBtn.onclick = () => {
            let fileInput = document.querySelector("file-input")
            if (fileInput == undefined) {
                fileInput = document.createElement("input")
                fileInput.id = "file-input"
                fileInput.type = "file"
                fileInput.multiple = "true"
                fileInput.style.display = "none"
                document.body.appendChild(fileInput)
            }

            fileInput.click()
            // this.pathNavigator
            fileInput.onchange = () => {
                //ApplicationView.wait("upload files... please wait")
                Model.eventHub.publish("__upload_files_event__", { path: this.path, files: fileInput.files }, true)

            }
        }
    }

    // Set the file explorer directory.
    init() {
        // Init the path navigator
        this.pathNavigator.init();

        // Init the files views
        this.filesListView.init();
        this.filesIconView.init();

        if (this.set_dir_event_listener == null) {
            Model.eventHub.subscribe("set_dir_event",
                (uuid) => {
                    this.set_dir_event_listener = uuid;
                },
                (dir) => {
                    // keep the active path.
                    this.setDir(dir)
                }, true
            )
        }

        // Refresh the interface.
        if (this.upload_files_event_listener == null) {
            Model.eventHub.subscribe("upload_files_event", (uuid) => { 
                this.upload_files_event_listener = uuid
            },
                evt => {
                    if (evt == this.path) {
                        // refresh the interface.
                        this.refreshBtn.click();
                    }
                }, false)
        }


        // Play the video...
        if (this.__play_video__listener == null) {
            Model.eventHub.subscribe("__play_video__", (uuid) => { 
                this.__play_video__listener = uuid
            }, (path) => {
                if(!path.startsWith(this.root)){
                    return
                }

                // keep the actual display...
                let display_icon_view = this.filesIconView.style.display
                let display_list_view = this.filesListView.style.display

                // hide the content.
                this.filesListView.style.display = "none"
                this.filesIconView.style.display = "none"

                this.videoPlayer.style.display = "block"
                
                this.videoPlayer.__playing = true;

                // Display the video only if the path match the video player /applications vs /users
                this.videoPlayer.play(path)
                
            })
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

    // The connection callback.
    connectedCallback() {

    }

    setRoot(root) {
        this.root = root
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

    open(parent) {

        if (parent != undefined) {
            this.parent = parent;
        }

        this.fileExplorerBox.style.display = "flex"

        if (this.onopen != undefined) {
            this.onopen();
        }
        this.parent.appendChild(this)
    }

    close() {
        this.fileExplorerBox.style.display = "none"

        if (this.onclose != undefined) {
            this.onclose();

        }
        this.parent.removeChild(this)
    }

    maximize() {
        this.fileExplorerOpenBtn.click();
    }

    hideActions() {
        this.shadowRoot.querySelector(".card-actions").style.display = "none";
    }
}

customElements.define('globular-file-explorer', FileExplorer)


/**
 * Login/Register functionality.
 */
export class FilesMenu extends Menu {

    // Create the application view.
    constructor(fileExplorer) {
        super("files", "folder", "Files")
        this.fileExplorer = fileExplorer

        this.onclick = () => {
            this.fileExplorer.open();
        }
    }

    init() {

    }
}

customElements.define('globular-files-menu', FilesMenu)

/**
 * Display video preview...
 */
export class VideoPreview extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(path, previews, height, onresize) {
        super()

        this.path = path;
        this.width = height;
        this.height = height;
        this.onresize = onresize;

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        this.shadowRoot.innerHTML = `
        <style>
            ${theme}

            #container{
                height: ${height}px;
                position: relative;
            }

            #container:hover {
                cursor: pointer;
            }

            #play-btn{
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%,-50%);
                --iron-icon-fill-color: var(--palette-text-accent);
                display: none;
            }

            #play-btn:hover {
                cursor: pointer;
            }

            img {
                display: block;
                width:auto;
                height: 100%;
            }

            .preview{

            }
        </style>
       <div id = "container" >
            <iron-icon id="play-btn" icon="av:play-circle-outline"></iron-icon>
            <paper-ripple></paper-ripple>
        </div>
       
       
        `
        this.images = []

        // give the focus to the input.
        this.container = this.shadowRoot.querySelector("#container")
        this.playBtn = this.shadowRoot.querySelector("#play-btn")

        let index = 0;

        if (previews[0] != undefined) {

            let getImage = (callback) => {
                let preview = previews[index];
                index++

                // console.log(images[0])
                var xhr = new XMLHttpRequest();
                xhr.open('GET', preview.path, true);

                // Set responseType to 'arraybuffer', we want raw binary data buffer
                xhr.responseType = 'arraybuffer';

                xhr.onload = (rsp) => {

                    // Create an array of 8-bit unsigned integers
                    var arr = new Uint8Array(rsp.currentTarget.response);

                    // String.fromCharCode returns a 'string' from the specified sequence of Unicode values
                    var raw = String.fromCharCode.apply(null, arr);

                    //btoa() creates a base-64 encoded ASCII string from a String object 
                    var b64 = btoa(raw);

                    //ta-da your image data url!
                    var dataURL = 'data:image/' + preview.mime + ';base64,' + b64;
                    let img = document.createElement("img")
                    img.className = "preview"

                    img.src = dataURL
                    this.images.push(img)

                    if (index < previews.length) {
                        getImage(callback)
                    } else if (callback != undefined) {
                        callback()
                    }
                };

                xhr.send();
            }

            // Get the preview image...
            getImage(() => {
                if (this.images.length > 0) {
                    this.container.appendChild(this.images[0])
                    this.width = this.images[0].width
                    this.height = this.images[0].height
                    if (this.onresize != undefined) {
                        this.onresize()
                    }

                }
            })
        }

        // Play the video
        this.container.onclick = (evt) => {
            this.play()
        }

        // the next image timeout...
        this.timeout = null;
        let is_over_play_btn = false;


        this.playBtn.onmouseenter = (evt) => {
            evt.stopPropagation();
            is_over_play_btn = true
            this.playBtn.style.display = "block";
        }

        this.playBtn.onmouseout = (evt) => {
            evt.stopPropagation();
            is_over_play_btn = false
        }

        // Connect events
        this.container.onmouseenter = (evt) => {
            evt.stopPropagation();
            this.playBtn.style.display = "block";
            if (this.interval == null && !is_over_play_btn) {
                this.startPreview();
            }
        }

        this.container.onmouseout = (evt) => {
            evt.stopPropagation();
            this.playBtn.style.display = "none";
            if (this.interval != null && !is_over_play_btn) {
                this.stopPreview();
            }
        }

    }


    /**
     * Start display the image 
     */
    startPreview() {
        console.log("start preview...")
        let index = 0;

        this.interval = setInterval(() => {

            let img = this.images[index]
            if (img != undefined) {
                while (this.container.children.length > 2) {
                    this.container.removeChild(this.container.children[this.container.children.length - 1])
                }

                this.container.appendChild(img, this.container.firstChild)
            }
            // reset the conter if index reach the number of preview images.
            if (index < this.images.length) {
                index++
            } else {
                index = 0
            }
        }, 500)
    }

    /**
     * Stop the image preview...
     */
    stopPreview() {
        clearInterval(this.interval)
        this.interval = null
        while (this.container.children.length > 2) {
            this.container.removeChild(this.container.children[this.container.children.length - 1])
        }
        this.container.appendChild(this.images[0])
    }

    /**
     * Play video
     */
    play() {
        Model.eventHub.publish("__play_video__", this.path, true)
    }

}

customElements.define('globular-video-preview', VideoPreview)

