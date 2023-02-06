import '@polymer/iron-icons/iron-icons.js';
import '@polymer/iron-icons/av-icons'
import '@polymer/paper-icon-button/paper-icon-button.js';

import { Application } from '../Application';
import { CreateVideoRequest, DeleteVideoRequest, GetFileAudiosRequest, GetFileTitlesRequest, GetTitleByIdRequest, GetTitleFilesRequest, SearchTitlesRequest } from 'globular-web-client/title/title_pb';
import { generatePeerToken, Model } from '../Model';

import * as getUuid from 'uuid-by-string'
import { BlogPostInfo, InformationsManager, searchEpisodes } from './Informations';
import { playVideo } from './Video';
import { ApplicationView } from '../ApplicationView';
import * as getUuidByString from 'uuid-by-string';
import { SearchBlogPostsRequest } from 'globular-web-client/blog/blog_pb';
import { SearchDocumentsRequest } from 'globular-web-client/search/search_pb';
import * as JwtDecode from 'jwt-decode';
import { base64toBlob, formatBoolean, getCoords, randomUUID } from './utility';
import { playAudio } from './Audio';
import { setAudio } from './Playlist';

// Maximum number of results displayed...
var MAX_DISPLAY_RESULTS = 20; // the maximum results display per page per globule...
var MAX_RESULTS = 5000; // The total number of result search...

window.onerror = function (msg, url, line) {
    alert("Message : " + msg);
    alert("url : " + url);
    alert("Line number : " + line);
}

// keep values in memorie to speedup...
var titles = {}

// Keep in memory to speed up....
var images = {}
function toDataURL(url, callback) {
    if (images[url] != null) {
        callback(images[url])
        return
    }

    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
        var reader = new FileReader();
        reader.onloadend = function () {
            images[url] = reader.result
            callback(reader.result);
        }
        reader.readAsDataURL(xhr.response);
    };
    xhr.open('GET', url);
    xhr.responseType = 'blob';

    xhr.send();
}

export function getCoverDataUrl(callback, videoId, videoUrl, videoPath, globule) {

    if (!globule) {
        globule = Application.globular
    }

    generatePeerToken(globule, token => {
        // set the url for the image.
        let url = globule.config.Protocol + "://" + globule.domain
        if (window.location != globule.domain) {
            if (globule.config.AlternateDomains.indexOf(window.location.host) != -1) {
                url = globule.config.Protocol + "://" + window.location.host
            }
        }

        if (globule.config.Protocol == "https") {
            if (globule.config.PortHttps != 443)
                url += ":" + globule.config.PortHttps
        } else {
            if (globule.config.PortHttps != 80)
                url += ":" + globule.config.PortHttp
        }

        // set the api call
        url += "/get_video_cover_data_url"

        // Set url query parameter.
        url += "?domain=" + Model.domain
        url += "&application=" + Model.application
        if (localStorage.getItem("user_token") != undefined) {
            url += "&token=" + localStorage.getItem("user_token")
        }

        url += "&id=" + videoId
        url += "&url=" + videoUrl
        url += "&path=" + videoPath

        if (images[url] != null) {
            callback(images[url])
            return
        }

        var xhr = new XMLHttpRequest();
        xhr.timeout = 1500
        xhr.open('GET', url, true);
        xhr.setRequestHeader("token", token);
        xhr.setRequestHeader("application", Model.application);
        xhr.setRequestHeader("domain", Model.domain);

        // Set responseType to 'arraybuffer', we want raw binary data buffer
        xhr.responseType = 'text';
        xhr.onload = (rsp) => {
            if (rsp.currentTarget.status == 200) {
                images[url] = rsp.currentTarget.response
                callback(rsp.currentTarget.response)
            } else {
                console.log("fail to create thumbnail ", videoId, videoUrl, videoPath)
            }
        };

        xhr.send();
    })
}

// That function will be use to asscociate file with imdb information.
export function getImdbInfo(id, callback, errorcallback, globule) {

    generatePeerToken(globule, token => {
        if (titles[id]) {
            if (titles[id].ID) {
                callback(titles[id])
            } else {
                titles[id].callbacks.push(callback)
            }
            return
        }

        titles[id] = {}
        titles[id].callbacks = []
        titles[id].callbacks.push(callback)

        let url = globule.config.Protocol + "://" + globule.domain
        if (window.location != globule.domain) {
            if (globule.config.AlternateDomains.indexOf(window.location.host) != -1) {
                url = globule.config.Protocol + "://" + window.location.host
            }
        }

        if (globule.config.Protocol == "https") {
            if (globule.config.PortHttps != 443)
                url += ":" + globule.config.PortHttps
        } else {
            if (globule.config.PortHttps != 80)
                url += ":" + globule.config.PortHttp
        }

        url += "/imdb_title?id=" + id

        console.log("call imdb_title ", id)

        var xmlhttp = new XMLHttpRequest();
        xmlhttp.timeout = 10 * 1000
        xmlhttp.onreadystatechange = function () {
            if (this.readyState == 4 && (this.status == 201 || this.status == 200)) {
                var obj = JSON.parse(this.responseText);
                while (titles[obj.ID].callbacks.length > 0) {
                    let callback = titles[obj.ID].callbacks.pop()
                    callback(obj)
                }

                titles[obj.ID] = obj
                // Now I will 

            } else if (this.readyState == 4) {
                errorcallback("fail to get info from query " + url + " status " + this.status)
            }
        };

        xmlhttp.open("GET", url, true);
        xmlhttp.setRequestHeader("domain", globule.domain);

        xmlhttp.send();
    })
}

function playTitleListener(player, title, indexPath, globule) {
    if (!title) {
        return
    }

    searchEpisodes(globule, title.getSerie(), indexPath, (episodes) => {
        let index = -1;
        episodes.forEach((e, i) => {
            if (e.getId() == title.getId()) {
                index = i;
            }
        });


        index += 1
        let nextEpisode = episodes[index]
        let video = document.getElementsByTagName('video')[0];

        video.onended = () => {
            // exit full screen...
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }

            document.getElementsByTagName('globular-video-player')[0].close();

            if (localStorage.getItem(title.getId())) {
                localStorage.removeItem(title.getId())
            }

            if (index == episodes.length) {
                return
            }

            // So here I will ask to display the next episode...
            let toast = ApplicationView.displayMessage(`
                <style>
                   
                </style>
                <div style="display: flex; flex-direction: column;">
                    <div>Play the next episode?</div>
                    <h3 style="font-size: 1.17em; font-weight: bold;">${nextEpisode.getName()}</h3>
                    <div>Season ${nextEpisode.getSeason()} Episode ${nextEpisode.getEpisode()}</div>
                    <img style="max-width: 250px; align-self: center;" src="${nextEpisode.getPoster().getContenturl()}"></img>
                    <p style="max-width: 400px;">${nextEpisode.getDescription()}</p>
                    <div style="display: flex; justify-content: flex-end;">
                        <paper-button id="imdb-lnk-ok-button">Yes</paper-button>
                        <paper-button id="imdb-lnk-cancel-button">No</paper-button>
                    </div>
                </div>
                `)

            let cancelBtn = toast.el.querySelector("#imdb-lnk-cancel-button")
            cancelBtn.onclick = () => {
                toast.dismiss();
            }

            let okBtn = toast.el.querySelector("#imdb-lnk-ok-button")
            okBtn.onclick = () => {
                let rqst = new GetTitleFilesRequest
                rqst.setTitleid(nextEpisode.getId())
                rqst.setIndexpath(indexPath)
                globule.titleService.getTitleFiles(rqst, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
                    .then(rsp => {
                        if (rsp.getFilepathsList().length > 0) {
                            let path = rsp.getFilepathsList().pop()
                            playVideo(path, (player, title) => {
                                playTitleListener(player, title, indexPath, globule)
                            }, null, null, globule)
                        }
                    })
                toast.dismiss();
            }
        };
    })


    if (!player.media) {
        return
    }

    var type = player.media.tagName.toLowerCase(),
        toggle = document.querySelector("[data-plyr='fullscreen']");

    if (type === "video" && toggle) {
        toggle.addEventListener("click", player.toggleFullscreen, false);
    }
    toggle.click()

}

// Search over multiple peers...
function search(query, contexts_, offset) {

    // Connections can contain many time the same address....
    let globules = Model.getGlobules()
    if (offset == undefined) {
        offset = 0;
    }

    globules.forEach(g => {
        let contexts = [...contexts_];

        // Search recursively...
        let search_ = (contexts) => {

            let context = contexts.pop()
            if (context) {
                let indexPath = g.config.DataPath + "/search/" + context
                if (context == "blogPosts") {
                    if (contexts.length == 0) {
                        searchBlogPosts(g, query, contexts_, indexPath, offset, MAX_RESULTS, () => {

                        })
                    } else {
                        searchBlogPosts(g, query, contexts_, indexPath, offset, MAX_RESULTS, () => {
                            search_(contexts)
                        })
                    }
                } else if (context == "webPages") {

                    if (contexts.length == 0) {
                        searchWebpageContent(g, query, contexts_, offset, MAX_RESULTS, () => {

                        })
                    } else {
                        searchWebpageContent(g, query, contexts_, offset, MAX_RESULTS, () => {
                            search_(contexts)
                        })
                    }
                } else {
                    if (contexts.length == 0) {
                        searchTitles(g, query, contexts_, indexPath, offset, MAX_RESULTS, () => {

                        })
                    } else {
                        searchTitles(g, query, contexts_, indexPath, offset, MAX_RESULTS, () => {
                            search_(contexts)
                        })
                    }
                }
            }
        }

        // search contexts
        search_(contexts)

    })
}

/** 
 * Search titles...
 */
