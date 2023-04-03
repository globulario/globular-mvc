
import { generatePeerToken, Model } from '../Model';
import { Application } from "../Application";
import { CreateVideoRequest, DeleteTitleRequest, DeleteVideoRequest, DissociateFileWithTitleRequest, GetTitleFilesRequest, Poster, Person, Publisher, SearchTitlesRequest, SearchPersonsRequest, DeletePersonRequest, GetPersonByIdRequest, CreatePersonRequest } from "globular-web-client/title/title_pb";
import { File } from "../File";
import { VideoPreview, getFileSizeString } from "./File";
import { ApplicationView } from "../ApplicationView";
import { formatBoolean, randomUUID } from "./utility";
import { playVideo } from "./Video";
import { playAudio, secondsToTime } from "./Audio";
import '@polymer/iron-autogrow-textarea/iron-autogrow-textarea.js';
import { EditableStringList } from "./List";
import { createThumbmail, readBlogPost } from './BlogPost';

import { PermissionsManager } from './Permissions';
import * as getUuidByString from 'uuid-by-string';
import { SavePackageResponse } from 'globular-web-client/catalog/catalog_pb';

// extract the duration info from the raw data.
function parseDuration(duration) {
    // display the track lenght...
    let obj = secondsToTime(duration)
    var hours = obj.h
    var min = obj.m
    var sec = obj.s
    let hours_ = (hours < 10) ? '0' + hours : hours;
    let minutes_ = (min < 10) ? '0' + min : min;
    let seconds_ = (sec < 10) ? '0' + sec : sec;

    if (hours > 0)
        return hours_ + ":" + minutes_ + ":" + seconds_;

    if (min > 0)
        return minutes_ + ":" + seconds_;

    return seconds_ + "'s";
}

function listToString(lst) {
    let str = "["
    if (lst) {
        lst.forEach((s, i) => {
            str += s;
            if (i < lst.length - 1) {
                str += " ,"
            }
        })
    }
    str += "]"

    return str
}

const __style__ = `
.title-div {
    display: flex;

}

.title-poster-div {
    padding-right: 20px;
}


.title-informations-div {
    font-size: 1em;
    min-width: 350px;
    max-width: 450px;
  
}

.title-poster-div img, p{
    /*max-width: 256px;*/
}

.title-genre-span {
    border: 1px solid var(--palette-divider);
    padding: 1px;
    padding-left: 5px;
    padding-right: 5px;
    margin-right: 5px;
    user-select: none;
}

.rating-star{
    --iron-icon-fill-color: rgb(245 197 24);
    padding-right: 10px;
    height: 30px;
    width: 30px;
}

.title-rating-div{
    display: flex;
    align-items: center;
    color: var(--palette-text-secondery);
    font-size: 1rem;
}

.title-genres-div{
    padding: 5px;
    display: flex;
    flex-wrap: wrap;
    font-size: .9rem;
}

#rating-span{
    font-weight: 600;
    font-size: 1.2rem;
    color: var(--palette-text-primery);
    user-select: none;
}

.title-credit {
    flex-grow: 1;
    color: var(--palette-text-primery);
    border-bottom: 2px solid;
    border-color: var(--palette-divider);
    width: 100%;
    margin-bottom: 10px;
}

.title-files-div {
    display: flex;
    width: 100%;
    flex-wrap: wrap;
    max-width: 400px;
}

.title-files-div globular-video-preview {
    margin-right: 5px;
}

.title-files-div paper-progress{
    width: 100%;
}

.title-top-credit, title-credit{
    margin-top: 15px;
    display: flex;
    flex-direction: column;
}

.title-credit-title{
    font-weight: 400;
    font-size: 1.1rem;
    color: var(--palette-text-primery);
}

.title-credit-lst{
    display: flex;
}

.title-credit-lst a {
    color: var(--palette-warning-main);
    font-size: 1.1rem;
    margin-right: 12px;
}

.title-credit-lst a:link { text-decoration: none; }
.title-credit-lst a:visited { text-decoration: none; }
.title-credit-lst a:hover { text-decoration: none; cursor:pointer; }
.title-credit-lst a:active { text-decoration: none; }

/** Small **/
@media only screen and (max-width: 600px) {
    .title-div {
        flex-direction: column;
    }

    .title-poster-div {
        display: flex;
        justify-content: center;
        margin-bottom: 20px;
        flex-direction: column;
    }

    globular-video-preview{
        margin-top: 10px;
    }
}
`

