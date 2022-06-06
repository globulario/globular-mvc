import { theme } from "./Theme";
import { Model } from '../Model';
import { Application } from "../Application";
import { DeleteTitleRequest, DeleteVideoRequest, DissociateFileWithTitleRequest, GetTitleFilesRequest, SearchTitlesRequest } from "globular-web-client/title/title_pb";
import { File } from "../File";
import { VideoPreview } from "./File";
import { ApplicationView } from "../ApplicationView";
import { randomUUID } from "./utility";
import { playVideo } from "./Video";

//#tt1375666-div > div.title-informations-div

const __style__ = `
.title-div {
    display: flex;
}

.title-poster-div {
    padding-right: 20px;
}


.title-informations-div {
    
    font-size: 1em;
    max-width: 450px;
  
}

.title-poster-div img, p{
    max-width: 256px;
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
    }
}
`

// Read dir content.
function _readDir(path, callback, errorCallback, globule) {
    // Here I will keep the dir info in the cache...
    File.readDir(path, false, (dir) => {
        callback(dir)
    }, errorCallback, globule)
}

// Return the content of video preview div.
function getHiddenFiles(path, callback, globule) {
    // Set the title...
    let thumbnailPath = path.replace("/playlist.m3u8", "")
    if (thumbnailPath.lastIndexOf(".mp4") != -1) {
        thumbnailPath = thumbnailPath.substring(0, thumbnailPath.lastIndexOf("."))
    }

    thumbnailPath = thumbnailPath.substring(0, thumbnailPath.lastIndexOf("/") + 1) + ".hidden" + thumbnailPath.substring(thumbnailPath.lastIndexOf("/")) + "/__preview__"

    _readDir(thumbnailPath, callback, err => { callback(null); console.log(err) }, globule)
}

