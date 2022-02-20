
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-card/paper-card.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-checkbox/paper-checkbox.js';
import '@polymer/iron-icons/editor-icons.js'
import "@polymer/iron-icons/social-icons";
import "@polymer/iron-icons/av-icons";
import "@polymer/paper-progress/paper-progress.js"
import * as getUuid from 'uuid-by-string'

import { Model } from '../Model';
import { File } from "../File";
import { Menu } from './Menu';
import { PermissionsManager } from './Permissions';
import { InformationsManager } from './Informations'
import { VideoPlayer } from './Video'
import { AudioPlayer } from './Audio'
import { GlobularFileReader } from './Reader'
import { theme } from './Theme';
import { v4 as uuidv4 } from "uuid";

// Menu to set action on files.
import { DropdownMenu } from './dropdownMenu.js';
import { CopyRequest, CreateDirRequest, GetFileInfoRequest, GetThumbnailsResponse, MoveRequest } from 'globular-web-client/file/file_pb';
import { createArchive, deleteDir, deleteFile, downloadFileHttp, renameFile, uploadFiles } from 'globular-web-client/api';
import { ApplicationView } from '../ApplicationView';
import { Application } from '../Application';
import { GetPidsResponse, KillProcessRequest, RunCmdRequest } from 'globular-web-client/admin/admin_pb';
import { GetSharedResourceRqst, SubjectType } from 'globular-web-client/rbac/rbac_pb';
import { randomUUID } from './utility';
import * as getUuidByString from 'uuid-by-string';
import { TimeScale } from 'chart.js';
import { ImageViewer } from './Image';
import { ConversationServicePromiseClient } from 'globular-web-client/conversation/conversation_grpc_web_pb';
import { IndexJsonObjectRequest, SearchDocumentsRequest, SearchResult, SearchResults } from 'globular-web-client/search/search_pb';
import { AssociateFileWithTitleRequest, CreateTitleRequest, GetFileTitlesRequest, GetFileVideosRequest, GetVideoByIdRequest, Person, Poster, Title } from 'globular-web-client/title/title_pb';


// keep track of shared directory
var shared = {}
var public_ = {}

function markAsShare(dir) {
    shared[dir.path] = {};
    dir._files.forEach(f => {
        if (f._isDir) {
            markAsShare(f)
        }
    })
}

function markAsPublic(dir) {
    public_[dir.path] = {};
    dir._files.forEach(f => {
        if (f._isDir) {
            markAsPublic(f)
        }
    })
}

function getElementIndex(element) {
    return Array.from(element.parentNode.children).indexOf(element);
}