// Create the video preview...
function getVideoPreview(parent, path, name, callback, globule) {
    let h = 64;
    let w = 100;

    File.getFile(globule, path, w, h, file => {

        let fileNameSpan = document.createElement("span")
        let preview = new VideoPreview(file, 64, () => {
            if (preview.width > 0 && preview.height > 0) {
                w = (preview.width / preview.height) * h
            }
            fileNameSpan.style.wordBreak = "break-all"
            fileNameSpan.style.fontSize = ".85rem"
            fileNameSpan.style.maxWidth = w + "px";
            fileNameSpan.innerHTML = path.substring(path.lastIndexOf("/") + 1)
        }, globule)

        let range = document.createRange()
        let uuid = randomUUID()
        preview.appendChild(range.createContextualFragment(`<paper-icon-button icon="icons:remove-circle" id="_${uuid}" style="position: absolute;"> </paper-icon-button>`))
        let unlinkBtn = preview.querySelector(`#_${uuid}`)

        // When the file will be unlink...
        unlinkBtn.onclick = (evt) => {
            evt.stopPropagation();

            let toast = ApplicationView.displayMessage(`
                <style>
                   
                </style>
                <div id="select-media-dialog">
                    <div>Your about to delete file association</div>
                    <p style="font-style: italic;  max-width: 300px;" id="file-name"></p>
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

            toast.el.querySelector("#file-name").innerHTML = path.substring(path.lastIndexOf("/") + 1)

            let okBtn = toast.el.querySelector("#imdb-lnk-ok-button")
            okBtn.onclick = () => {
                let rqst = new DissociateFileWithTitleRequest
                rqst.setFilepath(path)
                rqst.setTitleid(name)
                if (name.startsWith("tt")) {
                    rqst.setIndexpath(globule.config.DataPath + "/search/titles")
                } else {
                    rqst.setIndexpath(globule.config.DataPath + "/search/videos")
                }

                globule.titleService.dissociateFileWithTitle(rqst, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
                    .then(rsp => {
                        preview.parentNode.removeChild(preview)
                        ApplicationView.displayMessage("association was delete", 3000)
                        toast.dismiss();
                    }).catch(err => ApplicationView.displayMessage(err, 3000))
            }

        }


        preview.onplay = (f) => {
            path = f.path
            if (path.endsWith(".mp3")) {

                playAudio(path, (audio) => {
                    let titleInfoBox = document.getElementById("title-info-box")
                    if (titleInfoBox) {
                        titleInfoBox.parentNode.removeChild(titleInfoBox)
                    }
                    //video.toggleFullscreen();
                }, null, null, globule)

            } else {
                playVideo(path, (video) => {
                    let titleInfoBox = document.getElementById("title-info-box")
                    if (titleInfoBox) {
                        titleInfoBox.parentNode.removeChild(titleInfoBox)
                    }
                    if (video.toggleFullscreen) {
                        video.toggleFullscreen();
                    }

                }, null, null, globule)
            }

        }

        // keep the explorer link...
        preview.name = name
        preview.onpreview = () => {
            let previews = parent.querySelectorAll("globular-video-preview")
            previews.forEach(p => {
                // stop all other preview...
                if (preview.name != p.name) {
                    p.stopPreview()
                }
            })
        }

        // Here I will set the filename 
        let previewDiv = document.createElement("div")
        previewDiv.style.display = "flex"
        previewDiv.style.flexDirection = "column"
        previewDiv.appendChild(preview)
        previewDiv.appendChild(fileNameSpan)
        callback(previewDiv)

    }, err => ApplicationView.displayMessage(err, 3000))

}

function GetTitleFiles(indexPath, title, parent, callback) {

    let previews = []
    let titleFiles = () => {
        let globule = title.globule
        __getTitleFiles__(globule, globule.config.DataPath + indexPath, title, parent, previews_ => {
            previews = previews.concat(previews_)
            callback(previews)
        })
    }

    titleFiles() // call once

}

/**
 * Return the list of file of a given tile...
 * @param {*} title The title 
 * @param {*} callback 
 */
function __getTitleFiles__(globule, indexPath, title, parent, callback) {
    let rqst = new GetTitleFilesRequest
    rqst.setTitleid(title.getId())
    rqst.setIndexpath(indexPath)

    globule.titleService.getTitleFiles(rqst, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
        .then(rsp => {
            let previews = []
            let _getVideoPreview_ = () => {
                if (rsp.getFilepathsList().length > 0) {
                    let path = rsp.getFilepathsList().pop()
                    // Return the first file only... 
                    getVideoPreview(parent, path, title.getId(), p => {

                        parent.appendChild(p)
                        _getVideoPreview_() // call again...
                    }, globule)
                } else {
                    callback(previews)
                }
            }
            _getVideoPreview_() // call once...
        })
        .catch(err => { callback([]) })
}


export function searchEpisodes(serie, indexPath, callback) {
    let episodes = []
    let globules = Model.getGlobules()

    let __searchEpisodes__ = (globules) => {
        let globule = globules.pop()

        // search episodes...
        _searchEpisodes_(globule, serie, indexPath, episodes_ => {
            episodes = episodes.concat(episodes_)
            if (globules.length > 0) {
                __searchEpisodes__(globules)
            } else {
                callback(episodes)
            }
        })
    }

    if (globules.length > 0) {
        __searchEpisodes__(globules)
    }
}


function _searchEpisodes_(globule, serie, indexPath, callback) {

    // This is a simple test...
    let rqst = new SearchTitlesRequest
    rqst.setIndexpath(indexPath)
    rqst.setQuery(serie)
    rqst.setOffset(0)
    rqst.setSize(1000)
    let episodes = []
    let stream = globule.titleService.searchTitles(rqst, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
    stream.on("data", (rsp) => {
        if (rsp.hasHit()) {
            let hit = rsp.getHit()
            // display the value in the console...
            hit.getSnippetsList().forEach(val => {
                if (hit.getTitle().getType() == "TVEpisode") {
                    let episode = hit.getTitle()
                    episode.globule = globule
                    episodes.push(episode)
                }
            })
        }
    });

    stream.on("status", (status) => {
        if (status.code == 0) {
            // Here I will sort the episodes by seasons and episodes.
            callback(episodes.sort((a, b) => {
                if (a.getSeason() === b.getSeason()) {
                    // Price is only important when cities are the same
                    return a.getEpisode() - b.getEpisode();
                }
                return a.getSeason() - b.getSeason();
            }))
        }
    });
}

/**
 * Here I will return the list of asscociated episode for a given series...
 * @param {*} indexPath  The path to the search engine 
 * @param {*} title The title
 * @param {*} callback The callback with the list of episodes.
 */
export function GetEpisodes(indexPath, title, callback) {
    // return the existing list...
    if (title.__episodes__ != undefined) {
        callback(title.__episodes__)
        return
    }

    searchEpisodes(title.getId(), indexPath, episodes => {
        title.__episodes__ = episodes
        callback(title.__episodes__)
    })
}

/**
 * Display information about given object ex. titles, files...
 */
export class InformationsManager extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
        let isShort = this.hasAttribute("short")
        this.onclose = null;

        // Innitialisation of the layout.
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

            #container{
                display: flex;
                flex-direction: column;
                padding: 8px;
                z-index: 100;
                /*
                background-color: var(--palette-background-paper);
                */
                color: var(--palette-text-primary);
                font-size: 1rem;
                user-select: none;
                max-height: calc(100vh - 100px);
                overflow-y: auto;
            }

            #header {
                display: flex;
                line-height: 20px;
                padding-bottom: 10px;
            }

            #header paper-icon-button {
                min-width: 40px;
            }


            h1 {
                font-size: 1.55rem;
            }

            h2 {
                font-size: 1.35rem;
            }

            h3 {
                font-size: 1.25rem;
            }


            #header h1, h2, h3 {
                margin: 5px;
            }

            .title-div{
                display: flex;
                flex-direction: column;
                flex-grow: 1;
                color: var(--palette-text-primery);
                border-bottom: 2px solid;
                border-color: var(--palette-divider);
                width: 66.66%;
                margin-bottom: 0px;
                user-select: none;
            }

            .title-sub-title-div{
                display: flex;
            }
            title-sub-title-div span {
                padding-right: 5px;
                user-select: none;
            }

            #title-year {
                padding-left: 10px;
                padding-right: 10px;
            }

            .permissions{
                padding: 10px;
            }

        </style>
        <div id="container">
            <div id="header">
                <div class="title-div"></div>
                <paper-icon-button icon="close" style="${isShort ? "display: none;" : ""}"></paper-icon-button>
            </div>
            <slot></slot>
        </div>
        `
        // give the focus to the input.
        this.container = this.shadowRoot.querySelector("#container")

        // The close button...
        let closeButton = this.shadowRoot.querySelector("paper-icon-button")
        closeButton.onclick = () => {
            // remove it from it parent.
            this.parentNode.removeChild(this)
            if (this.onclose != null) {
                this.onclose()
            }

        }
    }

    hideHeader() {
        if (this.shadowRoot.querySelector("paper-icon-button"))
            this.shadowRoot.querySelector("paper-icon-button").style.display = "none"
        if (this.shadowRoot.querySelector("#title-name"))
            this.shadowRoot.querySelector("#title-name").style.display = "none"
    }

    /**
     * Display video informations.
     * @param {*} videos 
     */
    setAudiosInformation(audios) {
        this.innerHTML = "" // remove previous content.
        this.shadowRoot.querySelector(".title-div").innerHTML = ""
        let audio = audios[0]
        let audioInfo = new AudioInfo(this.shadowRoot.querySelector(".title-div"), this.hasAttribute("short"))
        audioInfo.setAudio(audio)
        this.appendChild(audioInfo)
    }

    /**
     * Display video informations.
     * @param {*} videos 
     */
    setVideosInformation(videos) {
        this.innerHTML = "" // remove previous content.
        this.shadowRoot.querySelector(".title-div").innerHTML = ""
        let video = videos[0]
        let videoInfo = new VideoInfo(this.shadowRoot.querySelector(".title-div"), this.hasAttribute("short"))
        videoInfo.setVideo(video)
        this.appendChild(videoInfo)
    }

    /**
     * Display video informations.
     * @param {*} blog post 
     */
    setBlogPostInformation(blogPost) {
        this.innerHTML = "" // remove previous content.
        this.shadowRoot.querySelector(".title-div").innerHTML = ""
        let blogPostInfo = new BlogPostInfo(blogPost)
        this.appendChild(blogPostInfo)
    }

    /**
     * Display title informations.
     * @param {*} titles 
     */
    setTitlesInformation(titles, globule) {
        this.innerHTML = "" // remove previous content.
        this.shadowRoot.querySelector(".title-div").innerHTML = ""
        if (titles.length == 0) {
            /** nothinh to display... */
            return;
        }

        let title = null;
        if (titles.length == 1) {
            title = titles[0]
        } else {
            titles.forEach(t => {
                if (t.getType() == "TVSeries") {
                    title = t;
                }
            })
        }

        if (title == null) {
            title = titles[titles.length - 1]
        }

        let titleInfo = new TitleInfo(this.shadowRoot.querySelector(".title-div"), this.hasAttribute("short"), globule)
        titleInfo.setTitle(title)
        this.appendChild(titleInfo)
    }

    setFileInformation(file) {
        this.innerHTML = "" // remove previous content.
        this.shadowRoot.querySelector(".title-div").innerHTML = `
        <div style="display: flex; align-items: center;">
            <iron-icon id="icon" icon="icons:info"> </iron-icon> 
            <span style="flex-grow: 1; padding-left: 20px; font-size: 1.1rem;  user-select: none;">${file.name} <span style="color: var(--palette-text-secondary);  margin-left: 16px; user-select: none;">Properties</span></span>
        </div>`
        let fileInfo = new FileInfo(file)
        this.appendChild(fileInfo)
    }

}

customElements.define('globular-informations-manager', InformationsManager)

/**
 * Display basic file informations.
 */
export class AudioInfo extends HTMLElement {

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           

            #container {
                display: flex;
                background-color: var(--palette-background-paper);
                color: var(--palette-text-primary);
            }

            img {
                width: 256px;
            }

        </style>
        <div id="container">
            <div>
                <img id="image"></img>
            </div>
            <div style="display: table; flex-grow: 1; padding-left: 20px;">
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Title:</div>
                    <div id="title-div" style="display: table-cell;"></div>
                </div>
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Artist:</div>
                    <div id="artist-div" style="display: table-cell;"></div>
                </div>
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Album:</div>
                    <div id="album-div" style="display: table-cell;"></div>
                </div>
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Album Artist:</div>
                    <div id="album-artist-div" style="display: table-cell;"></div>
                </div>
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Genre:</div>
                    <div  id="genre-div" style="display: table-cell;"></div>
                </div>
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Year:</div>
                    <div id="year-div" style="display: table-cell;"></div>
                </div>
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Track:</div>
                    <div id="track-div" style="display: table-cell;"></div>
                </div>
            </div>
        </div>
        `
    }

    setAudio(audio) {
        this.shadowRoot.querySelector("#image").src = audio.getPoster().getContenturl()
        this.shadowRoot.querySelector("#title-div").innerHTML = audio.getTitle()
        this.shadowRoot.querySelector("#artist-div").innerHTML = audio.getArtist()
        this.shadowRoot.querySelector("#album-div").innerHTML = audio.getAlbum()
        this.shadowRoot.querySelector("#album-artist-div").innerHTML = audio.getAlbumartist()
        this.shadowRoot.querySelector("#genre-div").innerHTML = audio.getGenresList().join(" / ")
        this.shadowRoot.querySelector("#year-div").innerHTML = audio.getYear() + ""
        this.shadowRoot.querySelector("#track-div").innerHTML = audio.getTracknumber() + ""
    }

}

customElements.define('globular-audio-info', AudioInfo)

/**
 * Video information
 */
export class VideoInfo extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(titleDiv, isShort) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });


        this.titleDiv = titleDiv
        this.isShort = isShort

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
            ${__style__}

            .title-div {
                color: var(--palette-text-primary);
                user-select: none;
            }

            .action-div{
                display: flex;
                justify-content: end;
            }

            .title-rating-div{
                font-size: .8rem;
            }

            .title-poster-img{
                max-width: 320px;
                max-height: 350px;
                object-fit: cover;
                width: auto;
                height: auto;
            }

            paper-button {
                font-size: 1rem;
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

            @media only screen and (max-width: 600px) {
                .title-div{
                    max-height: calc(100vh - 300px);
                    overflow-y: auto;
                    overflow-x: hidden;
                }

                .title-poster-img{
                    max-width: 256px;
                    max-height: 256px;
                }
            }


        </style>
        <div>
            <div class="title-div">
                <div class="title-poster-div" >
                    <img class="title-poster-img" style="${this.isShort ? "display: none;" : ""}"></img>
                    <div class="title-files-div">
                    </div>
                </div>
                <div class="title-informations-div">
                    <p class="title-synopsis-div"></p>
                    <div class="title-genres-div"></div>
                    <div class="title-rating-div">
                        <iron-icon class="rating-star" icon="icons:star"></iron-icon>
                        <div style="display: flex; flex-direction: column;">
                            <div><span id="rating-span"></span>/10</div>
                        </div>
                    </div>
                    <div class="title-top-credit">
                        <div class="title-credit">
                            <div id="title-actors-title" class="title-credit-title">Star</div>
                            <div id="title-actors-lst" class="title-credit-lst"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="action-div" style="${this.isShort ? "display: none;" : ""}">
                <paper-button id="edit-indexation-btn">Edit</paper-button>
                <paper-button id="delete-indexation-btn">Delete</paper-button>
            </div>
        </div>
        `

    }

    /** Set video information... */
    setVideo(video) {

        let score = video.getRating()

        let posterUrl = ""
        if (video.getPoster() != undefined) {
            // must be getContentUrl here... 
            posterUrl = video.getPoster().getContenturl()
            this.shadowRoot.querySelector(".title-poster-img").src = posterUrl
        }

        this.shadowRoot.querySelector(".title-synopsis-div").innerHTML = video.getDescription()
        this.shadowRoot.querySelector("#rating-span").innerHTML = score.toFixed(1)

        let genres = ""
        video.getGenresList().forEach((genre, index) => {
            genres += genre
            if (index < video.getGenresList().length - 1) {
                genres += ", "
            }
        })

        let publisherName = ""
        if (video.getPublisherid() != undefined) {
            publisherName = video.getPublisherid().getName()

        }

        let duration = ""
        if (video.getDuration() > 0) {
            duration = parseDuration(video.getDuration())
        }

        // Set the header section.
        this.titleDiv.innerHTML = `
        <div class="title-sub-title-div" style="display: flex; flex-direction: column;"> 
            <h1 id="title-name" class="title" style="${this.isShort ? "font-size: 1rem; padding-bottom: 10px;" : ""}"> ${publisherName} </h1>
            <div style="display: flex; align-items: baseline; max-width: 700px;">
                <h3 class="title-sub-title-div" style="${this.isShort ? "font-size: 1rem;" : ""}">          
                    <span id="title-type"><span>Genre: </span>${genres}</span>
                </h3>    
                <span id="title-duration" style="padding-left: 10px;"><span>Duration: </span> ${duration}</span>
            </span>
        </div>
        `

        // Here I will display the list of categories.
        let genresDiv = this.shadowRoot.querySelector(".title-genres-div")
        genresDiv.innerHTML = ""
        video.getTagsList().forEach(g => {
            let genreSpan = document.createElement("span")
            genreSpan.classList.add("title-genre-span")
            genreSpan.innerHTML = g
            genresDiv.appendChild(genreSpan)
        })


        // Display list of persons...
        let displayPersons = (div, persons) => {
            persons.forEach(p => {
                let uuid = "_" + getUuidByString(p.getId())
                let lnk = div.querySelector(`#${uuid}`)
                if (lnk == null) {
                    lnk = document.createElement("a")
                }
                lnk.id = uuid;
                lnk.href = p.getUrl()
                lnk.innerHTML = p.getFullname()
                lnk.target = "_blank"
                div.appendChild(lnk)
            })
        }

        displayPersons(this.shadowRoot.querySelector("#title-actors-lst"), video.getCastingList())
        if (video.getCastingList().length > 0) {
            this.shadowRoot.querySelector("#title-actors-title").innerHTML = "Actors"
        }

        let filesDiv = this.shadowRoot.querySelector(".title-files-div")
        filesDiv.innerHTML = ""

        GetTitleFiles("/search/videos", video, filesDiv, (previews) => {

        })

        let editor = new VideoInfoEditor(video, this)

        let editIndexationBtn = this.shadowRoot.querySelector("#edit-indexation-btn")
        editIndexationBtn.onclick = () => {
            // So here I will display the editor...
            let parent = this.parentNode
            parent.removeChild(this)
            parent.appendChild(editor)
        }

        let deleteIndexationBtn = this.shadowRoot.querySelector("#delete-indexation-btn")

        // Delete the indexation from the database.
        deleteIndexationBtn.onclick = () => {
            let toast = ApplicationView.displayMessage(`
            <style>
               
            </style>
            <div id="select-media-dialog">
                <div>Your about to delete indexation</div>
                <p style="font-style: italic;  max-width: 300px;" id="title-type"></p>
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

            toast.el.querySelector("#title-type").innerHTML = video.getDescription()
            toast.el.querySelector("#title-poster").src = posterUrl

            let okBtn = toast.el.querySelector("#imdb-lnk-ok-button")
            okBtn.onclick = () => {
                let rqst = new DeleteVideoRequest()
                rqst.setVideoid(video.getId())
                rqst.setIndexpath(Model.globular.config.DataPath + "/search/videos")
                Model.globular.titleService.deleteVideo(rqst, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
                    .then(() => {
                        ApplicationView.displayMessage(`file indexation was deleted`, 3000)
                        this.parentNode.removeChild(this)
                    })
                    .catch(err => ApplicationView.displayMessage(err, 3000))

                toast.dismiss();
            }
        }
    }
}

customElements.define('globular-video-info', VideoInfo)


/**
 * The video infos editor.
 */
export class VideoInfoEditor extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(video, videoInfosDisplay) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
        this.videoInfosDisplay = videoInfosDisplay

        let imageUrl = "" // in case the video dosent contain any poster info...
        if (video.getPoster())
            imageUrl = video.getPoster().getContenturl()

        let publisher = video.getPublisherid()
        if (!publisher) {
            publisher = new Publisher
        }

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
            #container {
                display: flex;
                margin-top: 15px;
                margin-bottom: 15px;
            }

            .action-div{
                display: flex;
                justify-content: end;
                border-top: 2px solid;
                border-color: var(--palette-divider);
            }

            .button-div{
                display: table-cell;
                vertical-align: top;
            }

            .label{
                font-size: 1rem;
                padding-right: 10px;
                width: 175px;
            }

            div, paper-input, iron-autogrow-textarea {
                font-size: 1rem;
            }

            paper-button {
                font-size: 1rem;
            }

        </style>
        <div id="container">
            <div style="display: flex; flex-direction: column; justify-content: flex-start;  margin-left: 15px;">
                <div style="display: flex; flex-direction: column; margin: 5px;">
                    <globular-image-selector label="cover" url="${imageUrl}"></globular-image-selector>
                </div>
            </div>

            <div style="display: flex; flex-direction: column; width: 100%;">
               
                <div style="display: table; flex-grow: 1; margin-left: 20px; border-collapse: collapse;">
                        <div style="display: table-row;  border-bottom: 1px solid var(--palette-divider);  margin-bottom: 10px;">
                            <div class="label" style="display: table-cell; font-weight: 450;">Publisher</div>
                        </div>
                        <div style="display: table-row;">
                            <div class="label" style="display: table-cell; font-weight: 450; ">Id:</div>
                            <div style="display: table-cell; width: 100%;"  id="publisher-id-div">${publisher.getId()}</div>
                            <paper-input style="display: none; width: 100%;" value="${publisher.getId()}" id="publisher-id-input" no-label-float></paper-input>
                            <div class="button-div">
                                <paper-icon-button id="edit-publisher-id-btn" icon="image:edit"></paper-icon-button>
                            </div>
                        </div>
                        <div style="display: table-row;">
                            <div class="label" style="display: table-cell; font-weight: 450;">Url:</div>
                            <div style="display: table-cell; width: 100%;"  id="publisher-url-div">${publisher.getUrl()}</div>
                            <paper-input style="display: none; width: 100%;" value="${publisher.getUrl()}" id="publisher-url-input" no-label-float></paper-input>
                            <div class="button-div">
                                <paper-icon-button id="edit-publisher-url-btn" icon="image:edit"></paper-icon-button>
                            </div>
                        </div>
                        <div style="display: table-row;">
                            <div class="label" style="display: table-cell; font-weight: 450; ">Name:</div>
                            <div style="display: table-cell; width: 100%;"  id="publisher-name-div">${publisher.getName()}</div>
                            <paper-input style="display: none; width: 100%;" value="${publisher.getName()}" id="publisher-name-input" no-label-float></paper-input>
                            <div class="button-div">
                                <paper-icon-button id="edit-publisher-name-btn" icon="image:edit"></paper-icon-button>
                            </div>
                        </div>
                </div>


                <div id="casting-table" style="flex-grow: 1; margin-left: 20px; border-collapse: collapse;">
                    <div style="display: table-row;  border-bottom: 1px solid var(--palette-divider);  margin-bottom: 10px;">
                        <div class="label" style="display: table-cell; font-weight: 450;">Casting</div>
                        <div style="display: table-cell; width: 100%;" ></div>
                       
                        <div class="button-div" style="position: relative;">
                            <paper-icon-button id="add-casting-btn" icon="social:person-add"></paper-icon-button>
                        </div>

                    </div>
                    <slot name="casting"></slot>
                </div>

                <div style="display: table; flex-grow: 1; margin-left: 20px; border-collapse: collapse; margin-top: 20px; margin-bottom: 10px;">
                    <div style="display: table-row; border-bottom: 1px solid var(--palette-divider)" >
                        <div class="label" style="display: table-cell; font-weight: 450; border-bottom: 1px solid var(--palette-divider)">Video</div>
                    </div>
                    <div style="display: table-row;">
                        <div class="label" style="display: table-cell; font-weight: 450; ">Id:</div>
                        <div style="display: table-cell; width: 100%;"  id="video-id-div">${video.getId()}</div>
                        <paper-input style="display: none; width: 100%;" value="${video.getId()}" id="video-id-input" no-label-float></paper-input>
                        <div class="button-div">
                            <paper-icon-button id="edit-video-id-btn" icon="image:edit"></paper-icon-button>
                        </div>
                    </div>
                    <div style="display: table-row;">
                        <div class="label" style="display: table-cell; font-weight: 450;">URL:</div>
                        <div id="video-url-div" style="display: table-cell; width: 100%;">${video.getUrl()}</div>
                        <paper-input id="video-url-input" no-label-float style="display: none; width: 100%;" value="${video.getUrl()}"></paper-input>
                        <div class="button-div">
                            <paper-icon-button id="edit-video-url-btn" icon="image:edit"></paper-icon-button>
                        </div>
                    </div>
                    <div style="display: table-row;">
                        <div class="label" style="display: table-cell; font-weight: 450; vertical-align: top;">Description:</div>
                        <div id="video-description-div" style="display: table-cell;width: 100%;" >${video.getDescription()}</div>
                        <iron-autogrow-textarea id="video-description-input"  style="display: none; border: none; width: 100%;" value="${video.getDescription()}"></iron-autogrow-textarea>
                        <div class="button-div">
                            <paper-icon-button id="edit-video-description-btn" style="vertical-align: top;" icon="image:edit"></paper-icon-button>
                        </div>
                    </div>
                    <div style="display: table-row;">
                        <div class="label" style="display: table-cell; font-weight: 450;">Genres:</div>
                        <div id="video-genres-div" style="display: table-cell; width: 100%;"></div>
                    </div>
                    <div style="display: table-row;">
                        <div class="label" style="display: table-cell; font-weight: 450;">Tags:</div>
                        <div id="video-tags-div" style="display: table-cell; width: 100%; max-width: 450px;"></div>
                    </div>
                </div>
            </div>
        </div>
        <iron-collapse class="permissions" id="collapse-panel" style="display: flex; flex-direction: column; margin: 5px;">
        </iron-collapse>
        <div class="action-div" style="${this.isShort ? "display: none;" : ""}">
            <paper-button id="edit-permissions-btn" title="set who can edit this video informations">Permissions</paper-button>
            <span style="flex-grow: 1;"></span>
            <paper-button id="save-indexation-btn">Save</paper-button>
            <paper-button id="cancel-indexation-btn">Cancel</paper-button>
        </div>
        `

        let editPemissionsBtn = this.shadowRoot.querySelector("#edit-permissions-btn")
        let collapse_panel = this.shadowRoot.querySelector("#collapse-panel")

        this.permissionManager = new PermissionsManager()
        this.permissionManager.permissions = null
        this.permissionManager.globule = video.globule
        this.permissionManager.setPath(video.getId())
        this.permissionManager.setResourceType = "video_info"

        let indexPath = video.globule.config.DataPath + "/search/videos"

        let addCastingBtn = this.shadowRoot.querySelector("#add-casting-btn")
        addCastingBtn.onclick = () => {
            let html = `
            <paper-card id="add-casting-panel" style="z-index: 100; background-color: var(--palette-background-paper);  color: var(--palette-text-primary); position: absolute; top: 35px; right: 5px;">
                <div style="display:flex; flex-direction: column;">
                    <globular-search-person-input indexpath="${indexPath}" title="search existing cast"></globular-search-person-input>
                    <div style="display:flex; justify-content: flex-end;">
                        <paper-button id="new-person-btn" title="Create a new cast">New</paper-button>
                        <paper-button id="cancel-btn" >Cancel</paper-button>
                    </div>
                </div>
            </paper-card>
            `
            let parent = addCastingBtn.parentNode
            let addCastingPanel = parent.querySelector("#add-casting-panel")
            if (addCastingPanel != null) {
                return
            }

            let range = document.createRange()
            parent.appendChild(range.createContextualFragment(html))

            let createNewPersonBtn = parent.querySelector("#new-person-btn")
            createNewPersonBtn.onclick = () => {

                let person = new Person()
                person.setId("New Casting")

                let editor = this.appendPersonEditor(person, video)
                editor.focus()

                // remove the panel...
                let addCastingPanel = parent.querySelector("#add-casting-panel")
                addCastingPanel.parentNode.removeChild(addCastingPanel)
            }

            // close the search box...
            let searchPersonInput = parent.querySelector("globular-search-person-input")

            searchPersonInput.oneditperson = (person) => {
                person.globule = video.globule
                let personEditor = new PersonEditor(person)
                let uuid = "_" + getUuidByString(person.getId()) + "_edit_panel"

                let div = document.body.querySelector(`#${uuid}`)
                if (div) {
                    return // already a panel...
                }

                let html = `
                <style>
                    #${uuid}{
                        z-index: 1000;
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        background-color: var(--palette-background-default);
                        border-left: 1px solid var(--palette-divider); 
                        border-right: 1px solid var(--palette-divider) rgba(255, 255, 255, 0.12);
                        border-top: 1px solid var(--palette-divider) rgba(255, 255, 255, 0.12);
                        color: var(--palette-text-primary);
                        font-size: 1rem;
                    }

                </style>
                <paper-card id="${uuid}">

                </paper-card>
                `

                let range = document.createRange()

                // so here I will append the editor into the body...
                document.body.appendChild(range.createContextualFragment(html))
                div = document.body.querySelector(`#${uuid}`)

                personEditor.onclose = () => {
                    div.parentNode.removeChild(div)
                }

                div.appendChild(personEditor)
                personEditor.focus()
            }

            searchPersonInput.onaddcasting = (person) => {

                let globule = person.globule
                let indexPath = globule.config.DataPath + "/search/videos" // TODO set it correctly for video...

                generatePeerToken(globule, token => {

                    // remove the video id from casting field.
                    let casting = person.getCastingList()
                    if (casting.indexOf(video.getId()) == 0) {
                        casting.push(video.getId())
                    }

                    person.setCastingList(casting)

                    let rqst = new CreatePersonRequest
                    rqst.setPerson(person)
                    rqst.setIndexpath(indexPath)

                    // save the person witout the video id...
                    globule.titleService.createPerson(rqst, { application: Application.application, domain: Application.domain, token: token })
                        .then(rsp => {
                            // Now I will remove the person from the video casting...
                            let casting = video.getCastingList()

                            // remove it if it was existing.
                            casting = casting.filter(p => p.getId() !== person.getId());

                            // set it back.
                            casting.push(person)
                            video.setCastingList(casting)

                            let rqst = new CreateVideoRequest
                            rqst.setVideo(video)
                            rqst.setIndexpath(indexPath)

                            globule.titleService.createVideo(rqst, { application: Application.application, domain: Application.domain, token: token })
                                .then(rsp => {
                                    this.appendPersonEditor(person, video)

                                    // remove the panel...
                                    let addCastingPanel = parent.querySelector("#add-casting-panel")
                                    addCastingPanel.parentNode.removeChild(addCastingPanel)

                                }).catch(err => ApplicationView.displayMessage(err, 3000))
                        }).catch(err => ApplicationView.displayMessage(err, 3000))

                })
            }

            searchPersonInput.onclose = parent.querySelector("#cancel-btn").onclick = () => {
                let addCastingPanel = parent.querySelector("#add-casting-panel")
                addCastingPanel.parentNode.removeChild(addCastingPanel)
            }


        }

        // toggle the collapse panel when the permission manager panel is close.
        this.permissionManager.onclose = () => {
            collapse_panel.toggle();
        }

        // I will display the permission manager.
        editPemissionsBtn.onclick = () => {
            collapse_panel.appendChild(this.permissionManager)
            collapse_panel.toggle();
        }

        // Here I will set the interaction...
        this.shadowRoot.querySelector("#cancel-indexation-btn").onclick = () => {
            let parent = this.parentNode
            parent.removeChild(this)
            parent.appendChild(videoInfosDisplay)
        }

        // Delete the postser/cover image.
        this.shadowRoot.querySelector("globular-image-selector").ondelete = () => {
            video.getPoster().setContenturl("")
        }

        // Select new image.
        this.shadowRoot.querySelector("globular-image-selector").onselectimage = () => {
            if (video.getPoster() == null) {
                let poster = new Poster()
                video.setPoster(poster)
            }

            video.getPoster().setContenturl(dataUrl)
        }


        // so here I will set the casting...
        video.getCastingList().forEach(p => {
            this.appendPersonEditor(p, video)
        })

        // The publisher id
        let editPublisherIdBtn = this.shadowRoot.querySelector("#edit-publisher-id-btn")
        let publisherIdInput = this.shadowRoot.querySelector("#publisher-id-input")
        let publisherIdDiv = this.shadowRoot.querySelector("#publisher-id-div")

        editPublisherIdBtn.onclick = () => {
            publisherIdInput.style.display = "table-cell"
            publisherIdDiv.style.display = "none"
            setTimeout(() => {
                publisherIdInput.focus()
                publisherIdInput.inputElement.inputElement.select()
            }, 100)
        }

        publisherIdInput.onblur = () => {
            publisherIdInput.style.display = "none"
            publisherIdDiv.style.display = "table-cell"
            publisherIdDiv.innerHTML = publisherIdInput.value
        }

        // The publisher url
        let editPublisherUrlBtn = this.shadowRoot.querySelector("#edit-publisher-url-btn")
        let publisherUrlInput = this.shadowRoot.querySelector("#publisher-url-input")
        let publisherUrlDiv = this.shadowRoot.querySelector("#publisher-url-div")

        editPublisherUrlBtn.onclick = () => {
            publisherUrlInput.style.display = "table-cell"
            publisherUrlDiv.style.display = "none"
            setTimeout(() => {
                publisherUrlInput.focus()
                publisherUrlInput.inputElement.inputElement.select()
            }, 100)
        }

        publisherIdInput.onblur = () => {
            publisherUrlInput.style.display = "none"
            publisherUrlDiv.style.display = "table-cell"
            publisherUrlDiv.innerHTML = publisherUrlInput.value
        }

        // The publisher name
        let editPublisherNameBtn = this.shadowRoot.querySelector("#edit-publisher-name-btn")
        let publisherNameInput = this.shadowRoot.querySelector("#publisher-name-input")
        let publisherNameDiv = this.shadowRoot.querySelector("#publisher-name-div")

        editPublisherNameBtn.onclick = () => {
            publisherNameInput.style.display = "table-cell"
            publisherNameDiv.style.display = "none"
            setTimeout(() => {
                publisherNameInput.focus()
                publisherNameInput.inputElement.inputElement.select()
            }, 100)
        }

        publisherIdInput.onblur = () => {
            publisherNameInput.style.display = "none"
            publisherNameDiv.style.display = "table-cell"
            publisherNameDiv.innerHTML = publisherNameInput.value
        }


        // The video id
        let editVideoIdBtn = this.shadowRoot.querySelector("#edit-video-id-btn")
        let videoIdInput = this.shadowRoot.querySelector("#video-id-input")
        let videoIdDiv = this.shadowRoot.querySelector("#video-id-div")

        editVideoIdBtn.onclick = () => {
            videoIdInput.style.display = "table-cell"
            videoIdDiv.style.display = "none"
            setTimeout(() => {
                videoIdInput.focus()
                videoIdInput.inputElement.inputElement.select()
            }, 100)
        }

        videoIdInput.onblur = () => {
            videoIdInput.style.display = "none"
            videoIdDiv.style.display = "table-cell"
            videoIdDiv.innerHTML = videoIdInput.value
        }

        // The original url link...
        let editVideoUrlBtn = this.shadowRoot.querySelector("#edit-video-url-btn")
        let videoUrlInput = this.shadowRoot.querySelector("#video-url-input")
        let videoUrlDiv = this.shadowRoot.querySelector("#video-url-div")

        editVideoUrlBtn.onclick = () => {
            videoUrlInput.style.display = "table-cell"
            videoUrlDiv.style.display = "none"
            setTimeout(() => {
                videoUrlInput.focus()
                videoUrlInput.inputElement.inputElement.select()
            }, 100)
        }

        // set back to non edit mode.
        videoUrlInput.onblur = () => {
            videoUrlInput.style.display = "none"
            videoUrlDiv.style.display = "table-cell"
            videoUrlDiv.innerHTML = videoUrlInput.value

        }

        // The video description
        let editVideoDescriptionBtn = this.shadowRoot.querySelector("#edit-video-description-btn")
        let videoVideoDescriptionInput = this.shadowRoot.querySelector("#video-description-input")
        let videoVideoDescriptionDiv = this.shadowRoot.querySelector("#video-description-div")

        editVideoDescriptionBtn.onclick = () => {
            videoVideoDescriptionInput.style.display = "table-cell"
            videoVideoDescriptionDiv.style.display = "none"
            setTimeout(() => {
                videoVideoDescriptionInput.focus()
                videoVideoDescriptionInput.textarea.select()
            }, 100)
        }

        // set back to non edit mode.
        videoVideoDescriptionInput.onblur = () => {
            videoVideoDescriptionInput.style.display = "none"
            videoVideoDescriptionDiv.style.display = "table-cell"
            videoVideoDescriptionDiv.innerHTML = videoVideoDescriptionInput.value
        }

        let videoGenresDiv = this.shadowRoot.querySelector("#video-genres-div")
        let videoGenresList = new EditableStringList(video.getGenresList())
        videoGenresDiv.appendChild(videoGenresList)

        let videoTagsDiv = this.shadowRoot.querySelector("#video-tags-div")
        let videoTagsList = new EditableStringList(video.getTagsList())
        videoTagsDiv.appendChild(videoTagsList)

        this.shadowRoot.querySelector("#save-indexation-btn").onclick = () => {

            // set the publisher information.
            let publisher = video.getPublisherid()
            if (publisher == null) {
                publisher = new Publisher()
            }

            publisher.setId(publisherIdInput.value)
            publisher.setUrl(publisherUrlInput.value)
            publisher.setName(publisherNameInput.value)

            // set back the modified values.
            video.setPublisherid(publisher)

            // So here I will set video values back and update it in the parent...
            video.setId(videoIdInput.value)
            video.setUrl(videoUrlInput.value)
            video.setDescription(videoVideoDescriptionInput.value)

            video.setTagsList(videoTagsList.getItems())
            video.setGenresList(videoGenresList.getItems())

            // set the casting values...
            // casting are interfaced by PersonEditor and PersonEditor are contain 
            // in the casting slot, so I will use children iterator here...
            for (var i = 0; i < this.children.length; i++) {
                this.children[i].save()
            }

            this.saveCasting(video, casting => {
                let globule = video.globule
                generatePeerToken(globule, token => {
                    let indexPath = globule.config.DataPath + "/search/videos"
                    let rqst = new CreateVideoRequest
                    rqst.setVideo(video)
                    rqst.setIndexpath(indexPath)

                    video.setCastingList(casting)

                    globule.titleService.createVideo(rqst, { application: Application.application, domain: Application.domain, token: token })
                        .then(rsp => {
                            ApplicationView.displayMessage("Video Information are updated", 3000)
                            this.videoInfosDisplay.setVideo(video)
                        })
                        .catch(err => ApplicationView.displayMessage(err, 3000))
                    let parent = this.parentNode
                    parent.removeChild(this)
                    parent.appendChild(videoInfosDisplay)
                })
            })
        }
    }

    // Save casting this will create new person and set value in existing one.
    saveCasting(video, callback) {

        let castingEditors = this.querySelectorAll("globular-person-editor")
        let casting = []
        for (var i = 0; i < castingEditors.length; i++) {
            let person = castingEditors[i].getPerson()
            casting.push(person)

            let casting_ = person.getCastingList()
            if (!casting_) {
                casting_ = []
            }

            if (casting_.indexOf(video.getId()) == -1) {
                casting_.push(video.getId())
            }
            person.setCastingList(casting_)
        }

        let globule = video.globule

        let savePerson = (index) => {
            let indexPath = globule.config.DataPath + "/search/videos"
            let p = casting[index]
            index++
            let rqst = new CreatePersonRequest
            rqst.setIndexpath(indexPath)
            rqst.setPerson(p)

            // save the person one by one...
            generatePeerToken(globule, token => {
                globule.titleService.createPerson(rqst, { application: Application.application, domain: Application.domain, token: token })
                    .then(rsp => {
                        if (index < casting.length) {
                            savePerson(index)
                        } else {
                            callback(casting)
                        }
                    })
                    .catch(err => {
                        if (index < casting.length) {
                            savePerson(index)
                        } else {
                            callback(casting)
                        }
                    })
            })
        }

        let index = 0
        if (casting.length > 0)
            savePerson(index)
        else
            callback([])

    }

    appendPersonEditor(person, video) {
        person.globule = video.globule
        let uuid = "_" + getUuidByString(person.getId())

        // Create the person editor.
        let personEditor = this.querySelector(`#${uuid}`)

        if (personEditor == null) {
            personEditor = new PersonEditor(person, video)
            personEditor.id = uuid;

            personEditor.slot = "casting"

            personEditor.onremovefromcast = (p) => {
                personEditor.parentNode.removeChild(personEditor)
            }

            // Append to the list of casting
            this.appendChild(personEditor)
        }

        return personEditor
    }

}

customElements.define('globular-video-editor', VideoInfoEditor)



/**
 * Search existing person infos...
 */
export class SearchPersonInput extends HTMLElement {
    // attributes.


    // Create the applicaiton view.
    constructor() {

        super()

        this.indexPath = this.getAttribute("indexpath")
        this.titleInfo = null

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
            #container{
                display: flex;
                flex-direction: column;
                background-color: var(--palette-background-paper);
                color: var(--palette-text-primary);
            }

            paper-input {
                margin-left: 5px;
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

            .search-results{
                background-color: var(--palette-background-paper);
                color: var(--palette-text-primary);
                max-height: 300px;
                padding: 10px;
                overflow-y: auto;
                align-items: center;
                justify-content: center;
            }

            iron-icon{
                height: 18px;
                margin-right: 5px;
            }

            iron-icon:hover{
                cursor: pointer;
            }

        </style>

        <div id="container">
            <div style="display: flex; align-items: center; min-width: 240px; padding: 5px;">
                <iron-icon icon="icons:search"></iron-icon>
                <paper-input no-label-float></paper-input>
            </div>

            <div class="search-results"> </div>

        </div>

        `
        // give the focus to the input.
        let input = this.shadowRoot.querySelector("paper-input")
        setTimeout(() => {
            input.focus()
            input.inputElement.inputElement.select()
        }, 100)

        input.onkeyup = (evt) => {
            if (evt.key == "Enter") {
                this.shadowRoot.querySelector(".search-results").innerHTML = ""

                if (evt.target.value.length >= 3) {
                    console.log("search for: ", evt.target.value)
                    searchPersons(evt.target.value, this.indexPath, persons => {
                        if (persons.length > 0) {


                            let range = document.createRange()

                            persons.forEach(p => {

                                let uuid = "_" + getUuidByString(p.getId())

                                let html = `
                                <div id="${uuid}-div" style="display: flex; min-width: 240px; align-items: center; border-bottom: 1px solid var(--palette-divider); padding-bottom: 10px; margin-bottom: 10px;">
                                    <img style="height: 55px; width: 55px; border-radius: 27.5px;" src="${p.getPicture()}"></img>
                                    <div style="display: flex; flex-direction: column; width: 100%;">
                                        <span style="flex-grow: 1; font-size: 1.2rem; margin-left: 10px; justify-self: flex-start;">${p.getFullname()}</span>
                                        <div style="display: flex; justify-content: flex-end;">
                                            <iron-icon id="${uuid}-edit-btn" icon="image:edit" title="edit person informations"></iron-icon>
                                            <iron-icon id="${uuid}-add-btn" icon="icons:add" title="add to the casting"></iron-icon>
                                        </div>
                                    </div>
                                </div>
                                `

                                let div = this.querySelector(`#${uuid}-div`)
                                if (!div) {
                                    this.shadowRoot.querySelector(".search-results").appendChild(range.createContextualFragment(html));
                                    div = this.querySelector(`#${uuid}-div`)

                                    // Now the action...
                                    let editBtn = this.shadowRoot.querySelector(`#${uuid}-edit-btn`)
                                    editBtn.onclick = () => {
                                        this.editPerson(p)
                                    }

                                    let addBtn = this.shadowRoot.querySelector(`#${uuid}-add-btn`)
                                    addBtn.onclick = () => {
                                        this.addPerson(p)
                                    }
                                }
                            })
                        }
                    })


                } else {
                    ApplicationView.displayMessage("search value must be longer thant 3 character", 3500)
                }

            } else if (evt.key == "Escape") {
                if (this.onclose) {
                    this.shadowRoot.querySelector(".search-results").innerHTML = ""

                    this.onclose()

                }
            }
        }

    }

    editPerson(p) {
        if (this.oneditperson != null) {
            this.oneditperson(p)
        }
    }

    addPerson(person) {
        if (this.onaddcasting) {
            this.onaddcasting(person)
        }
    }
}

