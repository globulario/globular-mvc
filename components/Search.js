import '@polymer/iron-icons/iron-icons.js';
import '@polymer/iron-icons/av-icons'
import '@polymer/paper-icon-button/paper-icon-button.js';

import { Application } from '../Application';
import { CreateVideoRequest, DeleteVideoRequest, GetTitleFilesRequest, SearchTitlesRequest } from 'globular-web-client/title/title_pb';
import { Model } from '../Model';
import { getTheme } from "./Theme";
import * as getUuid from 'uuid-by-string'
import { BlogPostInfo, InformationsManager, searchEpisodes } from './Informations';
import { playVideo } from './Video';
import { ApplicationView } from '../ApplicationView';
import * as getUuidByString from 'uuid-by-string';
import { SearchBlogPostsRequest } from 'globular-web-client/blog/blog_pb';
import { SearchDocumentsRequest } from 'globular-web-client/search/search_pb';
import * as JwtDecode from 'jwt-decode';
import { getCoords, randomUUID } from './utility';


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

    // set the url for the image.
    let url = globule.config.Protocol + "://" + globule.config.Domain
    if (window.location != globule.config.Domain) {
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
    xhr.setRequestHeader("token", localStorage.getItem("user_token"));
    xhr.setRequestHeader("application", Model.application);
    xhr.setRequestHeader("domain", Model.domain);

    // Set responseType to 'arraybuffer', we want raw binary data buffer
    console.log("try to get video cover ", url)
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
}

