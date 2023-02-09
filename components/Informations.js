
import { generatePeerToken, Model } from '../Model';
import { Application } from "../Application";
import { CreateVideoRequest, DeleteTitleRequest, DeleteVideoRequest, DissociateFileWithTitleRequest, GetTitleFilesRequest, SearchTitlesRequest } from "globular-web-client/title/title_pb";
import { File } from "../File";
import { VideoPreview, getFileSizeString } from "./File";
import { ApplicationView } from "../ApplicationView";
import { formatBoolean, randomUUID } from "./utility";
import { playVideo } from "./Video";
import { playAudio, secondsToTime } from "./Audio";
import '@polymer/iron-autogrow-textarea/iron-autogrow-textarea.js';
import { EditableStringList } from "./List";

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
    flex-direction: column;
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
    let h = 85;
    let w = 128;

    File.getFile(globule, path, w, h, file => {

        let fileNameSpan = document.createElement("span")
        let preview = new VideoPreview(file, 85, () => {
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

        preview.showPlayBtn()

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
                    video.toggleFullscreen();
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

export function searchEpisodes(globule, serie, indexPath, callback) {

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
                    episodes.push(hit.getTitle())
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

    searchEpisodes(title.globule, title.getId(), indexPath, episodes => {
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
            }

            #header {
                display: flex;
                line-height: 20px;
                padding-bottom: 10px;
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
            }

            .title-sub-title-div{
                display: flex;
            }
            title-sub-title-div span {
                padding-right: 5px;
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
            <span style="flex-grow: 1; padding-left: 20px; font-size: 20px;">${file.name} <span style="color: var(--palette-text-secondary);  margin-left: 16px;">Properties</span></span>
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
                background-color: var(--palette-background-default);
                color: var(--palette-text-primary);
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
                let lnk = document.createElement("a")
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
 * Search Box
 */
export class VideoInfoEditor extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(video, videoInfosDisplay) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
        this.videoInfosDisplay = videoInfosDisplay

        // Innitialisation of the layout.

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
            #container {
                display: flex;
            }

            .action-div{
                display: flex;
                justify-content: end;
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
                <img id="video-thumbnail" src="${video.getPoster().getContenturl()}" style="max-height: 180px; max-width: 300px;"></iron-icon>
            </div>
            <div style="display: flex; flex-direction: column; width: 100%;">
                <div style="display: table; flex-grow: 1; margin-left: 20px;">
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
                <div class="action-div" style="${this.isShort ? "display: none;" : ""}">
                    <paper-button id="save-indexation-btn">Save</paper-button>
                    <paper-button id="cancel-indexation-btn">Cancel</paper-button>
                </div>
            </div>
        </div>
        `

        // Here I will set the interaction...
        this.shadowRoot.querySelector("#cancel-indexation-btn").onclick = () => {
            let parent = this.parentNode
            parent.removeChild(this)
            parent.appendChild(videoInfosDisplay)
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

            // So here I will set video values back and update it in the parent...
            video.setId(videoIdInput.value)
            video.setUrl(videoUrlInput.value)
            video.setDescription(videoVideoDescriptionInput.value)

            video.setTagsList(videoTagsList.getItems())
            video.setGenresList(videoGenresList.getItems())

            let globule = video.globule
            let indexPath = globule.config.DataPath + "/search/videos"
            let rqst = new CreateVideoRequest
            rqst.setVideo(video)
            rqst.setIndexpath(indexPath)
            globule.titleService.createVideo(rqst, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
                .then(rsp => {
                    ApplicationView.displayMessage("Video Information are updated", 3000)
                    this.videoInfosDisplay.setVideo(video)
                })
                .catch(err => ApplicationView.displayMessage(err, 3000))
            let parent = this.parentNode
            parent.removeChild(this)
            parent.appendChild(videoInfosDisplay)
        }

    }

}

customElements.define('globular-video-editor', VideoInfoEditor)


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
                let lnk = document.createElement("a")
                lnk.href = p.getUrl()
                lnk.innerHTML = p.getFullname()
                lnk.target = "_blank"
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
            let globule = title.globule
            let indexPath = globule.config.DataPath + "/search/titles"
            GetEpisodes(indexPath, title, (episodes) => {
                if (title.onLoadEpisodes != null) {
                    title.onLoadEpisodes(episodes)
                }
                this.displayEpisodes(episodes, filesDiv, title.globule)
                filesDiv.querySelector("paper-progress").style.display = "none"
            })
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
    displayEpisodes(episodes, filesDiv, globule) {
        let seasons = {}

        episodes.forEach(e => {
            e.globule = globule
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
                e.globule = globule;
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
                    let indexPath = globule.config.DataPath + "/search/titles"
                    let rqst = new GetTitleFilesRequest
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
                background-color: var(--palette-background-paper);
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
            </div>
        </div>
        `
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
                background-color: var(--palette-background-paper);
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
                background-color: var(--palette-background-paper);
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
                background-color: var(--palette-background-paper);
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
                background-color: var(--palette-background-paper);
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
                    background-color: var(--palette-background-paper);
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
                /**
                .image-box:hover img {
                    transform: scale(1);
                }*/
    
            </style>
            <div id="container" class="blog-post-card">
                <div class="image-box">
                    <img style="display:${thumbnail.length == 0 ? "none" : "block"};" src="${thumbnail}"></img>
                </div>
                <span style="flex-grow: 1;"></span>
                <div class="blog-title">${blogPost.getTitle()}</div>
                <div class="blog-subtitle">${blogPost.getSubtitle()}</div>
                <div style="display: flex;">
                    <div class="blog-author" style="flex-grow: 1;">${blogPost.getAuthor()}</div>
                    <div class="blog-creation-date">${creationTime.toLocaleDateString()}</div>
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
                    background-color: var(--palette-background-paper);
                    color: var(--palette-text-primary);
                }
    
            </style>
            <div id="container">
                <div>
                   <img style="width: 128px; padding-left: 10px; padding-top: 10px; display:${thumbnail.length == 0 ? "none" : "block"};" src="${thumbnail}"></img>
                </div>
                <div style="display: table; flex-grow: 1; padding-left: 20px;">
                    <div style="display: table-row;">
                        <div style="display: table-cell; font-weight: 450;">Id:</div>
                        <div style="display: table-cell;">${blogPost.getUuid()}</div>
                    </div>
                    <div style="display: table-row;">
                        <div style="display: table-cell; font-weight: 450;">Title:</div>
                        <div style="display: table-cell;">${blogPost.getTitle()}</div>
                    </div>
                    <div style="display: table-row;">
                        <div style="display: table-cell; font-weight: 450;">subtitle:</div>
                        <div style="display: table-cell;">${blogPost.getSubtitle()}</div>
                    </div>
                    <div style="display: table-row;">
                        <div style="display: table-cell; font-weight: 450;">Author:</div>
                        <div style="display: table-cell;">${blogPost.getAuthor()}</div>
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
                        <div style="display: table-cell;">${creationTime.toLocaleDateString()}</div>
                    </div>
    
                    <div style="display: table-row;">
                        <div style="display: table-cell; font-weight: 450;">Keywords:</div>
                        <div style="display: table-cell;">${listToString(blogPost.getKeywordsList())}</div>
                    </div>
                </div>
            </div>
            `


        }
        // so here I will retreive more information about the author if it's available...
        this.shadowRoot.querySelector("#container").onclick = () => {
            Model.eventHub.publish("_display_blog_event_", { blogPost: blogPost, globule: globule }, true)
        }

        if (this.deleteListener == undefined) {
            Model.eventHub.subscribe(blogPost.getUuid() + "_blog_delete_event", uuid => this.deleteListener = uuid,
                evt => {
                    // simplity remove it from it parent...
                    this.parentNode.removeChild(this)
                }, false, this)
        }
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
                background-color: var(--palette-background-paper);
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