customElements.define('globular-search-person-input', SearchPersonInput)

function getPersonById(globule, indexPath, id, callback, errorCallback) {

    generatePeerToken(globule, token => {
        let rqst = new GetPersonByIdRequest
        rqst.setIndexpath(indexPath)
        rqst.setPersonid(id)

        globule.titleService.getPersonById(rqst, { application: Application.application, domain: Application.domain, token: token })
            .then(rsp => {
                callback(rsp.getPerson())
            }).catch(err => {
                errorCallback(err)
            })
    })
}

/**
 * Retreive a list of person, Actor's, Writer's, Director's, Casting
 * @param {*} query 
 * @param {*} indexpath 
 * @param {*} callback 
 */
export function searchPersons(query, indexpath, callback) {

    let index = 0
    let globules = Model.getGlobules()
    let persons = []

    let __searchPerson__ = (index) => {
        let globule = globules[index]
        index++

        generatePeerToken(globule, token => {

            // so here I will search for given person...
            let rqst = new SearchPersonsRequest
            rqst.setIndexpath(indexpath)
            rqst.setQuery(query)
            rqst.setOffset(0)
            rqst.setSize(1000)

            let stream = globule.titleService.searchPersons(rqst, { application: Application.application, domain: Application.domain, token: token })
            stream.on("data", (rsp) => {
                if (rsp.hasHit()) {
                    let hit = rsp.getHit()
                    persons.push(hit.getPerson())
                }
            });

            stream.on("status", (status) => {
                if (status.code == 0) {
                    // Here I will sort the episodes by seasons and episodes.
                    persons = persons.sort((a, b) => {
                        if (a.getFullname() === b.getFullname()) {
                            // Price is only important when cities are the same
                            return a.getFullname() - b.getFullname();
                        }
                        return a.getFullname() - b.getFullname();
                    })

                    persons = [...new Map(persons.map(v => [v.getId(), v])).values()]

                    persons.forEach(p => {
                        p.globule = globule
                    })

                    callback(persons)

                } else {
                    ApplicationView.displayMessage(status.details, 3000)
                }
            });
        })

    }


    if (globules.length > 0) {
        __searchPerson__(index)
    } else {
        callback([])
    }

}


