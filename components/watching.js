import { ApplicationView } from "../../globular-mvc/ApplicationView";
import { getTheme } from "../../globular-mvc/components/Theme"
import { SearchVideoCard, SearchFlipCard } from "../../globular-mvc/components/Search"
import { GetVideoByIdRequest, GetTitleByIdRequest } from "../../globular-mvc/node_modules/globular-web-client/title/title_pb"
import * as jwt from "jwt-decode";
import { Model } from "../../globular-mvc/Model";

/**
 * Search Box
 */
export class MediaWatching extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}
            #container {
                display: flex;
                flex-direction: column;
                background-color: var(--palette-background-paper);
                margin-top: 10px;
                margin-bottom: 10px;
            }

            #video_div{
                display: flex;
                flex-wrap: wrap;
            }

            #title_div{
                display: flex;
                flex-wrap: wrap;
            }

            h2{
                margin-bottom: 4px; 
                margin-left: 10px;
                border-bottom: 1px solid var(--palette-divider);
                width: 80%;
            }

        </style>
        <paper-card>
            <div id="container">
                <h2>Video(s)</h2>
                <slot id="video_div" name="video"></slot>
                <h2>Title(s)</h2>
                <slot  id="title_div" name="title"></slot>
            </div>

        </paper-card>
        `
    }

    appendTitle(title, callback, errorCallback) {
        if (this.querySelector("#_" + title._id)) {
            return
        }
        let card = new MediaWatchingCard
        card.setTitle(title, callback, errorCallback)
        card.id = title._id
        if (title.isVideo) {
            card.slot = "video"
        } else {
            card.slot = "title"
        }
        this.appendChild(card)
        Model.eventHub.subscribe("remove_video_player_evt_", uuid => { }, evt => {
            if (title._id == evt._id) {
                this.removeChild(card)
            }
        }, true)
    }
}

customElements.define('globular-media-watching', MediaWatching)

function getVideos(id, callback) {

    let globules = Model.getGlobules()
    let index = 0
    let videos = []
    let __getVideos = (id, callback) => {
        let g = globules[index]
        index += 1
        _getVideos(g, id, (video) => {

            // append the video
            if (video != null) {
                videos.push(video)
            }

            if (index < globules.length) {
                __getVideos(id, callback)
            } else {
                callback(videos)
            }
        })
    }

    // Call once
    __getVideos(id, callback)

}

/**
 * Get the 
 * @param {*} globule 
 * @param {*} id 
 * @param {*} callback 
 */
function _getVideos(globule, id, callback) {
    let token = localStorage.getItem("user_token")
    let decoded = jwt(token);
    let address = decoded.address;
    let domain = decoded.domain;
    let rqst = new GetVideoByIdRequest
    let indexPath = globule.config.DataPath + "/search/videos"

    rqst.setIndexpath(indexPath)
    rqst.setVidoeid(id)

    globule.titleService
        .getVideoById(rqst, {
            token: token,
            application: Model.application,
            domain: domain,
            address: address
        }).then(rsp => {
            let video = rsp.getVideo()
            video.globule = globule
            callback(video)
        }).catch(() => { 
            callback(null)
         })
}

/**
 * Get the 
 * @param {*} id 
 * @param {*} callback 
 */
function getTitles(id, callback) {
    let globules = Model.getGlobules()
    let index = 0
    let titles = []
    let __getTitle = (id, callback) => {
        let g = globules[index]
        index += 1
        _getTitle(g, id, (title) => {
            // append the video
            if (title != null) {
                titles.push(title)
            }

            if (index < globules.length) {
                __getTitle(id, callback)
            } else {
                callback(titles)
            }
        })
    }

    // Call once
    __getTitle(id, callback)

}
function _getTitle(globule, id, callback) {
    let token = localStorage.getItem("user_token")
    let decoded = jwt(token);
    let address = decoded.address;
    let domain = decoded.domain;
    let indexPath = globule.config.DataPath + "/search/titles"
    let rqst = new GetTitleByIdRequest
    rqst.setIndexpath(indexPath)
    rqst.setTitleid(id)

    globule.titleService
        .getTitleById(rqst, {
            token: token,
            application: Model.application,
            domain: domain,
            address: address
        }).then(rsp => {
            let title = rsp.getTitle()
            title.globule = globule
            callback(title)
        }).catch(() => { 
            callback(null) 
        })
}

export class MediaWatchingCard extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}
            #container {
                display: flex;
                flex-direction: column;
                padding-top: 16px;
            }

            #container span {
                flex-grow: 1;
                text-align: right;
            }
        </style>

        <div id="container">
            <div style="display: flex; margin-left: 5px; margin-right: 20px; align-items: end;">
                <paper-icon-button icon="icons:close"></paper-icon-button>
                <span id="title-date"></span>
            </div>
            <slot></slot>
        </div>
        `


    }

    // Append title.
    setTitle(title, callback, errorCallback) {

        let lastView = new Date(title.date)
        this.shadowRoot.querySelector("#title-date").innerHTML = lastView.toLocaleDateString() + " " + lastView.toLocaleTimeString()

        let closeButton = this.shadowRoot.querySelector("paper-icon-button")
        closeButton.onclick = () => {
            Model.eventHub.publish("remove_video_player_evt_", title, true)
        }

        if (title.isVideo) {
            getVideos(title._id, (videos) => {
                if (videos.length > 0) {
                    let videoCard = new SearchVideoCard();
                    videoCard.id = "_" + title._id
                    videoCard.setVideo(videos[0], videos[0].globule)
                    this.appendChild(videoCard)
                    if(callback){
                        callback()
                    }
                    
                }else{
                    if(errorCallback){
                        errorCallback(`title ${title._id} not found`)
                    }
                }
            })
        } else {
            getTitles(title._id, (titles) => {
                if (titles.length > 0) {
                    let titleCard = new SearchFlipCard();
                    titleCard.id = "_" + title._id
                    titleCard.setTitle(titles[0], titles[0].globule)
                    this.appendChild(titleCard)
                    if(callback){
                        callback()
                    }
                }else{
                    errorCallback(`title ${title._id} not found`)
                }
            })
        }
    }
}

customElements.define('globular-media-watching-card', MediaWatchingCard)

/**
 * Display the wathching history...
 */
export class MediaWatchingHistory extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}
        </style>
        `
    }
}

customElements.define('globular-media-watching-history', MediaWatchingHistory)