function searchTitles(globule, query, contexts, indexPath, offset, max, callback, fields) {

    // This is a simple test...
    let rqst = new SearchTitlesRequest
    rqst.setIndexpath(indexPath)
    rqst.setQuery(query)
    rqst.setOffset(offset)
    rqst.setSize(max)
    if (fields) {
        rqst.setFieldsList(fields)
    }

    let hits = []

    let stream = globule.titleService.searchTitles(rqst, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
    stream.on("data", (rsp) => {

        if (rsp.hasSummary() && !fields) {
            Model.eventHub.publish("_display_search_results_", {}, true)
            Model.eventHub.publish("__new_search_event__", { query: query, summary: rsp.getSummary(), contexts: contexts, offset: offset }, true)
        } else if (rsp.hasFacets() && !fields) {
            let uuid = "_" + getUuid(query)
            Model.eventHub.publish(`${uuid}_search_facets_event__`, { facets: rsp.getFacets() }, true)
        } else if (rsp.hasHit()) {
            let hit = rsp.getHit()
            hit.globule = globule // keep track where the hit was found...
            if (hit.hasAudio()) {
                hit.getAudio().globule = globule
            } else if (hit.hasTitle()) {
                hit.getTitle().globule = globule
            } else if (hit.hasVideo()) {
                hit.getVideo().globule = globule
            } else if (hit.hasBlog()) {
                hit.getBlog().globule = globule
            }

            if (!fields) {
                // display the value in the console...
                hit.getSnippetsList().forEach(val => {
                    let uuid = "_" + getUuid(query)
                    Model.eventHub.publish(`${uuid}_search_hit_event__`, { hit: hit, context: indexPath.substring(indexPath.lastIndexOf("/") + 1) }, true)
                })
            } else {
                // keep it
                hits.push(hit)
            }

        }
    });

    stream.on("status", (status) => {
        if (status.code != 0) {
            // In case of error I will return an empty array
            console.log(status.details)
        } else {
            callback(hits)
        }
    });
}

function searchBlogPosts(globule, query, contexts, indexPath, offset, max, callback) {

    // This is a simple test...
    let rqst = new SearchBlogPostsRequest
    rqst.setIndexpath(indexPath)
    rqst.setQuery(query)
    rqst.setOffset(offset)
    rqst.setSize(max)

    let stream = globule.blogService.searchBlogPosts(rqst, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
    stream.on("data", (rsp) => {

        if (rsp.hasSummary()) {
            Model.eventHub.publish("_display_search_results_", {}, true)
            Model.eventHub.publish("__new_search_event__", { query: query, summary: rsp.getSummary(), contexts: contexts, offset: offset }, true)
        } else if (rsp.hasFacets()) {
            let uuid = "_" + getUuid(query)
            Model.eventHub.publish(`${uuid}_search_facets_event__`, { facets: rsp.getFacets() }, true)
        } else if (rsp.hasHit()) {
            let hit = rsp.getHit()
            hit.globule = globule // keep track where the hit was found...
            // display the value in the console...
            hit.getSnippetsList().forEach(val => {
                let uuid = "_" + getUuid(query)
                Model.eventHub.publish(`${uuid}_search_hit_event__`, { hit: hit, context: indexPath.substring(indexPath.lastIndexOf("/") + 1) }, true)
            })
        }
    });

    stream.on("status", (status) => {
        if (status.code != 0) {
            // In case of error I will return an empty array
            console.log(status.details)
        } else {
            callback()
        }
    });
}

/**
 * Search document...
 * @param {*} query 
 */
function searchWebpageContent(globule, query, contexts, offset, max, callback) {

    // Search over web-content.
    let rqst = new SearchDocumentsRequest
    rqst.setPathsList([globule.config.DataPath + "/search/applications/" + Model.application])
    rqst.setLanguage("en")
    rqst.setFieldsList(["Text"])
    rqst.setOffset(offset)
    rqst.setPagesize(max)
    rqst.setQuery(query)

    let token = localStorage.getItem("user_token")
    let startTime = performance.now()

    let stream = globule.searchService.searchDocuments(rqst, {
        token: token,
        application: Model.application,
        domain: Model.application
    })

    let results = []
    stream.on("data", (rsp) => {
        results = results.concat(rsp.getResults().getResultsList())
    });

    stream.on("status", (status) => {
        if (status.code != 0) {
            // In case of error I will return an empty array
            console.log("fail to retreive ", query, status.details)
        } else {
            let took = performance.now() - startTime
            Model.eventHub.publish("__new_search_event__", { query: query, summary: { getTotal: () => { return results.length }, getTook: () => { return took } }, contexts: contexts, offset: offset }, true)
            Model.eventHub.publish("display_webpage_search_result_" + query, results, true)
            callback()
        }
    });


}

/**
 * Search Box
 */
export class SearchBar extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        this.titlesCheckbox = null
        this.moviesCheckbox = null
        this.tvSeriesCheckbox = null
        this.tvEpisodesCheckbox = null
        this.videosCheckbox = null
        this.youtubeCheckbox = null
        this.adultCheckbox = null
    }

    // The connection callback.
    connectedCallback() {

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>

           

            input {
                width: 100%;
                border: none;
                margin-right: 11px;   
                background: transparent;
                color: var(--palette-text-accent);
                box-sizing: border-box;
                font-size: 1.2rem;
            }

            ::placeholder { /* Chrome, Firefox, Opera, Safari 10.1+ */
                color: var(--palette-text-accent);
                opacity: 1; /* Firefox */
            }


            iron-icon{
                padding-left: 11px;
                padding-right: 11px;
            }

            input:focus{
                outline: none;
            }

            #context-search-selector{
                display: none;
                flex-direction: column;
                position: absolute;
                top: 55px;
                right: 0px;
                left: 0px;
                border-radius: 5px;
                background-color: var(--palette-background-paper);
                color:var(--palette-text-primary);

            }

            #search-bar {
                
                display: flex;
                align-items: center;
                border-radius: 22px;
                box-sizing: border-box;
                font-size: 16px;
                height: var(--searchbox-height);
                opacity: 1;
                transition: none;
                background: transparent;
                color: var(--palette-text-accent);
                border: 1px solid var(--palette-divider);
                position: relative;
            }

            @media (min-width: 500px) {
                #search-bar {
                    min-width: 325px;
                }
             }

            paper-checkbox {
                margin-left: 16px;
                margin-bottom: 8px;
                margin-top: 8px;
            }

            .context-filter{
                display: flex;
                font-size: .85rem;
                margin: 0px 18px 5px 18px;
                border-bottom: 1px solid  var(--palette-action-disabled);
            }

            .context-filter paper-checkbox {

            }

        </style>
        <div id="search-bar">
            <iron-icon icon="search" style="--iron-icon-fill-color: var(--palette-text-accent);" ></iron-icon>
            <input id='search_input' placeholder="Search"></input>
            <paper-icon-button id="change-search-context" icon="icons:expand-more" style="--iron-icon-fill-color: var(--palette-text-accent); margin-right: 2px; height: 36px;" ></paper-icon-button>
            <paper-card id="context-search-selector">
                <!--paper-checkbox checked name="webPages" id="context-search-selector-webpages">Webpages</paper-checkbox-->
                <paper-checkbox checked name="blogPosts" id="context-search-selector-blog-posts">Blog Posts</paper-checkbox>
                <div style="display: flex; flex-direction: column">
                    <paper-checkbox checked name="titles" id="context-search-selector-titles">Titles</paper-checkbox>
                    <div class="context-filter">
                        <paper-checkbox checked name="movies" id="context-search-selector-movies">Movies</paper-checkbox>
                        <paper-checkbox checked name="movies" id="context-search-selector-tv-series">TV-Series</paper-checkbox>
                        <paper-checkbox checked name="movies" id="context-search-selector-tv-episodes">TV-Episodes</paper-checkbox>
                    </div>
                </div>
                <div style="display: flex; flex-direction: column">
                    <paper-checkbox checked name="videos" id="context-search-selector-videos">Videos</paper-checkbox>
                    <div class="context-filter">
                        <paper-checkbox checked name="youtube" id="context-search-selector-youtube">Youtube</paper-checkbox>
                        <paper-checkbox  name="adult" id="context-search-selector-adult">Adult</paper-checkbox>
                    </div>
                </div>
                <paper-checkbox checked name="audios" id="context-search-selector-audios">Audios</paper-checkbox>
            </paper-card>
        </div>
        `

        // give the focus to the input.
        let searchInput = this.shadowRoot.getElementById("search_input")
        let div = this.shadowRoot.getElementById("search-bar")

        let changeSearchContextBtn = this.shadowRoot.getElementById("change-search-context")
        let contextSearchSelector = this.shadowRoot.getElementById("context-search-selector")

        this.titlesCheckbox = this.shadowRoot.querySelector("#context-search-selector-titles")
        this.moviesCheckbox = this.shadowRoot.querySelector("#context-search-selector-movies")
        this.tvSeriesCheckbox = this.shadowRoot.querySelector("#context-search-selector-tv-series")
        this.tvEpisodesCheckbox = this.shadowRoot.querySelector("#context-search-selector-tv-episodes")

        this.titlesCheckbox.onchange = () => {
            if (this.titlesCheckbox.checked) {
                this.moviesCheckbox.removeAttribute("disabled")
                this.tvSeriesCheckbox.removeAttribute("disabled")
                this.tvEpisodesCheckbox.removeAttribute("disabled")
            } else {
                this.moviesCheckbox.setAttribute("disabled", "")
                this.tvSeriesCheckbox.setAttribute("disabled", "")
                this.tvEpisodesCheckbox.setAttribute("disabled", "")
            }
        }

        this.videosCheckbox = this.shadowRoot.querySelector("#context-search-selector-videos")
        this.youtubeCheckbox = this.shadowRoot.querySelector("#context-search-selector-youtube")
        this.adultCheckbox = this.shadowRoot.querySelector("#context-search-selector-adult")

        this.videosCheckbox.onchange = () => {
            if (this.videosCheckbox.checked) {
                this.youtubeCheckbox.removeAttribute("disabled")
                this.adultCheckbox.removeAttribute("disabled")
            } else {
                this.youtubeCheckbox.setAttribute("disabled", "")
                this.adultCheckbox.setAttribute("disabled", "")
            }
        }

        searchInput.onblur = () => {
            div.style.boxShadow = ""
        }

        searchInput.onkeydown = (evt) => {
            if (evt.key == "Enter") {
                let contexts = []
                let checkboxs = this.shadowRoot.querySelectorAll("paper-checkbox")
                for (var i = 0; i < checkboxs.length; i++) {
                    let c = checkboxs[i]
                    if (c.checked) {
                        contexts.push(c.name)
                    }
                }

                if (contexts.length > 0) {
                    let query = searchInput.value

                    // remove unwanted results...
                    if (!this.adultCheckbox.checked) {
                        query += " -adult"
                    }

                    if (!this.youtubeCheckbox.checked) {
                        query += " -youtube"
                    }

                    if (!this.moviesCheckbox.checked) {
                        query += " -Movie"
                    }

                    if (!this.tvEpisodesCheckbox.checked) {
                        query += " -TVEpisode"
                    }

                    if (!this.tvSeriesCheckbox.checked) {
                        query += " -TVSerie"
                    }

                    search(query, contexts, 0)
                    searchInput.value = ""
                    Model.eventHub.publish("_display_search_results_", {}, true)

                } else {
                    ApplicationView.displayMessage("You must selected a search context, Blog, Video or Title...", 3000)
                    contextSearchSelector.style.display = "flex"
                }

            } else if (evt.key == "Escape") {
                Model.eventHub.publish("_hide_search_results_", {}, true)
            }
        }


        searchInput.onfocus = (evt) => {
            evt.stopPropagation();
            div.style.boxShadow = "var(--dark-mode-shadow)"
            contextSearchSelector.style.display = "none"
            Model.eventHub.publish("_display_search_results_", {}, true)

            let pages = document.querySelectorAll("globular-search-results-page")
            for (var i = 0; i < pages.length; i++) {
                let page = pages[i]
                if (page.style.display != "none") {
                    page.facetFilter.style.display = ""
                }
            }

            // I will remove all highligted text..
            let highlighted = document.getElementsByClassName("highlighted")
            for (var i = 0; i < highlighted.length; i++) {
                if (highlighted[i].lowlight)
                    highlighted[i].lowlight();
            }
        }

        // Change the search context, this will search over other indexations...
        changeSearchContextBtn.onclick = () => {

            if (contextSearchSelector.style.display != "flex") {
                contextSearchSelector.style.display = "flex"
            } else {
                contextSearchSelector.style.display = "none"
            }
        }
    }
}

customElements.define('globular-search-bar', SearchBar)

/**
 * Search Results
 */
export class SearchResults extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
            :host{
                padding: 10px;
            }

            #container{
                min-height: calc(100vh - 85px);
                flex-direction: column;
                background-color: var(--palette-background-paper);
                color: var(--palette-text-primary);
                width: calc(100vw - 25px);
            }

            .header {
                display: flex;
                width: 100%;
            }

            paper-tabs {
                flex-grow: 1;
        
                /* custom CSS property */
                --paper-tabs-selection-bar-color: var(--palette-primary-main); 
                color: var(--palette-text-primary);
                --paper-tab-ink: var(--palette-action-disabled);
            }

            #close-all-btn {
                width: 30px;
                height: 30px;
                padding: 3px;
            }

            paper-tab {
                display: inlinel;
            }

            paper-tab span {
                font-size: 1.1rem;
                flex-grow: 1;
            }

        </style>

        <paper-card id="container">
            <div class="header">
                <paper-tabs id="search-results" scrollable>
                </paper-tabs>
                <paper-icon-button id="close-all-btn" icon="icons:close"></paper-icon-button>
            </div>
            <h2 id="empty-search-msg" style="text-align: center; color: var(--palette-divider);">No search results to display...</h2>
            <slot></slot>
        </paper-card>
        `

        this.tabs = this.shadowRoot.querySelector("#search-results")

        Model.eventHub.subscribe("_hide_search_results_", uuid => { }, evt => {
            if (this.parentNode) {
                this.parentNode.removeChild(this)
            }
        }, true)

        this.closeAllBtn = this.shadowRoot.querySelector("#close-all-btn")
        this.closeAllBtn.onclick = () => {
            Model.eventHub.publish("_hide_search_results_", {}, true)

            // Hide the search results...
            /*let facetFilters = ApplicationView.layout.sideMenu().getElementsByTagName("globular-facet-search-filter")
            for (var i = 0; i < facetFilters.length; i++) {
                let f = facetFilters[i]
                f.parentNode.removeChild(f)
            }*/
        }

        // So here I will create a new Search Result page if none exist...
        Model.eventHub.subscribe("__new_search_event__", uuid => { },
            evt => {
                this.shadowRoot.querySelector("#container").style.display = "flex"

                let uuid = "_" + getUuid(evt.query)
                let tab = this.tabs.querySelector(`#${uuid}-tab`)
                let query = evt.query.replaceAll(" -adult", "").replaceAll(" -youtube", "").replaceAll(" -TVEpisode", "").replaceAll(" -TVSerie", "").replaceAll(" -Movie", "")
                if (tab == null) {
                    let html = `
                    <paper-tab id="${uuid}-tab">
                        <span>${query} (<span id="${uuid}-total-span" style="font-size: 1rem;"></span>)</span>
                        <paper-icon-button id="${uuid}-close-btn" icon="icons:close"></paper-icon-button>
                    </paper-tab>
                    `

                    let range = document.createRange()
                    this.tabs.appendChild(range.createContextualFragment(html))
                    tab = this.tabs.querySelector(`#${uuid}-tab`)
                    tab.totalSpan = tab.querySelector(`#${uuid}-total-span`)

                    tab.onclick = () => {


                        let page = this.querySelector(`#${uuid}-results-page`)
                        if (page == undefined) {
                            return
                        }


                        let index = 0
                        for (var i = 0; i < this.children.length; i++) {
                            this.children[i].style.display = "none";
                            if (this.children[i].id == `${uuid}-results-page`) {
                                index = i
                            }
                        }

                        this.tabs.selected = index;
                        page.style.display = ""


                        // display the filters...
                        page.facetFilter.style.display = ""
                    }

                    let closeBtn = this.tabs.querySelector(`#${uuid}-close-btn`)
                    closeBtn.onclick = (evt_) => {
                        evt_.stopPropagation()
                        this.deletePageResults(uuid)

                        if (this.children.length == 0) {
                            this.shadowRoot.querySelector("#empty-search-msg").style.display = "block";
                        }
                    }
                    this.tabs.selected = this.children.length;

                } else {
                    tab.click()

                }

                // Create a new page...
                let resultsPage = this.querySelector(`#${uuid}-results-page`)
                if (resultsPage == null) {
                    resultsPage = new SearchResultsPage(uuid, evt.summary, evt.contexts, tab)
                    for (var i = 0; i < this.children.length; i++) {
                        this.children[i].style.display = "none";
                    }
                    this.appendChild(resultsPage)
                    this.shadowRoot.querySelector("#empty-search-msg").style.display = "none";

                    // ApplicationView.layout.sideMenu().appendChild(resultsPage.facetFilter)

                } else if (evt.summary) {
                    tab.totalSpan.innerHTML = resultsPage.getTotal() + ""
                }

            }, true)
    }

    connectedCallback() {

    }

    isEmpty() {
        return this.tabs.querySelectorAll("paper-tab").length == 0
    }

    deletePageResults(uuid) {
        var index = 0;
        for (var i = 0; i < this.children.length; i++) {
            if (this.children[i].id == `${uuid}-results-page`) {
                index = i;
                break
            }
        }

        let page = this.querySelector(`#${uuid}-results-page`)
        page.parentNode.removeChild(page)
        // page.facetFilter.parentNode.removeChild(page.facetFilter)
        //ApplicationView.layout.sideMenu().removeChild(page.facetFilter)

        let tab = this.tabs.querySelector(`#${uuid}-tab`)
        tab.parentNode.removeChild(tab)

        let nextPage = null;
        if (index > this.children.length - 1) {
            nextPage = this.children[this.children.length - 1]
        } else {
            nextPage = this.children[index]
        }

        if (nextPage != null) {
            let tab_uuid = nextPage.id.replace("-results-page", "-tab")
            this.tabs.querySelector(`#${tab_uuid}`).click()
        }

        // close the results view
        if (this.tabs.querySelectorAll("paper-tab").length == 0) {
            Model.eventHub.publish("_hide_search_results_", {}, true)
        }
    }

}