/**
 * Use to edit title or video casting
 */
export class PersonEditor extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(person, title) {
        super()

        // keep a refrence on the person object.
        this.person = person
        this.titleInfo = title

        Model.eventHub.subscribe(`delete_${person.getId()}_evt`, l => { }, evt => {
            this.parentNode.removeChild(this)
        }, true)

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Generate a uuid from the person id.
        let uuid = "_" + getUuidByString(person.getId())
        let imageUrl = person.getPicture()
        if (!imageUrl) {
            imageUrl = ""
        }

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
            #container{
                color: var(--palette-text-primary);
            }

            .table-cell {
                display: table-cell; 
                width: 100%;
                padding-left: 5px;
            }

            .label{
                font-size: 1rem;
                padding-right: 10px;
                width: 175px;
            }

            .button-div{
                display: flex;
                justify-content: end;
            }

            .table-cell a {
                color: var(--palette-text-primary);
            }
        </style>

        <div id="container" style="display: flex; flex-grow: 1; margin-left: 20px; flex-direction: column;">
            <div style="display: flex;  border-bottom: 1px solid var(--palette-divider);  margin-bottom: 10px; align-items: center;">
                <paper-icon-button id="collapse-btn"  icon="unfold-less" --iron-icon-fill-color:var(--palette-text-primary);"></paper-icon-button>
                <div id="header-text" class="label" style="flex-grow: 1;">${person.getFullname()}</div>
                <div>
                    <paper-icon-button id="edit-${uuid}-person-remove-btn" icon="icons:close"></paper-icon-button>
                </div>
            </div>
            <iron-collapse class="" id="collapse-panel">
                <div style="display: flex; width: 100%;">

                    <div style="display: flex; flex-direction: column; justify-content: flex-start;  margin-right: 20px;">
                        <div style="display: flex; flex-direction: column; margin: 5px;">
                            <globular-image-selector label="Profile Picture" url="${imageUrl}"></globular-image-selector>
                        </div>
                    </div>

                    <div style="display: flex; flex-direction: column; width: 100%;">
                        <div style="display: table; border-collapse: collapse; flex-grow: 1;">
                            <div style="display: table-row;">
                                <div class="label" style="display: table-cell; font-weight: 450; ">Id:</div>
                                <div class="table-cell"  id="${uuid}-person-id-div">${person.getId()}</div>
                                <paper-input style="display: none; width: 100%;" value="${person.getId()}" id="${uuid}-person-id-input" no-label-float></paper-input>
                                <div class="button-div">
                                    <paper-icon-button id="edit-${uuid}-person-id-btn" icon="image:edit"></paper-icon-button>
                                </div>
                            </div>

                            <div style="display: table-row;">
                                <div class="label" style="display: table-cell; font-weight: 450;">Url:</div>
                                <div class="table-cell" id="${uuid}-person-url-div">${person.getUrl()}</div>
                                <paper-input style="display: none; width: 100%;" value="${person.getUrl()}" id="${uuid}-person-url-input" no-label-float></paper-input>
                                <div class="button-div">
                                    <paper-icon-button id="edit-${uuid}-person-url-btn" icon="image:edit"></paper-icon-button>
                                </div>
                            </div>

                            <div style="display: table-row;">
                                <div class="label" style="display: table-cell; font-weight: 450; ">Name:</div>
                                <div class="table-cell"  id="${uuid}-person-name-div">${person.getFullname()}</div>
                                <paper-input style="display: none; width: 100%;" value="${person.getFullname()}" id="${uuid}-person-name-input" no-label-float></paper-input>
                                <div class="button-div">
                                    <paper-icon-button id="edit-${uuid}-person-name-btn" icon="image:edit"></paper-icon-button>
                                </div>
                            </div>

                            <div style="display: table-row;">
                                <div class="label" style="display: table-cell; font-weight: 450; ">Aliases:</div>
                                <div class="table-cell"  id="${uuid}-person-aliases-div">${person.getAliasesList().join(", ")}</div>
                                <paper-input style="display: none; width: 100%;" value="${person.getAliasesList().join(", ")}" id="${uuid}-person-aliases-input" no-label-float></paper-input>
                                <div class="button-div">
                                    <paper-icon-button id="edit-${uuid}-person-aliases-btn" icon="image:edit"></paper-icon-button>
                                </div>
                            </div>

                            <div style="display: table-row;">
                                <div class="label" style="display: table-cell; font-weight: 450; ">Date of birth:</div>
                                <div class="table-cell"  id="${uuid}-person-birthdate-div">${person.getBirthdate()}</div>
                                <paper-input style="display: none; width: 100%;" value="${person.getBirthdate()}" id="${uuid}-person-birthdate-input" no-label-float></paper-input>
                                <div class="button-div">
                                    <paper-icon-button id="edit-${uuid}-person-birthdate-btn" icon="image:edit"></paper-icon-button>
                                </div>
                            </div>

                            <div style="display: table-row;">
                                <div class="label" style="display: table-cell; font-weight: 450; ">Place of birth:</div>
                                <div class="table-cell"  id="${uuid}-person-birthplace-div">${person.getBirthplace()}</div>
                                <paper-input style="display: none; width: 100%;" id="${uuid}-person-birthplace-input" no-label-float></paper-input>
                                <div class="button-div">
                                    <paper-icon-button id="edit-${uuid}-person-birthplace-btn" icon="image:edit"></paper-icon-button>
                                </div>
                            </div>

                            <div style="display: table-row;">
                                <div class="label" style="display: table-cell; font-weight: 450; vertical-align: top;">Biography:</div>
                                <div id="${uuid}-person-biography-div" style="display: table-cell;width: 100%;" >${person.getBiography()}</div>
                                <div style="display: none; width: 100%;">
                                    <iron-autogrow-textarea id="${uuid}-person-biography-input"  style="border: none; width: 100%;" value="${person.getBiography()}"></iron-autogrow-textarea>
                                </div>
                                <div class="button-div">
                                    <paper-icon-button id="edit-${uuid}-person-biography-btn" style="vertical-align: top;" icon="image:edit"></paper-icon-button>
                                </div>
                            </div>
                        </div>
                        <div style="display:flex; justify-content: flex-end;">
                            <paper-button id="${uuid}-save-btn" title="save person information">Save</paper-button>
                            <paper-button id="${uuid}-delete-btn" title="delete person information">Delete</paper-button>
                        </div>
                    </div>
                </div>
            </iron-collapse>
        </div>
        `
        // give the focus to the input.
        let container = this.shadowRoot.querySelector("#container")

        let collapse_btn = container.querySelector("#collapse-btn")
        let collapse_panel = container.querySelector("#collapse-panel")
        collapse_btn.onclick = () => {
            if (!collapse_panel.opened) {
                collapse_btn.icon = "unfold-more"
            } else {
                collapse_btn.icon = "unfold-less"
            }
            collapse_panel.toggle();
        }

        let saveCastBtn = container.querySelector(`#${uuid}-save-btn`)
        saveCastBtn.onclick = () => {

            let globule = this.person.globule

            let indexPath = globule.config.DataPath + "/search/videos"
            let rqst = new CreatePersonRequest
            rqst.setIndexpath(indexPath)
            rqst.setPerson(this.person)

            if (this.titleInfo) {
                let casting = this.person.getCastingList()
                casting = casting.filter(e => e !== this.titleInfo.getId());
                casting.push(this.titleInfo.getId())
                person.setCastingList(casting)
            }

            // save the person one by one...
            generatePeerToken(globule, token => {
                globule.titleService.createPerson(rqst, { application: Application.application, domain: Application.domain, token: token })
                    .then(rsp => {
                        ApplicationView.displayMessage(this.person.getFullname() + " infos was saved!", 3000)
                    })
                    .catch(err => {
                        ApplicationView.displayMessage(err, 3000)
                    })
            })
        }

        // Remove a person from the cast...
        let removeFromCastBtn = container.querySelector(`#edit-${uuid}-person-remove-btn`)
        removeFromCastBtn.onclick = () => {

            if (title == undefined) {
                // simply remove it from it parent.
                this.parentNode.removeChild(this)
                if (this.onclose) {
                    this.onclose()
                }

                return
            }

            // Here I will remove the panel from it parent.
            if (this.person.getFullname().length == 0) {
                this.parentNode.removeChild(this)
                return
            }

            let toast = ApplicationView.displayMessage(`
            <style>
               
            </style>
            <div id="select-media-dialog">
                <div>Your about to remove <span style="font-size: 1.2rem;">${this.person.getFullname()}</span></div>

                <div style="display: flex; flex-direction: column; justify-content: center;">
                    <img src="${this.person.getPicture()}" style="width: 185.31px; align-self: center; padding-top: 10px; padding-bottom: 15px;" id="title-poster"> </img>
                </div>

                <div>from title ${this.titleInfo.getDescription()}</div>
                <div style="display: flex; flex-direction: column; justify-content: center;">
                    <img src="${this.titleInfo.getPoster().getContenturl()}" style="width: 185.31px; align-self: center; padding-top: 10px; padding-bottom: 15px;" id="title-poster"> </img>
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

            let okBtn = toast.el.querySelector("#imdb-lnk-ok-button")
            okBtn.onclick = () => {

                let globule = person.globule
                let indexPath = globule.config.DataPath + "/search/videos" // TODO set it correctly for video...

                generatePeerToken(globule, token => {

                    // remove the video id from casting field.
                    let casting = person.getCastingList()
                    casting = casting.filter(e => e !== this.titleInfo.getId());
                    person.setCastingList(casting)

                    let rqst = new CreatePersonRequest
                    rqst.setPerson(person)
                    rqst.setIndexpath(indexPath)

                    // save the person witout the video id...
                    globule.titleService.createPerson(rqst, { application: Application.application, domain: Application.domain, token: token })
                        .then(rsp => {
                            // Now I will remove the person from the video casting...
                            let casting = this.titleInfo.getCastingList()
                            casting = casting.filter(p => p.getId() !== person.getId());
                            this.titleInfo.setCastingList(casting)

                            let rqst = new CreateVideoRequest
                            rqst.setVideo(this.titleInfo)
                            rqst.setIndexpath(indexPath)
                            globule.titleService.createVideo(rqst, { application: Application.application, domain: Application.domain, token: token })
                                .then(rsp => {
                                    ApplicationView.displayMessage(`${person.getFullname()} was removed from the cast of ${this.titleInfo.getDescription()}`, 3000)
                                    if (this.onremovefromcast) {
                                        this.onremovefromcast(person)
                                    }
                                }).catch(err => ApplicationView.displayMessage(err, 3000))
                        }).catch(err => ApplicationView.displayMessage(err, 3000))

                })
                toast.dismiss();
            }
        }

        // Now the actions...
        let deleteBtn = container.querySelector(`#${uuid}-delete-btn`)
        deleteBtn.onclick = () => {
            if (this.person.getFullname().length == 0) {
                // In that case i will simply remove the editor from it parent.
                this.parentNode.removeChild(this)
            } else {
                this.deletePerson()
            }
        }

        // The person id
        let editpersonIdBtn = container.querySelector(`#edit-${uuid}-person-id-btn`)
        let personIdInput = container.querySelector(`#${uuid}-person-id-input`)
        let personIdDiv = container.querySelector(`#${uuid}-person-id-div`)

        editpersonIdBtn.onclick = () => {
            personIdInput.style.display = "table-cell"
            personIdDiv.style.display = "none"
            setTimeout(() => {
                personIdInput.focus()
                personIdInput.inputElement.inputElement.select()
            }, 100)
        }

        personIdInput.onblur = () => {
            personIdInput.style.display = "none"
            personIdDiv.style.display = "table-cell"
            personIdDiv.innerHTML = personIdInput.value
        }

        // The person name
        let editpersonNameBtn = container.querySelector(`#edit-${uuid}-person-name-btn`)
        let personNameInput = container.querySelector(`#${uuid}-person-name-input`)
        let personNameDiv = container.querySelector(`#${uuid}-person-name-div`)

        editpersonNameBtn.onclick = () => {
            personNameInput.style.display = "table-cell"
            personNameDiv.style.display = "none"
            setTimeout(() => {
                personNameInput.focus()
                personNameInput.inputElement.inputElement.select()
            }, 100)
        }


        // The person aliases
        let editpersonAliasesBtn = container.querySelector(`#edit-${uuid}-person-aliases-btn`)
        let personAliasesInput = container.querySelector(`#${uuid}-person-aliases-input`)
        let personAliasesDiv = container.querySelector(`#${uuid}-person-aliases-div`)

        editpersonAliasesBtn.onclick = () => {
            personAliasesInput.style.display = "table-cell"
            personAliasesDiv.style.display = "none"
            setTimeout(() => {
                personAliasesInput.focus()
                personAliasesInput.inputElement.inputElement.select()
            }, 100)
        }

        personAliasesInput.onblur = () => {
            personAliasesInput.style.display = "none"
            personAliasesDiv.style.display = "table-cell"
            personAliasesDiv.innerHTML = personAliasesInput.value
        }

        // The person birthdate
        let editpersonBirthdateBtn = container.querySelector(`#edit-${uuid}-person-birthdate-btn`)
        let personBirthdateInput = container.querySelector(`#${uuid}-person-birthdate-input`)
        let personBirthdateDiv = container.querySelector(`#${uuid}-person-birthdate-div`)

        editpersonBirthdateBtn.onclick = () => {
            personBirthdateInput.style.display = "table-cell"
            personBirthdateDiv.style.display = "none"
            setTimeout(() => {
                personBirthdateInput.focus()
                personBirthdateInput.inputElement.inputElement.select()
            }, 100)
        }

        personBirthdateInput.onblur = () => {
            personBirthdateInput.style.display = "none"
            personBirthdateDiv.style.display = "table-cell"
            personBirthdateDiv.innerHTML = personBirthdateInput.value
        }

        // The person birthplace
        let editpersonBirthplaceBtn = container.querySelector(`#edit-${uuid}-person-birthplace-btn`)
        let personBirthplaceInput = container.querySelector(`#${uuid}-person-birthplace-input`)
        let personBirthplaceDiv = container.querySelector(`#${uuid}-person-birthplace-div`)

        editpersonBirthplaceBtn.onclick = () => {
            personBirthplaceInput.style.display = "table-cell"
            personBirthplaceDiv.style.display = "none"
            setTimeout(() => {
                personBirthplaceInput.focus()
                personBirthplaceInput.value = personBirthplaceDiv.innerText.replace(/\s\s+/g, ' ').trim()
                personBirthplaceInput.inputElement.inputElement.select()
            }, 100)
        }

        personBirthplaceInput.onblur = () => {
            personBirthplaceInput.style.display = "none"
            personBirthplaceDiv.style.display = "table-cell"
            personBirthplaceDiv.innerHTML = personBirthplaceInput.value
        }

        // The person url
        let editpersonUrlBtn = container.querySelector(`#edit-${uuid}-person-url-btn`)
        let personUrlInput = container.querySelector(`#${uuid}-person-url-input`)
        let personUrlDiv = container.querySelector(`#${uuid}-person-url-div`)

        editpersonUrlBtn.onclick = () => {
            personUrlInput.style.display = "table-cell"
            personUrlDiv.style.display = "none"
            setTimeout(() => {
                personUrlInput.focus()
                personUrlInput.inputElement.inputElement.select()
            }, 100)
        }

        personUrlInput.onblur = () => {
            personUrlInput.style.display = "none"
            personUrlDiv.style.display = "table-cell"
            personUrlDiv.innerHTML = personUrlInput.value
        }

        // The person biography text.
        let editPersonBiographyBtn = this.shadowRoot.querySelector(`#edit-${uuid}-person-biography-btn`)
        let personBiographyInput = this.shadowRoot.querySelector(`#${uuid}-person-biography-input`)
        let personBiographyDiv = this.shadowRoot.querySelector(`#${uuid}-person-biography-div`)

        editPersonBiographyBtn.onclick = () => {
            personBiographyInput.parentNode.style.display = "table-cell"
            personBiographyDiv.style.display = "none"
            setTimeout(() => {
                personBiographyInput.focus()
                personBiographyInput.textarea.select()
            }, 100)
        }

        personBiographyInput.onblur = () => {
            personBiographyInput.parentNode.style.display = "none"
            personBiographyDiv.style.display = "table-cell"
            personBiographyDiv.innerHTML = personBiographyInput.value
        }

    }

    focus() {
        // onpen the panel...
        let container = this.shadowRoot.querySelector("#container")
        let uuid = "_" + getUuidByString(this.person.getId())

        let collapse_btn = container.querySelector("#collapse-btn")
        collapse_btn.click()

        let editpersonIdBtn = container.querySelector(`#edit-${uuid}-person-id-btn`)
        editpersonIdBtn.click()
    }

    deletePerson() {
        let toast = ApplicationView.displayMessage(`
        <style>
           
        </style>
        <div id="select-media-dialog">
            <div>Your about to delete <span style="font-size: 1.2rem;">${this.person.getFullname()}</span></div>
            <div style="display: flex; flex-direction: column; justify-content: center;">
                <img src="${this.person.getPicture()}" style="width: 185.31px; align-self: center; padding-top: 10px; padding-bottom: 15px;" id="title-poster"> </img>
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

        let okBtn = toast.el.querySelector("#imdb-lnk-ok-button")
        okBtn.onclick = () => {
            let rqst = new DeletePersonRequest()
            let globule = this.person.globule
            generatePeerToken(globule, token => {
                rqst.setPersonid(this.person.getId())
                rqst.setIndexpath(globule.config.DataPath + "/search/videos")
                globule.titleService.deletePerson(rqst, { application: Application.application, domain: Application.domain, token: token })
                    .then(() => {
                        ApplicationView.displayMessage(`${this.person.getFullname()} information was deleted`, 3000)
                        Model.publish(`delete_${this.person.getId()}_evt`, {}, true)
                    })
                    .catch(err => ApplicationView.displayMessage(err, 3000))
            })

            toast.dismiss();
        }
    }

    // Save will simply set value in the person attribute...
    save() {
        // The uuid
        let uuid = "_" + getUuidByString(this.person.getId())
        let container = this.shadowRoot.querySelector("#container")

        // get interface elements.
        let personBiographyInput = container.querySelector(`#${uuid}-person-biography-input`)
        let personUrlInput = container.querySelector(`#${uuid}-person-url-input`)
        let personIdInput = container.querySelector(`#${uuid}-person-id-input`)
        let personNameInput = container.querySelector(`#${uuid}-person-name-input`)
        let imageSelector = container.querySelector("globular-image-selector")
        let personAliasesInput = container.querySelector(`#${uuid}-person-aliases-input`)
        let personBirthdateInput = container.querySelector(`#${uuid}-person-birthdate-input`)
        let personBirthplaceInput = container.querySelector(`#${uuid}-person-birthplace-input`)

        // set values.
        this.person.setId(personIdInput.value)
        this.person.setFullname(personNameInput.value)
        this.person.setUrl(personUrlInput.value)
        this.person.setBiography(personBiographyInput.value)
        this.person.setPicture(imageSelector.getImageUrl())

        // little formatting...
        let aliases = personAliasesInput.value.split(",")
        aliases.forEach(a => { a = a.trim() })
        this.person.setAliasesList(aliases)

        this.person.setBirthdate(personBirthdateInput.value)
        this.person.setBirthplace(personBirthplaceInput.value)
    }

    getPerson() {
        return this.person
    }
}

customElements.define('globular-person-editor', PersonEditor)

/**
 * The title infos editor.
 */
export class TitleInfoEditor extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(title, titleInfosDisplay) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        this.titleInfosDisplay = titleInfosDisplay

        let imageUrl = "" // in case the video dosent contain any poster info...
        if (title.getPoster())
            imageUrl = title.getPoster().getContenturl()

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
            #container {
                display: flex;
                margin-top: 15px;
                margin-bottom: 15px;
            }

            .action-div{
                display: flex;
                justify-content: end;
                border-top: 2px solid;
                border-color: var(--palette-divider);
            }

            .button-div{
                display: table-cell;
                vertical-align: top;
            }

            .label{
                font-size: 1rem;
                padding-right: 10px;
                width: 175px;
            }

            div, paper-input, iron-autogrow-textarea {
                font-size: 1rem;
            }

            paper-button {
                font-size: 1rem;
            }

            a {
                color: var(--palette-divider);
            }

        </style>
        <div id="container">
            <div style="display: flex; flex-direction: column; justify-content: flex-start;  margin-left: 15px;">
                <div style="display: flex; flex-direction: column; margin: 5px;">
                    <globular-image-selector label="cover" url="${imageUrl}"></globular-image-selector>
                </div>
            </div>

            <div style="display: flex; flex-direction: column; width: 100%;">

                <div style="display: table; flex-grow: 1; margin-left: 20px; border-collapse: collapse; margin-top: 20px; margin-bottom: 10px;">
                    <div style="display: table-row; border-bottom: 1px solid var(--palette-divider)" >
                        <div class="label" style="display: table-cell; font-weight: 450; border-bottom: 1px solid var(--palette-divider)">Title</div>
                    </div>
                    <div style="display: table-row;">
                        <div class="label" style="display: table-cell; font-weight: 450; ">Id:</div>
                        <div style="display: table-cell; width: 100%;"  id="title-id-div">${title.getId()}</div>
                        <paper-input style="display: none; width: 100%;" value="${title.getId()}" id="title-id-input" no-label-float></paper-input>
                        <div class="button-div">
                            <paper-icon-button id="edit-title-id-btn" icon="image:edit"></paper-icon-button>
                        </div>
                    </div>

                    <div style="display: table-row;">
                        <div class="label" style="display: table-cell; font-weight: 450; ">Name:</div>
                        <div style="display: table-cell; width: 100%;"  id="title-name-div">${title.getName()}</div>
                        <paper-input style="display: none; width: 100%;" value="${title.getName()}" id="title-name-input" no-label-float></paper-input>
                        <div class="button-div">
                            <paper-icon-button id="edit-title-name-btn" icon="image:edit"></paper-icon-button>
                        </div>
                    </div>

                    <div style="display: table-row;">
                        <div class="label" style="display: table-cell; font-weight: 450; vertical-align: top;">Description:</div>
                        <div id="title-description-div" style="display: table-cell;width: 100%; padding-bottom: 10px;" >${title.getDescription()}</div>
                        <iron-autogrow-textarea id="title-description-input"  style="display: none; border: none; width: 100%;" value="${title.getDescription()}"></iron-autogrow-textarea>
                        <div class="button-div">
                            <paper-icon-button id="edit-title-description-btn" style="vertical-align: top;" icon="image:edit"></paper-icon-button>
                        </div>
                    </div>

                    <div style="display: table-row;">
                        <div class="label" style="display: table-cell; font-weight: 450;">Genres:</div>
                        <div id="title-genres-div" style="display: table-cell; width: 100%;"></div>
                    </div>
                    
                </div>

                <div id="directors-table" style="flex-grow: 1; margin-left: 20px; border-collapse: collapse;">
                <div style="display: table-row;  border-bottom: 1px solid var(--palette-divider);  margin-bottom: 10px;">
                        <div class="label" style="display: table-cell; font-weight: 450;">Directors</div>
                        <div style="display: table-cell; width: 100%;" ></div>
                        <div class="button-div" style="position: relative;">
                            <paper-icon-button id="add-director-btn" icon="social:person-add"></paper-icon-button>
                        </div>
                    </div>
                    <slot name="directors"></slot>
                </div>

                <div id="writers-table" style="flex-grow: 1; margin-left: 20px; border-collapse: collapse;">
                <div style="display: table-row;  border-bottom: 1px solid var(--palette-divider);  margin-bottom: 10px;">
                        <div class="label" style="display: table-cell; font-weight: 450;">Writers</div>
                        <div style="display: table-cell; width: 100%;" ></div>
                        <div class="button-div" style="position: relative;">
                            <paper-icon-button id="add-writer-btn" icon="social:person-add"></paper-icon-button>
                        </div>
                    </div>
                    <slot name="writers"></slot>
                </div>

                <div id="actors-table" style="flex-grow: 1; margin-left: 20px; border-collapse: collapse;">
                    <div style="display: table-row;  border-bottom: 1px solid var(--palette-divider);  margin-bottom: 10px;">
                        <div class="label" style="display: table-cell; font-weight: 450;">Actors</div>
                        <div style="display: table-cell; width: 100%;" ></div>
                        <div class="button-div" style="position: relative;">
                            <paper-icon-button id="add-actors-btn" icon="social:person-add"></paper-icon-button>
                        </div>
                    </div>
                    <slot name="actors"></slot>
                </div>

            </div>
        </div>
        <iron-collapse class="permissions" id="collapse-panel" style="display: flex; flex-direction: column; margin: 5px;">
        </iron-collapse>
        <div class="action-div" style="${this.isShort ? "display: none;" : ""}">
            <paper-button id="edit-permissions-btn" title="set who can edit this title informations">Permissions</paper-button>
            <span style="flex-grow: 1;"></span>
            <paper-button id="save-indexation-btn">Save</paper-button>
            <paper-button id="cancel-indexation-btn">Cancel</paper-button>
        </div>
        `

        // Here I will initialyse Casting...
        title.getDirectorsList().forEach(p => {
            this.appendPersonEditor(p, title, "directors")
        })

        title.getWritersList().forEach(p => {
            this.appendPersonEditor(p, title, "writers")
        })

        title.getActorsList().forEach(p => {
            this.appendPersonEditor(p, title, "actors")
        })

        let editPemissionsBtn = this.shadowRoot.querySelector("#edit-permissions-btn")
        let collapse_panel = this.shadowRoot.querySelector("#collapse-panel")

        this.permissionManager = new PermissionsManager()
        this.permissionManager.permissions = null
        this.permissionManager.globule = title.globule
        this.permissionManager.setPath(title.getId())
        this.permissionManager.setResourceType = "title_info"

        let indexPath = title.globule.config.DataPath + "/search/titles"

        // toggle the collapse panel when the permission manager panel is close.
        this.permissionManager.onclose = () => {
            collapse_panel.toggle();
        }

        // I will display the permission manager.
        editPemissionsBtn.onclick = () => {
            collapse_panel.appendChild(this.permissionManager)
            collapse_panel.toggle();
        }

        // Here I will set the interaction...
        this.shadowRoot.querySelector("#cancel-indexation-btn").onclick = () => {
            let parent = this.parentNode
            parent.removeChild(this)
            parent.appendChild(titleInfosDisplay)
        }

        // Delete the postser/cover image.
        this.shadowRoot.querySelector("globular-image-selector").ondelete = () => {
            title.getPoster().setContenturl("")
        }

        // Select new image.
        this.shadowRoot.querySelector("globular-image-selector").onselectimage = () => {
            if (title.getPoster() == null) {
                let poster = new Poster()
                title.setPoster(poster)
            }
            title.getPoster().setContenturl(dataUrl)
        }

        // Set the list selector.
        let tileGenresDiv = this.shadowRoot.querySelector("#title-genres-div")
        let videoGenresList = new EditableStringList(title.getGenresList())
        tileGenresDiv.appendChild(videoGenresList)


        // The title name
        let editVideoNameBtn = this.shadowRoot.querySelector("#edit-title-name-btn")
        let videoNameInput = this.shadowRoot.querySelector("#title-name-input")
        let videoNameDiv = this.shadowRoot.querySelector("#title-name-div")

        editVideoNameBtn.onclick = () => {
            videoNameInput.style.display = "table-cell"
            videoNameDiv.style.display = "none"
            setTimeout(() => {
                videoNameInput.focus()
                videoNameInput.inputElement.inputElement.select()
            }, 100)
        }

        videoNameInput.onblur = () => {
            videoNameInput.style.display = "none"
            videoNameDiv.style.display = "table-cell"
            videoNameDiv.innerHTML = videoNameInput.value
        }

        // The title id
        let editVideoIdBtn = this.shadowRoot.querySelector("#edit-title-id-btn")
        let videoIdInput = this.shadowRoot.querySelector("#title-id-input")
        let videoIdDiv = this.shadowRoot.querySelector("#title-id-div")

        editVideoIdBtn.onclick = () => {
            videoIdInput.style.display = "table-cell"
            videoIdDiv.style.display = "none"
            setTimeout(() => {
                videoIdInput.focus()
                videoIdInput.inputElement.inputElement.select()
            }, 100)
        }

        videoIdInput.onblur = () => {
            videoIdInput.style.display = "none"
            videoIdDiv.style.display = "table-cell"
            videoIdDiv.innerHTML = videoIdInput.value
        }

        // The video description
        let editVideoDescriptionBtn = this.shadowRoot.querySelector("#edit-title-description-btn")
        let videoVideoDescriptionInput = this.shadowRoot.querySelector("#title-description-input")
        let videoVideoDescriptionDiv = this.shadowRoot.querySelector("#title-description-div")

        editVideoDescriptionBtn.onclick = () => {
            videoVideoDescriptionInput.style.display = "table-cell"
            videoVideoDescriptionDiv.style.display = "none"
            setTimeout(() => {
                videoVideoDescriptionInput.focus()
                videoVideoDescriptionInput.textarea.select()
            }, 100)
        }

        // set back to non edit mode.
        videoVideoDescriptionInput.onblur = () => {
            videoVideoDescriptionInput.style.display = "none"
            videoVideoDescriptionDiv.style.display = "table-cell"
            videoVideoDescriptionDiv.innerHTML = videoVideoDescriptionInput.value
        }

    }

    appendPersonEditor(person, title, slot) {
        person.globule = title.globule
        let uuid = "_" + getUuidByString(person.getId() + slot)

        // Create the person editor.
        let personEditor = this.querySelector(`#${uuid}`)

        if (personEditor == null) {
            personEditor = new PersonEditor(person, title)
            personEditor.id = uuid;

            personEditor.slot = slot

            personEditor.onremovefromcast = (p) => {
                personEditor.parentNode.removeChild(personEditor)
            }

            // Append to the list of casting
            this.appendChild(personEditor)
        }

        return personEditor
    }
}

