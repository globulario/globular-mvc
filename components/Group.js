
import '@polymer/iron-icons/iron-icons.js';

import { Model } from '../Model';
import { AddGroupMemberAccountRqst, RemoveGroupMemberAccountRqst, CreateGroupRqst, DeleteGroupRqst, Group } from 'globular-web-client/resource/resource_pb';
import { getAllGroups } from 'globular-web-client/api';
import { Application } from '../Application';
import { ApplicationView } from '../ApplicationView';
import { SearchableAccountList } from './List.js'
import { Account } from '../Account';

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
                
                paper-card{
                    background-color: var(--palette-background-paper);
                    color: var(--palette-text-primary);
                }
                
                #create-group-btn{
                    top: -42px;
                    right: 0px;
                    position: absolute;
                 }

                 #container{
                    display: flex;
                    flex-direction: column;
                    position: relative;
                 }

                .card-content {
                    min-width: 680px;
                    padding: 0px;
                    font-size: 1rem;
                 }

                 @media (max-width: 800px) {
                    .card-content{
                      min-width: 580px;
                    }
                  }
          
                  @media (max-width: 600px) {
                    .card-content{
                      min-width: 380px;
                    }
                  }
     
                @media (max-width: 800px) {
                    .card-content{
                      min-width: 580px;
                    }
                  }
          
                  @media (max-width: 600px) {
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
                <paper-icon-button icon="add" id="create-group-btn"></paper-icon-button>
             </div>
             `

        // give the focus to the input.
        let content = this.shadowRoot.querySelector(".card-content")

        // give the focus to the input.
        let container = this.shadowRoot.querySelector("#container")

        let displayGroups = ()=>{
            content.innerHTML = ""
        // Here I will get the list of all groups.
        getAllGroups(Application.globular,
            (groups) => {
                groups.forEach(g => {
                    if (g.getId() != "admin" && g.getId() != "guest") {
                        let panel = new GroupPanel(g)
                        content.appendChild(panel)
                    }
                })
            }, err => { ApplicationView.displayMessage(err, 3000) })
        }
         
        // call once
        displayGroups()

        Model.globular.eventHub.subscribe("refresh_group_evt", uuid=>{}, evt=>{
            displayGroups()
        }, true)

        let createGroupBtn = this.shadowRoot.querySelector("#create-group-btn")
        createGroupBtn.onclick = () => {
            let html = `
            <style>
                paper-card{
                    background-color: var(--palette-background-paper);
                    color: var(--palette-text-primary);
                }
                
                #create-group-panel{
                    position: absolute;
                    right: 0px;
                    top: 0px;
                    z-index: 1;
                    background-color: var(--palette-background-paper);
                }
                #create-group-panel .card-content{
                    min-width: 200px;
                    padding: 0px 10px 0px 10px;
                    display: flex;
                    flex-direction: column;
                }

            </style>
            <paper-card id="create-group-panel">
                <div style="display: flex; align-items: center;">
                    <div style="flex-grow: 1; padding: 5px;">
                        Create Group
                    </div>
                    <paper-icon-button id="cancel-btn" icon="close"></paper-icon-button>
                </div>
                <div class="card-content">
                    <paper-input></paper-input>
                    
                    <paper-button style="align-self: end;">Create</paper-button>
                </div>
            </paper-card>
            `

            let panel = container.querySelector("#create-group-panel")
            let input = null
            if (panel == undefined) {
                container.appendChild(document.createRange().createContextualFragment(html))
                panel = container.querySelector("#create-group-panel")
                let closeBtn = panel.querySelector("#cancel-btn")
                closeBtn.onclick = () => {
                    panel.parentNode.removeChild(panel)
                }

                input = panel.querySelector("paper-input")
                let createGroupButton =  panel.querySelector("paper-button")

                // Create a new group.
                createGroupButton.onclick = ()=>{
                    let groupId = input.value;
                    if(groupId.length == 0){
                        ApplicationView.displayMessage("No group name was given!", 3000)
                        setTimeout(() => {
                            input.focus()
                          }, 100)
                        return
                    }

                    let rqst = new CreateGroupRqst
                    let group = new Group
                    group.setId(groupId)
                    group.setName(groupId)
                    group.setDomain(Model.domain)

                    rqst.setGroup(group)
                    Model.globular.resourceService.createGroup(rqst, { domain: Model.domain,address: Model.address, application: Model.application, token: localStorage.getItem("user_token") })
                    .then(rsp => {
                        ApplicationView.displayMessage("Group " + groupId + "@" + Model.domain + " was created!", 3000)
                        panel.parentNode.removeChild(panel)
                        displayGroups()
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
           
            #container{
                display: flex;
                flex-direction: column;
                align-items: center;
                border-bottom: 1px solid var(--palette-background-default);
                background-color: var(--palette-background-paper);
            }

            #content{
                padding: 15px;
                background-color: var(--palette-background-paper);
                color: var(--palette-text-primary);
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
                font-size: 1.1rem;
            }
            
            img, iron-icon{
                margin: 8px;
            }
  
            #collapse-panel{
                display: flex;
                flex-direction: column;
                width: 100%;
            }
        </style>
        <div id="container">
            <div class="header">
                <paper-icon-button id="delete-group-btn" icon="delete"></paper-icon-button>
                <span class="title">${this.group.getName()  + "@" + this.group.getDomain()}</span>
                <div style="display: flex; width: 32px; height: 32px; justify-content: center; align-items: center;position: relative;">
                    <iron-icon  id="hide-btn"  icon="unfold-less" style="flex-grow: 1; --iron-icon-fill-color:var(--palette-text-primary);" icon="add"></iron-icon>
                    <paper-ripple class="circle" recenters=""></paper-ripple>
                </div>
            </div>
            <iron-collapse id="collapse-panel"  >

            </iron-collapse>
        </div>
        `

        let content = this.shadowRoot.querySelector("#collapse-panel")
        this.hideBtn = this.shadowRoot.querySelector("#hide-btn")

        let deleteBtn = this.shadowRoot.querySelector("#delete-group-btn")
        deleteBtn.onclick = ()=>{
            this.onDeleteGroup(group)
        }

        // Now the account list.
        Account.getAccounts("{}",
            accounts => {

                // I will get the account object whit the given id.
                let list = []
                this.group.getMembersList().forEach(accountId => {
                    let a_ = accounts.find(a => a.getId() + "@" + a.getDomain() === accountId);
                    if (a_ != undefined) {
                        list.push(a_)
                    }
                })

                let accountsList = new SearchableAccountList("Accounts", list, a => {
                    accountsList.removeItem(a)
                    let rqst = new RemoveGroupMemberAccountRqst
                    rqst.setGroupid(group.getId() + "@" + group.getDomain())
                    rqst.setAccountid(a.getId() + "@" + a.getDomain())
                    Model.globular.resourceService.removeGroupMemberAccount(rqst, { domain: Model.domain, address: Model.address, application: Model.application, token: localStorage.getItem("user_token") })
                        .then(rsp => {
                            accountsList.removeItem(a)
                            ApplicationView.displayMessage("Account " + a.getId() + "@" + a.getDomain() + " was removed from group " + group.getId() + "@" + group.getDomain(), 3000)
                        }).catch(err => {
                            accountsList.appendItem(a) // set it back
                            ApplicationView.displayMessage(err, 3000)
                        })
                },
                    a => {
                        let rqst = new AddGroupMemberAccountRqst
                        rqst.setGroupid(group.getId() + "@" + group.getDomain())
                        rqst.setAccountid(a.getId() + "@" + a.getDomain())
                        Model.globular.resourceService.addGroupMemberAccount(rqst, { domain: Model.domain, address: Model.address, application: Model.application, token: localStorage.getItem("user_token") })
                            .then(rsp => {
                                accountsList.appendItem(a)
                                ApplicationView.displayMessage("Account " + a.getId() + "@" + a.getDomain() + " has now group " + group.getId() + "@" + group.getDomain(), 3000)
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

    onDeleteGroup(group) {
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
    
          </style>
          <div id="yes-no-contact-delete-box">
            <div>Your about to delete the group ${group.getName()  + "@" + group.getDomain()}</div>
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

          let rqst = new DeleteGroupRqst
          rqst.setGroup(group.getId() + "@" + group.getDomain())
          Model.globular.resourceService.deleteGroup(rqst, { domain: Model.domain, address: Model.address, application: Model.application, token: localStorage.getItem("user_token") } ).then((rsp)=>{
            ApplicationView.displayMessage(
                "<iron-icon icon='communication:message' style='margin-right: 10px;'></iron-icon><div>Group named " +
                group.getName() +
                " was deleted!</div>",
                3000
              );
              Model.globular.eventHub.publish("refresh_group_evt", {}, true)
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

customElements.define('globular-group-panel', GroupPanel)