customElements.define('globular-search-results', SearchResults)


/**
 * Search Results
 */
export class SearchResultsPage extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(uuid, summary, contexts, tab) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
        this.id = `${uuid}-results-page`
        this.offset = 0;
        this.query = summary.getQuery();
        this.contexts = contexts;
        this.tab = tab;

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
            #container {
                display: flex;
            }

            #summary {
                display: flex;
            }

            #summary span {
                flex-grow: 1;
            }

            .disable{
                --iron-icon-fill-color: var(--palette-action-disabled);
            }

            #webpage-search-results{
                display: flex;
                flex-direction: column;
            }

            #summary span{
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

             .header{
                align-items: center;
             }

             @media (max-width: 600px) {
                #container {
                    flex-direction: column;
                    
                }

                #facets{
                    max-height: 200px;
                }

                .header{
                    flex-direction: column;
                    align-items: flex-start;
                }

                #summary{
                    align-self: flex-end;
                }

                globular-search-results-page-contexts-selector {
                    font-size: 1rem;
                }

                #results{
                    padding-bottom: 100px;
                }

                @media (max-width: 650px) {
                    slot {
                        justify-content: center;
                    }
                }

                
             }

        </style>
        <div id="container">
            <div id="facets" style="overflow: auto; margin-right: 5px;">
                <slot  name="facets"></slot>
            </div>
            <div style="display: flex; flex-direction: column; width: 100%;">
                <div class="header" style="display: flex;">
                    <div style="display: flex; flex-wrap: wrap; flex-grow: 1; align-items: center;">
                        <globular-search-results-page-contexts-selector ></globular-search-results-page-contexts-selector>
                        <globular-search-results-pages-navigator></globular-search-results-pages-navigator>
                    </div>
                    <div id="summary">
                        <paper-icon-button id="search-result-icon-view-btn" style="" icon="icons:view-module"></paper-icon-button>
                        <paper-icon-button class="disable"  id="search-result-lst-view-btn" icon="icons:view-list"></paper-icon-button>
                    </div>
                </div>

                <div id="results" style="display: flex; flex-direction: column; overflow: auto;">
                    <div id="mosaic-view" style="display: block;">
                        <slot name="mosaic_blogPosts" style="display: flex; flex-wrap: wrap;"></slot>
                        <slot name="mosaic_videos" style="display: flex; flex-wrap: wrap;"></slot>
                        <slot name="mosaic_titles" style="display: flex; flex-wrap: wrap;"></slot>
                        <slot name="mosaic_audios" style="display: flex; flex-wrap: wrap;"></slot>
                    </div>
                    <div id="list-view" style="display: none;">
                        <slot name="list_blogPosts" style="display: flex; flex-wrap: wrap;"> </slot>
                        <slot name="list_videos" style="display: flex; flex-wrap: wrap;"> </slot>
                        <slot name="list_titles" style="display: flex; flex-wrap: wrap;"> </slot>
                        <slot name="list_audios" style="display: flex; flex-wrap: wrap;"> </slot>
                    </div>
                </div>

                
            </div>
           

        </div>
        `

        // display hint about more results can be displayed.
        let resultsDiv = this.shadowRoot.querySelector("#results")
        resultsDiv.onscroll = () => {
            const header = this.shadowRoot.querySelector(".header")
            if (resultsDiv.scrollTop > 0) {
                header.style.boxShadow = "rgb(0 0 0 / 16%) 0px 3px 6px, rgb(0 0 0 / 23%) 0px 3px 6px"
                header.style.borderBottom = "1px solid var(--palette-divider)"
            } else {
                header.style.boxShadow = ""
                header.style.borderBottom = ""
            }
        }

        this.navigator = this.shadowRoot.querySelector("globular-search-results-pages-navigator")
        this.navigator.setSearchResultsPage(this)

        this.contextsSelector = this.shadowRoot.querySelector("globular-search-results-page-contexts-selector")
        this.contextsSelector.setSearchResultsPage(this)
        this.contextsSelector.setContexts(contexts)

        // left or right side filter...
        this.facetFilter = new FacetSearchFilter(this)
        this.facetFilter.slot = "facets"
        this.appendChild(this.facetFilter)

        // Get the tow button...
        this.searchReusltLstViewBtn = this.shadowRoot.querySelector("#search-result-lst-view-btn")
        this.searchReusltIconViewBtn = this.shadowRoot.querySelector("#search-result-icon-view-btn")
        this.viewType = "icon"
        this.hits = {} // keep the current list in memory...
        this.hits_by_context = {}
        this.hits_by_className = {}

        this.searchReusltLstViewBtn.onclick = () => {
            this.searchReusltLstViewBtn.classList.remove("disable")
            this.searchReusltIconViewBtn.classList.add("disable")
            this.viewType = "lst"
            this.shadowRoot.querySelector("#list-view").style.display = "block"
            this.shadowRoot.querySelector("#mosaic-view").style.display = "none"
        }

        this.searchReusltIconViewBtn.onclick = () => {
            this.searchReusltLstViewBtn.classList.add("disable")
            this.searchReusltIconViewBtn.classList.remove("disable")
            this.viewType = "mosaic"
            this.shadowRoot.querySelector("#list-view").style.display = "none"
            this.shadowRoot.querySelector("#mosaic-view").style.display = "block"
        }

        // Display facets
        Model.eventHub.subscribe(`${uuid}_search_facets_event__`, listner_uuid => { },
            evt => {
                this.facetFilter.setFacets(evt.facets)
            }, true)

        // Append it to the results.
        Model.eventHub.subscribe(`${uuid}_search_hit_event__`, listner_uuid => { },
            evt => {

                Model.eventHub.publish("_display_search_results_", {}, true)
                if (this.hits_by_context[evt.context] == null) {
                    this.hits_by_context[evt.context] = []
                }

                // get the uuid from the hit content object.
                let getHitUuid = (hit) => {
                    if (hit.hasTitle || hit.hasVideo || hit.hasAudio) {
                        if (hit.hasTitle()) {
                            return getUuidByString(hit.getTitle().getName())
                        } else if (hit.hasVideo()) {
                            return getUuidByString(hit.getVideo().getId())
                        } else if (hit.hasAudio()) {
                            return getUuidByString(hit.getAudio().getId())
                        }
                    } else {
                        return hit.getBlog().getUuid()
                    }
                }

                let hit = evt.hit
                let uuid = getHitUuid(hit)

                if (this.hits[uuid] == undefined) {

                    this.hits[uuid] = hit
                    this.hits_by_context[evt.context].push(hit)

                    hit.hidden = false;
                    hit.enable = true;
                    if (hit.hasTitle || hit.hasVideo || hit.hasAudio) {
                        // here I will keep track of hit classes...
                        if (hit.hasTitle()) {
                            hit.getTitle().getGenresList().forEach(g => {
                                let className = getUuidByString(g.toLowerCase())
                                if (this.hits_by_className[className] == undefined) {
                                    this.hits_by_className[className] = []
                                }
                                if (this.hits_by_className[className].indexOf(uuid) == -1) {
                                    this.hits_by_className[className].push(uuid)
                                }
                            })
                            // now the term..
                            let className = getUuidByString("high")
                            if (hit.getTitle().getRating() < 3.5) {
                                className = getUuidByString("low")
                            } else if (hit.getTitle().getRating() < 7.0) {
                                className = getUuidByString("medium")
                            }

                            if (this.hits_by_className[className] == undefined) {
                                this.hits_by_className[className] = []
                            }

                            if (this.hits_by_className[className].indexOf(uuid) == -1) {
                                this.hits_by_className[className].push(uuid)
                            }

                        } else if (hit.hasVideo()) {
                            hit.getVideo().getGenresList().forEach(g => {
                                let className = getUuidByString(g.toLowerCase())
                                if (this.hits_by_className[className] == undefined) {
                                    this.hits_by_className[className] = []
                                }
                                if (this.hits_by_className[className].indexOf(uuid) == -1) {
                                    this.hits_by_className[className].push(uuid)
                                }
                            })

                            hit.getVideo().getTagsList().forEach(g => {
                                let className = getUuidByString(g.toLowerCase())
                                if (this.hits_by_className[className] == undefined) {
                                    this.hits_by_className[className] = []
                                }
                                if (this.hits_by_className[className].indexOf(uuid) == -1) {
                                    this.hits_by_className[className].push(uuid)
                                }
                            })

                            // now the term..
                            let className = getUuidByString("high")
                            if (hit.getVideo().getRating() < 3.5) {
                                className = getUuidByString("low")
                            } else if (hit.getVideo().getRating() < 7.0) {
                                className = getUuidByString("medium")
                            }

                            if (this.hits_by_className[className] == undefined) {
                                this.hits_by_className[className] = []
                            }

                            if (this.hits_by_className[className].indexOf(uuid) == -1) {
                                this.hits_by_className[className].push(uuid)
                            }
                        } else if (hit.hasAudio()) {

                            hit.getAudio().getGenresList().forEach(g => {
                                g.split(" ").forEach(g_ => {
                                    let className = getUuidByString(g_.toLowerCase())

                                    if (this.hits_by_className[className] == undefined) {
                                        this.hits_by_className[className] = []
                                    }
                                    if (this.hits_by_className[className].indexOf(uuid) == -1) {
                                        this.hits_by_className[className].push(uuid)
                                    }
                                })

                            })
                        }
                    } else {
                        // console.log(hit)
                        // There is facet for blogpost..? categorie, keywords etc...
                    }

                    // Display first results...
                    if (this.hits_by_context[evt.context].length < MAX_DISPLAY_RESULTS) {
                        this.appendChild(this.displayMosaicHit(hit, evt.context))
                        this.appendChild(this.displayListHit(hit, evt.context))
                    }

                    this.refreshNavigatorAndContextSelector()

                    // set the total...
                    if (this.tab) {
                        if (this.tab.totalSpan) {
                            this.tab.totalSpan.innerHTML = this.getTotal() + ""
                        }
                    }


                }

            }, true)

        // Append the webpage  search result...
        Model.eventHub.subscribe("display_webpage_search_result_" + summary.getQuery(), uuid => this.display_webpage_search_result_page = uuid, results => {
            // Set the search results navigator.
            let range = document.createRange()
            let webpageSearchResults = this.shadowRoot.querySelector("#webpage-search-results")

            results.forEach(r => {
                let doc = JSON.parse(r.getData())
                let snippet = JSON.parse(r.getSnippet());
                let uuid = randomUUID()
                let html = `
                <div style="display: flex; flex-direction: column; margin: 10px; ">
                    <div style="display: flex; align-items: baseline; margin-left: 2px;">
                        <span style="font-size: 1.1rem; padding-right: 10px;">${parseFloat(r.getRank() / 1000).toFixed(3)} </span> 
                        <div id="page-${uuid}-lnk" style="font-size: 1.1rem; font-weight: 400; text-decoration: underline; ">${doc.PageName}</div>
                    </div>
                    <div id="snippets-${uuid}-div" style="padding: 15px; font-size: 1.1rem"></div>
                    <span style="border-bottom: 1px solid var(--palette-action-disabled); width: 80%;"></span>
                </div>
                `

                if (snippet.Text) {
                    if (snippet.Text.length > 0) {
                        webpageSearchResults.appendChild(range.createContextualFragment(html))
                        let snippetsDiv = webpageSearchResults.querySelector(`#snippets-${uuid}-div`)
                        snippet.Text.forEach(s => {
                            let div = document.createElement("div")
                            div.innerHTML = s
                            snippetsDiv.appendChild(div)
                        })
                    }


                    let lnk = webpageSearchResults.querySelector(`#page-${uuid}-lnk`)
                    lnk.onclick = () => {
                        let pageLnks = document.getElementsByTagName("globular-page-link")
                        for (var i = 0; i < pageLnks.length; i++) {
                            if (pageLnks[i].id.startsWith(doc.PageId)) {
                                pageLnks[i].click()
                                let e = document.getElementById(doc.Id)
                                let position = getCoords(e)
                                window.scrollTo({
                                    top: position.top - (65 + 10),
                                    left: 0,
                                    behavior: 'smooth'
                                });

                                // I will remove all highligted text..
                                let highlighted = document.getElementsByClassName("highlighted")
                                for (var i = 0; i < highlighted.length; i++) {
                                    if (highlighted[i].lowlight)
                                        highlighted[i].lowlight();
                                }

                                // So here I will highlight the text...
                                const regex = new RegExp(summary.getQuery(), 'gi');

                                let text = e.innerHTML;
                                text = text.replace(/(<mark class="highlight">|<\/mark>)/gim, '');

                                const newText = text.replace(regex, '<mark class="highlight">$&</mark>');
                                e.innerHTML = newText;
                                e.classList.add("highlighted")

                                e.lowlight = () => {
                                    e.innerHTML = text;
                                    e.classList.remove("highlighted")
                                    delete e.lowlight
                                }

                                return
                            }
                        }
                    }

                    lnk.onmouseleave = () => {
                        lnk.style.cursor = "default"
                        lnk.style.textDecorationColor = ""
                    }

                    lnk.onmouseover = () => {
                        lnk.style.cursor = "pointer"
                        lnk.style.textDecorationColor = "var(--palette-primary-main)"
                    }
                }
            })
        })
    }

    connectedCallback() {

        // set the results height
        let results = this.shadowRoot.querySelector("#results")
        let p0 = getCoords(results)
        results.style.height = `calc(100vh - ${p0.top - 35 }px)`

        // set the facet height
        let facets = this.shadowRoot.querySelector("#facets")
        let p1 = getCoords(this)
        console.log(p1)
        facets.style.height = `calc(100vh - ${p1.top - 80 }px)`
    }

    clear() {
        this.hits = {}
    }

    refresh() {
        console.log("page refresh call...")
        // this.innerHTML = ""
        while (this.children.length > 0) {
            this.removeChild(this.children[0])
        }

        this.appendChild(this.facetFilter)


        this.contexts.forEach(context => {
            if (this.hits_by_context[context]) {
                let hits = []
                for (var i = 0; i < this.hits_by_context[context].length; i++) {
                    let hit = this.hits_by_context[context][i]
                    if (!hit.hidden && hit.enable) {
                        hits.push(hit)
                    }
                }

                for (var i = this.offset * MAX_DISPLAY_RESULTS; this.querySelectorAll("." + context).length < MAX_DISPLAY_RESULTS && i < hits.length; i++) {
                    let hit = hits[i]
                    if (!hit.hidden && hit.enable) {
                        // append the mosaic card (blog, title, video, audio...)
                        this.appendChild(this.displayMosaicHit(hit, context))
                        this.appendChild(this.displayListHit(hit, context))
                    }
                }
            }
        })

    }

    refreshNavigatorAndContextSelector() {
        // count the number of search results to be displayed by the naviagtor...
        let count = 0

        this.contexts.forEach(context => {
            if (this.hits_by_context[context]) {
                let count__ = 0;
                let count_ = 0;
                this.hits_by_context[context].forEach(hit => {
                    if (!hit.hidden) {
                        count_++
                    }
                    if (!hit.hidden && hit.enable) {
                        count__++
                    }
                })
                if (count__ > count) {
                    count = count__
                }

                // display the number of results by context.
                this.contextsSelector.setContextTotal(context, count_)
            }
        })
        this.navigator.setTotal(count)
    }

    // Return the number of visible element (not filter)
    getTotal() {
        let count = 0
        for (var id in this.hits) {
            let hit = this.hits[id]
            if (!hit.hidden && hit.enable) {
                count++
            }
        }

        return count;
    }

    // Show or hide visual.
    setContextState(context, state) {
        console.log("set context ", context, "state to", state)
        if (this.hits_by_context[context]) {
            this.hits_by_context[context].forEach((hit) => {
                hit.enable = state;
            })

            // refresh the visual.
            this.refresh()
            this.refreshNavigatorAndContextSelector()

            // refresh the number of results...
            this.facetFilter.refresh()
        }
    }

    hideAll(className) {
        if (className != undefined) {
            className = getUuidByString(className)
        }
        for (var id in this.hits) {
            let hit = this.hits[id]
            if (className == undefined) {
                hit.hidden = true
            } else if (this.hits_by_className[className]) {
                if (this.hits_by_className[className].indexOf(id) != -1) {
                    hit.hidden = true
                }
            }
        }
    }

    showAll(className) {
        if (className != undefined) {
            className = getUuidByString(className)
        }
        for (var id in this.hits) {
            let hit = this.hits[id]
            if (className == undefined) {
                hit.hidden = false
            } else if (this.hits_by_className[className]) {
                /*hit.card.classList.contains(getUuidByString(className))*/
                if (this.hits_by_className[className].indexOf(id) != -1) {
                    hit.hidden = false
                }
            }
        }
    }

    countElementByClassName(className) {
        let count = 0
        className = getUuidByString(className)
        for (var id in this.hits) {
            let hit = this.hits[id]
            if (hit.enable) {
                if (this.hits_by_className[className]) {
                    if (this.hits_by_className[className].indexOf(id) != -1) {
                        count++
                    }
                }
            }
        }
        return count;
    }

    // Return all audio from cards...
    getAudios(className) {
        let audios = []

        if (this.hits_by_context["audios"]) {
            this.hits_by_context["audios"].forEach(hit => {
                let audio = hit.getAudio()
                if (className == undefined) {
                    audios.push(hit.getAudio())
                } else {
                    audio.getGenresList().forEach(g => {
                        g.split(" ").forEach(g_ => {
                            if (g_.toLowerCase() == className) {
                                audios.push(hit.getAudio())
                            }
                        })
                    })
                }
            })
        }
        return audios
    }

    setSearchResultsNavigator() {
        this.shadowRoot.querySelector("globular-search-results-pages-navigator").setSearchResultsPage(this)
    }

    // Display a mosaic vue of the result. If the result is a title I will use a flit card
    // if is a video well a video card.
    displayMosaicHit(hit, context) {
        if (hit.hasTitle || hit.hasVideo || hit.hasAudio) {
            if (hit.hasTitle()) {
                let title = hit.getTitle()
                title.globule = hit.globule
                let id = "_flip_card_" + getUuidByString(title.getName())
                let flipCard = this.querySelector("#" + id)
                if (!flipCard) {
                    flipCard = new SearchFlipCard();
                    flipCard.id = id
                    flipCard.slot = "mosaic_" + context
                    flipCard.setTitle(title)
                    flipCard.classList.add(context)
                }
                return flipCard
            } else if (hit.hasVideo()) {
                let id = "_video_card_" + getUuidByString(hit.getVideo().getId())
                let videoCard = this.querySelector("#" + id)
                let video = hit.getVideo()
                video.globule = hit.globule;
                if (!videoCard) {
                    videoCard = new SearchVideoCard();
                    videoCard.id = id
                    videoCard.slot = "mosaic_" + context
                    videoCard.setVideo(video, hit.globule)
                    videoCard.classList.add(context)
                }
                return videoCard
            } else if (hit.hasAudio()) {
                let audio = hit.getAudio()
                audio.globule = hit.globule
                let id = "_audio_card_" + audio.getId()
                let audioCard = this.querySelector("#" + id)
                if (!audioCard) {
                    audioCard = new SearchAudioCard();
                    audioCard.id = id
                    audioCard.slot = "mosaic_" + context
                    audioCard.setAudio(audio, hit.globule)
                    audioCard.classList.add(context)
                }
                return audioCard
            }
        } else {
            let blogPost = hit.getBlog()
            blogPost.globule = hit.globule;
            let id = "_" + blogPost.getUuid() + "_info"
            let blogPostInfo = this.querySelector("#" + id);
            if (!blogPostInfo) {
                blogPostInfo = new BlogPostInfo(blogPost, true, hit.globule);
                blogPostInfo.classList.add("filterable")
                blogPost.getKeywordsList().forEach(kw => blogPostInfo.classList.add(getUuidByString(kw.toLowerCase())))
                blogPostInfo.id = id
                blogPostInfo.slot = "mosaic_" + context
                blogPostInfo.classList.add(context)
            }
            return blogPostInfo
        }

    }

    displayListHit(hit, context) {
        let titleName = ""
        let uuid = ""
        if (hit.hasTitle || hit.hasVideo || hit.hasAudio) {
            if (hit.hasTitle()) {
                titleName = hit.getTitle().getName()
                uuid = getUuidByString(hit.getIndex() + "_title")
            } else if (hit.hasVideo()) {
                uuid = getUuidByString(hit.getIndex() + "_video")
            } else if (hit.hasAudio()) {
                uuid = getUuidByString(hit.getIndex() + "_audio")
            }
        } else {
            uuid = getUuidByString(hit.getIndex() + "_blog")
        }

        // insert one time...
        if (this.querySelector(`#hit-div-${uuid}`)) {
            return this.querySelector(`#hit-div-${uuid}`)
        }

        let html = `
        <div id="hit-div-${uuid}" class="hit-div" slot="list_${context}">
            <div class="hit-header-div">
                <span class="hit-index-div">
                    ${hit.getIndex() + 1}.
                </span>
                <span  class="hit-title-name-div">
                    ${titleName}
                </span>
                <span class="hit-score-div">
                    ${hit.getScore().toFixed(3)}
                </span>
            </div>
            <div class="snippets-div">
                
            </div>
            <div class="title-info-div">
            </div>
        </div>
        `


        let range = document.createRange()
        //this.appendChild()
        let hitDiv = range.createContextualFragment(html)

        let snippetDiv = hitDiv.querySelector(`.snippets-div`)

        let titleInfoDiv = hitDiv.querySelector(`.title-info-div`)

        let infoDisplay = new InformationsManager()

        if (hit.hasTitle || hit.hasVideo || hit.hasAudio) {
            if (hit.hasTitle()) {
                infoDisplay.setTitlesInformation([hit.getTitle()], hit.globule)
                hitDiv.children[0].classList.add("filterable")
                let title = hit.getTitle()
                title.globule = hit.globule;
                title.getGenresList().forEach(g => hitDiv.children[0].classList.add(getUuidByString(g.toLowerCase())))
                hitDiv.children[0].classList.add(getUuidByString(title.getType().toLowerCase()))

                // now the term..
                if (title.getRating() < 3.5) {
                    hitDiv.children[0].classList.add(getUuidByString("low"))
                } else if (title.getRating() < 7.0) {
                    hitDiv.children[0].classList.add(getUuidByString("medium"))
                } else {
                    hitDiv.children[0].classList.add(getUuidByString("high"))
                }

            } else if (hit.hasVideo()) {
                infoDisplay.setVideosInformation([hit.getVideo()])
                hitDiv.children[0].classList.add("filterable")
                let video = hit.getVideo()
                video.globule = hit.globule
                video.getGenresList().forEach(g => hitDiv.children[0].classList.add(getUuidByString(g.toLowerCase())))
                video.getTagsList().forEach(tag => hitDiv.children[0].classList.add(getUuidByString(tag.toLowerCase())))

                // now the term..
                if (video.getRating() < 3.5) {
                    hitDiv.children[0].classList.add(getUuidByString("low"))
                } else if (video.getRating() < 7.0) {
                    hitDiv.children[0].classList.add(getUuidByString("medium"))
                } else {
                    hitDiv.children[0].classList.add(getUuidByString("high"))
                }
            } else if (hit.hasAudio()) {
                infoDisplay.setAudiosInformation([hit.getAudio()])
                hitDiv.children[0].classList.add("filterable")
                let audio = hit.getAudio()
                audio.globule = hit.globule
                audio.getGenresList().forEach(g => {
                    g.split(" ").forEach(g_ => hitDiv.children[0].classList.add(getUuidByString(g_.toLowerCase())))

                })
            }

            infoDisplay.hideHeader()
        } else {
            let blogPost = hit.getBlog()
            blogPost.globule = hit.globule;
            hitDiv.children[0].classList.add("filterable")
            infoDisplay.setBlogPostInformation(blogPost)
            blogPost.getKeywordsList().forEach(kw => hitDiv.children[0].classList.add(getUuidByString(kw.toLowerCase())))
        }


        titleInfoDiv.appendChild(infoDisplay)

        // Here  I will display the snippet results.
        hit.getSnippetsList().forEach(snippet => {
            let html = `
            <div style="display: flex; flex-direction: column; padding: 10px;">
                <div class="snippet-field">${snippet.getField()}</div>
                <div class="snippet-fragments"></div>
            </div>
            `
            snippetDiv.appendChild(range.createContextualFragment(html))

            let fragmentDiv = snippetDiv.children[snippetDiv.children.length - 1].children[1]
            snippet.getFragmentsList().forEach(f => {
                let div = document.createElement("div")
                div.style.paddingBottom = "5px";
                div.innerHTML = f
                fragmentDiv.appendChild(div)
            })
        })

        return hitDiv
    }
}