customElements.define('globular-title-info-editor', TitleInfoEditor)

/**
 * Globular title information panel.
 */
export class TitleInfo extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(titleDiv, isShort, globule) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });


        if (!globule) {
            this.globule = Model.globular
        }

        this.isShort = isShort
        this.titleDiv = titleDiv
        this.globule = globule

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
            ${__style__}

            .title-div{
     
            }

            .action-div{
                display: flex;
                justify-content: end;
            }

            .title-poster-img{
                max-width: 320px;
                max-height: 350px;
                object-fit: cover;
                width: auto;
                height: auto;
            }

            paper-card{
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

            @media only screen and (max-width: 600px) {
                .title-div{
                    max-height: calc(100vh - 300px);
                    overflow-y: auto;
                    overflow-x: hidden;
                }

                .title-poster-img{
                    max-width: 256px;
                    max-height: 256px;
                    object-fit: cover;
                    width: auto;
                    height: auto;
                }
            }


        </style>
        <div class="title-div" >
            <div style="display: flex; flex-direction: column;"> 
                <div class="title-poster-div" style="${this.isShort ? "display: none;" : ""}">
                    <img class="title-poster-img"></img>
                </div>
                <div class="title-files-div" style="${this.isShort ? "display: none;" : ""}">
                    <paper-progress indeterminate></paper-progress>
                </div>
            </div>
            <div class="title-informations-div">
                <div class="title-genres-div"></div>
                <p class="title-synopsis-div" style="${this.isShort ? "display: none;" : ""}"></p>
                <div class="title-rating-div">
                    <iron-icon class="rating-star" icon="icons:star"></iron-icon>
                    <div style="display: flex; flex-direction: column;">
                        <div><span id="rating-span"></span>/10</div>
                        <div id="rating-total-div"></div>
                    </div>
                </div>
                <div class="title-top-credit" style="${this.isShort ? "display: none;" : ""}">
                    <div class="title-credit">
                        <div id="title-directors-title" class="title-credit-title">Director</div>
                        <div  id="title-directors-lst" class="title-credit-lst"></div>
                    </div>
                    <div class="title-credit">
                        <div id="title-writers-title" class="title-credit-title">Writer</div>
                        <div id="title-writers-lst" class="title-credit-lst"></div>
                    </div>
                    <div class="title-credit">
                        <div id="title-actors-title" class="title-credit-title">Star</div>
                        <div id="title-actors-lst" class="title-credit-lst"></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="action-div" style="${this.isShort ? "display: none;" : ""}">
            <paper-button id="edit-indexation-btn">Edit</paper-button>
            <paper-button id="delete-indexation-btn">Delete</paper-button>
        </div>
        `
    }

    showTitleInfo(title) {
        let uuid = randomUUID()
        let html = `
        <paper-card id="video-info-box-dialog-${uuid}" style="background: var(--palette-background-default); border-top: 1px solid var(--palette-background-paper); border-left: 1px solid var(--palette-background-paper);">
            <globular-informations-manager id="title-info-box"></globular-informations-manager>
        </paper-card>
        `
        let titleInfoBox = document.getElementById("title-info-box")
        if (titleInfoBox == undefined) {
            let range = document.createRange()
            document.body.appendChild(range.createContextualFragment(html))
            titleInfoBox = document.getElementById("title-info-box")
            let parent = document.getElementById("video-info-box-dialog-" + uuid)
            parent.style.position = "fixed"
            parent.style.top = "75px"
            parent.style.left = "50%"
            parent.style.transform = "translate(-50%)"

            titleInfoBox.onclose = () => {
                parent.parentNode.removeChild(parent)
            }
        }
        titleInfoBox.setTitlesInformation([title])
    }

    setTitle(title) {

        let posterUrl = ""
        if (title.getPoster() != undefined) {
            posterUrl = title.getPoster().getContenturl()
        }

        // set title values.
        this.shadowRoot.querySelector(".title-synopsis-div").innerHTML = title.getDescription()
        this.shadowRoot.querySelector("#rating-span").innerHTML = title.getRating().toFixed(1)
        this.shadowRoot.querySelector("#rating-total-div").innerHTML = title.getRatingcount()
        this.shadowRoot.querySelector(".title-poster-img").src = posterUrl


        // Set the title div.
        this.titleDiv.innerHTML = `
           <h1 id="title-name" class="title" style="${this.isShort ? "font-size: 1.2rem;text-align: left; margin-bottom: 10px;" : ""}"> </h1>
           <h3 class="title-sub-title-div" style="${this.isShort ? "font-size: 1rem; max-width: 500px;" : ""}">             
               <span id="title-type"></span>
               <span id="title-year"></span>
               <span id="title-duration"></span>
           </h3>
           `
        this.titleDiv.querySelector("#title-name").innerHTML = title.getName();
        this.titleDiv.querySelector("#title-type").innerHTML = title.getType();
        this.titleDiv.querySelector("#title-year").innerHTML = title.getYear();
        if (title.getType() == "TVEpisode") {
            if (title.getSeason() > 0 && title.getEpisode() > 0) {
                this.titleDiv.querySelector("#title-year").innerHTML = `<span>${title.getYear()}</span>&middot<span>S${title.getSeason()}</span>&middot<span>E${title.getEpisode()}</span>`
            }
        }

        this.titleDiv.querySelector("#title-duration").innerHTML = title.getDuration();

        let genresDiv = this.shadowRoot.querySelector(".title-genres-div")
        title.getGenresList().forEach(g => {
            let genreSpan = document.createElement("span")
            genreSpan.classList.add("title-genre-span")
            genreSpan.innerHTML = g
            genresDiv.appendChild(genreSpan)
        })

        // Display list of persons...
        let displayPersons = (div, persons) => {
            persons.forEach(p => {
                let uuid = "_" + getUuidByString(p.getId())
                let lnk = div.querySelector(`#${uuid}`)
                if (!lnk) {
                    lnk = document.createElement("a")
                }

                lnk.href = p.getUrl()
                lnk.innerHTML = p.getFullname()
                lnk.target = "_blank"
                lnk.id = uuid

                div.appendChild(lnk)
            })
        }

        // display directors
        displayPersons(this.shadowRoot.querySelector("#title-directors-lst"), title.getDirectorsList())
        if (title.getDirectorsList().length > 0) {
            this.shadowRoot.querySelector("#title-directors-title").innerHTML = "Directors"
        }

        // display writers
        displayPersons(this.shadowRoot.querySelector("#title-writers-lst"), title.getWritersList())
        if (title.getWritersList().length > 0) {
            this.shadowRoot.querySelector("#title-writers-title").innerHTML = "Writers"
        }

        // display actors
        displayPersons(this.shadowRoot.querySelector("#title-actors-lst"), title.getActorsList())
        if (title.getActorsList().length > 0) {
            this.shadowRoot.querySelector("#title-actors-title").innerHTML = "Actors"
        }

        let filesDiv = this.shadowRoot.querySelector(".title-files-div")
        if (title.getType() != "TVSeries") {
            filesDiv.style.paddingLeft = "15px"
            GetTitleFiles("/search/titles", title, filesDiv, (previews) => {
                filesDiv.querySelector("paper-progress").style.display = "none"
            })
        } else {
            // Here the title is a series...
            let indexPath = title.globule.config.DataPath + "/search/titles"
            GetEpisodes(indexPath, title, (episodes) => {
                if (title.onLoadEpisodes != null) {
                    title.onLoadEpisodes(episodes)
                }
                this.displayEpisodes(episodes, filesDiv)
                filesDiv.querySelector("paper-progress").style.display = "none"
            })
        }


        let editor = new TitleInfoEditor(title, this)

        let editIndexationBtn = this.shadowRoot.querySelector("#edit-indexation-btn")
        editIndexationBtn.onclick = () => {
            // So here I will display the editor...
            let parent = this.parentNode
            parent.removeChild(this)
            parent.appendChild(editor)
        }

        let deleteIndexationBtn = this.shadowRoot.querySelector("#delete-indexation-btn")

        // Delete the indexation from the database.
        deleteIndexationBtn.onclick = () => {
            let toast = ApplicationView.displayMessage(`
               <style>
                  
               </style>
               <div id="select-media-dialog">
                   <div>Your about to delete indexation</div>
                   <p style="font-style: italic;  max-width: 300px;" id="title-type"></p>
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


            toast.el.querySelector("#title-type").innerHTML = title.getName()
            toast.el.querySelector("#title-poster").src = posterUrl

            let okBtn = toast.el.querySelector("#imdb-lnk-ok-button")
            okBtn.onclick = () => {
                let rqst = new DeleteTitleRequest()
                let globule = title.globule
                generatePeerToken(globule, token => {
                    rqst.setTitleid(title.getId())
                    rqst.setIndexpath(globule.config.DataPath + "/search/titles")
                    globule.titleService.deleteTitle(rqst, { application: Application.application, domain: Application.domain, token: token })
                        .then(() => {
                            ApplicationView.displayMessage(`file indexation was deleted`, 3000)
                            this.parentNode.removeChild(this)
                        })
                        .catch(err => ApplicationView.displayMessage(err, 3000))

                })

                toast.dismiss();
            }
        }

    }

    // Here I will display the list of each episodes from the list...
    displayEpisodes(episodes, filesDiv) {
        let seasons = {}

        episodes.forEach(e => {
            if (e.getType() == "TVEpisode") {
                if (e.getSeason() > 0) {
                    if (seasons[e.getSeason()] == null) {
                        seasons[e.getSeason()] = []
                    }
                    if (seasons[e.getSeason()].filter(e_ => e_.getEpisode() === e.getEpisode()).length == 0) {
                        seasons[e.getSeason()].push(e)
                    }
                }
            }
        })

        let html = `
        <style>
            .episodes-div{
               display: flex;
               flex-direction: column;
               width: 100%;
            }

            .header {
                display: flex;
                width: 100%;
            }

            .season-page-div{
                display: flex;
                flex-wrap: wrap;
            }

            .episode-small-div{
                display: flex;
                margin: 10px;
                position: relative;
            }

            .episode-small-div img{
                object-fit: cover;
                width: 100%;
                height: 132px;
                max-width: 175px;
                min-width: 140px;
            }

            .slide-on-panel{
                position: absolute;
                bottom: 0px;
                left: 0px;
                right: 0px;
                background: rgba(0,0,0,.65);
                padding: 5px;
                border-top: 1px solid black;
                display: flex;
                align-items: center;
            }

            .slide-on-panel-title-name{
                flex-grow: 1;
                font-size: .85rem;
            }

            .episode-number-div {
                top: 2px;
                right: 10px;
                color: lightgray;
                position: absolute;
                font-weight: 600;
                font-size: larger;
            }

            .play-episode-button{
                position: absolute;
                /*--iron-icon-fill-color: rgb(0, 179, 255);*/
            }

            paper-tab{
                font-size: 1rem;
                font-weight: bold;
            }

            paper-tabs{
                /* custom CSS property */
                --paper-tabs-selection-bar-color: var(--palette-primary-main); 
                color: var(--palette-text-primary);
                --paper-tab-ink: var(--palette-action-disabled);
            }

        </style>
        <div class="episodes-div">
            <div class="header">
                <paper-tabs selected="0" scrollable style="width: 100%;"></paper-tabs>
            </div>
            <div id="episodes-content" style="width: 100%; height: 355px; overflow-y: auto;">

            </div>
        </div>
        `
        let range = document.createRange()
        filesDiv.appendChild(range.createContextualFragment(html))

        let tabs = filesDiv.querySelector("paper-tabs")
        let content = filesDiv.querySelector("#episodes-content")
        let index = 0
        for (var s in seasons) {

            let html = `<paper-tab id="tab-season-${s}">Season ${s}<paper-tab>`
            tabs.appendChild(range.createContextualFragment(html))

            // Now the episodes panel...
            let episodes = seasons[s]
            let page = document.createElement("div")
            page.classList.add("season-page-div")
            content.appendChild(page)
            if (index > 0) {
                page.style.display = "none"
            }
            let tab = tabs.querySelector(`#tab-season-${s}`)
            tab.onclick = () => {
                let pages = content.querySelectorAll(".season-page-div")
                for (let i = 0; i < pages.length; i++) {
                    pages[i].style.display = "none"
                }

                page.style.display = "flex"
            }

            episodes.forEach(e => {
                let posterUrl = ""
                if (e.getPoster() != undefined) {
                    posterUrl = e.getPoster().getContenturl()
                }
                let uuid = randomUUID()
                let html = `
                    <div class="episode-small-div">
                        <div class="episode-number-div">${e.getEpisode()}</div>
                        <paper-icon-button id="_${uuid}" class="play-episode-button" icon="av:play-circle-filled" ></paper-icon-button>
                        <img src="${posterUrl}"></img>
                        <div class="slide-on-panel">
                            <div class="slide-on-panel-title-name">
                                ${e.getName()}
                            </div>
                            <paper-icon-button id="infos-btn-${uuid}" icon="icons:info-outline"></paper-icon-button>
                        </div>
                    </div>
                `

                page.appendChild(range.createContextualFragment(html))

                let infosBtn = page.querySelector(`#infos-btn-${uuid}`)
                infosBtn.onclick = (evt) => {
                    evt.stopPropagation()
                    this.showTitleInfo(e)
                }

                let playBtn = page.querySelector(`#_${uuid}`)

                playBtn.onclick = () => {
                    let indexPath = e.globule.config.DataPath + "/search/titles"
                    let rqst = new GetTitleFilesRequest
                    let globule = e.globule
                    rqst.setTitleid(e.getId())
                    rqst.setIndexpath(indexPath)
                    globule.titleService.getTitleFiles(rqst, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
                        .then(rsp => {
                            let path = rsp.getFilepathsList().pop()
                            let titleInfoBox = document.getElementById("title-info-box")
                            let parentNode = null
                            if (titleInfoBox) {
                                parentNode = titleInfoBox.parentNode
                            }

                            playVideo(path,
                                (video) => {
                                    if (titleInfoBox) {
                                        if (titleInfoBox.parentNode) {
                                            titleInfoBox.parentNode.removeChild(titleInfoBox)
                                        }
                                        // video.toggleFullscreen();
                                    }
                                },
                                () => {
                                    if (parentNode != null) {
                                        parentNode.appendChild(titleInfoBox)
                                    }
                                }, e, globule)

                        }).catch(err => ApplicationView.displayMessage(err, 3000))
                }

            })
            index++
        }

    }
}

