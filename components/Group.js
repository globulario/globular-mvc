import { theme } from './Theme';
import '@polymer/iron-icons/iron-icons.js';

import { Model } from '../Model';
import { Application } from '../Application';
import { ApplicationView } from '../ApplicationView';
import { getAllGroups } from 'globular-web-client/api';
import { Account } from '../Account';
import { ContactCard } from './Contact'

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
        getAllGroups(Application.globular, groups => {
            /*console.log(groups)*/
            groups.forEach(g => {
                let panel = new GroupPanel(g)
                content.appendChild(panel)
            })
        }, err => { ApplicationView.displayMessage(err, 3000) })

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
                border-bottom: 1px solid var(--palette-divider);
            }

            #content{
                display: flex;
                align-items: center;
                justify-items: flex-start;
            }

            #conversation-infos-collapse{
                display: flex;
                width: 100%;
                background-color: var(--palette-background-default);
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
            <iron-collapse id="conversation-infos-collapse">
                <div id="content"></div>
            </iron-collapse>
        </div>
        `

        let content = this.shadowRoot.querySelector("#content")
        this.hideBtn = this.shadowRoot.querySelector("#hide-btn")
        // give the focus to the input.
        this.hideBtn.onclick = () => {
            let button = this.shadowRoot.querySelector("#hide-btn")
            if (button && content) {
                if (!content.opened) {
                    button.icon = "unfold-more"
                    if (content.children.length == 0) {

                        this.group.getMembersList().forEach(member =>{
                           this.appendAccount(member, content)
                        })
                    }
                } else {
                    button.icon = "unfold-less"

                }
                this.shadowRoot.querySelector("#conversation-infos-collapse").toggle();
            }
        }

    }

    appendAccount(id, content){
        let range = document.createRange()     
        Account.getAccount(id, (a)=>{
            let html = ` 
            <style>
                .account-panel {
                    display: flex; 
                    align-items: center; 
                    margin: 5px; 
                    border: 1px solid var(--palette-divider); 
                    border-radius: 20px; 
                    background-color:var(--palette-background-paper);
                }

                .account-panel img{
                    border-radius: 20px; 
                    width: 40px; height: 40px; 
                    display: ${a.profilPicture_ == undefined ? "none" : "block"};
                }

                .account-panel iron-icon{
                    width: 40px; 
                    height: 40px; 
                    --iron-icon-fill-color:var(--palette-action-disabled); 
                    display: ${a.profilPicture_ != undefined ? "none" : "block"};
                }

                .account-panel div{
                    display: flex; 
                    flex-direction: column; 
                    padding-left: 5px; 
                    padding: right: 5px; 
                    font-size: .85em; 
                    padding-left: 8px;
                }

            </style>
            <div class="account-panel"> 
                <img style="" src="${a.profilPicture_}"></img>
                <iron-icon icon="account-circle"></iron-icon>
                <div style="">
                    <span>${a.name}</span>
                    <span>${a.email_}</span>
                </div>
                <paper-icon-button icon="icons:clear"></paper-icon-button>
            </div>
            `
            // Only display the 
            content.appendChild(range.createContextualFragment(html))

        }, err=>{ApplicationView.displayMessage(err, 3000)})
    }
}

customElements.define('globular-group-panel', GroupPanel)