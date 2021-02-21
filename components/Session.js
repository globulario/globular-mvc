import { theme } from "./Theme";
import { Account } from "../Account"
import { Model } from "../Model"

import "@polymer/iron-icons/device-icons";
import "@polymer/iron-icon/iron-icon.js";
import '@polymer/paper-toggle-button/paper-toggle-button.js';

/**
 * Display the session state of a particular accout...
 */
export class SessionState extends HTMLElement {

    // Create the applicaiton view.
    constructor(account) {
        super()

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
        this.account = account;
        this.interval = null;
        this.sessionTime = null;

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${theme}

            .session-state-panel{
                display: flex;
                padding-left: 16px;
                padding-right: 16px;
                padding-bottom: 16px;
                flex-direction: row;
                background-color: var(--palette-background-paper);
                color: var(--palette-text-primary);
                --iron-icon-fill-color: var(--palette-text-primary);
                align-items: center;
                font-size: .95rem;
                min-width: 355px;
            }

            .session-state-panel span{
                padding-left: 10px;
            }

            #session-state-timer{
                flex-grow: 1;
            }

            .session-state-panel paper-toggle-button{
                padding-left: 16px;
                font-size: .95rem;
            }

        </style>
        <div class="session-state-panel">
            <iron-icon icon="device:access-time"></iron-icon>
            <span id="session-state-name"></span>
            <span id="session-state-timer"></span>
            <paper-toggle-button title="Appear away to other's" noink>Away</paper-toggle-button>
        </div>
        
        `

        this.ico = this.shadowRoot.querySelector("iron-icon")
        this.away = this.shadowRoot.querySelector("paper-toggle-button")
        this.stateName = this.shadowRoot.querySelector("#session-state-name")
        this.lastStateTime = this.shadowRoot.querySelector("#session-state-timer")

        // Set the away button...
        if(this.hasAttribute("editable")){
            this.away.onchange = () => {
                let session = this.account.session;
                if (this.away.checked) {
                    // Here I will set the user session...
                    session.state_ = 2;
                    session.lastStateTime = new Date();
                } else {
                    session.state_ = 0;
                    session.lastStateTime = this.sessionTime; // set back the session time.
                }
    
                Model.eventHub.publish(`__session_state_${this.account.name}_change_event__`, session, true)
            }
        }else{
            this.away.parentNode.removeChild(this.away);
        }

        // The account can be the actual object or a string...
        if (this.hasAttribute("account")) {
            Account.getAccount(this.getAttribute("account"), (val) => {
                this.account = val;
                this.init();

            }, (err) => { console.log(err) })
        }


    }

    /**
     * Initialyse the session panel values.
     */
    init() {
        this.setSessionInfo(this.account.session)
        this.sessionTime = new Date(this.account.session.lastStateTime);
        Model.eventHub.subscribe(`session_state_${this.account.name}_change_event`,
            (uuid) => {
                /** nothing special here... */
            },
            (evt) => {
                let obj = JSON.parse(evt)
                this.setSessionInfo(obj)

            }, false)

    }

    setSessionInfo(session) {
        // Set the sate 
        if (session.state_ == 0) {
            this.stateName.innerHTML = "Online"
        } else if (session.state_ == 1) {
            this.stateName.innerHTML = "Offline"
        } else {
            this.stateName.innerHTML = "Away"
        }

        if (this.interval != undefined) {
            clearInterval(this.interval);
        }

        // Start display time of session here.
        this.interval = setInterval(() => {
            let now = new Date();
            let lastStateTime = new Date(session.lastStateTime)
            let delay = Math.floor((now.getTime() - lastStateTime.getTime()) / 1000);
            if (delay < 60) {
                this.lastStateTime.innerHTML = delay + " seconds ago"
            } else if (delay < 60 * 60) {
                this.lastStateTime.innerHTML = Math.floor(delay / (60)) + " minutes ago"
            } else if (delay < 60 * 60 * 24) {
                this.lastStateTime.innerHTML = Math.floor(delay / (60 * 60)) + " hours ago"
            } else {
                this.lastStateTime.innerHTML = Math.floor(delay / (60 * 60 * 24)) + " days ago"
            }
        }, 1000)
    }



    // The connection callback.
    connectedCallback() {

    }
}

customElements.define('globular-session-state', SessionState)