customElements.define('globular-title-info', TitleInfo)



/**
 * That panel will display the file Metadata information.
 */
export class FileMetaDataInfo extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            #container{
                display: table;
                flex-grow: 1; 
                border-collapse: collapse;
                width: 100%;
            }

            .label{
                display: table-cell;
            }

            .value{
                display: table-cell;
            }

        </style>
        <div id="container">
            <div style="display: flex;  border-bottom: 1px solid var(--palette-divider);  margin-bottom: 10px; align-items: center;">
                <paper-icon-button id="collapse-btn"  icon="unfold-less" --iron-icon-fill-color:var(--palette-text-primary);"></paper-icon-button>
                <div id="header-text" class="label" style="flex-grow: 1;"></div>
            </div>
            <iron-collapse class="" id="collapse-panel">
                <slot></slot>
            </iron-collapse>
        </div>
        `
        // give the focus to the input.
        let container = this.shadowRoot.querySelector("#container")
        let collapse_btn = container.querySelector("#collapse-btn")

        let collapse_panel = container.querySelector("#collapse-panel")
        collapse_btn.onclick = () => {
            if (!collapse_panel.opened) {
                collapse_btn.icon = "unfold-more"
            } else {
                collapse_btn.icon = "unfold-less"
            }
            collapse_panel.toggle();
        }

    }

    // Call search event.
    setMetadata(metadata) {
        console.log(metadata)
        this.shadowRoot.querySelector("#header-text").innerHTML = `(${metadata.fieldsMap.length})`
        let range = document.createRange()
        metadata.fieldsMap.forEach(val => {
            let id = val[0]
            let value = val[1]
            let label = id.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
            let html = `
                <div  style="display: table-row; padding-top: 5px; padding-bottom: 5px; border-bottom: 1px solid var(--palette-divider); width:100%;">
                    <div class="label" style="display: table-cell; min-width: 200px;">${label}</div>
                    <div id="${id}" class="value" style="display: table-cell; width: 100%;"></div>
                </div>
            `

            if (id == "Comment") {
                // the comment is use to store video metadata...
                try {
                    value.structValue = JSON.parse(atob(value.stringValue))
                } catch (e) {
                    console.log(e)
                }
            }

            this.appendChild(range.createContextualFragment(html))
            let div = this.querySelector(`#${id}`)
            this.setValue(div, value)
        })
    }

    // display the value.
    setValue(div, value) {
        if (value.structValue) {
            div.innerHTML = value.structValue
            console.log(value.structValue)
        } else if (value.stringValue) {
            div.innerHTML = value.stringValue
        } else if (value.numberValue) {
            div.innerHTML = value.numberValue
        } else if (value.nullValue) {
            div.innerHTML = value.nullValue
        } else if (value.boolValue) {
            div.innerHTML = value.boolValue
        }
    }
}

