
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-card/paper-card.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-checkbox/paper-checkbox.js';
import '@polymer/iron-icons/editor-icons.js'
import "@polymer/iron-icons/social-icons";
import "@polymer/iron-icons/av-icons";
import "@polymer/iron-icons/maps-icons";
import "@polymer/paper-progress/paper-progress.js"
import '@polymer/paper-dropdown-menu/paper-dropdown-menu.js'
import '@polymer/paper-listbox/paper-listbox.js'
import '@polymer/paper-item/paper-item.js'
import "./DiskSpace.js"
import "./Share.js"
import * as getUuid from 'uuid-by-string'

import { generatePeerToken, getUrl, Model } from '../Model';
import { File } from "../File";
import { Menu } from './Menu';
import { PermissionsManager } from './Permissions';
import { InformationsManager } from './Informations'
import { playVideo, playVideos } from './Video'
import { playAudio, playAudios } from './Audio'
import { GlobularFileReader } from './Reader'
import { v4 as uuidv4 } from "uuid";

// Menu to set action on files.
import { DropdownMenu } from './dropdownMenu.js';
import { AddPublicDirRequest, ConvertVideoToHlsRequest, ConvertVideoToMpeg4H264Request, CopyRequest, CreateDirRequest, CreateVideoPreviewRequest, CreateVideoTimeLineRequest, GeneratePlaylistRequest, GetPublicDirsRequest, MoveRequest, ReadFileRequest, RemovePublicDirRequest, StartProcessVideoRequest, UploadVideoRequest } from 'globular-web-client/file/file_pb';
import { createArchive, deleteDir, deleteFile, downloadFileHttp, renameFile, uploadFiles } from 'globular-web-client/api';
import { ApplicationView } from '../ApplicationView';
import { Application } from '../Application';
import { GetSharedResourceRqst, SubjectType } from 'globular-web-client/rbac/rbac_pb';
import { fireResize, getCoords, randomUUID } from './utility';
import * as getUuidByString from 'uuid-by-string';
import { ImageViewer } from './Image';
import { AssociateFileWithTitleRequest, CreateTitleRequest, GetFileAudiosRequest, GetFileTitlesRequest, GetFileVideosRequest, Person, Poster, Title } from 'globular-web-client/title/title_pb';
import { DownloadTorrentRequest, DropTorrentRequest, GetTorrentInfosRequest, GetTorrentLnksRequest } from 'globular-web-client/torrent/torrent_pb';
import { getImdbInfo } from './Search';
import { setMoveable } from './moveable'
import { setResizeable } from './rezieable'
import { SplitView } from './Splitter'
import { Account } from '../Account';
import { mergeTypedArrays, uint8arrayToStringMethod } from "../Utility";
import { ShareResourceMenu } from './Share.js';

import "../style.css"

// keep track of shared directory
var shared = {}
var public_ = {}

/**
 * Format file size from bytes to Gb, Mb or Kb...
 * @param {*} f_size 
 * @returns 
 */
export function getFileSizeString(f_size) {

    // In case of already converted values...
    if (typeof f_size === 'string' || f_size instanceof String) {
        return f_size
    }

    let size = ""

    if (f_size > 1024) {
        if (f_size > 1024 * 1024) {
            if (f_size > 1024 * 1024 * 1024) {
                let fileSize = f_size / (1024 * 1024 * 1024);
                size = fileSize.toFixed(2) + " GB";
            } else {
                let fileSize = f_size / (1024 * 1024);
                size = fileSize.toFixed(2) + " MB";
            }
        } else {
            let fileSize = f_size / 1024;
            size = fileSize.toFixed(2) + " KB";
        }
    } else {
        size = f_size + " bytes";
    }

    return size
}

// Return the size of a file at url.
function getFileSize(url_, callback, errorcallback) {

    let url = window.location.protocol + "//" + window.location.host + "/file_size"

    var xmlhttp = new XMLHttpRequest();
    xmlhttp.timeout = 10 * 1000

    xmlhttp.onreadystatechange = function () {
        if (this.readyState == 4 && (this.status == 201 || this.status == 200)) {
            let obj = JSON.parse(this.responseText)
            callback(obj.size);
        } else if (this.readyState == 4) {
            errorcallback("fail to get the configuration file at url " + url + " status " + this.status)
        }
    };

    url += "?url=" + url_

    xmlhttp.open("GET", url, true);
    xmlhttp.setRequestHeader("domain", Model.domain);

    xmlhttp.send();
}

function copyToClipboard(text) {
    var dummy = document.createElement("textarea");
    // to avoid breaking orgain page when copying more words
    // cant copy when adding below this code
    // dummy.style.display = 'none'
    document.body.appendChild(dummy);
    //Be careful if you use texarea. setAttribute('value', value), which works with "input" does not work with "textarea". – Eduard
    dummy.value = text;
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);
}

// Now I will test if imdb info are allready asscociated.
export function getTitleInfo(globule, file, callback) {
    let globules = Model.getGlobules()
    let index = globules.findIndex(g => { globule.domain == g.domain })
    if (index > 0) {
        globules.splice(index, 1)
        globules.unshift(globule)
    }

    // Now I will get titles info.
    let ___getTitleInfo___ = () => {
        let g = globules.shift()
        if (g == null) {
            callback([])
        } else {
            __getTitleInfo__(g, file, (_titles_) => {
                if (_titles_.length == 0) {
                    ___getTitleInfo___()
                } else {
                    _titles_.forEach(t => t.globule = g)
                    file.titles = _titles_
                    callback(_titles_)
                }
            })
        }
    }

    ___getTitleInfo___()
}

function __getTitleInfo__(globule, file, callback) {
    let rqst = new GetFileTitlesRequest
    rqst.setIndexpath(globule.config.DataPath + "/search/titles")
    rqst.setFilepath(file.path)

    globule.titleService.getFileTitles(rqst, { application: Application.application, domain: globule.domain, token: localStorage.getItem("user_token") })
        .then(rsp => {
            callback(rsp.getTitles().getTitlesList())
        })
        .catch(err => {
            // so here no title was found...

            callback([])
        })
}

export function getVideoInfo(globule, file, callback) {

    let globules = Model.getGlobules()
    let index = globules.findIndex(g => { globule.domain == g.domain })
    if (index > 0) {
        globules.splice(index, 1)
        globules.unshift(globule)
    }

    // Now I will get titles info.
    let ___getVideoInfo___ = () => {
        let g = globules.shift()
        if (g == null) {
            callback([])
        } else {
            __getVideoInfo__(g, file, (_videos_) => {
                if (_videos_.length == 0) {
                    ___getVideoInfo___()
                } else {
                    _videos_.forEach(v => v.globule = g)
                    file.videos = _videos_
                    callback(_videos_)
                }
            })
        }
    }

    ___getVideoInfo___()
}

function __getVideoInfo__(globule, file, callback) {

    let rqst = new GetFileVideosRequest
    rqst.setIndexpath(globule.config.DataPath + "/search/videos")
    rqst.setFilepath(file.path)

    globule.titleService.getFileVideos(rqst, { application: Application.application, domain: globule.domain, token: localStorage.getItem("user_token") })
        .then(rsp => {
            let videos = rsp.getVideos().getVideosList()
            callback(videos)
        })
        .catch(err => {
            callback([])
        })
}

export function getAudioInfo(globule, file, callback) {

    let globules = Model.getGlobules()
    let index = globules.findIndex(g => { globule.domain == g.domain })
    if (index > 0) {
        globules.splice(index, 1)
        globules.unshift(globule)
    }

    // Now I will get titles info.
    let ___getAudioInfo___ = () => {
        let g = globules.shift()
        if (g == null) {
            callback([])
        } else {
            __getAudioInfo__(g, file, (_audios_) => {
                if (_audios_.length == 0) {
                    ___getAudioInfo___()
                } else {
                    _audios_.forEach(a => a.globule = g)
                    file.audios = _audios_
                    callback(_audios_)
                }
            })
        }
    }

    ___getAudioInfo___()
}


function __getAudioInfo__(globule, file, callback) {

    let rqst = new GetFileAudiosRequest
    rqst.setIndexpath(globule.config.DataPath + "/search/audios")
    rqst.setFilepath(file.path)

    globule.titleService.getFileAudios(rqst, { application: Application.application, domain: globule.domain, token: localStorage.getItem("user_token") })
        .then(rsp => {
            let audios = rsp.getAudios().getAudiosList()
            callback(audios)
        })
        .catch(err => {
            callback([])
        })
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function markAsShare(dir) {
    shared[dir.path] = {};
    dir._files.forEach(f => {
        if (f._isDir) {
            markAsShare(f)
        }
    })
}

function markAsPublic(dir, parent) {
    public_[dir.path] = {};
    dir.__parent__ = parent // keep track of the original directory on the disck

    dir._files.forEach(f => {
        if (f._isDir) {
            markAsPublic(f, parent)
        }
    })
}

function getElementIndex(element) {
    return Array.from(element.parentNode.children).indexOf(element);
}

export function getImage(callback, images, files, index, globule) {
    let f = files[index];
    index++

    // set the url for the image.
    let url = ""
    if (!globule) {
        // Here I will use the default globule...
        url = window.location.protocol + "//" + window.location.hostname + ":"
        if (Application.globular.config.Protocol == "https") {
            url += Application.globular.config.PortHttps
        } else {
            url += Application.globular.config.PortHttp
        }

    } else {
        // Get image from the globule.
        url = globule.config.Protocol + "://" + globule.domain
        if (globule.config.Protocol == "https") {
            if (globule.config.PortHttps != 443)
                url += ":" + globule.config.PortHttps
        } else {
            if (globule.config.PortHttps != 80)
                url += ":" + globule.config.PortHttp
        }
    }

    if (f == undefined) {
        callback([])
        return
    }

    if (!f.path) {
        callback([])
        return
    }

    let path = f.path.split("/")
    path.forEach(item => {
        item = item.trim()
        if (item.length > 0)
            url += "/" + encodeURIComponent(item)
    })

    generatePeerToken(globule, token => {
        // Set url query parameter.
        url += "?domain=" + globule.domain
        url += "&application=" + Model.application
        if (localStorage.getItem("user_token") != undefined) {
            url += "&token=" + token
        }

        var xhr = new XMLHttpRequest();
        xhr.timeout = 10 * 1000
        xhr.open('GET', url, true);
        xhr.setRequestHeader("token", token);
        xhr.setRequestHeader("application", Model.application);
        xhr.setRequestHeader("domain", globule.domain);

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
                        getImage(callback, images, files, index, globule)
                    } else if (callback != undefined) {
                        callback(images)
                    }
                };
            }
        };

        xhr.send();
    })
}


// Keep dir info in map to save time...
let dirs = {}

// Usefull to get dir like /shared or /public that dosent exist on the server.
export function getLocalDir(globule, path) {
    // replace separator...
    path = path.split("\\").join("/")
    let key = getUuidByString(globule.domain + "@" + path)
    let dir = dirs[key]

    if (dir != null) {
        return dir
    }
    return null
}

/**
 * Read dir from local map if available. Read from the server
 * if not in the map of force (in case of refresh)
 * @param {*} path The path of the dir on the server
 * @param {*} callback The success callback
 * @param {*} errorCallback The error callback
 * @param {*} force If set the dir will be read from the server.
 */
function _readDir(path, callback, errorCallback, globule, force = false) {
    // replace separator...
    path = path.split("\\").join("/")
    let key = getUuidByString(globule.domain + "@" + path)
    if (!force || path == "/public" || path == "/shared") {
        let dir = dirs[key]
        if (dir != null) {
            if (dir.files.length > 0) {
                callback(dirs[key])
                return
            }
        }
    }

    // Here I will keep the dir info in the cache...
    File.readDir(path, false, (dir) => {
        callback(dir)
        // replace separator...
        dir.path = dir.path.split("\\").join("/")
        let parent = dir.path.substring(0, dir.path.lastIndexOf("/"))
        if (public_[parent]) {
            markAsPublic(dir, parent)
        }

        dirs[key] = dir
    }, errorCallback, globule)

}

function getHiddenFiles(path, callback, globule) {

    let thumbnailPath = path.replace("/playlist.m3u8", "")
    if (thumbnailPath.lastIndexOf(".mp3") != -1 || thumbnailPath.lastIndexOf(".mp4") != -1 || thumbnailPath.lastIndexOf(".mkv") != -1 || thumbnailPath.lastIndexOf(".avi") != -1 || thumbnailPath.lastIndexOf(".MP4") != -1 || thumbnailPath.lastIndexOf(".MKV") != -1 || thumbnailPath.lastIndexOf(".AVI") != -1) {
        thumbnailPath = thumbnailPath.substring(0, thumbnailPath.lastIndexOf("."))
    }

    thumbnailPath = thumbnailPath.substring(0, thumbnailPath.lastIndexOf("/") + 1) + ".hidden" + thumbnailPath.substring(thumbnailPath.lastIndexOf("/")) + "/__preview__"

    _readDir(thumbnailPath, callback, err => { console.log(err); callback(null); }, globule)
}

function _publishSetDirEvent(path, file_explorer_) {
    file_explorer_.displayWaitMessage("load " + path)
    _readDir(path, (dir) => {

        Model.eventHub.publish("__set_dir_event__", { path: dir, file_explorer_id: file_explorer_.id }, true)
        file_explorer_.resume()
    }, err => { ApplicationView.displayMessage(err, 3000); file_explorer_.resume(); }, file_explorer_.globule)
}

// the paper tray
var paperTray = null;
var editMode = "";

/**
 * That class is the base class of FilesListView and FilesIconView
 */
export class FilesView extends HTMLElement {

