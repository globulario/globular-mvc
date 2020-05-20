// I will made use of polymer instead of materialyze for the main
// layout because materialyse dosen't react to well with the shadow doom.
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-icons/social-icons'
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-ripple/paper-ripple.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-card/paper-card.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-checkbox/paper-checkbox.js';

import { Model } from '../Model';
import { Menu } from './Menu';

/**
 * Login/Register functionality.
 */
export class NotificationMenu extends Menu {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super("notification", "social:notifications-none")

    }

    init(){
        // The logout event.
        Model.eventHub.subscribe("logout_event", 
        (uuid)=>{
            /** nothing to do here. */
        }, 
        (data)=>{
            console.log("---> logout_event", data)
        }, true)
    }

    // Set account information.
    setAccount(account){
    }
}

customElements.define('globular-notification-menu', NotificationMenu)