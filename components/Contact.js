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
import { theme } from './Layout';
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
    }

    init() {
        let html = `
            <style>
            #Contacts-div {
                display: flex;
                flex-wrap: wrap;
                padding: 10px;
                width: 300px;
            }
            </style>
            <div id="Contacts-div">
                <div style="width: 100%;">
                    <globular-autocomplete type="email" label="Invite Contact" id="invite_contact_input" style="flex-grow: 1;"></globular-autocomplete>
                </div>
            </div>
        `

        let range = document.createRange()
        this.getMenuDiv().innerHTML = "" // remove existing elements.
        this.getMenuDiv().appendChild(range.createContextualFragment(html));

        this.getMenuDiv().style.height = "380px";
        this.getMenuDiv().style.overflowY = "auto";
        this.shadowRoot.appendChild(this.getMenuDiv())

        // Action's
        let div = this.shadowRoot.getElementById("Contacts-div")

        // The invite contact action.
        //let inviteContactBtn = this.shadowRoot.getElementById("invite_contact_btn")
        let inviteContactInput = this.shadowRoot.getElementById("invite_contact_input")

        // Get the list of contacts one time and use it many.
        Account.getContacts("{}", (accounts) => {

            // set the getValues function that will return the list to be use as filter.
            inviteContactInput.getValues = (value, callback) => {
                let filtered = [];
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
                let removeUser = (id)=>{
                    if (id.length > 0) {
                        let index = filtered.findIndex((a) => {
                            if (a.email_ == id) {
                                return true;
                            }
                            if(a._id == id){
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
                let email = localStorage.getItem("user_email")
                let currentUser = removeUser(email)
                // TODO remove contacts from the list of potential one.

                // Todo filter with value 
                callback(filtered)
            }

            // That function must return the div that display the value that we want.
            inviteContactInput.displayValue = (value) => {

                let html = ` 
                <div style="display: flex; flex-direction: column;">
                    <div style="display: flex; align-items: center; padding: 5px;">   
                        <img style="width: 40px; height: 40px; " src="${value.profilPicture_}"></img>
                        <div style="display: flex; flex-direction: column; font-size: .85em; padding-left: 8px;">
                            <span>${value._id}</span>
                            <span>${value.email_}</span>
                        </div>
                    </div>
                    <paper-button style="font-size:.65em; width: 20px; align-self: flex-end;" id="${value._id}_invite_btn">Invite</paper-button>
                </div>`

                let range = document.createRange()
                let fragment = range.createContextualFragment(html)
                let inviteBtn = fragment.getElementById(value._id + "_invite_btn")
                inviteBtn.onclick = ()=>{
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
        acceptContactBtn.onclick = ()=>{
            console.log("", contact)
        }

        let declineContactBtn = this.shadowRoot.getElementById("decline_contact_btn")
        declineContactBtn.onclick = ()=>{
            console.log("", contact)
            
        }

    }
}

customElements.define('globular-accept-decline-contact-btns', AcceptDeclineContactBtns)