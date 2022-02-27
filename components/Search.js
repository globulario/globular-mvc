import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import { searchDocuments } from "globular-web-client/api";
import { Application } from 'globular-web-client/resource/resource_pb';
import { SearchTitlesRequest } from 'globular-web-client/title/title_pb';

import { Model } from '../Model';
import { theme } from "./Theme";
import * as getUuid from 'uuid-by-string'
import { InformationsManager } from './Informations';


function searchTitles(query, indexPath) {

    // This is a simple test...
    let rqst = new SearchTitlesRequest
    rqst.setIndexpath(indexPath)
    rqst.setQuery(query)
    rqst.setOffset(0)
    rqst.setSize(100)

    let stream = Model.globular.titleService.searchTitles(rqst, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
    stream.on("data", (rsp) => {

        if (rsp.hasSummary()) {
            Model.eventHub.publish("_display_search_results_", {}, true)
            Model.eventHub.publish("__new_search_event__", { query: query, summary: rsp.getSummary() }, true)

        } else if (rsp.hasFacets()) {
            let uuid = "_" + getUuid(query)
            Model.eventHub.publish(`${uuid}_search_facets_event__`, { facets: rsp.getFacets() }, true)
        } else if (rsp.hasHit()) {
            let hit = rsp.getHit()
            // display the value in the console...
            hit.getSnippetsList().forEach(val => {
                let uuid = "_" + getUuid(query)
                Model.eventHub.publish(`${uuid}_search_hit_event__`, { hit: hit }, true)
            })
        }
    });

    stream.on("status", (status) => {
        if (status.code != 0) {
            // In case of error I will return an empty array
            console.log(status.details)
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
        this.searchContext = "titles"
    }

    // The connection callback.
    connectedCallback() {

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>

            ${theme}

            input {
                width: 100%;
                border: none;
                margin-right: 11px;
                color: var(--cr-primary-text-color);
                background-color: var(--palette-background-paper);
                box-sizing: border-box;
                font-size: 1.2rem;
            }


            iron-icon{
                padding-left: 11px;
                padding-right: 11px;
                height: 36px;
                width: 36px;
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
                position: relative;
                transition: none;
                color: var(--cr-primary-text-color);
                background-color: var(--palette-background-paper);
                border: 1px solid var(--palette-action-disabled);
                position: relative;
            }

        </style>
        <div id="search-bar">
            <iron-icon icon="search" style="--iron-icon-fill-color: var(--palette-action-active);" ></iron-icon>
            <input id='search_input' placeholder="Search Movies"></input>
            <paper-icon-button id="change-search-context" icon="icons:expand-more" style="--iron-icon-fill-color: var(--palette-action-active); margin-right: 2px; height: 36px;" ></paper-icon-button>
            <paper-card id="context-search-selector">
                <paper-button id="context-search-selector-movies">Movies</paper-button>
                <paper-button id="context-search-selector-videos" style="color: var(--palette-text-disabled)">Videos</paper-button>
                <paper-button id="context-search-selector-close">Close</paper-button>
            </paper-card>
        </div>
        `

        // give the focus to the input.
        let searchInput = this.shadowRoot.getElementById("search_input")
        let div = this.shadowRoot.getElementById("search-bar")

        let changeSearchContextBtn = this.shadowRoot.getElementById("change-search-context")
        let contextSearchSelector = this.shadowRoot.getElementById("context-search-selector")
        let contextSearchSelectorMovies = this.shadowRoot.getElementById("context-search-selector-movies")
        let contextSearchSelectorVideos = this.shadowRoot.getElementById("context-search-selector-videos")

        searchInput.onblur = () => {
            div.style.boxShadow = ""
        }

        searchInput.onkeydown = (evt) => {
            if (evt.key == "Enter") {
                // TODO search with givin context ex titles, blogs etc...
                let indexPath = Model.globular.config.DataPath + "/search/" + this.searchContext

                searchTitles(searchInput.value, indexPath)
                searchInput.value = ""
            }

        }


        searchInput.onfocus = (evt) => {
            evt.stopPropagation();
            div.style.boxShadow = "var(--dark-mode-shadow)"
            contextSearchSelector.style.display = "none"
            Model.eventHub.publish("_display_search_results_", {}, true)
        }

        // Change the search context, this will search over other indexations...
        changeSearchContextBtn.onclick = () => {
            if (contextSearchSelector.style.display != "flex") {
                contextSearchSelector.style.display = "flex"
            } else {
                contextSearchSelector.style.display = "none"
            }
        }

        this.shadowRoot.getElementById("context-search-selector-close").onclick = () => {
            contextSearchSelector.style.display = "none"
        }

        contextSearchSelectorMovies.onclick = () => {
            contextSearchSelectorVideos.style.color = "var(--palette-text-disabled)"
            contextSearchSelectorMovies.style.color = ""
            this.searchContext = "titles"
            searchInput.placeholder = "Search Movies"
        }

        contextSearchSelectorVideos.onclick = () => {
            contextSearchSelectorVideos.style.color = ""
            contextSearchSelectorMovies.style.color = "var(--palette-text-disabled)"
            this.searchContext = "videos"
            searchInput.placeholder = "Search Videos"
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

        // this will contain the list of search pages.
        this.pages = {}

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${theme}

            #container{
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                margin-top: 15px;
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
            <slot></slot>
        </paper-card>
        `

        this.tabs = this.shadowRoot.querySelector("#search-results")

        this.closeAllBtn = this.shadowRoot.querySelector("#close-all-btn")
        this.closeAllBtn.onclick = () => {
            Model.eventHub.publish("_hide_search_results_", {}, true)
        }

        // So here I will create a new Search Result page if none exist...
        Model.eventHub.subscribe("__new_search_event__", uuid => { },
            evt => {
                let uuid = "_" + getUuid(evt.query)
                let tab = this.tabs.querySelector(`#${uuid}-tab`)

                if (tab == null) {
                    let html = `
                    <paper-tab id="${uuid}-tab">
                        <paper-icon-button id="${uuid}-refresh-btn" icon="icons:refresh"></paper-icon-button>
                        <span >${evt.query} (${evt.summary.getTotal()})</span>
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
                    }


                    let refreshBtn = this.tabs.querySelector(`#${uuid}-refresh-btn`)
                    refreshBtn.onclick = (evt_) => {
                        evt_.stopPropagation()
                        searchTitles(evt.query)
                    }

                    let closeBtn = this.tabs.querySelector(`#${uuid}-close-btn`)
                    closeBtn.onclick = (evt_) => {
                        evt_.stopPropagation()
                        this.deletePageResults(uuid)
                    }
                    this.tabs.selected = this.children.length;

                } else {
                    tab.click()
                }

                // Create a new page...
                let resultsPage = this.querySelector(`#${uuid}-results-page`)
                if (resultsPage == null) {
                    resultsPage = new SearchResultsPage(uuid, evt.summary)
                    for (var i = 0; i < this.children.length; i++) {
                        this.children[i].style.display = "none";
                    }
                    this.appendChild(resultsPage)
                } else {
                    resultsPage.innerHTML = ""
                }

            }, true)
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
            ${theme}

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

        </style>
        <div class="container">
            <div id="summary">
                <span style="padding: 15px;"> ${summary.getQuery()} ${summary.getTotal()} results (${summary.getTook()}ms)</span>
                <paper-icon-button id="search-result-icon-view-btn" style="" icon="icons:view-module"></paper-icon-button>
                <paper-icon-button class="disable"  id="search-result-lst-view-btn" icon="icons:view-list"></paper-icon-button>
            </div>
            <slot> </slot>
            <slot name="mosaic" style="display: flex; flex-wrap: wrap;">

            </slot>
        </div>
        `

        // Get the tow button...
        this.searchReusltLstViewBtn = this.shadowRoot.querySelector("#search-result-lst-view-btn")
        this.searchReusltIconViewBtn = this.shadowRoot.querySelector("#search-result-icon-view-btn")
        this.viewType = "icon"
        this.hits = [] // keep the current list in memory...

        this.searchReusltLstViewBtn.onclick = () => {
            this.searchReusltLstViewBtn.classList.remove("disable")
            this.searchReusltIconViewBtn.classList.add("disable")
            this.viewType = "lst"
            this.classList.remove("mosaic")
            this.refresh()
        }

        this.searchReusltIconViewBtn.onclick = () => {
            this.searchReusltLstViewBtn.classList.add("disable")
            this.searchReusltIconViewBtn.classList.remove("disable")
            this.viewType = "mosaic"
            this.refresh()
        }

        // Display facets
        Model.eventHub.subscribe(`${uuid}_search_facets_event__`, listner_uuid => { },
            evt => {
                console.log(evt.facets)

            }, true)

        // Append it to the results.
        Model.eventHub.subscribe(`${uuid}_search_hit_event__`, listner_uuid => { },
            evt => {
                this.hits.push(evt.hit)

                if (this.viewType == "lst") {
                    this.displayListHit(evt.hit)
                } else {
                    this.displayMosaicHit(evt.hit)
                }

            }, true)
    }

    // Refresh the view....
    refresh() {
        this.innerHTML = ""
        this.hits.forEach(hit => {
            if (this.viewType == "lst") {
                this.displayListHit(hit)
            } else {
                this.displayMosaicHit(hit)
            }
        })
    }

    clear() {
        this.hits = []
    }

    displayMosaicHit(hit) {
        if (this.querySelector(`#hit-div-mosaic-${hit.getIndex()}`) != null) {
            return;
        }

        let posterUrl = ""
        if (hit.hasTitle()) {
            if (hit.getTitle().getPoster() != undefined) {
                // must be getContentUrl here... 
                if(hit.getTitle().getPoster().getContenturl().length > 0 ){
                    posterUrl = hit.getTitle().getPoster().getContenturl()
                }else{
                    posterUrl = hit.getTitle().getPoster().getUrl()
                }
            }
        } else {
            if (hit.getVideo().getPoster() != undefined) {
                // must be getContentUrl here... 
                if(hit.getVideo().getPoster().getContenturl().length > 0 ){
                    posterUrl = hit.getVideo().getPoster().getContenturl()
                }else{
                    posterUrl = hit.getVideo().getPoster().getUrl()
                }
               
            }
        }

        let html = `
        <style>
        @media only screen and (min-width: 1800px){
            globular-search-results {
                grid-row-start: 1;
                grid-column-start: 1;
                grid-column-end: 18;
            }
         }
        </style>
        <paper-card slot="mosaic" id="hit-div-mosaic-${hit.getIndex()}">
            <img src="${posterUrl}"></img>
        </paper-card>
        `

        let range = document.createRange()
        this.appendChild(range.createContextualFragment(html))

    }

    displayListHit(hit) {
        if (this.querySelector(`#hit-div-${hit.getIndex()}`) != null) {
            return;
        }

        let titleName = ""

        if (hit.hasTitle()) {
            titleName = hit.getTitle().getName()
        }

        let html = `
        <style>
        @media only screen and (min-width: 1800px){
            globular-search-results {
                grid-row-start: 1;
                grid-column-start: 4;
                grid-column-end: 14;
            }
         }
        </style>
            <div id="hit-div-${hit.getIndex()}" class="hit-div">
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
        if (hit.hasTitle()) {
            infoDisplay.setTitlesInformation([hit.getTitle()])
        } else {
            infoDisplay.setVideosInformation([hit.getVideo()])
        }

        infoDisplay.hideHeader()
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