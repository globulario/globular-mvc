
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
import { DropdownMenu, DropdownMenuItem } from './menu/dropdownMenu.js';
import { createElement } from "./element.js";
import { ItemManufacturer } from 'globular-web-client/catalog/catalog_pb';
import { CreateDirRequest, GetThumbnailsResponse } from 'globular-web-client/file/file_pb';
import { createArchive, createDir, deleteDir, deleteFile, downloadFileHttp, renameFile, uploadFiles } from 'globular-web-client/api';
import { ApplicationView } from '../ApplicationView';
import { Application } from '../Application';
// contain list of dir localy
const _dirs = {}

function _setDir(dir) {
    _dirs[dir._path] = dir
    // set child dir.
    for (const f of dir.files) {
        _setDir(f)
    }
}

function getElementIndex(element) {
    return Array.from(element.parentNode.children).indexOf(element);
}

function getImage(callback, images, files, index) {
    let f = files[index];
    index++

    var xhr = new XMLHttpRequest();
    xhr.open('GET', f.path, true);

    // Set responseType to 'arraybuffer', we want raw binary data buffer
    xhr.responseType = 'blob';
    xhr.onload = (rsp) => {
        if (rsp.currentTarget.status == 200) {
            var reader = new FileReader();
            reader.readAsDataURL(rsp.currentTarget.response);
            reader.onload = function (e) {
                let img = document.createElement("img")
                img.src = e.target.result
                images.push(img)
                if (index < files.length) {
                    getImage(callback, images, files, index)
                } else if (callback != undefined) {
                    callback(images)
                }
            };
        }
    };

    xhr.send();
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

        // The list of files to delete
        this.selected = {};

        // The function will be call in case of error.
        this.onerror = undefined;
        // Innitialisation of the layout.
        let id = "_" + uuidv4().split("-").join("_");

        let menuItemsHTML = `
        <globular-dropdown-menu-item id="share-menu-item" icon="folder-shared" text="Share" action=""></globular-dropdown-menu-item>
        <globular-dropdown-menu-item id="manage-acess-menu-item" icon="social:group" text="Manage access"action=""></globular-dropdown-menu-item>
        <globular-dropdown-menu-item separator="true"  id="cut-menu-item"  icon="icons:content-cut" text="Paste" action=""></globular-dropdown-menu-item>
        <globular-dropdown-menu-item id="copy-menu-item" icon="content-copy" text="Copy" action=""></globular-dropdown-menu-item>
        <globular-dropdown-menu-item id="paste-menu-item" icon="icons:content-paste" action="" text="Paste"></globular-dropdown-menu-item>
        <globular-dropdown-menu-item separator="true"  id="rename-menu-item" text="Rename" icon="icons:create" action=""> </globular-dropdown-menu-item>
        <globular-dropdown-menu-item id="delete-menu-item" icon="icons:delete" action="" text="Delete"> </globular-dropdown-menu-item>
        <globular-dropdown-menu-item separator="true"  id="download-menu-item" icon="icons:cloud-download" text="Download" action=""> </globular-dropdown-menu-item>
        `

        this.menu = new DropdownMenu("icons:more-vert")
        this.menu.innerHTML = menuItemsHTML

        this.shareAccessMenuItem = this.menu.querySelector("#share-menu-item")
        this.mananageAccessMenuItem = this.menu.querySelector("#manage-acess-menu-item")
        this.renameMenuItem = this.menu.querySelector("#rename-menu-item")
        this.deleteMenuItem = this.menu.querySelector("#delete-menu-item")
        this.downloadMenuItem = this.menu.querySelector("#download-menu-item")

        // Now the cut copy and paste menu...
        this.cutMenuItem = this.menu.querySelector("#cut-menu-item")
        this.copyMenuItem = this.menu.querySelector("#copy-menu-item")
        this.pasteMenuItem = this.menu.querySelector("#paste-menu-item")

        this.downloadMenuItem.action = () => {
            // Here I will create an archive from the selected files and dowload it...
            let files = [];
            for (var key in this.selected) {
                files.push(this.selected[key].path)
            }
            if (files.length > 0) {
                // Create a tempory name...
                let uuid = uuidv4()
                createArchive(Application.globular, files, uuid,
                    path => {
                        // Download the file...
                        downloadFileHttp(path, uuid + ".tgz",
                            () => {
                                // Now I will remove the file from the server....

                                deleteFile(Application.globular, path,
                                    () => {
                                        console.log("file removed")
                                    },
                                    err => { ApplicationView.displayMessage(err, 3000) })
                            }, err => { ApplicationView.displayMessage(err, 3000) })
                    }, err => { ApplicationView.displayMessage(err, 3000) })
            } else {

                let path = this.menu.parentNode.parentNode.name
                let name = path.substring(path.lastIndexOf("/") + 1)

                // if the file is a directory I will create archive and download it.
                if (this.menu.parentNode.parentNode.isDir) {
                    createArchive(Application.globular, [path], name,
                        path_ => {
                            // Download the file...
                            downloadFileHttp(path_, name + ".tgz",
                                () => {
                                    // Now I will remove the file from the server....
                                    deleteFile(Application.globular, path_,
                                        () => {
                                            console.log("file removed")
                                        },
                                        err => { ApplicationView.displayMessage(err, 3000) })
                                }, err => { ApplicationView.displayMessage(err, 3000) })
                        }, err => { ApplicationView.displayMessage(err, 3000) })
                } else {
                    // simply download the file.
                    downloadFileHttp(path, name,
                        () => {
                            // Now I will remove the file from the server....

                        }, err => { ApplicationView.displayMessage(err, 3000) })
                }

            }

            // Remove it from it parent...
            this.menu.parentNode.removeChild(this.menu)
        }

        this.shareAccessMenuItem.action = () => {
            console.log("share menu click")
            this.menu.parentNode.removeChild(this.menu)
        }

        this.deleteMenuItem.action = () => {
            let files = []
            let fileList = ""
            for (var fileName in this.selected) {
                fileList += `<div>${this.selected[fileName].path}</div>`
                files.push(this.selected[fileName])
            }

            // if not checked but selected with menu...
            if (fileList.length == 0) {
                let file = this.menu.file
                fileList += `<div>${file.path}</div>`

                files.push(file)
            }

            let toast = ApplicationView.displayMessage(
                `
            <style>
              #yes-no-files-delete-box{
                display: flex;
                flex-direction: column;
              }

              #yes-no-files-delete-box globular-files-card{
                padding-bottom: 10px;
              }

              #yes-no-files-delete-box div{
                display: flex;
                font-size: 1rem;
                padding-bottom: 10px;
              }

              paper-button{
                font-size: 1rem;
                height: 32px;
              }

            </style>
            <div id="yes-no-files-delete-box">
              <div>Your about to delete files</div>
              <div style="display: flex; flex-direction: column;">
                ${fileList}
              </div>
              <div>Is it what you want to do? </div>
              <div style="justify-content: flex-end;">
                <paper-button raised id="yes-delete-files">Yes</paper-button>
                <paper-button raised id="no-delete-files">No</paper-button>
              </div>
            </div>
            `,
                15000 // 15 sec...
            );

            let yesBtn = document.querySelector("#yes-delete-files")
            let noBtn = document.querySelector("#no-delete-files")

            // On yes
            yesBtn.onclick = () => {
                toast.dismiss();

                let success = () => {
                    ApplicationView.displayMessage(
                        `<iron-icon icon='delete' style='margin-right: 10px;'></iron-icon><div>
                        Files are now deleted!
                    </div>`,
                        3000
                    );
                }

                let index = 0;
                let deleteFile_ = () => {
                    let f = files[index]
                    let path = f.path.substring(0, f.path.lastIndexOf("/"))
                    index++
                    if (f.isDir) {
                        deleteDir(Application.globular, f.path,
                            () => {
                                Model.eventHub.publish("reload_dir_event", path, false);
                                if (index < Object.keys(this.selected).length) {
                                    deleteFile_()
                                } else {
                                    success()
                                }
                            },
                            err => { ApplicationView.displayMessage(err, 3000) })
                    } else {
                        deleteFile(Application.globular, f.path,
                            () => {
                                Model.eventHub.publish("reload_dir_event", path, false);
                                if (index < Object.keys(this.selected).length) {
                                    deleteFile_()
                                } else {
                                    success()
                                }
                            },
                            err => { ApplicationView.displayMessage(err, 3000) })
                    }
                }

                // start file deletion...
                deleteFile_()
            }

            noBtn.onclick = () => {

                toast.dismiss();
            }

            this.menu.parentNode.removeChild(this.menu)

        }

        this.renameMenuItem.action = () => {
            // Display the rename input...
            this.menu.rename()
            this.menu.parentNode.removeChild(this.menu)
        }

        this.mananageAccessMenuItem.action = () => {
            console.log("manage access menu click", this.path)
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

              popup-menu-element {
                background-color: var(--palette-background-paper); 
                color: var(--palette-text-primary);
              }

          </style>

          <div class="files-view-div" /*oncontextmenu="return false;"*/ id="${id}">
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

        /** Remove the menu */
        this.div.onmouseover = () => {
            if (!this.menu.isOpen()) {
                if (this.menu.parentNode != undefined) {
                    this.menu.parentNode.removeChild(this.menu)
                }
            }
        }

        this.div.onclick = () => {
            this.menu.close()
            if (this.menu.parentNode != undefined) {
                this.menu.parentNode.removeChild(this.menu)
            }
        }

        // Now I will display the menu as popup menu instead of the default menu...
        // so cut copy and paste will work on the current directory and it more natural
        // to use by the end user.
        /*this.div.oncontextmenu = (e) => {
            if (e.preventDefault != undefined)
                e.preventDefault();
            if (e.stopPropagation != undefined)
                e.stopPropagation();

        }*/

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

    clearSelection() {
        this.selected = {}
    }

    rename(parent, span, f, offset) {

        // Here I will use a simple paper-card with a paper input...
        let html = `
                    <style>
                        #rename-file-dialog{
                            display: flex;
                            position: absolute;
                            flex-direction: column;
                            top: ${offset}px;
                            left: 5px;
                            min-width: 200px;
                            z-index: 10000;
                        }
    
                        .rename-file-dialog-actions{
                            font-size: .85rem;
                            align-items: center;
                            justify-content: flex-end;
                            display: flex;
                        }

                        .card-content{
                            background-color: var(--palette-background-paper);
                        }

                        .rename-file-dialog-actions{
                            background-color: var(--palette-background-paper);
                        }
    
                    </style>
                    <paper-card id="rename-file-dialog">
                        <div class="card-content">
                            <paper-textarea id="rename-file-input" label="new folder name" value="${f.name}"></paper-textarea>
                        </div>
                        <div class="rename-file-dialog-actions">
                            <paper-button id="rename-file-cancel-btn">Cancel</paper-button>
                            <paper-button id="rename-file-ok-btn">Rename</paper-button>
                        </div>
                    </paper-card>
                `
        // only one dialog open at time.
        let renameDialog = parent.querySelector("#rename-file-dialog")
        if (renameDialog == undefined) {
            let range = document.createRange()
            parent.appendChild(range.createContextualFragment(html))
            renameDialog = parent.querySelector("#rename-file-dialog")
            renameDialog.onmouseover = renameDialog.onmouseenter = (evt) => {
                evt.stopPropagation();
            }
        }


        let input = parent.querySelector("#rename-file-input")
        setTimeout(() => {
            input.focus()
            let index = f.name.lastIndexOf(".")
            if (index == -1) {
                input.inputElement.textarea.select();
            } else {
                input.inputElement.textarea.setSelectionRange(0, index)
            }
        }, 50)

        let cancel_btn = parent.querySelector("#rename-file-cancel-btn")

        let rename_btn = parent.querySelector("#rename-file-ok-btn")

        // simply remove the dialog
        cancel_btn.onclick = (evt) => {
            evt.stopPropagation();

            let dialog = parent.querySelector("#rename-file-dialog")
            dialog.parentNode.removeChild(dialog)
            span.style.display = ""
        }

        input.onkeydown = (evt) => {
            if (evt.keyCode == 13) {
                rename_btn.click()
            } else if (evt.keyCode == 27) {
                cancel_btn.click()
            }
        }

        rename_btn.onclick = (evt) => {
            evt.stopPropagation();

            let dialog = parent.querySelector("#rename-file-dialog")
            dialog.parentNode.removeChild(dialog)

            span.style.display = ""
            let path = f.path.substring(0, f.path.lastIndexOf("/"))

            // Now I will rename the file or directory...
            renameFile(Application.globular, path, input.value, f.name,
                () => {
                    // Refresh the parent folder...
                    Model.eventHub.publish("reload_dir_event", path, false);
                }, err => { ApplicationView.displayMessage(err, 3000) })
        }
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
            tbody{
                position: relative;
            }

            tbody tr {
                background-color: var(--palette-background-default);
                transition: background 0.2s ease,padding 0.8s linear;
            }

            tr.active{
                filter: invert(10%);
            }

            .first-cell {
                display: flex;
                align-items: center;
                position: relative;
            }

            .first-cell span{
                flex-grow: 1;
                padding-top: 4px;
                padding-left: 4px;
                padding-right: 40px;
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

            globular-dropdown-menu {
                position: absolute;
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
            evt.stopPropagation()

        }

        this.div.onclick = (evt) => {
            evt.stopPropagation()

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

            let rowId = "_" + uuidv4().split("-").join("_");
            row.id = rowId;

            let checkbox = row.querySelector("paper-checkbox")
            // Connect interface from various point...
            checkbox.onclick = (evt) => {
                evt.stopPropagation();
                Model.eventHub.publish("__file_select_unselect_" + f.path, checkbox.checked, true)
            }

            Model.eventHub.subscribe("__file_select_unselect_" + f.path, () => { }, checked => {
                checkbox.checked = checked;
                if (checked) {
                    checkbox.style.visibility = "visible"
                    this.selected[f.path] = f
                } else {
                    checkbox.style.visibility = "hidden"
                    delete this.selected[f.path]
                }
            }, true)


            let span = row.querySelector("span")
            span.onclick = (evt) => {
                evt.stopPropagation();
                if (f.mime.startsWith("video")) {
                    Model.eventHub.publish("__play_video__", f.path, true)
                } else if (f.isDir) {
                    Model.eventHub.publish("set_dir_event", _dirs[f._path], true)
                } else if (f.mime.startsWith("image")) {
                    Model.eventHub.publish("__show_image__", f.path, true)
                }
                this.menu.close()
            }

            row.onmouseenter = (evt) => {
                evt.stopPropagation();
                if (!this.menu.isOpen()) {


                    this.div.querySelector(`tbody`).appendChild(this.menu)
                    this.menu.style.top = row.offsetTop + "px";
                    this.menu.style.left = row.children[0].offsetWidth - this.menu.offsetWidth + "px";
                    this.menu.file = f

                    this.menu.onmouseover = (evt) => {
                        evt.stopPropagation();
                        row.classList.add("active")
                    }

                    this.menu.onmouseout = (evt) => {
                        evt.stopPropagation();
                        row.classList.remove("active")
                    }

                    // set the rename function.
                    this.menu.rename = () => {
                        this.rename(this.menu.parentNode, span, f, row.offsetTop + row.offsetHeight + 6)
                    }
                }
            }

            row.onmouseout = (evt) => {
                evt.stopPropagation();
                if (!this.menu.isOpen()) {
                    if (this.menu.parentNode != undefined) {

                    }
                }
            }

            // On mouse over event.
            row.onmouseover = (evt) => {
                evt.stopPropagation();
                // if a rename box is open I will not display the menu...
                if (row.parentNode.querySelector("#rename-file-dialog") != undefined) {
                    return
                }
                checkbox.style.visibility = "visible"
                row.classList.add("active")
            }

            // On mouseout event.
            row.onmouseleave = (evt) => {
                evt.stopPropagation()
                if (!checkbox.checked) {
                    checkbox.style.visibility = "hidden"
                }
                row.classList.remove("active")
            }

            if (!f.name.startsWith(".")) {
                if (f.isDir) {
                    fileListView.insertBefore(row, fileListView.firstChild);
                    let lnk = this.div.getElementsByClassName("file-lnk-ico")[0]
                    lnk.onclick = (evt) => {
                        evt.stopPropagation();
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
                position: relative;
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
               max-height: 200px;
               overflow-y: hidden;

            }

            .file-icon-div.active{
                filter: invert(10%);
            }

            globular-dropdown-menu {
                position: absolute;
                top: -1px;
                right: 0px;
                z-index: 10000;
            }


        </style>
        <div id="container">
        
        </div>
        `

        // Create the header.
        this.div.innerHTML = html

        this.div.querySelector(`#container`).onmouseleave = (evt) => {
            evt.stopPropagation()
        }

        this.div.querySelector(`#container`).onclick = (evt) => {
            evt.stopPropagation()
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

                let checkbox = fileIconDiv.querySelector("paper-checkbox")

                checkbox.onclick = (evt) => {
                    evt.stopPropagation();
                    Model.eventHub.publish("__file_select_unselect_" + file.path, checkbox.checked, true)
                }

                Model.eventHub.subscribe("__file_select_unselect_" + file.path, () => { }, checked => {
                    checkbox.checked = checked;
                    if (checked) {
                        checkbox.style.display = "block"
                        this.selected[file.path] = file
                    } else {
                        checkbox.style.display = "none"
                        delete this.selected[file.path]
                    }
                }, true)

                // Here I will append the interation.
                fileIconDiv.onmouseover = (evt) => {
                    evt.stopPropagation();
                    checkbox.style.display = "block"
                    fileIconDiv.classList.add("active")
                }

                fileIconDiv.onmouseout = (evt) => {
                    evt.stopPropagation();
                    let checkbox = fileIconDiv.querySelector("paper-checkbox")
                    if (!checkbox.checked) {
                        checkbox.style.display = "none"
                    }
                    fileIconDiv.classList.remove("active")
                }

                if (file.isDir) {

                    // Here I will create a folder mosaic from the folder content...
                    let folderIcon = document.createRange().createContextualFragment(`<iron-icon icon="icons:folder"></iron-icon>`)
                    fileIconDiv.insertBefore(folderIcon, fileIconDiv.firstChild)

                    fileIconDiv.onclick = (evt) => {
                        evt.stopPropagation();
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

                    img.onclick = (evt) => {
                        evt.stopPropagation();
                        Model.eventHub.publish("__show_image__", file.path, true)
                    }
                }

                fileNameSpan.innerHTML = file.name;
                fileNameSpan.style.maxWidth = w + "px";
                fileIconDiv.parentNode.appendChild(fileNameSpan);

                fileIconDiv.onmouseenter = (evt) => {
                    evt.stopPropagation();
                    if (!this.menu.isOpen()) {

                        fileIconDiv.parentNode.appendChild(this.menu)

                        this.menu.onmouseover = (evt) => {
                            evt.stopPropagation();
                            fileIconDiv.classList.add("active")
                        }

                        this.menu.onmouseout = (evt) => {
                            evt.stopPropagation();
                            fileIconDiv.classList.remove("active")
                        }

                        this.menu.file = file;

                        // set the rename function.
                        this.menu.rename = () => {
                            this.rename(this.menu.parentNode, fileNameSpan, file, fileIconDiv.offsetHeight + 3)
                        }
                    }
                }


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
            title.onclick = (evt) => {
                evt.stopPropagation();
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

        // Here I will keep the list of div in memory to be able to 
        // reload it...
        this.dirs = {}

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

    // remove div and reload it from it content...
    reload(dir) {
        console.log("reload dir ", dir)
        if (this.dirs[dir.path] != undefined) {
            let div = this.div.querySelector(`#${this.dirs[dir.path].id}`)
            let parent = div.parentNode
            let level = delete this.dirs[dir.path].level
            if (div != null) {
                parent.removeChild(div)
                delete this.dirs[dir.path]
            }
            // reload the div...
            this.initTreeView(dir, parent, level)
        }
    }

    // Init the tree view.
    initTreeView(dir, div, level) {

        // I will not display hidden directory...
        if (dir.name.startsWith(".")) {
            return;
        }

        let id = "_" + uuidv4().split("-").join("_");
        // keep it in memory 
        this.dirs[dir.path] = { id: id, level: level }

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

        shrinkBtn.onclick = (evt) => {
            evt.stopPropagation();
            shrinkBtn.style.display = "none";
            fileDiv.style.display = "none"
            dirIco.icon = "icons:folder"

            if (dir._files.length > 0) {
                expandBtn.style.display = "block";
            } else {
                expandBtn.style.visibility = "visible";
            }
        }

        expandBtn.onclick = (evt) => {
            evt.stopPropagation();
            shrinkBtn.style.display = "block"
            fileDiv.style.display = "block"
            dirIco.icon = "icons:folder-open"

            if (dir._files.length > 0) {
                expandBtn.style.display = "none";
            } else {
                expandBtn.style.visibility = "hidden";
            }
        }

        dirLnk.onclick = (evt) => {
            evt.stopPropagation();
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
        this.__play_video__listener = null;
        this.__show_image__listener = null;

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
            
            paper-icon-button:hover{
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
                position: relative;
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

            #globular-image-viewer{
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
                    <paper-icon-button id="navigation-create-dir-btn" icon="icons:create-new-folder"></paper-icon-button>
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
                        <globular-image-viewer id="globular-image-viewer"></globular-image-viewer>
                        <div style="position: absolute; bottom: 8px; right: 8px; display: flex; background-color:var(--palette-background-default);" >
                            
                            <paper-icon-button id="files-icon-btn" class="active" icon="icons:view-module" style="--iron-icon-fill-color: var(--palette-action-active);"></paper-icon-button>
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

        // The image viewer
        this.imageViewer = this.shadowRoot.querySelector("#globular-image-viewer")

        // The path navigator
        this.pathNavigator = this.shadowRoot.querySelector("#globular-path-navigator")

        // The file navigator.
        this.fileNavigator = this.shadowRoot.querySelector("#globular-file-navigator")

        this.filesListBtn = this.shadowRoot.querySelector("#files-list-btn")
        this.fileIconBtn = this.shadowRoot.querySelector("#files-icon-btn")

        // The refresh button
        this.refreshBtn = this.shadowRoot.querySelector("#navigation-refresh-btn")

        // The create directory button.
        this.createDirectoryBtn = this.shadowRoot.querySelector("#navigation-create-dir-btn")

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
        this.backNavigationBtn.onclick = (evt) => {
            evt.stopPropagation();
            let index = this.navigations.indexOf(this.path)
            index--
            if (index < this.navigations.length && index > -1) {
                Model.eventHub.publish("set_dir_event", _dirs[this.navigations[index]], true)
            }
        }

        this.fowardNavigationBtn.onclick = (evt) => {
            evt.stopPropagation();
            let index = this.navigations.indexOf(this.path)
            index++
            if (index < this.navigations.length && index > -1) {
                Model.eventHub.publish("set_dir_event", _dirs[this.navigations[index]], true)
            }
        }

        this.upwardNavigationBtn.onclick = (evt) => {
            evt.stopPropagation();
            if (this.path.split("/").length > 2) {
                this.path = this.path.substring(0, this.path.lastIndexOf("/"))
                Model.eventHub.publish("set_dir_event", _dirs[this.path], true)
            }
        }


        this.filesListBtn.onclick = (evt) => {
            evt.stopPropagation();
            this.imageViewer.style.display = "none"
            this.filesListView.style.display = ""
            this.filesIconView.style.display = "none"
            this.videoPlayer.stop();
            this.videoPlayer.style.display = "none"
            this.filesListBtn.classList.add("active")
            this.fileIconBtn.classList.remove("active")
            this.filesListBtn.style.setProperty("--iron-icon-fill-color", "var(--palette-action-active)")
            this.fileIconBtn.style.setProperty("--iron-icon-fill-color", "var(--palette-action-disabled)")
        }

        this.fileIconBtn.onclick = (evt) => {
            evt.stopPropagation();
            this.imageViewer.style.display = "none"
            this.filesListBtn.classList.remove("active")
            this.fileIconBtn.classList.add("active")
            this.filesListView.style.display = "none"
            this.filesIconView.style.display = ""
            this.videoPlayer.stop();
            this.videoPlayer.style.display = "none"
            this.filesListBtn.style.setProperty("--iron-icon-fill-color", "var(--palette-action-disabled)")
            this.fileIconBtn.style.setProperty("--iron-icon-fill-color", "var(--palette-action-active)")
        }

        this.fileExplererCloseBtn.onclick = (evt) => {
            evt.stopPropagation();
            this.close()
        }

        // Create a new directory here...
        this.createDirectoryBtn.onclick = (evt) => {
            evt.stopPropagation();
            // Here I will use a simple paper-card with a paper input...
            let html = `
                <style>
                    #new-dir-dialog{
                        display: flex;
                        position: absolute;
                        flex-direction: column;
                        right: 60px;
                        top: 50px;
                        z-index: 10000;
                    }

                    .new-dir-dialog-actions{
                        font-size: .85rem;
                        align-items: center;
                        justify-content: flex-end;
                        display: flex;
                    }

                </style>
                <paper-card id="new-dir-dialog">
                    <div class="card-content">
                        <paper-textarea id="new-dir-input" label="new folder name" value="Untitled Folder"></paper-textarea>
                    </div>
                    <div class="new-dir-dialog-actions">
                        <paper-button id="new-dir-cancel-btn">Cancel</paper-button>
                        <paper-button id="new-dir-create-btn">Create</paper-button>
                    </div>
                </paper-card>
            `
            // only one dialog open at time.
            if (this.fileExplorerContent.querySelector("#new-dir-dialog") == undefined) {
                let range = document.createRange()
                this.fileExplorerContent.appendChild(range.createContextualFragment(html))
            }

            let input = this.fileExplorerContent.querySelector("#new-dir-input")
            setTimeout(() => {
                input.focus()
                input.inputElement.textarea.select();
            }, 50)

            let cancel_btn = this.fileExplorerContent.querySelector("#new-dir-cancel-btn")
            let create_btn = this.fileExplorerContent.querySelector("#new-dir-create-btn")

            // simply remove the dialog
            cancel_btn.onclick = (evt) => {
                evt.stopPropagation();
                let dialog = this.fileExplorerContent.querySelector("#new-dir-dialog")
                dialog.parentNode.removeChild(dialog)
            }

            input.onkeydown = (evt) => {
                if (evt.keyCode == 13) {
                    create_btn.click()
                } else if (evt.keyCode == 27) {
                    cancel_btn.click()
                }
            }

            create_btn.onclick = (evt) => {
                evt.stopPropagation();
                let dialog = this.fileExplorerContent.querySelector("#new-dir-dialog")
                dialog.parentNode.removeChild(dialog)
                console.log("create directory: ", input.value)

                // Here I will create a new folder...
                // Set the request.
                const rqst = new CreateDirRequest();
                rqst.setPath(this.path);
                rqst.setName(input.value);
                let token = localStorage.getItem("user_token");

                // Create a directory at the given path.
                Application.globular.fileService
                    .createDir(rqst, {
                        token: token,
                        application: Application.application,
                        domain: Application.domain
                    })
                    .then(() => {
                        // The new directory was created.
                        Model.eventHub.publish("reload_dir_event", this.path, false);
                    })
                    .catch((err) => {
                        ApplicationView.displayMessage(err, 3000)
                    });
            }

        }

        // Refresh the root directory and send event to
        // refresh all the interface.
        this.refreshBtn.onclick = () => {
            _readDir(this.root, (dir) => {
                Model.eventHub.publish("set_dir_event", _dirs[this.path], true)

                // Clear selection.
                this.filesListView.clearSelection()
                this.filesIconView.clearSelection()

                // set back the view mode.
                this.displayView()
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


        // File rename event.
        Model.eventHub.subscribe("file_rename_event", () => { }, (path) => {
            if (path.startsWith(this.path)) {
                Model.eventHub.publish("set_dir_event", _dirs[this.path], true)
            }
        }, false)

        // Reload the content of a dir with the actual dir content description on the server.
        // must be call after file are deleted or renamed
        Model.eventHub.subscribe("reload_dir_event", () => { }, (path) => {
            console.log("file delete event received: ", path)
            _readDir(path, (dir) => {
                if (dir.path == this.path) {
                    Model.eventHub.publish("set_dir_event", dir, true)
                }

                this.fileNavigator.reload(dir)
            }, () => { }, true)
            //Model.eventHub.publish("set_dir_event", _dirs[this.path], true)

        }, false)

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
                if (!path.startsWith(this.root)) {
                    return
                }

                // hide the content.
                this.filesListView.style.display = "none"
                this.filesIconView.style.display = "none"

                this.videoPlayer.style.display = "block"

                this.videoPlayer.__playing = true;

                // Display the video only if the path match the video player /applications vs /users
                this.videoPlayer.play(path)

            })
        }

        // Show image...
        if (this.__show_image__listener == null) {
            Model.eventHub.subscribe("__show_image__", (uuid) => {
                this.__show_image__listener = uuid
            }, (path) => {

                // Display image...
                if (!path.startsWith(this.root)) {
                    return
                }

                // hide the content.
                this.filesListView.style.display = "none"
                this.filesIconView.style.display = "none"

                // Display the image viewer...
                this.imageViewer.style.display = "block"

                // Here I will set the active image.
                for (var i = 0; this.imageViewer.children.length; i++) {
                    if (this.imageViewer.children[i].name == path) {
                        this.imageViewer.activeImage(getElementIndex(this.imageViewer.children[i]))
                        break
                    }
                }


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

    displayView() {
        if (this.filesListBtn.classList.contains("active")) {
            this.filesListView.style.display = ""
            this.filesIconView.style.display = "none"
        } else {
            this.filesListView.style.display = "none"
            this.filesIconView.style.display = ""
        }
    }

    loadImages(dir) {
        // get all images in the directory
        let images_ = []
        for (var i = 0; i < dir.files.length; i++) {
            if (dir.files[i].mime.startsWith("image")) {
                let f = dir.files[i]
                images_.push(f)

            }
        }

        // Initialyse images from the server.
        let index = 0;
        let images = [];

        // Set the images in the image viewer.
        if (images_.length > 0) {
            getImage((images) => {
                for (var i = 0; i < images.length; i++) {
                    let img = images[i]
                    img.name = images_[i].path
                    img.slot = "images"
                    let exist = false;
                    for (var i = 0; i < this.imageViewer.children.length; i++) {
                        if (this.imageViewer.children[i].name == img.name) {
                            exist = true;
                            break
                        }
                    }
                    // append image only if is not already there...
                    if (!exist) {
                        this.imageViewer.addImage(img)
                    }
                }
                // Init the images...
                this.imageViewer.populateChildren();
            }, images, images_, index)
        }
    }

    setDir(dir) {

        // Set back the list and icon view
        this.displayView()

        // stop and hide the video player.
        this.videoPlayer.style.display = "none"
        this.videoPlayer.stop();


        this.imageViewer.style.display = "none";
        this.imageViewer.innerHTML = "";

        // Set back the view when the image viewer is close.
        this.imageViewer.onclose = () => {
            this.displayView()
        }

        this.loadImages(dir)

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

            // Get the preview image...
            getImage((images) => {
                this.images = images
                if (this.images.length > 0) {
                    this.container.appendChild(this.images[0])
                    this.width = this.images[0].width
                    this.height = this.images[0].height
                    if (this.onresize != undefined) {
                        this.onresize()
                    }

                }
            }, this.images, previews, index)
        }

        // Play the video
        this.playBtn.onclick = this.container.onclick = (evt) => {
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