customElements.define('globular-search-results-page', SearchResultsPage)

/**
 * Sample empty component
 */
export class SearchAudioCard extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
        this.audio = null;

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
            #container{
                padding: 2px;
                position: relative;
            }

            .audio-card{
                display: flex;
                flex-direction: column;
                border-radius: 3.5px;
                border: 1px solid var(--palette-divider);
                height: 100%;
                max-width: 320px;
                margin: 10px;
                max-width: 320px;
                height: 285px;
                margin: 10px;
                overflow: hidden;
            }

            .audio-card:hover{
                box-shadow: rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px;
            }

            .audio-card img{
                max-width: 320px;
                min-width: 320px;
                min-height: 100px;
                max-height: 180px;
                border-top-left-radius: 3.5px;
                border-top-right-radius: 3.5px;
            }

            #artist, #album {
                font-weight: 500;
                font-size: 1.2rem;
            }

            #title{
                font-size: 1.25rem;
                font-weight: 350;
            }

             #album{
                color: white;
            }


        </style>

        <div id="container" class="audio-card">
            <img></img>
            <span id="artist"></span>
            <div style="display: flex; position: absolute; background-color: black; top: 0px; left: 0px; right: 0px; padding: 5px;">
                <span id="album" style="flex-grow: 1;"></span> 
                <paper-icon-button id="play-album-btn" style=" --iron-icon-fill-color: white;" title="play album" icon="av:play-arrow"></paper-icon-button> 
            </div>
            <div style="display: flex; justify-items: center;">
                <span id="title" style="flex-grow: 1;"></span>
                <paper-icon-button id="play-title-btn" title="play title" icon="av:play-arrow"></paper-icon-button> 
            </div>
        </div>
        `
    }


    connectedCallback() {

    }


    // return the audio element...
    getAudio() {
        return this.audio;
    }


    // get files associated with the titles, audios or videos...
    getTitleFiles(id, indexPath, globule, callback) {
        let rqst = new GetTitleFilesRequest
        rqst.setTitleid(id)
        rqst.setIndexpath(indexPath)
        globule.titleService.getTitleFiles(rqst, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
            .then(rsp => {
                callback(rsp.getFilepathsList())
            }).catch(err => {
                callback([])
            })
    }

    playAudios(audios, name, globule) {

        // here I will get the audi
        let audio_playList = "#EXTM3U\n"
        audio_playList += "#PLAYLIST: " + name + "\n\n"

        // Generate the playlist with found audio items.
        let generateAudioPlaylist = () => {
            let audio = audios.pop();

            // set the audio info
            let indexPath = globule.config.DataPath + "/search/audios"

            // get the title file path...
            this.getTitleFiles(audio.getId(), indexPath, globule, files => {
                if (files.length > 0) {
                    audio_playList += `#EXTINF:${audio.getDuration()}, ${audio.getTitle()}, tvg-id="${audio.getId()}"\n`

                    let url = globule.config.Protocol + "://" + globule.domain
                    if (window.location != globule.domain) {
                        if (globule.config.AlternateDomains.indexOf(window.location.host) != -1) {
                            url = globule.config.Protocol + "://" + window.location.host
                        }
                    }

                    if (globule.config.Protocol == "https") {
                        if (globule.config.PortHttps != 443)
                            url += ":" + globule.config.PortHttps
                    } else {
                        if (globule.config.PortHttps != 80)
                            url += ":" + globule.config.PortHttp
                    }

                    let path = files[0].split("/")
                    path.forEach(item => {
                        item = item.trim()
                        if (item.length > 0)
                            url += "/" + encodeURIComponent(item)
                    })

                    url += "?application=" + Model.application
                    if (localStorage.getItem("user_token") != undefined) {
                        url += "&token=" + localStorage.getItem("user_token")
                    }

                    audio_playList += url + "\n\n"
                }
                if (audios.length > 0) {
                    generateAudioPlaylist()
                } else {
                    console.log(audio_playList)
                    playAudio(audio_playList, null, null, null, globule)
                }
            })
        }

        generateAudioPlaylist()
    }

    // Call search event.
    setAudio(audio, globule) {

        this.audio = audio
        audio.globule = globule

        this.classList.add("filterable")
        audio.getGenresList().forEach(g => {
            g.split(" ").forEach(g_ => this.classList.add(getUuidByString(g_.toLowerCase())))

        })

        this.shadowRoot.querySelector("img").src = audio.getPoster().getContenturl()

        // I will display the album and year info...
        this.shadowRoot.querySelector("#artist").innerHTML = audio.getArtist()
        this.shadowRoot.querySelector("#title").innerHTML = audio.getTitle()
        this.shadowRoot.querySelector("#album").innerHTML = audio.getAlbum()

        if (audio.getAlbum().length == 0) {
            this.shadowRoot.querySelector("#album").parentNode.style.display = "none";
        }


        // Now the action...
        this.shadowRoot.querySelector("#play-title-btn").onclick = () => {
            // paly only the first file...
            let rqst = new GetTitleFilesRequest
            rqst.setTitleid(audio.getId())
            let indexPath = globule.config.DataPath + "/search/audios"
            rqst.setIndexpath(indexPath)

            globule.titleService.getTitleFiles(rqst, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
                .then(rsp => {

                    if (rsp.getFilepathsList().length > 0) {
                        let path = rsp.getFilepathsList().pop()
                        playAudio(path, null, null, audio, globule)
                    }

                }).catch(err => ApplicationView.displayMessage(err, 3000))
        }

        this.shadowRoot.querySelector("#play-album-btn").onclick = () => {

            searchTitles(globule, audio.getAlbum(), [], globule.config.DataPath + "/search/audios", 0, 500, hits => {
                let audios = []
                hits.forEach(hit => {
                    if (hit.hasAudio) {
                        let a = hit.getAudio()
                        if (a.getAlbum() == audio.getAlbum()) {
                            audios.push(a)
                        }

                    }
                })
                if (audios.length > 0) {
                    if (audios[0].getTracknumber())
                        audios = audios.sort((a, b) => {
                            return b.getTracknumber() - a.getTracknumber()
                        })
                    this.playAudios(audios, audio.getAlbum(), globule)
                }
            }, ["album"])
        }
    }
}