// That function will be use to asscociate file with imdb information.
export function getImdbInfo(id, callback, errorcallback, globule) {
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

    let url = globule.config.Protocol + "://" + globule.config.Domain
    if (window.location != globule.config.Domain) {
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

    var xmlhttp = new XMLHttpRequest();
    xmlhttp.timeout = 10000
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

    /* TODO see if we protected it...
      query += "?domain=" + Model.domain // application is not know at this time...
      if (localStorage.getItem("user_token") != undefined) {
          query += "&token=" + localStorage.getItem("user_token")
      }
    */
    xmlhttp.open("GET", url, true);
    xmlhttp.setRequestHeader("domain", globule.config.Domain);

    xmlhttp.send();
}

function playTitleListener(player, title, indexPath, globule) {
    if (!title) {
        return
    }

    searchEpisodes(title.getSerie(), indexPath, (episodes) => {
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
                    ${getTheme()}
                </style>
                <div style="display: flex; flex-direction: column;">
                    <div>Play the next episode?</div>
                    <h3 style="font-size: 1.17em; font-weight: bold;">${nextEpisode.getName()}</h3>
                    <div>Season ${nextEpisode.getSeason()} Episode ${nextEpisode.getEpisode()}</div>
                    <img style="width: 400px;" src="${nextEpisode.getPoster().getContenturl()}"></img>
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
                            }, null, globule)
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
function search(query, contexts) {

    // Connections can contain many time the same address....
    let globules = Model.getGlobules()

    globules.forEach(g => {
        // Search recursively...
        let search_ = (contexts) => {
            let context = contexts.pop()
            let indexPath = g.config.DataPath + "/search/" + context
            if (context == "blogPosts") {
                if (contexts.length == 0) {
                    searchBlogPosts(g, query, indexPath, () => {
                        console.log("done!")
                    })
                } else {
                    searchBlogPosts(g, query, indexPath, () => {
                        search_(contexts)
                    })
                }
            } else if (context == "webPages") {
                console.log("search webpages... ", query)
                if (contexts.length == 0) {
                    searchWebpageContent(query, () => {
                        console.log("done!")
                    })
                } else {
                    searchWebpageContent(query, () => {
                        search_(contexts)
                    })
                }
            } else {
                if (contexts.length == 0) {
                    searchTitles(g, query, indexPath, () => {
                        console.log("done!")
                    })
                } else {
                    searchTitles(g, query, indexPath, () => {
                        search_(contexts)
                    })
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
function searchTitles(globule, query, indexPath, callback) {

    // This is a simple test...
    let rqst = new SearchTitlesRequest
    rqst.setIndexpath(indexPath)
    rqst.setQuery(query)
    rqst.setOffset(0)
    rqst.setSize(100)

    let stream = globule.titleService.searchTitles(rqst, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
    stream.on("data", (rsp) => {

        if (rsp.hasSummary()) {
            Model.eventHub.publish("_display_search_results_", {}, true)
            Model.eventHub.publish("__new_search_event__", { query: query, summary: rsp.getSummary() }, true)
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

function searchBlogPosts(globule, query, indexPath, callback) {

    // This is a simple test...
    let rqst = new SearchBlogPostsRequest
    rqst.setIndexpath(indexPath)
    rqst.setQuery(query)
    rqst.setOffset(0)
    rqst.setSize(100)

    let stream = globule.blogService.searchBlogPosts(rqst, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
    stream.on("data", (rsp) => {

        if (rsp.hasSummary()) {
            Model.eventHub.publish("_display_search_results_", {}, true)
            Model.eventHub.publish("__new_search_event__", { query: query, summary: rsp.getSummary() }, true)
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
function searchWebpageContent(query, callback) {

    // Search over web-content.
    let rqst = new SearchDocumentsRequest
    rqst.setPathsList([Model.globular.config.DataPath + "/search/applications/" + Model.application])
    rqst.setLanguage("en")
    rqst.setFieldsList(["Text"])
    rqst.setOffset(0)
    rqst.setPagesize(100)
    rqst.setQuery(query)

    let token = localStorage.getItem("user_token")
    let decoded = JwtDecode(token);
    let address = decoded.address;
    let domain = decoded.domain;
    let startTime = performance.now()

    let stream = Model.getGlobule(address).searchService.searchDocuments(rqst, {
        token: token,
        application: Model.application,
        domain: domain,
        address: address
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
            Model.eventHub.publish("__new_search_event__", { query: query, summary: { getTotal: () => { return results.length }, getTook: () => { return took } } }, true)
            Model.eventHub.publish("display_webpage_search_result_" + query, results, true)
            console.log(results)
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
    }

    // The connection callback.
    connectedCallback() {

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>

            ${getTheme()}

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
                width: 350px;
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

            paper-checkbox {
                margin-left: 16px;
                margin-bottom: 8px;
                margin-top: 8px;
            }

        </style>
        <div id="search-bar">
            <iron-icon icon="search" style="--iron-icon-fill-color: var(--palette-text-accent);" ></iron-icon>
            <input id='search_input' placeholder="Search"></input>
            <paper-icon-button id="change-search-context" icon="icons:expand-more" style="--iron-icon-fill-color: var(--palette-text-accent); margin-right: 2px; height: 36px;" ></paper-icon-button>
            <paper-card id="context-search-selector">
                <paper-checkbox checked name="webPages" id="context-search-selector-webpages">Webpages</paper-checkbox>
                <paper-checkbox checked name="blogPosts" id="context-search-selector-blog-posts">Blog Posts</paper-checkbox>
                <paper-checkbox checked name="titles" id="context-search-selector-movies">Movies</paper-checkbox>
                <paper-checkbox checked name="videos" id="context-search-selector-videos">Videos</paper-checkbox>
            </paper-card>
        </div>
        `

        // give the focus to the input.
        let searchInput = this.shadowRoot.getElementById("search_input")
        let div = this.shadowRoot.getElementById("search-bar")

        let changeSearchContextBtn = this.shadowRoot.getElementById("change-search-context")
        let contextSearchSelector = this.shadowRoot.getElementById("context-search-selector")

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
                    search(searchInput.value, contexts)
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
            ${getTheme()}

            #container{
                width: 100%;
                height: 100%;
                flex-direction: column;
                margin-top: 15px;
                background-color: var(--palette-background-paper);
                color: var(--palette-text-primary);
                margin-top: 10px;
                margin-bottom: 10px;
            }

            .header {
                display: flex;
                width: 100%;
            }

            paper-tabs {
                flex-grow: 1;
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
            let facetFilters = ApplicationView.layout.sideMenu().getElementsByTagName("globular-facet-search-filter")
            for (var i = 0; i < facetFilters.length; i++) {
                let f = facetFilters[i]
                f.parentNode.removeChild(f)
            }
        }

        // So here I will create a new Search Result page if none exist...
        Model.eventHub.subscribe("__new_search_event__", uuid => { },
            evt => {
                this.shadowRoot.querySelector("#container").style.display = "flex"

                let uuid = "_" + getUuid(evt.query)
                let tab = this.tabs.querySelector(`#${uuid}-tab`)

                if (tab == null) {
                    let html = `
                    <paper-tab id="${uuid}-tab">
                        <span>${evt.query} (<span id="${uuid}-total-span">${evt.summary.getTotal()}</span>)</span>
                        <paper-icon-button id="${uuid}-close-btn" icon="icons:close"></paper-icon-button>
                    </paper-tab>
                    `
                    let range = document.createRange()
                    this.tabs.appendChild(range.createContextualFragment(html))
                    tab = this.tabs.querySelector(`#${uuid}-tab`)

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

                        // Hide previous facets...
                        let facetFilters = ApplicationView.layout.sideMenu().getElementsByTagName("globular-facet-search-filter")
                        for (var i = 0; i < facetFilters.length; i++) {
                            let f = facetFilters[i]
                            f.style.display = "none"
                        }

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
                    let totalSpan = tab.querySelector(`#${uuid}-total-span`)
                    let total = parseInt(totalSpan.innerHTML) + evt.summary.getTotal()
                    totalSpan.innerHTML = total
                }

                // Create a new page...
                let resultsPage = this.querySelector(`#${uuid}-results-page`)
                if (resultsPage == null) {
                    resultsPage = new SearchResultsPage(uuid, evt.summary)
                    for (var i = 0; i < this.children.length; i++) {
                        this.children[i].style.display = "none";
                    }
                    this.appendChild(resultsPage)
                    this.shadowRoot.querySelector("#empty-search-msg").style.display = "none";
                    ApplicationView.layout.sideMenu().appendChild(resultsPage.facetFilter)
                } else {
                    resultsPage.updateSummary(evt.summary)
                }

            }, true)
    }

    connectedCallback() {
        let pages = this.querySelectorAll("globular-search-results-page")
        pages.forEach(page => {
            ApplicationView.layout.sideMenu().appendChild(page.facetFilter)
        })
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
        ApplicationView.layout.sideMenu().removeChild(page.facetFilter)

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
    constructor(uuid, summary) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
        this.id = `${uuid}-results-page`

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}

            #container {
                display: flex;
                flex-direction: column;

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

        </style>
        <div class="container">
            <div id="summary">
                <span style="padding: 15px;"> ${summary.getQuery()} <span id="total-span">${summary.getTotal()}</span> results (<span id="took-span">${summary.getTook().toFixed(3)}</span> ms)</span>
                <paper-icon-button id="search-result-icon-view-btn" style="" icon="icons:view-module"></paper-icon-button>
                <paper-icon-button class="disable"  id="search-result-lst-view-btn" icon="icons:view-list"></paper-icon-button>
            </div>
            <div id="webpage-search-results">
            </div>
            <div id="mosaic-view" style="display: block;">
                <slot name="mosaic_blogPosts" style="display: flex; flex-wrap: wrap;"></slot>
                <slot name="mosaic_videos" style="display: flex; flex-wrap: wrap;"></slot>
                <slot name="mosaic_titles" style="display: flex; flex-wrap: wrap;"></slot>
            </div>
            <div id="list-view" style="display: none;">
                <slot name="list_blogPosts" style="display: flex; flex-wrap: wrap;"> </slot>
                <slot name="list_videos" style="display: flex; flex-wrap: wrap;"> </slot>
                <slot name="list_titles" style="display: flex; flex-wrap: wrap;"> </slot>
            </div>

        </div>
        `

        // left or right side filter...
        this.facetFilter = new FacetSearchFilter(this)

        // Get the tow button...
        this.searchReusltLstViewBtn = this.shadowRoot.querySelector("#search-result-lst-view-btn")
        this.searchReusltIconViewBtn = this.shadowRoot.querySelector("#search-result-icon-view-btn")
        this.viewType = "icon"
        this.hits = [] // keep the current list in memory...

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
                this.hits.push(evt.hit)
                Model.eventHub.publish("_display_search_results_", {}, true)

                this.displayListHit(evt.hit, evt.context)
                this.displayMosaicHit(evt.hit, evt.context)
            }, true)

        // Append the webpage  search result...
        Model.eventHub.subscribe("display_webpage_search_result_" + summary.getQuery(), uuid => this.display_webpage_search_result_page = uuid, results => {
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
                        console.log(doc, snippet)

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

                                // set back propertie.
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

    clear() {
        this.hits = []
    }

    // Display a mosaic vue of the result. If the result is a title I will use a flit card
    // if is a video well a video card.
    displayMosaicHit(hit, context) {
        if (hit.hasTitle || hit.hasVideo) {
            if (hit.hasTitle()) {
                let id = "_flip_card_" + getUuidByString(hit.getTitle().getName())
                let flipCard = this.querySelector("#" + id)
                if (!flipCard) {
                    flipCard = new SearchFlipCard();
                    flipCard.id = id
                    flipCard.slot = "mosaic_" + context
                    flipCard.setTitle(hit.getTitle(), hit.globule)
                    this.appendChild(flipCard)
                }
                return flipCard
            } else if (hit.hasVideo()) {
                let id = "_video_card_" + getUuidByString(hit.getVideo().getId())
                let videoCard = this.querySelector("#" + id)
                if (!videoCard) {
                    videoCard = new SearchVideoCard();
                    videoCard.id = id
                    videoCard.slot = "mosaic_" + context
                    videoCard.setVideo(hit.getVideo(), hit.globule)
                    this.appendChild(videoCard)
                }
                return videoCard
            }
        } else {
            let blogPost = hit.getBlog()
            let id = "_" + blogPost.getUuid() + "_info"
            let blogPostInfo = this.querySelector("#" + id);
            if (!blogPostInfo) {
                blogPostInfo = new BlogPostInfo(blogPost, true);
                blogPostInfo.classList.add("filterable")
                blogPost.getKeywordsList().forEach(kw => blogPostInfo.classList.add(getUuidByString(kw.toLowerCase())))
                blogPostInfo.id = id
                blogPostInfo.slot = "mosaic_" + context
                this.appendChild(blogPostInfo)
            }
            return blogPostInfo
        }

    }

    updateSummary(summary) {
        let totalSpan = this.shadowRoot.querySelector("#total-span")
        let total = parseInt(totalSpan.innerText) + summary.getTotal()
        totalSpan.innerText = total + ""

        let tookSpan = this.shadowRoot.querySelector("#took-span")
        let took = parseFloat(tookSpan.innerText)
        took += summary.getTook()
        tookSpan.innerText = took.toFixed(3) + ""
    }

    displayListHit(hit, context) {

        let titleName = ""
        let uuid = ""
        if (hit.hasTitle) {
            if (hit.hasTitle()) {
                titleName = hit.getTitle().getName()
                uuid = getUuidByString(hit.getIndex() + "_title")
            } else {
                uuid = getUuidByString(hit.getIndex() + "_video")
            }
        } else {
            uuid = getUuidByString(hit.getIndex() + "_blog")
        }

        // insert one time...
        if (this.querySelector(`#hit-div-${uuid}`)) {
            return
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
        this.appendChild(range.createContextualFragment(html))

        let snippetDiv = this.children[this.children.length - 1].children[1]

        let titleInfoDiv = this.children[this.children.length - 1].children[2]

        let infoDisplay = new InformationsManager()

        let hitDiv = this.querySelector(`#hit-div-${uuid}`)

        if (hit.hasTitle || hit.hasVideo) {
            if (hit.hasTitle()) {
                infoDisplay.setTitlesInformation([hit.getTitle()], hit.globule)
                hitDiv.classList.add("filterable")
                let title = hit.getTitle()
                title.getGenresList().forEach(g => hitDiv.classList.add(getUuidByString(g.toLowerCase())))
                hitDiv.classList.add(getUuidByString(title.getType().toLowerCase()))

                // now the term..
                if (title.getRating() < 3.5) {
                    hitDiv.classList.add(getUuidByString("low"))
                } else if (title.getRating() < 7.0) {
                    hitDiv.classList.add(getUuidByString("medium"))
                } else {
                    hitDiv.classList.add(getUuidByString("high"))
                }

            } else if (hit.hasVideo()) {
                infoDisplay.setVideosInformation([hit.getVideo()])
                hitDiv.classList.add("filterable")
                let video = hit.getVideo()
                video.getGenresList().forEach(g => hitDiv.classList.add(getUuidByString(g.toLowerCase())))
                video.getTagsList().forEach(tag => hitDiv.classList.add(getUuidByString(tag.toLowerCase())))

                // now the term..
                if (video.getRating() < 3.5) {
                    hitDiv.classList.add(getUuidByString("low"))
                } else if (video.getRating() < 7.0) {
                    hitDiv.classList.add(getUuidByString("medium"))
                } else {
                    hitDiv.classList.add(getUuidByString("high"))
                }
            }

            infoDisplay.hideHeader()
        } else {
            let blogPost = hit.getBlog()
            hitDiv.classList.add("filterable")
            infoDisplay.setBlogPostInformation(blogPost)
            blogPost.getKeywordsList().forEach(kw => hitDiv.classList.add(getUuidByString(kw.toLowerCase())))
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
    }
}

customElements.define('globular-search-results-page', SearchResultsPage)

/**
 * Search Box
 */
export class SearchVideoCard extends HTMLElement {
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

            .video-card{
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

            .video-card:hover{
                box-shadow: rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px;
            }

            .video-card img{
                max-width: 320px;
                min-width: 320px;
                max-height: 180px;
                border-top-left-radius: 3.5px;
                border-top-right-radius: 3.5px;
            }

            .video-card img:hover{
                cursor: pointer;
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
            
        </style>
        <div class="video-card">
            <img id="thumbnail-image"></img>
            <img id="preview-image" style="display: none;"></img>
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

        // test create offer...
    }


    showVideoInfo(video) {
        //let uuid = randomUUID()
        let html = `
        <style>
            ${getTheme()}
            paper-card {
                background-color: var(--palette-background-paper);
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
            videoInfoBox.parentNode.style.top = "50%"
            videoInfoBox.parentNode.style.left = "50%"
            videoInfoBox.parentNode.style.transform = "translate(-50%, -50%)"
        }
        videoInfoBox.setVideosInformation([video])
    }

    setVideo(video, globule) {

        if (!globule) {
            globule = Application.globular
        }

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
        thumbnail.src = video.getPoster().getContenturl()

        // Here the image was not set properly...
        this.shadowRoot.querySelector("#video-info-button").onclick = () => {
            this.showVideoInfo(video)
        }

        card.onmouseover = () => {
            preview.style.display = "block"
            thumbnail.style.display = "none"
        }

        card.onmouseleave = () => {
            preview.style.display = "none"
            thumbnail.style.display = "block"
        }

        // Here I will get the file asscociated with the video...
        this.shadowRoot.querySelector("#description").innerHTML = video.getDescription()
        this.shadowRoot.querySelector("#rating-span").innerHTML = video.getRating().toFixed(1)

        // paly only the first file...
        let rqst = new GetTitleFilesRequest
        rqst.setTitleid(video.getId())
        let indexPath = globule.config.DataPath + "/search/videos"
        rqst.setIndexpath(indexPath)

        globule.titleService.getTitleFiles(rqst, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
            .then(rsp => {
                if (rsp.getFilepathsList().length > 0) {
                    let path = rsp.getFilepathsList().pop()

                    let thumbnailPath = path
                    if (thumbnailPath.lastIndexOf(".mp4") != -1 || thumbnailPath.lastIndexOf(".MP4") != -1) {
                        thumbnailPath = thumbnailPath.substring(0, thumbnailPath.lastIndexOf("."))
                    }
                    thumbnailPath = thumbnailPath.substring(0, thumbnailPath.lastIndexOf("/") + 1) + ".hidden" + thumbnailPath.substring(thumbnailPath.lastIndexOf("/")) + "/preview.gif"

                    let url = globule.config.Protocol + "://" + globule.config.Domain
                    if (window.location != globule.config.Domain) {
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

                    if (!thumbnail.src.startsWith("data:image")) {
                        getCoverDataUrl(dataUrl => {
                            thumbnail.src = dataUrl
                            video.getPoster().setContenturl(thumbnail.src)
                            let rqst = new CreateVideoRequest
                            let indexPath = globule.config.DataPath + "/search/videos"
                            rqst.setIndexpath(indexPath)
                            rqst.setVideo(video)
                            globule.titleService.createVideo(rqst).then(
                                () => {
                                    console.log("video was saved!", video)
                                }
                            )
                        }, video.getId(), video.getUrl(), path)

                    }

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
            ${getTheme()}
            @media only screen and (min-width: 1800px){
                globular-search-results {
                    grid-row-start: 1;
                    grid-column-start: 1;
                    grid-column-end: 18;
                }
            }

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

    setTitle(title, globule) {

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
        this.shadowRoot.querySelector(`#search-title`).setTitle(title, globule)
        if (title.getType() == "TVEpisode") {
            // So here I will get the series info If I can found it...
            let seriesInfos = this.shadowRoot.querySelector(`#hit-div-mosaic-episode-name`)
            if (title.getSerie().length > 0) {
                let serieName = this.shadowRoot.querySelector(`#hit-div-mosaic-series-name`)
                getImdbInfo(title.getSerie(), serie => {
                    let url = serie.Poster.ContentURL
                    toDataURL(url, (dataUrl) => {
                        this.shadowRoot.querySelector(`#hit-div-mosaic-front`).style.backgroundImage = `url(${dataUrl})`
                        serieName.innerHTML = serie.Name
                    })
                }, err => ApplicationView.displayMessage(err, 3000), globule)
            }
            seriesInfos.innerHTML = title.getName() + " S" + title.getSeason() + "E" + title.getEpisode()
        } else {
            let url = title.getPoster().getContenturl()
            toDataURL(url, (dataUrl) => {
                this.shadowRoot.querySelector(`#hit-div-mosaic-front`).style.backgroundImage = `url(${dataUrl})`
            })
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

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}
           
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
                background-color: black;
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
                heigth: 24px;
                margin-left: 5px;
            }

        </style>

        
        <div class="search-title-detail">
            <div class="video-div">
                <div class="title-title-div"></div>
                <img class="preview" id="title-preview"></img>
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
                    <select id="episode-select" style="max-width: 82px;"></select>
                    <span style="flex-grow: 1;"></span>
                    <paper-icon-button id="play-episode-video-button" icon="av:play-circle-filled"></paper-icon-button>
                    <paper-icon-button id="episode-info-button" icon="icons:arrow-drop-down-circle"></paper-icon-button>
                </div>
                <img class="preview" id="epsiode-preview"></img>
            </div>
        </div>
        `

        // test create offer...
        this.titlePreview = this.shadowRoot.querySelector("#title-preview")
        this.episodePreview = this.shadowRoot.querySelector("#epsiode-preview")
    }


    setTitle(title, globule) {
        if (!globule) {
            globule = Model.globular
        }

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
                            let url = globule.config.Protocol + "://" + globule.config.Domain
                            if (window.location != globule.config.Domain != -1) {
                                if (globule.config.AlternateDomains.indexOf(window.location.host)) {
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
                            thumbnailPath = thumbnailPath.substring(0, thumbnailPath.lastIndexOf("/") + 1) + ".hidden" + thumbnailPath.substring(thumbnailPath.lastIndexOf("/")) + "/preview.gif"

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
                                }, null, globule)
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

        this.shadowRoot.querySelector("globular-informations-manager").setTitlesInformation([title])
        this.title_ = title;

        if (this.title_.getType() == "TVSeries") {
            this.shadowRoot.querySelector("#title-preview").style.display = "none"
            this.shadowRoot.querySelector("#play-video-button").style.display = "none"
        } else {
            this.shadowRoot.querySelector("#loading-episodes-infos").style.display = "none"
        }

        this.shadowRoot.querySelector("#title-info-button").onclick = () => {
            this.showTitleInfo(title)
        }

        let url = globule.config.Protocol + "://" + globule.config.Domain
        if (window.location != globule.config.Domain) {
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
                    thumbnailPath = thumbnailPath.substring(0, thumbnailPath.lastIndexOf("/") + 1) + ".hidden" + thumbnailPath.substring(thumbnailPath.lastIndexOf("/")) + "/preview.gif"

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
                        }, null, null, globule)
                    }
                }
            }).catch(err => {
                console.log(err, globule)
            })

    }

    showTitleInfo(title) {
        //let uuid = randomUUID()
        let html = `
        <style>
            ${getTheme()}
            paper-card {
                background-color: var(--palette-background-paper);
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
            titleInfoBox.parentNode.style.top = "50%"
            titleInfoBox.parentNode.style.left = "50%"
            titleInfoBox.parentNode.style.transform = "translate(-50%, -50%)"
        }
        titleInfoBox.setTitlesInformation([title])
    }

    setVideo(video) {

    }

}

customElements.define('globular-search-title-detail', SearchTitleDetail)

export class FacetSearchFilter extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(page) {
        super()

        this.page = page

        // hide existing facet filters...
        let facetFilters = ApplicationView.layout.sideMenu().getElementsByTagName("globular-facet-search-filter")
        for (var i = 0; i < facetFilters.length; i++) {
            let f = facetFilters[i]
            f.style.display = "none"
        }

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });


        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}

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

    // Set the facets...
    setFacets(facets) {
        facets.getFacetsList().forEach(facet => {
            let p = this.querySelector("#_" + getUuidByString(facet.getField()))
            if (!p) {
                p = new SearchFacetPanel(this.page)

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
        this.total = 0
        this.page = page

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}

            .facet-list{
                padding-bottom: 20px;
                font-size: 1rem;
            }

            span{
                font-style: italic;
                font-size: 1rem;
                margin-left: 10px;
            }

        </style>

        <div style="display: flex; flex-direction: column;">
            <div class="facet-label">
                <paper-checkbox checked> <span id='field_span'></span> <span id='total_span'></span></paper-checkbox checked>
            </div>
            <div class="facet-list">

            </div>
        </div>
        `

        // test create offer...
        let facetList = this.shadowRoot.querySelector(".facet-list")
        let checkbox_ = this.shadowRoot.querySelector("paper-checkbox")

        checkbox_.onclick = () => {
            let filterables = page.querySelectorAll(".filterable")
            filterables.forEach(f => f.style.display = "none") // hide all

            if (checkbox_.checked) {
                filterables.forEach(f => f.style.display = "block") // hide all
            }

            let checkboxs = facetList.querySelectorAll("paper-checkbox")
            for (var i = 0; i < checkboxs.length; i++) {
                let checkbox = checkboxs[i]
                if (!checkbox_.checked) {
                    if (checkbox.checked) {
                        checkbox.checked = false
                        checkbox.onclick()

                    }
                } else {
                    if (!checkbox.checked) {
                        checkbox.checked = true
                        //checkbox.onclick() // do not set it...
                    }
                }
            }
        }

    }

    setFacet(facet) {
        this.id = "_" + getUuidByString(facet.getField())
        this.total += facet.getTotal()

        this.shadowRoot.querySelector("#total_span").innerHTML = "(" + this.total + ")"
        this.shadowRoot.querySelector("#field_span").innerHTML = facet.getField()

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

            let count = this.page.getElementsByClassName(getUuidByString(className)).length / 2 // list-view and mosaic-view will be count
            if (count > 0) {
                let uuid = "_" + getUuidByString(className)
                if (!facetList.querySelector("#" + uuid)) {
                    let html = `
                    <div style="margin-left: 25px;">
                        <paper-checkbox class=${className} id=${uuid} checked> <div  class="facet-label"> ${term + "<span id='" + uuid + "_total'>(" + count + ")</span>"} </div></paper-checkbox> 
                    <div>
                `
                    // The facet list.
                    facetList.appendChild(range.createContextualFragment(html))
                } else {
                    let countDiv = facetList.querySelector("#" + uuid + "_total")
                    countDiv.innerHTML = "(" + count + ")"
                }

                let filterables = this.page.querySelectorAll(".filterable")

                let checkbox = this.shadowRoot.querySelector("#" + uuid)
                checkbox.onclick = () => {
                    filterables.forEach(f => f.style.display = "none") // hide all
                    let checkboxs = facetList.querySelectorAll("paper-checkbox")

                    for (var i = 0; i < checkboxs.length; i++) {
                        let checkbox = checkboxs[i]
                        if (checkbox.checked) {
                            filterables.forEach(f => {
                                if (f.classList.contains(getUuidByString(checkbox.className))) {
                                    f.style.display = ""
                                }
                            })
                        }
                    }
                }

                checkbox.onchange = () => {
                    if (checkbox.checked) {
                        checkbox_.checked = true
                    }
                }
            }

        })
    }

}

customElements.define('globular-facet', SearchFacetPanel)