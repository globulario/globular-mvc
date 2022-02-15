import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import { searchDocuments } from "globular-web-client/api";
import { Application } from 'globular-web-client/resource/resource_pb';
import { SearchTitlesRequest } from 'globular-web-client/title/title_pb';

import { Model } from '../Model';
import { theme } from "./Theme";
import * as getUuid from 'uuid-by-string'


function searchTitles(query) {

    // This is a simple test...
    let indexPath = Model.globular.config.DataPath + "/search/titles"
    let rqst = new SearchTitlesRequest
    rqst.setIndexpath(indexPath)
    rqst.setQuery(query)

    let stream = Model.globular.titleService.searchTitles(rqst, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
    stream.on("data", (rsp) => {

        if(rsp.hasSummary()){
            Model.eventHub.publish("_display_search_results_", {}, true)
            Model.eventHub.publish("__new_search_event__", {query:query, summary: rsp.getSummary()}, true)

        }else if(rsp.hasFacets()){

        }else if(rsp.hasHit()){
            let hit = rsp.getHit()
            // display the value in the console...
            hit.getSnippetsList().forEach(val =>{
                let uuid = "_" +  getUuid(query)
                Model.eventHub.publish(`${uuid}_search_hit_event__`, {hit:hit}, true)

                // print in the console the find results...
                console.log(val.getField())
                val.getFragmentsList().forEach(f=>{
                    console.log(f)
                })
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
            }


            iron-icon{
                padding-left: 11px;
                padding-right: 11px;
            }

            input:focus{
                outline: none;
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
            }

        </style>
        <div id="search-bar">
            <iron-icon icon="search" style="--iron-icon-fill-color: var(--palette-action-active);" ></iron-icon>
            <input id='search_input' placeholder="Search"></input>
            <paper-icon-button icon="icons:expand-more" style="--iron-icon-fill-color: var(--palette-action-active); margin-right: 2px; height: 36px;" ></paper-icon-button>
        </div>
        `

        // give the focus to the input.
        let searchInput = this.shadowRoot.getElementById("search_input")
        let div = this.shadowRoot.getElementById("search-bar")

        searchInput.onfocus = (evt) => {
            evt.stopPropagation();
            div.style.boxShadow = "var(--dark-mode-shadow)"
        }

        searchInput.onblur = () => {
            div.style.boxShadow = ""
        }

        searchInput.onkeydown = (evt) => {
                if (evt.key == "Enter") {
                    // TODO search with givin context ex titles, blogs etc...
                    searchTitles(searchInput.value)
                    searchInput.value = ""
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
                font-size: 1.4rem;
                flex-grow: 1;
            }

        </style>

        <paper-card id="container">
            <div class="header">
                <paper-tabs id="search-results" selected="0" scrollable>
                </paper-tabs>
                <paper-icon-button id="close-all-btn" icon="icons:close"></paper-icon-button>
            </div>
            <slot></slot>
        </paper-card>
        `

        this.tabs = this.shadowRoot.querySelector("#search-results")

        // So here I will create a new Search Result page if none exist...
        Model.eventHub.subscribe("__new_search_event__", uuid=>{}, 
            evt=>{
                let uuid = "_" +  getUuid(evt.query)
                console.log("---------> ", evt.summary)
                let html = `
                <paper-tab id="${uuid}-tab">
                    <paper-icon-button id="${uuid}-refresh-btn" icon="icons:refresh"></paper-icon-button>
                    <span>${evt.query}</span>
                    <paper-icon-button id="${uuid}-close-btn" icon="icons:close"></paper-icon-button>
                </paper-tab>
                `

                let range = document.createRange()
                this.tabs.appendChild(range.createContextualFragment(html))


                let refreshBtn = this.tabs.querySelector(`#${uuid}-refresh-btn`)
                refreshBtn.onclick = (evt)=>{
                    evt.stopPropagation()
                }

                let closeBtn = this.tabs.querySelector(`#${uuid}-close-btn`)
                closeBtn.onclick = (evt)=>{
                    evt.stopPropagation()
                }

                // Create a new page...
                new SearchResultsPage(uuid)
                
            }, true)
    }

}

customElements.define('globular-search-results', SearchResults)


/**
 * Search Results
 */
 export class SearchResultsPage extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(uuid) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${theme}
        </style>
        `

        Model.eventHub.subscribe(`${uuid}_search_hit_event__`, listner_uuid=>{}, 
        evt=>{
            console.log("=====>", evt.hit)
        },true)

    }

}

customElements.define('globular-search-results-page', SearchResultsPage)