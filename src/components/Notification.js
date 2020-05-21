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

        // The div inner panel.
        let html = `
        <style>
            #notifications{
                display: flex;
                flex-direction: column;
            }

            #notifications-config{
                flex-grow: 1;

            }

            #application-notifications #user-nofitications{
                display: flex;
                flex-direction: column;
            }

            .header{
                display: flex;
                font-size: 12pt;
                align-items: center;
                padding: .5rem;
                border-bottom: 1px solid #e8e8e8;
            }

            .body{
                min-width: 256px;
                min-height: 100px;
            }

            .btn_div{
                display: flex; 
                flex-grow: 1; 
                justify-content: 
                flex-end;
            }

            .btn {
                position: relative;
            }

            .btn:hover{
                cursor: pointer;
            }

        </style>

        <div>
            <div class="header" style="">
                <div>Notifications</div>
                <div class="btn_div">
                    <div class="btn">
                        <iron-icon id="notifications-config" icon="settings"></iron-icon>
                        <paper-ripple class="circle" recenters></paper-ripple>
                    </div>
                </div>
            </div>

            <div id="application-notifications">
                <div class="header">Application</div>
                <div class="body">
                </div>
            </div>
            <div id="user-nofitications">
                <div class="header" style="border-top: 1px solid #e8e8e8;">User</div>
                <div class="body">
                </div>
            </div>

        </div>
        `
        let range = document.createRange()
        this.getMenuDiv().appendChild(range.createContextualFragment(html));
        
    }

    init(){
        // The logout event.
        Model.eventHub.subscribe("logout_event", 
        (uuid)=>{
            /** nothing to do here. */
        }, 
        (data)=>{
            this.clear()
        }, true)
        
    }

    // clear the notifications.
    clear(){
        
    }

    // Set user notifications
    setUserNofications(notifications){
        // Here I will get the user notification.

    }

    // Set the application notifications.
    setApplicationNofications(notifications){
        // Here I will get the user notification.

    }

}

customElements.define('globular-notification-menu', NotificationMenu)