customElements.define('globular-search-audio-card', SearchAudioCard)

/**
 * Search Box
 */
export class SearchVideoCard extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()

        this.video = null;

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           

            .video-card{
                border-radius: 3.5px;
                border: 1px solid var(--palette-divider);
                height: 100%;
                max-width: 320px;
                margin: 10px;
                min-width: 320px;
                height: 285px;
                margin: 10px;
                overflow: hidden;
                display: flex;
                justify-content: center;
                flex-direction: column;
            }

            .video-card:hover{
                box-shadow: rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px;
            }

            .video-card video{
                max-width: 320px;
                min-width: 320px;
                max-height: 180px;
                border-top-left-radius: 3.5px;
                border-top-right-radius: 3.5px;
            }

            .video-card video:hover{
                cursor: pointer;
            }

            .video-card img{
                max-height: 200px;
            }

            .video-card p{
                font-size: 1.1rem;
                margin: 5px;
                margin-left: 10px;
                overflow: hidden;
                max-width: 75ch;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .rating-star{
                --iron-icon-fill-color: rgb(245 197 24);
                padding: 10px;
                height: 20px;
                width: 20px;
            }
            
            .title-rating-div{
                display: flex;
                flex-grow: 1;
                align-items: center;
                color: var(--palette-text-secondery);
                font-size: 1rem;
            }

            #preview-image{
                max-height: 180px;
            }
            
        </style>
        <div class="video-card">
            <img id="thumbnail-image"></img>
            <video autoplay muted loop id="preview-image" style="display: none;"></video>
            <p id="description"></p>
            <div style="display: flex;">
                <div class="title-rating-div">
                    <iron-icon class="rating-star" icon="icons:star"></iron-icon>
                    <div style="display: flex; flex-direction: column;">
                        <div><span id="rating-span"></span>/10</div>
                    </div>
                </div>
                <paper-icon-button id="video-info-button" icon="icons:arrow-drop-down-circle"></paper-icon-button>
            </div>
        </div>
        `

        this.videoPreview = this.shadowRoot.querySelector("#preview-image")
    }


    showVideoInfo(video) {
        //let uuid = randomUUID()
        let html = `
        <style>
           
            paper-card {
                background: var(--palette-background-default);
                border-top: 1px solid var(--palette-background-paper);
                border-left: 1px solid var(--palette-background-paper);
            }
        </style>

        <paper-card>
            <globular-informations-manager id="video-info-box"></globular-informations-manager>
        </paper-card>
        `
        let videoInfoBox = document.getElementById("video-info-box")
        if (videoInfoBox == undefined) {
            let range = document.createRange()
            document.body.appendChild(range.createContextualFragment(html))
            videoInfoBox = document.getElementById("video-info-box")
            videoInfoBox.parentNode.style.position = "fixed"
            videoInfoBox.parentNode.style.top = "75px"
            videoInfoBox.parentNode.style.left = "50%"
            videoInfoBox.parentNode.style.transform = "translate(-50%)"
        }
        videoInfoBox.setVideosInformation([video])
    }

    connectedCallback() {

        // test if the gif image is initialysed...
        let preview = this.shadowRoot.querySelector("#preview-image")
        // paly only the first file...
        if (preview.src.length == 0) {
            let video = this.video
            let globule = this.video.globule
            let rqst = new GetTitleFilesRequest
            rqst.setTitleid(video.getId())
            let indexPath = globule.config.DataPath + "/search/videos"
            rqst.setIndexpath(indexPath)

            globule.titleService.getTitleFiles(rqst, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
                .then(rsp => {
                    if (rsp.getFilepathsList().length > 0) {
                        let path = rsp.getFilepathsList().pop()
                        let thumbnail = this.shadowRoot.querySelector("#thumbnail-image")
                        let thumbnailPath = path
                        if (thumbnailPath.lastIndexOf(".mp4") != -1 || thumbnailPath.lastIndexOf(".MP4") != -1) {
                            thumbnailPath = thumbnailPath.substring(0, thumbnailPath.lastIndexOf("."))
                        }
                        thumbnailPath = thumbnailPath.substring(0, thumbnailPath.lastIndexOf("/") + 1) + ".hidden" + thumbnailPath.substring(thumbnailPath.lastIndexOf("/")) + "/preview.mp4"

                        let url = globule.config.Protocol + "://" + globule.domain
                        if (window.location != globule.domain) {
                            if (globule.config.AlternateDomains.indexOf(window.location.host) != -1) {
                                url = globule.config.Protocol + "://" + window.location.host
                            }
                        }

                        if (globule.config.Protocol == "https") {
                            if (globule.config.PortHttps != 443)
                                url += ":" + globule.config.PortHttps
                        } else {
                            if (globule.config.PortHttps != 80)
                                url += ":" + globule.config.PortHttp
                        }


                        thumbnailPath.split("/").forEach(item => {
                            item = item.trim()
                            if (item.length > 0) {
                                url += "/" + encodeURIComponent(item)
                            }
                        })

                        preview.src = url
                        preview.onclick = () => {
                            playVideo(path, null, null, null, globule)
                        }

                        /*
                        if (!thumbnail.src.startsWith("data:image")) {
                            getCoverDataUrl(dataUrl => {
                                thumbnail.src = dataUrl
                                video.getPoster().setContenturl(thumbnail.src)
                                let rqst = new CreateVideoRequest
                                rqst.setIndexpath(globule.config.DataPath + "/search/videos")
                                rqst.setVideo(video)
                                globule.titleService.createVideo(rqst).then(
                                    () => {
                                        console.log("video was saved!", video)
                                    }
                                )
                            }, video.getId(), video.getUrl(), path)

                        }
                        */

                    }
                }).catch(err => {
                    // TODO append broken link image and propose the user to delete the file.
                    console.log("no video file found", err)
                    let rqst = new DeleteVideoRequest
                    rqst.setVideoid(video.getId())
                    rqst.setIndexpath(indexPath)
                    globule.titleService.deleteVideo(rqst, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
                        .then(() => {
                            console.log("video ", video.getId(), " was deleted")
                        })
                })
        }
    }

    setVideo(video, globule) {

        if (!globule) {
            globule = Application.globular
        }

        this.video = video
        this.video.globule = globule

        this.classList.add("filterable")
        video.getGenresList().forEach(g => this.classList.add(getUuidByString(g.toLowerCase())))
        video.getTagsList().forEach(tag => this.classList.add(getUuidByString(tag.toLowerCase())))

        // now the term..
        if (video.getRating() < 3.5) {
            this.classList.add(getUuidByString("low"))
        } else if (video.getRating() < 7.0) {
            this.classList.add(getUuidByString("medium"))
        } else {
            this.classList.add(getUuidByString("high"))
        }

        // Set the default thumbnail.
        let thumbnail = this.shadowRoot.querySelector("#thumbnail-image")
        let preview = this.shadowRoot.querySelector("#preview-image")
        let card = this.shadowRoot.querySelector(".video-card")

        if (video.getPoster()) {
            thumbnail.src = video.getPoster().getContenturl()
        }

        // Here the image was not set properly...
        this.shadowRoot.querySelector("#video-info-button").onclick = () => {
            this.showVideoInfo(video)
        }

        card.onmouseover = () => {
            preview.style.display = "block"
            thumbnail.style.display = "none"
            this.videoPreview.play()
        }

        card.onmouseleave = () => {
            preview.style.display = "none"
            thumbnail.style.display = "block"
            this.videoPreview.pause()
        }

        // Here I will get the file asscociated with the video...
        this.shadowRoot.querySelector("#description").innerHTML = video.getDescription()
        this.shadowRoot.querySelector("#rating-span").innerHTML = video.getRating().toFixed(1)
    }
}

customElements.define('globular-search-video-card', SearchVideoCard)

/**
 * Display title with a flip card for title (movies)
 */
export class SearchFlipCard extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
            .title-card{
                margin: 7.5px; 
                display: flex; 
                height: 380px; 
                width: 256px;
            }

            /* entire container, keeps perspective */
            .flip-container {
                perspective: 1000;
            }
            
            /* flip the pane when hovered */
            .flip-container:hover .flipper, .flip-container.hover .flipper {
                transform: rotateY(180deg);
            }

            .flip-container, .front, .back {
                width: 256px;
                height: 380px;
            }

            /* flip speed goes here */
            .flipper {
                transition: 0.6s;
                transform-style: preserve-3d;
                position: relative;
            }

            /* hide back of pane during swap */
            .front, .back {
                backface-visibility: hidden;
                position: absolute;
                top: 0;
                left: 0;
                text-align: center;

                max-width: 256px;
                max-height: 380px;

                border-radius: 3.5px;
                box-shadow: rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px;
            }

            /* front pane, placed above back */
            .front {
                z-index: 2;
                /* for firefox 31 */
                transform: rotateY(0deg);
                background-size: cover;
            }

            /* back, initially hidden pane */
            .back {
                transform: rotateY(180deg);
            }

            .series-info{
                display: flex;
                flex-direction: column;
                background-color: rgba(0, 0, 0, 0.65);
                color: #fff;
            }

            .series-poster{
                max-width: 256px;
                top: 0px;
            }

        </style>

        <div class="title-card" id="hit-div-mosaic">
            <div class="flip-container" ontouchstart="this.classList.toggle('hover');">
                <div class="flipper">
                    <div id="hit-div-mosaic-front" class="front">
                        <!-- front content -->
                        <div class="series-info">
                            <span style="font-size: 1.4em; font-weight: bold;" id="hit-div-mosaic-series-name"></span>
                            <div>
                                <span style="font-size: 1.1em; font-weight: bold;" id="hit-div-mosaic-episode-name">
                                </span>
                            </div>
                        </div>
                    </div>
                    <div id="back-container" class="back">
                     <globular-search-title-detail id="search-title"></globular-search-title-detail>   
                    </div>
                </div>
            </div>
        </div>
        `
    }

    setTitle(title) {

        let globule = title.globule

        // so here i will use the class list to set genre and type...
        this.classList.add("filterable")
        title.getGenresList().forEach(g => this.classList.add(getUuidByString(g.toLowerCase())))
        this.classList.add(getUuidByString(title.getType().toLowerCase()))

        // now the term..
        if (title.getRating() < 3.5) {
            this.classList.add(getUuidByString("low"))
        } else if (title.getRating() < 7.0) {
            this.classList.add(getUuidByString("medium"))
        } else {
            this.classList.add(getUuidByString("high"))
        }

        // test create offer...
        title.globule = globule
        this.shadowRoot.querySelector(`#search-title`).setTitle(title)
        if (title.getType() == "TVEpisode") {
            // So here I will get the series info If I can found it...
            let seriesInfos = this.shadowRoot.querySelector(`#hit-div-mosaic-episode-name`)
            if (title.getSerie().length > 0) {
                let serieName = this.shadowRoot.querySelector(`#hit-div-mosaic-series-name`)
                let rqst = new GetTitleByIdRequest
                rqst.setTitleid(title.getSerie())
                let indexPath = globule.config.DataPath + "/search/titles"
                rqst.setIndexpath(indexPath)
                globule.titleService.getTitleById(rqst, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
                    .then(rsp => {
                        let serie = rsp.getTitle()
                        let url = serie.getPoster().getContenturl()
                        /*toDataURL(url, (dataUrl) => {*/
                        this.shadowRoot.querySelector(`#hit-div-mosaic-front`).style.backgroundImage = `url(${url})`
                        serieName.innerHTML = serie.getName()
                        /*})*/
                    })
                    .catch(err => {
                        // in that case I will try with imdb...

                        getImdbInfo(title.getSerie(), serie => {
                            let url = serie.Poster.ContentURL
                            /*toDataURL(url, (dataUrl) => {*/
                            this.shadowRoot.querySelector(`#hit-div-mosaic-front`).style.backgroundImage = `url(${url})`
                            serieName.innerHTML = serie.Name
                            /*})*/
                        }, err => ApplicationView.displayMessage(err, 3000), globule)
                    })
            }
            seriesInfos.innerHTML = title.getName() + " S" + title.getSeason() + "E" + title.getEpisode()
        } else {
            let url = title.getPoster().getContenturl()
            /*toDataURL(url, (dataUrl) => {*/
            this.shadowRoot.querySelector(`#hit-div-mosaic-front`).style.backgroundImage = `url(${url})`
            /*})*/
        }

    }

}

