import { theme } from "./Theme";
import { Account } from "../Account"
import { Model } from "../Model"

import "@polymer/iron-icons/device-icons";
import "@polymer/iron-icon/iron-icon.js";
import '@polymer/paper-toggle-button/paper-toggle-button.js';
import { Session } from '../Session'
import { ApplicationView } from "../ApplicationView";
import { v4 as uuidv4 } from "uuid";
import { LogInfo } from "globular-web-client/log/log_pb";

// This variables are for the active user.
let accountId = ""
let away = false; // does not want to be see
let timeout = null; // use it to make the event less anoying...
let sessionTime = null;

// When the applicaiton lost focus away state will be set to the logged user.
document.addEventListener('visibilitychange', function () {
    if (accountId.length > 0 && !away) {
        if (document.visibilityState == 'hidden') {
            timeout = setTimeout(() => {
                Model.eventHub.publish(`__session_state_${accountId}_change_event__`, { _id: accountId, state: 2, lastStateTime: new Date() }, true)
            }, 30 * 1000)
        } else {
            Model.eventHub.publish(`__session_state_${accountId}_change_event__`, { _id: accountId, state: 0, lastStateTime: sessionTime }, true)
            if (timeout != undefined) {
                clearTimeout(timeout)
            }
        }
    }
});

window.addEventListener('beforeunload', function (e) {
    // the absence of a returnValue property on the event will guarantee the browser unload happens
    Model.eventHub.publish(`__session_state_${accountId}_change_event__`, { _id: accountId, state: 1, lastStateTime: new Date() }, true)
    delete e['returnValue'];
});

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
        let sessionStateId = "_" + uuidv4();
        let sessionTimerId = "_" + uuidv4();
        this.sessionChangeListener = ""

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${theme}
            .session-state-panel{
                display: flex;
                flex-direction: row;
                background-color: var(--palette-background-paper);
                color: var(--palette-text-primary);
                --iron-icon-fill-color: var(--palette-text-primary);
                align-items: center;
                font-size: .95rem;
                min-width: 300px;
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
            <span id="${sessionStateId}"></span>
            <span id="${sessionTimerId}"></span>
            <paper-toggle-button title="Appear away to other's" noink>Away</paper-toggle-button>
        </div>
        `

        this.ico = this.shadowRoot.querySelector("iron-icon")
        this.away = this.shadowRoot.querySelector("paper-toggle-button")
        this.stateName = this.shadowRoot.querySelector("#" + sessionStateId)
        this.lastStateTime = this.shadowRoot.querySelector("#" + sessionTimerId)
        this.id = "_" + uuidv4();

        // Set the away button...
        if (this.hasAttribute("editable")) {
            this.away.onchange = () => {
                let session = {}
                session._id = this.account.session._id;
                if (this.away.checked) {
                    // Here I will set the user session...
                    session.state = 2;
                    session.lastStateTime = new Date();
                    this.stateName.innerHTML = "Away"
                    away = true;
                } else {
                    session.state = 0;
                    session.lastStateTime = sessionTime; // set back the session time.
                    away = false;
                    this.stateName.innerHTML = "Online"
                }
                // local event.
                Model.eventHub.publish(`__session_state_${this.account.id}_change_event__`, session, true)
            }
        } else {
            this.away.parentNode.removeChild(this.away);
        }

        // The account can be the actual object or a string...
        if (this.hasAttribute("account")) {
            if (this.hasAttribute("editable")) {
                // keep in memory
                accountId = this.getAttribute("account")
            }

            Account.getAccount(this.getAttribute("account"), (val) => {
                this.account = val;
            }, (err) => {
                ApplicationView.displayMessage(err, 3000)
                console.log(err)
            })
        }
    }

    /**
     * Initialyse the session panel values.
     */
    init() {

        if (this.hasAttribute("editable")) {
            sessionTime = this.account.session.lastStateTime;
        }

        // unsubscribe first.
        Model.eventHub.subscribe(`session_state_${this.account.id}_change_event`,
            (uuid) => {
                this.sessionChangeListener = uuid;
            },
            (evt) => {
                // Set the value here...
                let obj = JSON.parse(evt)
                this.account.session.lastStateTime_ = new Date(obj.lastStateTime * 1000)
                this.account.session.state_ = obj.state

            }, false, this)



        // Start display time at each second...
        this.interval = setInterval(() => {
            this.displayDelay()
        }, 500)

    }

    displayDelay() {
        if (this.account.session == undefined) {
            this.style.display = "none"
            return
        }

        this.style.display = ""
        let lastStateTime = this.account.session.lastStateTime_
        let state = this.account.session.state_

        if (state == 0) {
            this.stateName.innerHTML = "Online"
        } else if (state == 1) {
            this.stateName.innerHTML = "Offline"
        } else {
            this.stateName.innerHTML = "Away"
        }

        let delay = Math.floor((Date.now() - lastStateTime.getTime()) / 1000);

        if (delay < 60) {
            this.lastStateTime.innerHTML = delay + " seconds ago"
        } else if (delay < 60 * 60) {
            this.lastStateTime.innerHTML = Math.floor(delay / (60)) + " minutes ago"
        } else if (delay < 60 * 60 * 24) {
            this.lastStateTime.innerHTML = Math.floor(delay / (60 * 60)) + " hours ago"
        } else {
            this.lastStateTime.innerHTML = Math.floor(delay / (60 * 60 * 24)) + " days ago"
        }
    }


    // The connection callback.
    connectedCallback() {
        // When the element is put in the dom.
        this.init();
    }

    // Disconnect the element from the view.
    disconnectedCallback() {
        // it can affect it values.
        if (this.interval != undefined) {
            clearInterval(this.interval);
        }
        if (this.sessionChangeListener.length > 0) {
            Model.eventHub.unSubscribe(`session_state_${this.account.id}_change_event`, this.sessionChangeListener)
        }
    }
}

customElements.define('globular-session-state', SessionState)