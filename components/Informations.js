import { theme } from "./Theme";
import { Model } from '../Model';
import { Application } from "../Application";
import { DeleteTitleRequest, DeleteVideoRequest, DissociateFileWithTitleRequest, GetFileTitlesRequest, GetTitleFilesRequest, Person } from "globular-web-client/title/title_pb";
import { File } from "../File";
import { VideoPreview } from "./File";
import { ApplicationView } from "../ApplicationView";
import { randomUUID } from "./utility";
import { VideoPlayer } from "./Video";

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
}

#rating-span{
    font-weight: 600;
    font-size: 1.3rem;
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
function _readDir(path, callback, errorCallback) {
    // Here I will keep the dir info in the cache...
    File.readDir(path, false, (dir) => {
        callback(dir)
    }, errorCallback)
}

// Return the content of video preview div.
function getHiddenFiles(path, callback) {
    let index = path.lastIndexOf("/")
    let hiddenFilePath = path.substring(0, index) + "/.hidden/" + path.substring(index + 1, path.lastIndexOf(".")) + "/__preview__"
    _readDir(hiddenFilePath, callback, err => { console.log(err); callback(null); })
}

// Create the video preview...
function getVideoPreview(parent, path, name, callback) {
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
        })

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
                    rqst.setIndexpath(Application.globular.config.DataPath + "/search/titles")
                } else {
                    rqst.setIndexpath(Application.globular.config.DataPath + "/search/video")
                }
                Model.globular.titleService.dissociateFileWithTitle(rqst, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
                    .then(rsp => {
                        console.log("unlink ", path, name)
                    }).catch(err => ApplicationView.displayMessage(err, 3000))
            }

        }

        preview.showPlayBtn()

        preview.onplay = (path) => {
            console.log("play movie ", path)
            let url = window.location.protocol + "//" + window.location.hostname + ":"
            if (Application.globular.config.Protocol == "https") {
                url += Application.globular.config.PortHttps
            } else {
                url += Application.globular.config.PortHttp
            }

            path.split("/").forEach(item => {
                url += "/" + encodeURIComponent(item.trim())
            })

            url += "?application=" + Model.application;
            if (localStorage.getItem("user_token") != undefined) {
                url += "&token=" + localStorage.getItem("user_token");
            }
            let videoPlayer = document.getElementById("video-player-x")
            if (videoPlayer == null) {
                videoPlayer = new VideoPlayer()
                videoPlayer.id = "video-player-x"
                document.body.appendChild(videoPlayer)
                videoPlayer.style.position = "fixed"
                videoPlayer.style.top = "50%"
                videoPlayer.style.left = "50%"
                videoPlayer.style.transform = "translate(-50%, -50%)"
            }
            videoPlayer.play(path)

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
    })
}

/**
 * Return the list of file of a given tile...
 * @param {*} title The title 
 * @param {*} callback 
 */
