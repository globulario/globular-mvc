import { getTheme } from "./Theme";
import '@polymer/iron-icons/iron-icons.js';

import { Model } from '../Model';
import { AddAccountRoleRqst, AddRoleActionsRqst, CreateRoleRqst, DeleteRoleRqst, RemoveRoleActionRqst, Role, RemoveAccountRoleRqst } from 'globular-web-client/resource/resource_pb';
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
                 ${getTheme()}

                #create-role-btn{
                    top: -42px;
                    right: 0px;
                    position: absolute;
                 }

                 #container{
                    display: flex;
                    flex-direction: column;
                    position: relative;
                    min-width: 500px;
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
                <paper-icon-button icon="add" id="create-role-btn"></paper-icon-button>
             </div>
             `

        // give the focus to the input.
        let content = this.shadowRoot.querySelector(".card-content")

        // give the focus to the input.
        let container = this.shadowRoot.querySelector("#container")

        let displayRoles = ()=>{
            content.innerHTML = ""
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
         
        // call once
        displayRoles()

        Model.globular.eventHub.subscribe("refresh_role_evt", uuid=>{}, evt=>{
            displayRoles()
        }, true)

        let createRoleBtn = this.shadowRoot.querySelector("#create-role-btn")
        createRoleBtn.onclick = () => {
            let html = `
            <style>
                ${getTheme()}
                #create-role-panel{
                    position: absolute;
                    right: 0px;
                    top: 0px;
                    z-index: 1;
                    background-color: var(--palette-background-paper);
                }
                #create-role-panel .card-content{
                    min-width: 200px;
                    padding: 0px 10px 0px 10px;
                    display: flex;
                    flex-direction: column;
                }

            </style>
            <paper-card id="create-role-panel">
                <div style="display: flex; align-items: center;">
                    <div style="flex-grow: 1; padding: 5px;">
                        Create Role
                    </div>
                    <paper-icon-button id="cancel-btn" icon="close"></paper-icon-button>
                </div>
                <div class="card-content">
                    <paper-input></paper-input>
                    
                    <paper-button style="align-self: end;">Create</paper-button>
                </div>
            </paper-card>
            `

            let panel = container.querySelector("#create-role-panel")
            let input = null
            if (panel == undefined) {
                container.appendChild(document.createRange().createContextualFragment(html))
                panel = container.querySelector("#create-role-panel")
                let closeBtn = panel.querySelector("#cancel-btn")
                closeBtn.onclick = () => {
                    panel.parentNode.removeChild(panel)
                }

                input = panel.querySelector("paper-input")
                let createRoleButton =  panel.querySelector("paper-button")

                // Create a new role.
                createRoleButton.onclick = ()=>{
                    let roleId = input.value;
                    if(roleId.length == 0){
                        ApplicationView.displayMessage("No role name was given!", 3000)
                        setTimeout(() => {
                            input.focus()
                          }, 100)
                        return
                    }

                    let createRoleRqst = new CreateRoleRqst
                    let role = new Role
                    role.setId(roleId)
                    role.setName(roleId)

                    createRoleRqst.setRole(role)
                    Model.globular.resourceService.createRole(createRoleRqst, { domain: Model.domain,address: Model.address, application: Model.application, token: localStorage.getItem("user_token") })
                    .then(rsp => {
                        ApplicationView.displayMessage("Role " + roleId + " was created!", 3000)
                        panel.parentNode.removeChild(panel)
                        displayRoles()
                    }).catch(err => {
                        ApplicationView.displayMessage(err, 3000)
                        setTimeout(() => {
                            input.focus()
                          }, 100)
                    })
                   
                }
            }else{
                input = panel.querySelector("paper-input")
            }
            
            setTimeout(() => {
                input.focus()
              }, 100)

        }


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
            ${getTheme()}
            #container{
                display: flex;
                flex-direction: column;
                align-items: center;
                border-bottom: 1px solid var(--palette-background-default);
            }

            #content{
                padding-top: 15px;
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
                margin: 8px;
            }

            img, iron-icon{
              margin: 8px;
            }

            #collapse-panel{
                display: flex;
                flex-direction: column;
                width: 90%;
            }

            #delete-role-btn{
                font-size: .85rem;
                max-height: 32px;
            }

        </style>
        <div id="container">
            <div class="header">
                <span class="title">${this.role.getName()}</span>
                <paper-button id="delete-role-btn">Delete</paper-button>
                <div style="display: flex; width: 32px; height: 32px; justify-content: center; align-items: center;position: relative;">
                    <iron-icon  id="hide-btn"  icon="unfold-less" style="flex-grow: 1; --iron-icon-fill-color:var(--palette-text-primary);" icon="add"></iron-icon>
                    <paper-ripple class="circle" recenters=""></paper-ripple>
                </div>

            </div>
            <iron-collapse id="collapse-panel"  style="width: 90%;">

            </iron-collapse>
        </div>
        `

        let content = this.shadowRoot.querySelector("#collapse-panel")
        this.hideBtn = this.shadowRoot.querySelector("#hide-btn")

        let deleteBtn = this.shadowRoot.querySelector("#delete-role-btn")
        deleteBtn.onclick = ()=>{
            this.onDeleteRole(role)
        }


        // Here I will create the searchable actions list.
        let actionsList = new SearchableList("Actions", this.role.getActionsList(),
            (action) => {
                // remove action...
                let removeActionRqst = new RemoveRoleActionRqst
                removeActionRqst.setAction(action)
                removeActionRqst.setRoleid(role.getId())
                Model.globular.resourceService.removeRoleAction(removeActionRqst, { domain: Model.domain,address: Model.address, application: Model.application, token: localStorage.getItem("user_token") })
                    .then(rsp => {
                        actionsList.removeItem(action)
                        ApplicationView.displayMessage("Action " + action + " was removed from role " + role.getId(), 3000)
                    }).catch(err => {
                        ApplicationView.displayMessage(err, 3000)
                    })

            },
            (action) => {
                ApplicationView.displayMessage("Action " + action + " was added to role " + role.getId(), 3000)
            },
            (actions) => {

                // Now I will get the list of all actions install on the server.
                let getAllActionsRqst = new GetAllActionsRequest
                Model.globular.servicesManagerService.getAllActions(getAllActionsRqst, { domain: Model.domain, address: Model.address, application: Model.application, token: localStorage.getItem("user_token") })
                    .then(rsp => {
                        let actions_ = rsp.getActionsList()
                        actions.forEach(a => {
                            actions_.splice(actions_.indexOf(a), 1);
                        });

                        // sort the array.
                        actions_.sort()

                        let html = `
                        <style>
                            ${getTheme()}
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
                                    Model.globular.resourceService.addRoleActions(rqst, { domain: Model.domain, address: Model.address, application: Model.application, token: localStorage.getItem("user_token") })
                                        .then(rsp => {

                                            actionDiv.parentNode.removeChild(actionDiv)
                                            actionsList.appendItem(a)

                                            // call the onadditem.
                                            actionsList.onadditem(a)
                                        }).catch(err => {
                                            ApplicationView.displayMessage(err, 3000)
                                        })

                                }

                            })
                        }


                    }).catch(err => {
                        ApplicationView.displayMessage(err, 3000)
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
                    accountsList.removeItem(a)
                    let rqst = new RemoveAccountRoleRqst
                    rqst.setRoleid(role.getId())
                    rqst.setAccountid(a._id)
                    Model.globular.resourceService.removeAccountRole(rqst, { domain: Model.domain,address: Model.address, application: Model.application, token: localStorage.getItem("user_token") })
                        .then(rsp => {
                            accountsList.removeItem(a)
                            ApplicationView.displayMessage("Account " + a._id + " was removed from role " + role.getId(), 3000)
                        }).catch(err => {
                            accountsList.appendItem(a) // set it back
                            ApplicationView.displayMessage(err, 3000)
                        })
                },
                    a => {
                        let rqst = new AddAccountRoleRqst
                        rqst.setRoleid(role.getId())
                        rqst.setAccountid(a._id)
                        Model.globular.resourceService.addAccountRole(rqst, { domain: Model.domain, address: Model.address, application: Model.application, token: localStorage.getItem("user_token") })
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
                ApplicationView.displayMessage(err, 3000)
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

    onDeleteRole(role) {
        let toast = ApplicationView.displayMessage(
          `
          <style>
            #yes-no-contact-delete-box{
              display: flex;
              flex-direction: column;
            }
    
            #yes-no-contact-delete-box globular-contact-card{
              padding-bottom: 10px;
            }
    
            #yes-no-contact-delete-box div{
              display: flex;
              padding-bottom: 10px;
            }
    
            paper-button{
              font-size: .85rem;
              height: 32px;
            }
    
          </style>
          <div id="yes-no-contact-delete-box">
            <div>Your about to delete the role ${role.getName()}</div>
            <div>Is it what you want to do? </div>
            <div style="justify-content: flex-end;">
              <paper-button id="yes-delete-contact">Yes</paper-button>
              <paper-button id="no-delete-contact">No</paper-button>
            </div>
          </div>
          `,
          15000 // 15 sec...
        );
    
        let yesBtn = document.querySelector("#yes-delete-contact")
        let noBtn = document.querySelector("#no-delete-contact")
    
        // On yes
        yesBtn.onclick = () => {

          let rqst = new DeleteRoleRqst
          rqst.setRoleid(role.getId())
          Model.globular.resourceService.deleteRole(rqst, { domain: Model.domain, address: Model.address, application: Model.application, token: localStorage.getItem("user_token") } ).then((rsp)=>{
            ApplicationView.displayMessage(
                "<iron-icon icon='communication:message' style='margin-right: 10px;'></iron-icon><div>Role named " +
                role.getName() +
                " was deleted!</div>",
                3000
              );
              Model.globular.eventHub.publish("refresh_role_evt", {}, true)
              toast.dismiss();
          }).catch(e=>{
            ApplicationView.displayMessage(e, 3000)
            toast.dismiss();
          })
    
        }
    
        noBtn.onclick = () => {
          toast.dismiss();
        }
      }
}

customElements.define('globular-role-panel', RolePanel)