// Create the video preview...
function getVideoPreview(parent, path, name, callback, globule) {
    getHiddenFiles(path, previewDir => {
        let h = 85;
        let w = 128;
        let files = []
        if (previewDir) {
            if (previewDir._files) {
                files = previewDir._files
            }
        }

        let fileNameSpan = document.createElement("span")

        let preview = new VideoPreview(path, files, 85, () => {
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
                ${theme}
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

        preview.onplay = (path) => {
            playVideo(path, (video) => {
                let titleInfoBox = document.getElementById("title-info-box")
                if (titleInfoBox) {
                    titleInfoBox.parentNode.removeChild(titleInfoBox)
                }
                //video.toggleFullscreen();
            }, null, null, globule)
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

    }, globule)
}

function GetTitleFiles(indexPath, title, parent, callback) {
    let globules = Model.getGlobules()
    let previews = []
    let index = 0

    let titleFiles = () => {
        let globule = globules[index]
        index += 1
        __getTitleFiles__(globule, globule.config.DataPath + indexPath, title, parent, previews_ => {
            previews = previews.concat(previews_)
            if (index < globules.length) {
                titleFiles()
            } else {
                callback(previews)
            }
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

    // This is a simple test...
    let rqst = new SearchTitlesRequest
    rqst.setIndexpath(indexPath)
    rqst.setQuery(serie)
    rqst.setOffset(0)
    rqst.setSize(1000)
    let episodes = []
    let stream = Model.globular.titleService.searchTitles(rqst, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
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
        // Innitialisation of the layout.
        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${theme}
            #container{
                display: flex;
                flex-direction: column;
                padding: 8px;
                overflow: auto;
            }

            #header {
                display: flex;
            }

            #header h1, h2, h3 {
                margin: 0px;
            }

            .title-div{
                display: flex;
                flex-direction: column;
                flex-grow: 1;
                color: var(--palette-text-primery);
                border-bottom: 2px solid;
                border-color: var(--palette-divider);
                width: 66.66%;
                margin-bottom: 10px;
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

        }
    }

    hideHeader() {
        this.shadowRoot.querySelector("paper-icon-button").style.display = "none"
        this.shadowRoot.querySelector("#title-name").style.display = "none"
    }

    /**
     * Display video informations.
     * @param {*} videos 
     */
    setVideosInformation(videos) {
        let isShort = this.hasAttribute("short")
        let video = videos[0]

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

        // Set the header section.
        this.shadowRoot.querySelector(".title-div").innerHTML = `
        <h3 class="title-sub-title-div"> 
            <h1 id="title-name" class="title" style="${isShort ? "font-size: 1rem;" : ""}"> ${publisherName} </h1>
            <div style="display: flex; align-items: baseline;">
                <h3 class="title-sub-title-div">          
                    <span id="title-type"><span>Genre: </span>${genres}</span>
                </h3>    
                <span id="title-duration" style="padding-left: 10px;"><span>Duration: </span> ${video.getDuration()}</span>
            </span>
        </h3>
        `
        let posterUrl = ""
        if (video.getPoster() != undefined) {
            // must be getContentUrl here... 
            posterUrl = video.getPoster().getContenturl()
        }

        this.innerHTML = "" // remove previous content.

        let score = video.getRating()


        // So here I will create the display for the title.
        let html = `
        <style>
            ${__style__}
            .action-div{
                display: flex;
                justify-content: end;
            }

            .title-rating-div{
                font-size: .8rem;
            }
        </style>
        <div id="${video.getId()}-div" class="title-div">
            <div class="title-poster-div" >
                <img src="${posterUrl}"></img>
                <div class="title-files-div">
                </div>
            </div>
            <div class="title-informations-div">
                <div class="title-genres-div"></div>
                <p class="title-synopsis-div">${video.getDescription()}</p>
                <div class="title-rating-div">
                    <iron-icon class="rating-star" icon="icons:star"></iron-icon>
                    <div style="display: flex; flex-direction: column;">
                        <div><span id="rating-span">${score.toFixed(1)}</span>/10</div>
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
        <div class="action-div" style="${isShort ? "display: none;" : ""}">
            <paper-button id="delete-indexation-btn">Delete</paper-button>
        </div>
        `


        let range = document.createRange()
        this.appendChild(range.createContextualFragment(html))

        // Here I will display the list of categories.
        let genresDiv = this.querySelector(".title-genres-div")
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

        displayPersons(this.querySelector("#title-actors-lst"), video.getCastingList())
        if (video.getCastingList().length > 0) {
            this.querySelector("#title-actors-title").innerHTML = "Actors"
        }

        let filesDiv = this.querySelector(".title-files-div")
        GetTitleFiles("/search/videos", video, filesDiv, (previews) => {

        })

        let deleteIndexationBtn = this.querySelector("#delete-indexation-btn")

        // Delete the indexation from the database.
        deleteIndexationBtn.onclick = () => {
            let toast = ApplicationView.displayMessage(`
            <style>
                ${theme}
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

    /**
     * Display title informations.
     * @param {*} titles 
     */
    setTitlesInformation(titles, globule) {

        if (!globule) {
            globule = Model.globular
        }

        let isShort = this.hasAttribute("short")
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


        // Set the title div.
        this.shadowRoot.querySelector(".title-div").innerHTML = `
        <h1 id="title-name" class="title" style="${isShort ? "font-size: 1.2rem;text-align: left;" : ""}"> </h1>
        <h3 class="title-sub-title-div">             
            <span id="title-type"></span>
            <span id="title-year"></span>
            <span id="title-duration"></span>
        </h3>
        `

        this.shadowRoot.querySelector("#title-name").innerHTML = title.getName();
        this.shadowRoot.querySelector("#title-type").innerHTML = title.getType();
        this.shadowRoot.querySelector("#title-year").innerHTML = title.getYear();
        if (title.getType() == "TVEpisode") {
            if (title.getSeason() > 0 && title.getEpisode() > 0) {
                this.shadowRoot.querySelector("#title-year").innerHTML = `<span>${title.getYear()}</span>&middot<span>S${title.getSeason()}</span>&middot<span>E${title.getEpisode()}</span>`
            }
        }
        this.shadowRoot.querySelector("#title-duration").innerHTML = title.getDuration();

        let posterUrl = ""
        if (title.getPoster() != undefined) {
            posterUrl = title.getPoster().getContenturl()
        }

        this.innerHTML = "" // remove previous content.

        // So here I will create the display for the title.
        let html = `
        <style>
            ${__style__}
            .action-div{
                display: flex;
                justify-content: end;
            }
        </style>
        <div id="${title.getId()}-div" class="title-div" >
            <div class="title-poster-div" style="${isShort ? "display: none;" : ""}">
                <img src="${posterUrl}"></img>
            </div>
            <div class="title-informations-div">
                <div class="title-genres-div"></div>
                <p class="title-synopsis-div" style="${isShort ? "display: none;" : ""}">${title.getDescription()}</p>
                <div class="title-rating-div">
                    <iron-icon class="rating-star" icon="icons:star"></iron-icon>
                    <div style="display: flex; flex-direction: column;">
                        <div><span id="rating-span">${title.getRating().toFixed(1)}</span>/10</div>
                        <div>${title.getRatingcount()}</div>
                    </div>
                </div>
                <div class="title-top-credit" style="${isShort ? "display: none;" : ""}">
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
            <div class="title-files-div" style="${isShort ? "display: none;" : ""}">
                <paper-progress indeterminate></paper-progress>
            </div>
        </div>
        <div class="action-div" style="${isShort ? "display: none;" : ""}">
            <paper-button id="delete-indexation-btn">Delete</paper-button>
        </div>
        `
        let range = document.createRange()

        this.appendChild(range.createContextualFragment(html))

        let genresDiv = this.querySelector(".title-genres-div")
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
        displayPersons(this.querySelector("#title-directors-lst"), title.getDirectorsList())
        if (title.getDirectorsList().length > 0) {
            this.querySelector("#title-directors-title").innerHTML = "Directors"
        }

        // display writers
        displayPersons(this.querySelector("#title-writers-lst"), title.getWritersList())
        if (title.getWritersList().length > 0) {
            this.querySelector("#title-writers-title").innerHTML = "Writers"
        }

        // display actors
        displayPersons(this.querySelector("#title-actors-lst"), title.getActorsList())
        if (title.getActorsList().length > 0) {
            this.querySelector("#title-actors-title").innerHTML = "Actors"
        }

        let filesDiv = this.querySelector(".title-files-div")
        if (title.getType() != "TVSeries") {
            filesDiv.style.paddingTop = "35px"
            filesDiv.style.paddingLeft = "15px"
            GetTitleFiles("/search/titles", title, filesDiv, (previews) => {
                filesDiv.querySelector("paper-progress").style.display = "none"
            })
        } else {
            // Here the title is a series...
            if (titles.length == 1) {
                // So here I will 
                let indexPath = Application.globular.config.DataPath + "/search/titles"

                GetEpisodes(indexPath, title, (episodes) => {
                    if (title.onLoadEpisodes != null) {
                        title.onLoadEpisodes(episodes)
                    }
                    this.displayEpisodes(episodes, filesDiv, globule)
                    filesDiv.querySelector("paper-progress").style.display = "none"
                })

            }
        }


        let deleteIndexationBtn = this.querySelector("#delete-indexation-btn")

        // Delete the indexation from the database.
        deleteIndexationBtn.onclick = () => {
            let toast = ApplicationView.displayMessage(`
            <style>
                ${theme}
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
                rqst.setTitleid(title.getId())
                rqst.setIndexpath(globule.config.DataPath + "/search/titles")
                globule.titleService.deleteTitle(rqst, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
                    .then(() => {
                        ApplicationView.displayMessage(`file indexation was deleted`, 3000)
                        this.parentNode.removeChild(this)
                    })
                    .catch(err => ApplicationView.displayMessage(err, 3000))

                toast.dismiss();
            }
        }
    }

    // Here I will display the list of each episodes from the list...
    displayEpisodes(episodes, filesDiv, globule) {
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

        </style>
        <div class="episodes-div">
            <div class="header">
                <paper-tabs selected="0" scrollable style="width: 100%;"></paper-tabs>
            </div>
            <div id="episodes-content" style="width: 100%; height: 425px; overflow-y: auto;">

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
                            <paper-icon-button icon="icons:info-outline"></paper-icon-button>
                        </div>
                    </div>
                `

                page.appendChild(range.createContextualFragment(html))
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
                                }, null, globule)

                        }).catch(err => ApplicationView.displayMessage(err, 3000))
                }

            })
            index++
        }

    }
}

customElements.define('globular-informations-manager', InformationsManager)