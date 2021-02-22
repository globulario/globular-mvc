// I will made use of polymer instead of materialyze for the main
// layout because materialyse dosen't react to well with the shadow doom.
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-icons/social-icons'
import '@polymer/iron-icons/editor-icons'
import '@polymer/iron-icons/communication-icons'
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-ripple/paper-ripple.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-card/paper-card.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-checkbox/paper-checkbox.js';
import '@polymer/iron-autogrow-textarea/iron-autogrow-textarea.js';
import '@polymer/paper-tabs/paper-tabs.js';
import '@polymer/paper-tabs/paper-tab.js';
import { Autocomplete } from './Autocomplete'

import { Menu } from './Menu';
import { theme } from "./Theme";
import { Account } from "../Account"
import { Model } from "../Model"

/**
 * Communication with your contact's
 */
export class MessengerMenu extends Menu {
    // attributes.

    // Create the contact view.
    constructor() {
        super("Messenger", "communication:message", "Messenger")

        this.account = null;

        // Actions handlers

        // When new conversation is receive.
        this.onConversationRequest = null;

        // When a new message is receive.
        this.onReceiveMessage = null;


        this.width = 350;
        if (this.hasAttribute("width")) {
            this.width = parseInt(this.getAttribute("width"));
        }

        this.height = 550;
        if (this.hasAttribute("height")) {
            this.height = parseInt(this.getAttribute("height"));
        }

    }

    // Init the message menu at login time.
    init(account) {

        // Keep the account reference.
        this.account = account;

        // Event listener when a new conversation is created...
        Model.eventHub.subscribe("create_new_conversation_event",
            (uuid) => { },
            (data) => {
                let conversation = JSON.parse(data)
                console.log("---> new public conversation created: ", conversation)
             },
            false)

         Model.eventHub.subscribe(`create_new_conversation_${this.account.name}_event`,
            (uuid) => { },
            (data) => {
                let conversation = JSON.parse(data)
                console.log("---> new private conversation created: ", this.account.name , conversation)
             },
            false)

        let html = `
            <style>
            ${theme}
            #Messages-div {
                display: flex;
                flex-wrap: wrap;
                padding: 10px;
                height: 100%;
                flex-direction: column;
                overflow: hidden;
                min-width: 389.5px;
            }
                          
            #Messages-list{
                flex: 1;
                overflow: auto;
               
            }

            .btn: hover{
                cursor: pointer;
            }

            </style>

            <div id="Messages-div">
                <div style="display: flex; align-items: center;">
                    <globular-autocomplete type="text" label="Search" id="search-conversation-box" width="${this.width}" style=""></globular-autocomplete>
                    <div id="new-converstion-btn" class="btn" style="position: relative;">
                        <iron-icon style="flex-grow: 1; --iron-icon-fill-color:var(--palette-text-primary);" icon="add"></iron-icon>
                        <paper-ripple class="circle" recenters=""></paper-ripple>
                    </div>
                </div>
                <paper-tabs selected="0">
                    <paper-tab id="my-conversation-tab">Owned</paper-tab>
                    <paper-tab id="my-participating-conversation-tab">Participating</paper-tab>
                    <paper-tab id="public-conversation-tab">Public</paper-tab>
                </paper-tabs>
                <div id="Messages-list">

                </div>
            </div>
        `

        let range = document.createRange()
        this.getMenuDiv().innerHTML = "" // remove existing elements.
        this.getMenuDiv().appendChild(range.createContextualFragment(html));

        this.getMenuDiv().style.height = this.height + "px";
        this.getMenuDiv().style.overflowY = "auto";
        this.shadowRoot.appendChild(this.getMenuDiv())


        this.newCoversationBtn = this.shadowRoot.querySelector("#new-converstion-btn")

        this.newCoversationBtn.onclick = () => {
            this.createNewConversation()
        }


        this.shadowRoot.removeChild(this.getMenuDiv())

    }

    /**
     * Create a new converstion.
     */
    createNewConversation() {
        // simply publish create new conversation...
        Model.eventHub.publish("__create_new_conversation_event__", {}, true)

    }
}

customElements.define('globular-messenger-menu', MessengerMenu)