function GetTitleFiles(indexPath, title, parent, callback) {
    let rqst = new GetTitleFilesRequest
    rqst.setTitleid(title.getId())
    rqst.setIndexpath(indexPath)

    Model.globular.titleService.getTitleFiles(rqst, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
        .then(rsp => {
            let previews = []
            let _getVideoPreview_ = () => {
                if (rsp.getFilepathsList().length > 0) {
                    let path = rsp.getFilepathsList().pop()
                    // Return the first file only... 
                    getVideoPreview(parent, path, title.getId(), p => {

                        parent.appendChild(p)
                        _getVideoPreview_() // call again...
                    })
                } else {
                    callback(previews)
                }
            }

            _getVideoPreview_() // call once...
        })
        .catch(err => { callback([]); console.log(err); })
}

/**
 * Here I will return the list of asscociated episode for a given series...
 * @param {*} indexPath  The path to the search engine 
 * @param {*} title The title
 * @param {*} callback The callback with the list of episodes.
 */
export function GetEpisodes(indexPath, title, callback) {
    let rqst = new GetTitleFilesRequest
    rqst.setTitleid(title.getId())
    rqst.setIndexpath(indexPath)
    Model.globular.titleService.getTitleFiles(rqst, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
        .then(rsp => {
            // So here I will get
            if (rsp.getFilepathsList().length > 0) {
                let episodes = []
                let getAssociatedTitlte = () => {
                    let rqst_ = new GetFileTitlesRequest
                    rqst_.setFilepath(rsp.getFilepathsList().pop())
                    rqst_.setIndexpath(indexPath)
                    Model.globular.titleService.getFileTitles(rqst_, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
                        .then(rsp => {
                            episodes = episodes.concat(rsp.getTitles().getTitlesList())
                            if (rsp.getFilepathsList().length == 0) {
                                callback(episodes)
                                return
                            }
                            getAssociatedTitlte()
                        }).catch((err) => {
                            if (rsp.getFilepathsList().length == 0) {
                                callback(episodes)
                                return
                            }
                            getAssociatedTitlte()
                        })
                }
                // start recursion...
                getAssociatedTitlte()
            }
        }).catch(err => { })
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
                <paper-icon-button icon="close" style="${isShort?"display: none;":""}"></paper-icon-button>
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
            <h1 id="title-name" class="title" style="${isShort?"font-size: 1rem;":""}"> ${publisherName} </h1>
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
        <div class="action-div" style="${isShort?"display: none;":""}">
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
        GetTitleFiles(Model.globular.config.DataPath + "/search/videos", video, filesDiv, (previews) => {

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
    setTitlesInformation(titles) {
        let isShort = this.hasAttribute("short")
        if (titles.length == 0) {
            /** nothinh to display... */
            return;
        }

        let title = titles[titles.length - 1]

        // Set the title div.
        this.shadowRoot.querySelector(".title-div").innerHTML = `
        <h1 id="title-name" class="title" style="${isShort?"font-size: 1.3rem;text-align: left;":""}"> </h1>
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
            <div class="title-poster-div" style="${isShort?"display: none;":""}">
                <img src="${posterUrl}"></img>
            </div>
            <div class="title-informations-div">
                <div class="title-genres-div"></div>
                <p class="title-synopsis-div" style="${isShort?"display: none;":""}">${title.getDescription()}</p>
                <div class="title-rating-div">
                    <iron-icon class="rating-star" icon="icons:star"></iron-icon>
                    <div style="display: flex; flex-direction: column;">
                        <div><span id="rating-span">${title.getRating().toFixed(1)}</span>/10</div>
                        <div>${title.getRatingcount()}</div>
                    </div>
                </div>
                <div class="title-top-credit" style="${isShort?"display: none;":""}">
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
            <div class="title-files-div" style="${isShort?"display: none;":""}">
                <paper-progress indeterminate></paper-progress>
            </div>
        </div>
        <div class="action-div" style="${isShort?"display: none;":""}">
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
            GetTitleFiles(Model.globular.config.DataPath + "/search/titles", title, filesDiv, (previews) => {
                filesDiv.querySelector("paper-progress").style.display = "none"
            })
        } else {
            // Here the title is a series...
            if (titles.length == 1) {
                // So here I will 
                let indexPath = Application.globular.config.DataPath + "/search/titles"
                GetEpisodes(indexPath, title, (episodes) => {
                    this.displayEpisodes(episodes, filesDiv)
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
                rqst.setIndexpath(Model.globular.config.DataPath + "/search/videos")
                Model.globular.titleService.deleteTitle(rqst, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
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
            }

            .episode-small-div img{
                object-fit: cover;
                width: 100%;
                height: 132px;
                max-width: 175px;
                min-width: 140px;
            }

            paper-tab{
                font-size: 1.17em;
                font-weight: bold;
            }

        </style>
        <div class="episodes-div">
            <div class="header">
                <paper-tabs selected="0" scrollable style="width: 100%;"></paper-tabs>
            </div>
            <div id="episodes-content" style="width: 100%; height: 100%; overflow-y: auto;">

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

                let html = `
                    <div class="episode-small-div">
                        <img src="${posterUrl}"></img>

                    </div>
                `

                page.appendChild(range.createContextualFragment(html))

            })
            index++
        }


        console.log(seasons)

    }
}

customElements.define('globular-informations-manager', InformationsManager)