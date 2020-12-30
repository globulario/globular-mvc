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

import { Menu } from './Menu';
import { Account } from '../Account';
import { theme } from './Layout';

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
                <div style="display: flex; width: 100%;">
                    <paper-input type="email" label="contact email" id="invite_contact_input" style="flex-grow: 1;"></paper-input>
                    <div id="invite_contact_btn"  style="position: relative; min-width: 30px; padding: 5px; align-self: center;">
                        <iron-icon icon="social:social:group-add"></iron-icon>
                        <paper-ripple class="circle" recenters=""></paper-ripple>
                    </div>
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
        let inviteContactBtn = this.shadowRoot.getElementById("invite_contact_btn")
        let inviteContactInput = this.shadowRoot.getElementById("invite_contact_input")

        // Call invite contact method.
        inviteContactBtn.onclick = ()=>{
            let email = inviteContactInput.value
            inviteContactInput.value = ""

            if(this.onInviteConctact != null){
                this.onInviteConctact(email)
            }
        }

        this.shadowRoot.removeChild(this.getMenuDiv())
    }
}

customElements.define('globular-contacts-menu', ContactsMenu)