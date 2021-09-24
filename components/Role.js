import { theme } from './Theme';
import '@polymer/iron-icons/iron-icons.js';

import { Model } from '../Model';
import { GetRolesRqst } from 'globular-web-client/resource/resource_pb';
import { getAllRoles } from 'globular-web-client/api';
import { Application } from '../Application';
import { ApplicationView } from '../ApplicationView';
import { SearchableList} from './List.js'

export class RoleManager extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });


        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
             <style>
                 ${theme}
                 #container{
                    display: flex;
                    flex-direction: column;
                 }

                 .card-content {
                    min-width: 680px;
                    max-width: 680px;
                    padding: 0px;
                }
     
                @media only screen and (max-width: 800px) {
                    .card-content{
                      min-width: 580px;
                    }
                  }
          
                  @media only screen and (max-width: 600px) {
                    .card-content{
                      min-width: 380px;
                    }
                  }
          
             </style>
             <div id="container">
             <paper-card>
                <div class="card-content">
                </div>
             </paper-card>
             </div>
             `

        // give the focus to the input.
        let content = this.shadowRoot.querySelector(".card-content")

        // give the focus to the input.
        let container = this.shadowRoot.querySelector("#container")

        // Here I will get the list of all roles.
        getAllRoles(Application.globular,
            (roles) => {
                roles.forEach(r => {
                    let panel = new RolePanel(r)
                    content.appendChild(panel)
                })
            }, err => { ApplicationView.displayMessage(err, 3000) })
    }

    // The connection callback.
    connectedCallback() {

    }
}

customElements.define('globular-role-manager', RoleManager)



export class RolePanel extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(role) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Keep group informations.
        this.role = role;

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${theme}
            #container{
                display: flex;
                flex-direction: column;
                align-items: center;
            }

            .header{
                display: flex;
                align-items: center;
                width: 100%;
                transition: background 0.2s ease,padding 0.8s linear;
                background-color: var(--palette-background-paper);
            }

            .header:hover{
                -webkit-filter: invert(10%);
                filter: invert(10%);
            }

            .title{
                flex-grow: 1;
            }

        </style>
        <div id="container">
            <div class="header">
                <paper-icon-button icon="delete"></paper-icon-button>
                <span class="title">${this.role.getName()}</span>
                <div style="display: flex; width: 32px; height: 32px; justify-content: center; align-items: center;position: relative;">
                    <iron-icon  id="hide-btn"  icon="unfold-less" style="flex-grow: 1; --iron-icon-fill-color:var(--palette-text-primary);" icon="add"></iron-icon>
                    <paper-ripple class="circle" recenters=""></paper-ripple>
                </div>
            </div>
            <iron-collapse id="collapase-panel" >

            </iron-collapse>
        </div>
        `

        let content = this.shadowRoot.querySelector("#collapase-panel")
        this.hideBtn = this.shadowRoot.querySelector("#hide-btn")

        // Here I will create the searchable actions list.
        let actionsList = new SearchableList("Actions", this.role.getActionsList())
        content.appendChild(actionsList)

        // Here I will append the account.

        // give the focus to the input.
        this.hideBtn.onclick = () => {
            let button = this.shadowRoot.querySelector("#hide-btn")
            if (button && content) {
                if (!content.opened) {
                    button.icon = "unfold-more"
                } else {
                    button.icon = "unfold-less"
                }
                content.toggle();
            }
        }


    }

}

customElements.define('globular-role-panel', RolePanel)