customElements.define('globular-search-flip-card', SearchFlipCard)

/**
 * Search Detail Title 
 */
export class SearchTitleDetail extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
        this.title_ = null;
        this.isLoaded = false;

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
           
            .search-title-detail{
                position: absolute;               
                max-width: 256px;
                max-height: 380px;
                border-radius: 3.5px;
                background-color: var(--palette-background-paper);
                box-shadow: rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px;
                border: 1px solid var(--palette-action-disabled);
                z-index: 1000;
                bottom: 0px;
                left: 0px;
                right: 0px;
                top: 0px;
                display: flex;
                flex-direction: column;
                
            }

            .search-title-detail:hover{
                box-shadow: rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px;
            }

            .preview{
                max-width: 256px;
                max-height: 130px;
            }

            .season-episodes-lst{
                display: flex;
                flex-direction: column;
                width: 100%;
            }

            #episodes-select-div {
                align-items: center;
            }

            #episodes-select-div select {
                height: 24px;
                margin-left: 5px;
            }

        </style>

        
        <div class="search-title-detail">
            <div class="video-div">
                <div class="title-title-div"></div>
                <video muted autoplay loop class="preview" id="title-preview"></video>
            </div>

            <div class="title-interaction-div" style="display: flex;">
                <paper-icon-button id="play-video-button" icon="av:play-circle-filled"></paper-icon-button>
                <paper-icon-button icon="av:icons:add-circle"></paper-icon-button>
                <span style="flex-grow: 1;"></span>
                <paper-icon-button id="title-info-button" icon="icons:arrow-drop-down-circle"></paper-icon-button>              
            </div>
            <div>
                <globular-informations-manager short></globular-informations-manager>
            </div>
            <div class="season-episodes-lst">
                <div id="loading-episodes-infos" style="diplay:flex; flex-direction: column; width: 100%;">
                    <span id="progress-message">loading episodes infos wait...</span>
                    <paper-progress indeterminate style="width: 100%;"></paper-progress>
                </div>
                <div id="episodes-select-div" style="display:none;">
                    <select id="season-select" style="max-width: 80px;"></select>
                    <select id="episode-select" style="max-width: 102px;"></select>
                    <span style="flex-grow: 1;"></span>
                    <paper-icon-button id="play-episode-video-button" icon="av:play-circle-filled"></paper-icon-button>
                    <paper-icon-button id="episode-info-button" icon="icons:arrow-drop-down-circle"></paper-icon-button>
                </div>
                <video autoplay muted loop class="preview" id="epsiode-preview"></video>
            </div>
        </div>
        `

        // test create offer...
        this.titleCard = this.shadowRoot.querySelector(".search-title-detail")
        this.titlePreview = this.shadowRoot.querySelector("#title-preview")

        this.titleCard.onmouseover = (evt) => {
            this.titlePreview.play()
        }

        this.titleCard.onmouseleave = (evt) => {
            this.titlePreview.pause()
        }

        this.episodePreview = this.shadowRoot.querySelector("#epsiode-preview")
        let episodesLst = this.shadowRoot.querySelector(".season-episodes-lst")

        episodesLst.onmouseover = (evt) => {
            this.episodePreview.play()
        }

        episodesLst.onmouseleave = (evt) => {
            this.episodePreview.pause()
        }
    }

    connectedCallback() {
        if (this.isLoaded) {
            return
        }

        let title = this.title_
        let globule = title.globule;
        this.shadowRoot.querySelector("globular-informations-manager").setTitlesInformation([title])

        this.isLoaded = true;

        // Display the episode informations.
        title.onLoadEpisodes = (episodes) => {
            if (this.shadowRoot.querySelector("#loading-episodes-infos").style.display == "none") {
                return // already loaded
            }

            this.shadowRoot.querySelector("#loading-episodes-infos").style.display = "none"
            this.shadowRoot.querySelector("#episodes-select-div").style.display = "flex"

            let infos = {}
            episodes.forEach(e => {
                if (!infos[e.getSeason()]) {
                    infos[e.getSeason()] = []
                }
                infos[e.getSeason()].push(e)
            })

            let seasonSelect = this.shadowRoot.querySelector("#season-select")
            let episodeSelect = this.shadowRoot.querySelector("#episode-select")


            let setEpisodeOption = (episode) => {
                let rqst = new GetTitleFilesRequest
                rqst.setTitleid(episode.getId())
                let indexPath = globule.config.DataPath + "/search/titles"
                rqst.setIndexpath(indexPath)

                globule.titleService.getTitleFiles(rqst, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
                    .then(rsp => {
                        if (rsp.getFilepathsList().length > 0) {
                            let path = rsp.getFilepathsList().pop()
                            let url = globule.config.Protocol + "://" + globule.domain
                            if (window.location != globule.domain != -1) {
                                if (globule.config.AlternateDomains.indexOf(window.location.host) != -1) {
                                    url = globule.config.Protocol + "://" + window.location.host
                                }
                            }

                            if (globule.config.Protocol == "https") {
                                if (globule.config.PortHttps != 443)
                                    url += ":" + globule.config.PortHttps
                            } else {
                                if (globule.config.PortHttps != 80)
                                    url += ":" + globule.config.PortHttp
                            }

                            let thumbnailPath = path
                            if (thumbnailPath.lastIndexOf(".mp4") != -1 || thumbnailPath.lastIndexOf(".MP4") != -1) {
                                thumbnailPath = thumbnailPath.substring(0, thumbnailPath.lastIndexOf("."))
                            }
                            thumbnailPath = thumbnailPath.substring(0, thumbnailPath.lastIndexOf("/") + 1) + ".hidden" + thumbnailPath.substring(thumbnailPath.lastIndexOf("/")) + "/preview.mp4"

                            thumbnailPath.split("/").forEach(item => {
                                item = item.trim()
                                if (item.length > 0) {
                                    url += "/" + encodeURIComponent(item)
                                }
                            })
                            this.episodePreview.src = url

                            this.shadowRoot.querySelector("#epsiode-preview").onclick = this.shadowRoot.querySelector("#play-episode-video-button").onclick = () => {
                                playVideo(path, (player, title) => {
                                    playTitleListener(player, title, indexPath, globule)
                                }, null, null, globule)
                            }

                            this.shadowRoot.querySelector("#episode-info-button").onclick = () => {
                                this.showTitleInfo(episode)
                            }

                        }
                    }).catch(err => {
                        console.log("No file found with title ", title.getId(), title.getDescription(), err)
                    })
            }


            let setEpisodeOptions = (episodes) => {
                // remove previous choice...
                episodeSelect.innerHTML = ""
                let index = 0
                episodes.forEach(e => {
                    let episodeOpt = document.createElement("option")
                    e.value = e.getEpisode()
                    episodeOpt.innerHTML = "Episode " + e.getEpisode()
                    episodeSelect.appendChild(episodeOpt)
                    episodeOpt.episode = e
                    if (index == 0) {
                        setEpisodeOption(e)
                    }
                    index++
                })
            }

            let index = 0;
            for (var season_number in infos) {
                let seasonOpt = document.createElement("option")
                seasonOpt.value = season_number
                seasonOpt.innerHTML = "Season " + season_number
                seasonSelect.appendChild(seasonOpt)

                if (index == 0) {
                    setEpisodeOptions(infos[season_number])
                }

                // keep in the option itself
                seasonOpt.episodes = infos[season_number]
                index++

            }

            seasonSelect.onchange = () => {
                var opt = seasonSelect.options[seasonSelect.selectedIndex];
                setEpisodeOptions(opt.episodes)
            }

            episodeSelect.onchange = () => {
                var opt = episodeSelect.options[episodeSelect.selectedIndex];
                setEpisodeOption(opt.episode)
            }
        }

        if (this.title_.getType() == "TVSeries") {
            this.shadowRoot.querySelector("#title-preview").style.display = "none"
            this.shadowRoot.querySelector("#play-video-button").style.display = "none"
        } else {
            this.shadowRoot.querySelector("#loading-episodes-infos").style.display = "none"
        }

        this.shadowRoot.querySelector("#title-info-button").onclick = () => {
            this.showTitleInfo(title)
        }

        let url = globule.config.Protocol + "://" + globule.domain
        if (window.location != globule.domain) {
            if (globule.config.AlternateDomains.indexOf(window.location.host) != -1) {
                url = globule.config.Protocol + "://" + window.location.host
            }
        }

        if (globule.config.Protocol == "https") {
            if (globule.config.PortHttps != 443)
                url += ":" + globule.config.PortHttps
        } else {
            if (globule.config.PortHttps != 80)
                url += ":" + globule.config.PortHttp
        }

        // paly only the first file...
        let rqst = new GetTitleFilesRequest
        rqst.setTitleid(title.getId())
        let indexPath = globule.config.DataPath + "/search/titles"
        rqst.setIndexpath(indexPath)

        globule.titleService.getTitleFiles(rqst, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
            .then(rsp => {
                if (rsp.getFilepathsList().length > 0) {
                    let path = rsp.getFilepathsList().pop()

                    let thumbnailPath = path
                    if (thumbnailPath.lastIndexOf(".mp4") != -1 || thumbnailPath.lastIndexOf(".MP4") != -1) {
                        thumbnailPath = thumbnailPath.substring(0, thumbnailPath.lastIndexOf("."))
                    }
                    thumbnailPath = thumbnailPath.substring(0, thumbnailPath.lastIndexOf("/") + 1) + ".hidden" + thumbnailPath.substring(thumbnailPath.lastIndexOf("/")) + "/preview.mp4"

                    thumbnailPath.split("/").forEach(item => {
                        item = item.trim()
                        if (item.length > 0) {
                            url += "/" + encodeURIComponent(item)
                        }
                    })
                    this.titlePreview.src = url

                    this.shadowRoot.querySelector("#title-preview").onclick = this.shadowRoot.querySelector("#play-video-button").onclick = () => {
                        playVideo(path, (player, title) => {
                            playTitleListener(player, title, indexPath, globule)
                        }, null, title, globule)
                    }
                }
            }).catch(err => {
                console.log(err, globule)
            })

    }


    setTitle(title) {

        this.title_ = title;

    }

    showTitleInfo(title) {
        //let uuid = randomUUID()
        let html = `
        <style>
           
            paper-card {
                background: var(--palette-background-default);
                border-top: 1px solid var(--palette-background-paper);
                border-left: 1px solid var(--palette-background-paper);
            }
        </style>

        <paper-card>
            <globular-informations-manager id="title-info-box"></globular-informations-manager>
        </paper-card>
        `
        let titleInfoBox = document.getElementById("title-info-box")
        if (titleInfoBox == undefined) {
            let range = document.createRange()
            document.body.appendChild(range.createContextualFragment(html))
            titleInfoBox = document.getElementById("title-info-box")
            titleInfoBox.parentNode.style.position = "fixed"
            titleInfoBox.parentNode.style.top = "75px"
            titleInfoBox.parentNode.style.left = "50%"
            titleInfoBox.parentNode.style.transform = "translate(-50%)"
        }
        titleInfoBox.setTitlesInformation([title])
    }

}

customElements.define('globular-search-title-detail', SearchTitleDetail)

export class FacetSearchFilter extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(page) {
        super()

        this.page = page
        this.panels = {};

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
            #container{
                font-size: 1.17rem;
                padding: 10px;
                padding-right: 30px;
            }
            
        </style>
        <div id="container">
           <slot name="facets"></slot>
        </div>
        `
    }

    // Refresh the facets...
    refresh() {
        for (var key in this.panels) {
            this.panels[key].refresh()
        }
    }

    // Set the facets...
    setFacets(facets) {

        facets.getFacetsList().forEach(facet => {
            let id = "_" + getUuidByString(facet.getField())
            let p = this.panels[id]
            if (p == undefined) {
                p = new SearchFacetPanel(this.page)
                this.panels[id] = p
            }

            if (facet.getTotal() > 0) {
                p.slot = "facets"
                p.setFacet(facet)
                this.appendChild(p)
            }
        })
    }
}

