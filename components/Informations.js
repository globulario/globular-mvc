import { theme } from "./Theme";
import { Model } from '../Model';
import { Application } from "../Application";
import { GetTitleFilesRequest } from "globular-web-client/title/title_pb";
import { ConversationServiceClient } from "globular-web-client/conversation/conversation_grpc_web_pb";
import { GetFileInfoRequest } from "globular-web-client/admin/admin_pb";
import { File } from "../File";
import { VideoPreview } from "./File";

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
        let h = 100;
        let w = 180;
        let preview = new VideoPreview(path, previewDir._files, h, () => {
            if (preview.width > 0 && preview.height > 0) {
                w = (preview.width / preview.height) * h
            }
            let fileNameSpan = document.createElement("span")
            fileNameSpan.style.maxWidth = w + "px";
        })

        preview.showPlayBtn()

        preview.onplay = (path)=>{
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
            window.open(url, '_blank', "fullscreen=yes");
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

        callback(preview)
    })
}

/**
 * Return the list of file of a given tile...
 * @param {*} title The title 
 * @param {*} callback 
 */
function GetTitleFiles(title, parent, callback) {
    let rqst = new GetTitleFilesRequest
    rqst.setTitleid(title.getId())
    rqst.setIndexpath(Model.globular.config.DataPath + "/search/titles")

    Model.globular.titleService.getTitleFiles(rqst, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
        .then(rsp => {
            let previews = []
            let _getVideoPreview_ = () => {
                if (rsp.getFilepathsList().length > 0) {
                    getVideoPreview(parent, rsp.getFilepathsList().pop(), title.getName(), p => {
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
 * Display information about given object ex. titles, files...
 */
export class InformationsManager extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

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
                <div class="title-div">
                    <h1 id="title-name" class="title"> </h1>
                    <h3 class="title-sub-title-div">             
                        <span id="title-type"></span>
                        <span id="title-year"></span>
                        <span id="title-duration"></span>
                    </h3>
                </div>
                <paper-icon-button icon="close"></paper-icon-button>
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
     * Display title informations.
     * @param {*} titles 
     */
    setTitlesInformation(titles) {

        let title = titles[0]

        this.shadowRoot.querySelector("#title-name").innerHTML = title.getName();
        this.shadowRoot.querySelector("#title-type").innerHTML = title.getType();
        this.shadowRoot.querySelector("#title-year").innerHTML = title.getYear();
        this.shadowRoot.querySelector("#title-duration").innerHTML = title.getDuration();

        let posterUrl = ""
        if (title.getPoster() != undefined) {
            posterUrl = title.getPoster().getContenturl()
        }

        this.innerHTML = "" // remove previous content.

        // So here I will create the display for the title.
        let html = `
        <style>
            .title-div {
                display: flex;
            }

            .title-poster-div {
                
            }

            .title-informations-div {
                padding-left: 20px;
                font-size: 1.17em;
                max-width: 450px;
            }

            .title-poster-div img{
                max-width: 256px;
            }

            .title-genre-span {
                border: 1px solid var(--palette-divider);
                padding: 5px;
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
                padding: 30px;
                display: flex;
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

        </style>
        <div id="${title.getId()}-div" class="title-div">
            <div class="title-poster-div" >
                <img src="${posterUrl}"></img>
            </div>
            <div class="title-informations-div">
                <div class="title-genres-div"></div>
                <p class="title-synopsis-div">${title.getDescription()}</p>
                <div class="title-rating-div">
                    <iron-icon class="rating-star" icon="icons:star"></iron-icon>
                    <div style="display: flex; flex-direction: column;">
                        <div><span id="rating-span">${title.getRating().toFixed(1)}</span>/10</div>
                        <div>${title.getRatingcount()}</div>
                    </div>
                </div>
                <div class="title-top-credit">
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
            <div class="title-files-div">
            </div>
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
        GetTitleFiles(title, filesDiv, (previews) => {

        })

    }

}

customElements.define('globular-informations-manager', InformationsManager)