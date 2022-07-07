import { ApplicationView } from "../../globular-mvc/ApplicationView";
import { getTheme } from "../../globular-mvc/components/Theme"
import { SearchVideoCard, SearchFlipCard } from "../../globular-mvc/components/Search"
import { GetVideoByIdRequest, GetTitleByIdRequest } from "../../globular-mvc/node_modules/globular-web-client/title/title_pb"
import { DeleteOneRqst, ReplaceOneRqst, FindOneRqst, FindRqst } from "../../globular-mvc/node_modules/globular-web-client/persistence/persistence_pb"
import * as jwt from "jwt-decode";
import { Model } from "../../globular-mvc/Model";
import { Menu } from "./Menu";

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
            }

            #video_div{
                display: flex;
                flex-wrap: wrap;
            }

            #title_div{
                display: flex;
                flex-wrap: wrap;
            }

            h1{

                margin: 0px; 
                margin-left: 10px;
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
                <div style="display: flex; justify-content: center;">
                    <h1 style="flex-grow: 1;">Continue Watching...</h1>
                    <paper-icon-button id="close-btn" icon="icons:close"></paper-icon-button>
                </div>
                <div id="video_div" style="display: none; flex-direction: column;">
                    <h2 id="video-title">Video(s)</h2>
                    <div style="display: flex; flex-wrap: wrap;">
                        <slot  name="video"></slot>
                    </div>
                </div>
                
                <div id="title_div" style="display: none; flex-direction: column;">
                    <h2 id="movie-title">Title(s)</h2>
                    <div style="display: flex; flex-wrap: wrap;">
                        <slot name="title"></slot>
                    </div>
                </div>
            </div>

        </paper-card>
        `

        this.onclose = null

        // simply close the watching content...
        this.shadowRoot.querySelector("#close-btn").onclick = () => {
            this.parentNode.removeChild(this)
            if (this.onclose != null) {
                this.onclose()
            }
        }

    }


    appendTitle(title, callback, errorCallback) {
        if (this.querySelector("#_" + title._id)) {

            if (title.isVideo) {
                this.shadowRoot.querySelector("#video_div").style.display = "flex"
                this.shadowRoot.querySelector("#video-title").innerHTML = `Video(${this.querySelectorAll(`[slot="video"]`).length})`
            } else {
                this.shadowRoot.querySelector("#title_div").style.display = "flex"
                this.shadowRoot.querySelector("#movie-title").innerHTML = `Title(${this.querySelectorAll(`[slot="title"]`).length})`
            }

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

        if (title.isVideo) {
            this.shadowRoot.querySelector("#video_div").style.display = "flex"
            this.shadowRoot.querySelector("#video-title").innerHTML = `Video(${this.querySelectorAll(`[slot="video"]`).length})`
        } else {
            this.shadowRoot.querySelector("#title_div").style.display = "flex"
            this.shadowRoot.querySelector("#movie-title").innerHTML = `Title(${this.querySelectorAll(`[slot="title"]`).length})`
        }

        Model.eventHub.subscribe("remove_video_player_evt_", uuid => { }, evt => {
            if (title._id == evt._id) {
                this.removeChild(card)
                let video_count = this.querySelectorAll(`[slot="video"]`).length
                if (video_count > 0) {
                    this.shadowRoot.querySelector("#video_div").style.display = "flex"
                    this.shadowRoot.querySelector("#video-title").innerHTML = `Video(${video_count})`
                } else {
                    this.shadowRoot.querySelector("#video_div").style.display = "none"
                }

                let movie_count = this.querySelectorAll(`[slot="title"]`).length
                if (movie_count > 0) {
                    this.shadowRoot.querySelector("#title_div").style.display = "flex"
                    this.shadowRoot.querySelector("#movie-title").innerHTML = `Title(${movie_count})`
                } else {
                    this.shadowRoot.querySelector("#title_div").style.display = "none"
                }

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
                    if (callback) {
                        callback()
                    }

                } else {
                    if (errorCallback) {
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
                    if (callback) {
                        callback()
                    }
                } else {
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

function mergeTypedArrays(a, b) {
    // Checks for truthy values on both arrays
    if (!a && !b) throw 'Please specify valid arguments for parameters a and b.';

    // Checks for truthy values or empty arrays on each argument
    // to avoid the unnecessary construction of a new array and
    // the type comparison
    if (!b || b.length === 0) return a;
    if (!a || a.length === 0) return b;

    // Make sure that both typed arrays are of the same type
    if (Object.prototype.toString.call(a) !== Object.prototype.toString.call(b))
        throw 'The types of the two arguments passed for parameters a and b do not match.';

    var c = new a.constructor(a.length + b.length);
    c.set(a);
    c.set(b, a.length);

    return c;
}

function uint8arrayToStringMethod(myUint8Arr) {
    return String.fromCharCode.apply(null, myUint8Arr);
}


/**
 * Login/Register functionality.
 */
export class WatchingMenu extends Menu {

    // Create the application view.
    constructor() {
        super("watching", "maps:local-movies", "Watching")

        this.mediaWatching = null;
        this.onclose = null;


        this.onclick = () => {
            let icon = this.getIconDiv().querySelector("iron-icon")
            icon.style.removeProperty("--iron-icon-fill-color")
            if(this.mediaWatching.parentNode == undefined){
                Model.eventHub.publish("_display_watching_event_", this.mediaWatching, true)
            }
           
        }
    }

    init() {
        if (this.mediaWatching == null) {
            // Initialyse the watching content...
            this.mediaWatching = new MediaWatching()
            this.mediaWatching.onclose = this.onclose

            // Append the media context in the workspace.
            // console here i will get the list of title and movies...
            Model.eventHub.subscribe("play_video_player_evt_", uuid => { }, evt => {
                this.saveWatchingTitle(evt, () => { })
            }, true)

            Model.eventHub.subscribe("stop_video_player_evt_", uuid => { }, evt => {
                this.saveWatchingTitle(evt, () => { })
                this.mediaWatching.appendTitle(evt, null, null)
            }, true)

            Model.eventHub.subscribe("remove_video_player_evt_", uuid => { }, evt => {
                console.log("remove ", evt)
                this.removeWacthingTitle(evt)
            }, true)

            // Here I will get the list of titles.
            this.getWatchingTitles(titles => {
                ApplicationView.wait("Loading your media data")

                let appendTitle = () => {
                    if (titles.length == 0) {
                        ApplicationView.resume()
                        return
                    }
                    let t = titles.pop()

                    this.mediaWatching.appendTitle(t, () => {
                        localStorage.setItem(t._id, t.currentTime)
                        if (titles.length > 0) {
                            appendTitle()
                        } else {
                            this.mediaWatching.style.display = ""
                            ApplicationView.resume()
                        }
                    },
                        err => {
                            console.log(err)
                            if (titles.length > 0) {
                                appendTitle()
                            } else {

                                ApplicationView.resume()
                            }
                        })

                }
                appendTitle()
            })

        }
    }

    /**
   * Return the list of all watching titles
   * @param callback 
   */
    getWatchingTitles(callback) {

        const rqst = new FindRqst();
        const userName = localStorage.getItem("user_name");
        const collection = "watching";
        let id = userName.split("@").join("_").split(".").join("_");
        let db = id + "_db";

        rqst.setId(id);
        rqst.setDatabase(db);
        rqst.setCollection(collection)

        rqst.setQuery("{}"); // means all values.

        let token = localStorage.getItem("user_token")
        let decoded = jwt(token);
        let address = decoded.address;
        let domain = decoded.domain;

        const stream = Model.globular.persistenceService.find(rqst, {
            application: Model.application.length > 0 ? Model.application : Model.globular.config.IndexApplication,
            domain: domain, address: address,
        });

        let data = [];

        stream.on("data", rsp => {
            data = mergeTypedArrays(data, rsp.getData())
        });

        stream.on("status", (status) => {
            if (status.code === 0) {
                let titles = JSON.parse(uint8arrayToStringMethod(data));
                callback(titles)
            } else {
                callback([])
            }
        });
    }

    /**
     * Find one title...
     * @param callback The callback
     */
    getWacthingTitle(titleId, callback) {
        const userName = localStorage.getItem("user_name");
        const collection = "watching";

        // save the user_data
        let rqst = new FindOneRqst();
        let id = userName.split("@").join("_").split(".").join("_");
        let db = id + "_db";

        // set the connection infos,
        rqst.setId(id);
        rqst.setDatabase(db);
        rqst.setCollection(collection)
        rqst.setQuery(`{"_id":"${titleId}"}`)

        // So here I will set the address from the address found in the token and not 
        // the address of the client itself.
        let token = localStorage.getItem("user_token")
        let decoded = jwt(token);
        let address = decoded.address;
        let domain = decoded.domain;

        // call persist data
        Model.getGlobule(address).persistenceService
            .findOne(rqst, {
                token: token,
                application: Model.application,
                domain: domain,
                address: address
            })
            .then(rsp => {
                // Here I will return the value with it
                // callback(this);
                console.log("title was found")
                console.log(rsp)
            })
            .catch(err => {
                ApplicationView.displayMessage(err, 3000)
            });
    }

    /**
   * Find one title...
   * @param callback The callback
   */
    removeWacthingTitle(title) {
        const userName = localStorage.getItem("user_name");
        const collection = "watching";
        localStorage.removeItem(title._id)

        // save the user_data
        let rqst = new DeleteOneRqst();
        let id = userName.split("@").join("_").split(".").join("_");
        let db = id + "_db";

        // set the connection infos,
        rqst.setQuery(`{"_id":"${title._id}"}`)
        rqst.setId(id);
        rqst.setDatabase(db);
        rqst.setCollection(collection)

        // So here I will set the address from the address found in the token and not 
        // the address of the client itself.
        let token = localStorage.getItem("user_token")
        let decoded = jwt(token);
        let address = decoded.address;
        let domain = decoded.domain;

        // call persist data
        Model.getGlobule(address).persistenceService
            .deleteOne(rqst, {
                token: token,
                application: Model.application,
                domain: domain,
                address: address
            })
            .then(rsp => {
                // Here I will return the value with it
                console.log(rsp)

            })
            .catch(err => {
                ApplicationView.displayMessage(err, 3000)
            });
    }

    saveWatchingTitle(title, callback) {

        const userName = localStorage.getItem("user_name");
        const collection = "watching";
        localStorage.setItem(title._id, title.currentTime)

        // save the user_data
        let rqst = new ReplaceOneRqst();
        let id = userName.split("@").join("_").split(".").join("_");
        let db = id + "_db";

        // set the connection infos,
        rqst.setId(id);
        rqst.setDatabase(db);

        // save only user data and not the how user info...
        rqst.setCollection(collection);
        rqst.setQuery(`{"_id":"${title._id}"}`);
        rqst.setValue(JSON.stringify(title));
        rqst.setOptions(`[{"upsert": true}]`);

        // So here I will set the address from the address found in the token and not 
        // the address of the client itself.
        let token = localStorage.getItem("user_token")
        let decoded = jwt(token);
        let address = decoded.address;
        let domain = decoded.domain;

        // call persist data
        Model.getGlobule(address).persistenceService
            .replaceOne(rqst, {
                token: token,
                application: Model.application,
                domain: domain,
                address: address
            })
            .then((rsp) => {
                // Here I will return the value with it
                // callback(this);
                console.log("title was added...")
                callback()
            })
            .catch(err => {
                ApplicationView.displayMessage(err, 3000)
            });
    }
}

customElements.define('globular-watching-menu', WatchingMenu)