customElements.define('globular-file-metadata-info', FileMetaDataInfo)

/**
 * Display basic file informations.
 */
export class FileInfo extends HTMLElement {

    // Create the applicaiton view.
    constructor(file) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
        let mime = file.mime

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           

            #container {
                display: flex;
                /*background-color: var(--palette-background-paper);*/
                color: var(--palette-text-primary);
            }

        </style>
        <div id="container">
            <div>
                <img style="max-height: 180px;" src="${file.thumbnail}"></img>
            </div>
            <div style="display: table; flex-grow: 1; padding-left: 20px;">
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Name:</div>
                    <div style="display: table-cell;">${file.name}</div>
                </div>
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Type:</div>
                    <div style="display: table-cell;">${mime}</div>
                </div>
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Location:</div>
                    <div style="display: table-cell;">${file.path}</div>
                </div>
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Modified:</div>
                    <div style="display: table-cell;">${file.modeTime}</div>
                </div>
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Size:</div>
                    <div style="display: table-cell;">${getFileSizeString(file.size)}</div>
                </div>
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Checksum:</div>
                    <div style="display: table-cell;">${file.checksum}</div>
                </div>
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Metadata:</div>
                    <div style="display: table-cell;">
                        <globular-file-metadata-info></globular-file-metadata-info>
                    </div>
                </div>
            </div>
        </div>
        `

        let metadata_editor = this.shadowRoot.querySelector("globular-file-metadata-info")
        metadata_editor.setMetadata(file.metadata)
    }


}

customElements.define('globular-file-info', FileInfo)

/**
 * Display webpage information.
 */
export class WebpageInfo extends HTMLElement {

    // Create the applicaiton view.
    constructor(webpage) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           

            #container {
                display: flex;
                postion:relative;
                /*background-color: var(--palette-background-paper)*/;
                color: var(--palette-text-primary);
            }

            .image-box {
                width: 120px;
                max-height: 120px;
                overflow: hidden;
                height: auto;
                
            }

            .image-box img {
                width: 100%;

                -o-object-fit: cover;
                object-fit: cover;
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
             
            .image-box:hover{
                overflow: auto;
                width: 65%;
                max-height: calc(100vh - 85px);
                position:fixed;
                top: 75px;
                left: calc(-50vw + 50%);
                right: calc(-50vw + 50%);
                margin-left: auto;
                margin-right: auto;
                -webkit-box-shadow: var(--dark-mode-shadow);
                -moz-box-shadow: var(--dark-mode-shadow);
                box-shadow: var(--dark-mode-shadow);
            }

        </style>
        <div id="container">
            <div class="image-box">
                <img src="${webpage.thumbnail}"></img>
            </div>
            <div style="display: table; flex-grow: 1; padding-left: 20px;">
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Id:</div>
                    <div style="display: table-cell;">${webpage._id}</div>
                </div>
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Name:</div>
                    <div style="display: table-cell;">${webpage.name}</div>
                </div>
            </div>
        </div>
        `
    }

}

customElements.define('globular-webpage-info', WebpageInfo)


/**
 * Display basic application informations.
 */
export class ApplicationInfo extends HTMLElement {

    // Create the applicaiton view.
    constructor(application) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           