function getImage(callback, images, files, index) {
    let f = files[index];
    index++

    // set the url for the image.
    let url = window.location.protocol + "//" + window.location.hostname + ":"
    if (Application.globular.config.Protocol == "https") {
        url += Application.globular.config.PortHttps
    } else {
        url += Application.globular.config.PortHttp
    }

    let path = f.path.split("/")
    path.forEach(item => {
        url += "/" + encodeURIComponent(item.trim())
    })

    // Set url query parameter.
    url += "?domain=" + Model.domain
    url += "&application=" + Model.application
    if (localStorage.getItem("user_token") != undefined) {
        url += "&token=" + localStorage.getItem("user_token")
    }
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader("token", localStorage.getItem("user_token"));
    xhr.setRequestHeader("application", Model.application);
    xhr.setRequestHeader("domain", Model.domain);

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


// Keep dir info in map to save time...
let dirs = {}

/**
 * Read dir from local map if available. Read from the server
 * if not in the map of force (in case of refresh)
 * @param {*} path The path of the dir on the server
 * @param {*} callback The success callback
 * @param {*} errorCallback The error callback
 * @param {*} force If set the dir will be read from the server.
 */
function _readDir(path, callback, errorCallback) {
    let key = getUuidByString(path)
    if (dirs[key] != null) {
        callback(dirs[key])
        return
    }

    // Here I will keep the dir info in the cache...
    File.readDir(path, false, (dir) => {
        callback(dir)
        dirs[key] = dir
    }, errorCallback)

}

function _publishSetDirEvent(path, file_explorer_) {
    file_explorer_.displayWaitMessage("load " + path)
    _readDir(path, (dir) => {

        Model.eventHub.publish("__set_dir_event__", { path: dir, file_explorer_id: file_explorer_.id }, true)
        file_explorer_.resume()
    }, err => { console.log(err) })
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

        // The current directory.
        this.__dir__ = null;

        // The list of files to delete
        this.selected = {};

        // keep the operation to do...
        this.edit = "";
        this.paperTray = null;

        // The function will be call in case of error.
        this.onerror = undefined;
        // Innitialisation of the layout.
        let id = "_" + uuidv4().split("-").join("_").split("@").join("_");

        let menuItemsHTML = `
        <globular-dropdown-menu-item  id="infos-menu-item" icon="icons:info" text="Infos" action=""> </globular-dropdown-menu-item>
        <globular-dropdown-menu-item  separator="true" id="manage-acess-menu-item" icon="folder-shared" text="Manage access"action=""></globular-dropdown-menu-item>
        <globular-dropdown-menu-item separator="true"  id="cut-menu-item"  icon="icons:content-cut" text="Cut" action=""></globular-dropdown-menu-item>
        <globular-dropdown-menu-item id="copy-menu-item" icon="content-copy" text="Copy" action=""></globular-dropdown-menu-item>
        <globular-dropdown-menu-item id="paste-menu-item" icon="icons:content-paste" action="" text="Paste"></globular-dropdown-menu-item>
        <globular-dropdown-menu-item separator="true"  id="rename-menu-item" text="Rename" icon="icons:create" action=""> </globular-dropdown-menu-item>
        <globular-dropdown-menu-item id="delete-menu-item" icon="icons:delete" action="" text="Delete"> </globular-dropdown-menu-item>
        <globular-dropdown-menu-item separator="true"  id="download-menu-item" icon="icons:cloud-download" text="Download" action=""> </globular-dropdown-menu-item>
        <globular-dropdown-menu-item id="open-in-new-tab-menu-item" icon="icons:open-in-new" text="Open in new tab" action=""> </globular-dropdown-menu-item>
        `

        this.menu = new DropdownMenu("icons:more-vert")
        this.menu.innerHTML = menuItemsHTML

        this.infosMenuItem = this.menu.querySelector("#infos-menu-item")
        this.mananageAccessMenuItem = this.menu.querySelector("#manage-acess-menu-item")
        this.renameMenuItem = this.menu.querySelector("#rename-menu-item")
        this.deleteMenuItem = this.menu.querySelector("#delete-menu-item")
        this.downloadMenuItem = this.menu.querySelector("#download-menu-item")
        this.openInNewTabItem = this.menu.querySelector("#open-in-new-tab-menu-item")

        // Now the cut copy and paste menu...
        this.cutMenuItem = this.menu.querySelector("#cut-menu-item")
        this.copyMenuItem = this.menu.querySelector("#copy-menu-item")
        this.pasteMenuItem = this.menu.querySelector("#paste-menu-item")

        this.cutMenuItem.action = () => {
            this.edit = "cut"
            this.paperTray = [];
            for (var key in this.selected) {
                this.paperTray.push(this.selected[key].path)
            }

            // Append file to file menu
            if (this.paperTray.length == 0) {
                this.paperTray.push(this.menu.file.path)
            }

            // empty the selection.
            this.selected = {}

            // Remove it from it parent...
            this.menu.parentNode.removeChild(this.menu)
        }

        this.copyMenuItem.action = () => {

            this.edit = "copy"
            this.paperTray = [];
            for (var key in this.selected) {
                this.paperTray.push(this.selected[key].path)
            }

            // Append file to file menu
            if (this.paperTray.length == 0) {
                this.paperTray.push(this.menu.file.path)
            }

            // empty the selection.
            this.selected = {}

            // Remove it from it parent...
            this.menu.parentNode.removeChild(this.menu)
        }

        this.pasteMenuItem.action = () => {

            if (this.edit == "copy") {
                // Here I will call move on the file manager
                this.copy(this.menu.file.path)

            } else if (this.edit == "cut") {
                // Here I will call copy
                this.move(this.menu.file.path)
            }

            // Remove it from it parent...
            this.menu.parentNode.removeChild(this.menu)
        }

        this.openInNewTabItem.action = () => {
            let url = window.location.protocol + "//" + window.location.hostname + ":"
            if (Application.globular.config.Protocol == "https") {
                url += Application.globular.config.PortHttps
            } else {
                url += Application.globular.config.PortHttp
            }

            this.menu.file.path.split("/").forEach(item => {
                url += "/" + encodeURIComponent(item.trim())
            })

            url += "?application=" + Model.application;
            if (localStorage.getItem("user_token") != undefined) {
                url += "&token=" + localStorage.getItem("user_token");
            }
            window.open(url, '_blank', "fullscreen=yes");
        }

        this.downloadMenuItem.action = () => {
            // Here I will create an archive from the selected files and dowload it...
            let files = [];
            for (var key in this.selected) {
                files.push(this.selected[key].path)
            }
            if (files.length > 0) {
                // Create a tempory name...
                let uuid = "_" + uuidv4().split("-").join("_").split("@").join("_");
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

                let path = this.menu.file.path
                let name = path.substring(path.lastIndexOf("/") + 1)

                // if the file is a directory I will create archive and download it.
                if (this.menu.file.isDir) {
                    createArchive(Application.globular, [path], name,
                        path_ => {
                            // Download the file...
                            console.log("dowload file: ", path_)
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
                    console.log("dowload file: ", path)
                    downloadFileHttp(path, name,
                        () => {
                            // Now I will remove the file from the server....

                        }, err => { ApplicationView.displayMessage(err, 3000) })
                }

            }

            // Remove it from it parent...
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
                                delete dirs[getUuidByString(path)]
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
                                delete dirs[getUuidByString(path)]
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

        this.infosMenuItem.action = () => {
            // So here I will create a new permission manager object and display it for the given file.

            // Now I will test if imdb info are allready asscociated.
            let getTitleInfo = (file, callback) => {
                let rqst = new GetFileTitlesRequest
                rqst.setIndexpath(Model.globular.config.DataPath + "/search/titles")
                rqst.setFilepath(file.path)
                
                console.log("---------> get file titles: ", file.path)
                Model.globular.titleService.getFileTitles(rqst, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
                    .then(rsp => {
                        callback(rsp.getTitles().getTitlesList())
                    })
                    .catch(err => {
                        console.log("---------> no title found: ", file.path)
                        callback([])
                    })
            }


            let getVideoInfo = (file, callback) => {
                let rqst = new GetFileVideosRequest
                rqst.setIndexpath(Model.globular.config.DataPath + "/search/videos")
                rqst.setFilepath(file.path)
                
                console.log("---------> get file video: ", file.path)
                Model.globular.titleService.getFileVideos(rqst, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
                    .then(rsp => {
                        callback(rsp.getVideos().getVideosList())
                    })
                    .catch(err => {
                        console.log("---------> no video found: ", file.path)
                        callback([])
                    })
            }

            // get the title infos...
            getTitleInfo(this.menu.file, (titles) => {
                if (titles.length > 0) {
                    this.menu.file.titles = titles // keep in the file itself...
                    Model.eventHub.publish("display_file_infos_event", this.menu.file, true)
                }
            })

            getVideoInfo(this.menu.file, (videos) => {
                if (videos.length > 0) {
                    console.log(videos)
                    this.menu.file.videos = videos // keep in the file itself...
                    Model.eventHub.publish("display_file_infos_event", this.menu.file, true)
                }
            })
            // hide the menu...
            this.menu.parentNode.removeChild(this.menu)
        }

        this.mananageAccessMenuItem.action = () => {
            console.log("manage access menu click", this.menu.file.path)
            // So here I will create a new permission manager object and display it for the given file.
            Model.eventHub.publish("display_permission_manager_event", this.menu.file.path, true)

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
                  padding-bottom: 40px;
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

            let checkboxs = this.div.querySelectorAll("paper-checkbox")
            for (var i = 0; i < checkboxs.length; i++) {
                if (!checkboxs[i].checked) {
                    checkboxs[i].style.display = "none"
                }
            }

            let fileIconDivs = this.div.querySelectorAll(".file-icon-div")
            for (var i = 0; i < fileIconDivs.length; i++) {
                fileIconDivs[i].classList.remove("active")
            }
        }

        this.div.onclick = () => {
            this.menu.close()
            if (this.menu.parentNode != undefined) {
                this.menu.parentNode.removeChild(this.menu)
            }
        }
    }

    /**
     * Copy file to a given path
     * @param {*} path 
     */
    copy(path) {

        let rqst = new CopyRequest
        rqst.setPath(path)
        rqst.setFilesList(this.paperTray)

        let token = localStorage.getItem("user_token");

        // Create a directory at the given path.
        Application.globular.fileService
            .copy(rqst, {
                token: token,
                application: Application.application,
                domain: Application.domain
            }).then(() => {
                this.paperTray = []
                this.edit = ""
                delete dirs[getUuidByString(path)]
                Model.eventHub.publish("reload_dir_event", path, false);
            })
            .catch(err => {
                this.paperTray = []
                this.edit = ""
                ApplicationView.displayMessage(err, 3000)
            })
    }

    /**
     * Move file to a given path...
     * @param {*} path 
     */
    move(path) {
        let rqst = new MoveRequest
        rqst.setPath(path)
        rqst.setFilesList(this.paperTray)

        let token = localStorage.getItem("user_token");

        // Create a directory at the given path.
        Application.globular.fileService
            .move(rqst, {
                token: token,
                application: Application.application,
                domain: Application.domain
            }).then(() => {
                for (var i = 0; i < this.paperTray.length; i++) {
                    let f = this.paperTray[i]
                    let path_ = f.substring(0, f.lastIndexOf("/"))
                    delete dirs[getUuidByString(path)]
                    Model.eventHub.publish("reload_dir_event", path_, false);
                }
                this.paperTray = []
                this.edit = ""
                delete dirs[getUuidByString(path)]
                Model.eventHub.publish("reload_dir_event", path, false);
            })
            .catch(err => {
                this.paperTray = []
                this.edit = ""
                ApplicationView.displayMessage(err, 3000)
            })
    }

    init() {
        // The the path
        Model.eventHub.subscribe("__set_dir_event__",
            (uuid) => {
                /** Nothin here. */
            },
            (evt) => {
                if (this._file_explorer_.id == evt.file_explorer_id) {
                    this.__dir__ = evt.path
                    this.setDir(evt.path)
                }
            }, true, this
        )

        // The drop file event.
        Model.eventHub.subscribe("drop_file_event", (uuid) => { }, infos => {

            // Hide the icon parent div.
            let div = this.div.querySelector("#" + infos.id)
            if (div != undefined) {
                div.parentNode.style.display = "none"
            } else {
                console.log("div with id ", infos.id, "dosent exist in ", this.div)
            }


            if (this.edit.length == 0) {
                this.edit = "cut"
            }

            this.paperTray = [];
            for (var key in this.selected) {
                this.paperTray.push(this.selected[key].path)
            }

            // Append file to file menu
            if (this.paperTray.length == 0) {
                this.paperTray.push(infos.file)
            }

            if (this.edit == "cut") {
                this.move(infos.dir)
            } else if (this.edit == "copy") {
                this.copy(infos.dir)
            }
        }, true, this)
    }

    clearSelection() {
        this.selected = {}
    }

    rename(parent, f, offset) {
        // Here I will use a simple paper-card with a paper input...
        let html = `
                    <style>
                        #rename-file-dialog{
                            display: flex;
                            position: absolute;
                            flex-direction: column;
                            left: 5px;
                            min-width: 200px;
                            z-index: 100;
                        }
    
                        .rename-file-dialog-actions{
                            font-size: .85rem;
                            align-items: center;
                            justify-content: flex-end;
                            display: flex;
                            background-color: var(--palette-background-paper);
                            color: var(--palette-text-primary);
                        }

                        .card-content{
                            background-color: var(--palette-background-paper);
                        }

                        .rename-file-dialog-actions{
                            background-color: var(--palette-background-paper);
                        }
    
                    </style>
                    <paper-card id="rename-file-dialog" style="top: ${offset}px;">
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

        renameDialog.style.top = offset + "px";


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
            let path = f.path.substring(0, f.path.lastIndexOf("/"))

            // Now I will rename the file or directory...
            renameFile(Application.globular, path, input.value, f.name,
                () => {
                    // Refresh the parent folder...
                    delete dirs[getUuidByString(path)]
                    Model.eventHub.publish("reload_dir_event", path, false);
                }, err => { ApplicationView.displayMessage(err, 3000) })
        }
    }

    // The ondrop evt...
    ondrop(evt) {
        evt.stopPropagation()

        let lnk = evt.dataTransfer.getData('text/html');
        if (evt.dataTransfer.getData("Url").length > 0) {
            // Here we got an url...
            let url = evt.dataTransfer.getData("Url");
            let root = Model.globular.config.DataPath

            // Depending of your need... or the hour of the day.
            if (url.endsWith(".torrent") || url.startsWith("magnet:")) {
                // there is the way to install the torrent client on the server side.
                // https://www.maketecheasier.com/how-to-download-torrents-from-the-command-line-in-ubuntu/
                // there is an exemple of the command called on the sever side.
                let path = this.__dir__.path
                if (path.startsWith("/users/") || path.startsWith("/applications/")) {
                    path = Model.globular.config.DataPath + "/files" + path
                }
                let rqst = new RunCmdRequest
                rqst.setCmd("torrent")
                rqst.setArgsList(["download", url])
                rqst.setPath(path)
                rqst.setBlocking(true)

                let stream = Application.globular.adminService.runCmd(rqst, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
                let pid = -1;

                // Here I will create a local event to be catch by the file uploader...
                stream.on("data", (rsp) => {
                    if (rsp.getPid() != null) {
                        pid = rsp.getPid()
                    }
                    // Publish local event.
                    if (this.__dir__ != undefined) {
                        Model.eventHub.publish("__upload_torrent_event__", { pid: pid, path: this.__dir__.path, infos: rsp.getResult(), done: false, lnk: lnk }, true);
                    }
                });

                stream.on("status", (status) => {
                    if (status.code === 0) {
                        if (this.__dir__ != undefined) {
                            Model.eventHub.publish("refresh_dir_evt", this.__dir__.path, false);
                            Model.eventHub.publish("__upload_torrent_event__", { pid: pid, path: this.__dir__.path, infos: "done", done: true, lnk: lnk }, true);
                        }
                    } else {
                        // error here...
                        ApplicationView.displayMessage(status.details, 3000)
                    }
                });

            } else if (url.endsWith(".jpeg") || url.endsWith(".jpg") || url.startsWith(".bpm") || url.startsWith(".gif") || url.startsWith(".png")) {
                // I will get the file from the url and save it on the server in the current directory.
                var getFileBlob = (url, cb) => {
                    var xhr = new XMLHttpRequest();
                    xhr.open("GET", url);
                    xhr.responseType = "blob";
                    xhr.addEventListener('load', () => {
                        cb(xhr.response);
                    });
                    xhr.send();
                };

                var blobToFile = (blob, name) => {
                    blob.lastModifiedDate = new Date();
                    blob.name = name;
                    return blob;
                };

                var getFileObject = (filePathOrUrl, cb) => {
                    getFileBlob(filePathOrUrl, (blob) => {
                        let name = filePathOrUrl.substring(filePathOrUrl.lastIndexOf("/") + 1)
                        cb(blobToFile(blob, name));
                    });
                };

                getFileObject(url, (fileObject) => {
                    uploadFiles(this.__dir__.path, [fileObject], () => {
                        Model.eventHub.publish("__upload_files_event__", { path: this.__dir__.path, files: [fileObject], lnk: lnk }, true)
                    }, err => ApplicationView.displayMessage(err, 3000))

                });
            } else {

                // Just beat it!
                // youtube-dl -f mp4 -o "/tmp/%(title)s.%(ext)s" https://www.youtube.com/watch?v=oRdxUFDoQe0&list=PLCD0445C57F2B7F41&index=12&ab_channel=michaeljacksonVEVO
                // In that case I will made use of the fabulous youtube-dl command line.
                let toast = ApplicationView.displayMessage(`
                <style>
                    ${theme}
                </style>
                <div id="select-media-dialog">
                    <span>What kind of file to you want to create?</span>
                    <div style="display: flex; justify-content: center;">
                        <paper-radio-group>
                            <paper-radio-button id="media-type-mp4" name="media-type" checked>Video (mp4)</paper-radio-button>
                            <paper-radio-button id="media-type-mp3"  name="media-type">Audio (mp3)</paper-radio-button>
                        </paper-radio-group>
                    </div>
                    <div style="display: flex; justify-content: flex-end;">
                        <paper-button id="upload-lnk-ok-button">Ok</paper-button>
                        <paper-button id="upload-lnk-cancel-button">Cancel</paper-button>
                    </div>
                </div>
                `, 60 * 1000)

                let mp4Radio = toast.el.querySelector("#media-type-mp4")
                let mp3Radio = toast.el.querySelector("#media-type-mp3")

                mp4Radio.onclick = () => {
                    mp3Radio.checked = !mp3Radio.checked
                }

                mp3Radio.onclick = () => {
                    mp4Radio.checked = !mp3Radio.checked
                }

                let okBtn = toast.el.querySelector("#upload-lnk-ok-button")
                okBtn.onclick = () => {
                    let rqst = new RunCmdRequest
                    rqst.setCmd("youtube-dl")

                    let path = this.__dir__.path
                    if (path.startsWith("/users/") || path.startsWith("/applications/")) {
                        path = Model.globular.config.DataPath + "/files" + path
                    }

                    // The path will be set at the command level, not at file level.
                    rqst.setPath(path)

                    let dest = `%(title)s.%(ext)s`

                    if (mp3Radio.checked) {
                        rqst.setArgsList(["-f", "bestaudio", "--extract-audio", "--audio-format", "mp3", "--audio-quality", "0", "-o", dest, url]);
                    } else {
                        rqst.setArgsList(["-f", "mp4", "-o", dest, url])
                    }

                    rqst.setBlocking(true)
                    let stream = Application.globular.adminService.runCmd(rqst, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
                    let pid = -1;

                    // Here I will create a local event to be catch by the file uploader...
                    stream.on("data", (rsp) => {
                        if (rsp.getPid() != null) {
                            pid = rsp.getPid()
                        }
                        // Publish local event.
                        Model.eventHub.publish("__upload_link_event__", { pid: pid, path: this.__dir__.path, infos: rsp.getResult(), done: false, lnk: lnk }, true);
                    });

                    stream.on("status", (status) => {
                        if (status.code === 0) {
                            Model.eventHub.publish("refresh_dir_evt", this.__dir__.path, false);
                            Model.eventHub.publish("__upload_link_event__", { pid: pid, path: this.__dir__.path, infos: "", done: true, lnk: lnk }, true);
                        } else {
                            // error here...
                            ApplicationView.displayMessage(status.details, 3000)
                        }
                    });

                    toast.dismiss();
                }

                let cancelBtn = toast.el.querySelector("#upload-lnk-cancel-button")
                cancelBtn.onclick = () => {
                    toast.dismiss();
                }

            }

        } else if (evt.dataTransfer.files.length > 0) {
            // So here I will simply upload the files...
            Model.eventHub.publish("__upload_files_event__", { path: this.__dir__.path, files: evt.dataTransfer.files, lnk: lnk }, true)
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
        // if the dire is hidden or the dir is the user dir... 
        if (dir.name.startsWith(".") || !(dir.path.startsWith("/public") || public_[dir.path] != undefined || dir.path.startsWith("/shared") || shared[dir.path] != undefined || dir.path.startsWith("/applications/" + Application.application) || dir.path.startsWith("/users/" + Application.account.id))) {
            return;
        }

        this.div.innerHTML = "";
        let id = "_" + uuidv4().split("-").join("_").split("@").join("_");
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
                    <th class="name_header_div files-list-view-header">Name</th>
                    <th class="modified_header_div files-list-view-header">Modifiy</th>
                    <th class="mime_header_div files-list-view-header">Type</th>
                    <th class="size_header_div files-list-view-header">Size</th>
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

        this.div.querySelector(`table`).ondrop = (evt) => {
            evt.preventDefault()
            this.ondrop(evt)
        }

        this.div.querySelector(`table`).ondragover = (evt) => {
            evt.preventDefault()
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

            let rowId = "_" + uuidv4().split("-").join("_").split("@").join("_");
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
            }, true, this)


            let span = row.querySelector("span")
            span.onclick = (evt) => {
                evt.stopPropagation();
                if (f.mime.startsWith("video")) {
                    Model.eventHub.publish("__play_video__", { path: f.path, file_explorer_id: this._file_explorer_.id }, true)
                } else if (f.isDir) {
                    _publishSetDirEvent(f._path, this._file_explorer_)
                } else if (f.mime.startsWith("image")) {
                    Model.eventHub.publish("__show_image__", { path: f.path, file_explorer_id: this._file_explorer_.id }, true)
                }
                this.menu.close()
            }

            row.onmouseenter = (evt) => {
                evt.stopPropagation();
                if (!this.menu.isOpen()) {

                    this.menu.showBtn()
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
                        this.rename(this.menu.parentNode, f, row.offsetTop + row.offsetHeight + 6)
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
                        _publishSetDirEvent(f._path, this._file_explorer_)
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

        if (dir.name.startsWith(".") || !(dir.path.startsWith("/public") || public_[dir.path] != undefined || dir.path.startsWith("/shared") || shared[dir.path] != undefined || dir.path.startsWith("/applications/" + Application.application) || dir.path.startsWith("/users/" + Application.account.id))) {
            return;
        }

        this.div.innerHTML = "";
        let h = this.imageHeight; // the heigth of the image/icon div
        let w = this.imageHeight;
        let hiddens = {};

        let html = `
        <style>
            #container {
                background-color: var(--palette-background-default);
                display: flex;
                flex-direction: column;
                padding: 8px;
                min-height: 400px;
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
               word-wrap: break-word;
               text-align: center;
               max-height: 200px;
               overflow-y: hidden;

            }

            .file-path-name {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .file-icon-div.active{
                filter: invert(10%);
            }

            globular-dropdown-menu {
                position: absolute;
                top: -1px;
                right: 0px;
                z-index: 100;
            }

            iron-icon {
                height: 48px;
                width: 48px;
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

        this.div.querySelector(`#container`).ondrop = (evt) => {
            evt.preventDefault()
            this.ondrop(evt)
        }

        this.div.querySelector(`#container`).ondragover = (evt) => {
            evt.preventDefault()
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
            } else if (f.name.startsWith(".hidden")) {
                // The hidden dir.
                if (f.files != undefined) {
                    f.files.forEach(file_ => {
                        let path = file_.path.replace("/.hidden/", "/")
                        hiddens[path] = file_
                    })
                }
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
                let id = "_" + uuidv4().split("-").join("_").split("@").join("_");

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
                }, true, this)

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

                    let fileIconDivs = this.div.querySelectorAll(".file-icon-div")
                    for (var i = 0; i < fileIconDivs.length; i++) {
                        fileIconDivs[i].classList.remove("active")
                    }
                }

                // The parent path
                let parentPath = ""
                if (file.isDir) {
                    parentPath = file.path.substring(0, file.path.lastIndexOf("/"))
                } else {
                    parentPath = file.path.substring(0, file.path.lastIndexOf("."))
                }

                if (file.isDir) {

                    // Here I will create a folder mosaic from the folder content...
                    let folderIcon = document.createRange().createContextualFragment(`<iron-icon icon="icons:folder"></iron-icon>`)
                    fileIconDiv.insertBefore(folderIcon, fileIconDiv.firstChild)


                    fileIconDiv.onclick = (evt) => {
                        evt.stopPropagation();
                        _publishSetDirEvent(file._path, this._file_explorer_)
                    }

                    folderIcon.draggable = false

                } else if (fileType == "video" && hiddens[parentPath] != undefined) {
                    /** In that case I will display the vieo preview. */
                    let file_ = hiddens[parentPath];

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

                            // keep the explorer link...
                            preview._file_explorer_ = this._file_explorer_
                            preview.name = file.name;
                            preview.onpreview = () => {
                                let previews = this.div.querySelectorAll("globular-video-preview")
                                previews.forEach(p => {
                                    // stop all other preview...
                                    if (preview.name != p.name) {
                                        p.stopPreview()
                                    }
                                })
                            }

                            fileIconDiv.insertBefore(preview, fileIconDiv.firstChild)

                            preview.draggable = false

                            fileIconDiv.ondrop = (evt) => {
                                evt.stopPropagation();
                                evt.preventDefault()
                                let url = evt.dataTransfer.getData("Url");
                                if (url.startsWith("https://www.imdb.com/title")) {

                                    let matchs = url.match(/tt\d{5,8}/);
                                    if (matchs.length == 0) {
                                        return // nothing to todo...
                                    }

                                    // That function will be use to asscociate file with imdb information.
                                    let getImdbInfo = (id, callback, errorcallback) => {
                                        let query = window.location.protocol + "//" + window.location.hostname + ":"
                                        if (Application.globular.config.Protocol == "https") {
                                            query += Application.globular.config.PortHttps
                                        } else {
                                            query += Application.globular.config.PortHttp
                                        }

                                        query += "/imdb_title?id=" + id

                                        var xmlhttp = new XMLHttpRequest();

                                        xmlhttp.onreadystatechange = function () {
                                            if (this.readyState == 4 && (this.status == 201 || this.status == 200)) {
                                                var obj = JSON.parse(this.responseText);
                                                callback(obj);
                                            } else if (this.readyState == 4) {
                                                errorcallback("fail to get info from query " + query + " status " + this.status)
                                            }
                                        };
                                        /* TODO see if we protected it...
                                          query += "?domain=" + Model.domain // application is not know at this time...
                                          if (localStorage.getItem("user_token") != undefined) {
                                              query += "&token=" + localStorage.getItem("user_token")
                                          }
                                        */
                                        xmlhttp.open("GET", query, true);
                                        xmlhttp.setRequestHeader("domain", Model.domain);

                                        xmlhttp.send();
                                    }

                                    getImdbInfo(matchs[0], (info) => {
                                        // So here I will get the information from imdb and propose to assciate it with the file.
                                        let toast = ApplicationView.displayMessage(`
                                        <style>
                                            ${theme}
                                        </style>
                                        <div id="select-media-dialog">
                                            <div>Your about to associate <span id="title-type"></span> <a id="title-name" target="_blank"></a></div>
                                            <div>with file <span style="font-style: italic;" id="file-path"></span></div>
                                            <div style="display: flex; flex-direction: column; justify-content: center;">
                                                <img style="width: 185.31px; align-self: center; padding-top: 10px; padding-bottom: 15px;" id="title-poster"> </img>
                                            </div>
                                            <div>Is that what you want to do? </div>
                                            <div style="display: flex; justify-content: flex-end;">
                                                <paper-button id="imdb-lnk-ok-button">Ok</paper-button>
                                                <paper-button id="imdb-lnk-cancel-button">Cancel</paper-button>
                                            </div>
                                        </div>
                                        `, 60 * 1000)


                                        let cancelBtn = toast.el.querySelector("#imdb-lnk-cancel-button")
                                        cancelBtn.onclick = () => {
                                            toast.dismiss();
                                        }

                                        toast.el.querySelector("#title-type").innerHTML = info.Type
                                        toast.el.querySelector("#title-name").innerHTML = info.Name
                                        toast.el.querySelector("#title-name").href = info.URL
                                        toast.el.querySelector("#title-poster").src = info.Poster.ContentURL
                                        toast.el.querySelector("#file-path").innerHTML = file.name

                                        let okBtn = toast.el.querySelector("#imdb-lnk-ok-button")
                                        okBtn.onclick = () => {
                                            this.setFileInfo(info, file)
                                            toast.dismiss();
                                        }


                                    }, err => ApplicationView.displayMessage(err, 3000))
                                }
                            }
                        }

                        break;
                    }
                } else if (file.thumbnail != undefined) {
                    /** Display the thumbnail. */
                    let img = document.createElement("img")
                    img.src = file.thumbnail
                    img.draggable = false

                    fileIconDiv.insertBefore(img, fileIconDiv.firstChild)
                    if (img.width > 0 && img.height > 0) {
                        w = (img.width / img.height) * h
                    }
                    if (fileType == "image") {
                        img.onclick = (evt) => {
                            evt.stopPropagation();
                            Model.eventHub.publish("__show_image__", { path: file.path, file_explorer_id: this._file_explorer_.id }, true)
                        }
                    } else if (fileType == "audio") {

                        img.onclick = (evt) => {
                            evt.stopPropagation();
                            Model.eventHub.publish("__play_audio__", { path: file.path, file_explorer_id: this._file_explorer_.id }, true)
                        }

                    } else {
                        // here I will try the file viewer.
                        img.onclick = (evt) => {
                            evt.stopPropagation();
                            Model.eventHub.publish("__read_file__", { path: file.path, file_explorer_id: this._file_explorer_.id }, true)
                        }
                    }
                }

                fileIconDiv.draggable = true

                fileIconDiv.ondragstart = (evt) => {
                    evt.dataTransfer.setData('file', file.path);
                    evt.dataTransfer.setData('id', fileIconDiv.id)
                    evt.stopPropagation();
                    fileIconDiv.style.opacity = '0.4';
                }

                fileIconDiv.ondragend = (evt) => {
                    evt.stopPropagation();
                    fileIconDiv.style.opacity = '1';
                }

                if (file.isDir) {
                    fileIconDiv.ondragover = (evt) => {
                        evt.preventDefault()
                        fileIconDiv.children[0].icon = "icons:folder-open"
                    }

                    fileIconDiv.ondragleave = () => {
                        fileIconDiv.children[0].icon = "icons:folder"
                    }

                    fileIconDiv.ondrop = (evt) => {

                        evt.preventDefault()

                        if (evt.dataTransfer.files.length > 0) {
                            // So here I will simply upload the files...
                            Model.eventHub.publish("__upload_files_event__", { path: file.path, files: evt.dataTransfer.files }, true)
                        } else {
                            let f = evt.dataTransfer.getData('file')
                            let id = evt.dataTransfer.getData('id')
                            fileIconDiv.children[0].icon = "icons:folder"

                            // Create drop_file_event...
                            Model.eventHub.publish("drop_file_event", { file: f, dir: file.path, id: id }, true)
                        }
                    }
                }

                fileNameSpan.innerHTML = file.name;
                fileNameSpan.style.maxWidth = w + "px";
                fileIconDiv.parentNode.appendChild(fileNameSpan);

                fileIconDiv.onmouseenter = (evt) => {
                    evt.stopPropagation();
                    let checkboxs = this.div.querySelectorAll("paper-checkbox")
                    for (var i = 0; i < checkboxs.length; i++) {
                        if (!checkboxs[i].checked) {
                            checkboxs[i].style.display = "none"
                        }
                    }

                    let fileIconDivs = this.div.querySelectorAll(".file-icon-div")
                    for (var i = 0; i < fileIconDivs.length; i++) {
                        fileIconDivs[i].classList.remove("active")
                    }

                    fileIconDiv.classList.add("active")

                    // display the actual checkbox...
                    checkbox.style.display = "block"

                    if (!this.menu.isOpen()) {
                        this.menu.showBtn()
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
                            this.rename(this.menu.parentNode, file, fileIconDiv.offsetHeight + 6)
                        }
                    }
                }
            })
        }
    }

    /**
     * Set file info, this will made use of the search engine...
     */
    setFileInfo(info, file) {
        console.log("set file info: ", info, file)

        let rqst = new CreateTitleRequest
        let title = new Title

        // init person infos...
        let createPersons = (values) => {
            let persons = []
            values.forEach(v => {
                let p = new Person
                p.setId(v.ID)
                p.setUrl(v.URL)
                p.setFullname(v.FullName)
                persons.push(p)
            })

            return persons
        }

        // Create title object and set it values from json...
        title.setId(info.ID)
        title.setName(info.Name)
        title.setAkaList(info.AKA)
        title.setDescription(info.Description)
        title.setDuration(info.Duration)
        title.setGenresList(info.Genres)
        title.setNationalitiesList(info.Nationalities)
        title.setRating(parseFloat(info.Rating))
        title.setRatingcount(parseInt(info.RatingCount))
        title.setType(info.Type)
        title.setUrl(info.URL)
        title.setYear(info.Year)

        title.setDirectorsList(createPersons(info.Directors))
        title.setActorsList(createPersons(info.Actors))
        title.setWritersList(createPersons(info.Writers))

        let poster = new Poster
        poster.setId(info.Poster.ID)
        poster.setUrl(info.Poster.URL)
        poster.setContenturl(info.Poster.ContentURL)

        title.setPoster(poster)

        let indexPath = Model.globular.config.DataPath + "/search/titles"
        rqst.setIndexpath(indexPath)
        rqst.setTitle(title)

        // Now I will create the title info...
        Model.globular.titleService.createTitle(rqst, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
            .then(rsp => {
                console.log("title was created!")
                // Now I will asscociated the file and the title.
                let rqst_ = new AssociateFileWithTitleRequest
                rqst_.setFilepath(file.path)
                rqst_.setTitleid(title.getId())
                rqst_.setIndexpath(indexPath)

                Model.globular.titleService.associateFileWithTitle(rqst_, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
                    .then(rsp => {
                        console.log("file " + file.path + " and title " + title.getName() + " are asscociated")
                    }).catch(err => ApplicationView.displayMessage(err, 3000))

            }).catch(err => ApplicationView.displayMessage(err, 3000))
        console.log(title)
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

                .path-navigator-box-span{
                    display: inherit;
                    max-width: 200px;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                    overflow: hidden;
                }


            </style>

            <div id="path-navigator-box">
            </div>
            `

        this.div = this.shadowRoot.querySelector("#path-navigator-box")
    }

    init() {
        // The the path
        Model.eventHub.subscribe("__set_dir_event__",
            (uuid) => {
                /** Nothin here. */
            },
            (evt) => {
                if (this._file_explorer_.id == evt.file_explorer_id) {
                    this.setDir(evt.path)
                }
            }, true, this
        )
    }

    // Set the directory.
    setDir(dir) {

        if (this.path == dir._path || !(dir.path.startsWith("/public") || public_[dir.path] != undefined || dir.path.startsWith("/shared") || shared[dir.path] != undefined || dir.path.startsWith("/applications/" + Application.application) || dir.path.startsWith("/users/" + Application.account.id))) {
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
            let titleDiv = document.createElement("div")
            titleDiv.style.display = "flex"
            titleDiv.style.position = "relative"

            let title = document.createElement("span")
            title.className = "path-navigator-box-span"
            title.style.display = "inline"
            if (dir.length > 20) {
                title.title = dir
            }
            title.innerHTML = dir
            let path_ = path += "/" + dir
            titleDiv.appendChild(title)

            let directoriesDiv = null
            if (index < values.length - 1) {
                // Here I will also append a button to go to a given path.
                let btn = document.createElement("iron-icon")
                btn.style.position = "relative"
                btn.icon = "icons:chevron-right"
                titleDiv.appendChild(btn)

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
                    directoriesDiv.style.zIndex = "10000";
                    directoriesDiv.style.top = title.offsetHeight + "px"
                    directoriesDiv.style.right = "0px"
                    directoriesDiv.style.backgroundColor = "var(--palette-background-paper)"
                    directoriesDiv.style.color = "var(--palette-text-primary)"
                    this._file_explorer_.displayWaitMessage("load " + path_)
                    _readDir(path_, (dir) => {

                        this._file_explorer_.resume()

                        // Send read dir event.
                        for (let subDir of dir.files) {
                            let subDirDiv = document.createElement("div")

                            let subDirSpan = document.createElement("span")
                            subDirSpan.innerHTML = subDir.name;
                            subDirSpan.padding = "4px"
                            subDirDiv.appendChild(subDirSpan)

                            if (subDir.isDir) {
                                directoriesDiv.appendChild(subDirDiv)

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
                                    _publishSetDirEvent(subDir._path, this._file_explorer_)
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
                this._file_explorer_.displayWaitMessage("load " + path_)
                _readDir(path_, (dir) => {
                    this._file_explorer_.resume()
                    // Send read dir event.
                    _publishSetDirEvent(dir._path, this._file_explorer_)
                }, this.onerror)
            }

            this.div.appendChild(titleDiv)
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

        // The list of shared directory
        this.shared = {}

        // The list of public directory
        this.public_ = null

        // The root div.
        this.div = null

        // The control width
        this.width = 200

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${theme}

            #file-navigator-div{
                min-width: ${this.width}px; 
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
            <div id="user-files-div"></div>
            <div id="shared-files-div"></div>
            <div id="public-files-div"></div>
        </div>
        `

        // The get the root div.
        this.div = this.shadowRoot.querySelector("#file-navigator-div ");
        this.userDiv = this.shadowRoot.querySelector("#user-files-div");
        this.sharedDiv = this.shadowRoot.querySelector("#shared-files-div");
        this.publicDiv = this.shadowRoot.querySelector("#public-files-div");
    }

    // The connection callback.
    connectedCallback() {


    }

    hide() {
        this.div.style.display = "none"
    }

    show() {
        this.div.style.display = ""
    }

    // remove div and reload it from it content...
    reload(dir) {
        if (this.dirs[dir.path] != undefined) {
            let div = this.div.querySelector(`#${this.dirs[dir.path].id}`)
            if (div != null) {
                let parent = div.parentNode
                let level = this.dirs[dir.path].level
                if (div != null) {
                    parent.removeChild(div)
                    delete this.dirs[dir.path]
                }
                // reload the div...
                this.initTreeView(dir, parent, level)
            }
        }
    }


    // Init the tree view.
    initTreeView(dir, div, level) {

        // I will not display hidden directory...
        if (dir.name.startsWith(".")) {
            return;
        }

        // old id value was dir.path.split("/").join("_").split("@").join("_")
        let id = "_" + getUuid(dir.path).split("-").join("_")

        // keep it in memory 
        this.dirs[dir.path] = { id: id, level: level }

        // Remove existing values and renit the tree view...
        let dir_ = this.div.querySelector(`#${id}`)
        if (dir_ == undefined) {
            let name = dir.path.split("/").pop();
            let offset = 10 * level
            let html = `
                <style>
                    #${id}:hover{
                        cursor: pointer;
                    }
                    #folder-name-span{
                        max-width: 200px;
                        margin-left: 5px;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;

                    }
                </style>

                <div id="${id}" style="padding-left: ${offset}px;">
                    <div style="display: flex; padding-top: 5px; padding-bottom: 5px; align-items: center;  position: relative;">
                        <iron-icon id="${id}_expand_btn" icon="icons:chevron-right" style="--iron-icon-fill-color:var(--palette-action-disabled);"></iron-icon>
                        <iron-icon id="${id}_shrink_btn" icon="icons:expand-more" style="--iron-icon-fill-color:var(--palette-action-active); display: none;"></iron-icon>
                        <div id="${id}_directory_lnk" class="directory-lnk">
                            <iron-icon id="${id}_directory_icon" icon="icons:folder"></iron-icon>
                            <span class="folder-name-span" title="${name}" style="margin-left: 5px;"> ${name}</span>
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

        dirLnk.ondragover = (evt) => {
            evt.preventDefault()
            dirIco.icon = "icons:folder-open"
        }

        dirLnk.ondragleave = () => {
            dirIco.icon = "icons:folder"
        }

        dirLnk.ondrop = (evt) => {
            evt.stopPropagation();
            let f = evt.dataTransfer.getData('file')
            let id = evt.dataTransfer.getData('id')
            dirIco.icon = "icons:folder"

            Model.eventHub.publish("drop_file_event", { file: f, dir: dir.path, id: id }, true)
        }

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
            _publishSetDirEvent(dir._path, this._file_explorer_)
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
        if (this.dir == dir || !(dir.path.startsWith("/public") || public_[dir.path] != undefined || dir.path.startsWith("/shared") || shared[dir.path] != undefined || shared[dir.path] != undefined || dir.path.startsWith("/applications/" + Application.application) || dir.path.startsWith("/users/" + Application.account.id))) {
            return;
        }

        this.dir = dir;
        this.initTreeView(dir, this.userDiv, 0)

        // Init shared...
        this.initShared()

        // Init public list of directories
        this.initPublic()
    }

    // Init the public folder...
    initPublic() {
        console.log(Model.globular.config.Public)
        this.publicDiv.innerHTML = ""

        // The public directory will contain a list of directories readable by 
        // any use, permission can also be set on file and directories, but all is 
        // accessible by default.
        if (this.public_ == undefined) {
            this.public_ = new File("public", "/public", true)
            this.public_.isDir = true;
            this.public_.files = [];
            this.public_.mime = "";
            this.public_.modTime = new Date()
            Model.eventHub.subscribe("public_change_permission_event", uuid => { },
                evt => {
                    // refresh the shared...
                    this.initPublic()
                }, false, this)
        }

        let index = 0;
        let initPublicDir = (callback, errorCallback) => {
            if (Model.globular.config.Public != undefined) {
                if (index < Model.globular.config.Public.length) {
                    let path = Model.globular.config.Public[index]
                    // Read the dir content (files and directory informations.)
                    this._file_explorer_.displayWaitMessage("load " + path)
                    _readDir(path, dir => {
                        this._file_explorer_.resume()
                        // used by set dir...
                        markAsPublic(dir)
                        this.public_.files.push(dir)
                        index++
                        initPublicDir(callback, errorCallback)
                    }, errorCallback)

                } else {
                    callback()
                }
            } else {
                callback()
            }
        }

        // Init
        initPublicDir(() => {
            this.initTreeView(this.public_, this.publicDiv, 0)
        })

    }



    // Init shared folders
    initShared() {
        this.sharedDiv.innerHTML = ""
        this.shared = {}

        // keep track of all sub-dir...
        shared = {}

        // Init the share info
        let initShared = (share, callback) => {

            let userId = share.getPath().split("/")[2];
            if (userId == Application.account.id) {
                callback()
                return // I will not display it...
            }

            if (this.shared[userId] == undefined) {
                this.shared[userId] = new File(userId, "/shared/" + userId, true)
                this.shared[userId].isDir = true;
                this.shared[userId].files = [];
                this.shared[userId].mime = "";
                this.shared[userId].modTime = new Date()
                Model.eventHub.subscribe(userId + "_change_permission_event", uuid => { },
                    evt => {
                        // refresh the shared...
                        this.initShared()
                    }, false, this)
            }
            this._file_explorer_.displayWaitMessage("load " + share.getPath())
            _readDir(share.getPath(), dir => {
                this._file_explorer_.resume()
                // used by set dir...
                markAsShare(dir)

                // From the path I will get the user id who share the file and 
                // create a local directory if none exist...
                if (this.shared[userId].files.find(f => f.path == dir.path) == undefined) {
                    this.shared[userId].files.push(dir)
                    callback()
                }
            }, err => {
                // The file is not a directory so the file will simply put in the share.
                if (err.message.endsWith("is a directory")) {
                    this.getFileInfo(share.getPath(),
                        f => {
                            if (f.path.indexOf(".hidden") != -1) {
                                // In that case I need to append the file in a local dir named hidden.
                                let hiddenDir = null;
                                this.shared[userId].files.forEach(f => {
                                    if (f.name == ".hidden") {
                                        hiddenDir = f
                                    }
                                })
                                if (hiddenDir == null) {
                                    hiddenDir = new File(".hidden", "/shared/" + userId + "/.hidden", true)
                                    hiddenDir.isDir = true
                                    hiddenDir.modTime = new Date()
                                    hiddenDir.mime = ""
                                    hiddenDir.files = [f]
                                    this.shared[userId].files.push(hiddenDir)

                                } else {
                                    // append only if it dosent exist....
                                    if (this.shared[userId].files.find(f_ => f.path == f_.path) == undefined) {
                                        hiddenDir.files.push(f)
                                    }
                                }

                            } else {
                                if (this.shared[userId].files.find(f_ => f.path == f_.path) == undefined) {
                                    this.shared[userId].files.push(f)
                                    callback()
                                }
                            }
                        }, e => console.log(e))
                }
            })
        }

        if (Application.account == undefined) {
            return // nothing to do here...
        }
        // The account...
        let rqst = new GetSharedResourceRqst
        rqst.setSubject(Application.account.id)
        rqst.setType(SubjectType.ACCOUNT)

        // Get file shared by account.
        Model.globular.rbacService.getSharedResource(rqst, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
            .then(rsp => {
                // rsp.getSharedresourceList().forEach(s => initShared(s))
                // Here I need to sync the funtion and init the tree view once all is done...

                let callback = () => {
                    let s = rsp.getSharedresourceList().pop()
                    if (s != undefined) {
                        initShared(s, callback)
                    } else {
                        for (const id in this.shared) {
                            let shared = this.shared[id]
                            this.initTreeView(shared, this.sharedDiv, 0)
                            delete dirs[getUuidByString(shared.path)]
                            Model.eventHub.publish("reload_dir_event", shared.path, false);
                        }
                    }
                }

                callback(); // call once
            })
            .catch(e => ApplicationView.displayMessage(e, 3000))
    }

    // Get the file info and hidden file if the file has hidden 
    getFileInfo(path, callback, errorCallback) {
        let rqst = new GetFileInfoRequest()
        rqst.setPath(path)
        Model.globular.fileService.getFileInfo(rqst, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
            .then(rsp => {
                let f = File.fromString(rsp.getData());
                if (f.mime.startsWith("video") || f.mime.startsWith("audio") || f.mime.startsWith("image")) {
                    // So here I will get the hidden file for the video previews.
                    let path = f.path.replace(f.name, "")
                    let hiddenDirPath = path + ".hidden/" + f.name.substring(0, f.name.lastIndexOf("."))
                    // Get the hidden video directory...
                    _readDir(hiddenDirPath, dir => {
                        callback(dir);
                        callback(f);
                    }, e => {
                        callback(f);
                    })

                } else {
                    callback(f);
                }



            })
            .catch(e => errorCallback(e))
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

        // The file expoler id...
        this.id = "_" + randomUUID()
        this.setAttribute("id", this.id)

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
        this.isOpen = false;

        // This function is call when the explorer is open.
        this.onopen = undefined;

        // Event listener...
        this.listeners = {}

        // Interface elements...
        // The main explorer button
        this.fileExplorerBox = undefined
        this.fileExplorerOpenBtn = undefined
        this.fileExplererCloseBtn = undefined

        // The file view.
        this.filesListView = undefined
        this.filesIconView = undefined

        // The permissions manager
        this.permissionManager = undefined

        // The information manager
        this.informationManager = undefined

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

        // The paper tray
        this.paperTray = undefined;

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
                min-width: 735px;
                position: relative;
                height: 100%;
            }

            paper-card{
                font-size: 1.0rem;
            }

            .card-actions{
                display: flex;
                background-color: var(--palette-background-paper);
            }

            #file-explorer-layout{
                display: flex; 
                flex-grow: 1;
                overflow: hidden;
                min-height: 55vh;
            }

            @media only screen and (max-width: 800px) {
                #file-explorer-layout {
                    flex-direction: column;
                }
                #file-explorer-content{
                    min-width: 0px;
                    position: relative;
                }

                #file-selection-panel{
                    min-height: 500px;
                    margin-left: 0px;
                    margin-top: 15px;
                }
            }
  
            @media only screen and (max-width: 1024px) {

            }
    
            #globular-audio-player{
                display: none;
            }

            #globular-video-player{
                display: none;
            }

            #globular-image-viewer{
                display: none;
            }

            /** How the permission manager is display in the explorer **/
            globular-permissions-manager, globular-informations-manager{
                background-color: var(--palette-background-default);
                position: absolute;
                top: 0px;
                left: 0px;
                right: 0px;
                bottom: 0px;
                z-index: 100;
                overflow: auto;
            }

            #enter-full-screen-btn:hover{
                cursor: pointer;
            }

            #exit-full-screen-btn:hover{
                cursor: pointer;
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
                        <slot></slot>
                    </div>
                </div>
            </div>
            <div class="card-actions">
                <div id="progress-div" style="display: none; flex-grow: 1; margin-right: 20px;">
                    <div style="diplay:flex; flex-direction: column;">
                        <span id="progress-message">wait...</span>
                        <paper-progress id="globular-dir-loading-progress-bar" indeterminate style=""></paper-progress>
                    </div>
                </div>
                <paper-icon-button id="files-icon-btn" class="active" icon="icons:view-module" style="--iron-icon-fill-color: var(--palette-action-active);"></paper-icon-button>
                <paper-icon-button id="files-list-btn" icon="icons:view-list" style="--iron-icon-fill-color: var(--palette-action-disabled);"></paper-icon-button>
                <globular-files-uploader></globular-files-uploader>
                <paper-icon-button icon="icons:fullscreen" id="enter-full-screen-btn"></paper-icon-button>
                <paper-icon-button icon="icons:fullscreen-exit" id="exit-full-screen-btn" style="display: none;"></paper-icon-button>
                <paper-icon-button icon="icons:close" id="file-explorer-box-close-btn"></paper-icon-button>
            </div>
        </paper-card>
        </div>
        `

        // Give information about loading data...
        this.progressDiv = this.shadowRoot.querySelector("#progress-div")

        // enter full screen and exit full screen btn
        this.enterFullScreenBtn = this.shadowRoot.querySelector("#enter-full-screen-btn")
        this.exitFullScreenBtn = this.shadowRoot.querySelector("#exit-full-screen-btn")

        // The main explorer button
        this.fileExplorerBox = this.shadowRoot.querySelector("#file-explorer-box")
        this.fileExplererCloseBtn = this.shadowRoot.querySelector("#file-explorer-box-close-btn")

        // The file view.
        //this.shadowRoot.querySelector("#globular-files-list-view")
        this.filesListView = new FilesListView()
        this.filesListView.id = "globular-files-list-view"
        this.filesListView.style.display = "none"
        this.appendChild(this.filesListView)

        // this.shadowRoot.querySelector("#globular-files-icon-view")
        this.filesIconView = new FilesIconView()
        this.filesIconView.id = "globular-files-icon-view"
        this.filesIconView.style.display = "none"
        this.appendChild(this.filesIconView)

        // Keep reference to the file explorer...
        this.filesListView._file_explorer_ = this.filesIconView._file_explorer_ = this

        // The permission manager
        this.permissionManager = new PermissionsManager()

        // The information manager
        this.informationManager = new InformationsManager()

        // The video player
        // this.shadowRoot.querySelector("#globular-video-player")
        this.videoPlayer = new VideoPlayer()
        this.videoPlayer.id = "#globular-video-player"
        this.videoPlayer.style.display = "none"
        this.appendChild(this.videoPlayer)


        // The file uploader
        this.filesUploader = this.shadowRoot.querySelector("globular-files-uploader")


        // The file reader
        // this.fileReader = this.shadowRoot.querySelector("#globular-file-reader")
        this.fileReader = new GlobularFileReader()
        this.fileReader.id = "#globular-file-reader"
        this.fileReader.style.display = "none"
        this.appendChild(this.fileReader)

        // The audio player 
        // this.audioPlayer = this.shadowRoot.querySelector("#globular-audio-player")
        this.audioPlayer = new AudioPlayer()
        this.audioPlayer.id = "#globular-audio-player"
        this.audioPlayer.style.display = "none"
        this.appendChild(this.audioPlayer)

        // The image viewer
        // this.imageViewer = this.shadowRoot.querySelector("#globular-image-viewer")
        this.imageViewer = new ImageViewer()
        this.imageViewer.id = "#globular-image-viewer"
        this.imageViewer.style.display = "none"
        this.appendChild(this.imageViewer)

        // The path navigator
        this.pathNavigator = this.shadowRoot.querySelector("#globular-path-navigator")
        this.pathNavigator._file_explorer_ = this

        // The file navigator.
        this.fileNavigator = this.shadowRoot.querySelector("#globular-file-navigator")
        this.fileNavigator._file_explorer_ = this

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
        this.exitFullScreenBtn.onclick = () => {
            this.enterFullScreenBtn.style.display = "block"
            this.exitFullScreenBtn.style.display = "none"
            this.style.top = ""
            this.style.bottom = ""
            this.style.right = ""

            this.fileExplorerBox.style.position = "";
            this.fileExplorerBox.style.top = "";
            this.fileExplorerBox.style.bottom = "";
            this.fileExplorerBox.style.right = "";
            this.fileExplorerBox.style.left = "";
        }

        this.enterFullScreenBtn.onclick = () => {
            this.style.top = "60px"
            this.style.bottom = "0px"
            this.style.right = "0px"

            this.fileExplorerBox.style.position = "absolute";
            this.fileExplorerBox.style.top = "0px";
            this.fileExplorerBox.style.bottom = "0px";
            this.fileExplorerBox.style.right = "0px";
            this.fileExplorerBox.style.left = "0px";

            // set buttons.
            this.enterFullScreenBtn.style.display = "none"
            this.exitFullScreenBtn.style.display = "block"
        }


        // Here I will connect the windows resize event...
        this.backNavigationBtn.onclick = (evt) => {
            evt.stopPropagation();
            let index = this.navigations.indexOf(this.path)
            index--
            if (index < this.navigations.length && index > -1) {
                _publishSetDirEvent(this.navigations[index], this)
            }
        }

        this.fowardNavigationBtn.onclick = (evt) => {
            evt.stopPropagation();
            let index = this.navigations.indexOf(this.path)
            index++
            if (index < this.navigations.length && index > -1) {
                _publishSetDirEvent(this.navigations[index], this)
            }
        }

        this.upwardNavigationBtn.onclick = (evt) => {
            evt.stopPropagation();
            if (this.path.split("/").length > 2) {
                this.path = this.path.substring(0, this.path.lastIndexOf("/"))

                _publishSetDirEvent(this.path, this)
            }
        }


        this.filesListBtn.onclick = (evt) => {
            evt.stopPropagation();
            this.imageViewer.style.display = "none"
            this.filesListView.style.display = ""
            this.filesIconView.style.display = "none"
            this.videoPlayer.stop();
            this.videoPlayer.style.display = "none"
            this.audioPlayer.stop();
            this.audioPlayer.style.display = "none"
            this.fileReader.style.display = "none"
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
            this.audioPlayer.stop();
            this.audioPlayer.style.display = "none"
            this.fileReader.style.display = "none"
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
                        z-index: 100;
                    }

                    .new-dir-dialog-actions{
                        font-size: .85rem;
                        align-items: center;
                        justify-content: flex-end;
                        display: flex;
                        background-color: var(--palette-background-paper);
                        color: var(--palette-text-primary);
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
                        delete dirs[getUuidByString(this.path)]
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
            // set the root...
            this.setRoot(this.root)
            this.displayWaitMessage("load " + this.root)

            // force reload the current dir with the content from the server.
            delete dirs[getUuidByString(this.path)]

            _readDir(this.root, (dir) => {
                this.resume()
                _publishSetDirEvent(this.path, this)

                // Clear selection.
                this.filesListView.clearSelection()
                this.filesIconView.clearSelection()

                // set back the view mode.
                this.displayView()
            }, this.onerror)
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
                this.filesUploader.uploadFiles(this.path, fileInput.files)
            }
        }
    }

    displayWaitMessage(message) {
        this.progressDiv.style.display = "block"
        let messageDiv = this.progressDiv.querySelector("#progress-message")
        Model.eventHub.publish("refresh_dir_evt", this.path, false);
        messageDiv.innerHTML = message
        let progressBar = this.progressDiv.querySelector("paper-progress")
        if (messageDiv.offsetWidth > 0) {
            progressBar.style.width = messageDiv.offsetWidth + "px"
        }
    }

    resume() {
        this.progressDiv.style.display = "none"
    }

    hideNavigator() {
        this.fileNavigator.hide()
        window.dispatchEvent(new Event('resize'));
    }

    showNavigator() {
        this.fileNavigator.show()
        window.dispatchEvent(new Event('resize'));
    }

    // Set the file explorer directory.
    init() {
        // Init the path navigator
        this.pathNavigator.init();

        // Init the files views
        this.filesListView.init();
        this.filesIconView.init();

        // Init file upload event listener...
        this.filesUploader.init();

        if (this.listeners["__set_dir_event__"] == undefined) {

            Model.eventHub.subscribe("__set_dir_event__",
                (uuid) => {
                    this.listeners["__set_dir_event__"] = uuid;
                },
                (evt) => {
                    // keep the active path.
                    if (this.id == evt.file_explorer_id) {
                        this.setDir(evt.path)
                    }
                }, true
            )
        }

        // File rename event.
        if (this.listeners["file_rename_event"] == undefined) {
            Model.eventHub.subscribe("file_rename_event",
                (uuid) => {
                    this.listeners["file_rename_event"] = uuid;
                }, (path) => {
                    if (path.startsWith(this.getRoot())) {
                        _publishSetDirEvent(this.path, this)
                    }
                }, false, this)
        }

        // Permissions 
        if (this.listeners["display_permission_manager_event"] == undefined) {
            Model.eventHub.subscribe("display_permission_manager_event",
                (uuid) => {
                    this.listeners["display_permission_manager_event"] = uuid;
                }, (path) => {

                    this.permissionManager.setPath(path)

                    // I will display the permission manager.
                    this.fileSelectionPanel.appendChild(this.permissionManager)

                }, false)
        }

        // Informations
        if (this.listeners["display_file_infos_event"] == undefined) {
            Model.eventHub.subscribe("display_file_infos_event",
                (uuid) => {
                    this.listeners["display_file_infos_event"] = uuid;
                }, (file) => {

                    this.informationManager.setTitlesInformation(file.titles)

                    // I will display the permission manager.
                    this.fileSelectionPanel.appendChild(this.informationManager)

                }, false)
        }

        // Reload the content of a dir with the actual dir content description on the server.
        // must be call after file are deleted or renamed
        if (this.listeners["reload_dir_event"] == undefined) {
            Model.eventHub.subscribe("reload_dir_event",
                (uuid) => {
                    this.listeners["reload_dir_event"] = uuid
                }, (path) => {
                    // remove existing...
                    delete dirs[getUuidByString(path)]
                    this.displayWaitMessage("load " + path)

                    _readDir(path, (dir) => {
                        this.resume()
                        if (dir.path == this.path) {
                            Model.eventHub.publish("__set_dir_event__", { path: dir, file_explorer_id: this.id }, true)
                        }
                        this.fileNavigator.reload(dir)
                    }, () => { }, true)
                }, false)
        }

        // Refresh the interface.
        if (this.listeners["upload_files_event"] == undefined) {
            Model.eventHub.subscribe("upload_files_event", (uuid) => {
                this.listeners["upload_files_event"] = uuid
            },
                evt => {
                    if (evt == this.path) {
                        // refresh the interface.
                        delete dirs[getUuidByString(this.path)]
                        this.refreshBtn.click();
                    }
                }, false)
        }


        // Play the video...
        if (this.listeners["__play_video__"] == undefined) {
            Model.eventHub.subscribe("__play_video__", (uuid) => {
                this.listeners["__play_video__"] = uuid
            }, (evt) => {
                if (this.id == evt.file_explorer_id) {
                    this.playVideo(evt.path)
                }
            }, true)
        }

        // Play audio
        if (this.listeners["__play_audio__"] == undefined) {
            Model.eventHub.subscribe("__play_audio__", (uuid) => {
                this.listeners["__play_audio__"] = uuid
            }, (evt) => {
                if (this.id == evt.file_explorer_id) {
                    this.playAudio(evt.path)
                }

            }, true)
        }

        // Read file
        if (this.listeners["__read_file__"] == undefined) {
            Model.eventHub.subscribe("__read_file__", (uuid) => {
                this.listeners["__read_file__"] = uuid
            }, (evt) => {
                if (this.id == evt.file_explorer_id) {
                    this.readFile(evt.path)
                }
            }, true, this)
        }

        // Show image...
        if (this.listeners["__show_image__"] == undefined) {
            Model.eventHub.subscribe("__show_image__", (uuid) => {
                this.listeners["__show_image__"] = uuid
            }, (evt) => {
                if (this.id == evt.file_explorer_id) {
                    this.showImage(evt.path)
                }

            }, true)
        }

        this.displayWaitMessage("load " + this.root)
        _readDir(this.root, (dir) => {
            // set interface with the given directory.
            this.resume()

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
        // set the root...
        this.setRoot(this.root)

        let messageDiv = this.progressDiv.querySelector("#progress-message")
        let progressBar = this.progressDiv.querySelector("paper-progress")
        if (messageDiv.offsetWidth > 0) {
            progressBar.style.width = messageDiv.offsetWidth + "px"
        }
    }

    setRoot(root) {
        this.root = root
    }


    getRoot() {
        let values = this.root.split("/")
        return "/" + values[1] + "/" + values[2]
    }

    playVideo(path) {

        // hide the content.
        this.filesListView.style.display = "none"
        this.filesIconView.style.display = "none"
        this.videoPlayer.style.display = "block"

        // Display the video only if the path match the video player /applications vs /users
        this.videoPlayer.play(path)
    }

    playAudio(path) {

        // hide the content.
        this.filesListView.style.display = "none"
        this.filesIconView.style.display = "none"

        this.audioPlayer.style.display = "block"

        // Display the video only if the path match the video player /applications vs /users
        this.audioPlayer.play(path)
    }

    readFile(path) {

        // hide the content.
        this.filesListView.style.display = "none"
        this.filesIconView.style.display = "none"
        this.fileReader.style.display = "block"

        // Display the video only if the path match the video player /applications vs /users
        this.fileReader.read(path)
    }

    showImage(path) {

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
    }

    displayView(dir) {
        this.filesListView.__dir__ = dir
        this.filesIconView.__dir__ = dir

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
                    img.draggable = false;
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


        if (!(dir.path.startsWith("/public") || public_[dir.path] != undefined || dir.path.startsWith("/shared") || shared[dir.path] != undefined || dir.path.startsWith("/applications/" + Application.application) || dir.path.startsWith("/users/" + Application.account.id))) {
            return
        }

        // Set back the list and icon view
        this.displayView(dir)

        // stop and hide the video player.
        this.videoPlayer.style.display = "none"
        this.videoPlayer.stop();

        this.audioPlayer.style.display = "none"
        this.audioPlayer.stop();

        this.fileReader.style.display = "none"

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
                if (path.indexOf(".hidden") == -1) {
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
                        _publishSetDirEvent(this.navigations[index], this)
                    }
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
        return document.querySelector("globular-workspace")
    }

    open() {

        this.fileExplorerBox.style.display = "flex"

        if (this.onopen != undefined) {
            this.onopen();
        }

        let workspace = this.getWorkspace()
        if (workspace != undefined) {
            workspace.appendChild(this)
            this.isOpen = true;
        }
    }

    close() {
        this.fileExplorerBox.style.display = "none"

        if (this.onclose != undefined) {
            this.onclose();

        }
        if (this.parentNode != null) {
            this.parentNode.removeChild(this)
        }
        this.isOpen = false

    }

    maximize() {
        this.fileExplorerOpenBtn.click();
    }

    hideActions() {
        this.shadowRoot.querySelector(".card-actions").style.display = "none";
    }

    delete() {
        for (let evt in this.listeners) {
            Model.eventHub.unSubscribe(evt, this.listeners[evt])
        }
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
            let icon = this.getIconDiv().querySelector("iron-icon")
            icon.style.removeProperty("--iron-icon-fill-color")
            if (this.fileExplorer.parentNode == undefined) {
                this.fileExplorer.open();
                this.fileExplorer.style.display = "block"
                return
            }

            if (this.fileExplorer.style.display == "none") {
                this.fileExplorer.style.display = "block"
            } else if (this.fileExplorer.style.display == "block") {
                this.fileExplorer.style.display = "none"
            }

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
        this.previews = previews;
        this.onpreview = null;
        this.onplay = null;
        this.__show_play_btn__ = false;

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
                background-color: #00b3ff;
                width: 28px;
                height: 28px;
                padding: 2px;
                border-radius: 16px;
                border: 1px px solid darkgrey;
                --iron-icon-fill-color: white;
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
       <div id = "container" draggable="false" >
            <iron-icon id="play-btn" icon="av:play-arrow"></iron-icon>
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
                this.firstImage = images[0]
                if (this.images.length > 0) {
                    this.container.appendChild(this.images[0])
                    this.width = this.images[0].width
                    this.height = this.images[0].height
                    if (this.onresize != undefined) {
                        this.onresize()
                    }

                }
            }, this.images, [previews[0]], index) // Download the first image only...
        }

        // Play the video
        this.playBtn.onclick = this.container.onclick = (evt) => {
            evt.stopPropagation()
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
            if (this.images.length == 1) {
                getImage((images) => {
                    this.images = images
                    if (this.images.length > 0) {
                        this.container.appendChild(this.images[0])
                        this.width = this.images[0].width
                        this.height = this.images[0].height

                        this.playBtn.style.display = "block";
                        if (this.interval == null && !is_over_play_btn) {
                            this.startPreview();
                        }

                        if (this.onresize != undefined) {
                            this.onresize()
                        }

                    }
                }, this.images, previews, index) // Download the first image only...
            } else if (this.images.length > 1) {
                this.playBtn.style.display = "block";
                if (this.interval == null && !is_over_play_btn) {
                    this.startPreview();
                }
            }


        }

        this.container.onmouseout = (evt) => {
            evt.stopPropagation();
            if(!this.__show_play_btn__){
                this.playBtn.style.display = "none";
            }
            if (this.interval != null && !is_over_play_btn) {
                this.stopPreview();
            }
        }

    }

    showPlayBtn() {
        this.__show_play_btn__ = true
        this.playBtn.style.display = "block";
    }

    /**
     * Start display the image 
     */
    startPreview() {
        let index = 0;
        if (this.onpreview != null) {
            this.onpreview()
        }

        this.interval = setInterval(() => {

            let img = this.images[index]
            if (img != undefined) {
                img.draggable = false;
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
        if (this.images.length == 0) {
            return
        }

        clearInterval(this.interval)
        this.interval = null
        this.playBtn.style.display = "none";
        while (this.container.children.length > 2) {
            this.container.removeChild(this.container.children[this.container.children.length - 1])
        }

        this.container.appendChild(this.firstImage)
    }

    /**
     * Play video
     */
    play() {
        if(this._file_explorer_!=undefined){
            Model.eventHub.publish("__play_video__", { path: this.path, file_explorer_id: this._file_explorer_.id }, true)
        }

        if (this.onplay != undefined) {
            this.onplay(this.path)
        }
    }

}

customElements.define('globular-video-preview', VideoPreview)

/**
 * That object is use to help make applications more responding when files are uploading...
 */
export class FilesUploader extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${theme}
            #container{
                position: relative;
            }

            iron-collapse {
                display: none;
                position: absolute;
                bottom: 40px;
                right: -80px;
            }

            paper-icon-button .active{

            }

            paper-icon-button {

            }

            .card-content{
                overflow-y: auto;
            }

            td {
                text-align: center;
                vertical-align: middle;
                white-space: nowrap;
            }


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

        </style>
        <div id="container">
            <iron-collapse id="collapse-panel">
                <paper-card class="content">
                    <paper-tabs selected="0" style="background: var(--palette-background-default);">
                        <paper-tab id="file-upload-tab">Files</paper-tab>
                        <paper-tab id="links-download-tab">Links</paper-tab>
                        <paper-tab id="torrents-dowload-tab">Torrents</paper-tab>
                    </paper-tabs>
                    <div class="card-content" style="padding: 0px;">
                        <table id="files-upload-table">
                            <thead class="files-list-view-header">
                                <tr>
                                    <th></th>
                                    <th class="name_header_div files-list-view-header">Name</th>
                                    <th class="mime_header_div files-list-view-header" style="min-width: 110px;">Destination</th>
                                    <th class="size_header_div files-list-view-header" style="min-width: 80px;">Size</th>
                                </tr>
                            </thead>
                            <tbody id="file-upload-tbody" class="files-list-view-info">
                            </tbody>
                        </table>
                        <table id="links-download-table" style="display: none;">
                            <thead class="files-list-view-header">
                                <tr>
                                    <th></th>
                                    <th class="name_header_div files-list-view-header">Detail</th>
                                    <th class="mime_header_div files-list-view-header" style="min-width: 110px;">Destination</th>
                                </tr>
                            </thead>
                            <tbody id="links-download-tbody" class="files-list-view-info">
                            </tbody>
                        </table>
                        <table id="torrents-download-table" style="display: none;">
                            <thead class="files-list-view-header">
                                <tr>
                                    <th></th>
                                    <th class="name_header_div files-list-view-header">Detail</th>
                                    <th class="mime_header_div files-list-view-header" style="min-width: 110px;">Destination</th>
                                </tr>
                            </thead>
                            <tbody id="torrent-download-tbody" class="files-list-view-info">
                            </tbody>
                        </table>
                    </div>
                </paper-card>
            </iron-collapse>
            <paper-icon-button icon="icons:file-upload"> </paper-icon-button>
        </div>
        `
        // The body where upload files info are displayed
        this.files_upload_table = this.shadowRoot.querySelector("#file-upload-tbody")

        // The body where torrents files will be displayed.
        this.torrent_download_table = this.shadowRoot.querySelector("#torrent-download-tbody")

        // The list of link where link's 
        this.links_download_table = this.shadowRoot.querySelector("#links-download-tbody")

        // The tabs...
        this.filesUploadTab = this.shadowRoot.querySelector("#file-upload-tab")
        this.torrentsDowloadTab = this.shadowRoot.querySelector("#torrents-dowload-tab")
        this.linksDownloadTab = this.shadowRoot.querySelector("#links-download-tab")

        // So here I will set the tab interractions.
        this.filesUploadTab.onclick = () => {
            let tables = this.shadowRoot.querySelectorAll("table")
            for (var i = 0; i < tables.length; i++) {
                tables[i].style.display = "none"
            }

            this.shadowRoot.querySelector("#files-upload-table").style.display = "block"
        }

        this.torrentsDowloadTab.onclick = () => {
            let tables = this.shadowRoot.querySelectorAll("table")
            for (var i = 0; i < tables.length; i++) {
                tables[i].style.display = "none"
            }

            this.shadowRoot.querySelector("#torrents-download-table").style.display = "block"
        }

        this.linksDownloadTab.onclick = () => {
            let tables = this.shadowRoot.querySelectorAll("table")
            for (var i = 0; i < tables.length; i++) {
                tables[i].style.display = "none"
            }

            this.shadowRoot.querySelector("#links-download-table").style.display = "block"
        }

        // The hide and show button.
        this.btn = this.shadowRoot.querySelector("paper-icon-button")

        let content = this.shadowRoot.querySelector("#collapse-panel")
        // give the focus to the input.
        this.btn.onclick = () => {
            content.toggle();
            if (this.files_upload_table.children.length > 0) {
                this.btn.style.setProperty("--iron-icon-fill-color", "var(--palette-action-active)")
                this.shadowRoot.querySelector("iron-collapse").style.display = "block";
            } else {
                //this.btn.style.setProperty("--iron-icon-fill-color", "var(--palette-action-disabled)")
                //this.shadowRoot.querySelector("iron-collapse").style.display = "none";
            }
        }

        this.btn.style.setProperty("--iron-icon-fill-color", "var(--palette-action-disabled)")

    }

    init() {
        // Upload file event.
        Model.eventHub.subscribe(
            "__upload_files_event__", (uuid) => { },
            (evt) => {
                this.uploadFiles(evt.path, evt.files)

            }
            , true, this
        )

        // Upload link (youtube, pornhub...)
        Model.eventHub.subscribe(
            "__upload_link_event__", (uuid) => { },
            (evt) => {
                this.uploadLink(evt.pid, evt.path, evt.infos, evt.lnk, evt.done)
            }
            , true, this
        )

        // Upload torrent files.
        Model.eventHub.subscribe(
            "__upload_torrent_event__", (uuid) => { },
            (evt) => {
                this.uploadTorrent(evt.pid, evt.path, evt.infos, evt.lnk, evt.done)
            }
            , true, this
        )
    }

    /**
     * Format file size from bytes to Gb, Mb or Kb...
     * @param {*} f_size 
     * @returns 
     */
    getFileSizeString(f_size) {

        // In case of already converted values...
        if (typeof f_size === 'string' || f_size instanceof String) {
            return f_size
        }

        let size = ""

        if (f_size > 1024) {
            if (f_size > 1024 * 1024) {
                if (f_size > 1024 * 1024 * 1024) {
                    let fileSize = f_size / (1024 * 1024 * 1024);
                    size = fileSize.toFixed(2) + " Gb";
                } else {
                    let fileSize = f_size / (1024 * 1024);
                    size = fileSize.toFixed(2) + " Mb";
                }
            } else {
                let fileSize = f_size / 1024;
                size = fileSize.toFixed(2) + " Kb";
            }
        } else {
            size = f_size + " bytes";
        }

        return size
    }

    /**
     * Dowload a video on globular server from a link.
     * @param {*} pid The pid of the server command associated with that link
     * @param {*} path The path on the server where the video will be saved
     * @param {*} infos The infos receive about the file transfert.
     */
    uploadLink(pid, path, infos, lnk, done) {

        let id = "link-download-row-" + pid
        let row = this.shadowRoot.querySelector("#" + id)

        if (done) {
            let span_title = this.links_download_table.querySelector("#" + id + "_title")
            ApplicationView.displayMessage("File " + span_title.innerHTML + " was now uploaded!", 3000)
            row.parentNode.removeChild(row)
            return
        }

        // display the button.
        this.btn.style.setProperty("--iron-icon-fill-color", "var(--palette-action-active)")
        this.shadowRoot.querySelector("iron-collapse").style.display = "block";

        if (row == undefined) {
            let row = document.createElement("tr")
            row.id = id
            let cancelCell = document.createElement("td")
            let cancelBtn = document.createElement("paper-icon-button")
            cancelBtn.icon = "icons:close"
            cancelCell.appendChild(cancelBtn)
            let cellSource = document.createElement("td")
            cellSource.style.textAlign = "left"
            cellSource.style.paddingLeft = "5px"
            cellSource.innerHTML = `
            <div style="display: flex; flex-direction: column;">
                <span id="${id}_title" style="background-color:var(--palette-background-default);">${infos}</span>
                <span id="${id}_infos" style="background-color:var(--palette-background-default);"></span>
            </div>`;
            let cellDest = document.createElement("td")
            cellDest.style.textAlign = "left"
            cellDest.style.paddingLeft = "5px"
            cellDest.innerHTML = `<span style="background-color:var(--palette-background-default);">${path}</span>`;

            row.appendChild(cancelCell)
            row.appendChild(cellSource);
            row.appendChild(cellDest);

            cancelBtn.onclick = () => {
                row.style.display = "none";
            }

            // Append to files panels.
            this.links_download_table.appendChild(row)
            this.btn.click()
            this.linksDownloadTab.click();
        } else {

            if (infos.startsWith("[download] Destination:")) {
                let span_title = this.links_download_table.querySelector("#" + id + "_title")
                span_title.innerHTML = infos.substring(infos.lastIndexOf("/") + 1)
            } else {
                let span_infos = this.links_download_table.querySelector("#" + id + "_infos")
                span_infos.innerHTML = infos.trim();
            }
        }

    }

    /**
     * Dowload a torrent on globular server.
     * @param {*} pid The pid of the torrent command on the server side.
     * @param {*} path The path of the torrent on the server
     * @param {*} infos The infos receive from about the file transfert.
     * @param {*} done If true 
     */
    uploadTorrent(pid, path, infos, lnk, done) {

        let id = "torrent-download-row-" + pid
        let row = this.shadowRoot.querySelector("#" + id)

        if (done) {
            ApplicationView.displayMessage("File " + id + " was now uploaded!", 3000)
            delete dirs[getUuidByString(path)]
            Model.eventHub.publish("reload_dir_event", path, false);
            row.parentNode.removeChild(row)
            return
        }

        // display the button.
        this.btn.style.setProperty("--iron-icon-fill-color", "var(--palette-action-active)")
        this.shadowRoot.querySelector("iron-collapse").style.display = "block";

        if (row == undefined) {
            let row = document.createElement("tr")
            row.id = id
            let cancelCell = document.createElement("td")
            let cancelBtn = document.createElement("paper-icon-button")
            cancelBtn.icon = "icons:close"
            cancelCell.appendChild(cancelBtn)
            let cellSource = document.createElement("td")
            cellSource.style.textAlign = "left"
            cellSource.style.paddingLeft = "5px"
            cellSource.innerHTML = `
            <style>
                a {
                    color: var(--palette-text-primary);
                }

                a span{
                    padding: 2px;
                }

                a img{
                    display: none;
                }
                
            </style>
            <div style="display: flex; flex-direction: column;">
                <span id="${id}_title" style="background-color:var(--palette-background-default);">${lnk}</span>
                <span id="${id}_infos" style="background-color:var(--palette-background-default);"></span>
            </div>`;
            let cellDest = document.createElement("td")
            cellDest.style.textAlign = "left"
            cellDest.style.paddingLeft = "5px"
            cellDest.innerHTML = `<span style="background-color:var(--palette-background-default);">${path}</span>`;

            row.appendChild(cancelCell)
            row.appendChild(cellSource);
            row.appendChild(cellDest);

            cancelBtn.onclick = () => {
                let rqst = new KillProcessRequest
                let token = localStorage.getItem("user_token");

                rqst.setPid(pid)
                Model.globular.adminService.killProcess(rqst, {
                    token: token,
                    application: Application.application,
                    domain: Application.domain
                }).then(() => {
                    row.parentElement.removeChild(row)
                }).catch(err => ApplicationView.displayWaitMessage(err, 3000))
            }

            // Append to files panels.
            this.torrent_download_table.appendChild(row)
            this.btn.click()
            this.torrentsDowloadTab.click();
        } else {
            console.log(infos)
            let span_infos = row.querySelector("#" + id + "_infos")
            let html = `<div style="display: flex; flex-direction: column;">`
            let infos_ = infos.trim().split(":")
            if (infos_.length > 2) {
                infos_.forEach(info => {
                    html += `<div>${info}</div>`
                })
                html += `</div>`
                span_infos.innerHTML = html;
            } else {
                row.parentNode.removeChild(row)
                console.log(infos.trim())
            }
        }

    }

    /**
     * Upload files from local computer to globular server
     * @param {*} path 
     * @param {*} files 
     */
    uploadFiles(path, files) {

        // So here I will try to get the most information from the backend to be able to keep the user inform about what append 
        // with uploading files process.
        if (files.length > 0) {
            this.btn.style.setProperty("--iron-icon-fill-color", "var(--palette-action-active)")
            this.shadowRoot.querySelector("iron-collapse").style.display = "block";
        }

        // Upload files panel...
        for (var i = 0; i < files.length; i++) {
            let f = files[i]
            let size = this.getFileSizeString(f.size)
            let row = document.createElement("tr")
            let cancelCell = document.createElement("td")
            let cancelBtn = document.createElement("paper-icon-button")
            cancelBtn.icon = "icons:close"
            cancelCell.appendChild(cancelBtn)
            let cellSource = document.createElement("td")
            cellSource.style.textAlign = "left"
            cellSource.style.paddingLeft = "5px"
            cellSource.innerHTML = `
                <div style="display: flex; flex-direction: column;">
                    <span style="background-color:var(--palette-background-default);">${f.name}</span>
                    <paper-progress value=0 style="width: 100%;"></paper-progress>
                </div>`;
            let cellDest = document.createElement("td")
            cellDest.style.textAlign = "left"
            cellDest.style.paddingLeft = "5px"
            cellDest.innerHTML = `<span style="background-color:var(--palette-background-default);">${path}</span>`;
            let cellSize = document.createElement("td")
            cellSize.innerHTML = size;
            row.appendChild(cancelCell)
            row.appendChild(cellSource);
            row.appendChild(cellDest);
            row.appendChild(cellSize);

            cancelBtn.onclick = () => {
                row.style.display = "none";
            }

            // Append to files panels.
            this.files_upload_table.appendChild(row)
            this.btn.click()
        }



        // Upload file one by one and 
        let uploadFile = (index, callback) => {
            let f = files[index]
            index++
            if (this.files_upload_table.children[0].style.display == "none") {
                // simply pass over...
                this.files_upload_table.removeChild(this.files_upload_table.children[0])
                if (index < files.length) {
                    uploadFile(index, callback)
                } else {
                    callback()
                }
            } else {

                // Take the port number from actual globular service conection.
                let port = Application.globular.config.PortHttp
                if (Application.globular.config.Protocol == "https") {
                    port = Application.globular.config.PortHttps
                }

                uploadFiles(path, [f],
                    () => {
                        if (index < files.length) {
                            uploadFile(index, callback)
                        } else {
                            callback()
                        }
                    },
                    event => {
                        console.log(event)
                        ApplicationView.displayMessage("Upload failed!", 3000)
                    },
                    event => {
                        let progress = this.files_upload_table.children[0].querySelector("paper-progress")
                        progress.value = (event.loaded / event.total) * 100
                        if (event.loaded == event.total) {
                            ApplicationView.displayMessage("File " + f.name + " was uploaded", 2000)
                            this.files_upload_table.removeChild(this.files_upload_table.children[0])
                            if (this.files_upload_table.children.length == 0) {
                                this.btn.style.setProperty("--iron-icon-fill-color", "var(--palette-action-disabled)")
                                this.shadowRoot.querySelector("iron-collapse").style.display = "none";
                            }
                        }
                    },
                    event => {
                        console.log("abort file upload event", event);
                    },
                    port)
            }
        }

        // Start file upload!
        uploadFile(0, () => {
            ApplicationView.displayMessage("All files are now uploaded!", 2000)
            delete dirs[getUuidByString(path)]
            Model.eventHub.publish("reload_dir_event", path, false)
            //this.btn.click()
        })

    }
}

customElements.define('globular-files-uploader', FilesUploader)