    constructor() {
        super()

        // must icon or list view one is active at time.
        this._active_ = false

        // The parent file explorer
        this._file_explorer_ = null;

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // The active explorer path.
        this.path = undefined

        // The current directory.
        this.__dir__ = null;

        // The list of files to delete
        this.selected = {};

        // The function will be call in case of error.
        this.onerror = err => ApplicationView.displayMessage(err, 3000);

        // Innitialisation of the layout.
        let id = "_" + uuidv4().split("-").join("_").split("@").join("_");

        // Create the share resource menu.
        this.shareResource = new ShareResourceMenu

        let menuItemsHTML = `
        <globular-dropdown-menu-item  id="file-infos-menu-item" icon="icons:info" text="File Infos" action=""> </globular-dropdown-menu-item>
        <globular-dropdown-menu-item  id="title-infos-menu-item" icon="icons:info" text="Title Infos" action="" style="display: none;"> </globular-dropdown-menu-item>
        <globular-dropdown-menu-item  id="manage-acess-menu-item" icon="folder-shared" text="Manage access" action=""></globular-dropdown-menu-item>
        <globular-dropdown-menu-item  id="refresh-infos-menu-item" icon="icons:refresh" text="Refresh infos" action="" style="display: none;"></globular-dropdown-menu-item>
        <globular-dropdown-menu-item separator="true" id="video-menu-item" icon="maps:local-movies" text="Movies" action="" style="display: none;"> 
            <globular-dropdown-menu>
                <globular-dropdown-menu-item id="generate-timeline-menu-item" icon="maps:local-movies" text="generate timeline" action=""> </globular-dropdown-menu-item>
                <globular-dropdown-menu-item id="generate-preview-menu-item" icon="maps:local-movies" text="generate preview" action=""> </globular-dropdown-menu-item>
                <globular-dropdown-menu-item separator="true" id="to-mp4-menu-item" icon="maps:local-movies" text="convert to mp4" action="" style="display: none;"> </globular-dropdown-menu-item>
                <globular-dropdown-menu-item separator="true" id="to-hls-menu-item" icon="maps:local-movies" text="convert to hls" action="" style="display: none;"> </globular-dropdown-menu-item>
            </globular-dropdown-menu>
        </globular-dropdown-menu-item>
        <globular-dropdown-menu-item separator="true"  id="cut-menu-item"  icon="icons:content-cut" text="Cut" action=""></globular-dropdown-menu-item>
        <globular-dropdown-menu-item id="copy-menu-item" icon="content-copy" text="Copy" action=""></globular-dropdown-menu-item>
        <globular-dropdown-menu-item id="paste-menu-item" icon="icons:content-paste" action="" text="Paste"></globular-dropdown-menu-item>
        <globular-dropdown-menu-item separator="true"  id="rename-menu-item" text="Rename" icon="icons:create" action=""> </globular-dropdown-menu-item>
        <globular-dropdown-menu-item id="delete-menu-item" icon="icons:delete" action="" text="Delete"> </globular-dropdown-menu-item>
        <globular-dropdown-menu-item separator="true"  id="download-menu-item" icon="icons:cloud-download" text="Download" action=""> </globular-dropdown-menu-item>
        <globular-dropdown-menu-item id="open-in-new-tab-menu-item" icon="icons:open-in-new" text="Open in new tab" action="" style="display: none;"> </globular-dropdown-menu-item>
        <globular-dropdown-menu-item id="copy-url-menu-item" icon="icons:link" text="Copy url" action=""> </globular-dropdown-menu-item>
        `

        this.menu = new DropdownMenu("icons:more-vert")
        this.menu.className = "file-dropdown-menu"
        this.menu.innerHTML = menuItemsHTML

        this.videMenuItem = this.menu.querySelector("#video-menu-item")
        this.fileInfosMenuItem = this.menu.querySelector("#file-infos-menu-item")
        this.titleInfosMenuItem = this.menu.querySelector("#title-infos-menu-item")
        this.refreshInfoMenuItem = this.menu.querySelector("#refresh-infos-menu-item")
        this.mananageAccessMenuItem = this.menu.querySelector("#manage-acess-menu-item")
        this.renameMenuItem = this.menu.querySelector("#rename-menu-item")
        this.deleteMenuItem = this.menu.querySelector("#delete-menu-item")
        this.downloadMenuItem = this.menu.querySelector("#download-menu-item")
        this.openInNewTabItem = this.menu.querySelector("#open-in-new-tab-menu-item")
        this.copyUrlItem = this.menu.querySelector("#copy-url-menu-item")

        // video conversion menu
        this.generateTimeLineItem = this.menu.querySelector("#generate-timeline-menu-item")
        this.generatePreviewItem = this.menu.querySelector("#generate-preview-menu-item")
        this.toMp4MenuItem = this.menu.querySelector("#to-mp4-menu-item")
        this.toHlsMenuItem = this.menu.querySelector("#to-hls-menu-item")

        // Now the cut copy and paste menu...
        this.cutMenuItem = this.menu.querySelector("#cut-menu-item")
        this.copyMenuItem = this.menu.querySelector("#copy-menu-item")
        this.pasteMenuItem = this.menu.querySelector("#paste-menu-item")


        // Action to do when file is set
        this.menu.setFile = (f) => {

            this.menu.file = f;
            if (this.menu.file.mime.startsWith("video")) {
                this.titleInfosMenuItem.style.display = "block"
                this.videMenuItem.style.display = "block"
                this.openInNewTabItem.style.display = "block"
                this.generateTimeLineItem.style.display = "block"
                this.generatePreviewItem.style.display = "block"

                if (this.menu.file.name.endsWith(".mp4") || this.menu.file.name.endsWith(".MP4")) {
                    this.toHlsMenuItem.style.display = "block"
                    this.toMp4MenuItem.style.display = "none"
                } else if (this.menu.file.mime == "video/hls-stream") {
                    this.toHlsMenuItem.style.display = "none"
                    this.toMp4MenuItem.style.display = "none"
                } else {
                    this.toHlsMenuItem.style.display = "none"
                    this.toMp4MenuItem.style.display = "block"
                }
            } else {
                this.videMenuItem.style.display = "none"

                if (this.menu.file.mime.startsWith("audio")) {
                    this.titleInfosMenuItem.style.display = "block"
                } else {
                    this.titleInfosMenuItem.style.display = "none"
                }

                if (this.menu.file.isDir) {
                    this.refreshInfoMenuItem.style.display = "block"
                    this.videMenuItem.style.display = "block"
                    this.toHlsMenuItem.style.display = "block"
                    this.toMp4MenuItem.style.display = "block"
                    this.generateTimeLineItem.style.display = "none"
                    this.generatePreviewItem.style.display = "none"
                }


                this.openInNewTabItem.style.display = "none"
            }
        }

        this.refreshInfoMenuItem.action = () => {
            let rqst = new StartProcessVideoRequest
            rqst.setPath(this.menu.file.path)
            let globule = this._file_explorer_.globule

            generatePeerToken(globule, token => {
                globule.fileService.startProcessVideo(rqst, {

                }).then(() => {
                    ApplicationView.displayMessage("informations are now updated", 3000)
                })
                    .catch(err => ApplicationView.displayMessage(err, 3000))
            })

            // Remove it from it parent... 
            this.menu.close()
            this.menu.parentNode.removeChild(this.menu)

        }

        this.cutMenuItem.action = () => {
            editMode = "cut"
            paperTray = [];
            for (var key in this.selected) {
                paperTray.push(this.selected[key].path)
            }

            // Append file to file menu
            if (paperTray.length == 0) {
                paperTray.push(this.menu.file.path)
            }

            // empty the selection.
            this.selected = {}

            // Remove it from it parent... 
            this.menu.close()
            this.menu.parentNode.removeChild(this.menu)
        }

        this.copyMenuItem.action = () => {

            editMode = "copy"
            paperTray = [];
            for (var key in this.selected) {
                paperTray.push(this.selected[key].path)
            }

            // Append file to file menu
            if (paperTray.length == 0) {
                paperTray.push(this.menu.file.path)
            }

            // empty the selection.
            this.selected = {}

            // Remove it from it parent... 
            this.menu.close()
            this.menu.parentNode.removeChild(this.menu)
        }

        this.pasteMenuItem.action = () => {

            if (editMode == "copy") {
                // Here I will call move on the file manager
                this.copy(this.menu.file.path)

            } else if (editMode == "cut") {
                // Here I will call copy
                this.move(this.menu.file.path)
            }
            // Remove it from it parent... 
            this.menu.close()
            this.menu.parentNode.removeChild(this.menu)
        }

        this.openInNewTabItem.action = () => {
            let globule = this._file_explorer_.globule
            generatePeerToken(globule, token => {
                let url = getUrl(globule)

                this.menu.file.path.split("/").forEach(item => {
                    let component = encodeURIComponent(item.trim())
                    if (component.length > 0) {
                        url += "/" + component
                    }
                })

                if (this.menu.file.mime == "video/hls-stream") {
                    url += "/playlist.m3u8"
                }

                url += "?application=" + Model.application;
                url += "&token=" + token

                window.open(url, '_blank', "fullscreen=yes");

                // Remove it from it parent... 
                this.menu.close()
                this.menu.parentNode.removeChild(this.menu)
            })

        }

        this.copyUrlItem.action = () => {
            let globule = this._file_explorer_.globule
            generatePeerToken(globule, token => {
                let url = getUrl(globule)
                this.menu.file.path.split("/").forEach(item => {
                    let component = encodeURIComponent(item.trim())
                    if (component.length > 0) {
                        url += "/" + component
                    }

                })

                if (this.menu.file.mime == "video/hls-stream") {
                    url += "/playlist.m3u8"
                }

                url += "?application=" + Model.application;
                url += "&token=" + token

                copyToClipboard(url)

                ApplicationView.displayMessage("url was copy to clipboard...", 3000)

                // Remove it from it parent... 
                this.menu.close()
                this.menu.parentNode.removeChild(this.menu)
            })
        }

        this.downloadMenuItem.action = () => {
            // Here I will create an archive from the selected files and dowload it...
            let files = [];
            for (var key in this.selected) {
                files.push(this.selected[key].path)
            }
            let globule = this._file_explorer_.globule
            if (files.length > 0) {
                generatePeerToken(globule, token => {
                    // Create a tempory name...
                    let uuid = "_" + uuidv4().split("-").join("_").split("@").join("_");
                    this._file_explorer_.displayWaitMessage("create archive before for selected files...")
                    createArchive(globule, files, uuid,
                        path => {
                            // Download the file...
                            this._file_explorer_.displayWaitMessage("start download archive " + path)
                            downloadFileHttp(path, uuid + ".tar.gz",
                                () => {
                                    // Now I will remove the file from the server....
                                    this._file_explorer_.displayWaitMessage("remove archive " + path)
                                    deleteFile(globule, path,
                                        () => {
                                            this._file_explorer_.resume()
                                        },
                                        err => { ApplicationView.displayMessage(err, 3000); this._file_explorer_.resume() }, token)
                                }, token)
                        }, err => { ApplicationView.displayMessage(err, 3000); this._file_explorer_.resume() }, token)
                })

            } else {

                let path = this.menu.file.path
                let name = path.substring(path.lastIndexOf("/") + 1)

                // if the file is a directory I will create archive and download it.
                if (this.menu.file.isDir) {
                    generatePeerToken(globule, token => {
                        this._file_explorer_.displayWaitMessage("create archive before for " + this.menu.file.path)
                        createArchive(globule, [path], name,
                            path_ => {
                                // Download the file...
                                this._file_explorer_.displayWaitMessage("start download " + name + ".tar.gz")
                                downloadFileHttp(path_, name + ".tar.gz",
                                    () => {
                                        // Now I will remove the file from the server....
                                        deleteFile(globule, path_,
                                            () => {
                                                this._file_explorer_.resume()
                                            },
                                            err => { ApplicationView.displayMessage(err, 3000); this._file_explorer_.resume() }, token)
                                    }, token)
                            }, err => { ApplicationView.displayMessage(err, 3000); this._file_explorer_.resume() }, token)
                    })
                } else {
                    // simply download the file.
                    generatePeerToken(globule, token => {
                        downloadFileHttp(path, name,
                            () => {
                                // Now I will remove the file from the server....

                            }, token), err => { ApplicationView.displayMessage(err, 3000) }
                    })
                }

            }

            // Remove it from it parent... 
            this.menu.close()
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
                padding-bottom: 10px;
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
                15 * 1000 // 15 sec...
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
                    this.selected = {}
                }

                let index = 0;

                let deleteFile_ = () => {
                    let f = files[index]
                    f.path = f.path.split("\\").join("/")
                    let path = f.path.substring(0, f.path.lastIndexOf("/"))
                    index++
                    let globule = this._file_explorer_.globule
                    if (f.isDir) {

                        this._file_explorer_.globule.fileService.getPublicDirs(new GetPublicDirsRequest, { application: Application.application, domain: this._file_explorer_.globule.domain, token: localStorage.getItem("user_token") })
                            .then(rsp => {
                                // if the dir is public I will remove it entry from the list and keep the directory...
                                let dirs = rsp.getDirsList()
                                if (dirs.includes(f.path)) {
                                    const rqst = new RemovePublicDirRequest
                                    rqst.setPath(f.path)
                                    globule.fileService.removePublicDir(rqst, { application: Application.application, domain: globule.domain, token: localStorage.getItem("user_token") })
                                        .then(rsp => {
                                            delete dirs[getUuidByString(this._file_explorer_.globule.domain + "@/public")]
                                            Model.publish("reload_dir_event", "/public", false);
                                        })
                                        .catch(err => { ApplicationView.displayMessage(err, 3000) })
                                } else {
                                    generatePeerToken(globule, token => {
                                        deleteDir(globule, f.path,
                                            () => {
                                                delete dirs[getUuidByString(this._file_explorer_.globule.domain + "@" + path)]
                                                Model.eventHub.publish("reload_dir_event", path, false);
                                                if (index < Object.keys(this.selected).length) {
                                                    deleteFile_()
                                                } else {
                                                    success()
                                                }
                                            },
                                            err => { ApplicationView.displayMessage(err, 3000) }, token)
                                    })

                                }
                            })

                    } else {
                        deleteFile(globule, f.path,
                            () => {
                                delete dirs[getUuidByString(this._file_explorer_.globule.domain + "@" + path)]
                                Model.publish("reload_dir_event", path, false);
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
            // Remove it from it parent... 
            this.menu.close()
            this.menu.parentNode.removeChild(this.menu)

        }

        this.renameMenuItem.action = () => {
            // Display the rename input...
            this.menu.rename()
            // Remove it from it parent... 
            this.menu.close()
            this.menu.parentNode.removeChild(this.menu)
        }

        this.fileInfosMenuItem.action = () => {
            Model.eventHub.publish("display_file_infos_event", this.menu.file, true)
            // Remove it from it parent... 
            this.menu.close()
            this.menu.parentNode.removeChild(this.menu)
        }

        this.titleInfosMenuItem.action = () => {
            // So here I will create a new permission manager object and display it for the given file.
            let globule = this._file_explorer_.globule

            let file = this.menu.file
            if (file.mime.startsWith("video")) {

                getVideoInfo(globule, file, (videos) => {
                    if (videos.length > 0) {
                        file.videos = videos // keep in the file itself...
                        Model.eventHub.publish("display_media_infos_event", file, true)
                        // Remove it from it parent... 
                        this.menu.close()
                        this.menu.parentNode.removeChild(this.menu)
                    } else {

                        // get the title infos...
                        getTitleInfo(globule, file, (titles) => {
                            if (titles.length > 0) {
                                file.titles = titles // keep in the file itself...
                                Model.eventHub.publish("display_media_infos_event", file, true)
                                if (this.menu.parentNode) {
                                    // Remove it from it parent... 
                                    this.menu.close()
                                    this.menu.parentNode.removeChild(this.menu)
                                }
                            }
                        })
                    }
                })
            } else if (file.mime.startsWith("audio")) {
                getAudioInfo(globule, file, (audios) => {
                    if (audios.length > 0) {
                        file.audios = audios // keep in the file itself...
                        Model.eventHub.publish("display_media_infos_event", file, true)
                        // Remove it from it parent... 
                        this.menu.close()
                        this.menu.parentNode.removeChild(this.menu)
                    }
                })
            }
        }

        this.mananageAccessMenuItem.action = () => {
            // So here I will create a new permission manager object and display it for the given file.
            Model.eventHub.publish("display_permission_manager_event", this.menu.file.path, true)
            // Remove it from it parent... 
            this.menu.close()
            this.menu.parentNode.removeChild(this.menu)
        }

        this.generateTimeLineItem.action = () => {
            // Generate the video time line...
            let rqst = new CreateVideoTimeLineRequest
            rqst.setWidth(180)
            rqst.setFps(0.2)
            let globule = this._file_explorer_.globule
            let path = this.menu.file.path

            // Set the users files/applications
            if (this.menu.file.path.startsWith("/users") || this.menu.file.path.startsWith("/applications")) {
                path = globule.config.DataPath + "/files" + this.menu.file.path
            }

            rqst.setPath(path)
            ApplicationView.displayMessage("Create timeline for file at path </br>" + path, 3500)
            globule.fileService.createVideoTimeLine(rqst, { application: Application.application, domain: globule.domain, token: localStorage.getItem("user_token") })
                .then(rsp => {
                    ApplicationView.displayMessage("Timeline is created </br>" + path, 3500)
                })
                .catch(err => {
                    ApplicationView.displayMessage(err, 3000)
                })

            // Remove it from it parent... 
            this.menu.close()
            this.menu.parentNode.removeChild(this.menu)

        }

        this.generatePreviewItem.action = () => {
            // Generate the video preview...
            let rqst = new CreateVideoPreviewRequest
            rqst.setHeight(128)
            rqst.setNb(20)
            let globule = this._file_explorer_.globule
            let file = this.menu.file
            let path = file.path


            // Set the users files/applications
            if (this.menu.file.path.startsWith("/users") || file.path.startsWith("/applications")) {
                path = globule.config.DataPath + "/files" + file.path
            }

            rqst.setPath(path)
            ApplicationView.displayMessage("Create preview for file at path </br>" + path, 3500)
            globule.fileService.createVideoPreview(rqst, { application: Application.application, domain: globule.domain, token: localStorage.getItem("user_token") })
                .then(rsp => {
                    ApplicationView.displayMessage("Preview are created </br>" + path, 3500)
                    Model.publish("refresh_dir_evt", file.path.substring(0, file.path.lastIndexOf("/")), false);
                })
                .catch(err => {
                    ApplicationView.displayMessage(err, 3000)
                })

            // Remove it from it parent... 
            this.menu.close()
            this.menu.parentNode.removeChild(this.menu)
        }

        this.toMp4MenuItem.action = () => {
            let rqst = new ConvertVideoToMpeg4H264Request
            let file = this.menu.file
            let path = file.path

            let globule = this._file_explorer_.globule
            // Set the users files/applications
            if (file.path.startsWith("/users") || file.path.startsWith("/applications")) {
                path = globule.config.DataPath + "/files" + file.path
            }
            rqst.setPath(path)

            ApplicationView.displayMessage("Convert file at path </br>" + path, 3500)
            globule.fileService.convertVideoToMpeg4H264(rqst, { application: Application.application, domain: globule.domain, token: localStorage.getItem("user_token") })
                .then(rsp => {
                    ApplicationView.displayMessage("Conversion done </br>" + path, 3500)
                    Model.eventHub.publish("refresh_dir_evt", file.path.substring(0, file.path.lastIndexOf("/")), false);
                })
                .catch(err => {
                    ApplicationView.displayMessage(err, 3000)
                })

            // Remove it from it parent... 
            this.menu.close()
            this.menu.parentNode.removeChild(this.menu)

        }

        this.toHlsMenuItem.action = () => {
            let rqst = new ConvertVideoToHlsRequest
            let file = this.menu.file
            let path = file.path
            let globule = this._file_explorer_.globule
            // Set the users files/applications
            if (file.path.startsWith("/users") || file.path.startsWith("/applications")) {
                path = globule.config.DataPath + "/files" + file.path
            }
            rqst.setPath(path)

            ApplicationView.displayMessage("Convert file at path </br>" + path, 3500)
            globule.fileService.convertVideoToHls(rqst, { application: Application.application, domain: globule.domain, token: localStorage.getItem("user_token") })
                .then(rsp => {
                    ApplicationView.displayMessage("Conversion done </br>" + path, 3500)
                    Model.publish("refresh_dir_evt", file.path.substring(0, file.path.lastIndexOf("/")), false);
                })
                .catch(err => {
                    ApplicationView.displayMessage(err, 3000)
                })

            // Remove it from it parent... 
            this.menu.close()
            this.menu.parentNode.removeChild(this.menu)
        }

        this.shadowRoot.innerHTML = `
          <style>
             

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
                  padding-bottom: 0px;
                  right: 5px;
                  overflow: auto;
              }

              popup-menu-element {
                background-color: var(--palette-background-paper); 
                color: var(--palette-text-primary);
              }

             ::-webkit-scrollbar {
                width: 5px;
                height: 5px;

             }
                
             ::-webkit-scrollbar-track {
                background: var(--palette-background-default);
             }
             
             ::-webkit-scrollbar-thumb {
                background: var(--palette-divider); 
             }

          </style>

          <div class="files-view-div no-select" /*oncontextmenu="return false;"*/ id="${id}">
          </div>
          `
        // get the div.
        this.div = this.shadowRoot.getElementById(id)

        this.div.onscroll = () => {
            if (this.div.scrollTop == 0) {
                this.div.style.boxShadow = ""
                this.div.style.borderTop = ""
            } else {
                this.div.style.boxShadow = "inset 0px 5px 6px -3px rgb(0 0 0 / 40%)"
                this.div.style.borderTop = "1px solid var(--palette-divider)"
            }

            // remove the menu...
            this.menu.close()
            if (this.menu.parentNode)
                this.menu.parentNode.removeChild(this.menu)
        }


        /** Remove the menu */
        this.div.onmouseover = () => {
            if (!this.menu.isOpen()) {
                if (this.menu.parentNode != undefined) {
                    this.menu.parentNode.removeChild(this.menu)
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

    disconnectedCallback() {
        this.menu.close()
        if (this.menu.parentNode) {
            this.menu.parentNode.removeChild(this.menu)
        }
    }

    setFileExplorer(fileExplorer) {
        this._file_explorer_ = fileExplorer
    }

    /**
     * Copy file to a given path
     * @param {*} path 
     */
    copy(path) {

        let rqst = new CopyRequest
        rqst.setPath(path)
        rqst.setFilesList(paperTray)

        let token = localStorage.getItem("user_token");
        let globule = this._file_explorer_.globule

        // Create a directory at the given path.
        globule.fileService
            .copy(rqst, {
                token: token,
                application: Application.application,
                domain: globule.domain
            }).then(() => {
                paperTray = []
                editMode = ""
                delete dirs[getUuidByString(this._file_explorer_.globule.domain + "@" + path)]
                Model.eventHub.publish("reload_dir_event", path, false);
            })
            .catch(err => {
                paperTray = []
                editMode = ""
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
        rqst.setFilesList(paperTray)

        let token = localStorage.getItem("user_token");
        let globule = this._file_explorer_.globule

        // Create a directory at the given path.
        globule.fileService
            .move(rqst, {
                token: token,
                application: Application.application,
                domain: globule.domain
            }).then(() => {
                for (var i = 0; i < paperTray.length; i++) {
                    let f = paperTray[i]
                    let path_ = f.substring(0, f.lastIndexOf("/"))
                    delete dirs[getUuidByString(this._file_explorer_.globule.domain + "@" + path)]
                    Model.publish("reload_dir_event", path_, false);
                }
                paperTray = []
                editMode = ""
                delete dirs[getUuidByString(this._file_explorer_.globule.domain + "@" + path)]
                Model.publish("reload_dir_event", path, false);
            })
            .catch(err => {
                paperTray = []
                editMode = ""
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
            if (!this._active_) {
                return
            }

            // Hide the icon parent div.
            let div = this.div.querySelector("#" + infos.id)
            if (div != undefined) {
                div.parentNode.style.display = "none"
            } else {
                console.log("div with id ", infos.id, "dosent exist in ", this.div)
            }


            if (editMode.length == 0) {
                editMode = "cut"
            }

            paperTray = [];
            for (var key in this.selected) {
                paperTray.push(this.selected[key].path)
            }

            // Append file to file menu
            if (paperTray.length == 0) {
                paperTray.push(infos.file)
            }

            if (editMode == "cut") {
                this.move(infos.dir)
            } else if (editMode == "copy") {
                this.copy(infos.dir)
            }
        }, true, this)
    }

    clearSelection() {
        this.selected = {}
    }

    rename(parent, f, offset) {

        parent.style.position = "relative"

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

                        paper-card{
                            background-color: var(--palette-background-paper);
                            color: var(--palette-text-primary);
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
            generatePeerToken(this._file_explorer_.globule, token => {
                renameFile(this._file_explorer_.globule, path, input.value, f.name,
                    () => {
                        // Refresh the parent folder...
                        delete dirs[getUuidByString(this._file_explorer_.globule.domain + "@" + path)]
                        Model.eventHub.publish("reload_dir_event", path, false);
                    }, err => { ApplicationView.displayMessage(err, 3000) }, token)
            })

        }
    }

    // The ondrop evt...
    ondrop(evt) {
        evt.stopPropagation()

        let lnk = evt.dataTransfer.getData('text/html');

        if (evt.dataTransfer.getData("Url").length > 0) {
            let url = evt.dataTransfer.getData("Url")
            // Here we got an url...
            if (url.endsWith(".torrent") || url.startsWith("magnet:")) {
                let path = this.__dir__.path
                if (path.startsWith("/users/") || path.startsWith("/applications/")) {
                    path = this._file_explorer_.globule.config.DataPath + "/files" + path
                }

                let rqst = new DownloadTorrentRequest
                rqst.setLink(url)
                rqst.setDest(path)
                rqst.setSeed(true) // Can be an option in the console interface...

                // Display the message.
                this._file_explorer_.globule.torrentService.downloadTorrent(rqst, { application: Application.application, domain: this._file_explorer_.globule.domain, token: localStorage.getItem("user_token") })
                    .then(() => {
                        ApplicationView.displayMessage("your torrent was added and will start download soon...", 3000)
                        // Here I will 
                    }).catch(err => ApplicationView.displayMessage(err, 3000))

            } else if (url.endsWith(".jpeg") || url.endsWith(".jpg") || url.startsWith(".bpm") || url.startsWith(".gif") || url.startsWith(".png")) {
                // I will get the file from the url and save it on the server in the current directory.
                var getFileBlob = (url, cb) => {
                    generatePeerToken(this._file_explorer_.globule, token => {
                        var xhr = new XMLHttpRequest();
                        xhr.timeout = 1500
                        xhr.open("GET", url);
                        xhr.responseType = "blob";
                        xhr.setRequestHeader("token", token);
                        xhr.setRequestHeader("application", Model.application);
                        xhr.setRequestHeader("domain", Model.domain);
                        xhr.addEventListener('load', () => {
                            cb(xhr.response);
                        });
                        xhr.send();
                    })
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
                    generatePeerToken(this._file_explorer_.globule, token => {
                        uploadFiles(this._file_explorer_.globule, token, this.__dir__.path, [fileObject], () => {
                            Model.eventHub.publish("__upload_files_event__", { path: this.__dir__.path, files: [fileObject], lnk: lnk }, true)
                        }, err => ApplicationView.displayMessage(err, 3000))
                    })
                });
            } else {

                // Just beat it!
                // youtube-dl -f mp4 -o "/tmp/%(title)s.%(ext)s" https://www.youtube.com/watch?v=oRdxUFDoQe0&list=PLCD0445C57F2B7F41&index=12&ab_channel=michaeljacksonVEVO
                // In that case I will made use of the fabulous youtube-dl command line.
                let toast = ApplicationView.displayMessage(`
                <style>
                   
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

                    let rqst = new UploadVideoRequest
                    rqst.setDest(this.__dir__.path)

                    if (mp3Radio.checked) {
                        rqst.setFormat("mp3")
                    } else {
                        rqst.setFormat("mp4")
                    }
                    rqst.setUrl(url)

                    generatePeerToken(this._file_explorer_.globule, token => {

                        let stream = this._file_explorer_.globule.fileService.uploadVideo(rqst, { application: Application.application, domain: this._file_explorer_.globule.domain, token: token })
                        let pid = -1;

                        // Here I will create a local event to be catch by the file uploader...
                        stream.on("data", (rsp) => {
                            if (rsp.getPid() != null) {
                                pid = rsp.getPid()
                            }

                            // Publish local event.
                            Model.eventHub.publish("__upload_link_event__", { pid: pid, path: this.__dir__.path, infos: rsp.getResult(), done: false, lnk: lnk }, true);
                        })

                        stream.on("status", (status) => {
                            if (status.code === 0) {
                                Model.eventHub.publish("__upload_link_event__", { pid: pid, path: this.__dir__.path, infos: "", done: true, lnk: lnk }, true);
                            }
                        });
                    }, err => ApplicationView.displayMessage(err, 3000))
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
        } else {
            let f = evt.dataTransfer.getData('file')
            let id = evt.dataTransfer.getData('id')

            editMode = "copy" // make the drop file copy instead of move. The user will be able to remove the existing file as he want.

            // Create drop_file_event...
            if (f != undefined && id.length > 0) {
                this.clearSelection()

                Model.eventHub.publish("drop_file_event", { file: f, dir: this.__dir__.path, id: id }, true)
                Model.eventHub.publish("reload_dir_event", f.substring(0, f.lastIndexOf("/")), false);
            }
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
        dir.path = dir.path.split("\\").join("/")
        if (dir.name.startsWith(".") || !(dir.path.startsWith("/public") || public_[dir.path] != undefined || dir.path.startsWith("/shared") || shared[dir.path] != undefined || dir.path.startsWith("/applications/" + Application.application) || dir.path.startsWith("/users/" + Application.account.id))) {
            return;
        }

        this.div.innerHTML = "";


        let checkboxs = this.div.querySelectorAll("paper-checkbox")
        for (var i = 0; i < checkboxs.length; i++) {
            if (!checkboxs[i].checked) {
                checkboxs[i].style.visibility = "hidden"
            }
        }

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
                display: flex;
                flex-grow: 1;
                padding-top: 4px;
                padding-left: 4px;
                padding-right: 40px;
                margin-left: 5px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
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

            if (f.name == "audio.m3u") {
                dir.__audioPlaylist__ = f
            } else if (f.name == "video.m3u") {
                dir.__videoPlaylist__ = f
            } else {

                if (f._mime.length > 0) {
                    mime = f._mime
                }

                if (f._mime.length > 0) {
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
                <td>${f.modeTime.toLocaleString()}</td>
                <td>${mime}</td>
                <td>${size}</td>
            `

                let row = document.createElement("tr")
                row.innerHTML = html;

                let rowId = "_" + uuidv4().split("-").join("_").split("@").join("_");
                row.id = rowId;

                if (f.mime.startsWith("video")) {
                    row.querySelector(`#${id}_icon`).icon = "av:movie"
                } else if (f.mime.startsWith("audio")) {
                    row.querySelector(`#${id}_icon`).icon = "av:music-video"
                }


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
                        Model.eventHub.publish("__play_video__", { file: f, file_explorer_id: this._file_explorer_.id }, true)
                    } else if (f.mime.startsWith("audio")) {
                        Model.eventHub.publish("__play_audio__", { file: f, file_explorer_id: this._file_explorer_.id }, true)
                    } else if (f.isDir) {
                        _publishSetDirEvent(f._path, this._file_explorer_)
                    } else if (f.mime.startsWith("image")) {
                        Model.eventHub.publish("__show_image__", { file: f, file_explorer_id: this._file_explorer_.id }, true)
                    }
                    this.menu.close()
                }

                row.onmouseenter = (evt) => {
                    evt.stopPropagation();

                    if (!this.menu.isOpen()) {

                        // Set the share menu
                        span.appendChild(this.shareResource)
                        this.shareResource.style.position = "absolute"
                        this.shareResource.style.top = "7px";
                        this.shareResource.style.right = "25px";

                        let files = [];
                        for (var key in this.selected) {
                            files.push(this.selected[key])
                        }

                        if (files.filter(f_ => f_.path === f.path).length == 0) {
                            files.push(f)
                        }

                        this.shareResource.setFiles(files)

                        this.menu.showBtn()
                        document.body.appendChild(this.menu)

                        let coords = getCoords(span)
                        this.menu.style.position = "absolute"
                        this.menu.__top__ = coords.top + 5
                        this.menu.style.top = coords.top + 5 + "px"
                        this.menu.__left__ = coords.left + span.offsetWidth - 20
                        this.menu.style.left = coords.left + span.offsetWidth - 20 + "px"

                        this.menu.setFile(f)

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
                            this.rename(row, f, row.offsetTop + row.offsetHeight + 6)
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

                    if (this.shareResource.parentNode) {
                        this.shareResource.parentNode.removeChild(this.shareResource)
                    }

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
        dir.path = dir.path.split("\\").join("/")
        if (dir.name.startsWith(".") || !(dir.path.startsWith("/public") || public_[dir.path] != undefined || dir.path.startsWith("/shared") || shared[dir.path] != undefined || dir.path.startsWith("/applications/" + Application.application) || dir.path.startsWith("/users/" + Application.account.id))) {
            return;
        }

        this.div.innerHTML = "";
        let h = this.imageHeight; // the height of the image/icon div
        let w = this.imageHeight;
        let hiddens = {};

        let html = `
        <style>
            #container {
                background-color: var(--palette-background-default);
                display: flex;
                flex-direction: column;
                padding: 8px;
                /*min-height: 400px;*/
                height: 100%;
            }

            /** The file section */
            .file-type-section {
                display: flex;
                flex-direction: column;
            }

            .file-type-section .title{
                display: flex;
                align-items: center;
                font-size: 1.2rem;
                font-weight: 400;
                text-transform: uppercase;
                color: var(--palette-text-secondary);
                border-bottom: 2px solid;
                border-color: var(--palette-divider);
                width: 66.66%;
                user-select: none;
            }
            
            .file-type-section .title iron-icon{
                height: 32px;
                width: 32px;
                user-select: none;
            }
             
            .file-type-section .title iron-icon:hover{
                cursor: pointer;
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

            #audio_playlist_div, #video_playlist_div {
                display: flex;
            }

            #video_playlist_div iron-icon {
                height: 24px;
                width: 24px;
                margin-left: 16px;
            }

            #audio_playlist_div iron-icon {
                height: 24px;
                width: 24px;
                margin-left: 16px;
            }


           
            /** Display icon div */
            .file-icon-div{
                display: flex;
                position: relative;
                flex-direction: column;
                margin: 5px;
                padding: 5px;
                padding-top:25px;
                border-radius: 2.5px;
                border: 1px solid var(--palette-background-paper);
                transition: background 0.2s ease,padding 0.8s linear;
                background-color: var(--palette-background-default);
                height: ${h}px;
                min-width: ${w}px;
                justify-content: center;
                align-items: center;
                position: relative;
                user-select: none;
            }

            .file-icon-div svg {
                height: 12px;
                fill: var(--palette-action-disabled);
                position: absolute;
                top: 8px;
                left: 32px;
                display: none;
                visibility: hidden;
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
                min-width: 50px;
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
               word-break: break-all;
               font-size: 0.85rem;
               padding: 5px;
               user-select: none;
            }

            .file-path {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                text-decoration: underline;
            }

            .file-path:hover {
                cursor: pointer;
            }

            .file-icon-div.active{
                filter: invert(10%);
            }

            globular-dropdown-menu {
                position: absolute;
                top: -1.5px;
                right: 0px;
                z-index: 100;
            }

            iron-icon {
                height: 48px;
                width: 48px;
            }

        </style>
        <div id="container" class="no-select">
        
        </div>
        `

        // Create the header.
        this.div.innerHTML = html
        this.container = this.div.querySelector(`#container`);

        this.container.onmouseleave = (evt) => {
            evt.stopPropagation()
        }

        this.container.onclick = (evt) => {
            evt.stopPropagation()
        }

        this.container.ondrop = (evt) => {
            evt.preventDefault()
            this.ondrop(evt)
        }

        this.container.ondragover = (evt) => {
            evt.preventDefault()
        }

        let filesByType = {};
        let size = ""
        let mime = "Dossier de fichiers"
        let icon = "icons:folder"

        // get the info div that will contain the information.
        for (let f of dir.files) {
            if (f.name == "audio.m3u") {
                dir.__audioPlaylist__ = f
            } else if (f.name == "video.m3u") {
                dir.__videoPlaylist__ = f
            } else {
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

                if (f.isDir && fileType.length == 0) {
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
                        <div class="title">${fileType} <span id="${fileType}_section_count" style="flex-grow: 1; padding-left: 5px;"> (${filesByType[fileType].length})</span> <div id="${fileType}_playlist_div"></div></div>
                        <div class="content" id="${fileType}_section"></div>
                    </div>
                    `

                    this.div.querySelector(`#container`).appendChild(range.createContextualFragment(html))
                    section = this.div.querySelector(`#${fileType}_section`)

                    let copyUrl = (path) => {
                        let globule = this._file_explorer_.globule

                        generatePeerToken(globule, token => {
                            let url = getUrl(globule)

                            path.split("/").forEach(item => {
                                let component = encodeURIComponent(item.trim())
                                if (component.length > 0) {
                                    url += "/" + component
                                }

                            })

                            if (this.menu.file.mime == "video/hls-stream") {
                                url += "/playlist.m3u8"
                            }

                            url += "?application=" + Model.application;
                            url += "&token=" + token;

                            copyToClipboard(url)

                            ApplicationView.displayMessage("url was copy to clipboard...", 3000)
                        })
                    }

                    if (fileType == "audio" || fileType == "video") {
                        let playlistDiv = this.div.querySelector(`#${fileType}_playlist_div`)

                        if (fileType == "audio") {
                            playlistDiv.innerHTML = `
                                <iron-icon id="refresh-audios-btn" icon="icons:refresh" title="refresh audios infos and playlist"></iron-icon>
                                <iron-icon id="download-audios-btn" icon="av:playlist-add-check" title="download new audio from the channel" style="display:none;"></iron-icon>
                                <iron-icon id="play-audios-btn" icon="av:queue-music" title="play audio files"></iron-icon>
                                <iron-icon id="copy-audios-playlist-lnk" icon="icons:link" title="copy playlist url"></iron-icon>
                            `
                            // Get reference to button...
                            let refreshAudiosBtn = playlistDiv.querySelector("#refresh-audios-btn")
                            let playAudiosBtn = playlistDiv.querySelector("#play-audios-btn")
                            let copyAudiosBtn = playlistDiv.querySelector("#copy-audios-playlist-lnk")
                            let downloadAudiosBtn = playlistDiv.querySelector("#download-audios-btn")
                            let globule = this._file_explorer_.globule
                            let playlist = null

                            generatePeerToken(globule, token => {
                                let rqst = new ReadFileRequest
                                rqst.setPath(dir.path + "/.hidden/playlist.json")
                                let stream = globule.fileService.readFile(rqst, {
                                    token: token,
                                    application: Model.application,
                                    domain: globule.domain,
                                    address: globule.config.address
                                })

                                let data = [];
                                stream.on("data", (rsp) => {
                                    data = mergeTypedArrays(data, rsp.getData());
                                });

                                stream.on("status", (status) => {
                                    if (status.code == 0) {
                                        uint8arrayToStringMethod(data, (str) => {
                                            playlist = JSON.parse(str)
                                            downloadVideosBtn.style.display = "block"
                                        });
                                    }
                                });
                            })

                            // Update videos from a channel.
                            downloadAudiosBtn.onclick = () => {

                                if (!playlist) {
                                    downloadAudiosBtn.style.display = "none"
                                    return
                                }

                                generatePeerToken(globule, token => {
                                    let rqst = new UploadVideoRequest
                                    rqst.setDest(playlist.path)
                                    rqst.setFormat(playlist.format)
                                    rqst.setUrl(playlist.url)

                                    let stream = this._file_explorer_.globule.fileService.uploadVideo(rqst, { application: Application.application, domain: this._file_explorer_.globule.domain, token: token })
                                    let pid = -1;

                                    // Here I will create a local event to be catch by the file uploader...
                                    stream.on("data", (rsp) => {
                                        if (rsp.getPid() != null) {
                                            pid = rsp.getPid()
                                        }

                                        // Publish local event.
                                        Model.eventHub.publish("__upload_link_event__", { pid: pid, path: playlist.path, infos: rsp.getResult(), done: false, lnk: playlist.url }, true);
                                    })

                                    stream.on("status", (status) => {
                                        if (status.code === 0) {
                                            Model.eventHub.publish("__upload_link_event__", { pid: pid, path: playlist.path, infos: "", done: true, lnk: playlist.url }, true);
                                        }
                                    });
                                })
                            }


                            refreshAudiosBtn.onclick = () => {
                                let rqst = new StartProcessVideoRequest
                                rqst.setPath(dir.path)
                                let globule = this._file_explorer_.globule

                                generatePeerToken(globule, token => {
                                    globule.fileService.startProcessVideo(rqst, {
                                        token: token,
                                        application: Model.application,
                                        domain: globule.domain,
                                        address: globule.config.address
                                    }).then(() => {
                                        ApplicationView.displayMessage("playlist and audios informations are now updated", 3000)
                                    })
                                        .catch(err => ApplicationView.displayMessage(err, 3000))
                                })

                            }

                            copyAudiosBtn.onclick = () => {
                                copyUrl(dir.__audioPlaylist__.path)
                            }

                            playAudiosBtn.onclick = () => {
                                let audios = []
                                dir.files.forEach(f => {
                                    if (f.mime.startsWith("audio")) {
                                        if (f.audios) {
                                            audios = audios.concat(f.audios)
                                        }
                                    }
                                })
                                if (audios.length > 0) {
                                    playAudios(audios, dir.name)
                                } else {
                                    ApplicationView.displayMessage("no audio informations found to generate a playlist")
                                }

                            }

                        } else if (fileType == "video") {
                            playlistDiv.innerHTML = `
                                <iron-icon id="refresh-videos-btn" icon="icons:refresh" title="refresh video infos and playlist"></iron-icon>
                                <iron-icon id="download-videos-btn" icon="av:playlist-add-check" title="download new video from the channel" style="display:none;"></iron-icon>
                                <iron-icon id="play-videos-btn" icon="av:playlist-play" title="play video files"></iron-icon>
                                <iron-icon id="copy-videos-playlist-lnk" icon="icons:link" title="copy playlist url"></iron-icon>
                            `

                            // Get reference to button...
                            let downloadVideosBtn = playlistDiv.querySelector("#download-videos-btn")
                            let refreshVideosBtn = playlistDiv.querySelector("#refresh-videos-btn")
                            let playVideosBtn = playlistDiv.querySelector("#play-videos-btn")
                            let copyVideosBtn = playlistDiv.querySelector("#copy-videos-playlist-lnk")
                            let globule = this._file_explorer_.globule
                            let playlist = null

                            generatePeerToken(globule, token => {
                                let rqst = new ReadFileRequest
                                rqst.setPath(dir.path + "/.hidden/playlist.json")
                                let stream = globule.fileService.readFile(rqst, {
                                    token: token,
                                    application: Model.application,
                                    domain: globule.domain,
                                    address: globule.config.address
                                })

                                let data = [];
                                stream.on("data", (rsp) => {
                                    data = mergeTypedArrays(data, rsp.getData());
                                });

                                stream.on("status", (status) => {
                                    if (status.code == 0) {
                                        uint8arrayToStringMethod(data, (str) => {
                                            playlist = JSON.parse(str)
                                            downloadVideosBtn.style.display = "block"
                                        });
                                    }
                                });
                            })

                            // Update videos from a channel.
                            downloadVideosBtn.onclick = () => {

                                if (!playlist) {
                                    downloadVideosBtn.style.display = "none"
                                    return
                                }
                                generatePeerToken(globule, token => {
                                    let rqst = new UploadVideoRequest
                                    rqst.setDest(playlist.path)
                                    rqst.setFormat(playlist.format)
                                    rqst.setUrl(playlist.url)

                                    let stream = this._file_explorer_.globule.fileService.uploadVideo(rqst, { application: Application.application, domain: this._file_explorer_.globule.domain, token: token })
                                    let pid = -1;

                                    // Here I will create a local event to be catch by the file uploader...
                                    stream.on("data", (rsp) => {
                                        if (rsp.getPid() != null) {
                                            pid = rsp.getPid()
                                        }

                                        // Publish local event.
                                        Model.eventHub.publish("__upload_link_event__", { pid: pid, path: playlist.path, infos: rsp.getResult(), done: false, lnk: playlist.url }, true);
                                    })

                                    stream.on("status", (status) => {
                                        if (status.code === 0) {
                                            Model.eventHub.publish("__upload_link_event__", { pid: pid, path: playlist.path, infos: "", done: true, lnk: playlist.url }, true);
                                        }
                                    });
                                })
                            }

                            refreshVideosBtn.onclick = () => {
                                let rqst = new StartProcessVideoRequest
                                rqst.setPath(dir.path)
                                let globule = this._file_explorer_.globule

                                generatePeerToken(globule, token => {
                                    globule.fileService.startProcessVideo(rqst, {
                                        token: token,
                                        application: Model.application,
                                        domain: globule.domain,
                                        address: globule.config.address
                                    }).then(() => {
                                        ApplicationView.displayMessage("Playlist is updated. Informations will be update...", 3000)


                                    })
                                        .catch(err => ApplicationView.displayMessage(err, 3000))
                                })


                            }

                            copyVideosBtn.onclick = () => {
                                copyUrl(dir.__videoPlaylist__.path)
                            }

                            playVideosBtn.onclick = () => {
                                let videos = []
                                dir.files.forEach(f => {
                                    if (f.mime.startsWith("video")) {
                                        if (f.videos) {
                                            videos = videos.concat(f.videos)
                                        }
                                    }
                                })
                                if (videos.length > 0) {
                                    playVideos(videos, dir.name)
                                } else {
                                    ApplicationView.displayMessage("no video informations found to generate a playlist")
                                }
                            }

                        }
                    }
                } else if (section) {
                    this.div.querySelector(`#container`).querySelector(`#${fileType}_section_count`).innerHTML = ` (${section.children.length})`
                }

                // Now I will create the icon file view.
                filesByType[fileType].forEach(file => {
                    let id = "_" + getUuidByString(file.path + "/" + file.name);
                    if (!section.querySelector("#" + id)) {

                        let html = `
                        <div class="file-div" >
                            <div class="file-icon-div" id="${id}">
                                <paper-checkbox></paper-checkbox>
                                <div class="menu-div"></div>
                                <paper-ripple recenters></paper-ripple>
                                <svg title="keep file local" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M32 32C32 14.3 46.3 0 64 0H320c17.7 0 32 14.3 32 32s-14.3 32-32 32H290.5l11.4 148.2c36.7 19.9 65.7 53.2 79.5 94.7l1 3c3.3 9.8 1.6 20.5-4.4 28.8s-15.7 13.3-26 13.3H32c-10.3 0-19.9-4.9-26-13.3s-7.7-19.1-4.4-28.8l1-3c13.8-41.5 42.8-74.8 79.5-94.7L93.5 64H64C46.3 64 32 49.7 32 32zM160 384h64v96c0 17.7-14.3 32-32 32s-32-14.3-32-32V384z"/></svg>
                            </div>
                            
                        </div>
                        `

                        section.appendChild(range.createContextualFragment(html))
                        let fileIconDiv = section.querySelector(`#${id}`)

                        // Now I will append the file name span...
                        let fileNameSpan = document.createElement("span")
                        fileNameSpan.style.maxWidth = "100px"

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

                        let thumbtack = fileIconDiv.querySelector("svg")
                        thumbtack.onclick = (evt) => {
                            evt.stopPropagation()
                            // Do stuff here...
                            File.hasLocal(file.path, exists => {
                                if (exists) {
                                    file.removeLocalCopy(() => {
                                        thumbtack.style.fill = ""
                                        thumbtack.style.display = "none";
                                        thumbtack.style.left = ""
                                    })
                                } else {
                                    file.keepLocalyCopy(() => {
                                        thumbtack.style.display = "block";
                                        thumbtack.style.left = "8px"
                                        thumbtack.style.fill = "var(--palette-primary-main)"
                                    })
                                }
                            })


                        }

                        // Here I will append the interation.
                        fileIconDiv.onmouseover = (evt) => {
                            evt.stopPropagation();
                            checkbox.style.display = "block"
                            thumbtack.style.display = "block"
                            if (File.hasLocal)
                                File.hasLocal(file.path, exist => {
                                    if (exist) {
                                        thumbtack.style.display = "block";
                                        thumbtack.style.left = ""
                                        thumbtack.style.fill = "var(--palette-primary-main)"
                                    }
                                })
                            fileIconDiv.classList.add("active")

                            fileIconDiv.appendChild(this.shareResource)

                            let files = [];
                            for (var key in this.selected) {
                                files.push(this.selected[key])
                            }
                            if (files.filter(f => f.path === file.path).length == 0) {
                                files.push(file)
                            }

                            this.shareResource.setFiles(files)

                            this.shareResource.style.position = "absolute"
                            this.shareResource.style.top = "0px";
                            this.shareResource.style.right = "20px";
                        }

                        fileIconDiv.onmouseleave = (evt) => {
                            evt.stopPropagation();
                            let checkbox = fileIconDiv.querySelector("paper-checkbox")
                            if (!checkbox.checked) {
                                checkbox.style.display = "none"
                            }

                            if (this.shareResource.parentNode) {
                                this.shareResource.parentNode.removeChild(this.shareResource)
                            }

                            let fileIconDivs = this.div.querySelectorAll(".file-icon-div")
                            for (var i = 0; i < fileIconDivs.length; i++) {
                                fileIconDivs[i].classList.remove("active")
                            }

                            thumbtack.style.display = "none"

                            if (File.hasLocal)
                                File.hasLocal(file.path, exist => {
                                    if (exist) {
                                        thumbtack.style.display = "block";
                                        thumbtack.style.left = "8px"
                                        thumbtack.style.fill = "var(--palette-primary-main)"
                                    }
                                })
                        }

                        // video or audio file can be keep localy
                        if ((file.mime.startsWith("video") || file.mime.startsWith("audio")) && file.mime != "video/hls-stream") {


                            if (File.hasLocal) {
                                thumbtack.style.visibility = "visible"
                                File.hasLocal(file.path, exist => {
                                    if (exist) {
                                        thumbtack.style.display = "block";
                                        thumbtack.style.left = "8px"
                                        thumbtack.style.fill = "var(--palette-primary-main)"
                                    }
                                })
                            }
                        }

                        if (fileType == "video") {

                            /** In that case I will display the vieo preview. */

                            let h = 72;

                            let preview = new VideoPreview(file, h, () => {
                                fileNameSpan.style.wordBreak = "break-all"
                                fileNameSpan.style.fontSize = ".85rem"
                                fileNameSpan.style.maxWidth = preview.width + "px"
                                if (file.videos) {
                                    if (file.videos.length > 0)
                                        fileNameSpan.innerHTML = file.videos[0].getDescription()
                                }

                            }, this._file_explorer_.globule)

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
                                    this.setImdbTitleInfo(url, file)
                                }
                            }


                            // Retreive the video title to display more readable file name...
                            if (file.videos) {
                                fileNameSpan.innerHTML = file.videos[0].getDescription()
                            } else {
                                getVideoInfo(this._file_explorer_.globule, file, videos => {
                                    if (videos.length > 0) {
                                        file.videos = videos // keep in the file itself...
                                        fileNameSpan.innerHTML = file.videos[0].getDescription()
                                    } else {

                                        if (file.titles) {
                                            let title = file.titles[0]
                                            let name = title.getName()

                                            if (title.getEpisode() > 0) {
                                                name += " S" + title.getSeason() + "-E" + title.getEpisode()
                                            }

                                            fileNameSpan.innerHTML = name
                                            fileNameSpan.title = file.path
                                        } else {
                                            // get the title infos...
                                            getTitleInfo(this._file_explorer_.globule, file, (titles) => {
                                                if (titles.length > 0) {
                                                    file.titles = titles // keep in the file itself...
                                                    let title = file.titles[0]
                                                    let name = title.getName()
                                                    if (title.getEpisode() > 0) {
                                                        name += " S" + title.getSeason() + "-E" + title.getEpisode()
                                                    }
                                                    fileNameSpan.innerHTML = name
                                                    fileNameSpan.title = file.path
                                                }
                                            })
                                        }
                                    }
                                })
                            }


                        } else if (file.isDir) {

                            // Here I will create a folder mosaic from the folder content...
                            let folderIcon = document.createRange().createContextualFragment(`<iron-icon icon="icons:folder"></iron-icon>`)
                            fileIconDiv.insertBefore(folderIcon, fileIconDiv.firstChild)


                            fileIconDiv.onclick = (evt) => {
                                evt.stopPropagation();
                                _publishSetDirEvent(file._path, this._file_explorer_)
                            }

                            folderIcon.draggable = false

                        } else if (file.thumbnail != undefined) {

                            /** Display the thumbnail. */
                            let img = document.createElement("img")
                            img.src = file.thumbnail
                            img.draggable = false

                            // The size of the span will be calculated in respect of the image size.
                            let getMeta = (url) => {
                                var img = new Image();
                                img.onload = function () {
                                    if (img.width > 0 && img.height > 0) {
                                        w = (img.width / img.height) * h
                                        fileNameSpan.style.maxWidth = w + "px"
                                        fileNameSpan.style.wordBreak = "break-all"
                                        fileNameSpan.style.fontSize = ".85rem"
                                        if (file.audios) {
                                            if (file.audios.length > 0)
                                                fileNameSpan.innerHTML = file.audios[0].getTitle()
                                        }

                                    }
                                };
                                img.src = url;
                            }

                            getMeta(file.thumbnail)

                            fileIconDiv.insertBefore(img, fileIconDiv.firstChild)

                            if (fileType == "image") {
                                img.onclick = (evt) => {
                                    evt.stopPropagation();
                                    Model.eventHub.publish("__show_image__", { file: file, file_explorer_id: this._file_explorer_.id }, true)
                                    this.menu.close()
                                    if (this.menu.parentNode)
                                        this.menu.parentNode.removeChild(this.menu)
                                }
                            } else if (fileType == "audio") {
                                img.onclick = (evt) => {
                                    evt.stopPropagation();
                                    Model.eventHub.publish("__play_audio__", { file: file, file_explorer_id: this._file_explorer_.id }, true)
                                    this.menu.close()
                                    if (this.menu.parentNode)
                                        this.menu.parentNode.removeChild(this.menu)
                                }



                            } else {
                                // here I will try the file viewer.
                                img.onclick = (evt) => {
                                    evt.stopPropagation();
                                    Model.eventHub.publish("__read_file__", { file: file, file_explorer_id: this._file_explorer_.id }, true)
                                    this.menu.close()
                                    if (this.menu.parentNode)
                                        this.menu.parentNode.removeChild(this.menu)

                                }
                            }

                            // display more readable name.
                            if (file.audios) {
                                fileNameSpan.innerHTML = file.audios[0].getTitle()
                                if (file.audios[0].getPoster())
                                    if (file.audios[0].getPoster().getContenturl().length > 0) {
                                        img.src = file.audios[0].getPoster().getContenturl()
                                    }
                            } else {
                                getAudioInfo(this._file_explorer_.globule, file, audios => {
                                    if (audios.length > 0) {
                                        file.audios = audios // keep in the file itself...
                                        fileNameSpan.innerHTML = file.audios[0].getTitle()
                                        if (file.audios[0].getPoster())
                                            if (file.audios[0].getPoster().getContenturl().length > 0) {
                                                img.src = file.audios[0].getPoster().getContenturl()
                                            }
                                    }
                                })
                            }
                        }

                        fileIconDiv.draggable = true;
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
                                evt.stopPropagation()

                                evt.preventDefault()
                                let url = evt.dataTransfer.getData("Url");
                                if (url.startsWith("https://www.imdb.com/title")) {
                                    this.setImdbTitleInfo(url, file)
                                } else if (evt.dataTransfer.files.length > 0) {
                                    // So here I will simply upload the files...
                                    Model.eventHub.publish("__upload_files_event__", { path: file.path, files: evt.dataTransfer.files }, true)
                                } else {
                                    let f = evt.dataTransfer.getData('file')
                                    let id = evt.dataTransfer.getData('id')
                                    fileIconDiv.children[0].icon = "icons:folder"

                                    // Create drop_file_event...
                                    if (f != undefined && id.length > 0) {
                                        Model.eventHub.publish("drop_file_event", { file: f, dir: file.path, id: id }, true)
                                    }
                                }
                            }
                        }


                        fileNameSpan.innerHTML = file.name;
                        fileIconDiv.parentNode.appendChild(fileNameSpan);

                        fileIconDiv.onmouseenter = (evt) => {
                            evt.stopPropagation();


                            let thumbtacks = this.div.querySelectorAll("svg")
                            for (var i = 0; i < thumbtacks.length; i++) {
                                if (thumbtacks[i].style.fill == "var(--palette-primary-main)") {
                                    thumbtacks[i].style.left = "8px"
                                } else {
                                    thumbtacks[i].style.display = "none"
                                    thumbtacks[i].style.left = ""
                                }
                            }


                            if (File.hasLocal) {
                                thumbtack.style.display = "block";
                                File.hasLocal(file.path, exist => {
                                    if (exist) {
                                        thumbtack.style.display = "block";
                                        thumbtack.style.left = ""
                                        thumbtack.style.fill = "var(--palette-primary-main)"
                                    }
                                })
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

                            fileIconDiv.classList.add("active")

                            // display the actual checkbox...
                            checkbox.style.display = "block"


                            fileIconDiv.appendChild(this.shareResource)

                            let files = [];
                            for (var key in this.selected) {
                                files.push(this.selected[key])
                            }

                            if (files.filter(f => f.path === file.path).length == 0) {
                                files.push(file)
                            }

                            this.shareResource.setFiles(files)

                            this.shareResource.style.position = "absolute"
                            this.shareResource.style.top = "0px";
                            this.shareResource.style.right = "20px";

                            document.body.appendChild(this.menu)


                            if (!this.menu.isOpen()) {
                                this.menu.showBtn()
                                //fileIconDiv.parentNode.appendChild(this.menu)

                                let coords = getCoords(fileIconDiv.parentNode)
                                this.menu.style.position = "absolute"
                                this.menu.__top__ = coords.top + 8
                                this.menu.style.top = coords.top + 8 + "px"
                                this.menu.__left__ = coords.left + fileIconDiv.offsetWidth - 20
                                this.menu.style.left = coords.left + fileIconDiv.offsetWidth - 20 + "px"

                                this.menu.onmouseover = (evt) => {
                                    evt.stopPropagation();
                                    fileIconDiv.classList.add("active")
                                }

                                this.menu.onmouseout = (evt) => {
                                    evt.stopPropagation();
                                    fileIconDiv.classList.remove("active")
                                }

                                this.menu.setFile(file)

                                // set the rename function.
                                this.menu.rename = () => {
                                    this.rename(fileIconDiv, file, fileIconDiv.offsetHeight + 6)
                                }
                            }
                        }
                    }
                })
            }
        }
    }

    /**
     * Set file info, this will made use of the search engine...
     */
    setFileInfo(info, file) {
        let rqst = new CreateTitleRequest
        let title = new Title

        // init person infos...
        let createPersons = (values) => {
            let persons = []
            if (values != undefined) {
                values.forEach(v => {
                    let p = new Person
                    p.setId(v.ID)
                    p.setUrl(v.URL)
                    p.setFullname(v.FullName)
                    persons.push(p)
                })
            }

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

        // Set TVEpisode Season and Episode number.
        if (info.Type == "TVEpisode") {
            title.setSeason(info.Season)
            title.setEpisode(info.Episode)
            title.setSerie(info.Serie)
        }

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

        let indexPath = this._file_explorer_.globule.config.DataPath + "/search/titles"
        rqst.setIndexpath(indexPath)
        rqst.setTitle(title)

        // Now I will create the title info...
        this._file_explorer_.globule.titleService.createTitle(rqst, { application: Application.application, domain: this._file_explorer_.globule.domain, token: localStorage.getItem("user_token") })
            .then(rsp => {
                // Now I will asscociated the file and the title.
                let rqst_ = new AssociateFileWithTitleRequest
                rqst_.setFilepath(file.path)
                rqst_.setTitleid(title.getId())
                rqst_.setIndexpath(indexPath)

                this._file_explorer_.globule.titleService.associateFileWithTitle(rqst_, { application: Application.application, domain: this._file_explorer_.globule.domain, token: localStorage.getItem("user_token") })
                    .then(rsp => {
                    }).catch(err => ApplicationView.displayMessage(err, 3000))

            }).catch(err => ApplicationView.displayMessage(err, 3000))
    }


    // Set imdb title info.
    setImdbTitleInfo(url, file) {

        let matchs = url.match(/tt\d{5,8}/);
        if (matchs.length == 0) {
            return // nothing to todo...
        }

        getImdbInfo(matchs[0], (info) => {
            // So here I will get the information from imdb and propose to assciate it with the file.
            let toast = ApplicationView.displayMessage(`
                    <style>
                       
                    </style>
                    <div id="select-media-dialog">
                        <div>Your about to associate <span id="title-type" style="max-width: 300px;"></span> <a id="title-name" target="_blank"></a></div>
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


        }, err => ApplicationView.displayMessage(err, 3000), this._file_explorer_.globule)

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
        this.onerror = err => ApplicationView.displayMessage(err, 3000);

        // List of listeners...
        this.navigationListener = ""

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
            <style>
               

                #path-navigator-box{
                    flex-grow: 1;
                    background-color: var(--palette-background-default);
                    color: var(--palette-text-primary);
                    display: flex;
                    align-items: center;
                    user-select: none;
                    flex-wrap: wrap;
                    padding: 0px 5px 0px 5px;
                    margin-right: 10px;
                }

                .path-navigator-box-span{
                    display: inherit;
                    max-width: 350px;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                    overflow: hidden;
                    user-select: none;
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
        dir.path = dir.path.split("\\").join("/")
        if (this.path == dir._path || !(dir.path.startsWith("/public") || public_[dir.path] != undefined || dir.path.startsWith("/shared") || shared[dir.path] != undefined || dir.path.startsWith("/applications/" + Application.application) || dir.path.startsWith("/users/" + Application.account.id))) {
            return;
        }

        if (dir._mime == "stream.hls") {
            // Here I will simply return...
            return
        }

        let values = dir._path.split("/")
        // remove empty array...
        values = values.filter(element => {
            return element !== '';
        });

        // Clear actual values.
        this.div.innerHTML = "";
        this.path = dir._path;

        let index = 0;

        let path_ = ""

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
            if (dir.startsWith(Application.account.id)) {
                title.innerHTML = dir.replace(Application.account.id, Application.account.name)
            }


            // if the directory path sart with / ...
            if (index == 0) {
                if (this.path.startsWith("/")) {
                    path_ = "/" + dir
                } else {
                    path_ = dir
                }
            } else {
                path_ += "/" + dir
            }


            titleDiv.appendChild(title)
            let path__ = path_

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
                    directoriesDiv.style.zIndex = "1000";
                    directoriesDiv.style.top = title.offsetHeight + "px"
                    directoriesDiv.style.right = "0px"
                    directoriesDiv.style.backgroundColor = "var(--palette-background-paper)"
                    directoriesDiv.style.color = "var(--palette-text-primary)"

                    this._file_explorer_.displayWaitMessage("load " + path__)
                    _readDir(path__, (dir) => {

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
                    }, err => { console.log(err); file_explorer_.resume(); }, this._file_explorer_.globule)
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
                this._file_explorer_.displayWaitMessage("load " + path__)
                _readDir(path__, (dir) => {
                    this._file_explorer_.resume()
                    // Send read dir event.
                    _publishSetDirEvent(dir._path, this._file_explorer_)
                }, err => { this._file_explorer_.resume(); console.log(err); }, this._file_explorer_.globule)
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
        this.onerror = err => ApplicationView.displayMessage(err, 3000);

        // List of listeners...
        this.navigationListener = ""

        // Here I will keep the list of div in memory to be able to 
        // reload it...
        this.dirs = {}

        // The directory displayed in the navigator.
        this.dir = null

        // The root div.
        this.div = null

        // The control width
        this.width = 360

        this._file_explorer_ = null

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           

            #file-navigator-div{
                min-width: ${this.width}px;
                user-select: none;
            }

            /** On smaller display **/
            @media (max-width: 801px) {
                #file-navigator-div{
                    min-height: 150px;
                }
            }

            select {
                padding: 5px;
                background-color: var(--palette-background-default);
                color: var(--palette-text-primary);
                font-size: 1.0rem;
                font-family: var(--font-family);
                width: 100%;
                border: none;
                outline: none;
                scroll-behavior: smooth;
            }

        </style>

        <div id="file-navigator-div" style="">
            <select></select>
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

        // Set the peers list.
        let peers = Model.getGlobules()
        peers.forEach((p, index) => {
            let option = document.createElement("option")
            option.value = index
            option.innerHTML = p.domain
            this.shadowRoot.querySelector("select").appendChild(option)

        })


        // Select the peer.
        this.shadowRoot.querySelector("select").onchange = () => {
            let index = this.shadowRoot.querySelector("select").value

            this._file_explorer_.setGlobule(peers[index])

        }
    }

    // The connection callback.
    connectedCallback() {
        let index = 0
        let peers = Model.getGlobules()
        peers.forEach(p => {
            if (p.domain == this._file_explorer_.globule.domain) {
                this.shadowRoot.querySelector("select").value = index;
            }
            index++
        })

    }

    setFileExplorer(fileExplorer) {
        this._file_explorer_ = fileExplorer
    }

    hide() {
        this.div.style.display = "none"
    }

    show() {
        this.div.style.display = ""
    }

    // remove div and reload it from it content...
    reload(dir, callback) {
        if (this.dirs[this._file_explorer_.globule.domain + "@" + dir.path] != undefined) {
            let div = this.div.querySelector(`#${this.dirs[this._file_explorer_.globule.domain + "@" + dir.path].id}`)
            // force reading from the server...
            delete dirs[getUuidByString(this._file_explorer_.globule.domain + "@" + dir.path)]

            if (div != null) {
                let parent = div.parentNode
                let level = this.dirs[this._file_explorer_.globule.domain + "@" + dir.path].level
                if (div != null) {
                    parent.removeChild(div)
                    delete this.dirs[this._file_explorer_.globule.domain + "@" + dir.path]
                }
                // reload the div...
                this.initPublic(callback)
                dir.path = dir.path.split("\\").join("/")
                if (dir.path != "/public") {
                    this.initTreeView(dir, parent, level)
                }
            }
        }
    }


    // Init the tree view.
    initTreeView(dir, div, level) {

        if (dir.name.startsWith(".") || dir.mime == "video/hls-stream") {
            return;
        }

        if (div == undefined) {
            return
        }

        // old id value was dir.path.split("/").join("_").split("@").join("_")
        let id = "_" + getUuid(dir.path).split("-").join("_")

        // keep it in memory 
        this.dirs[this._file_explorer_.globule.domain + "@" + dir.path] = { id: id, level: level }

        // Remove existing values and renit the tree view...
        let dir_ = this.div.querySelector(`#${id}`)
        if (dir_ == undefined) {
            let name = dir.path.split("/").pop();
            if (name.startsWith(Application.account.id)) {
                // display more readable folder name...
                name = name.replace(Application.account.id, Application.account.name)
            }
            let offset = 10 * level
            let html = `
                <style>
                    #${id}:hover{
                        cursor: pointer;
                    }

                    .directory-lnk{
                        display: flex;
                        align-items: center;
                        overflow: hidden;
                    }

                    .directory-lnk iron-icon {
                        height: 24px;
                        width: 24px;
                    }

                    .folder-name-span{
                        max-width: 350px;
                        margin-left: 5px;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        user-select: none;

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
        if (shrinkBtn) {
            shrinkBtn.onmouseover = () => {
                shrinkBtn.style.cursor = "pointer"
            }

            shrinkBtn.onmouseleave = () => {
                shrinkBtn.style.cursor = "default"
            }
        }

        let expandBtn = this.shadowRoot.getElementById(id + "_expand_btn")
        if (expandBtn) {
            expandBtn.onmouseover = () => {
                expandBtn.style.cursor = "pointer"
            }

            expandBtn.onmouseleave = () => {
                expandBtn.style.cursor = "default"
            }
        }

        let dirLnk = this.shadowRoot.getElementById(id + "_directory_lnk")
        let dirIco = this.shadowRoot.getElementById(id + "_directory_icon")
        if (dirLnk) {
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
                if (f != undefined && id.length > 0) {
                    Model.eventHub.publish("drop_file_event", { file: f, dir: dir.path, id: id }, true)
                }
            }
        }

        let hasSubdir = false;
        let fileDiv = this.shadowRoot.getElementById(id + "_files_div")
        if (dir.mime != "video/hls-stream") {
            for (var f of dir._files) {
                if (f._isDir) {
                    this.initTreeView(f, fileDiv, level + 1);
                    hasSubdir = true;
                }
            }
        }

        // hide the button if no sub-document exist.
        if (expandBtn) {
            if (!hasSubdir) {
                expandBtn.style.visibility = "hidden"
            } else {
                expandBtn.style.visibility = "visible"
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

        }

        // Now actions.
        if (shrinkBtn) {
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
        }
        if (dirLnk) {
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

    }

    // Set the directory.
    setDir(dir, callback) {
        dir.path = dir.path.split("\\").join("/")
        if (this.dir == dir || !(dir.path.startsWith("/public") || public_[dir.path] != undefined || dir.path.startsWith("/shared") || shared[dir.path] != undefined || shared[dir.path] != undefined || dir.path.startsWith("/applications/" + Application.application) || dir.path.startsWith("/users/" + Application.account.id))) {
            return;
        }

        this.dir = dir;
        this.initTreeView(dir, this.userDiv, 0)

        // Init public list of directories
        this._file_explorer_.displayWaitMessage("load public content")
        this.initPublic(() => {
            this._file_explorer_.displayWaitMessage("load shared content")
            // Init shared...
            this.initShared((shared_, public_) => { if (callback) callback(shared_, public_); this._file_explorer_.resume() })
        })
    }

    // Init the public folder...
    initPublic(initCallback) {

        this.publicDiv.innerHTML = ""

        // The public directory will contain a list of directories readable by 
        // any use, permission can also be set on file and directories, but all is 
        // accessible by default.
        this.public_ = new File("public", "/public", true, this._file_explorer_.globule)
        this.public_.isDir = true;
        this.public_.files = [];
        this.public_.mime = "";
        this.public_.modeTime = new Date()

        Model.eventHub.subscribe("public_change_permission_event", uuid => { },
            evt => {
                // refresh the shared...
                this.initPublic()
            }, false, this)


        this._file_explorer_.globule.fileService.getPublicDirs(new GetPublicDirsRequest, { application: Application.application, domain: this._file_explorer_.globule.domain, token: localStorage.getItem("user_token") })
            .then(rsp => {
                let index = 0;
                let publicDirs = rsp.getDirsList()
                let initPublicDir = (callback, errorCallback) => {
                    if (publicDirs.length > 0) {
                        if (index < publicDirs.length) {
                            let path = publicDirs[index]
                            // Read the dir content (files and directory informations.)
                            _readDir(path, dir => {
                                this._file_explorer_.resume()
                                // used by set dir...
                                markAsPublic(dir, path)
                                this.public_.files.push(dir)
                                index++
                                initPublicDir(callback, err => ApplicationView.displayMessage(err, 3000))
                            }, err => ApplicationView.displayMessage(err, 3000), this._file_explorer_.globule, true)

                        } else {
                            callback()
                        }
                    } else {
                        callback()
                    }
                }

                // Init
                initPublicDir(() => {
                    let key = getUuidByString(this._file_explorer_.globule.domain + "@" + "/public")
                    dirs[key] = this.public_
                    this.initTreeView(this.public_, this.publicDiv, 0)
                    if (initCallback) {
                        initCallback()
                    }
                })
            })
    }



    // Init shared folders
    initShared(initCallback) {

        this.sharedDiv.innerHTML = ""
        this.shared = {}

        // keep track of all sub-dir...
        shared = {}

        // The public directory will contain a list of directories readable by 
        // any use, permission can also be set on file and directories, but all is 
        // accessible by default.
        this.shared_ = new File("shared", "/shared", true, this._file_explorer_.globule)
        this.shared_.isDir = true;
        this.shared_.files = [];
        this.shared_.mime = "";
        this.shared_.modeTime = new Date()

        // Init the share info
        let initShared = (share, callback) => {
            // Try to get the user id...
            let userId = share.getPath().split("/")[2];
            console.log("--------------->   share: ", share)
            if (userId == Application.account.id || userId == Application.account.id + "@" + Application.account.domain) {
                callback()
                return // I will not display it...
            } else if (userId.indexOf("@") != -1) {

                Account.getAccount(userId, user => {

                    if (this.shared[userId] == undefined) {
                        this.shared[userId] = new File(userId, "/shared/" + userId, true, this._file_explorer_.globule)
                        this.shared[userId].isDir = true;
                        this.shared[userId].files = [];
                        this.shared[userId].mime = "";
                        this.shared[userId].modeTime = new Date()
                        this.shared_.files.push(this.shared[userId])

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
                        if (this.shared[userId]) {
                            if (this.shared[userId].files.find(f => f.path == dir.path) == undefined) {
                                this.shared[userId].files.push(dir)
                            }
                        }
                        callback()
                    }, err => {
                        // The file is not a directory so the file will simply put in the share.
                        this._file_explorer_.resume();
                        if (err.message.indexOf("is not a directory") != -1) {
                            File.getFile(this._file_explorer_.globule, share.getPath(), 100, 64,
                                (f) => {
                                    if (f.path.indexOf(".hidden") != -1) {
                                        // In that case I need to append the file in a local dir named hidden.
                                        let hiddenDir = null;
                                        this.shared[userId].files.forEach(f => {
                                            if (f.name == ".hidden") {
                                                hiddenDir = f
                                            }
                                        })
                                        if (hiddenDir == null) {
                                            hiddenDir = new File(".hidden", "/shared/" + userId + "/.hidden", true, this._file_explorer_.globule)
                                            hiddenDir.isDir = true
                                            hiddenDir.modeTime = new Date()
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
                                        }
                                    }
                                    callback()
                                }, err => ApplicationView.displayMessage(err, 3000))
                        }
                    }, this._file_explorer_.globule)
                }, err => {
                    callback()
                })
            } else {
                callback()
            }
        }


        if (Application.account == undefined) {
            return // nothing to do here...
        }

        // The account...
        let rqst = new GetSharedResourceRqst
        rqst.setSubject(Application.account.id + "@" + Application.account.domain)
        rqst.setType(SubjectType.ACCOUNT)

        // Get file shared by account.
        let globule = this._file_explorer_.globule
        generatePeerToken(globule, token => {
            globule.rbacService.getSharedResource(rqst, { application: Application.application, domain: globule.domain, token: token })
                .then(rsp => {
                    // Here I need to sync the funtion and init the tree view once all is done...
                    let callback = () => {
                        let s = rsp.getSharedresourceList().pop()

                        if (s != undefined) {
                            initShared(s, callback)
                        } else {

                            for (const id in this.shared) {
                                let shared = this.shared[id]
                                // this.initTreeView(shared, this.sharedDiv, 0)
                                this.initTreeView(this.shared_, this.sharedDiv, 0)
                                delete dirs[getUuidByString(this._file_explorer_.globule.domain + "@" + shared.path)]
                            }

                            if (initCallback)
                                initCallback(this.shared, this.public_)

                        }
                    }

                    callback(); // call once
                })
                .catch(e => ApplicationView.displayMessage(e, 3000))
        })

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
    constructor(globule) {
        super()

        // the default globule
        this.globule = Model.globular
        if (globule) {
            this.globule = globule;
        }

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
        this.onerror = err => ApplicationView.displayMessage(err, 3000);

        // The function is call when the explorer is call
        this.onclose = undefined;
        this.isOpen = false;

        // This function is call when the explorer is open.
        this.onopen = undefined;

        // Event listener...
        this.listeners = {}

        // Interface elements...
        // The main explorer button
        this._file_explorer_Box = undefined
        this._file_explorer_OpenBtn = undefined
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
        paperTray = undefined;

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ::-webkit-scrollbar {
                width: 5px;
                height: 5px;
            }
                
            ::-webkit-scrollbar-track {
                background: var(--palette-background-default);
            }
            
            ::-webkit-scrollbar-thumb {
                background: var(--palette-divider); 
            }

            paper-card{
                background-color: var(--palette-background-paper);
                color: var(--palette-text-primary);
            }

            paper-icon-button:hover{
                cursor: pointer;
            }

            #file-navigation-panel{
                background-color: var(--palette-background-default);
                color: var(--palette-text-primary);
            }

            #file-selection-panel{
                flex-grow: 1;
                background-color: var(--palette-background-default);
                color: var(--palette-text-primary);
                position: relative;
            }

            #file-explorer-content{
                display: flex;
                padding: 0px;
                flex-direction: column;
                position: relative;
                height: calc(100% - 90px);
            }

            paper-card{
                font-size: 1.0rem;
                overflow: hidden;
            }

            .card-header, .card-actions{
                display: flex;
                align-items: center;
            }

            .card-actions{
                border-color: var(--palette-divider);
                --iron-icon-fill-color: var(--palette-text-accent);
                
            }

            paper-button {
                font-size: 1rem;
            }

            .card-header{
                color: var(--palette-text-accent);
                background-color: var(--palette-primary-accent);
            }

            .card-header .title {
                flex-grow: 1;
                text-align: center;
                user-select: none;
            }

            #file-explorer-layout{
                display: flex; 
                flex-grow: 1;
                overflow: hidden;
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
                overflow: auto;
                z-index: 100;
            }

            #enter-full-screen-btn:hover{
                cursor: pointer;
            }

            #exit-full-screen-btn:hover{
                cursor: pointer;
            }

            #move-handle:hover{
                cursor: move; /* fallback if grab cursor is unsupported */
                cursor: grab;
                cursor: -moz-grab;
                cursor: -webkit-grab;
            }

            #file-navigation-header{
                color: var(--palette-text-accent);
                background-color: var(--palette-primary-accent);
                display: flex; 
                align-items: center; 
                border-bottom: 1px solid var(--palette-divider);
            }

            #file-explorer-box{
                position: relative; 
                flex-direction: column; 
                background-color: transparent;
                border-left: 1px solid var(--palette-divider); 
                border-right: 1px solid var(--palette-divider);
                border-top: 1px solid var(--palette-divider);
                min-height: 350px;
                min-width: 500px;
                max-height: calc(100vh - 60px);
            }

            #file-navigation-panel{
                border-bottom: 1px solid var(--palette-divider); 
            }

            #progress-div{
                position: absolute; 
                bottom: 0px; 
                left: 10px;
                right: 0px;
                display: none; 
                font-size: 0.85rem;
                background-color: var(--palette-background-default);
            }

            @media (max-width: 500px) {
               
                .footer{
                    width: calc(100vw - 35px);
                    bottom: 0px;
                    position: fixed;
                }

                #file-explorer-content {
                    margin-bottom: 40px;
                }

                #enter-full-screen-btn{
                    display: none;
                }

            }

        </style>
        <paper-card id="file-explorer-box" class="file-explorer" style="">
            <div class="card-header">
                <paper-icon-button icon="icons:close" id="file-explorer-box-close-btn" style="--iron-icon-fill-color: var(--palette-text-accent);"></paper-icon-button>
                <span id="move-handle" class="title">File Explorer</span>
                <div class="card-actions">
                    <paper-icon-button id="navigation-cloud-upload-btn" icon="icons:cloud-upload"></paper-icon-button>
                    <paper-icon-button id="navigation-create-dir-btn" icon="icons:create-new-folder"></paper-icon-button>
                    <paper-icon-button id="navigation-refresh-btn" icon="icons:refresh"></paper-icon-button>
                    <paper-icon-button icon="icons:fullscreen" style="--iron-icon-fill-color: var(--palette-text-accent);background-color: var(--palette-primary-accent);" id="enter-full-screen-btn"></paper-icon-button>
                </div>
            </div>
            <div id="file-explorer-content" class="card-content no-select">
                <div id="file-navigation-header">
                    <div id="btn-group-0" style="display: flex;">
                        <paper-icon-button id="navigation-back-btn" icon="icons:icons:arrow-back"></paper-icon-button>
                        <paper-icon-button id="navigation-foward-btn" icon="icons:arrow-forward"></paper-icon-button>
                        <div style="position: relative;">
                            <iron-icon id="navigation-lst-btn" icon="icons:expand-more" style="--iron-icon-fill-color:var(--palette-action-active); display: none; height: 16px;"></iron-icon>
                        </div>
                        <paper-icon-button id="navigation-upward-btn" icon="icons:arrow-upward"></paper-icon-button>
                    </div>
                    <globular-path-navigator id="globular-path-navigator" style="flex-grow: 1;"></globular-path-navigator>
                </div>
                <globular-split-view id="file-explorer-layout">
                    <globular-split-pane id="file-navigation-panel" style="width: 360px;">
                        <globular-file-navigator id="globular-file-navigator"></globular-file-navigator>

                    </globular-split-pane>
                    <globular-split-pane id="file-selection-panel" style="position: relative;">
                        <slot></slot>
                        <div id="progress-div">
                            <div style="diplay:flex; flex-direction: column; width: 100%;">
                                <span id="progress-message">wait...</span>
                                <paper-progress id="globular-dir-loading-progress-bar" indeterminate style="width: 100%;"></paper-progress>
                            </div>
                        </div>
                    </globular-split-pane>
                </globular-split-view>
            </div>
            <div class="card-actions footer" style="background-color: var(--palette-background-paper);">
                <paper-icon-button icon="icons:fullscreen-exit" id="exit-full-screen-btn" style="display: none;"></paper-icon-button>
                <globular-disk-space-manager account="${Application.account.id + "@" + Application.account.domain}"></globular-disk-space-manager>
                <span style="flex-grow: 1;"></span>
                <paper-icon-button id="files-icon-btn" class="active" icon="icons:view-module" style="--iron-icon-fill-color: var(--palette-action-active);"></paper-icon-button>
                <paper-icon-button id="files-list-btn" icon="icons:view-list" style="--iron-icon-fill-color: var(--palette-action-disabled);"></paper-icon-button>
                <globular-files-uploader></globular-files-upsetVerticalloader>
            </div>
        </paper-card>
        `

        // Give information about loading data...
        this.progressDiv = this.shadowRoot.querySelector("#progress-div")
        this.diskSpaceManager = this.shadowRoot.querySelector("globular-disk-space-manager")
        this.diskSpaceManager.account = Application.account;
        this.diskSpaceManager.globule = this.globule

        // enter full screen and exit full screen btn
        this.enterFullScreenBtn = this.shadowRoot.querySelector("#enter-full-screen-btn")
        this.exitFullScreenBtn = this.shadowRoot.querySelector("#exit-full-screen-btn")

        // The main explorer button
        this._file_explorer_Box = this.shadowRoot.querySelector("#file-explorer-box")
        this.fileExplererCloseBtn = this.shadowRoot.querySelector("#file-explorer-box-close-btn")

        let offsetTop = this.shadowRoot.querySelector(".card-header").offsetHeight
        if (offsetTop == 0) {
            offsetTop = 60
        }

        this.name = "file_explorer"

        setMoveable(this.shadowRoot.querySelector("#move-handle"), this, (left, top) => {
            if (this.filesListView.menu.parentNode) {
                this.filesListView.menu.parentNode.removeChild(this.filesListView.menu)
                this.filesListView.menu.close()
            }
            if (this.filesIconView.menu.parentNode) {
                this.filesIconView.menu.parentNode.removeChild(this.filesIconView.menu)
                this.filesIconView.menu.close()
            }
        }, this, offsetTop)

        if (localStorage.getItem("__file_explorer_dimension__")) {

            let dimension = JSON.parse(localStorage.getItem("__file_explorer_dimension__"))
            if (!dimension) {
                dimension = { with: 600, height: 400 }
            }
            // be sure the dimension is no zeros...
            if (dimension.width < 600) {
                dimension.width = 600
            }

            if (dimension.height < 400) {
                dimension.height = 400
            }

            this.shadowRoot.querySelector("#file-explorer-box").style.width = dimension.width + "px"
            this.shadowRoot.querySelector("#file-explorer-box").style.height = dimension.height + "px"
            localStorage.setItem("__file_explorer_dimension__", JSON.stringify({ width: dimension.width, height: dimension.height }))
        } else {
            this.shadowRoot.querySelector("#file-explorer-box").style.width = "600px"
            this.shadowRoot.querySelector("#file-explorer-box").style.height = "400px"
            localStorage.setItem("__file_explorer_dimension__", JSON.stringify({ width: 600, height: 400 }))
        }

        let fileExplorerBox = this.shadowRoot.querySelector("#file-explorer-box")
        fileExplorerBox.name = "file_explorer"

        setResizeable(fileExplorerBox, (width, height) => {
            // fix min size.
            if (height < 400) {
                height = 400
            }

            if (width < 600) {
                width = 600
            }

            if (this.filesListView.menu.parentNode) {
                this.filesListView.menu.parentNode.removeChild(this.filesListView.menu)
                this.filesListView.menu.close()
            }
            if (this.filesIconView.menu.parentNode) {
                this.filesIconView.menu.parentNode.removeChild(this.filesIconView.menu)
                this.filesIconView.menu.close()
            }

            localStorage.setItem("__file_explorer_dimension__", JSON.stringify({ width: width, height: height }))
        })

        let fileExplorerLayout = fileExplorerBox.querySelector("#file-explorer-layout")

        // set the css value to display the playlist correctly...
        window.addEventListener("resize", (evt) => {
            let w = ApplicationView.layout.width();
            if (w <= 500) {
                fileExplorerBox.style.height = "calc(100vh - 60px)"
                fileExplorerBox.style.overflowY = "auto"
                fileExplorerBox.style.top = "0px"
                fileExplorerBox.style.left = "0px"
                fileExplorerBox.querySelector("#file-navigation-panel").style.width = "calc(100vw - 10px)"
                fileExplorerBox.querySelector("#file-explorer-layout").style.width = "calc(100vw - 10px)"
                fileExplorerBox.querySelector("#file-explorer-content").style.width = "calc(100vw - 10px)"
                fileExplorerBox.querySelector("#file-navigation-header").style.flexDirection = "column"
                fileExplorerBox.querySelector("#file-navigation-header").style.alignItems = "flex-start"
                fileExplorerBox.querySelector("#file-navigation-panel").style.height = "160px"
                this.shadowRoot.querySelector(".card-header").style.width = "calc(100vw - 10px)"
                this.shadowRoot.querySelector("#btn-group-0").style.display = "none"
                fileExplorerLayout.setVertical()
            } else {
                this.shadowRoot.querySelector(".card-header").style.width = ""
                fileExplorerBox.querySelector("#file-navigation-header").style.alignItems = ""
                fileExplorerBox.querySelector("#file-navigation-header").style.flexDirection = ""
                fileExplorerBox.querySelector("#file-explorer-content").style.width = ""
                fileExplorerBox.querySelector("#file-explorer-layout").style.width = ""
                fileExplorerBox.querySelector("#file-navigation-panel").style.width = "360px"
                fileExplorerBox.querySelector("#file-navigation-panel").style.height = "100%"
                this.shadowRoot.querySelector("#btn-group-0").style.display = "flex"
                fileExplorerLayout.setHorizontal()
            }

        })

        // The file view.
        //this.shadowRoot.querySelector("#globular-files-list-view")
        this.filesListView = new FilesListView()
        this.filesListView.id = "globular-files-list-view"
        this.filesListView.style.display = "none"
        this.appendChild(this.filesListView)

        // this.shadowRoot.querySelector("#globular-files-icon-view")
        this.filesIconView = new FilesIconView()
        this.filesIconView._active_ = true // true be default...
        this.filesIconView.id = "globular-files-icon-view"
        this.filesIconView.style.display = "none"
        this.appendChild(this.filesIconView)

        // Keep reference to the file explorer...
        this.filesListView._file_explorer_ = this.filesIconView._file_explorer_ = this

        // The permission manager
        this.permissionManager = new PermissionsManager()

        // The information manager
        this.informationManager = new InformationsManager()

        // The file uploader
        this.filesUploader = this.shadowRoot.querySelector("globular-files-uploader")
        this.filesUploader._file_explorer_ = this


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
        this._file_explorer_Content = this.shadowRoot.querySelector("#file-explorer-content")
        this.actionsCard = this.shadowRoot.querySelector("#card-actions")

        this.isFullScreen = false;

        // I will use the resize event to set the size of the file explorer.
        this.exitFullScreenBtn.onclick = () => {

            this.style.top = this.__top__ + "px"
            this.style.left = this.__left__ + "px"

            this.enterFullScreenBtn.style.display = "block"
            this.exitFullScreenBtn.style.display = "none"
            this.style.bottom = ""
            this.style.right = ""
            this.style.marginTop = "0px";
            this.style.bottom = "";
            this.style.right = "";
            this.style.width = "";
            let box = this.shadowRoot.querySelector("#file-explorer-box")
            box.style.width = this.width_ + "px";
            if (this.height_ > document.offsetHeight - 75) {
                this.height_ = document.offsetHeight - 75
            }

            box.style.height = this.height_ + "px";
            this.isFullScreen = false

            window.dispatchEvent(new Event('resize'));
        }

        this.enterFullScreenBtn.onclick = () => {

            //
            this.__top__ = this.offsetTop
            this.__left__ = this.offsetLeft

            this.isFullScreen = true
            this.style.top = "60px"
            this.style.bottom = "0px"
            this.style.right = "0px"
            this.style.marginTop = "64px";
            this.style.top = "0px";
            this.style.bottom = "0px";
            this.style.right = "0px";
            this.style.left = "0px";
            // also take all the space...
            this.style.width = "100%";
            this.style.height = "calc(100% - 64px)";

            let box = this.shadowRoot.querySelector("#file-explorer-box")
            this.width_ = box.offsetWidth
            this.height_ = box.offsetHeight
            box.style.width = "100%";;
            box.style.height = "100%";;

            // set buttons.
            this.enterFullScreenBtn.style.display = "none"
            this.exitFullScreenBtn.style.display = "block"
        }

        // set reset full screen...
        this.ondblclick = () => {
            if (this.isFullScreen) {
                this.exitFullScreenBtn.click()
            } else {
                this.enterFullScreenBtn.click()
            }
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
            this.filesIconView._active_ = false
            this.filesListView._active_ = true
            this.fileReader.style.display = "none"
            this.filesListBtn.classList.add("active")
            this.fileIconBtn.classList.remove("active")
            this.filesListBtn.style.setProperty("--iron-icon-fill-color", "var(--palette-action-active)")
            this.fileIconBtn.style.setProperty("--iron-icon-fill-color", "var(--palette-action-disabled)")

            if (this.filesListView.menu.parentNode) {
                this.filesListView.menu.parentNode.removeChild(this.filesListView.menu)
                this.filesListView.menu.close()
            }

            if (this.filesIconView.menu.parentNode) {
                this.filesIconView.menu.parentNode.removeChild(this.filesIconView.menu)
                this.filesIconView.menu.close()
            }

        }

        this.fileIconBtn.onclick = (evt) => {
            evt.stopPropagation();
            this.imageViewer.style.display = "none"
            this.filesListBtn.classList.remove("active")
            this.fileIconBtn.classList.add("active")
            this.filesIconView._active_ = true
            this.filesListView._active_ = false
            this.filesListView.style.display = "none"
            this.filesIconView.style.display = ""
            this.fileReader.style.display = "none"
            this.filesListBtn.style.setProperty("--iron-icon-fill-color", "var(--palette-action-disabled)")
            this.fileIconBtn.style.setProperty("--iron-icon-fill-color", "var(--palette-action-active)")

            if (this.filesListView.menu.parentNode) {
                this.filesListView.menu.parentNode.removeChild(this.filesListView.menu)
                this.filesListView.menu.close()
            }

            if (this.filesIconView.menu.parentNode) {
                this.filesIconView.menu.parentNode.removeChild(this.filesIconView.menu)
                this.filesIconView.menu.close()
            }
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

                    paper-card{
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
            if (this._file_explorer_Content.querySelector("#new-dir-dialog") == undefined) {
                let range = document.createRange()
                this._file_explorer_Content.appendChild(range.createContextualFragment(html))
            }

            let input = this._file_explorer_Content.querySelector("#new-dir-input")
            setTimeout(() => {
                input.focus()
                input.inputElement.textarea.select();
            }, 50)

            let cancel_btn = this._file_explorer_Content.querySelector("#new-dir-cancel-btn")
            let create_btn = this._file_explorer_Content.querySelector("#new-dir-create-btn")

            // simply remove the dialog
            cancel_btn.onclick = (evt) => {
                evt.stopPropagation();
                let dialog = this._file_explorer_Content.querySelector("#new-dir-dialog")
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
                let dialog = this._file_explorer_Content.querySelector("#new-dir-dialog")
                dialog.parentNode.removeChild(dialog)

                // if the current directory is the public dir...
                if (this.path == "/public") {
                    // Here I will add public directory...
                    const rqst = new AddPublicDirRequest
                    rqst.setPath(input.value)
                    let token = localStorage.getItem("user_token");

                    // Create a directory at the given path.
                    this.globule.fileService
                        .addPublicDir(rqst, {
                            token: token,
                            application: Application.application,
                            domain: this.globule.domain
                        })
                        .then(() => {
                            // The new directory was created.
                            Model.publish("reload_dir_event", this.path, false);
                        })
                        .catch((err) => {
                            ApplicationView.displayMessage(err, 3000)
                        });

                } else {
                    // Here I will create a new folder...
                    // Set the request.
                    const rqst = new CreateDirRequest();
                    rqst.setPath(this.path);
                    rqst.setName(input.value);
                    let token = localStorage.getItem("user_token");

                    // Create a directory at the given path.
                    this.globule.fileService
                        .createDir(rqst, {
                            token: token,
                            application: Application.application,
                            domain: this.globule.domain
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

        }

        // Refresh the root directory and send event to
        // refresh all the interface.
        this.refreshBtn.onclick = () => {
            Model.publish("reload_dir_event", this.path, false);
        }


        if (this.hasAttribute("maximized")) {
            this._file_explorer_OpenBtn.click();
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


        // init the list of peers.
        this.fileNavigator.setFileExplorer(this)

        fireResize()
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

    setGlobule(globule) {
        shared = {}
        public_ = {}
        this.globule = globule
        this.shadowRoot.querySelector("globular-disk-space-manager").globule = globule
        this.permissionManager.globule = globule // set the globule for get permissions...

        this.init()
    }

    // Set the file explorer directory.
    init(callback) {
        // The file reader
        if (this.fileReader) {
            this.fileReader.parentNode.removeChild(this.fileReader)
        }

        this.fileReader = new GlobularFileReader()
        this.fileReader.id = "#globular-file-reader"
        this.fileReader.style.display = "none"
        this.appendChild(this.fileReader)

        // The image viewer
        if (this.imageViewer) {
            this.imageViewer.parentNode.removeChild(this.imageViewer)
        }

        this.imageViewer = new ImageViewer()
        this.imageViewer.id = "#globular-image-viewer"
        this.imageViewer.style.display = "none"
        this.appendChild(this.imageViewer)

        // Init the path navigator
        this.pathNavigator.init();

        // Init the files views
        this.filesListView.init();
        this.filesIconView.init();

        // Init file upload event listener...
        this.filesUploader.init();

        // set the available space on the globule.
        this.shadowRoot.querySelector("globular-disk-space-manager").refresh()

        if (this.listeners["__set_dir_event__"] == undefined) {

            Model.eventHub.subscribe("__set_dir_event__",
                (uuid) => {
                    this.listeners["__set_dir_event__"] = uuid;
                },
                (evt) => {
                    // keep the active path.
                    if (this.id == evt.file_explorer_id) {
                        // remove actual context and set back the default files view.
                        if (this.informationManager) {
                            if (this.informationManager.parentNode)
                                this.informationManager.parentNode.removeChild(this.informationManager)
                        }

                        this.fileReader.style.display = "none"
                        this.imageViewer.style.display = "none";
                        this.permissionManager.style.display = "none"

                        this.setDir(evt.path)

                    }
                }, true
            )
        }

        // Service configuration change event...

        if (this.listeners[`update_globular_service_configuration_${this.globule.domain}_evt`] == undefined) {
            this.globule.eventHub.subscribe(`update_globular_service_configuration_evt`,
                (uuid) => {
                    this.listeners[`update_globular_service_configuration_${this.globule.domain}_evt`] = uuid;
                }, (event) => {
                    let config = JSON.parse(event)
                    if (config.Name == "file.FileService") {

                    }

                }, false, this)
        }

        // File rename event.
        if (this.listeners[`file_rename_${this.globule.domain}_event`] == undefined) {
            this.globule.eventHub.subscribe("file_rename_event",
                (uuid) => {
                    this.listeners[`file_rename_${this.globule.domain}_event`] = uuid;
                }, (path) => {
                    if (path.startsWith(this.getRoot())) {
                        _publishSetDirEvent(this.path, this)
                    }
                }, false, this)
        }

        // Permissions 
        if (this.listeners[`display_permission_manager_${this.globule.domain}_event`] == undefined) {
            this.globule.eventHub.subscribe(`display_permission_manager_event`,
                (uuid) => {
                    this.listeners[`display_permission_manager_${this.globule.domain}_event`] = uuid;
                }, (path) => {

                    this.permissionManager.permissions = null
                    this.permissionManager.setPath(path)
                    this.permissionManager.setResourceType = "file"
                    this.permissionManager.style.display = ""

                    // I will display the permission manager.
                    this.fileSelectionPanel.appendChild(this.permissionManager)

                }, false)
        }

        // Informations
        if (this.listeners[`display_media_infos_${this.globule.domain}_event`] == undefined) {
            this.globule.eventHub.subscribe(`display_media_infos_event`,
                (uuid) => {
                    this.listeners[`display_media_infos_${this.globule.domain}_event`] = uuid;
                }, (file) => {

                    if (file.titles != undefined) {
                        this.informationManager.setTitlesInformation(file.titles)
                    } else if (file.videos != undefined) {
                        this.informationManager.setVideosInformation(file.videos)
                    } else if (file.audios != undefined) {
                        this.informationManager.setAudiosInformation(file.audios)
                    }

                    // I will display the permission manager.
                    this.fileSelectionPanel.appendChild(this.informationManager)

                }, false)
        }

        if (this.listeners[`display_file_infos_${this.globule.domain}_event`] == undefined) {
            this.globule.eventHub.subscribe(`display_file_infos_event`,
                (uuid) => {
                    this.listeners[`display_file_infos_${this.globule.domain}_event`] = uuid;
                }, (file) => {

                    // display the file information itself.
                    this.informationManager.setFileInformation(file)


                    // I will display the permission manager.
                    this.fileSelectionPanel.appendChild(this.informationManager)

                }, false)
        }

        // Reload the content of a dir with the actual dir content description on the server.
        // must be call after file are deleted or renamed
        if (this.listeners[`reload_dir_${this.globule.domain}_event`] == undefined) {
            this.globule.eventHub.subscribe("reload_dir_event",
                (uuid) => {
                    this.listeners[`reload_dir_${this.globule.domain}_event`] = uuid
                }, (path) => {


                    if (path.endsWith(this.path)) {
                        this.displayWaitMessage("load " + path)

                        _readDir(path, (dir) => {
                            this.fileNavigator.reload(dir, () => {
                                // reload dir to be sure if it's public that change will be applied.
                                _readDir(path, (dir) => {
                                    if (dir.path == this.path) {
                                        Model.eventHub.publish("__set_dir_event__", { path: dir, file_explorer_id: this.id }, true)

                                    }
                                    this.shadowRoot.querySelector("globular-disk-space-manager").refresh()
                                    this.resume()
                                }, err => { ApplicationView.displayMessage(err, 3000); this.resume() }, this.globule)
                            })
                        }, err => ApplicationView.displayMessage(err, 3000), this.globule, true)
                    }
                }, false)
        }

        // Refresh the interface.
        if (this.listeners[`upload_files_${this.globule.domain}_event`] == undefined) {
            this.globule.eventHub.subscribe("upload_files_event", (uuid) => {
                this.listeners[`upload_files_${this.globule.domain}_event`] = uuid
            },
                evt => {
                    if (evt == this.path) {
                        // refresh the interface.
                        delete dirs[getUuidByString(this.globule.domain + "@" + this.path)]
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
                    this.playVideo(evt.file, evt.globule)
                }
            }, true)
        }

        // Play audio
        if (this.listeners["__play_audio__"] == undefined) {
            Model.eventHub.subscribe("__play_audio__", (uuid) => {
                this.listeners["__play_audio__"] = uuid
            }, (evt) => {
                if (this.id == evt.file_explorer_id) {
                    this.playAudio(evt.file, evt.globule)
                }

            }, true)
        }

        // Read file
        if (this.listeners["__read_file__"] == undefined) {
            Model.eventHub.subscribe("__read_file__", (uuid) => {
                this.listeners["__read_file__"] = uuid
            }, (evt) => {
                if (this.id == evt.file_explorer_id) {
                    this.readFile(evt.file)
                }
            }, true, this)
        }

        // Show image...
        if (this.listeners["__show_image__"] == undefined) {
            Model.eventHub.subscribe("__show_image__", (uuid) => {
                this.listeners["__show_image__"] = uuid
            }, (evt) => {
                if (this.id == evt.file_explorer_id) {
                    this.showImage(evt.file)
                }

            }, true)
        }

        // Load the application dir.
        this.displayWaitMessage("load " + Model.application + "dir")
        _readDir("/applications/" + Model.application, (dir) => {
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

            //this.setDir(dir)

            // Load the root dir...
            this.displayWaitMessage("load " + this.root)
            _readDir(this.root, (dir) => {
                // set interface with the given directory.
                this.resume()

                if (this.fileNavigator != null) {
                    this.fileNavigator.setDir(dir, (shared_, public_) => { if (callback) callback(shared_, public_) })
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


            }, () => { this.onerror; this.resume() }, this.globule)


        }, () => { this.onerror; this.resume() }, this.globule)
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

    playVideo(file) {

        this.style.zIndex = 1;
        let video = null
        if (file.videos) {
            video = file.videos[0]
        }

        if (file.titles) {
            video = file.titles[0]
        }

        playVideo(file.path, null, () => {

        }, video, this.globule)
    }

    playAudio(file) {

        // hide the content.
        this.style.zIndex = 1;

        getAudioInfo(this.globule, file, audios => {
            if (audios) {
                playAudio(file.path, () => { }, () => { }, audios[0], this.globule)
            }
        })

    }

    readFile(file) {

        // hide the content.
        this.filesListView.style.display = "none"
        this.filesIconView.style.display = "none"
        this.fileReader.style.display = "block"

        // Display the video only if the path match the video player /applications vs /users
        this.fileReader.read(file)
    }

    showImage(file) {

        // hide the content.
        this.filesListView.style.display = "none"
        this.filesIconView.style.display = "none"

        // Display the image viewer...
        this.imageViewer.style.display = "block"

        // Here I will set the active image.
        for (var i = 0; this.imageViewer.children.length; i++) {
            if (this.imageViewer.children[i].name == file.path) {
                this.imageViewer.activeImage(getElementIndex(this.imageViewer.children[i]))
                break
            }
        }
    }

    displayView(dir) {
        this.filesListView.__dir__ = dir
        this.filesIconView.__dir__ = dir

        this.filesIconView.menu.close()
        this.filesListView.menu.close()

        if (this.filesListBtn.classList.contains("active")) {
            this.filesListView.style.display = ""
            this.filesIconView.style.display = "none"
        } else {
            this.filesListView.style.display = "none"
            this.filesIconView.style.display = ""
        }
    }

    loadImages(dir, callback) {
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
                    for (var j = 0; j < this.imageViewer.children.length; j++) {
                        if (this.imageViewer.children[j].name == img.name) {
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

                // call when finish...
                if (callback)
                    callback()
            }, images, images_, index, this.globule)
        }
    }

    setDir(dir, callback) {


        if (!(dir.path.startsWith("/public") || public_[dir.path] != undefined || dir.path.startsWith("/shared") || shared[dir.path] != undefined || dir.path.startsWith("/applications/" + Application.application) || dir.path.startsWith("/users/" + Application.account.id))) {
            return
        }

        // Set back the list and icon view
        this.displayView(dir)

        this.fileReader.style.display = "none"
        this.imageViewer.style.display = "none";
        this.permissionManager.style.display = "none"

        this.imageViewer.innerHTML = "";

        if (this.filesListView.menu.parentNode) {
            this.filesListView.menu.parentNode.removeChild(this.filesListView.menu)
            this.filesListView.menu.close()
        }
        if (this.filesIconView.menu.parentNode) {
            this.filesIconView.menu.parentNode.removeChild(this.filesIconView.menu)
            this.filesIconView.menu.close()
        }

        // Set back the view when the image viewer is close.
        this.imageViewer.onclose = () => {
            this.displayView()
        }

        this.fileReader.onclose = () => {
            this.displayView()
        }

        this.loadImages(dir, callback)

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
                navigationLst.style.left = "0px"
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


    open() {

        this.style.display = "flex"
        this.isOpen = true;

        if (this.onopen != undefined) {
            this.onopen();
        }
    }

    close() {
        this.style.display = "none"

        if (this.onclose != undefined) {
            this.onclose();

        }

        if (this.parentNode != null) {
            this.parentNode.removeChild(this)
        }

        this.isOpen = false

    }

    maximize() {
        this._file_explorer_OpenBtn.click();

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
    constructor() {
        super("files", "folder", "Files")

        this.onclick = () => {
            let icon = this.getIconDiv().querySelector("iron-icon")
            icon.style.removeProperty("--iron-icon-fill-color")

            // The file explorer object.
            let fileExplorer = new FileExplorer();
            let userId = localStorage.getItem("user_id")
            let userDomain = localStorage.getItem("user_domain")
            // Set the file explorer...
            fileExplorer.setRoot("/users/" + userId + "@" + userDomain)
            fileExplorer.init();

            // Set the onerror callback for the component.
            fileExplorer.onerror = (err) => {
                ApplicationView.displayMessage(err, 4000)
            };

            fileExplorer.onclose = () => {
                // Remove the file explorer.
                fileExplorer.parentNode.removeChild(fileExplorer)
                fileExplorer.delete() // remove all listeners.
                fileExplorer = null;
            }

            Model.eventHub.publish("_open_file_explorer_event_", fileExplorer, true)
            fileExplorer.open()
        }
    }

    init() {
        // hide the menu div
        this.hideMenuDiv = true
    }
}

customElements.define('globular-files-menu', FilesMenu)

/**
 * Display video preview...
 */
export class VideoPreview extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(file, height, onresize, globule) {
        super()

        this.file = file
        this.path = file.path;
        this.height = height;
        this.onresize = onresize;
        this.onpreview = null;
        this.onplay = null;
        this.__show_play_btn__ = false;
        this.title = file.path

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        this.shadowRoot.innerHTML = `
        <style>
           

            #container{
                height: ${height}px;
                position: relative;
            }

            #container:hover {
                cursor: pointer;
            }

            #play-btn{
                position: absolute;
                transform: translate(-50%,-50%);
                background-color:  rgb(0, 179, 255);
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
                height: 60px;
            }

            .preview{

            }
        </style>
       <div id = "container" draggable="false" >
            <slot style="position: relative;"></slot>
            <iron-icon id="play-btn" icon="av:play-arrow"></iron-icon>
            <paper-ripple></paper-ripple>
        </div>
        `

        this.images = []

        // give the focus to the input.
        this.container = this.shadowRoot.querySelector("#container")
        this.playBtn = this.shadowRoot.querySelector("#play-btn")

        let index = 0;
        if (this.file.thumbnail.length > 0) {
            this.firstImage = document.createElement("img")
            this.firstImage.src = this.file.thumbnail
            this.firstImage.onload = () => {
                let ratio = this.height / this.firstImage.offsetHeight
                this.width = this.firstImage.offsetWidth * ratio;
                this.playBtn.style.top = "50%"
                this.playBtn.style.left = "50%"
                if (this.onresize != undefined) {
                    this.onresize()
                }
                this.container.appendChild(this.firstImage)
                this.images.push(this.firstImage)
            }
        } else {
            console.log("no thumbnail image was found for ", this.file)
        }

        // Play the video
        this.playBtn.onclick = this.container.onclick = (evt) => {
            evt.stopPropagation()
            this.play(globule)
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
                getHiddenFiles(file.path, previewDir => {
                    let previews = []
                    if (previewDir) {
                        if (previewDir._files) {
                            previews = previewDir._files
                        }
                    }

                    getImage((images) => {
                        this.images = images
                        if (this.images.length > 0) {
                            this.container.appendChild(this.images[0])

                            this.playBtn.style.display = "block";
                            if (this.interval == null && !is_over_play_btn) {
                                this.startPreview();
                            }

                            if (this.onresize != undefined) {
                                this.onresize()
                            }
                        }
                    }, this.images, previews, index, globule) // Download the first image only...

                }, globule)
            } else if (this.images.length > 1) {
                this.playBtn.style.display = "block";
                if (this.interval == null && !is_over_play_btn) {
                    this.startPreview();
                }
            }

        }

        this.container.onmouseout = (evt) => {
            evt.stopPropagation();
            if (!this.__show_play_btn__) {
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

    connectedCallback() {

        //or however you get a handle to the IMG

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
    play(globule) {
        if (this._file_explorer_ != undefined) {
            Model.eventHub.publish("__play_video__", { file: this.file, file_explorer_id: this._file_explorer_.id, globule: globule }, true)
        }

        if (this.onplay != undefined) {
            this.onplay(this.file)
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

        this._file_explorer_ = null;

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
            #container{
                position: relative;
                background-color: var(--palette-background-paper);
            }

            #collapse-panel{
                display: none;
                position: absolute;
                bottom: 40px;
                right: -16px;
            }

            .collapse-torrent-panel{
                display: flex;
                flex-direction: column;
                max-height: 200px;
                overflow: auto;
            }

            ::-webkit-scrollbar {
                width: 5px;
                height: 5px;
             }
                
             ::-webkit-scrollbar-track {
                background: var(--palette-background-default);
             }
             
             ::-webkit-scrollbar-thumb {
                background: var(--palette-divider); 
             }
             
            paper-icon-button .active{

            }

            paper-icon-button {

            }

            .content{
                min-width: 350px;

            }

            .card-content{
                overflow-y: auto;
                width: 100%;

            }

            table {
                width: 100%;
                background-color: var(--palette-background-paper);
            }

            td {
                text-align: center;
                vertical-align: middle;
                white-space: nowrap;
                padding: 0px 5px 0px 5px;
            }

            .file-name {
               
                overflow: hidden;
                white-space:nowrap;
                text-overflow:ellipsis;
                max-width:500px;
                display:inline-block;
                background-color:var(--palette-background-default);
            }

            .file-path {
                overflow: hidden;
                white-space:nowrap;
                text-overflow:ellipsis;
                max-width:300px;
                display:inline-block;
                background-color:var(--palette-background-default);
                text-decoration: underline;
            }

            .file-path:hover {
                cursor: pointer;
            }

            .speedometer-div {
                min-width: 60px;
                text-align: right;
            }
            tbody{
                position: relative;
                width: 100%;
            }

            tbody tr {
                background-color: var(--palette-background-default);
                transition: background 0.2s ease,padding 0.8s linear;
                max-width: 300px;
            }

            tr.active{
                filter: invert(10%);
            }

            paper-card{
                background-color: var(--palette-background-paper);
                color: var(--palette-text-primary);
            }

            paper-tabs{
                background: var(--palette-background-default); 
                border-top: 1px solid var(--palette-divider);
                width: 100%;

                /* custom CSS property */
                --paper-tabs-selection-bar-color: var(--palette-primary-main); 
                color: var(--palette-text-primary);
                --paper-tab-ink: var(--palette-action-disabled);
            }
        </style>
        <div id="container">
            <iron-collapse id="collapse-panel">
                <paper-card class="content">
                    <paper-tabs selected="0" style="">
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
                this.uploadTorrent(evt)
            }
            , true, this
        )


        // Start display torrent infos...
        this.getTorrentLnks(this._file_explorer_.globule, lnks => {

        })
        this.getTorrentsInfo(this._file_explorer_.globule)
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

        if (done || infos == "done") {
            let span_title = this.links_download_table.querySelector("#" + id + "_title")
            if (span_title) {
                ApplicationView.displayMessage("File " + span_title.innerHTML + " was now uploaded!", 3000)
                row.parentNode.removeChild(row)
            }
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
            cellDest.innerHTML = `<span class="file-path" style="background-color:var(--palette-background-default);">${path.split("/")[path.split("/").length - 1]}</span>`;

            row.appendChild(cancelCell)
            row.appendChild(cellSource);
            row.appendChild(cellDest);
            row.querySelector(".file-path").onclick = () => {
                _readDir(torrent.getDestination(), dir => {
                    Model.eventHub.publish("__set_dir_event__", { path: dir, file_explorer_id: this._file_explorer_.id }, true)
                }, err => ApplicationView.displayMessage(err, 3000), this.globule)

            }
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
     * @param {*} torrent 
     * @returns 
     */
    uploadTorrent(torrent) {
        let uuid = getUuid(torrent.getName())
        let id = "torrent-download-row-" + uuid
        let row = this.shadowRoot.querySelector("#" + id)

        // display the button.
        this.btn.style.setProperty("--iron-icon-fill-color", "var(--palette-action-active)")
        this.shadowRoot.querySelector("iron-collapse").style.display = "block";

        if (row == undefined) {
            let row = document.createElement("tr")
            row.done = false
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
                <div style="display: flex; align-items: center; ">
                    <div style="display: flex; width: 32px; height: 32px; justify-content: center; align-items: center;position: relative;">
                        <iron-icon  id="_${uuid}-collapse-btn"  icon="unfold-less" --iron-icon-fill-color:var(--palette-text-primary);"></iron-icon>
                        <paper-ripple class="circle" recenters=""></paper-ripple>
                    </div>
                    <span id="${id}_title" class="file-name" style="flex-grow: 1;  max-width: 600px;">${torrent.getName()}</span>
                    <span class="speedometer-div"></span>
                </div>
   
                <iron-collapse id="_${uuid}-collapse-torrent-panel" class="collapse-torrent-panel">
                    <div id="_${uuid}-file-list-div" style="display: flex; flex-direction: column;">
                    </div>
                </iron-collapse>

                <paper-progress  id="${id}_progress_bar"  style="width: 100%; margin-top: 5px;"></paper-progress>
            </div>`;
            let cellDest = document.createElement("td")
            cellDest.style.textAlign = "left"
            cellDest.style.paddingLeft = "5px"
            cellDest.innerHTML = `<span title="${torrent.getDestination()}" class="file-path">${torrent.getDestination().split("/")[torrent.getDestination().split("/").length - 1]}</span>`;

            row.appendChild(cancelCell)
            row.appendChild(cellSource);
            row.appendChild(cellDest);

            row.querySelector(".file-path").onclick = () => {
                _readDir(torrent.getDestination(), dir => {
                    Model.eventHub.publish("__set_dir_event__", { path: dir, file_explorer_id: this._file_explorer_.id }, true)
                }, err => ApplicationView.displayMessage(err, 3000), this._file_explorer_.globule)

            }

            cancelBtn.onclick = () => {
                // So here I will remove the torrent from the list...
                let rqst = new DropTorrentRequest
                rqst.setName(torrent.getName())
                let globule = this._file_explorer_.globule
                globule.torrentService.dropTorrent(rqst, { application: Application.application, domain: globule.domain, token: localStorage.getItem("user_token") })
                    .then(rsp => {
                        row.parentNode.removeChild(row)
                    }).catch(err => ApplicationView.displayMessage(err, 3000))
            }

            // Append to files panels.
            this.torrent_download_table.appendChild(row)
            this.btn.click()
            this.torrentsDowloadTab.click();
        } else {

            let progressBar = row.querySelector(`#${id}_progress_bar`)

            let speedo = row.querySelector(".speedometer-div")
            if (torrent.getPercent() == 100) {
                progressBar.style.display = "none"
                speedo.innerHTML = "Done"
            } else {
                speedo.innerHTML = formatBytes(torrent.getDownloadrate(), 1)
                progressBar.value = torrent.getPercent()

            }

            let collapse_btn = row.querySelector(`#_${uuid}-collapse-btn`)
            let collapse_panel = row.querySelector(`#_${uuid}-collapse-torrent-panel`)
            collapse_btn.onclick = () => {
                if (!collapse_panel.opened) {
                    collapse_btn.icon = "unfold-more"
                } else {
                    collapse_btn.icon = "unfold-less"
                }
                collapse_panel.toggle();
            }

            let filesDiv = row.querySelector(`#_${uuid}-file-list-div`)
            let range = document.createRange()

            // So here I will display the list of files contain in the torrent.
            torrent.getFilesList().forEach(f => {
                // So here I will create the file list...
                let id = "_" + getUuid(f.getPath())
                let fileRow = filesDiv.querySelector(`#${id}`)
                if (fileRow == undefined) {
                    let html = `
                        <div id="${id}" style="display: flex; flex-direction: column; font-size: 0.85rem;"> 
                            <div style="display: flex;">
                                <span>${f.getPath().split("/")[f.getPath().split("/").length - 1]}</span>
                            </div>
                            <paper-progress id="${id}_progress_bar" style="width: 100%;"></paper-progress>
                        </div>
                    `
                    filesDiv.appendChild(range.createContextualFragment(html))
                    fileRow = filesDiv.querySelector(`#${id}`)
                }

                let progressBar_ = fileRow.querySelector(`#${id}_progress_bar`)
                progressBar_.value = f.getPercent()
            })
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
            let size = getFileSizeString(f.size)
            let row = document.createElement("tr")
            let cancelCell = document.createElement("td")
            let cancelBtn = document.createElement("paper-icon-button")
            cancelBtn.icon = "icons:close"
            cancelCell.appendChild(cancelBtn)
            let cellSource = document.createElement("td")
            cellSource.style.textAlign = "left"
            cellSource.style.paddingLeft = "5px"
            cellSource.innerHTML = `
                <div style="display: flex; flex-direction: column;width: 400px; font-size: 0.85rem;">
                    <span style="background-color:var(--palette-background-default);">${f.name}</span>
                    <paper-progress value=0 style="width: 100%;"></paper-progress>
                </div>`;
            let cellDest = document.createElement("td")
            cellDest.style.textAlign = "left"
            cellDest.style.paddingLeft = "5px"
            cellDest.innerHTML = `<span class="file-path" style="background-color:var(--palette-background-default);">${path.split("/")[path.split("/").length - 1]}</span>`;
            let cellSize = document.createElement("td")
            cellSize.innerHTML = size;
            row.appendChild(cancelCell)
            row.appendChild(cellSource);
            row.appendChild(cellDest);
            row.appendChild(cellSize);

            cancelBtn.onclick = () => {
                row.style.display = "none";
            }

            row.querySelector(".file-path").onclick = () => {
                _readDir(torrent.getDestination(), dir => {
                    Model.eventHub.publish("__set_dir_event__", { path: dir, file_explorer_id: this._file_explorer_.id }, true)
                }, err => ApplicationView.displayMessage(err, 3000), this.globule)

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
                let globule = this._file_explorer_.globule
                let port = globule.config.PortHttp
                if (globule.config.Protocol == "https") {
                    port = globule.config.PortHttps
                }

                // generate a token... 
                generatePeerToken(globule, token => {
                    uploadFiles(globule, token, path, [f],
                        () => {
                            if (index < files.length) {
                                uploadFile(index, callback)
                            } else {
                                callback()
                            }
                        },
                        event => {
                            ApplicationView.displayMessage("Upload failed!", 3000)
                        },
                        event => {
                            let progress = this.files_upload_table.children[0].querySelector("paper-progress")
                            progress.value = (event.loaded / event.total) * 100
                            if (event.loaded == event.total) {
                                ApplicationView.displayMessage("File " + f.name + " was uploaded", 3000)
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
                }, err => ApplicationView.displayMessage(err, 3000))


            }
        }

        // Start file upload!
        uploadFile(0, () => {
            ApplicationView.displayMessage("All files are now uploaded!", 3000)
            delete dirs[getUuidByString(this._file_explorer_.globule.domain + "@" + path)]
            Model.publish("reload_dir_event", path, false)
        })

    }

    /** Get the list of torrent */
    getTorrentLnks(globule, callback) {
        generatePeerToken(globule, token => {
            let rqst = new GetTorrentLnksRequest
            globule.torrentService.getTorrentLnks(rqst, { application: Application.application, domain: globule.domain, token: token })
                .then(lnks => callback(lnks))
        }, err => ApplicationView.displayMessage(err, 3000))

    }

    /**
    * A loop that get torrent info from the server...
    */
    getTorrentsInfo(globule) {

        generatePeerToken(globule, token => {
            let rqst = new GetTorrentInfosRequest

            let stream = globule.torrentService.getTorrentInfos(rqst, { application: Application.application, domain: globule.domain, token: token })
            stream.on("data", (rsp) => {
                /** Local event... */
                rsp.getInfosList().forEach(torrent => {
                    Model.eventHub.publish("__upload_torrent_event__", torrent, true);
                })
            });

            stream.on("status", (status) => {
                if (status.code != 0) {
                    console.log(status.details)
                }
            });
        }, err => ApplicationView.displayMessage(err, 3000))


    }

}

customElements.define('globular-files-uploader', FilesUploader)
