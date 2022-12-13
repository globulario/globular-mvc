import "@polymer/iron-icons/social-icons";
import * as getUuidByString from "uuid-by-string";
import { Account } from "../Account";
import { ApplicationView } from "../ApplicationView";
import { Model } from "../Model";
import { Menu } from './Menu';
import { getTheme } from "./Theme";

/**
 * Login/Register functionality.
 */
export class ShareMenu extends Menu {

    // Create the application view.
    constructor() {
        super("share", "social:share", "Share")

        // The panel to manage shared content.
        this.sharePanel = null;

        this.onclick = () => {
            let icon = this.getIconDiv().querySelector("iron-icon")
            icon.style.removeProperty("--iron-icon-fill-color")
            if (this.sharePanel.parentNode == undefined) {
                Model.eventHub.publish("_display_share_panel_event_", this.sharePanel, true)
            }

        }

    }

    // Initialyse the share panel.
    init(account) {

        if (this.sharePanel == null) {
            this.account = account;
            // init once...
            this.sharePanel = new SharePanel(account);
        }
    }
}

customElements.define('globular-share-menu', ShareMenu)

/**
 * Sample empty component
 */
export class SharePanel extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(account) {
        super()

        // keep local account in memory...
        this.account = account;

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
                width: 95%;
                margin-left: 2.5%;
            }

            #share_div{
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

            #subjects-div{
                display: flex;
                flex-direction: column;
                padding: 10px;
            }

            .vertical-tabs {
                display: flex;
                flex-direction: column;
            }

            .vertical-tab {
                display: flex;
                flex-direction: column;
                position: relative;
            }

            .vertical-tab span{
                position: relative;
                width: 100%;
            }

            .subject-div{
                padding-left: 10px;
                width: 100%;
                display: flex;
                flex-direction: column;
                padding-bottom: 10px;
                margin-bottom: 10px;
                border-bottom: 1px solid var(--palette-divider);
            }

            .infos {
                margin: 2px;
                padding: 4px;
                display: flex;
                border-radius: 4px;
                align-items: center;
                transition: background 0.2s ease,padding 0.8s linear;
                background-color: var(--palette-background-paper);
                color: var(--palette-text-primary);
            }

            .infos img{
                max-height: 64px;
                max-width: 64px;
                border-radius: 32px;
            }

            .infos span{
                font-size: 1rem;
                margin-left: 10px;
            }

            .infos:hover{
                -webkit-filter: invert(10%);
                filter: invert(10%);
                cursor: pointer;
            }

            .selector:hover {
                cursor: pointer;
            }

            .selector {
                text-decoration: underline;
                padding: 2px;
            } 

            .counter{
                font-size: 1rem;
            }

        </style>
        <paper-card id="container">
            <div style="display: flex; justify-content: center;">
                <h1 style="flex-grow: 1;">Shared Resources...</h1>
                <paper-icon-button id="close-btn" icon="icons:close"></paper-icon-button>
            </div>
            <div id="share_div">
                <div id="subjects-div">
                    <div class="vertical-tabs">
                        <div class="vertical-tab" id="accounts-tab">
                            <span class="selector" id="accounts-selector">
                                Account's <span class="counter" id="accounts-counter"></span>
                                <paper-ripple recenters=""></paper-ripple>
                            </span>
                           
                            <iron-collapse  id="accounts-collapse-panel" style="display: flex; flex-direction: column; width: 100%;">
                                <div class="subject-div" id="accounts-div">
                                </div>
                            </iron-collapse>
                        </div>
                        <div class="vertical-tab" id="groups-tab">
                            <span class="selector" id="groups-selector">
                                Group's
                                <paper-ripple recenters=""></paper-ripple>
                            </span>
                           
                            <iron-collapse id="groups-collapse-panel" style="display: flex; flex-direction: column; width: 100%;">
                                <div class="subject-div" id="groups-div">
                                </div>
                            </iron-collapse>
                        </div>
                        <div class="vertical-tab" id="organizations-tab">
                            <span class="selector" id="organizations-selector">
                                Organization's
                                <paper-ripple  recenters=""></paper-ripple>
                            </span>
                           
                            <iron-collapse id="organizations-collapse-panel" style="display: flex; flex-direction: column; width: 100%;">
                                <div class="subject-div" id="organizations-div">
                                </div>
                            </iron-collapse>
                        </div>
                        <div class="vertical-tab" id="applications-tab">
                            <span class="selector" id="appliacations-selector">
                                Application's
                                <paper-ripple  recenters=""></paper-ripple>
                            </span>
                            <iron-collapse id="applications-collapse-panel" style="display: flex; flex-direction: column; width: 100%;">
                                <div class="subject-div" id="applications-div">
                                </div>
                            </iron-collapse>
                        </div>
                    </div>
                </div>

            </div>
        </paper-card>
        `
        // Vertical tabs... (accordeon...)
        let accountsTab = this.shadowRoot.querySelector("#accounts-tab").querySelector("#accounts-selector")
        let accountsCount = this.shadowRoot.querySelector("#accounts-tab").querySelector("#accounts-counter")

        let groupsTab = this.shadowRoot.querySelector("#groups-tab").querySelector("span")
        let organizationsTab = this.shadowRoot.querySelector("#organizations-tab").querySelector("span")
        let applicationsTab = this.shadowRoot.querySelector("#applications-tab").querySelector("span")

        // Where the info will be set...
        let applicationsDiv = this.shadowRoot.querySelector("#applications-div")
        let organizationsDiv = this.shadowRoot.querySelector("#organizations-div")
        let groupsDiv = this.shadowRoot.querySelector("#groups-div")
        let accountsDiv = this.shadowRoot.querySelector("#accounts-div")

        // Get collapse panel...
        let accounts_collapse_panel = this.shadowRoot.querySelector("#accounts-collapse-panel")
        let groups_collapse_panel = this.shadowRoot.querySelector("#groups-collapse-panel")
        let organizations_collapse_panel = this.shadowRoot.querySelector("#organizations-collapse-panel")
        let applications_collapse_panel = this.shadowRoot.querySelector("#applications-collapse-panel")

        accountsTab.onclick = () => {
            accounts_collapse_panel.toggle();
            if (organizations_collapse_panel.opened) {
                organizations_collapse_panel.toggle()
            }
            if (applications_collapse_panel.opened) {
                applications_collapse_panel.toggle()
            }
            if (groups_collapse_panel.opened) {
                groups_collapse_panel.toggle()
            }
        }

        groupsTab.onclick = () => {
            groups_collapse_panel.toggle();
            if (organizations_collapse_panel.opened) {
                organizations_collapse_panel.toggle()
            }
            if (applications_collapse_panel.opened) {
                applications_collapse_panel.toggle()
            }
            if (accounts_collapse_panel.opened) {
                accounts_collapse_panel.toggle()
            }
        }

        applicationsTab.onclick = () => {
            applications_collapse_panel.toggle();
            if (organizations_collapse_panel.opened) {
                organizations_collapse_panel.toggle()
            }
            if (accounts_collapse_panel.opened) {
                accounts_collapse_panel.toggle()
            }
            if (groups_collapse_panel.opened) {
                groups_collapse_panel.toggle()
            }
        }

        organizationsTab.onclick = () => {
            organizations_collapse_panel.toggle();
            if (accounts_collapse_panel.opened) {
                accounts_collapse_panel.toggle()
            }
            if (applications_collapse_panel.opened) {
                applications_collapse_panel.toggle()
            }
            if (groups_collapse_panel.opened) {
                groups_collapse_panel.toggle()
            }
        }

        this.onclose = null

        // simply close the watching content...
        this.shadowRoot.querySelector("#close-btn").onclick = () => {
            this.parentNode.removeChild(this)
            if (this.onclose != null) {
                this.onclose()
            }
        }

        // So here I will initialyse the list of accounts...
        Account.getAccounts("{}", accounts => {
            let range = document.createRange()
            let count = 0
            
            accounts.forEach(a => {
                console.log(a)
                if (a.id != "sa" && a.id != this.account.id) {
                    let uuid = "_" + getUuidByString(a.id + "@" + a.domain)
                    let html = `
                    <div id="${ uuid }" class="infos">
                        <img src="${a.profilePicture}">
                        
                        </img>
                        <span>${a.email}</span>
                    </div>
                    `
                    let fragment = range.createContextualFragment(html)
                    accountsDiv.appendChild(fragment)

                    let accountDiv = accountsDiv.querySelector(`#${uuid}`)
                    accountDiv.onclick = ()=>{
                        console.log("-----------> you click ", a.id + "@" + a.domain)
                    }

                    count++
                }
            })
            accountsCount.innerHTML = `(${count})`
        }, err => ApplicationView.displayMessage("fail to retreive accouts with error: ", err))
    }

}

customElements.define('globular-share-panel', SharePanel)
