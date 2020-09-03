"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchBar = void 0;
require("@polymer/iron-icons/iron-icons.js");
require("@polymer/paper-icon-button/paper-icon-button.js");
const api_1 = require("globular-web-client/lib/api");
const Model_1 = require("../Model");
const Layout_1 = require("./Layout");
/**
 * Search Box
 */
class SearchBar extends HTMLElement {
    // attributes.
    // Create the applicaiton view.
    constructor() {
        super();
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
    }
    // The connection callback.
    connectedCallback() {
        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>

            ${Layout_1.theme}

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
        `;
        // give the focus to the input.
        let searchInput = this.shadowRoot.getElementById("search_input");
        let div = this.shadowRoot.getElementById("search-bar");
        searchInput.onfocus = (evt) => {
            evt.stopPropagation();
            div.style.boxShadow = "var(--dark-mode-shadow)";
        };
        searchInput.onblur = () => {
            div.style.boxShadow = "";
        };
        searchInput.onkeydown = (evt) => {
            if (evt.keyCode == 13) {
                let paths = ["/tmp/dir_db"];
                let fields = [];
                let offset = 0;
                let pageSize = 10;
                let snippetLenght = 50;
                let language = "english";
                this.search(searchInput.value, paths, fields, language, offset, pageSize, snippetLenght);
            }
        };
    }
    // Call search event.
    search(query, paths, fields, language, offset, pageSize, snippetLenght) {
        api_1.searchDocuments(Model_1.Model.globular, paths, query, language, fields, offset, pageSize, snippetLenght, (results) => {
            for (const v of results) {
                console.log(v._snippetsList);
            }
        }, (err) => {
            console.log("---> err ", err);
        });
    }
}
exports.SearchBar = SearchBar;
customElements.define('globular-search-bar', SearchBar);