customElements.define('globular-facet-search-filter', FacetSearchFilter)

/**
 * This facet informations...
 */
export class SearchFacetPanel extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(page) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
        this.page = page
        this.terms = {}

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           

            .facet-list{
                padding-bottom: 20px;
                font-size: 1rem;
            }

            span{
                font-style: italic;
                font-size: 1rem;
                margin-left: 10px;
            }

            paper-checkbox{
                margin-top: 15px;
            }

        </style>

        <div style="display: flex; flex-direction: column;">
            <div class="facet-label" style="display: flex; justify-items: center; align-items: baseline;">
                <paper-icon-button id="play_facet_btn"  style="display: none"  icon="av:play-arrow"></paper-icon-button>
                <paper-checkbox checked> <span id='field_span'></span> <span id='total_span'></span></paper-checkbox checked>
            </div>
            <div class="facet-list">

            </div>
        </div>
        `

        let facetList = this.shadowRoot.querySelector(".facet-list")
        let checkbox_ = this.shadowRoot.querySelector("paper-checkbox")

        checkbox_.onclick = () => {
            this.page.hideAll()
            if (checkbox_.checked) {
                this.page.showAll()
            }

            // refresh the page
            this.page.refresh()
            this.page.refreshNavigatorAndContextSelector()

            let checkboxs = facetList.querySelectorAll("paper-checkbox")
            for (var i = 0; i < checkboxs.length; i++) {
                let checkbox = checkboxs[i]
                if (!checkbox_.checked) {
                    if (checkbox.checked) {
                        checkbox.checked = false
                    }
                } else {
                    if (!checkbox.checked) {
                        checkbox.checked = true
                    }
                }
            }
        }
    }

    refresh() {
        // refresh the panels....
        this.shadowRoot.querySelector("#total_span").innerHTML = "(" + this.page.getTotal() + ")"
        let facetList = this.shadowRoot.querySelector(".facet-list")

        for (var key in this.terms) {
            let term = this.terms[key]
            let count = this.page.countElementByClassName(term.className)
            if (count > 0) {
                term.countDiv.innerHTML = "(" + count + ")"
                facetList.appendChild(term)
            } else if (term.parentNode) {
                term.parentNode.removeChild(term)
            }
        }

    }

    // get files associated with the titles, audios or videos...
    getTitleFiles(id, indexPath, globule, callback) {
        let rqst = new GetTitleFilesRequest
        rqst.setTitleid(id)
        rqst.setIndexpath(indexPath)
        globule.titleService.getTitleFiles(rqst, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
            .then(rsp => {
                callback(rsp.getFilepathsList())
            }).catch(err => {
                callback([])
            })
    }

    setFacet(facet) {
        this.facet = facet;
        this.id = "_" + getUuidByString(facet.getField())

        this.shadowRoot.querySelector("#total_span").innerHTML = "(" + this.page.getTotal() + ")"
        this.shadowRoot.querySelector("#field_span").innerHTML = facet.getField()

        /** Play all results found... */
        this.shadowRoot.querySelector("#play_facet_btn").onclick = () => {
            let audios = this.page.getAudios()
            // Play the audios found...
            if (audios.length > 0) {
                this.playAudios(audios, facet.getField())
            } else {
                ApplicationView.displayMessage("no item to play!", 3000)
            }

        }

        let range = document.createRange()
        let terms = facet.getTermsList().sort((a, b) => {
            if (a.getTerm() < b.getTerm()) { return -1; }
            if (a.getTerm() > b.getTerm()) { return 1; }
            return 0;
        })

        let facetList = this.shadowRoot.querySelector(".facet-list")
        let checkbox_ = this.shadowRoot.querySelector("paper-checkbox")

        terms.forEach(t => {

            let term = t.getTerm()
            let className = t.getTerm()
            if (term.startsWith("{")) {
                let obj = JSON.parse(term)
                term = obj.name + "  " + obj.min + "-" + obj.max
                className = obj.name
            }

            let uuid = "_" + getUuidByString(className)
            if (this.terms[uuid] == undefined) {
                let html = `
                    <div id="${uuid}_div" style="margin-left: 25px; display: flex; justify-items: center; align-items: baseline;">
                        <paper-icon-button  style="display: none"  id="${uuid}_play_btn" icon="av:play-arrow"></paper-icon-button>
                        <paper-checkbox class="${className}" id="${uuid}" checked> <div  class="facet-label"> ${term + "<span id='" + uuid + "_total'></span>"} </div></paper-checkbox> 
                    <div>
                    `
                // The facet list.
                facetList.appendChild(range.createContextualFragment(html))

                if (this.getAudios(className).length > 0) {
                    this.shadowRoot.querySelector("#" + uuid + "_play_btn").style.display = "block"
                    this.shadowRoot.querySelector("#play_facet_btn").style.display = "block"
                } else {
                    this.shadowRoot.querySelector("#" + uuid + "_play_btn").style.display = "none"
                }

                this.shadowRoot.querySelector("#" + uuid + "_play_btn").onclick = () => {
                    // Play the audios found...
                    this.playAudios(this.getAudios(className), term)
                }

                // keep track of the terms...
                this.terms[uuid] = this.shadowRoot.querySelector("#" + uuid + "_div")

                let checkbox = this.shadowRoot.querySelector("#" + uuid)
                checkbox.onclick = () => {
                    this.page.hideAll()
                    // Get all checkboxs of a facet...
                    let checkboxs = facetList.querySelectorAll("paper-checkbox")

                    for (var i = 0; i < checkboxs.length; i++) {
                        let checkbox = checkboxs[i]
                        if (checkbox.checked) {
                            this.page.showAll(checkbox.className)
                        }
                    }

                    this.page.offset = 0;
                    this.page.navigator.setTotal(this.page.getTotal())
                    this.page.refresh()
                    this.page.refreshNavigatorAndContextSelector()
                }


                checkbox.onchange = () => {
                    if (checkbox.checked) {
                        checkbox_.checked = true
                    }
                }

                // keep reference into the object.
                this.terms[uuid].countDiv = facetList.querySelector("#" + uuid + "_total")
                this.terms[uuid].className = className
            }

            let count = this.page.countElementByClassName(className)
            if (this.terms[uuid]) {
                if (count > 0) {
                    this.terms[uuid].countDiv.innerHTML = "(" + count + ")"
                } else if (this.terms[uuid].parentNode) {
                    // remove it from the dom...
                    this.terms[uuid].parentNode.removeChild(this.terms[uuid])
                }
            }

        })
    }

    playAudios(audios, name) {

        // here I will get the audi
        let audio_playList = "#EXTM3U\n"
        audio_playList += "#PLAYLIST: " + name + "\n\n"

        // Generate the playlist with found audio items.
        let generateAudioPlaylist = () => {
            let audio = audios.pop();
            let globule = audio.globule;

            // keep the info in memory for further use...
            setAudio(audio)

            // set the audio info
            let indexPath = globule.config.DataPath + "/search/audios"

            // get the title file path...
            this.getTitleFiles(audio.getId(), indexPath, globule, files => {
                if (files.length > 0) {
                    audio_playList += `#EXTINF:${audio.getDuration()}, ${audio.getTitle()}, tvg-id="${audio.getId()}"\n`

                    let url = globule.config.Protocol + "://" + globule.domain
                    if (window.location != globule.domain) {
                        if (globule.config.AlternateDomains.indexOf(window.location.host) != -1) {
                            url = globule.config.Protocol + "://" + window.location.host
                        }
                    }

                    if (globule.config.Protocol == "https") {
                        if (globule.config.PortHttps != 443)
                            url += ":" + globule.config.PortHttps
                    } else {
                        if (globule.config.PortHttps != 80)
                            url += ":" + globule.config.PortHttp
                    }

                    let path = files[0].split("/")
                    path.forEach(item => {
                        item = item.trim()
                        if (item.length > 0)
                            url += "/" + encodeURIComponent(item)
                    })

                    url += "?application=" + Model.application
                    if (localStorage.getItem("user_token") != undefined) {
                        url += "&token=" + localStorage.getItem("user_token")
                    }

                    audio_playList += url + "\n\n"
                }
                if (audios.length > 0) {
                    generateAudioPlaylist()
                } else {
                    console.log(audio_playList)
                    playAudio(audio_playList, null, null, null, globule)
                }
            })
        }

        generateAudioPlaylist()
    }

    getAudios(className) {
        let audios = this.page.getAudios(className)
        return audios
    }

}

