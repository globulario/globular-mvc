// I will made use of polymer instead of materialyze for the main
// layout because materialyse dosen't react to well with the shadow doom.
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-icons/social-icons'
import '@polymer/iron-icons/editor-icons'
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-ripple/paper-ripple.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-card/paper-card.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-checkbox/paper-checkbox.js';
import '@polymer/iron-autogrow-textarea/iron-autogrow-textarea.js';
import { Autocomplete } from './Autocomplete'

import { Menu } from './Menu';
import { theme } from "./Theme";
import { Account } from "../Account"

/**
 * Login/Register functionality.
 */
export class ContactsMenu extends Menu {
    // attributes.

    // Create the contact view.
    constructor() {
        super("Contacts", "social:people", "Contacts")

        // Here is the class members.
        this.onInviteConctact = null;
        this.width = 350;
        if (this.hasAttribute("width")) {
            this.width = parseInt(this.getAttribute("width"));
        }

        this.height = 500;
        if (this.hasAttribute("height")) {
            this.height = parseInt(this.getAttribute("height"));
        }
    }

    // Init the contact at login time.
    init(account) {
        let html = `
            <style>
            #Contacts-div {
                display: flex;
                flex-wrap: wrap;
                padding: 10px;
                height: 100%;
                flex-direction: column;
            }
            </style>
            <div id="Contacts-div">
                <div style="width: 100%;">
                    <globular-autocomplete type="email" label="Invite Contact" id="invite_contact_input" width="${this.width - 10}" style="flex-grow: 1;"></globular-autocomplete>
                </div>
            </div>
        `

        let range = document.createRange()
        this.getMenuDiv().innerHTML = "" // remove existing elements.
        this.getMenuDiv().appendChild(range.createContextualFragment(html));

        this.getMenuDiv().style.height = this.height + "px";
        this.getMenuDiv().style.overflowY = "auto";
        this.shadowRoot.appendChild(this.getMenuDiv())

        // Action's
        let div = this.shadowRoot.getElementById("Contacts-div")

        // The invite contact action.
        let inviteContactInput = this.shadowRoot.getElementById("invite_contact_input")

        let sentContactInvitations = new SentContactInvitations(account);
        div.appendChild(sentContactInvitations)

        let receivedContactInvitations = new ReceivedContactInvitations(account);
        div.appendChild(receivedContactInvitations)

        // Get the list of contacts one time and use it many.
        Account.getContacts("{}", (accounts) => {

            // set the getValues function that will return the list to be use as filter.
            inviteContactInput.getValues = (value, callback) => {
                let filtered = [];
                if (value.length == 0) {
                    inviteContactInput.clear();
                    return filtered
                }
                for (var i = 0; i < accounts.length; i++) {
                    let a = accounts[i]
                    let contain = false;

                    if (a._id.toLowerCase().indexOf(value.toLowerCase()) != -1) {
                        contain = true
                        filtered.push(a)
                    }

                    if (!contain && a.email_.toLowerCase().indexOf(value.toLowerCase()) != -1) {
                        filtered.push(a)
                    }

                }

                // return _id value or email if value
                let getValue = (a) => {
                    if (a._id.toLowerCase().indexOf(value.toLowerCase()) != -1) {
                        return a._id.toLowerCase()
                    }

                    if (a.email_.toLowerCase().indexOf(value.toLowerCase()) != -1) {
                        return a.email_.toLowerCase()
                    }
                }

                // Now I will sort the values.
                filtered.sort((a, b) => {
                    let val_a = getValue(a)
                    let val_b = getValue(b)
                    if (val_a < val_b) {
                        return -1;
                    }
                    if (val_a > val_b) {
                        return 1;
                    }
                    return 0;
                });

                // remove user by it id or email.
                let removeUser = (id) => {
                    if (id.length > 0) {
                        let index = filtered.findIndex((a) => {
                            if (a.email_ == id) {
                                return true;
                            }
                            if (a._id == id) {
                                return true;
                            }
                            return false
                        })
                        if (index != -1) {
                            return filtered.splice(index, 1)
                        }
                        return null
                    }
                }

                // Remove the logged user from the list
                removeUser(account.email)

                // Todo filter with value 
                callback(filtered)
            }


            // That function must return the div that display the value that we want.
            inviteContactInput.displayValue = (value) => {

                let html = ` 
                <style>
                    ${theme}
                    .contact-invitation-div{
                        transition: background 0.2s ease,padding 0.8s linear;
                        background-color: var(--palette-background-paper);
                        color: var(--palette-text-primary);
                    }

                    .contact-invitation-div:hover{
                        filter: invert(10%);
                    }

                </style>
                <div class="contact-invitation-div" style="display: flex; flex-direction: column;">
                    <div style="display: flex; align-items: center; padding: 5px;"> 
                        <img id=${value._id + "_img"} style="width: 40px; height: 40px; display: ${value.profilPicture_ == undefined ? "none" : "block"};" src="${value.profilPicture_}"></img>
                        <iron-icon id=${value._id + "_ico"}   icon="account-circle" style="width: 40px; height: 40px; --iron-icon-fill-color:var(--palette-action-disabled); display: ${value.profilPicture_ != undefined ? "none" : "block"};"></iron-icon>
                        <div style="display: flex; flex-direction: column; width:300px; font-size: .85em; padding-left: 8px;">
                            <span>${value.name}</span>
                            <span>${value.email_}</span>
                        </div>
                    </div>
                    <paper-button style="font-size:.65em; width: 20px; align-self: flex-end;" id="${value._id}_invite_btn">Invite</paper-button>
                </div>`

                let range = document.createRange()
                let fragment = range.createContextualFragment(html)
                let inviteBtn = fragment.getElementById(value._id + "_invite_btn")
                inviteBtn.onclick = () => {
                    if (this.onInviteConctact != null) {
                        this.onInviteConctact(value)
                    }
                }

                return fragment
            }

        }, (err) => {
            console.log(err)
            callback([])
        })

        this.shadowRoot.removeChild(this.getMenuDiv())
    }

}

