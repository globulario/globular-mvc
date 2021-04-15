import { theme } from './Theme';
import '@polymer/iron-icons/iron-icons.js';

import { Model } from '../Model';
import { Application } from '../Application';
import { ApplicationView } from '../ApplicationView';
import { getAllGroups } from 'globular-web-client/api';

export class GroupManager extends HTMLElement {
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

        // Get the list of all groups and initialyse the interfaces.
        getAllGroups(Application.globular, groups=>{
            /*console.log(groups)*/
            groups.forEach(g=>{
                let panel = new GroupPanel(g)
                content.appendChild(panel)
            })
        }, err=>{ApplicationView.displayMessage(err, 3000)})

    }

      
    // The connection callback.
    connectedCallback() {

    }
}

customElements.define('globular-group-manager', GroupManager)

export class GroupPanel extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(group) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Keep group informations.
        this.group = group;

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
                <span class="title">${this.group.getName()}</span>
                <div style="display: flex; width: 32px; height: 32px; justify-content: center; align-items: center;position: relative;">
                    <iron-icon  id="hide-btn"  icon="unfold-less" style="flex-grow: 1; --iron-icon-fill-color:var(--palette-text-primary);" icon="add"></iron-icon>
                    <paper-ripple class="circle" recenters=""></paper-ripple>
                </div>
            </div>
            <iron-collapse id="conversation-infos-collapse"></iron-collapse>
        </div>
        `

        let content = this.shadowRoot.querySelector("#conversation-infos-collapse")
        this.hideBtn = this.shadowRoot.querySelector("#hide-btn")
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

customElements.define('globular-group-panel', GroupPanel)