            #container {
                display: flex;
                /*background-color: var(--palette-background-paper)*/;
                color: var(--palette-text-primary);
            }

            img{
                height: 80px;
            }

        </style>
        <div id="container">
            <div>
                <img src="${application.getIcon()}"></img>
            </div>
            <div style="display: table; flex-grow: 1; padding-left: 20px;">
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Id:</div>
                    <div style="display: table-cell;">${application.getId()}</div>
                </div>
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Alias:</div>
                    <div style="display: table-cell;">${application.getAlias()}</div>
                </div>
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Publisher:</div>
                    <div style="display: table-cell;">${application.getPublisherid()}</div>
                </div>
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Description:</div>
                    <div style="display: table-cell;">${application.getDescription()}</div>
                </div>
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Version:</div>
                    <div style="display: table-cell;">${application.getVersion()}</div>
                </div>
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Path:</div>
                    <div style="display: table-cell;">${application.getPath()}</div>
                </div>
            </div>
        </div>
        `
    }

}

customElements.define('globular-application-info', ApplicationInfo)

/**
 * Display basic file informations.
 */
export class GroupInfo extends HTMLElement {

    // Create the applicaiton view.
    constructor(group) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           

            #container {
                display: flex;
                /*background-color: var(--palette-background-paper);*/
                color: var(--palette-text-primary);
            }

        </style>
        <div id="container">
            <div>
                <iron-icon id="icon" icon="social:people" style="height: 40px; width: 40px; padding-left: 15px;"></iron-icon>
            </div>
            <div style="display: table; flex-grow: 1; padding-left: 20px;">
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Id:</div>
                    <div style="display: table-cell;">${group.id}</div>
                </div>
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Name:</div>
                    <div style="display: table-cell;">${group.name}</div>
                </div>

                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Members:</div>
                    <div style="display: table-cell;">${listToString(group.members)}</div>
                </div>
            </div>
        </div>
        `
    }

}

customElements.define('globular-group-info', GroupInfo)

/**
 * Display basic organization informations.
 */
export class OrganizationInfo extends HTMLElement {

    // Create the applicaiton view.
    constructor(org) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           

            #container {
                display: flex;
                /*background-color: var(--palette-background-paper);*/
                color: var(--palette-text-primary);
            }

        </style>
        <div id="container">
            <div>
                <iron-icon id="icon" icon="social:domain" style="height: 40px; width: 40px; padding-left: 15px;"></iron-icon>
            </div>
            <div style="display: table; flex-grow: 1; padding-left: 20px;">
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Id:</div>
                    <div style="display: table-cell;">${org.getId()}</div>
                </div>
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Name:</div>
                    <div style="display: table-cell;">${org.getName()}</div>
                </div>

                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Accounts:</div>
                    <div style="display: table-cell;">${listToString(org.getAccountsList())}</div>
                </div>
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Groups:</div>
                    <div style="display: table-cell;">${listToString(org.getGroupsList())}</div>
                </div>
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Roles:</div>
                    <div style="display: table-cell;">${listToString(org.getRolesList())}</div>
                </div>
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Applications:</div>
                    <div style="display: table-cell;">${listToString(org.getApplicationsList())}</div>
                </div>
            </div>
        </div>
        `
    }

}

customElements.define('globular-organization-info', OrganizationInfo)


/**
 * Display basic blog informations.
 */
export class BlogPostInfo extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(blogPost, short, globule) {
        super()

        // Keep the blogPost source...
        this.globule = globule
        this.blogPost = blogPost

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        let creationTime = new Date(blogPost.getCreationtime() * 1000)
        let status = "Draft"
        if (blogPost.getStatus() == 1) {
            status = "Published"
        } else if (blogPost.getStatus() == 2) {
            status = "Archived"
        }


        if (short != undefined) {
            if (short == true) {
                this.setAttribute("short", "true")
            } else {
                this.setAttribute("short", "false")
            }
        } else {
            this.setAttribute("short", "false")
        }

        // Now if the thumbnail is not empty...
        let thumbnail = blogPost.getThumbnail()

        // Innitialisation of the layout.
        if (this.getAttribute("short") == "true") {
            this.shadowRoot.innerHTML = `
            <style>
               
                #container {
                    /*background-color: var(--palette-background-paper);*/
                    color: var(--palette-text-primary);
                }

                .blog-post-card {
                    display: flex;
                    flex-direction: column;

                    border-radius: 3.5px;
                    border: 1px solid var(--palette-divider);
                    width: 320px;
                    margin: 10px;
                    height: 285px;
                    margin: 10px;
                    overflow: hidden;
                }

                .blog-post-card:hover{
                    box-shadow: rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px;
                    cursor: pointer;
                }
    

                .blog-post-card img{
                    align-self: center;
                }

                .blog-post-card div{
                    display: block;
                    padding: 5px;
                }

                img{
                    border-top-left-radius: 3.5px;
                    border-top-right-radius: 3.5px;
                    object-fit: cover;
                    width: 500px;
                    position: absolute;
                    top: -10px;
                    left: -10px;

                }

                .blog-title{
                    font-weight: 400;
                    font-size: 18px;
                    line-height: 24px;
                    font-weight: bold;
                }

                .blog-subtitle{
                    font-weight: 400;
                    line-height: 24px;
                    font-size: 16px;
                }

                .blog-author {
                    font-weight: bold;
                }

                .blog-author, .blog-creation-date{
                    line-height: 16px;
                    font-size: 12px;
                }

                .image-box {
                    position: relative;
                    margin: auto;
                    overflow: hidden;
                    width: 100%;
                    height:50%;
                }

                .image-box img {
                    max-width: 100%;
                    transition: all 0.3s;
                    display: block;
                    height: auto;
                    transform: scale(1.05);
                }

                #thumbnail_img {
                    height: 100% !important;
                    min-width: 100%;
                    object-fit: cover;
                    width: 128px; 
                    padding-left: 10px; 
                    padding-top: 10px
                }
    
            </style>
            <div id="container" class="blog-post-card">
                <div class="image-box">
                    <img  id="thumbnail_img" style="display:${thumbnail.length == 0 ? "none" : "block"};" src="${thumbnail}"></img>
                </div>
                <span style="flex-grow: 1;"></span>
                <div id="title_div" class="blog-title">${blogPost.getTitle()}</div>
                <div id="sub_title_div" class="blog-subtitle">${blogPost.getSubtitle()}</div>
                <div style="display: flex;">
                    <div id="author_div" class="blog-author" style="flex-grow: 1;">${blogPost.getAuthor()}</div>
                    <div id="creation_time_div" class="blog-creation-date">${creationTime.toLocaleDateString()}</div>
                </div>
            </div>
            `

            this.shadowRoot.querySelector("#container").onmouseover = () => {
                this.shadowRoot.querySelector("img").style.transform = "scale(1)"
            }

            this.shadowRoot.querySelector("#container").onmouseout = () => {
                this.shadowRoot.querySelector("img").style.transform = ""
            }

        } else {
            this.shadowRoot.innerHTML = `
            <style>
               
                #container {
                    display: flex;
                    /*background-color: var(--palette-background-paper);*/
                    color: var(--palette-text-primary);
                    user-select: none;
                }
    
                #thumbnail_img {
                    height: 100% !important;
                    min-width: 100%;
                    object-fit: cover;
                    width: 128px; 
                    padding-left: 10px; 
                    padding-top: 10px
                }
            </style>
            <div id="container">
                <div>
                   <img id="thumbnail_img" style="display:${thumbnail.length == 0 ? "none" : "block"};" src="${thumbnail}"></img>
                </div>
                <div style="display: table; flex-grow: 1; padding-left: 20px;">
                    <div style="display: table-row;">
                        <div style="display: table-cell; font-weight: 450;">Id:</div>
                        <div style="display: table-cell;">${blogPost.getUuid()}</div>
                    </div>
                    <div style="display: table-row;">
                        <div style="display: table-cell; font-weight: 450;">Title:</div>
                        <div id="title_div" style="display: table-cell;">${blogPost.getTitle()}</div>
                    </div>
                    <div style="display: table-row;">
                        <div style="display: table-cell; font-weight: 450;">subtitle:</div>
                        <div id="sub_title_div" style="display: table-cell;">${blogPost.getSubtitle()}</div>
                    </div>
                    <div style="display: table-row;">
                        <div style="display: table-cell; font-weight: 450;">Author:</div>
                        <div id="author_div" style="display: table-cell;">${blogPost.getAuthor()}</div>
                    </div>
                    <div style="display: table-row;">
                        <div style="display: table-cell; font-weight: 450;">Status:</div>
                        <div style="display: table-cell;">${status}</div>
                    </div>
                    <div style="display: table-row;">
                        <div style="display: table-cell; font-weight: 450;">Language:</div>
                        <div style="display: table-cell;">${blogPost.getLanguage()}</div>
                    </div>
                    <div style="display: table-row;">
                        <div style="display: table-cell; font-weight: 450;">Date:</div>
                        <div id="creation_time_div" style="display: table-cell;">${creationTime.toLocaleDateString()}</div>
                    </div>
    
                    <div style="display: table-row;">
                        <div style="display: table-cell; font-weight: 450;">Keywords:</div>
                        <div style="display: table-cell;">${listToString(blogPost.getKeywordsList())}</div>
                    </div>
                </div>
            </div>
            `
        }


        Model.getGlobule(blogPost.getDomain()).eventHub.subscribe(blogPost.getUuid() + "_blog_updated_event", uuid => { }, evt => {

            readBlogPost(blogPost.getDomain(), blogPost.getUuid(), b => {
                this.blog = b
                let creationTime = new Date(this.blogPost.getCreationtime() * 1000)
                let thumbnail = this.blog.getThumbnail()
                if (!thumbnail) {
                    thumbnail = ""
                }


                // update fields
                this.shadowRoot.querySelector("#creation_time_div").innerHTML = creationTime.toLocaleDateString()
                this.shadowRoot.querySelector("#sub_title_div").innerHTML = this.blogPost.getSubtitle()
                this.shadowRoot.querySelector("#title_div").innerHTML = this.blogPost.getTitle()
                this.shadowRoot.querySelector("#author_div").innerHTML = this.blogPost.getAuthor()
                if (thumbnail.length > 0) {
                    this.shadowRoot.querySelector("#thumbnail_img").src = thumbnail
                }

            }, err => ApplicationView.displayMessage(err, 3000))


        }, false, this)


        // so here I will retreive more information about the author if it's available...
        this.shadowRoot.querySelector("#container").onclick = () => {
            Model.eventHub.publish("_display_blog_event_", { blogPost: this.blogPost, globule: globule }, true)
        }


        Model.eventHub.subscribe(blogPost.getUuid() + "_blog_delete_event", uuid => { },
            evt => {
                // simplity remove it from it parent...
                if (this.parentNode)
                    this.parentNode.removeChild(this)
            }, false, this)



    }

    connectedCallback() {

    }

}

customElements.define('globular-blog-post-info', BlogPostInfo)


/**
 * Display package informations.
 */
export class PackageInfo extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(descriptor) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        let packageType = "Application Package"
        if (descriptor.getType() == 1) {
            packageType = "Service Package"
        }

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           

            #container {
                display: flex;
                /*background-color: var(--palette-background-paper);*/
                color: var(--palette-text-primary);
            }

        </style>
        <div id="container">
            <div style="display: flex; flex-direction: column; justify-content: flex-start;  padding-left: 15px;">
                <iron-icon id="icon" icon="icons:archive" style="height: 40px; width: 40px;"></iron-icon>
                <span style="font-weight: 450;">${packageType}</span>
            </div>
            <div style="display: table; flex-grow: 1; padding-left: 20px;">
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Id:</div>
                    <div style="display: table-cell;">${descriptor.getId()}</div>
                </div>
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Name:</div>
                    <div style="display: table-cell;">${descriptor.getName()}</div>
                </div>
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Version:</div>
                    <div style="display: table-cell;">${descriptor.getVersion()}</div>
                </div>
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Publisher Id:</div>
                    <div style="display: table-cell;">${descriptor.getPublisherid()}</div>
                </div>
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Description:</div>
                    <div style="display: table-cell;">${descriptor.getDescription()}</div>
                </div>
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Keywords:</div>
                    <div style="display: table-cell;">${listToString(descriptor.getKeywordsList())}</div>
                </div>
            </div>
        </div>
        `
    }

}

customElements.define('globular-package-info', PackageInfo)


export class RoleInfo extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(role) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
            #container {
                display: flex;
            }

        </style>
        <div id="container">
            <div>
                <iron-icon id="icon" icon="notification:enhanced-encryption" style="height: 40px; width: 40px; padding-left: 15px;"></iron-icon>
            </div>
            <div style="display: table; flex-grow: 1; padding-left: 20px;">
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Id:</div>
                    <div style="display: table-cell;">${role.getId()}</div>
                </div>
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Name:</div>
                    <div style="display: table-cell;">${role.getName()}</div>
                </div>

                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Accounts:</div>
                    <div style="display: table-cell;">${listToString(role.getMembersList())}</div>
                </div>
            </div>
        </div>
        `
    }

}

customElements.define('globular-role-info', RoleInfo)

/**
 * Display basic blog informations.
 */
export class ConversationInfo extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(conversation) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        let creationTime = new Date(conversation.getCreationTime() * 1000)
        let lastMessageTime = new Date(conversation.getLastMessageTime() * 1000)

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           

            #container {
                display: flex;
            }

        </style>
        <div id="container">
            <div>
                <iron-icon id="icon" icon="communication:forum" style="height: 40px; width: 40px; padding-left: 15px;"></iron-icon>
            </div>
            <div style="display: table; flex-grow: 1; padding-left: 20px;">
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Id:</div>
                    <div style="display: table-cell;">${conversation.getUuid()}</div>
                </div>
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Name:</div>
                    <div style="display: table-cell;">${conversation.getName()}</div>
                </div>
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Creation time:</div>
                    <div style="display: table-cell;">${creationTime.toLocaleString()}</div>
                </div>
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Last message time:</div>
                    <div style="display: table-cell;">${lastMessageTime.toLocaleString()}</div>
                </div>
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Keywords:</div>
                    <div style="display: table-cell;">${listToString(conversation.getKeywordsList())}</div>
                </div>
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Paticipants:</div>
                    <div style="display: table-cell;">${listToString(conversation.getParticipantsList())}</div>
                </div>
            </div>
        </div>
        `
    }

}

customElements.define('globular-conversation-info', ConversationInfo)

/**
 * Display basic blog informations.
 */
export class DomainInfo extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(domain) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           

            #container {
                display: flex;
            }

        </style>
        <div id="container">
            <div>
                <iron-icon id="icon" icon="social:domain" style="height: 40px; width: 40px; padding-left: 15px;"></iron-icon>
            </div>
            <div style="display: table; flex-grow: 1; padding-left: 20px;">
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Name:</div>
                    <div style="display: table-cell;">${domain.name}</div>
                </div>
            </div>
        </div>
        `
    }

}

customElements.define('globular-domain-info', DomainInfo)