customElements.define('globular-contacts-menu', ContactsMenu)

/**
 * Display Contact (account informations)
 */
export class ContactCard extends HTMLElement {

    // Create the applicaiton view.
    constructor(account) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
        this.account = account;
    }

    // The connection callback.
    connectedCallback() {
        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${theme}
            .contact-invitation-div{
                transition: background 0.2s ease,padding 0.8s linear;
                background-color: var(--palette-background-paper);
                color: var(--palette-text-primary);
            }

            .contact-invitation-div:hover{
                filter: invert(10%);
            }

            .actions-div{
                display: flex;
            }
        </style>
        <div class="contact-invitation-div" style="display: flex; flex-direction: column;">
            <div style="display: flex; align-items: center; padding: 5px;"> 
                <img id=${this.account._id + "_img"} style="width: 40px; height: 40px; display: ${this.account.profilPicture_ == undefined ? "none" : "block"};" src="${this.account.profilPicture_}"></img>
                <iron-icon id=${this.account._id + "_ico"}   icon="account-circle" style="width: 40px; height: 40px; --iron-icon-fill-color:var(--palette-action-disabled); display: ${this.account.profilPicture_ != undefined ? "none" : "block"};"></iron-icon>
                <div style="display: flex; flex-direction: column; width:300px; font-size: .85em; padding-left: 8px;">
                    <span>${this.account.name}</span>
                    <span>${this.account.email_}</span>
                </div>
            </div>
            <div class="actions-div">
                <paper-button style="font-size:.65em; width: 20px; align-self: flex-end;" id="${this.account._id}_invite_btn">Invite</paper-button>
            </div>
        </div>
        `

    }
}

customElements.define('globular-contact-card', ContactCard)


/**
 * Display the list of sent contact invitation. If the invitation was not pending it will be removed.
 */
export class SentContactInvitations extends HTMLElement {

    // Create the applicaiton view.
    constructor(account) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        this.account = account;
        this.shadowRoot.innerHTML = `
        <style>
            ${theme}

            .contact-invitations{
                display: flex;
                flex-direction: column;
            }

            .contact-invitation-title{
                font-size: 1rem;
                text-transform: uppercase;
                color: var(--cr-primary-text-color);
                font-weight: 400;
                letter-spacing: .25px;
                margin-bottom: 12px;
                margin-top: var(--cr-section-vertical-margin);
                outline: none;
                padding-bottom: 4px;
                padding-top: 8px;
            }

            .contact-invitations-list{
                display: flex;
                flex-direction: column;
            }

        </style>

        <div class="contact-invitations">
            <div class="contact-invitation-title">Sent Invitations</div>
            <div class="contact-invitations-list"></div>
        </div>
        `
        // So here I will get the list of sent invitation for the account.
        Account.getSentContactInvitations(this.account._id, (invitations) => {
            console.log(invitations);
            let contactLst = this.shadowRoot.querySelector(".contact-invitations-list")
            for (var i = 0; i < invitations.length; i++) {
                Account.getAccount(invitations[i]._id,
                    (contact) => {
                        let card = new ContactCard(contact)
                        contactLst.appendChild(card)
                    },
                    err => { 
                        console.log(err)
                    })
            }
        }, err => {
            console.log(err);
        })
    }

    // The connection callback.
    connectedCallback() {

    }
}

customElements.define('globular-sent-contact-invitations', SentContactInvitations)

/**
 * Received contact invitations.
 */
export class ReceivedContactInvitations extends HTMLElement {

    // Create the applicaiton view.
    constructor(account) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        this.account = account;
    }

    // The connection callback.
    connectedCallback() {
        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${theme}
        </style>

        <div style="display: flex;">
        </div>
        `

    }
}

customElements.define('globular-received-contact-invitations', ReceivedContactInvitations)



/**
 * Accept contact button.
 */
export class AcceptDeclineContactBtns extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
    }

    // The connection callback.
    connectedCallback() {

        let contact = this.getAttribute("contact");

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${theme}
        </style>

        <div style="display: flex;">
            <paper-button id="decline_contact_btn" style="font-size:.65em; width: 20px;">Decline</paper-button>
            <paper-button id="accept_contact_btn" style="font-size:.65em; width: 20px;">Accept</paper-button>
        </div>

        `

        let acceptContactBtn = this.shadowRoot.getElementById("accept_contact_btn")
        acceptContactBtn.onclick = () => {
            console.log("", contact)
        }

        let declineContactBtn = this.shadowRoot.getElementById("decline_contact_btn")
        declineContactBtn.onclick = () => {
            console.log("", contact)

        }

    }
}

customElements.define('globular-accept-decline-contact-btns', AcceptDeclineContactBtns)

// Example of event that will keep the contact uptodate.
/*
                // This fuction will keep the value updated in the contact list.
                Model.eventHub.subscribe(`__update_account_${value._id}_data_evt__`,
                (uuid) => {

                },
                (data) => {
                  console.log("-------------------------> ", data)
                },
                true)
*/