customElements.define('globular-facet', SearchFacetPanel)


export class SearchResultsPagesNavigator extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        this.page = null;


        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
            #container{
                display: flex;
                padding: 10px;
                flex-wrap: wrap;
            }

            .pagination-btn{
                display: flex;
                justify-content: center;
                align-items: center;
                height: 35px;
                width: 35px;
                margin: 5px;
                
                transition: background 0.2s ease,padding 0.8s linear;
                border: 1px solid var(--palette-text-disabled);
                border-radius: 5px;
            }

            @media (max-width: 600px) {
                #container{
                    padding: 2px;
                }

                .pagination-btn{
                    height: 25px;
                    width: 25px;
                }
            }

            .pagination-btn:hover{
                cursor: pointer;
                -webkit-filter: invert(30%);
            }

            .pagination-btn.active {
                border-color: var(--palette-error-dark);
            }

        </style>
        <div id="container">
            
        </div>
        `
        // give the focus to the input.
        this.container = this.shadowRoot.querySelector("#container")
        this.nb_pages = 0;
    }

    // The connection callback.
    connectedCallback() {
        // When the component is set on the page and ready...

    }

    // Set the page reuslts...
    setSearchResultsPage(page) {
        this.page = page;
    }

    setIndex(index, btn) {
        // so here I will get the new search...
        this.page.offset = index

        Model.eventHub.publish("_display_search_results_", {}, true)
        this.page.refresh()

        let actives = this.shadowRoot.querySelectorAll(".active")
        for (var i = 0; i < actives.length; i++) {
            actives[i].classList.remove("active")
        }

        btn.classList.add("active")
    }

    setTotal(total) {
        if (this.nb_pages == Math.ceil(total / MAX_DISPLAY_RESULTS)) {
            return
        }

        this.container.innerHTML = ""
        this.nb_pages = Math.ceil(total / MAX_DISPLAY_RESULTS)
        if (this.nb_pages > 1) {
            for (var i = 0; i < this.nb_pages; i++) {
                let btn = document.createElement("div")
                btn.innerHTML = i + 1
                btn.classList.add("pagination-btn")
                if (i == this.page.offset) {
                    btn.classList.add("active")
                }
                let index = i
                btn.onclick = () => {
                    this.setIndex(index, btn)
                }
                this.container.appendChild(btn)
            }
        }
    }
}

customElements.define('globular-search-results-pages-navigator', SearchResultsPagesNavigator)


/**
 * Sample empty component
 */
export class SearchResultsPageContextsSelector extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
        this.page = null;
        this.contexts = [];

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
                <style>
                   
                    #container{
                        display: flex;
                        margin: 5px;
                        margin-left: 10px;
                    }

                    #container div{
                        margin-right: 15px;
                        align-items: center;
                    }

                </style>
                <div id="container">
                </div>
                `
        // give the focus to the input.
        this.container = this.shadowRoot.querySelector("#container")
    }

    // The connection callback.
    connectedCallback() {

    }

    // Set the page reuslts...
    setSearchResultsPage(page) {
        this.page = page;
    }

    // Set the context...
    setContexts(contexts) {
        contexts.forEach(context => {
            let html = `
                <div id="${context}_div" style="display: none;">
                    <paper-checkbox checked id="${context}_checkbox"></paper-checkbox>
                    <span >${context}</span>
                    <span id="${context}_total" style="font-size: 1rem;margin-left: 5px;"></span>
                </div>
            `
            let range = document.createRange()
            this.container.appendChild(range.createContextualFragment(html))

            let checkbox = this.container.querySelector(`#${context}_checkbox`);
            checkbox.onclick = () => {
                this.page.setContextState(context, checkbox.checked)
            }
        })
    }

    // Set context total.
    setContextTotal(context, total) {
        this.container.querySelector(`#${context}_div`).style.display = "flex";
        this.container.querySelector(`#${context}_total`).innerHTML = `(${total})`
    }

}

customElements.define('globular-search-results-page-contexts-selector', SearchResultsPageContextsSelector)