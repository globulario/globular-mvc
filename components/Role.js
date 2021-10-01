import { theme } from './Theme';
import '@polymer/iron-icons/iron-icons.js';

import { Model } from '../Model';
import { AddAccountRoleRqst, AddRoleActionsRqst, GetRolesRqst } from 'globular-web-client/resource/resource_pb';
import { getAllRoles } from 'globular-web-client/api';
import { Application } from '../Application';
import { ApplicationView } from '../ApplicationView';
import { SearchableAccountList, SearchableList } from './List.js'
import { GetAllActionsRequest } from 'globular-web-client/services_manager/services_manager_pb';
import { Account } from '../Account';

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
                    if (r.getId() != "admin" && r.getId() != "guest") {
                        let panel = new RolePanel(r)
                        content.appendChild(panel)
                    }
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
        let actionsList = new SearchableList("Actions", this.role.getActionsList(),
            (action) => {
                // remove action...
                console.log("remove action: ", action)
            },
            (action) => {
                console.log("add action: ", action)
                ApplicationView.displayMessage("Action " + action + " was set to " + role.getId(), 3000)
            },
            (actions) => {
                console.log("display the actions list panel...", actions)

                // Now I will get the list of all actions install on the server.
                let getAllActionsRqst = new GetAllActionsRequest
                Model.globular.servicesManagerService.getAllActions(getAllActionsRqst, { domain: Model.domain, application: Model.application, token: localStorage.getItem("user_token") })
                    .then(rsp => {
                        console.log(rsp.getActionsList())
                        let actions_ = rsp.getActionsList()
                        actions.forEach(a => {
                            actions_.splice(actions_.indexOf(a), 1);
                        });

                        // sort the array.
                        actions_.sort()

                        let html = `
                        <style>
                            ${theme}
                            #add-role-action-panel{
                                position: absolute;
                                right: 0px;
                                z-index: 1;
                            }
                            .card-content{
                                overflow-y: auto;
                                min-width: 400px;
                                max-height: 260px;
                                overflow-y: auto;
                            }
        
                        </style>
                        <paper-card id="add-role-action-panel">
                            <div style="display: flex; align-items: center;">
                                <div style="flex-grow: 1; padding: 5px;">
                                    Add Action
                                </div>
                                <paper-icon-button id="cancel-btn" icon="close"></paper-icon-button>
                            </div>
                            <div class="card-content">
                                <div></div>
                            </div>
                        </paper-card>
                        `

                        let headerDiv = actionsList.getHeader()
                        let panel = headerDiv.querySelector("#add-role-action-panel")

                        if (panel == undefined) {
                            headerDiv.appendChild(document.createRange().createContextualFragment(html))
                            panel = headerDiv.querySelector("#add-role-action-panel")
                            panel.style.top = (headerDiv.offsetHeight / 2) + 14 + "px";
                            let closeBtn = panel.querySelector("#cancel-btn")
                            closeBtn.onclick = () => {
                                panel.parentNode.removeChild(panel)
                            }

                            actions_.forEach(a => {

                                let html = `
                                <div class="item-div" style="">
                                    <span style="flex-grow: 1;">${a}</span>
                                    <paper-icon-button id="add-action-btn" icon="add" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
                                </div>
                                `
                                let content = panel.querySelector(".card-content")
                                content.appendChild(document.createRange().createContextualFragment(html))
                                let actionDiv = content.children[content.children.length - 1]
                                let actionAddBtn = actionDiv.children[1]
                                actionAddBtn.onclick = () => {
                                   
                                    let rqst = new AddRoleActionsRqst
                                    rqst.setRoleid(role.getId())
                                    rqst.setActionsList([a])
                                    Model.globular.resourceService.addRoleActions(rqst, { domain: Model.domain, application: Model.application, token: localStorage.getItem("user_token") })
                                        .then(rsp => {
    
                                            actionDiv.parentNode.removeChild(actionDiv)
                                            actionsList.list.push(a)
                                            actionsList.displayItems();

                                            // call the onadditem.
                                            actionsList.onadditem(a)
                                        }).catch(err => {
                                            ApplicationView.displayMessage(err, 3000)
                                        })

                                }

                            })
                        }


                    }).catch(err => {
                        console.log(err)
                    })
            })

        content.appendChild(actionsList)

        // Now the account list.
        Account.getAccounts("{}",
            accounts => {

                // I will get the account object whit the given id.
                let list = []
                this.role.getMembersList().forEach(accountId => {
                    let a_ = accounts.find(a => a._id === accountId);
                    if (a_ != undefined) {
                        list.push(a_)
                    }
                })

                let accountsList = new SearchableAccountList("Accounts", list, a => {
                    console.log("remove account ", a._id, "from role ", role.getId())
                    accountsList.removeItem(a)
                },
                    a => {
                        console.log("append account ", a._id, "to role", role.getId())
                        let rqst = new AddAccountRoleRqst
                        rqst.setRoleid(role.getId())
                        rqst.setAccountid(a._id)
                        Model.globular.resourceService.addAccountRole(rqst, { domain: Model.domain, application: Model.application, token: localStorage.getItem("user_token") })
                            .then(rsp => {
                                accountsList.appendItem(a)
                                ApplicationView.displayMessage("Account " + a._id + " has now role " + role.getId(), 3000)
                            }).catch(err => {
                                accountsList.removeItem(a)
                                ApplicationView.displayMessage(err, 3000)
                            })

                    })

                content.appendChild(accountsList)
            }, err => {

            })


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